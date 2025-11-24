import { db } from '../db';
import { Notification } from '../types';

// Configuration depuis variables d'environnement
// Configurer ces variables dans Netlify : Site configuration → Environment variables
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

interface EmailParams {
  to: string;
  subject: string;
  message: string;
  relatedRequestId?: number | string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
  }>;
}

interface SMSParams {
  to: string;
  message: string;
  relatedRequestId?: number | string;
}

/**
 * Envoie un email via Netlify Function (qui appelle Resend API)
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
    // Prepare request payload
    const payload: any = {
      to: params.to,
      subject: params.subject,
      message: params.message,
      relatedRequestId: params.relatedRequestId
    };

    // Add attachments if provided
    if (params.attachments && params.attachments.length > 0) {
      payload.attachments = params.attachments;
    }

    // Call Netlify Function instead of direct API
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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
 * Envoie un SMS via Netlify Function (qui appelle Twilio API)
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
    // Call Netlify Function instead of direct API
    const response = await fetch('/.netlify/functions/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: params.to,
        message: params.message,
        relatedRequestId: params.relatedRequestId
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

/**
 * Envoie un email avec un PDF en pièce jointe
 * @param to Email du destinataire
 * @param subject Sujet de l'email
 * @param message Message de l'email
 * @param pdfBlob Blob du PDF généré
 * @param pdfFilename Nom du fichier PDF
 * @param relatedRequestId ID de la demande liée (optionnel)
 */
export async function sendEmailWithPDF(
  to: string,
  subject: string,
  message: string,
  pdfBlob: Blob,
  pdfFilename: string,
  relatedRequestId?: number | string
): Promise<boolean> {
  try {
    // Convert Blob to Base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (data:application/pdf;base64,)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(pdfBlob);
    const base64Content = await base64Promise;

    // Send email with PDF attachment
    return await sendEmail({
      to,
      subject,
      message,
      relatedRequestId,
      attachments: [
        {
          filename: pdfFilename,
          content: base64Content
        }
      ]
    });
  } catch (error) {
    console.error('Error sending email with PDF:', error);
    return false;
  }
}
