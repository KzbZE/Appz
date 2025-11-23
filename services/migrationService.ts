import { db } from '../db';
import { supabase, toSnakeCase, isSupabaseConfigured } from '../lib/supabase';

export interface MigrationProgress {
  table: string;
  current: number;
  total: number;
  status: 'pending' | 'migrating' | 'completed' | 'error';
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  tablesProcessed: number;
  totalRecords: number;
  errors: string[];
  progress: MigrationProgress[];
}

/**
 * Service de migration des données IndexedDB → Supabase
 * Transfère toutes les données locales vers le cloud de manière sécurisée
 */
export class MigrationService {
  private progressCallback?: (progress: MigrationProgress[]) => void;

  constructor(onProgress?: (progress: MigrationProgress[]) => void) {
    this.progressCallback = onProgress;
  }

  /**
   * Vérifie si la migration est nécessaire et possible
   */
  async checkMigrationStatus(): Promise<{
    hasLocalData: boolean;
    hasSupabaseData: boolean;
    supabaseConfigured: boolean;
  }> {
    const hasLocalData = await this.hasLocalData();
    const supabaseConfigured = isSupabaseConfigured();

    let hasSupabaseData = false;
    if (supabaseConfigured) {
      const { count } = await supabase.from('patients').select('id', { count: 'exact', head: true });
      hasSupabaseData = (count || 0) > 0;
    }

    return {
      hasLocalData,
      hasSupabaseData,
      supabaseConfigured
    };
  }

  /**
   * Vérifie si des données locales existent
   */
  private async hasLocalData(): Promise<boolean> {
    const patientCount = await db.patients.count();
    const appointmentCount = await db.appointments.count();
    return patientCount > 0 || appointmentCount > 0;
  }

