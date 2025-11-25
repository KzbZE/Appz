import { db } from '../db';
import { Appointment, ApptStatus } from '../types';
import { sendEmail, sendSMS } from './notificationService';
import { addDays, differenceInHours, format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service de rappels automatiques pour les rendez-vous
 * Envoie des emails/SMS 24h avant avec boutons confirmation/annulation
 */

interface ReminderLog {
  id?: number;
  appointmentId: number | string;
  type: 'EMAIL' | 'SMS';
  sentAt: string;
  status: 'SENT' | 'FAILED';
  error?: string;
}

/**
 * Génère un token de confirmation unique pour un RDV
 */
export function generateConfirmationToken(appointmentId: number | string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return btoa(`${appointmentId}-${timestamp}-${random}`);
}

/**
 * Génère le HTML d'un email de rappel avec boutons d'action
 */
export function generateReminderEmailHTML(
  appointment: Appointment,
  patientName: string,
  practitionerName: string,
  confirmationUrl: string,
  cancellationUrl: string
): string {
  const appointmentDate = new Date(appointment.startTime);
  const formattedDate = format(appointmentDate, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
  const location = appointment.location || 'Cabinet';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de rendez-vous - TheraFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⏰ Rappel de Rendez-vous</h1>
              <p style="margin: 10px 0 0 0; color: #FAF5FF; font-size: 16px;">TheraFlow</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1F2937; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${patientName}</strong>,
              </p>
              <p style="margin: 0 0 30px 0; color: #1F2937; font-size: 16px; line-height: 1.6;">
                Nous vous rappelons votre rendez-vous prévu demain avec <strong>${practitionerName}</strong>.
              </p>

              <!-- Appointment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #7C3AED; font-weight: 600; font-size: 14px;">📅 Date</td>
                        <td style="color: #1F2937; font-weight: 600; font-size: 14px; text-align: right;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #7C3AED; font-weight: 600; font-size: 14px;">📍 Lieu</td>
                        <td style="color: #1F2937; font-weight: 600; font-size: 14px; text-align: right;">${location}</td>
                      </tr>
                      ${appointment.notes ? `
                      <tr>
                        <td style="color: #7C3AED; font-weight: 600; font-size: 14px;">📝 Notes</td>
                        <td style="color: #1F2937; font-size: 14px; text-align: right;">${appointment.notes}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="padding: 0 5px;">
                    <a href="${confirmationUrl}" style="display: inline-block; width: 100%; max-width: 250px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      ✅ Confirmer mon RDV
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 12px 5px 0 5px;">
                    <a href="${cancellationUrl}" style="display: inline-block; width: 100%; max-width: 250px; background-color: #F3F4F6; color: #6B7280; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; border: 2px solid #E5E7EB;">
                      ❌ Annuler / Reporter
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Veuillez confirmer votre présence ou nous prévenir en cas d'empêchement au moins 24h à l'avance.
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                En cas d'annulation tardive ou de non-présentation sans préavis, des frais pourront être appliqués.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                Cet email a été envoyé automatiquement par <strong>TheraFlow</strong>
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                Si vous avez des questions, contactez-nous directement.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Génère le message SMS de rappel (version courte)
 */
export function generateReminderSMS(
  appointment: Appointment,
  patientName: string,
  practitionerName: string
): string {
  const appointmentDate = new Date(appointment.startTime);
  const formattedDate = format(appointmentDate, "dd/MM/yyyy 'à' HH:mm", { locale: fr });

  return `Bonjour ${patientName}, rappel de votre RDV avec ${practitionerName} le ${formattedDate}. Merci de confirmer ou annuler si besoin. TheraFlow`;
}

/**
 * Vérifie quels rendez-vous nécessitent un rappel (24h avant)
 */
export async function checkAppointmentsForReminders(): Promise<Appointment[]> {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const tomorrowPlus2h = addDays(now, 1).setHours(now.getHours() + 2);

  // Récupérer tous les RDV programmés
  const appointments = await db.appointments
    .where('status')
    .equals(ApptStatus.SCHEDULED)
    .toArray();

  // Filtrer ceux qui sont dans 24h (+/- 2h de marge)
  const appointmentsNeedingReminder = appointments.filter(appt => {
    const apptDate = new Date(appt.startTime);
    const hoursUntil = differenceInHours(apptDate, now);

    // Entre 22h et 26h avant le RDV (fenêtre de 24h ± 2h)
    return hoursUntil >= 22 && hoursUntil <= 26;
  });

  // Vérifier si un rappel n'a pas déjà été envoyé (simulé ici, devrait être en DB)
  // TODO: Implémenter table reminderLogs dans db.ts
  return appointmentsNeedingReminder;
}

/**
 * Envoie un rappel email pour un rendez-vous
 */
export async function sendAppointmentReminder(
  appointment: Appointment,
  practitionerName: string,
  baseUrl: string = window.location.origin
): Promise<boolean> {
  try {
    // Récupérer les infos du patient
    const patient = await db.patients.get(appointment.patientId);
    if (!patient) {
      console.error('Patient not found for appointment', appointment.id);
      return false;
    }

    if (!patient.email) {
      console.warn('Patient has no email, skipping email reminder', patient.id);
      return false;
    }

    // Générer token de confirmation
    const token = generateConfirmationToken(appointment.id!);

    // URLs d'action
    const confirmationUrl = `${baseUrl}/#/validate?token=${token}&action=confirm`;
    const cancellationUrl = `${baseUrl}/#/validate?token=${token}&action=cancel`;

    // Générer le HTML de l'email
    const emailHTML = generateReminderEmailHTML(
      appointment,
      patient.name,
      practitionerName,
      confirmationUrl,
      cancellationUrl
    );

    // Envoyer l'email
    const success = await sendEmail({
      to: patient.email,
      subject: `⏰ Rappel : Rendez-vous demain avec ${practitionerName}`,
      message: emailHTML,
      relatedRequestId: appointment.id
    });

    // Logger le rappel (TODO: sauvegarder en DB)
    if (success) {
      console.log(`✅ Reminder sent for appointment ${appointment.id} to ${patient.email}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return false;
  }
}

/**
 * Envoie un rappel SMS pour un rendez-vous
 */
export async function sendAppointmentReminderSMS(
  appointment: Appointment,
  practitionerName: string
): Promise<boolean> {
  try {
    // Récupérer les infos du patient
    const patient = await db.patients.get(appointment.patientId);
    if (!patient) {
      console.error('Patient not found for appointment', appointment.id);
      return false;
    }

    if (!patient.phone) {
      console.warn('Patient has no phone, skipping SMS reminder', patient.id);
      return false;
    }

    // Générer le message SMS
    const smsMessage = generateReminderSMS(appointment, patient.name, practitionerName);

    // Envoyer le SMS
    const success = await sendSMS({
      to: patient.phone,
      message: smsMessage,
      relatedRequestId: appointment.id
    });

    if (success) {
      console.log(`✅ SMS reminder sent for appointment ${appointment.id} to ${patient.phone}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending SMS reminder:', error);
    return false;
  }
}

/**
 * Processus automatique de rappels
 * À exécuter quotidiennement (ou toutes les heures)
 */
export async function processAutomaticReminders(practitionerName: string): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const results = {
    sent: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Trouver les RDV nécessitant un rappel
    const appointmentsToRemind = await checkAppointmentsForReminders();

    console.log(`Found ${appointmentsToRemind.length} appointments needing reminders`);

    // Envoyer les rappels
    for (const appointment of appointmentsToRemind) {
      const patient = await db.patients.get(appointment.patientId);

      if (!patient) {
        results.skipped++;
        continue;
      }

      // Priorité : Email > SMS
      if (patient.email) {
        const success = await sendAppointmentReminder(appointment, practitionerName);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
      } else if (patient.phone) {
        const success = await sendAppointmentReminderSMS(appointment, practitionerName);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
      } else {
        results.skipped++;
      }

      // Petit délai entre chaque envoi pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Reminder process completed:', results);
    return results;
  } catch (error) {
    console.error('Error processing automatic reminders:', error);
    return results;
  }
}

/**
 * Configure un cron job pour l'envoi automatique des rappels
 * À appeler au démarrage de l'application
 */
export function setupAutomaticReminders(practitionerName: string) {
  // Vérifier toutes les heures
  const intervalMs = 60 * 60 * 1000; // 1 heure

  setInterval(async () => {
    console.log('Running automatic reminders check...');
    await processAutomaticReminders(practitionerName);
  }, intervalMs);

  console.log('✅ Automatic reminders scheduler initialized (checking every hour)');
}
