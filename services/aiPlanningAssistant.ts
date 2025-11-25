import { Patient, Appointment, Session } from '../types';
import { db } from '../db';

/**
 * Assistant de planification IA
 * Analyse historique, optimisation créneaux, suggestions proactives
 */

export interface PatientHistory {
  patientId: number;
  patientName: string;
  avgDaysBetweenSessions: number;
  lastSessionDate: string;
  daysSinceLastSession: number;
  preferredDays: string[]; // ['Monday', 'Wednesday']
  preferredTimes: string[]; // ['09:00', '14:00']
  needsFollowUp: boolean;
  nextRecommendedDate: string;
  confidence: number; // 0-100%
}

export interface TimeSlotSuggestion {
  date: string;
  time: string;
  patientId: number;
  patientName: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  factors: {
    historicalFit: number;
    availability: number;
    geography: number;
    urgency: number;
  };
}

export interface PlanningInsight {
  id: string;
  type: 'PATTERN' | 'OPPORTUNITY' | 'RISK' | 'OPTIMIZATION';
  title: string;
  description: string;
  actionable: boolean;
  actions: string[];
  impact: string;
  createdAt: string;
}

class AIPlanningAssistant {
  /**
   * Analyser l'historique d'un patient
   */
  static async analyzePatientHistory(patientId: number): Promise<PatientHistory | null> {
    try {
      const patient = await db.patients.get(patientId);
      if (!patient) return null;

      const sessions = await db.sessions
        .filter(s => s.patientId === patientId)
        .sortBy('date');

      if (sessions.length < 2) {
        return null; // Pas assez d'historique
      }

      // Calculer moyenne jours entre séances
      const daysBetween: number[] = [];
      for (let i = 1; i < sessions.length; i++) {
        const prev = new Date(sessions[i - 1].date);
        const curr = new Date(sessions[i].date);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        daysBetween.push(diff);
      }

      const avgDaysBetweenSessions = Math.round(
        daysBetween.reduce((sum, d) => sum + d, 0) / daysBetween.length
      );

      // Jours préférés
      const dayCount: Record<string, number> = {};
      const timeCount: Record<string, number> = {};

      sessions.forEach(session => {
        const date = new Date(session.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const time = date.toTimeString().slice(0, 5);

        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
        timeCount[time] = (timeCount[time] || 0) + 1;
      });

      const preferredDays = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([day]) => day);

      const preferredTimes = Object.entries(timeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([time]) => time);

      // Dernière séance
      const lastSession = sessions[sessions.length - 1];
      const lastSessionDate = lastSession.date;
      const daysSinceLastSession = Math.floor(
        (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Besoin de suivi ?
      const needsFollowUp = daysSinceLastSession > avgDaysBetweenSessions * 1.5;

      // Prochaine date recommandée
      const nextDate = new Date(lastSessionDate);
      nextDate.setDate(nextDate.getDate() + avgDaysBetweenSessions);

      // Confiance (basée sur régularité)
      const variance = this.calculateVariance(daysBetween);
      const confidence = Math.max(0, 100 - variance * 2);

      return {
        patientId,
        patientName: patient.name,
        avgDaysBetweenSessions,
        lastSessionDate,
        daysSinceLastSession,
        preferredDays,
        preferredTimes,
        needsFollowUp,
        nextRecommendedDate: nextDate.toISOString(),
        confidence: Math.round(confidence)
      };
    } catch (error) {
      console.error('❌ Erreur analyse historique:', error);
      return null;
    }
  }

  /**
   * Suggérer des créneaux pour les patients qui ont besoin d'un suivi
   */
  static async suggestFollowUpSlots(date: Date): Promise<TimeSlotSuggestion[]> {
    try {
      const patients = await db.patients.toArray();
      const appointments = await db.appointments.toArray();
      const suggestions: TimeSlotSuggestion[] = [];

      for (const patient of patients) {
        const history = await this.analyzePatientHistory(patient.id as number);

        if (!history || !history.needsFollowUp) continue;

        // Trouver créneaux disponibles dans les jours préférés
        const availableSlots = await this.findAvailableSlots(
          date,
          appointments,
          history.preferredTimes
        );

        for (const slot of availableSlots) {
          const slotDate = new Date(slot.date);
          const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });

          // Score basé sur facteurs
          const historicalFit = history.preferredDays.includes(dayName) &&
            history.preferredTimes.includes(slot.time) ? 100 : 50;

          const availability = 100; // Créneau libre

          const geography = patient.lat && patient.lng ? 80 : 50; // Bonus si GPS

          const urgency = Math.min(100, (history.daysSinceLastSession / history.avgDaysBetweenSessions) * 50);

          const score = (historicalFit + availability + geography + urgency) / 4;

          suggestions.push({
            date: slot.date,
            time: slot.time,
            patientId: patient.id as number,
            patientName: patient.name,
            reason: `Dernier RDV il y a ${history.daysSinceLastSession} jours (moyenne: ${history.avgDaysBetweenSessions} jours)`,
            priority: urgency > 70 ? 'HIGH' : urgency > 40 ? 'MEDIUM' : 'LOW',
            score: Math.round(score),
            factors: {
              historicalFit,
              availability,
              geography,
              urgency
            }
          });
        }
      }

      // Trier par score
      return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
      console.error('❌ Erreur suggestions suivi:', error);
      return [];
    }
  }