  /**
   * Migre toutes les données vers Supabase
   */
  async migrateAllData(): Promise<MigrationResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        tablesProcessed: 0,
        totalRecords: 0,
        errors: ['Supabase non configuré. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY'],
        progress: []
      };
    }

    const result: MigrationResult = {
      success: true,
      tablesProcessed: 0,
      totalRecords: 0,
      errors: [],
      progress: []
    };

    // Tables à migrer (ordre important pour les foreign keys)
    const tables = [
      'settings',
      'patients',
      'appointments',
      'invoices',
      'recurring_invoices',
      'expenses',
      'sessions',
      'sms_logs',
      'survey_responses',
      'goals',
      'loyalty_cards',
      'loyalty_transactions',
      'referrals',
      'promotions'
    ];

    for (const table of tables) {
      const progress: MigrationProgress = {
        table,
        current: 0,
        total: 0,
        status: 'pending'
      };
      result.progress.push(progress);
    }

    try {
      // 1. Migrer Settings (table unique)
      await this.migrateSettings(result);

      // 2. Migrer Patients (table principale)
      await this.migrateTable('patients', db.patients, result);

      // 3. Migrer Appointments
      await this.migrateTable('appointments', db.appointments, result);

      // 4. Migrer Invoices
      await this.migrateTable('invoices', db.invoices, result);

      // 5. Migrer Recurring Invoices
      await this.migrateTable('recurring_invoices', db.recurringInvoices, result);

      // 6. Migrer Expenses
      await this.migrateTable('expenses', db.expenses, result);

      // 7. Migrer Sessions
      await this.migrateTable('sessions', db.sessions, result);

      // 8. Migrer SMS Logs
      await this.migrateTable('sms_logs', db.smsLogs, result);

      // 9. Migrer Survey Responses
      await this.migrateTable('survey_responses', db.surveyResponses, result);

      // 10. Migrer Goals
      await this.migrateTable('goals', db.goals, result);

      // 11. Migrer Loyalty Cards
      await this.migrateTable('loyalty_cards', db.loyaltyCards, result);

      // 12. Migrer Loyalty Transactions
      await this.migrateTable('loyalty_transactions', db.loyaltyTransactions, result);

      // 13. Migrer Referrals
      await this.migrateTable('referrals', db.referrals, result);

      // 14. Migrer Promotions
      await this.migrateTable('promotions', db.promotions, result);

    } catch (error) {
      result.success = false;
      result.errors.push(`Erreur critique: ${error}`);
    }

    return result;
  }

  /**
   * Migre une table spécifique
   */
  private async migrateTable(
    tableName: string,
    dexieTable: any,
    result: MigrationResult
  ): Promise<void> {
    const progressIndex = result.progress.findIndex(p => p.table === tableName);
    if (progressIndex === -1) return;

    const progress = result.progress[progressIndex];

    try {
      progress.status = 'migrating';
      this.notifyProgress(result.progress);

      // Récupérer toutes les données locales
      const localData = await dexieTable.toArray();
      progress.total = localData.length;

      if (localData.length === 0) {
        progress.status = 'completed';
        this.notifyProgress(result.progress);
        return;
      }

      // Convertir camelCase → snake_case
      const snakeCaseData = localData.map((record: any) => {
        const { id, ...rest } = record; // Retirer l'ID pour laisser Supabase générer
        return toSnakeCase(rest);
      });

      // Batch insert (Supabase supporte jusqu'à 1000 records)
      const batchSize = 500;
      for (let i = 0; i < snakeCaseData.length; i += batchSize) {
        const batch = snakeCaseData.slice(i, i + batchSize);

        const { error } = await supabase
          .from(tableName)
          .insert(batch);

        if (error) {
          throw new Error(`Erreur migration ${tableName}: ${error.message}`);
        }

        progress.current = Math.min(i + batchSize, snakeCaseData.length);
        this.notifyProgress(result.progress);
      }

      progress.status = 'completed';
      result.tablesProcessed++;
      result.totalRecords += localData.length;
      this.notifyProgress(result.progress);

    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : String(error);
      result.errors.push(`[${tableName}] ${progress.error}`);
      this.notifyProgress(result.progress);
    }
  }

  /**
   * Migre les settings (cas spécial: table unique)
   */
  private async migrateSettings(result: MigrationResult): Promise<void> {
    const progressIndex = result.progress.findIndex(p => p.table === 'settings');
    if (progressIndex === -1) return;

    const progress = result.progress[progressIndex];

    try {
      progress.status = 'migrating';
      this.notifyProgress(result.progress);

      const localSettings = await db.settings.toArray();
      progress.total = localSettings.length;

      if (localSettings.length > 0) {
        const settings = localSettings[0];
        const { id, ...rest } = settings;
        const snakeCaseSettings = toSnakeCase(rest);

        // Vérifier si des settings existent déjà
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .limit(1);

        if (existing && existing.length > 0) {
          // Update
          const { error } = await supabase
            .from('settings')
            .update(snakeCaseSettings)
            .eq('id', existing[0].id);

          if (error) throw new Error(`Erreur update settings: ${error.message}`);
        } else {
          // Insert
          const { error } = await supabase
            .from('settings')
            .insert(snakeCaseSettings);

          if (error) throw new Error(`Erreur insert settings: ${error.message}`);
        }

        progress.current = 1;
        result.totalRecords++;
      }

      progress.status = 'completed';
      result.tablesProcessed++;
      this.notifyProgress(result.progress);

    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : String(error);
      result.errors.push(`[settings] ${progress.error}`);
      this.notifyProgress(result.progress);
    }
  }

  /**
   * Notifie la progression
   */
  private notifyProgress(progress: MigrationProgress[]): void {
    if (this.progressCallback) {
      this.progressCallback([...progress]);
    }
  }

  /**
   * Supprime toutes les données locales (après migration réussie)
   */
  async clearLocalData(): Promise<void> {
    await db.promotions.clear();
    await db.referrals.clear();
    await db.loyaltyTransactions.clear();
    await db.loyaltyCards.clear();
    await db.goals.clear();
    await db.surveyResponses.clear();
    await db.smsLogs.clear();
    await db.sessions.clear();
    await db.expenses.clear();
    await db.recurringInvoices.clear();
    await db.invoices.clear();
    await db.appointments.clear();
    await db.patients.clear();
    // Conserver settings localement pour le cache
  }

  /**
   * Sauvegarde complète des données locales (backup avant migration)
   */
  async exportLocalDataAsBackup(): Promise<Blob> {
    const backup = {
      exportDate: new Date().toISOString(),
      version: 'v1.0',
      tables: {
        settings: await db.settings.toArray(),
        patients: await db.patients.toArray(),
        appointments: await db.appointments.toArray(),
        invoices: await db.invoices.toArray(),
        recurringInvoices: await db.recurringInvoices.toArray(),
        expenses: await db.expenses.toArray(),
        sessions: await db.sessions.toArray(),
        smsLogs: await db.smsLogs.toArray(),
        surveyResponses: await db.surveyResponses.toArray(),
        goals: await db.goals.toArray(),
        loyaltyCards: await db.loyaltyCards.toArray(),
        loyaltyTransactions: await db.loyaltyTransactions.toArray(),
        referrals: await db.referrals.toArray(),
        promotions: await db.promotions.toArray()
      }
    };

    return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
