/**
 * Service de Planning & Agenda Intelligent
 *
 * Fonctionnalités:
 * - Suggestions créneaux optimales par IA
 * - Gestion absences et congés
 * - Report automatique RDV
 * - Recall intelligent (prochain RDV selon fréquence)
 * - Surbooking contrôlé
 * - Sync Google Calendar bidirectionnelle
 * - Export iCal / Outlook
 * - URL publique disponibilités temps réel
 */

import { Appointment, Patient } from '../types';

// Types
export interface Absence {
  id: string;
  type: 'vacation' | 'sick' | 'training' | 'personal' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
  autoReschedule: boolean;
  rescheduled: boolean;
  affectedAppointments: string[]; // IDs des RDV à déplacer
}

export interface TimeSlotSuggestion {
  date: Date;
  timeSlot: string; // "09:00"
  score: number; // 0-100
  reasons: string[];
  patientPreference: boolean;
  practitionerAvailability: boolean;
  historicalSuccess: boolean;
}

export interface RecallSuggestion {
  patientId: string;
  patientName: string;
  lastAppointment: Date;
  averageFrequency: number; // En jours
  recommendedDate: Date;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface OverbookingRule {
  enabled: boolean;
  maxPercentage: number; // Ex: 10% = 1 RDV supplémentaire sur 10
  applyOnDays: number[]; // 0=Dimanche, 1=Lundi, etc.
  buffer: number; // Minutes de buffer entre RDV
}

export interface GoogleCalendarConfig {
  enabled: boolean;
  clientId: string;
  clientSecret?: string;
  calendarId: string;
  syncDirection: 'one_way' | 'two_way'; // one_way = TheraFlow -> Google, two_way = bidirectionnel
  accessToken?: string;
  refreshToken?: string;
  lastSync?: Date;
}

export interface WorkingHours {
  dayOfWeek: number; // 0=Dimanche, 1=Lundi, etc.
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  breaks: {
    startTime: string;
    endTime: string;
  }[];
}

export interface PublicBookingConfig {
  enabled: boolean;
  publicUrl: string; // URL unique pour réservation
  allowedDays: number; // Nombre de jours à l'avance
  requireApproval: boolean;
  depositRequired: boolean;
  depositPercentage: number;
  availableDuration: number[]; // Durées proposées en minutes
  customMessage?: string;
}

class SmartSchedulingService {
  private absences: Absence[] = [];
  private overbookingRule: OverbookingRule;
  private googleCalendarConfig: GoogleCalendarConfig | null = null;
  private workingHours: WorkingHours[];
  private publicBookingConfig: PublicBookingConfig;

