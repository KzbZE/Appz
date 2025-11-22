import React, { useState, useEffect } from 'react';
import { Database, Cloud, Download, AlertTriangle, CheckCircle, Loader, ArrowRight, X } from 'lucide-react';
import { MigrationService, MigrationProgress } from '../services/migrationService';
import { isSupabaseConfigured } from '../lib/supabase';

const MigrationWizard: React.FC = () => {
  const [step, setStep] = useState<'check' | 'backup' | 'migrate' | 'complete'>('check');
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{
    hasLocalData: boolean;
    hasSupabaseData: boolean;
    supabaseConfigured: boolean;
  } | null>(null);

  const migrationService = new MigrationService(setMigrationProgress);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const status = await migrationService.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (err) {
      setError('Erreur lors de la vérification du statut');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backup = await migrationService.exportLocalDataAsBackup();
      const url = URL.createObjectURL(backup);
      const link = document.createElement('a');
      link.href = url;
      link.download = `theraflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('✅ Sauvegarde créée avec succès !');
      setStep('migrate');
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!migrationStatus?.supabaseConfigured) {
      setError('Supabase non configuré. Veuillez configurer les variables d\'environnement.');
      return;
    }

    const confirmed = confirm(
      '⚠️ MIGRATION VERS SUPABASE\n\n' +
      'Cette opération va transférer toutes vos données locales vers le cloud.\n\n' +
      'Assurez-vous d\'avoir:\n' +
      '1. Créé une sauvegarde (étape précédente)\n' +
      '2. Configuré correctement Supabase\n' +
      '3. Exécuté le schema.sql dans votre projet Supabase\n\n' +
      'Continuer ?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await migrationService.migrateAllData();

      if (result.success) {
        alert(
          `✅ Migration réussie !\n\n` +
          `Tables migrées: ${result.tablesProcessed}\n` +
          `Enregistrements: ${result.totalRecords}`
        );
        setStep('complete');
      } else {
        setError(`Erreurs détectées:\n${result.errors.join('\n')}`);
      }
    } catch (err) {
      setError('Erreur critique lors de la migration: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocal = async () => {
    const confirmed = confirm(
      '⚠️ ATTENTION: Suppression des données locales\n\n' +
      'Cette action va supprimer TOUTES les données locales IndexedDB.\n' +
      'Assurez-vous que la migration vers Supabase est réussie.\n\n' +
      'Continuer ?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await migrationService.clearLocalData();
      alert('✅ Données locales supprimées avec succès !');
      await checkStatus();
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'migrating': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'migrating': return <Loader size={16} className="text-blue-600 animate-spin" />;
      case 'error': return <AlertTriangle size={16} className="text-red-600" />;
      default: return null;
    }
  };

  if (!migrationStatus && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={48} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Cloud size={24} className="text-blue-600" />
            Migration vers Supabase
          </h3>
          <p className="text-sm text-slate-500">Migrez vos données locales vers le cloud</p>
        </div>
      </div>

      {/* Status Banner */}
      {migrationStatus && (
        <div className={`rounded-xl border-2 p-5 ${
          !migrationStatus.supabaseConfigured
            ? 'bg-orange-50 border-orange-200'
            : migrationStatus.hasSupabaseData
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {!migrationStatus.supabaseConfigured ? (
              <AlertTriangle size={24} className="text-orange-600 flex-shrink-0" />
            ) : migrationStatus.hasSupabaseData ? (
              <CheckCircle size={24} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <Database size={24} className="text-blue-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="font-bold mb-2">
                {!migrationStatus.supabaseConfigured
                  ? '⚠️ Configuration Supabase requise'
                  : migrationStatus.hasSupabaseData
                  ? '✅ Données Supabase détectées'
                  : '📊 Données locales prêtes'}
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  {migrationStatus.hasLocalData ? (
                    <CheckCircle size={14} className="text-emerald-600" />
                  ) : (
                    <X size={14} className="text-slate-400" />
                  )}
                  <span>Données locales: {migrationStatus.hasLocalData ? 'Présentes' : 'Aucune'}</span>
                </li>
                <li className="flex items-center gap-2">
                  {migrationStatus.hasSupabaseData ? (
                    <CheckCircle size={14} className="text-emerald-600" />
                  ) : (
                    <X size={14} className="text-slate-400" />
                  )}
                  <span>Données Supabase: {migrationStatus.hasSupabaseData ? 'Présentes' : 'Aucune'}</span>
                </li>
                <li className="flex items-center gap-2">
                  {migrationStatus.supabaseConfigured ? (
                    <CheckCircle size={14} className="text-emerald-600" />
                  ) : (
                    <X size={14} className="text-orange-600" />
                  )}
                  <span>Configuration: {migrationStatus.supabaseConfigured ? 'OK' : 'Manquante'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-1">Erreur</h4>
              <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Instructions */}
      {!migrationStatus?.supabaseConfigured && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database size={20} />
            Configuration Supabase
          </h4>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-bold text-teal-600 flex-shrink-0">1.</span>
              <div>
                <strong>Créez un projet Supabase:</strong>
                <br />
                <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://app.supabase.com
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-600 flex-shrink-0">2.</span>
              <div>
                <strong>Exécutez le schema SQL:</strong>
                <br />
                Dans l'éditeur SQL de Supabase, copiez et exécutez le contenu de <code className="bg-slate-100 px-2 py-0.5 rounded">supabase/schema.sql</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-600 flex-shrink-0">3.</span>
              <div>
                <strong>Configurez les variables d'environnement:</strong>
                <br />
                Créez un fichier <code className="bg-slate-100 px-2 py-0.5 rounded">.env</code> avec:
                <pre className="bg-slate-800 text-green-400 p-3 rounded mt-2 text-xs overflow-x-auto">
VITE_SUPABASE_URL=https://votre-projet.supabase.co{'\n'}
VITE_SUPABASE_ANON_KEY=votre_anon_key
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-teal-600 flex-shrink-0">4.</span>
              <div>
                <strong>Redémarrez le serveur de développement</strong>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Migration Steps */}
      {migrationStatus?.supabaseConfigured && migrationStatus.hasLocalData && (
        <div className="space-y-4">
          {/* Step 1: Backup */}
          <div className={`bg-white rounded-xl border-2 p-5 transition-all ${
            step === 'backup' ? 'border-blue-400 shadow-lg' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  step === 'complete' ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  <Download size={20} className={step === 'complete' ? 'text-emerald-600' : 'text-blue-600'} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Étape 1: Sauvegarde</h4>
                  <p className="text-xs text-slate-500">Créer une copie de sécurité</p>
                </div>
              </div>
              {step === 'backup' && (
                <button
                  onClick={handleBackup}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                  Télécharger Backup
                </button>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Créez une sauvegarde complète de vos données locales avant la migration.
            </p>
          </div>

          {/* Step 2: Migration */}
          <div className={`bg-white rounded-xl border-2 p-5 transition-all ${
            step === 'migrate' ? 'border-blue-400 shadow-lg' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  step === 'complete' ? 'bg-emerald-100' : 'bg-purple-100'
                }`}>
                  <Cloud size={20} className={step === 'complete' ? 'text-emerald-600' : 'text-purple-600'} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Étape 2: Migration</h4>
                  <p className="text-xs text-slate-500">Transférer vers Supabase</p>
                </div>
              </div>
              {step === 'migrate' && (
                <button
                  onClick={handleMigrate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Lancer Migration
                </button>
              )}
            </div>

            {/* Progress Bars */}
            {migrationProgress.length > 0 && (
              <div className="space-y-2 mt-4">
                {migrationProgress.map(progress => (
                  <div key={progress.table} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {getProgressIcon(progress.status)}
                        <span className="font-semibold text-slate-700">{progress.table}</span>
                      </div>
                      <span className="text-slate-500">
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getProgressColor(progress.status)}`}
                        style={{
                          width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    {progress.error && (
                      <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={32} />
                <div>
                  <h4 className="font-bold text-xl">Migration réussie ! 🎉</h4>
                  <p className="text-sm opacity-90">Vos données sont maintenant dans le cloud</p>
                </div>
              </div>
              <button
                onClick={handleClearLocal}
                disabled={isLoading}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer données locales (optionnel)
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Local Data */}
      {migrationStatus?.supabaseConfigured && !migrationStatus.hasLocalData && (
        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
          <Database size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Aucune donnée locale à migrer</p>
        </div>
      )}

      {/* Action Buttons */}
      {step === 'check' && migrationStatus?.hasLocalData && migrationStatus.supabaseConfigured && (
        <div className="flex justify-center">
          <button
            onClick={() => setStep('backup')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            Commencer la Migration <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MigrationWizard;
