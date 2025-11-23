import { db } from '../db';

export interface BackupData {
  version: number;
  timestamp: string;
  data: {
    patients: any[];
    appointments: any[];
    invoices: any[];
    recurringInvoices: any[];
    expenses: any[];
    sessions: any[];
    smsLogs: any[];
    surveyResponses: any[];
    settings: any[];
  };
}

/**
 * Export full database to JSON
 */
export async function exportDatabase(): Promise<BackupData> {
  const [
    patients,
    appointments,
    invoices,
    recurringInvoices,
    expenses,
    sessions,
    smsLogs,
    surveyResponses,
    settings
  ] = await Promise.all([
    db.patients.toArray(),
    db.appointments.toArray(),
    db.invoices.toArray(),
    db.recurringInvoices.toArray(),
    db.expenses.toArray(),
    db.sessions.toArray(),
    db.smsLogs.toArray(),
    db.surveyResponses.toArray(),
    db.settings.toArray()
  ]);

  return {
    version: 4, // Current database version
    timestamp: new Date().toISOString(),
    data: {
      patients,
      appointments,
      invoices,
      recurringInvoices,
      expenses,
      sessions,
      smsLogs,
      surveyResponses,
      settings
    }
  };
}

/**
 * Download backup as JSON file
 */
export async function downloadBackup(): Promise<void> {
  const backup = await exportDatabase();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `TheraFlow_Backup_${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import backup from JSON file
 */
export async function importBackup(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    // Validate backup structure
    if (!backup.version || !backup.data) {
      return { success: false, error: 'Format de backup invalide' };
    }

    // Confirmation before overwriting
    const confirmed = confirm(
      `⚠️ ATTENTION: Cette opération va remplacer TOUTES vos données actuelles par celles du backup.\n\n` +
      `Backup créé le: ${new Date(backup.timestamp).toLocaleString('fr-FR')}\n` +
      `Version: ${backup.version}\n\n` +
      `Voulez-vous vraiment continuer ?`
    );

    if (!confirmed) {
      return { success: false, error: 'Importation annulée par l\'utilisateur' };
    }

    // Clear all tables
    await Promise.all([
      db.patients.clear(),
      db.appointments.clear(),
      db.invoices.clear(),
      db.recurringInvoices.clear(),
      db.expenses.clear(),
      db.sessions.clear(),
      db.smsLogs.clear(),
      db.surveyResponses.clear()
      // Note: We don't clear settings to preserve Google OAuth tokens
    ]);

    // Import data
    await Promise.all([
      backup.data.patients && backup.data.patients.length > 0 && db.patients.bulkAdd(backup.data.patients),
      backup.data.appointments && backup.data.appointments.length > 0 && db.appointments.bulkAdd(backup.data.appointments),
      backup.data.invoices && backup.data.invoices.length > 0 && db.invoices.bulkAdd(backup.data.invoices),
      backup.data.recurringInvoices && backup.data.recurringInvoices.length > 0 && db.recurringInvoices.bulkAdd(backup.data.recurringInvoices),
      backup.data.expenses && backup.data.expenses.length > 0 && db.expenses.bulkAdd(backup.data.expenses),
      backup.data.sessions && backup.data.sessions.length > 0 && db.sessions.bulkAdd(backup.data.sessions),
      backup.data.smsLogs && backup.data.smsLogs.length > 0 && db.smsLogs.bulkAdd(backup.data.smsLogs),
      backup.data.surveyResponses && backup.data.surveyResponses.length > 0 && db.surveyResponses.bulkAdd(backup.data.surveyResponses)
    ]);

    // Update settings if backup has settings data and current settings exist
    if (backup.data.settings && backup.data.settings.length > 0) {
      const currentSettings = await db.settings.toArray();
      if (currentSettings.length > 0 && currentSettings[0].id) {
        // Merge backup settings with current OAuth tokens
        const backupSettings = backup.data.settings[0];
        const mergedSettings = {
          ...backupSettings,
          google: currentSettings[0].google || backupSettings.google
        };
        await db.settings.update(currentSettings[0].id, mergedSettings);
      } else {
        await db.settings.clear();
        await db.settings.bulkAdd(backup.data.settings);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Setup automatic daily backup (stored in localStorage)
 */
export function setupAutomaticBackup(): void {
  const BACKUP_KEY = 'theraflow_auto_backup';
  const LAST_BACKUP_KEY = 'theraflow_last_backup_date';

  const performAutoBackup = async () => {
    try {
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
      const today = new Date().toISOString().split('T')[0];

      // Only backup once per day
      if (lastBackup === today) {
        return;
      }

      const backup = await exportDatabase();
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
      localStorage.setItem(LAST_BACKUP_KEY, today);
      console.log('✅ Sauvegarde automatique effectuée:', today);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde automatique:', error);
    }
  };

  // Perform backup on page load
  performAutoBackup();

  // Setup periodic check (every hour)
  setInterval(performAutoBackup, 60 * 60 * 1000);
}

/**
 * Get last automatic backup
 */
export function getLastAutoBackup(): BackupData | null {
  try {
    const backup = localStorage.getItem('theraflow_auto_backup');
    if (!backup) return null;
    return JSON.parse(backup);
  } catch (error) {
    console.error('Erreur lors de la récupération du backup automatique:', error);
    return null;
  }
}

/**
 * Get last backup date
 */
export function getLastBackupDate(): string | null {
  return localStorage.getItem('theraflow_last_backup_date');
}

/**
 * Restore from automatic backup
 */
export async function restoreFromAutoBackup(): Promise<{ success: boolean; error?: string }> {
  const backup = getLastAutoBackup();

  if (!backup) {
    return { success: false, error: 'Aucune sauvegarde automatique trouvée' };
  }

  // Create a temporary file from the backup
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const file = new File([blob], 'auto_backup.json', { type: 'application/json' });

  return importBackup(file);
}
