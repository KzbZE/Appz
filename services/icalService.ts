import { Appointment } from '../types';
import { format } from 'date-fns';

/**
 * Service d'export/import au format iCal (.ics)
 * Compatible avec Google Calendar, Outlook, Apple Calendar, etc.
 */

/**
 * Génère un fichier .ics à partir d'un rendez-vous
 */
export function generateICalEvent(appointment: Appointment, patientName: string, practitionerName: string): string {
  const startDate = new Date(appointment.startTime);

  // Calculer endDate si pas fourni
  const endDate = appointment.endTime
    ? new Date(appointment.endTime)
    : new Date(startDate.getTime() + appointment.durationMin * 60000);

  // Format iCal pour les dates (YYYYMMDDTHHMMSSZ)
  const formatDateForICal = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `theraflow-${appointment.id}@theraflow.app`;
  const dtstamp = formatDateForICal(new Date());
  const dtstart = formatDateForICal(startDate);
  const dtend = formatDateForICal(endDate);

  const summary = `Séance - ${patientName}`;
  const description = appointment.notes || 'Rendez-vous de consultation';
  const location = appointment.location || 'Cabinet';

  // Status mapping
  const status = appointment.status === 'COMPLETED' ? 'CONFIRMED' :
                 appointment.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TheraFlow//TheraFlowDB//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:TheraFlow - ${practitionerName}
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:${status}
SEQUENCE:0
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Rappel: ${summary}
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Génère un fichier .ics pour plusieurs rendez-vous
 */
export function generateICalCalendar(
  appointments: Array<{ appointment: Appointment; patientName: string }>,
  practitionerName: string
): string {
  const formatDateForICal = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TheraFlow//TheraFlowDB//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:TheraFlow - ${practitionerName}
X-WR-TIMEZONE:Europe/Paris\n`;

  appointments.forEach(({ appointment, patientName }) => {
    const startDate = new Date(appointment.startTime);

    // Calculer endDate si pas fourni
    const endDate = appointment.endTime
      ? new Date(appointment.endTime)
      : new Date(startDate.getTime() + appointment.durationMin * 60000);

    const uid = `theraflow-${appointment.id}@theraflow.app`;
    const dtstamp = formatDateForICal(new Date());
    const dtstart = formatDateForICal(startDate);
    const dtend = formatDateForICal(endDate);

    const summary = `Séance - ${patientName}`;
    const description = appointment.notes || 'Rendez-vous de consultation';
    const location = appointment.location || 'Cabinet';

    const status = appointment.status === 'COMPLETED' ? 'CONFIRMED' :
                   appointment.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';

    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:${status}
SEQUENCE:0
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Rappel: ${summary}
TRIGGER:-PT15M
END:VALARM
END:VEVENT\n`;
  });

  icsContent += 'END:VCALENDAR';

  return icsContent;
}

/**
 * Télécharge un fichier .ics
 */
export function downloadICalFile(icsContent: string, fileName: string = 'calendar.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporte un rendez-vous unique au format iCal
 */
export async function exportAppointmentToICal(
  appointment: Appointment,
  patientName: string,
  practitionerName: string
): Promise<void> {
  const icsContent = generateICalEvent(appointment, patientName, practitionerName);
  const fileName = `rdv_${patientName.replace(/\s+/g, '_')}_${format(new Date(appointment.startTime), 'yyyy-MM-dd')}.ics`;
  downloadICalFile(icsContent, fileName);
}

/**
 * Exporte tous les rendez-vous d'une période au format iCal
 */
export async function exportCalendarToICal(
  appointments: Array<{ appointment: Appointment; patientName: string }>,
  practitionerName: string,
  fileName: string = 'theraflow_calendar.ics'
): Promise<void> {
  const icsContent = generateICalCalendar(appointments, practitionerName);
  downloadICalFile(icsContent, fileName);
}

/**
 * Parse un fichier iCal et extrait les événements
 * (Import basique - à améliorer avec une vraie lib si nécessaire)
 */
export function parseICalFile(icsContent: string): Array<Partial<Appointment>> {
  const events: Array<Partial<Appointment>> = [];

  // Regex basiques pour parser l'iCal
  const eventBlocks = icsContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g);

  if (!eventBlocks) return events;

  eventBlocks.forEach((block) => {
    const getField = (field: string): string | null => {
      const match = block.match(new RegExp(`${field}:(.+)`));
      return match ? match[1].trim() : null;
    };

    const dtstart = getField('DTSTART');
    const dtend = getField('DTEND');
    const summary = getField('SUMMARY');
    const description = getField('DESCRIPTION');
    const location = getField('LOCATION');

    if (!dtstart || !dtend) return;

    // Convertir format iCal en Date
    const parseICalDate = (dateStr: string): Date => {
      // Format: 20241225T140000Z
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11));
      const minute = parseInt(dateStr.substring(11, 13));

      return new Date(Date.UTC(year, month, day, hour, minute));
    };

    events.push({
      startTime: parseICalDate(dtstart).toISOString(),
      endTime: parseICalDate(dtend).toISOString(),
      notes: description?.replace(/\\n/g, '\n') || '',
      location: location || undefined
    });
  });

  return events;
}

/**
 * Importe des rendez-vous depuis un fichier iCal
 */
export async function importICalFile(file: File): Promise<Array<Partial<Appointment>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const events = parseICalFile(content);
        resolve(events);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Génère une URL de souscription au calendrier (webcal://)
 * Pour les serveurs supportant CalDAV
 */
export function generateCalendarSubscriptionUrl(calendarId: string): string {
  const baseUrl = window.location.origin;
  return `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/${calendarId}.ics`;
}

/**
 * Créer un lien mailto pour partager un événement par email
 */
export function shareEventByEmail(
  appointment: Appointment,
  patientName: string,
  practitionerName: string,
  recipientEmail: string
): void {
  const icsContent = generateICalEvent(appointment, patientName, practitionerName);
  const blob = new Blob([icsContent], { type: 'text/calendar' });

  // Note: Les pièces jointes par mailto ne sont pas standardisées
  // Alternative: Encoder en base64 et inclure dans le corps
  const subject = encodeURIComponent(`Rendez-vous - ${patientName}`);
  const body = encodeURIComponent(`
Bonjour,

Voici la confirmation de votre rendez-vous :

📅 Date : ${format(new Date(appointment.startTime), 'dd/MM/yyyy à HH:mm')}
📍 Lieu : ${appointment.location || 'Cabinet'}
📝 Notes : ${appointment.notes || 'N/A'}

Le fichier .ics est disponible en téléchargement pour ajouter cet événement à votre calendrier.

Cordialement,
${practitionerName}
  `.trim());

  window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}
