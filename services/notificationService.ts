import { db } from '../db';
import { Notification } from '../types';

// ⚠️ IMPORTANT: Ces clés doivent être dans des variables d'environnement en production
const RESEND_API_KEY = 're_jGd97qqL_Mkdb5bMqppBthgYaXxyZE1AN';
const TWILIO_ACCOUNT_SID = 'AC823b69ed164a3b5ae50802b730a58f94';
const TWILIO_AUTH_TOKEN = 'b9f360926e91f3a13c69adb108f888c7';
const TWILIO_PHONE_NUMBER = '+33XXXXXXXXX'; // À configurer

interface EmailParams {
  to: string;
  subject: string;
  message: string;
  relatedRequestId?: number | string;
}

interface SMSParams {
  to: string;
  message: string;
  relatedRequestId?: number | string;
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const notification: Notification = {
    type: 'EMAIL',
    recipient: params.to,
    subject: params.subject,
    message: params.message,
    status: 'PENDING',
    relatedRequestId: params.relatedRequestId
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TheraFlow <onboarding@resend.dev>', // Remplacer par votre domaine vérifié
        to: [params.to],
        subject: params.subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          ${params.message.replace(/\n/g, '<br>')}
        </div>`
      })
    });

    if (response.ok) {
      notification.status = 'SENT';
      notification.sentAt = new Date().toISOString();
      await db.notifications.add(notification);
      return true;
    } else {
      const error = await response.text();
      notification.status = 'FAILED';
      notification.error = error;
      await db.notifications.add(notification);
      console.error('Email error:', error);
      return false;
    }
  } catch (error: any) {
    notification.status = 'FAILED';
    notification.error = error.message;
    await db.notifications.add(notification);
    console.error('Email exception:', error);
    return false;
  }
}

/**
 * Envoie un SMS via Twilio
 */
export async function sendSMS(params: SMSParams): Promise<boolean> {
  const notification: Notification = {
    type: 'SMS',
    recipient: params.to,
    message: params.message,
    status: 'PENDING',
    relatedRequestId: params.relatedRequestId
  };

  try {
    // Format du numéro: +33XXXXXXXXX
    const formattedPhone = params.to.startsWith('+') ? params.to : `+33${params.to.replace(/^0/, '')}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: params.message
        })
      }
    );

    if (response.ok) {
      notification.status = 'SENT';
      notification.sentAt = new Date().toISOString();
      await db.notifications.add(notification);
      return true;
    } else {
      const error = await response.text();
      notification.status = 'FAILED';
      notification.error = error;
      await db.notifications.add(notification);
      console.error('SMS error:', error);
      return false;
    }
  } catch (error: any) {
    notification.status = 'FAILED';
    notification.error = error.message;
    await db.notifications.add(notification);
    console.error('SMS exception:', error);
    return false;
  }
}

/**
 * Envoie une notification (email + SMS)
 */
export async function sendNotification(
  email: string | undefined,
  phone: string | undefined,
  subject: string,
  message: string,
  relatedRequestId?: number | string
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const results = { emailSent: false, smsSent: false };

  if (email) {
    results.emailSent = await sendEmail({ to: email, subject, message, relatedRequestId });
  }

  if (phone) {
    results.smsSent = await sendSMS({ to: phone, message, relatedRequestId });
  }

  return results;
}

/**
 * Notifications prédéfinies pour les demandes de RDV
 */
export const AppointmentNotifications = {
  /**
   * Patient fait une demande → Notifier le praticien
   */
  notifyPractitionerNewRequest: async (
    practitionerEmail: string,
    practitionerPhone: string,
    patientName: string,
    requestedTime: string,
    requestId: number | string
  ) => {
    const subject = '🔔 Nouvelle demande de rendez-vous';
    const message = `Bonjour,

${patientName} a demandé un rendez-vous pour le ${new Date(requestedTime).toLocaleString('fr-FR')}.

Connectez-vous à votre tableau de bord pour accepter ou proposer un autre créneau.

TheraFlow`;

    return sendNotification(practitionerEmail, practitionerPhone, subject, message, requestId);
  },

  /**
   * Praticien accepte → Notifier le patient
   */
  notifyPatientRequestAccepted: async (
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    patientName: string,
    confirmedTime: string,
    requestId: number | string
  ) => {
    const subject = '✅ Rendez-vous confirmé';
    const message = `Bonjour ${patientName},

Votre rendez-vous a été confirmé pour le ${new Date(confirmedTime).toLocaleString('fr-FR')}.

À bientôt !
TheraFlow`;

    return sendNotification(patientEmail, patientPhone, subject, message, requestId);
  },

  /**
   * Praticien propose autre créneau → Notifier le patient
   */
  notifyPatientProposedTime: async (
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    patientName: string,
    proposedTime: string,
    message: string | undefined,
    requestId: number | string
  ) => {
    const subject = '📅 Nouveau créneau proposé';
    const notifMessage = `Bonjour ${patientName},

Un autre créneau vous est proposé : ${new Date(proposedTime).toLocaleString('fr-FR')}.

${message ? `Message du praticien : ${message}\n` : ''}
Connectez-vous pour accepter ou proposer un autre créneau.

TheraFlow`;

    return sendNotification(patientEmail, patientPhone, subject, notifMessage, requestId);
  },

  /**
   * Patient propose autre créneau → Notifier le praticien
   */
  notifyPractitionerProposedTime: async (
    practitionerEmail: string,
    practitionerPhone: string,
    patientName: string,
    proposedTime: string,
    message: string | undefined,
    requestId: number | string
  ) => {
    const subject = '📅 Nouveau créneau proposé par le patient';
    const notifMessage = `Bonjour,

${patientName} propose un autre créneau : ${new Date(proposedTime).toLocaleString('fr-FR')}.

${message ? `Message du patient : ${message}\n` : ''}
Connectez-vous pour accepter ou proposer un autre créneau.

TheraFlow`;

    return sendNotification(practitionerEmail, practitionerPhone, subject, notifMessage, requestId);
  },

  /**
   * Demande refusée → Notifier le patient
   */
  notifyPatientRequestRejected: async (
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    patientName: string,
    message: string | undefined,
    requestId: number | string
  ) => {
    const subject = '❌ Demande de rendez-vous refusée';
    const notifMessage = `Bonjour ${patientName},

Votre demande de rendez-vous n'a pas pu être acceptée.

${message ? `Message du praticien : ${message}\n` : ''}
N'hésitez pas à faire une nouvelle demande pour un autre créneau.

TheraFlow`;

    return sendNotification(patientEmail, patientPhone, subject, notifMessage, requestId);
  }
};
