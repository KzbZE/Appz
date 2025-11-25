/**
 * Service d'Automatisation & Communication
 *
 * Fonctionnalités:
 * - Rappels automatiques Email/SMS 24h avant RDV
 * - Follow-up post-séance
 * - Relance patients inactifs
 * - Campagnes marketing
 */

import { Appointment, Patient } from '../types';

// Types
export interface ReminderConfig {
  enabled: boolean;
  hoursBeforeAppointment: number; // Par défaut 24h
  channels: ('email' | 'sms' | 'push' | 'whatsapp')[];
  includeConfirmationButton: boolean;
  includeCancellationButton: boolean;
  customMessage?: string;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  apiKey?: string;
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface SMSConfig {
  provider: 'twilio' | 'vonage' | 'messagebird';
  apiKey: string;
  apiSecret?: string;
  senderNumber: string;
  accountSid?: string; // Pour Twilio
}

export interface AutomationRule {
  id: string;
  name: string;
  type: 'reminder' | 'followup' | 'recall' | 'marketing';
  enabled: boolean;
  trigger: {
    condition: string;
    timeOffset?: number; // En heures
  };
  action: {
    channel: 'email' | 'sms' | 'push' | 'whatsapp';
    template: string;
  };
  filters?: {
    patientType?: string[];
    minAge?: number;
    maxAge?: number;
    tags?: string[];
  };
}

export interface ReminderJob {
  id: string;
  appointmentId: string;
  patientId: string;
  scheduledFor: Date;
  channels: string[];
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  failureReason?: string;
  confirmationReceived?: boolean;
  confirmationReceivedAt?: Date;
}

class AutomationService {
  private reminderConfig: ReminderConfig;
  private emailConfig: EmailConfig | null = null;
  private smsConfig: SMSConfig | null = null;
  private automationRules: AutomationRule[] = [];
  private reminderJobs: ReminderJob[] = [];

  constructor() {
    // Configuration par défaut
    this.reminderConfig = {
      enabled: true,
      hoursBeforeAppointment: 24,
      channels: ['email', 'sms'],
      includeConfirmationButton: true,
      includeCancellationButton: true
    };

    // Charger la config depuis localStorage
    this.loadConfig();
  }

  /**
   * Configuration
   */

  setEmailConfig(config: EmailConfig): void {
    this.emailConfig = config;
    this.saveConfig();
  }

  setSMSConfig(config: SMSConfig): void {
    this.smsConfig = config;
    this.saveConfig();
  }

  setReminderConfig(config: Partial<ReminderConfig>): void {
    this.reminderConfig = { ...this.reminderConfig, ...config };
    this.saveConfig();
  }

  getReminderConfig(): ReminderConfig {
    return this.reminderConfig;
  }

  getEmailConfig(): EmailConfig | null {
    return this.emailConfig;
  }

  getSMSConfig(): SMSConfig | null {
    return this.smsConfig;
  }

  /**
   * Rappels automatiques
   */

  async scheduleAppointmentReminders(appointments: Appointment[], patients: Patient[]): Promise<void> {
    if (!this.reminderConfig.enabled) {
      return;
    }

    const now = new Date();
    const futureAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate > now;
    });

    for (const apt of futureAppointments) {
      const patient = patients.find(p => p.id === apt.patientId);
      if (!patient) continue;

      const aptDate = new Date(apt.startTime);
      const reminderTime = new Date(aptDate.getTime() - (this.reminderConfig.hoursBeforeAppointment * 60 * 60 * 1000));

      // Vérifier si un rappel existe déjà
      const existingJob = this.reminderJobs.find(job =>
        job.appointmentId === apt.id && job.status === 'pending'
      );

      if (!existingJob && reminderTime > now) {
        const job: ReminderJob = {
          id: `reminder_${apt.id}_${Date.now()}`,
          appointmentId: apt.id,
          patientId: apt.patientId,
          scheduledFor: reminderTime,
          channels: this.reminderConfig.channels,
          status: 'pending'
        };

        this.reminderJobs.push(job);
      }
    }

