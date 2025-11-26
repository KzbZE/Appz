/**
 * Service d'Automatisation des Rappels
 *
 * Fonctionnalités:
 * - Rappels SMS/Email 24h avant RDV
 * - Boutons confirmation/annulation
 * - Suivi des réponses
 * - Relances automatiques
 */

import { Appointment, Patient } from '../types';

export interface ReminderConfig {
  enabled: boolean;
  channels: ('email' | 'sms' | 'both')[];
  timingHours: number; // Heures avant RDV
  includeConfirmButton: boolean;
  includeRescheduleButton: boolean;
  autoResendIfNoResponse: boolean;
  resendAfterHours: number;
}

export interface ReminderTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms';
  subject?: string; // Pour email
  body: string;
  variables: string[]; // {patientName}, {date}, {time}, etc.
}

export interface ReminderLog {
  id?: number;
  appointmentId: number;
  patientId: number;
  channel: 'email' | 'sms';
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'confirmed' | 'cancelled';
  confirmationToken?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  errorMessage?: string;
}

export interface ReminderResponse {
  token: string;
  action: 'confirm' | 'cancel' | 'reschedule';
  appointmentId: number;
  respondedAt: string;
  newSuggestedTime?: string;
}

class ReminderAutomationService {

  private config: ReminderConfig = {
    enabled: true,
    channels: ['both'],
    timingHours: 24,
    includeConfirmButton: true,
    includeRescheduleButton: true,
    autoResendIfNoResponse: false,
    resendAfterHours: 4
  };

