// TODO: Service de migration Dexie → Supabase (plus nécessaire car migration terminée)
// Ce service était utilisé pour migrer les données de Dexie vers Supabase
// La migration étant terminée, ce service n'est plus nécessaire
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
 * Service de migration désactivé (migration Dexie → Supabase déjà terminée)
 */
export class MigrationService {
  private progressCallback?: (progress: MigrationProgress[]) => void;

  constructor(onProgress?: (progress: MigrationProgress[]) => void) {
    this.progressCallback = onProgress;
  }

  /**
   * Migration désactivée - utilise maintenant directement Supabase
   */
  async migrateAllData(): Promise<MigrationResult> {
    console.warn('Migration service is disabled - app now uses Supabase directly');
    return {
      success: true,
      tablesProcessed: 0,
      totalRecords: 0,
      errors: [],
      progress: []
    };
  }

  /**
   * Vérification désactivée - app utilise Supabase
   */
  async checkMigrationStatus(): Promise<boolean> {
    return true; // Migration déjà faite
  }
}

export const migrationService = new MigrationService();
