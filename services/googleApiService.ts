import { AppSettings } from '../types';
import { dataService } from './dataService';

// Types pour GAPI
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];
// ✅ Ajout permissions ÉCRITURE pour Calendar (pas seulement readonly)
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events';

export const initGoogleClient = async (settings: AppSettings): Promise<void> => {
  if (!settings.google?.clientId || !settings.google?.apiKey) return;

  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      console.warn("Script GAPI non chargé");
      return reject("GAPI not loaded");
    }
    
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: settings.google!.apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });
        resolve();
      } catch (error) {
        console.error("Erreur init GAPI:", error);
        reject(error);
      }
    });
  });
};

export const signInToGoogle = async (settings: AppSettings): Promise<string> => {
  if (!settings.google?.clientId) throw new Error("Client ID manquant");

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: settings.google!.clientId,
      scope: SCOPES,
      callback: async (resp: any) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        // Sauvegarder le token (session courte)
        if (settings.id) {
            const updatedGoogle = {
                ...settings.google,
                accessToken: resp.access_token,
                tokenExpiry: Date.now() + (resp.expires_in * 1000)
            };
            await dataService.updateSettings(settings.id, { google: updatedGoogle });
        }
        resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
};

export const checkAuth = async (): Promise<boolean> => {
    const settingsArray = await dataService.getSettings();
    const settings = settingsArray[0];
    if (!settings?.google?.accessToken) {
        console.log("❌ Google: Pas de token sauvegardé");
        return false;
    }

    // Vérif expiry
    if (settings.google.tokenExpiry && Date.now() > settings.google.tokenExpiry) {
        console.log("⏱️ Google: Token expiré. Reconnexion nécessaire.");
        // Nettoyer le token expiré
        if (settings.id) {
            await dataService.updateSettings(settings.id, {
                google: { ...settings.google, accessToken: undefined, tokenExpiry: undefined }
            });
        }
        return false;
    }

    // Restaurer token dans gapi
    if (window.gapi?.client) {
        window.gapi.client.setToken({ access_token: settings.google.accessToken });
        console.log("✅ Google: Token restauré, connecté");
        return true;
    }
    return false;
};

// Drive Functions
export const listDriveFolders = async (): Promise<{id: string, name: string}[]> => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
    });
    return response.result.files;
  } catch (err) {
    console.error("Drive List Error", err);
    return [];
  }
};

export const uploadToDriveReal = async (blob: Blob, fileName: string, folderId?: string): Promise<string> => {
  try {
    const accessToken = window.gapi.client.getToken().access_token;
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      parents: folderId ? [folderId] : []
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    
    const data = await response.json();
    return `https://drive.google.com/file/d/${data.id}/view`; // Lien visuel
  } catch (error) {
    console.error("Upload Error", error);
    throw error;
  }
};

// Calendar Functions
export const syncCalendarEvents = async () => {
    try {
        const response = await window.gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 100, // Augmenté pour récupérer plus d'événements
            'orderBy': 'startTime'
        });
        return response.result.items;
    } catch (error) {
        console.error("Calendar Sync Error", error);
        return [];
    }
};

// ✅ NOUVEAU : Créer un événement dans Google Calendar
export const createCalendarEvent = async (eventData: {
    summary: string;
    description?: string;
    start: string; // ISO format
    end: string; // ISO format
    location?: string;
}) => {
    try {
        const response = await window.gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': {
                'summary': eventData.summary,
                'description': eventData.description,
                'start': {
                    'dateTime': eventData.start,
                    'timeZone': 'Europe/Paris'
                },
                'end': {
                    'dateTime': eventData.end,
                    'timeZone': 'Europe/Paris'
                },
                'location': eventData.location,
                'reminders': {
                    'useDefault': false,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60}, // 1 jour avant
                        {'method': 'popup', 'minutes': 30} // 30 min avant
                    ]
                }
            }
        });
        return response.result;
    } catch (error) {
        console.error("Create Calendar Event Error", error);
        throw error;
    }
};

// ✅ NOUVEAU : Mettre à jour un événement Google Calendar
export const updateCalendarEvent = async (eventId: string, eventData: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
}) => {
    try {
        const response = await window.gapi.client.calendar.events.patch({
            'calendarId': 'primary',
            'eventId': eventId,
            'resource': {
                'summary': eventData.summary,
                'description': eventData.description,
                'start': eventData.start ? {
                    'dateTime': eventData.start,
                    'timeZone': 'Europe/Paris'
                } : undefined,
                'end': eventData.end ? {
                    'dateTime': eventData.end,
                    'timeZone': 'Europe/Paris'
                } : undefined,
                'location': eventData.location
            }
        });
        return response.result;
    } catch (error) {
        console.error("Update Calendar Event Error", error);
        throw error;
    }
};

// ✅ NOUVEAU : Supprimer un événement Google Calendar
export const deleteCalendarEvent = async (eventId: string) => {
    try {
        await window.gapi.client.calendar.events.delete({
            'calendarId': 'primary',
            'eventId': eventId
        });
        return true;
    } catch (error) {
        console.error("Delete Calendar Event Error", error);
        throw error;
    }
};

// ✅ NOUVEAU : Importer événements Google Calendar vers Supabase
export const importCalendarEventsToLocal = async () => {
    try {
        const events = await syncCalendarEvents();
        const imported = [];

        // Récupérer tous les rendez-vous pour vérifier les doublons
        const allAppointments = await dataService.getAppointments();

        for (const event of events) {
            // Vérifier si l'événement existe déjà dans la base
            const existing = allAppointments.find(a => a.googleEventId === event.id);

            if (!existing) {
                // Créer un nouveau RDV
                const appointmentData = {
                    patientId: 0, // Patient temporaire (Google import)
                    startTime: event.start.dateTime || event.start.date,
                    durationMin: calculateDuration(event.start.dateTime || event.start.date, event.end.dateTime || event.end.date),
                    status: 'SCHEDULED' as any,
                    type: 'CABINET' as any,
                    notes: event.summary || 'Événement Google Calendar',
                    price: 0,
                    googleEventId: event.id // Lien avec Google Calendar
                };

                const id = await dataService.createAppointment(appointmentData);
                imported.push({ id, googleEventId: event.id });
            }
        }

        return imported;
    } catch (error) {
        console.error("Import Calendar Events Error", error);
        throw error;
    }
};

// Helper pour calculer la durée
function calculateDuration(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}