  private templates: Record<string, ReminderTemplate> = {
    sms_24h: {
      id: 'sms_24h',
      name: 'SMS Rappel 24h',
      channel: 'sms',
      body: `Bonjour {patientName}, rappel de votre RDV demain à {time} chez {practitionerName}.

✅ Confirmer: {confirmLink}
❌ Annuler: {cancelLink}

À bientôt!`,
      variables: ['patientName', 'time', 'practitionerName', 'confirmLink', 'cancelLink']
    },

    email_24h: {
      id: 'email_24h',
      name: 'Email Rappel 24h',
      channel: 'email',
      subject: 'Rappel: Rendez-vous demain à {time}',
      body: `<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .btn-confirm { background: #10b981; color: white; }
    .btn-cancel { background: #ef4444; color: white; }
    .btn-reschedule { background: #6366f1; color: white; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗓️ Rappel de Rendez-vous</h1>
    </div>

    <div class="content">
      <p>Bonjour <strong>{patientName}</strong>,</p>

      <p>Nous vous rappelons que vous avez rendez-vous:</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 0;"><strong>📅 Date:</strong> {date}</p>
        <p style="margin: 10px 0 0 0;"><strong>⏰ Heure:</strong> {time}</p>
        <p style="margin: 10px 0 0 0;"><strong>📍 Lieu:</strong> {location}</p>
        <p style="margin: 10px 0 0 0;"><strong>👤 Praticien:</strong> {practitionerName}</p>
      </div>

      <p>Merci de confirmer votre présence:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{confirmLink}" class="button btn-confirm">✅ Je confirme</a>
        <a href="{rescheduleLink}" class="button btn-reschedule">📅 Reporter</a>
        <a href="{cancelLink}" class="button btn-cancel">❌ Annuler</a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        <em>Si vous ne pouvez pas venir, merci de nous prévenir au moins 24h à l'avance.</em>
      </p>
    </div>

    <div class="footer">
      <p>{practitionerName} - Cabinet de Kinésithérapie</p>
      <p>{cabinetAddress}</p>
      <p>📞 {phone} | 📧 {email}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ['patientName', 'date', 'time', 'location', 'practitionerName', 'cabinetAddress', 'phone', 'email', 'confirmLink', 'rescheduleLink', 'cancelLink']
    },

    sms_2h: {
      id: 'sms_2h',
      name: 'SMS Rappel 2h',
      channel: 'sms',
      body: `Rappel: Votre RDV est dans 2h à {time} chez {practitionerName}. À tout de suite! 👋`,
      variables: ['time', 'practitionerName']
    }
  };

  /**
   * Configure le service de rappels
   */
  updateConfig(newConfig: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Génère un token unique pour confirmation/annulation
   */
  private generateToken(appointmentId: number): string {
    return `token_${appointmentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Remplace les variables dans un template
   */
  private replaceVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  }

  /**
   * Prépare un rappel pour un rendez-vous
   */
  async prepareReminder(
    appointment: Appointment,
    patient: Patient,
    practitionerInfo: {
      name: string;
      cabinetAddress: string;
      phone: string;
      email: string;
    },
    templateId: string = 'sms_24h'
  ): Promise<{ sms?: string; email?: { subject: string; html: string } }> {

    const template = this.templates[templateId];
    if (!template) throw new Error(`Template ${templateId} not found`);

    const token = this.generateToken(appointment.id as number);
    const baseUrl = window.location.origin;

    const variables: Record<string, string> = {
      patientName: patient.name,
      date: new Date(appointment.startTime).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: new Date(appointment.startTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      location: appointment.type === 'CABINET' ? practitionerInfo.cabinetAddress : patient.address,
      practitionerName: practitionerInfo.name,
      cabinetAddress: practitionerInfo.cabinetAddress,
      phone: practitionerInfo.phone,
      email: practitionerInfo.email,
      confirmLink: `${baseUrl}/confirm-appointment?token=${token}&action=confirm`,
      cancelLink: `${baseUrl}/confirm-appointment?token=${token}&action=cancel`,
      rescheduleLink: `${baseUrl}/confirm-appointment?token=${token}&action=reschedule`
    };

    const body = this.replaceVariables(template.body, variables);

    if (template.channel === 'sms') {
      return { sms: body };
    } else {
      const subject = this.replaceVariables(template.subject || '', variables);
      return {
        email: {
          subject,
          html: body
        }
      };
    }
  }

  /**
   * Envoie un rappel SMS via Twilio
   * NOTE: Nécessite configuration Twilio dans Netlify Functions
   */
  async sendSMS(phoneNumber: string, message: string): Promise<ReminderLog> {
    try {
      // TODO: Appeler Netlify Function pour envoi SMS
      const response = await fetch('/.netlify/functions/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, message })
      });

      if (!response.ok) throw new Error('SMS send failed');

      return {
        appointmentId: 0,
        patientId: 0,
        channel: 'sms',
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        appointmentId: 0,
        patientId: 0,
        channel: 'sms',
        sentAt: new Date().toISOString(),
        status: 'failed',
        errorMessage: (error as Error).message
      };
    }
  }

  /**
   * Envoie un rappel Email via SendGrid
   * NOTE: Nécessite configuration SendGrid dans Netlify Functions
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<ReminderLog> {
    try {
      // TODO: Appeler Netlify Function pour envoi email
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html })
      });

      if (!response.ok) throw new Error('Email send failed');

      return {
        appointmentId: 0,
        patientId: 0,
        channel: 'email',
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        appointmentId: 0,
        patientId: 0,
        channel: 'email',
        sentAt: new Date().toISOString(),
        status: 'failed',
        errorMessage: (error as Error).message
      };
    }
  }

  /**
   * Vérifie si un rendez-vous nécessite un rappel
   */
  shouldSendReminder(appointment: Appointment): boolean {
    if (!this.config.enabled) return false;

    const apptTime = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntilAppt = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Envoyer si entre 23h et 25h avant le RDV (fenêtre de 2h)
    return hoursUntilAppt >= 23 && hoursUntilAppt <= 25;
  }

  /**
   * Traite une réponse de confirmation/annulation
   */
  async handleReminderResponse(
    token: string,
    action: 'confirm' | 'cancel' | 'reschedule'
  ): Promise<{ success: boolean; message: string }> {

    // TODO: Vérifier token en DB
    // TODO: Mettre à jour le statut du RDV
    // TODO: Logger la réponse

    if (action === 'confirm') {
      return {
        success: true,
        message: 'Votre rendez-vous est confirmé. À bientôt!'
      };
    } else if (action === 'cancel') {
      return {
        success: true,
        message: 'Votre rendez-vous a été annulé. Merci de nous avoir prévenus.'
      };
    } else {
      return {
        success: true,
        message: 'Nous vous recontacterons pour fixer un nouveau rendez-vous.'
      };
    }
  }

  /**
   * Obtient les statistiques des rappels
   */
  async getReminderStats(startDate: string, endDate: string): Promise<{
    totalSent: number;
    smsCount: number;
    emailCount: number;
    confirmedCount: number;
    cancelledCount: number;
    noResponseCount: number;
    confirmationRate: number;
  }> {
    // TODO: Query reminder logs from DB

    return {
      totalSent: 100,
      smsCount: 60,
      emailCount: 40,
      confirmedCount: 75,
      cancelledCount: 10,
      noResponseCount: 15,
      confirmationRate: 0.75
    };
  }
}

export default new ReminderAutomationService();
