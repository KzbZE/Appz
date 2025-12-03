// TODO: Service de backup à adapter pour Supabase
// Supabase a son propre système de backup automatique
import { dataService } from './dataService';

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
 * Export full database to JSON (via Supabase)
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
    dataService.getPatients(),
    dataService.getAppointments(),
    dataService.getInvoices(),
    dataService.getRecurringInvoices(),
    dataService.getExpenses(),
    dataService.getSessions(),
    dataService.getSMSLogs(),
    dataService.getSurveyResponses(),
    dataService.getSettings()
  ]);

  return {
    version: 1,
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
  const link = document.createElement('a');
  link.href = url;
  link.download = `theraflow_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import backup (désactivé - utilisez l'interface Supabase)
 */
export async function importBackup(backup: BackupData): Promise<void> {
  console.warn('Import backup via Supabase dashboard recommended');
  // Pour importer des données dans Supabase, utilisez le dashboard Supabase
  // ou créez des fonctions spécifiques dans dataService
}

/**
 * Clear all data (désactivé - utilisez l'interface Supabase)
 */
export async function clearAllData(): Promise<void> {
  console.warn('Clear data via Supabase dashboard recommended');
  // Pour effacer des données, utilisez le dashboard Supabase avec précaution
}

/**
 * Setup automatic backup (désactivé - Supabase gère les backups)
 */
export function setupAutomaticBackup(): void {
  console.info('Supabase handles automatic backups');
  // Supabase gère automatiquement les backups de la base de données
  // Vous pouvez les télécharger depuis le dashboard Supabase
}

/**
 * Get last backup date (désactivé - utilisez Supabase dashboard)
 */
export function getLastBackupDate(): Date | null {
  // Avec Supabase, les backups sont gérés automatiquement
  // Consultez le dashboard Supabase pour voir les backups
  return null;
}

/**
 * Restore from auto backup (désactivé - utilisez Supabase dashboard)
 */
export async function restoreFromAutoBackup(): Promise<boolean> {
  console.warn('Restore via Supabase dashboard recommended');
  return false;
}
