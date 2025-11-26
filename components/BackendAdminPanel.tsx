import React, { useState, useEffect } from 'react';
import { authService, AuthUser } from '../services/authService';
import { featuresService, SystemConfig } from '../services/featuresService';
import { Shield, Users, Key, Settings, LogOut, Save } from 'lucide-react';

const BackendAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'apikeys' | 'features'>('users');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(featuresService.getSystemConfig());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const usersList = await authService.getAllUsersForAdmin();
    setUsers(usersList);
    setIsLoading(false);
  };

  const handleSaveApiKeys = () => {
    featuresService.saveSystemConfig(systemConfig);
    alert('✅ Clés API sauvegardées');
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      const success = await authService.deleteUser(userId);
      if (success) {
        await loadUsers();
        alert('✅ Utilisateur supprimé');
      } else {
        alert('❌ Impossible de supprimer l\'utilisateur (nécessite configuration Supabase)');
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Shield className="text-purple-400" size={40} />
            <div>
              <h1 className="text-3xl font-black">Backend Admin</h1>
              <p className="text-slate-400">Configuration système TheraFlow (Supabase)</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          {[
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'apikeys', label: 'Clés API', icon: Key },
            { id: 'features', label: 'Features', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-slate-400">Chargement...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 bg-slate-700 rounded-lg">
                <Users size={48} className="mx-auto mb-4 text-slate-500" />
                <p className="text-slate-400">Aucun utilisateur trouvé</p>
                <p className="text-xs text-slate-500 mt-2">
                  Créez des utilisateurs via Supabase Dashboard ou l'onboarding
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
                    <div>
                      <p className="font-bold">{user.name || 'Sans nom'}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        user.role === 'ADMIN' ? 'bg-red-600' : user.role === 'PRACTITIONER' ? 'bg-teal-600' : 'bg-blue-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'apikeys' && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Clés API Système</h2>
            <div className="space-y-4">
              {[
                { key: 'geminiApiKey', label: 'Google Gemini API Key', placeholder: 'AIza...' },
                { key: 'openaiApiKey', label: 'OpenAI API Key', placeholder: 'sk-...' },
                { key: 'anthropicApiKey', label: 'Anthropic Claude API Key', placeholder: 'sk-ant-...' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold mb-2">{field.label}</label>
                  <input
                    type="password"
                    value={(systemConfig as any)[field.key] || ''}
                    onChange={(e) => setSystemConfig({ ...systemConfig, [field.key]: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <button onClick={handleSaveApiKeys} className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 font-bold">
                <Save size={20} /> Sauvegarder
              </button>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Fonctionnalités système</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(systemConfig.features).map(([key, enabled]) => (
                <label key={key} className="flex items-center gap-3 bg-slate-700 p-4 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSystemConfig({
                      ...systemConfig,
                      features: { ...systemConfig.features, [key]: e.target.checked }
                    })}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">{key}</span>
                </label>
              ))}
            </div>
            <button onClick={() => featuresService.saveSystemConfig(systemConfig)} className="mt-6 flex items-center gap-2 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 font-bold">
              <Save size={20} /> Sauvegarder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendAdminPanel;
