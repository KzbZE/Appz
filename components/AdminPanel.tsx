import React, { useState, useEffect } from 'react';
import { Shield, Database, Activity, Settings, Key, Download, Upload, Trash2, RefreshCw, Eye, EyeOff, Terminal, Code, Lock, Unlock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'logs' | 'config' | 'api'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    googlePlaces: '',
    supabaseUrl: '',
    supabaseKey: '',
    twilioSid: '',
    twilioToken: '',
    sendgridKey: '',
    stripeSecret: '',
    stripePublishable: ''
  });

  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];

  const ADMIN_PASSWORD = 'TheraFlow2025!'; // Password par défaut - À changer!

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_session', Date.now().toString());
    } else {
      alert('❌ Mot de passe incorrect!');
    }
  };

  useEffect(() => {
    // Vérifier si session admin existe et est valide (< 1h)
    const session = localStorage.getItem('admin_session');
    if (session) {
      const sessionTime = parseInt(session);
      const now = Date.now();
      if (now - sessionTime < 3600000) { // 1 heure
        setIsAuthenticated(true);
      }
    }

    // Charger les clés API depuis .env
    setApiKeys({
      gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
      googlePlaces: import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      twilioSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
      twilioToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
      sendgridKey: import.meta.env.VITE_SENDGRID_API_KEY || '',
      stripeSecret: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
      stripePublishable: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
    });
  }, []);

  const handleExportDatabase = async () => {
    try {
      const data = {
        patients: await db.patients.toArray(),
        appointments: await db.appointments.toArray(),
        invoices: await db.invoices.toArray(),
        expenses: await db.expenses.toArray(),
        settings: await db.settings.toArray(),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theraflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Base de données exportée avec succès!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Erreur lors de l\'export');
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (confirm('⚠️ ATTENTION: Cela va REMPLACER toutes les données actuelles. Continuer?')) {
        await db.transaction('rw', [db.patients, db.appointments, db.invoices, db.expenses, db.settings], async () => {
          await db.patients.clear();
          await db.appointments.clear();
          await db.invoices.clear();
          await db.expenses.clear();
          await db.settings.clear();

          await db.patients.bulkAdd(data.patients);
          await db.appointments.bulkAdd(data.appointments);
          await db.invoices.bulkAdd(data.invoices);
          await db.expenses.bulkAdd(data.expenses);
          await db.settings.bulkAdd(data.settings);
        });

        alert('✅ Base de données importée avec succès!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Erreur lors de l\'import');
    }
  };

  const handleClearDatabase = async () => {
    if (confirm('⚠️ DANGER: Cela va SUPPRIMER TOUTES les données! Êtes-vous absolument sûr?')) {
      if (confirm('⚠️ DERNIÈRE CONFIRMATION: Toutes les données seront perdues!')) {
        try {
          await db.transaction('rw', [db.patients, db.appointments, db.invoices, db.expenses], async () => {
            await db.patients.clear();
            await db.appointments.clear();
            await db.invoices.clear();
            await db.expenses.clear();
          });
          alert('✅ Base de données vidée');
          window.location.reload();
        } catch (error) {
          console.error('Clear error:', error);
          alert('❌ Erreur lors de la suppression');
        }
      }
    }
  };

  const getDatabaseSize = async () => {
    const estimate = await navigator.storage?.estimate();
    return estimate?.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
  };

  const [dbSize, setDbSize] = useState('Calcul...');

  useEffect(() => {
    if (isAuthenticated) {
      getDatabaseSize().then(size => setDbSize(size));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full p-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Shield className="text-red-500" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Admin Panel</h2>
                <p className="text-sm text-gray-400">Accès Restreint</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                <Lock className="inline mr-2" size={16} />
                Mot de passe administrateur
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Entrez le mot de passe..."
                  className="w-full p-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Unlock className="inline mr-2" size={20} />
              Se connecter
            </button>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                ⚠️ <strong>Accès réservé aux administrateurs</strong><br />
                Mot de passe par défaut: <code className="bg-black/30 px-1 rounded">TheraFlow2025!</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] overflow-y-auto">
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Shield className="text-white" size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">🔐 Admin Panel</h1>
                <p className="text-red-100">Panneau d'administration système</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Activity className="inline mr-2" size={18} />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Database className="inline mr-2" size={18} />
            Base de données
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Key className="inline mr-2" size={18} />
            Clés API
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Settings className="inline mr-2" size={18} />
            Configuration
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Patients</p>
                  <Database className="text-blue-500" size={20} />
                </div>
                <p className="text-3xl font-black text-white">{patients.length}</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Rendez-vous</p>
                  <Database className="text-green-500" size={20} />
                </div>
                <p className="text-3xl font-black text-white">{appointments.length}</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Factures</p>
                  <Database className="text-yellow-500" size={20} />
                </div>
                <p className="text-3xl font-black text-white">{invoices.length}</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Dépenses</p>
                  <Database className="text-red-500" size={20} />
                </div>
                <p className="text-3xl font-black text-white">{expenses.length}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                <Terminal className="inline mr-2" size={20} />
                Informations Système
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Version:</span>
                  <span className="text-white">1.0.0</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Base de données:</span>
                  <span className="text-white">IndexedDB (Dexie.js)</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Taille DB:</span>
                  <span className="text-white">{dbSize}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Navigateur:</span>
                  <span className="text-white">{navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Environnement:</span>
                  <span className="text-white">{import.meta.env.MODE}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                <Database className="inline mr-2" size={20} />
                Gestion de la Base de Données
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleExportDatabase}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold transition-all"
                >
                  <Download className="inline mr-2" size={20} />
                  Exporter DB
                </button>

                <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold transition-all cursor-pointer text-center">
                  <Upload className="inline mr-2" size={20} />
                  Importer DB
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleClearDatabase}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all"
                >
                  <Trash2 className="inline mr-2" size={20} />
                  Vider DB
                </button>
              </div>

              <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  ⚠️ <strong>Attention:</strong> L'import remplacera TOUTES les données existantes. Exportez d'abord une sauvegarde!
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Tables de la Base</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 font-mono">patients</span>
                  <span className="text-white font-bold">{patients.length} enregistrements</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 font-mono">appointments</span>
                  <span className="text-white font-bold">{appointments.length} enregistrements</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 font-mono">invoices</span>
                  <span className="text-white font-bold">{invoices.length} enregistrements</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 font-mono">expenses</span>
                  <span className="text-white font-bold">{expenses.length} enregistrements</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                <Key className="inline mr-2" size={20} />
                Clés API Configurées
              </h3>

              <div className="space-y-4">
                {Object.entries(apiKeys).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-white font-mono text-sm">
                        {value ? '••••••••' + value.slice(-8) : <span className="text-red-400">Non configuré</span>}
                      </p>
                    </div>
                    <div>
                      {value ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <AlertTriangle className="text-yellow-500" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  ℹ️ <strong>Note:</strong> Pour modifier les clés API, éditez le fichier <code className="bg-black/30 px-1 rounded">.env</code> et redémarrez l'application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                <Settings className="inline mr-2" size={20} />
                Configuration Avancée
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Mode Debug</h4>
                  <p className="text-sm text-gray-400 mb-3">Affiche les logs détaillés dans la console</p>
                  <button
                    onClick={() => {
                      localStorage.setItem('debug_mode', localStorage.getItem('debug_mode') === 'true' ? 'false' : 'true');
                      alert('Mode debug ' + (localStorage.getItem('debug_mode') === 'true' ? 'activé' : 'désactivé'));
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    {localStorage.getItem('debug_mode') === 'true' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Vider le Cache</h4>
                  <p className="text-sm text-gray-400 mb-3">Supprime toutes les données en cache</p>
                  <button
                    onClick={() => {
                      caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                      });
                      alert('✅ Cache vidé');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    <RefreshCw className="inline mr-2" size={16} />
                    Vider le cache
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Reset Complet</h4>
                  <p className="text-sm text-gray-400 mb-3">Réinitialise l'application aux paramètres d'usine</p>
                  <button
                    onClick={() => {
                      if (confirm('⚠️ ATTENTION: Toutes les données et paramètres seront perdus!')) {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    <Trash2 className="inline mr-2" size={16} />
                    Reset Complet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
