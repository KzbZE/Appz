import React, { useState } from 'react';
import { LayoutDashboard, Users, TrendingUp, Calendar, Settings, PieChart, BarChart, FileText, Bell, CalendarDays, FileCode, Send, Package, Zap, Star, Gift, Shield, Target, Cloud, Menu, X, FileSpreadsheet, LogOut } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const settings = useLiveQuery(() => db.settings.toArray())?.[0];
  const [showFullMenu, setShowFullMenu] = useState(false);
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Pilotage', icon: LayoutDashboard, gradient: 'from-teal-500 to-cyan-600' },
    { id: 'goals', label: 'Objectifs', icon: Target, gradient: 'from-indigo-500 to-purple-600' },
    { id: 'calendar', label: 'Agenda', icon: Calendar, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'planner', label: 'Planning', icon: CalendarDays, gradient: 'from-cyan-500 to-teal-600' },
    { id: 'patients', label: 'Patients', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'records', label: 'Dossiers', icon: FileText, gradient: 'from-amber-500 to-orange-600' },
    { id: 'templates', label: 'Templates', icon: FileCode, gradient: 'from-blue-600 to-cyan-600' },
    { id: 'coach', label: 'IA Coach', icon: TrendingUp, gradient: 'from-indigo-500 to-blue-600' },
    { id: 'finance', label: 'Finance', icon: PieChart, gradient: 'from-green-500 to-emerald-600' },
    { id: 'urssaf', label: 'URSSAF', icon: FileSpreadsheet, gradient: 'from-blue-500 to-indigo-500' },
    { id: 'inventory', label: 'Produits', icon: Package, gradient: 'from-yellow-500 to-amber-600' },
    { id: 'loyalty', label: 'Fidélité', icon: Gift, gradient: 'from-purple-500 to-pink-600' },
    { id: 'marketing', label: 'Marketing', icon: Send, gradient: 'from-teal-500 to-cyan-500' },
    { id: 'satisfaction', label: 'Satisfaction', icon: Star, gradient: 'from-pink-500 to-rose-600' },
    { id: 'reminders', label: 'Rappels', icon: Bell, gradient: 'from-red-500 to-orange-600' },
    { id: 'migration', label: 'Migration Cloud', icon: Cloud, gradient: 'from-sky-500 to-blue-600' },
    { id: 'rgpd', label: 'RGPD', icon: Shield, gradient: 'from-blue-600 to-cyan-700' },
    { id: 'stats', label: 'Stats', icon: BarChart, gradient: 'from-blue-600 to-indigo-600' },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard, gradient: 'from-teal-500 to-cyan-600' },
    { id: 'patients', label: 'Patients', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'calendar', label: 'Agenda', icon: Calendar, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'finance', label: 'Finance', icon: PieChart, gradient: 'from-green-500 to-emerald-600' },
  ];

  const handleMenuItemClick = (id: string) => {
    setView(id);
    setShowFullMenu(false);
  };

  return (
    <>
      {/* MOBILE NAVIGATION - Zoho Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-2xl">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 rounded-2xl m-1`}></div>
                )}
                <div className={`relative z-10 flex flex-col items-center ${
                  isActive ? '' : 'opacity-60'
                }`}>
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                      : 'text-gray-500'
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${
                    isActive ? 'text-slate-800' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setShowFullMenu(true)}
            className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col items-center opacity-60">
              <div className="p-2 rounded-xl transition-all duration-300 text-gray-500">
                <Menu size={20} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold mt-1 text-gray-500">
                Menu
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* FULL MENU DRAWER - Mobile */}
      {showFullMenu && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60 animate-fadeIn" onClick={() => setShowFullMenu(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Menu Complet</h3>
                <p className="text-xs text-slate-300">Toutes les sections</p>
              </div>
              <button
                onClick={() => setShowFullMenu(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-3 gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-slate-100 to-slate-50 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`p-3 rounded-xl mb-2 bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                        <Icon size={24} strokeWidth={2} />
                      </div>
                      <span className="text-xs font-bold text-center text-slate-700 leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                {/* Settings */}
                <button
                  onClick={() => handleMenuItemClick('settings')}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                    currentView === 'settings'
                      ? 'bg-gradient-to-br from-slate-100 to-slate-50 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="p-3 rounded-xl mb-2 bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg">
                    <Settings size={24} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-bold text-center text-slate-700 leading-tight">
                    Paramètres
                  </span>
                </button>
              </div>

              {/* User Info & Logout - Mobile */}
              {user && (
                <div className="mt-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Connecté en tant que</p>
                  <p className="text-sm text-slate-800 font-bold mb-3 truncate">{user.email}</p>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-200"
                  >
                    <LogOut size={18} strokeWidth={2} className="mr-2" />
                    <span className="text-sm font-bold">Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP NAVIGATION - Zoho Style: Blue Marine */}
      <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white h-full fixed left-0 top-0 shadow-2xl z-50 border-r border-slate-700/50">
        {/* Header avec effet moderne */}
        <div className="relative p-6 flex flex-col items-start overflow-hidden border-b border-slate-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-cyan-600/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 w-full">
            {settings?.branding?.logoUrl ? (
              <img src={settings.branding.logoUrl} alt="Logo" className="h-16 w-auto mb-3 object-contain bg-white/5 rounded-xl p-2 border border-white/10" />
            ) : (
              <div className="h-14 w-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-3 flex items-center justify-center text-2xl font-black text-white shadow-xl transform hover:scale-105 transition-transform">
                {settings?.appName?.substring(0,1) || 'T'}
              </div>
            )}
            <h1 className="text-2xl font-black tracking-tight text-white">
              {settings?.appName || 'TheraFlow'}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <Zap size={12} className="text-teal-400" />
              <p className="text-xs font-bold text-teal-300">Edition Pro</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`group relative flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'shadow-lg transform scale-105'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-100`}></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50"></div>
                  </>
                )}

                <div className={`relative z-10 flex items-center w-full ${
                  isActive ? 'text-white' : 'text-slate-300'
                }`}>
                  <div className={`mr-3 p-1.5 rounded-lg transition-all ${
                    isActive ? 'bg-white/20' : 'group-hover:bg-slate-700/50'
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-sm font-bold ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-lg"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout Buttons */}
        <div className="p-3 border-t border-slate-800/50 space-y-2">
          {/* User Info */}
          {user && (
            <div className="px-4 py-2 mb-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 font-bold uppercase">Connecté en tant que</p>
              <p className="text-sm text-white font-bold truncate">{user.email}</p>
            </div>
          )}

          <button
            onClick={() => setView('settings')}
            className={`group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 ${
              currentView === 'settings'
                ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-xl'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className={`mr-3 p-1.5 rounded-lg transition-all ${
              currentView === 'settings' ? 'bg-white/20' : 'group-hover:bg-slate-700/50'
            }`}>
              <Settings size={18} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
            </div>
            <span className="text-sm font-bold">Paramètres</span>
          </button>

          <button
            onClick={signOut}
            className="group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50"
          >
            <div className="mr-3 p-1.5 rounded-lg transition-all group-hover:bg-red-500/20">
              <LogOut size={18} strokeWidth={2} />
            </div>
            <span className="text-sm font-bold">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Navigation;
