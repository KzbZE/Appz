import React from 'react';
import { LayoutDashboard, Users, TrendingUp, Calendar, Settings, PieChart, BarChart, FileText, Bell } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const settings = useLiveQuery(() => db.settings.toArray())?.[0];

  const navItems = [
    { id: 'dashboard', label: 'Pilotage', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'records', label: 'Dossiers', icon: FileText },
    { id: 'coach', label: 'IA Coach', icon: TrendingUp },
    { id: 'finance', label: 'Finance', icon: PieChart },
    { id: 'reminders', label: 'Rappels', icon: Bell },
    { id: 'stats', label: 'Stats', icon: BarChart },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'records', label: 'Dossiers', icon: FileText },
    { id: 'finance', label: 'Finance', icon: PieChart },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:flex flex-col w-64 bg-slate-850 text-white h-full fixed left-0 top-0 shadow-xl z-50">
        <div className="p-6 flex flex-col items-start">
            {settings?.branding?.logoUrl ? (
                 <img src={settings.branding.logoUrl} alt="Logo" className="h-16 w-auto mb-3 object-contain bg-white/10 rounded p-1" />
            ) : (
                <div className="h-12 w-12 bg-primary-600 rounded-lg mb-3 flex items-center justify-center text-xl font-bold text-white">
                    {settings?.appName?.substring(0,1) || 'T'}
                </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-primary-100">
                {settings?.appName || 'TheraFlow'}
                <span className="text-primary-500">.</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Edition Hybride</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
            <button 
                onClick={() => setView('settings')}
                className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${currentView === 'settings' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
                <Settings size={18} className="mr-2" />
                <span className="text-sm">Paramètres</span>
            </button>
        </div>
      </div>
    </>
  );
};

export default Navigation;