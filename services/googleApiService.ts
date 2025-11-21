import { AppSettings } from '../types';
import { db } from '../db';

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
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events.readonly';

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
            await db.settings.update(settings.id, { google: updatedGoogle });
        }
        resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
};

export const checkAuth = async (): Promise<boolean> => {
    const settings = (await db.settings.toArray())[0];
    if (!settings?.google?.accessToken) return false;
    
    // Vérif expiry
    if (settings.google.tokenExpiry && Date.now() > settings.google.tokenExpiry) {
        return false;
    }
    
    // Restaurer token dans gapi
    if (window.gapi?.client) {
        window.gapi.client.setToken({ access_token: settings.google.accessToken });
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
            'maxResults': 10,
            'orderBy': 'startTime'
        });
        return response.result.items;
    } catch (error) {
        console.error("Calendar Sync Error", error);
        return [];
    }
};