    this.saveConfig();
  }

  async sendReminder(job: ReminderJob, appointment: Appointment, patient: Patient): Promise<boolean> {
    try {
      const results: boolean[] = [];

      // Envoyer par chaque canal configuré
      for (const channel of job.channels) {
        switch (channel) {
          case 'email':
            if (this.emailConfig && patient.email) {
              const sent = await this.sendEmailReminder(appointment, patient);
              results.push(sent);
            }
            break;

          case 'sms':
            if (this.smsConfig && patient.phone) {
              const sent = await this.sendSMSReminder(appointment, patient);
              results.push(sent);
            }
            break;

          case 'push':
            // Notification push (nécessite service worker)
            const sent = await this.sendPushReminder(appointment, patient);
            results.push(sent);
            break;

          case 'whatsapp':
            // WhatsApp via Twilio API
            if (this.smsConfig && patient.phone) {
              const sent = await this.sendWhatsAppReminder(appointment, patient);
              results.push(sent);
            }
            break;
        }
      }

      // Marquer comme envoyé si au moins un canal a réussi
      const success = results.some(r => r === true);

      job.status = success ? 'sent' : 'failed';
      job.sentAt = new Date();
      if (!success) {
        job.failureReason = 'Aucun canal de communication n\'a fonctionné';
      }

      this.saveConfig();
      return success;

    } catch (error) {
      console.error('Erreur envoi rappel:', error);
      job.status = 'failed';
      job.failureReason = error instanceof Error ? error.message : 'Erreur inconnue';
      this.saveConfig();
      return false;
    }
  }

  private async sendEmailReminder(appointment: Appointment, patient: Patient): Promise<boolean> {
    if (!this.emailConfig || !patient.email) return false;

    const appointmentDate = new Date(appointment.startTime);
    const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const confirmUrl = `${window.location.origin}/confirm-appointment/${appointment.id}`;
    const cancelUrl = `${window.location.origin}/cancel-appointment/${appointment.id}`;

    const emailBody = this.reminderConfig.customMessage || `
Bonjour ${patient.name},

Nous vous rappelons votre rendez-vous prévu le ${dateStr} à ${timeStr}.

📍 Lieu: ${appointment.location || 'Cabinet'}
${appointment.notes ? `📝 Notes: ${appointment.notes}` : ''}

${this.reminderConfig.includeConfirmationButton ?
  `✅ Confirmer: ${confirmUrl}` : ''}
${this.reminderConfig.includeCancellationButton ?
  `❌ Annuler: ${cancelUrl}` : ''}

À bientôt !

---
Cet email a été envoyé automatiquement. Si vous souhaitez ne plus recevoir de rappels, contactez-nous.
    `.trim();

    // En production, utiliser le provider configuré (SendGrid, Mailgun, etc.)
    // Pour le développement, on log juste
    console.log('📧 Email Reminder:', {
      to: patient.email,
      from: this.emailConfig.senderEmail,
      subject: `Rappel RDV - ${dateStr} à ${timeStr}`,
      body: emailBody
    });

    // Simuler l'envoi réussi
    return true;
  }

  private async sendSMSReminder(appointment: Appointment, patient: Patient): Promise<boolean> {
    if (!this.smsConfig || !patient.phone) return false;

    const appointmentDate = new Date(appointment.startTime);
    const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
    const timeStr = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const smsBody = `Rappel RDV: ${dateStr} à ${timeStr}. Répondez OUI pour confirmer ou NON pour annuler.`;

    // En production, utiliser Twilio, Vonage, etc.
    console.log('📱 SMS Reminder:', {
      to: patient.phone,
      from: this.smsConfig.senderNumber,
      body: smsBody
    });

    return true;
  }

  private async sendPushReminder(appointment: Appointment, patient: Patient): Promise<boolean> {
    // Notification push navigateur
    if ('Notification' in window && Notification.permission === 'granted') {
      const appointmentDate = new Date(appointment.startTime);
      const dateStr = appointmentDate.toLocaleDateString('fr-FR');
      const timeStr = appointmentDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      new Notification('Rappel Rendez-vous', {
        body: `RDV avec ${patient.name} le ${dateStr} à ${timeStr}`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: `reminder-${appointment.id}`,
        requireInteraction: true
      });

      return true;
    }

    return false;
  }

  private async sendWhatsAppReminder(appointment: Appointment, patient: Patient): Promise<boolean> {
    if (!this.smsConfig || !patient.phone) return false;

    const appointmentDate = new Date(appointment.startTime);
    const dateStr = appointmentDate.toLocaleDateString('fr-FR');
    const timeStr = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `Bonjour ${patient.name},\n\nRappel de votre rendez-vous le ${dateStr} à ${timeStr}.\n\nÀ bientôt !`;

    // En production, utiliser Twilio WhatsApp API
    console.log('💬 WhatsApp Reminder:', {
      to: `whatsapp:${patient.phone}`,
      from: `whatsapp:${this.smsConfig.senderNumber}`,
      body: message
    });

    return true;
  }

  /**
   * Follow-up post-séance
   */

  async scheduleFollowUp(appointment: Appointment, patient: Patient, hoursAfter: number = 24): Promise<void> {
    const followUpTime = new Date(new Date(appointment.endTime || appointment.startTime).getTime() + (hoursAfter * 60 * 60 * 1000));

    const job: ReminderJob = {
      id: `followup_${appointment.id}_${Date.now()}`,
      appointmentId: appointment.id,
      patientId: patient.id,
      scheduledFor: followUpTime,
      channels: ['email'],
      status: 'pending'
    };

    this.reminderJobs.push(job);
    this.saveConfig();
  }

  async sendFollowUp(appointment: Appointment, patient: Patient): Promise<boolean> {
    if (!this.emailConfig || !patient.email) return false;

    const emailBody = `
Bonjour ${patient.name},

Nous espérons que votre séance du ${new Date(appointment.startTime).toLocaleDateString('fr-FR')} s'est bien passée.

Comment vous sentez-vous ? Avez-vous des questions ou remarques ?

N'hésitez pas à nous contacter si besoin.

À bientôt !
    `.trim();

    console.log('📧 Follow-up Email:', {
      to: patient.email,
      subject: 'Comment allez-vous ?',
      body: emailBody
    });

    return true;
  }

  /**
   * Relance patients inactifs
   */

  async findInactivePatients(patients: Patient[], appointments: Appointment[], inactiveDays: number = 90): Promise<Patient[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() - (inactiveDays * 24 * 60 * 60 * 1000));

    return patients.filter(patient => {
      const patientAppointments = appointments
        .filter(apt => apt.patientId === patient.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      if (patientAppointments.length === 0) return false;

      const lastAppointment = patientAppointments[0];
      return new Date(lastAppointment.startTime) < threshold;
    });
  }

  async sendRecallCampaign(inactivePatients: Patient[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const patient of inactivePatients) {
      try {
        const success = await this.sendRecallEmail(patient);
        if (success) sent++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }

    return { sent, failed };
  }

  private async sendRecallEmail(patient: Patient): Promise<boolean> {
    if (!this.emailConfig || !patient.email) return false;

    const emailBody = `
Bonjour ${patient.name},

Cela fait quelque temps que nous ne vous avons pas vu(e).

Comment allez-vous ? Pensez-vous qu'un nouveau rendez-vous pourrait vous être utile ?

Nous serions ravis de vous revoir bientôt !

Prenez rendez-vous: ${window.location.origin}/book

À bientôt !
    `.trim();

    console.log('📧 Recall Email:', {
      to: patient.email,
      subject: 'On pense à vous !',
      body: emailBody
    });

    return true;
  }

  /**
   * Gestion des jobs
   */

  async processScheduledJobs(appointments: Appointment[], patients: Patient[]): Promise<void> {
    const now = new Date();

    for (const job of this.reminderJobs) {
      if (job.status !== 'pending') continue;
      if (job.scheduledFor > now) continue;

      const appointment = appointments.find(apt => apt.id === job.appointmentId);
      const patient = patients.find(p => p.id === job.patientId);

      if (!appointment || !patient) {
        job.status = 'cancelled';
        continue;
      }

      await this.sendReminder(job, appointment, patient);
    }

    this.saveConfig();
  }

  getPendingJobs(): ReminderJob[] {
    return this.reminderJobs.filter(job => job.status === 'pending');
  }

  getJobHistory(limit: number = 50): ReminderJob[] {
    return this.reminderJobs
      .filter(job => job.status !== 'pending')
      .sort((a, b) => {
        const dateA = a.sentAt || a.scheduledFor;
        const dateB = b.sentAt || b.scheduledFor;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  cancelJob(jobId: string): boolean {
    const job = this.reminderJobs.find(j => j.id === jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Confirmation / Annulation
   */

  confirmAppointment(appointmentId: string): void {
    const job = this.reminderJobs.find(j =>
      j.appointmentId === appointmentId && j.status === 'sent'
    );

    if (job) {
      job.confirmationReceived = true;
      job.confirmationReceivedAt = new Date();
      this.saveConfig();
    }
  }

  /**
   * Statistiques
   */

  getAutomationStats(): {
    totalSent: number;
    totalFailed: number;
    confirmationRate: number;
    byChannel: Record<string, number>;
  } {
    const sentJobs = this.reminderJobs.filter(j => j.status === 'sent');
    const failedJobs = this.reminderJobs.filter(j => j.status === 'failed');
    const confirmedJobs = sentJobs.filter(j => j.confirmationReceived);

    const byChannel: Record<string, number> = {};
    for (const job of sentJobs) {
      for (const channel of job.channels) {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      }
    }

    return {
      totalSent: sentJobs.length,
      totalFailed: failedJobs.length,
      confirmationRate: sentJobs.length > 0
        ? Math.round((confirmedJobs.length / sentJobs.length) * 100)
        : 0,
      byChannel
    };
  }

  /**
   * Persistence
   */

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('theraflow_automation');
      if (saved) {
        const data = JSON.parse(saved);
        this.reminderConfig = data.reminderConfig || this.reminderConfig;
        this.emailConfig = data.emailConfig || null;
        this.smsConfig = data.smsConfig || null;
        this.automationRules = data.automationRules || [];
        this.reminderJobs = (data.reminderJobs || []).map((job: any) => ({
          ...job,
          scheduledFor: new Date(job.scheduledFor),
          sentAt: job.sentAt ? new Date(job.sentAt) : undefined,
          confirmationReceivedAt: job.confirmationReceivedAt ? new Date(job.confirmationReceivedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Erreur chargement config automation:', error);
    }
  }

  private saveConfig(): void {
    try {
      const data = {
        reminderConfig: this.reminderConfig,
        emailConfig: this.emailConfig,
        smsConfig: this.smsConfig,
        automationRules: this.automationRules,
        reminderJobs: this.reminderJobs
      };
      localStorage.setItem('theraflow_automation', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde config automation:', error);
    }
  }
}

// Export singleton
const automationServiceInstance = new AutomationService();
export default automationServiceInstance;

// Fonctions helper
export function scheduleReminders(appointments: Appointment[], patients: Patient[]): Promise<void> {
  return automationServiceInstance.scheduleAppointmentReminders(appointments, patients);
}

export function processReminders(appointments: Appointment[], patients: Patient[]): Promise<void> {
  return automationServiceInstance.processScheduledJobs(appointments, patients);
}

export function getAutomationStats() {
  return automationServiceInstance.getAutomationStats();
}

export function configureEmail(config: EmailConfig): void {
  automationServiceInstance.setEmailConfig(config);
}

export function configureSMS(config: SMSConfig): void {
  automationServiceInstance.setSMSConfig(config);
}