  constructor() {
    // Configuration par défaut
    this.overbookingRule = {
      enabled: false,
      maxPercentage: 10,
      applyOnDays: [1, 2, 3, 4, 5], // Lundi à vendredi
      buffer: 15
    };

    // Horaires par défaut (Lundi à Vendredi, 9h-18h)
    this.workingHours = [
      { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '18:00', breaks: [] }, // Dimanche
      { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '12:00', endTime: '14:00' }] }, // Lundi
      { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '12:00', endTime: '14:00' }] },
      { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '12:00', endTime: '14:00' }] },
      { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '12:00', endTime: '14:00' }] },
      { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '12:00', endTime: '14:00' }] },
      { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '13:00', breaks: [] } // Samedi
    ];

    this.publicBookingConfig = {
      enabled: false,
      publicUrl: `booking-${Math.random().toString(36).substr(2, 9)}`,
      allowedDays: 30,
      requireApproval: true,
      depositRequired: false,
      depositPercentage: 30,
      availableDuration: [30, 45, 60],
      customMessage: 'Réservez votre rendez-vous en ligne'
    };

    this.loadData();
  }

  /**
   * Gestion des absences
   */

  createAbsence(data: Omit<Absence, 'id' | 'rescheduled' | 'affectedAppointments'>): Absence {
    const absence: Absence = {
      ...data,
      id: `abs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rescheduled: false,
      affectedAppointments: []
    };

    this.absences.push(absence);
    this.saveData();
    return absence;
  }

  getAbsences(filters?: {
    type?: Absence['type'];
    fromDate?: Date;
    toDate?: Date;
  }): Absence[] {
    let result = [...this.absences];

    if (filters) {
      if (filters.type) {
        result = result.filter(abs => abs.type === filters.type);
      }
      if (filters.fromDate) {
        result = result.filter(abs => new Date(abs.endDate) >= filters.fromDate!);
      }
      if (filters.toDate) {
        result = result.filter(abs => new Date(abs.startDate) <= filters.toDate!);
      }
    }

    return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startTime).getTime());
  }

  isAbsent(date: Date): boolean {
    return this.absences.some(abs => {
      const startDate = new Date(abs.startDate);
      const endDate = new Date(abs.endDate);
      return date >= startDate && date <= endDate;
    });
  }

  /**
   * Report automatique de RDV lors d'absence
   */

  async rescheduleAppointmentsForAbsence(
    absenceId: string,
    appointments: Appointment[],
    patients: Patient[]
  ): Promise<{ success: number; failed: number; suggestions: Map<string, TimeSlotSuggestion[]> }> {
    const absence = this.absences.find(abs => abs.id === absenceId);
    if (!absence || absence.rescheduled) {
      return { success: 0, failed: 0, suggestions: new Map() };
    }

    const affectedAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= new Date(absence.startDate) && aptDate <= new Date(absence.endDate);
    });

    let success = 0;
    let failed = 0;
    const suggestions = new Map<string, TimeSlotSuggestion[]>();

    for (const apt of affectedAppointments) {
      const patient = patients.find(p => p.id === apt.patientId);
      if (!patient) {
        failed++;
        continue;
      }

      // Trouver des créneaux alternatifs
      const alternativeSlots = await this.suggestOptimalTimeSlots(
        apt.patientId,
        appointments,
        patients,
        new Date(absence.endDate),
        5 // 5 suggestions
      );

      if (alternativeSlots.length > 0) {
        suggestions.set(apt.id, alternativeSlots);
        absence.affectedAppointments.push(apt.id);
        success++;
      } else {
        failed++;
      }
    }

    absence.rescheduled = true;
    this.saveData();

    return { success, failed, suggestions };
  }

  /**
   * Suggestions de créneaux optimaux (IA)
   */

  async suggestOptimalTimeSlots(
    patientId: string,
    appointments: Appointment[],
    patients: Patient[],
    afterDate: Date = new Date(),
    count: number = 5
  ): Promise<TimeSlotSuggestion[]> {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return [];

    const patientHistory = appointments
      .filter(apt => apt.patientId === patientId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Analyser préférences patient
    const preferredDays = this.analyzePreferredDays(patientHistory);
    const preferredTimes = this.analyzePreferredTimes(patientHistory);

    const suggestions: TimeSlotSuggestion[] = [];
    const searchDate = new Date(afterDate);

    // Chercher sur les 30 prochains jours
    for (let i = 0; i < 30 && suggestions.length < count; i++) {
      searchDate.setDate(searchDate.getDate() + 1);

      const dayOfWeek = searchDate.getDay();
      const workingHour = this.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

      if (!workingHour || !workingHour.enabled) continue;
      if (this.isAbsent(searchDate)) continue;

      // Générer créneaux de 30 min
      const slots = this.generateTimeSlots(workingHour);

      for (const slot of slots) {
        const slotDate = new Date(searchDate);
        const [hours, minutes] = slot.split(':').map(Number);
        slotDate.setHours(hours, minutes, 0, 0);

        // Vérifier disponibilité
        const isAvailable = !this.isSlotOccupied(slotDate, appointments);
        if (!isAvailable) continue;

        // Calculer score
        let score = 50; // Score de base
        const reasons: string[] = [];

        // Préférence jour
        if (preferredDays.includes(dayOfWeek)) {
          score += 20;
          reasons.push('Jour habituel du patient');
        }

        // Préférence horaire
        const hourPreference = preferredTimes.find(pt =>
          Math.abs(pt.hour - hours) < 1
        );
        if (hourPreference) {
          score += 15;
          reasons.push('Horaire habituel du patient');
        }

        // Distance au dernier RDV
        if (patientHistory.length > 0) {
          const lastApt = patientHistory[patientHistory.length - 1];
          const daysSinceLast = (slotDate.getTime() - new Date(lastApt.startTime).getTime()) / (1000 * 60 * 60 * 24);
          const avgFrequency = this.calculateAverageFrequency(patientHistory);

          if (Math.abs(daysSinceLast - avgFrequency) < 7) {
            score += 15;
            reasons.push('Respecte la fréquence habituelle');
          }
        }

        if (reasons.length === 0) {
          reasons.push('Créneau disponible');
        }

        suggestions.push({
          date: slotDate,
          timeSlot: slot,
          score,
          reasons,
          patientPreference: preferredDays.includes(dayOfWeek) || !!hourPreference,
          practitionerAvailability: true,
          historicalSuccess: patientHistory.length > 2
        });
      }
    }

    // Trier par score décroissant
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private analyzePreferredDays(appointments: Appointment[]): number[] {
    const dayCounts: Record<number, number> = {};

    for (const apt of appointments) {
      const day = new Date(apt.startTime).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    // Retourner les jours avec plus de 30% des RDV
    const total = appointments.length;
    return Object.entries(dayCounts)
      .filter(([, count]) => count / total > 0.3)
      .map(([day]) => parseInt(day));
  }

  private analyzePreferredTimes(appointments: Appointment[]): { hour: number; count: number }[] {
    const hourCounts: Record<number, number> = {};

    for (const apt of appointments) {
      const hour = new Date(apt.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .filter(({ count }) => count >= 2)
      .sort((a, b) => b.count - a.count);
  }

  private calculateAverageFrequency(appointments: Appointment[]): number {
    if (appointments.length < 2) return 30; // Par défaut 30 jours

    const intervals: number[] = [];
    for (let i = 1; i < appointments.length; i++) {
      const prev = new Date(appointments[i - 1].startTime);
      const curr = new Date(appointments[i].startTime);
      const days = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    return Math.round(intervals.reduce((sum, val) => sum + val, 0) / intervals.length);
  }

  private generateTimeSlots(workingHour: WorkingHours): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = workingHour.startTime.split(':').map(Number);
    const [endHour, endMin] = workingHour.endTime.split(':').map(Number);

    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (current < end) {
      const hour = Math.floor(current / 60);
      const min = current % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      // Vérifier si dans une pause
      const inBreak = workingHour.breaks.some(br => {
        const [breakStartHour, breakStartMin] = br.startTime.split(':').map(Number);
        const [breakEndHour, breakEndMin] = br.endTime.split(':').map(Number);
        const breakStart = breakStartHour * 60 + breakStartMin;
        const breakEnd = breakEndHour * 60 + breakEndMin;
        return current >= breakStart && current < breakEnd;
      });

      if (!inBreak) {
        slots.push(timeStr);
      }

      current += 30; // Créneaux de 30 min
    }

    return slots;
  }

  private isSlotOccupied(date: Date, appointments: Appointment[]): boolean {
    return appointments.some(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(aptStart.getTime() + (apt.durationMin * 60 * 1000));
      const slotEnd = new Date(date.getTime() + (30 * 60 * 1000)); // Slot de 30min

      return (date < aptEnd && slotEnd > aptStart);
    });
  }

  /**
   * Recall intelligent (relance pour prochain RDV)
   */

  findPatientsForRecall(
    appointments: Appointment[],
    patients: Patient[],
    options: {
      minDaysSinceLastApt: number;
      maxDaysSinceLastApt: number;
    } = { minDaysSinceLastApt: 30, maxDaysSinceLastApt: 90 }
  ): RecallSuggestion[] {
    const now = new Date();
    const suggestions: RecallSuggestion[] = [];

    for (const patient of patients) {
      const patientAppointments = appointments
        .filter(apt => apt.patientId === patient.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      if (patientAppointments.length === 0) continue;

      const lastApt = patientAppointments[0];
      const daysSince = (now.getTime() - new Date(lastApt.startTime).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < options.minDaysSinceLastApt || daysSince > options.maxDaysSinceLastApt) {
        continue;
      }

      const avgFrequency = this.calculateAverageFrequency(patientAppointments);
      const recommendedDate = new Date(new Date(lastApt.startTime).getTime() + (avgFrequency * 24 * 60 * 60 * 1000));

      let priority: RecallSuggestion['priority'] = 'medium';
      let reason = `Dernier RDV il y a ${Math.round(daysSince)} jours`;

      if (daysSince > avgFrequency * 1.5) {
        priority = 'high';
        reason += ' (en retard sur la fréquence habituelle)';
      } else if (daysSince > avgFrequency * 1.2) {
        priority = 'medium';
        reason += ' (bientôt temps pour un suivi)';
      } else {
        priority = 'low';
      }

      suggestions.push({
        patientId: patient.id,
        patientName: patient.name,
        lastAppointment: new Date(lastApt.startTime),
        averageFrequency: avgFrequency,
        recommendedDate,
        priority,
        reason
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Surbooking contrôlé
   */

  setOverbookingRule(rule: Partial<OverbookingRule>): void {
    this.overbookingRule = { ...this.overbookingRule, ...rule };
    this.saveData();
  }

  getOverbookingRule(): OverbookingRule {
    return this.overbookingRule;
  }

  canAllowOverbooking(date: Date, appointments: Appointment[]): boolean {
    if (!this.overbookingRule.enabled) return false;

    const dayOfWeek = date.getDay();
    if (!this.overbookingRule.applyOnDays.includes(dayOfWeek)) return false;

    // Compter RDV ce jour
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });

    const workingHour = this.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!workingHour || !workingHour.enabled) return false;

    const maxSlots = this.generateTimeSlots(workingHour).length;
    const allowedOverbooking = Math.ceil(maxSlots * (this.overbookingRule.maxPercentage / 100));

    return dayAppointments.length < (maxSlots + allowedOverbooking);
  }

  /**
   * Sync Google Calendar
   */

  configureGoogleCalendar(config: Partial<GoogleCalendarConfig>): void {
    this.googleCalendarConfig = { ...this.googleCalendarConfig, ...config } as GoogleCalendarConfig;
    this.saveData();
  }

  getGoogleCalendarConfig(): GoogleCalendarConfig | null {
    return this.googleCalendarConfig;
  }

  async syncWithGoogleCalendar(appointments: Appointment[]): Promise<{ synced: number; errors: number }> {
    if (!this.googleCalendarConfig || !this.googleCalendarConfig.enabled) {
      throw new Error('Google Calendar non configuré');
    }

    // En production, utiliser l'API Google Calendar
    console.log('Sync Google Calendar:', {
      calendarId: this.googleCalendarConfig.calendarId,
      direction: this.googleCalendarConfig.syncDirection,
      appointments: appointments.length
    });

    // Simuler sync
    return { synced: appointments.length, errors: 0 };
  }

  /**
   * Export iCal / Outlook
   */

  exportToICalendar(appointments: Appointment[], patients: Patient[]): string {
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//TheraFlow//Calendar//FR\n';
    ical += 'CALSCALE:GREGORIAN\n';

    for (const apt of appointments) {
      const patient = patients.find(p => p.id === apt.patientId);
      const start = new Date(apt.startTime);
      const end = new Date(start.getTime() + (apt.durationMin * 60 * 1000));

      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${apt.id}@theraflow.app\n`;
      ical += `DTSTAMP:${this.formatICalDate(new Date())}\n`;
      ical += `DTSTART:${this.formatICalDate(start)}\n`;
      ical += `DTEND:${this.formatICalDate(end)}\n`;
      ical += `SUMMARY:RDV - ${patient?.name || 'Patient'}\n`;
      if (apt.location) {
        ical += `LOCATION:${apt.location}\n`;
      }
      if (apt.notes) {
        ical += `DESCRIPTION:${apt.notes.replace(/\n/g, '\\n')}\n`;
      }
      ical += 'STATUS:CONFIRMED\n';
      ical += 'END:VEVENT\n';
    }

    ical += 'END:VCALENDAR\n';
    return ical;
  }

  private formatICalDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  /**
   * Réservation en ligne publique
   */

  configurePublicBooking(config: Partial<PublicBookingConfig>): void {
    this.publicBookingConfig = { ...this.publicBookingConfig, ...config };
    this.saveData();
  }

  getPublicBookingConfig(): PublicBookingConfig {
    return this.publicBookingConfig;
  }

  getPublicBookingUrl(): string {
    return `${window.location.origin}/book/${this.publicBookingConfig.publicUrl}`;
  }

  getAvailableSlots(fromDate: Date, toDate: Date, appointments: Appointment[]): Date[] {
    const slots: Date[] = [];
    const current = new Date(fromDate);

    while (current <= toDate) {
      const dayOfWeek = current.getDay();
      const workingHour = this.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

      if (workingHour && workingHour.enabled && !this.isAbsent(current)) {
        const timeSlots = this.generateTimeSlots(workingHour);

        for (const timeSlot of timeSlots) {
          const [hours, minutes] = timeSlot.split(':').map(Number);
          const slotDate = new Date(current);
          slotDate.setHours(hours, minutes, 0, 0);

          if (!this.isSlotOccupied(slotDate, appointments)) {
            slots.push(new Date(slotDate));
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Horaires de travail
   */

  setWorkingHours(workingHours: WorkingHours[]): void {
    this.workingHours = workingHours;
    this.saveData();
  }

  getWorkingHours(): WorkingHours[] {
    return this.workingHours;
  }

  /**
   * Persistence
   */

  private loadData(): void {
    try {
      const saved = localStorage.getItem('theraflow_smart_scheduling');
      if (saved) {
        const data = JSON.parse(saved);
        this.absences = (data.absences || []).map((abs: any) => ({
          ...abs,
          startDate: new Date(abs.startDate),
          endDate: new Date(abs.endDate)
        }));
        this.overbookingRule = data.overbookingRule || this.overbookingRule;
        this.googleCalendarConfig = data.googleCalendarConfig || null;
        this.workingHours = data.workingHours || this.workingHours;
        this.publicBookingConfig = data.publicBookingConfig || this.publicBookingConfig;
      }
    } catch (error) {
      console.error('Erreur chargement smart scheduling:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        absences: this.absences,
        overbookingRule: this.overbookingRule,
        googleCalendarConfig: this.googleCalendarConfig,
        workingHours: this.workingHours,
        publicBookingConfig: this.publicBookingConfig
      };
      localStorage.setItem('theraflow_smart_scheduling', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde smart scheduling:', error);
    }
  }
}

// Export singleton
const smartSchedulingServiceInstance = new SmartSchedulingService();
export default smartSchedulingServiceInstance;

// Fonctions helper
export function suggestTimeSlots(
  patientId: string,
  appointments: Appointment[],
  patients: Patient[],
  afterDate?: Date,
  count?: number
): Promise<TimeSlotSuggestion[]> {
  return smartSchedulingServiceInstance.suggestOptimalTimeSlots(patientId, appointments, patients, afterDate, count);
}

export function findRecallPatients(
  appointments: Appointment[],
  patients: Patient[],
  options?: { minDaysSinceLastApt: number; maxDaysSinceLastApt: number }
): RecallSuggestion[] {
  return smartSchedulingServiceInstance.findPatientsForRecall(appointments, patients, options);
}

export function exportICalendar(appointments: Appointment[], patients: Patient[]): string {
  return smartSchedulingServiceInstance.exportToICalendar(appointments, patients);
}

export function getPublicBookingUrl(): string {
  return smartSchedulingServiceInstance.getPublicBookingUrl();
}