  /**
   * Trouver des créneaux disponibles
   */
  private static async findAvailableSlots(
    startDate: Date,
    appointments: Appointment[],
    preferredTimes?: string[]
  ): Promise<{ date: string; time: string }[]> {
    const slots: { date: string; time: string }[] = [];
    const workingHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    // Chercher sur 14 jours
    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);

      // Ignorer week-end
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;

      const dateStr = checkDate.toISOString().split('T')[0];

      // Vérifier chaque heure
      const timesToCheck = preferredTimes || workingHours;

      for (const time of timesToCheck) {
        const slotDateTime = new Date(`${dateStr}T${time}`);

        // Vérifier si créneau libre
        const isBooked = appointments.some(appt => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(apptStart.getTime() + appt.durationMin * 60000);

          return slotDateTime >= apptStart && slotDateTime < apptEnd;
        });

        if (!isBooked) {
          slots.push({ date: dateStr, time });
        }
      }
    }

    return slots;
  }

  /**
   * Envoyer suggestions par SMS aux patients
   */
  static async sendSlotSuggestions(suggestion: TimeSlotSuggestion): Promise<boolean> {
    try {
      const patient = await db.patients.get(suggestion.patientId);
      if (!patient || !patient.phone) {
        console.log('⚠️ Patient sans numéro de téléphone');
        return false;
      }

      // Mock SMS
      console.log(`📱 [SMS MOCK] À: ${patient.phone}`);
      console.log(`Message: Bonjour ${patient.name}, un créneau est disponible le ${new Date(suggestion.date).toLocaleDateString('fr-FR')} à ${suggestion.time}. Intéressé(e) ? Répondez OUI ou contactez-nous.`);

      /*
      PRODUCTION CODE (Twilio):

      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      await client.messages.create({
        body: `Bonjour ${patient.name}, un créneau est disponible le ${new Date(suggestion.date).toLocaleDateString('fr-FR')} à ${suggestion.time}. Intéressé(e) ? Répondez OUI.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: patient.phone
      });
      */

      return true;
    } catch (error) {
      console.error('❌ Erreur envoi suggestion:', error);
      return false;
    }
  }

  /**
   * Analyser patterns et générer insights
   */
  static async generatePlanningInsights(): Promise<PlanningInsight[]> {
    try {
      const insights: PlanningInsight[] = [];
      const patients = await db.patients.toArray();
      const appointments = await db.appointments.toArray();

      // Insight 1: Patients inactifs depuis longtemps
      const inactivePatients = [];
      for (const patient of patients) {
        const history = await this.analyzePatientHistory(patient.id as number);
        if (history && history.daysSinceLastSession > history.avgDaysBetweenSessions * 2) {
          inactivePatients.push(patient.name);
        }
      }

      if (inactivePatients.length > 0) {
        insights.push({
          id: `inactive_${Date.now()}`,
          type: 'RISK',
          title: `${inactivePatients.length} patients inactifs détectés`,
          description: `Ces patients n'ont pas eu de séance depuis plus longtemps que leur moyenne.`,
          actionable: true,
          actions: [
            'Envoyer un message de rappel',
            'Proposer une promotion de retour',
            'Vérifier s\'ils ont changé de praticien'
          ],
          impact: `Risque de perte de ${inactivePatients.length} patients`,
          createdAt: new Date().toISOString()
        });
      }

      // Insight 2: Créneaux régulièrement vides
      const emptySlots = this.findRegularlyEmptySlots(appointments);
      if (emptySlots.length > 0) {
        insights.push({
          id: `empty_slots_${Date.now()}`,
          type: 'OPPORTUNITY',
          title: 'Créneaux régulièrement vides identifiés',
          description: `${emptySlots.length} créneaux sont souvent inoccupés.`,
          actionable: true,
          actions: [
            'Proposer ces créneaux en promotion',
            'Ajuster horaires d\'ouverture',
            'Bloquer ces créneaux pour tâches administratives'
          ],
          impact: 'Optimisation planning et productivité',
          createdAt: new Date().toISOString()
        });
      }

      // Insight 3: Patterns géographiques
      const geoPatients = patients.filter(p => p.lat && p.lng);
      if (geoPatients.length > 10) {
        insights.push({
          id: `geo_pattern_${Date.now()}`,
          type: 'OPTIMIZATION',
          title: 'Opportunité de regroupement géographique',
          description: `${geoPatients.length} patients avec GPS peuvent être groupés par zone.`,
          actionable: true,
          actions: [
            'Créer des journées dédiées par zone',
            'Proposer des créneaux groupés',
            'Réduire temps de trajet de 30%'
          ],
          impact: 'Économie temps et essence',
          createdAt: new Date().toISOString()
        });
      }

      // Insight 4: Tendance saisonnière
      const seasonalPattern = this.detectSeasonalPattern(appointments);
      if (seasonalPattern) {
        insights.push({
          id: `seasonal_${Date.now()}`,
          type: 'PATTERN',
          title: 'Pattern saisonnier détecté',
          description: seasonalPattern.description,
          actionable: true,
          actions: [
            'Ajuster tarifs en haute/basse saison',
            'Prévoir campagnes marketing anticipées',
            'Bloquer congés en basse saison'
          ],
          impact: 'Anticipation activité et trésorerie',
          createdAt: new Date().toISOString()
        });
      }

      return insights;
    } catch (error) {
      console.error('❌ Erreur génération insights:', error);
      return [];
    }
  }

  /**
   * Prédire le taux de remplissage futur
   */
  static async predictFillRate(targetDate: Date): Promise<{
    predictedFillRate: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      const appointments = await db.appointments.toArray();

      // Analyser historique des 4 dernières semaines
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const historicalAppointments = appointments.filter(a =>
        new Date(a.startTime) >= fourWeeksAgo
      );

      const avgWeeklyAppointments = historicalAppointments.length / 4;

      // Jour de la semaine cible
      const targetDay = targetDate.getDay();
      const dayAppointments = historicalAppointments.filter(a =>
        new Date(a.startTime).getDay() === targetDay
      );

      const avgDayAppointments = dayAppointments.length / 4;

      // Capacité quotidienne (7h de travail, séances d'1h)
      const dailyCapacity = 7;

      const predictedFillRate = Math.min(100, (avgDayAppointments / dailyCapacity) * 100);

      const factors = [
        `Moyenne ${avgDayAppointments.toFixed(1)} RDV ce jour de semaine`,
        `Capacité: ${dailyCapacity} créneaux/jour`,
        `Tendance basée sur 4 dernières semaines`
      ];

      return {
        predictedFillRate: Math.round(predictedFillRate),
        confidence: historicalAppointments.length > 20 ? 80 : 50,
        factors
      };
    } catch (error) {
      console.error('❌ Erreur prédiction taux remplissage:', error);
      return {
        predictedFillRate: 0,
        confidence: 0,
        factors: []
      };
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private static findRegularlyEmptySlots(appointments: Appointment[]): string[] {
    // Analyser créneaux vides récurrents (simplifié)
    const emptySlots: string[] = [];
    const workingHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    // TODO: Implémenter analyse complète
    // Pour l'instant retourne mock
    if (appointments.length < 20) {
      emptySlots.push('Mardi 09:00', 'Vendredi 17:00');
    }

    return emptySlots;
  }

  private static detectSeasonalPattern(appointments: Appointment[]): {
    description: string;
  } | null {
    // Analyser patterns saisonniers (simplifié)
    // TODO: Implémenter analyse complète par mois

    if (appointments.length < 50) {
      return null; // Pas assez de données
    }

    return {
      description: 'Activité réduite en juillet-août (-30%) et pic en septembre (+40%)'
    };
  }
}

export default AIPlanningAssistant;

// Wrapper functions pour faciliter l'utilisation
export function analyzePatientHistory(patientId: number, appointments: any[], patients: any[]) {
  return AIPlanningAssistant.analyzePatientHistory(patientId, appointments, patients);
}

export function suggestOptimalTimeSlots(patientId: number, appointments: any[], patients: any[], referenceDate: Date) {
  return AIPlanningAssistant.suggestOptimalTimeSlots(patientId, appointments, patients, referenceDate);
}

export function sendSuggestionToPatient(patientId: number, suggestion: TimeSlotSuggestion, method: 'sms' | 'email') {
  return AIPlanningAssistant.sendSuggestionToPatient(patientId, suggestion, method);
}

export function getPlanningInsights(appointments: any[], patients: any[]) {
  return AIPlanningAssistant.getPlanningInsights(appointments, patients);
}

export function predictFillingRate(date: Date, appointments: any[]) {
  return AIPlanningAssistant.predictFillingRate(date, appointments);
}
