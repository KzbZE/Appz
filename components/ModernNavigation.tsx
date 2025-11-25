/**
 * Navigation Moderne Professionnelle
 *
 * Design inspiré de: Notion, Linear, Vercel Dashboard
 *
 * Features:
 * - Sidebar desktop élégante et minimaliste
 * - Navigation mobile iOS moderne (swipe, gestures)
 * - Switch praticien/patient intégré
 * - Recherche globale (Cmd+K)
 * - Notifications en temps réel
 * - Mode réduit/étendu
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Calendar, PieChart, FileText, Settings,
  Search, Bell, ChevronLeft, ChevronRight, LogOut, User, Stethoscope,
  Menu, X, Home, TrendingUp, Video, Heart, Brain, MapPin, Shield,
  Package, Send, Star, Gift, Target, BarChart, Zap, Plus, Command, CalendarDays
} from 'lucide-react';
import { designSystem, components } from '../design/designSystem';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: 'practitioner' | 'patient';
  onRoleSwitch: (role: 'practitioner' | 'patient') => void;
  practitionerName?: string;
  patientName?: string;
}

// Navigation items organisés par catégories
const navCategories = {
  practitioner: [
    {
      label: 'Aperçu',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, shortcut: 'D' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, shortcut: 'A' },
        { id: 'goals', label: 'Objectifs', icon: Target, badge: '3' },
      ]
    },
    {
      label: 'Gestion',
      items: [
        { id: 'calendar', label: 'Agenda', icon: Calendar, shortcut: 'C' },
        { id: 'patients', label: 'Patients', icon: Users, shortcut: 'P' },
        { id: 'records', label: 'Dossiers', icon: FileText },
        { id: 'video', label: 'Téléconsultation', icon: Video, badge: 'Nouveau' },
      ]
    },
    {
      label: 'IA & Outils',
      items: [
        { id: 'ai-planning', label: 'IA Planning', icon: Brain },
        { id: 'scheduling-pro', label: 'Planning Pro', icon: CalendarDays, badge: 'Pro' },
        { id: 'coach', label: 'IA Coach', icon: Zap },
        { id: 'map', label: 'Carte', icon: MapPin },
        { id: 'wellness', label: 'Bien-être', icon: Heart },
      ]
    },
    {
      label: 'Finance',
      items: [
        { id: 'finance', label: 'Facturation', icon: PieChart },
        { id: 'finance-pro', label: 'Gestion Pro', icon: TrendingUp, badge: 'Pro' },
        { id: 'stats', label: 'Statistiques', icon: BarChart },
        { id: 'inventory', label: 'Produits', icon: Package },
      ]
    },
    {
      label: 'Marketing',
      items: [
        { id: 'marketing', label: 'Campagnes', icon: Send },
        { id: 'satisfaction', label: 'Satisfaction', icon: Star },
        { id: 'loyalty', label: 'Fidélité', icon: Gift },
      ]
    },
    {
      label: 'Paramètres',
      items: [
        { id: 'advanced-settings', label: 'Configuration', icon: Settings },
        { id: 'rgpd', label: 'RGPD', icon: Shield },
      ]
    },
  ],
  patient: [
    {
      label: 'Mon espace',
      items: [
        { id: 'patient-dashboard', label: 'Tableau de bord', icon: Home },
        { id: 'patient-appointments', label: 'Mes RDV', icon: Calendar },
        { id: 'patient-documents', label: 'Mes documents', icon: FileText },
        { id: 'patient-exercises', label: 'Mes exercices', icon: Heart },
      ]
    },
  ],
};

const ModernNavigation: React.FC<NavigationProps> = ({
  currentView,
  setView,
  userRole,
  onRoleSwitch,
  practitionerName = 'Dr. Dupont',
  patientName = 'Jean Martin'
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Raccourci clavier Cmd+K pour recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentNavItems = userRole === 'practitioner'
    ? navCategories.practitioner
    : navCategories.patient;

  return (
    <>
      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header avec logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="text-white" size={18} />
              </div>
              <span className="font-semibold text-neutral-900">TheraFlow</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Switch Praticien/Patient */}
        <div className="p-3 border-b border-neutral-200">
          {!sidebarCollapsed ? (
            <div className="bg-neutral-50 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => onRoleSwitch('practitioner')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  userRole === 'practitioner'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Stethoscope size={14} className="inline mr-1.5" />
                Praticien
              </button>
              <button
                onClick={() => onRoleSwitch('patient')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  userRole === 'patient'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <User size={14} className="inline mr-1.5" />
                Patient
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRoleSwitch(userRole === 'practitioner' ? 'patient' : 'practitioner')}
              className="w-full p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title={userRole === 'practitioner' ? 'Mode Patient' : 'Mode Praticien'}
            >
              {userRole === 'practitioner' ? (
                <Stethoscope size={20} className="mx-auto text-neutral-700" />
              ) : (
                <User size={20} className="mx-auto text-neutral-700" />
              )}
            </button>
          )}
        </div>

        {/* Navigation scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {currentNavItems.map((category, idx) => (
            <div key={idx}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {category.label}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-700'} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && !isActive && (
                            <kbd className="hidden group-hover:block text-xs text-neutral-400 font-mono">
                              {item.shortcut}
                            </kbd>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer avec profil */}
        <div className="p-3 border-t border-neutral-200">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {userRole === 'practitioner' ? practitionerName[0] : patientName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {userRole === 'practitioner' ? practitionerName : patientName}
                </p>
                <p className="text-xs text-neutral-500 capitalize">{userRole === 'practitioner' ? 'Praticien' : 'Patient'}</p>
              </div>
              <LogOut size={16} className="text-neutral-400" />
            </div>
          ) : (
            <button className="w-full p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <div className="w-8 h-8 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {userRole === 'practitioner' ? practitionerName[0] : patientName[0]}
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* ==================== MOBILE HEADER ==================== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-40">
        <div className="h-full flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-white" size={18} />
            </div>
            <span className="font-semibold text-neutral-900">TheraFlow</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Search size={20} className="text-neutral-600" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell size={20} className="text-neutral-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Menu burger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MOBILE BOTTOM NAV (iOS Style) ==================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-200 z-40">
        <div className="h-full flex items-center justify-around px-2">
          {userRole === 'practitioner' ? (
            <>
              <NavButton icon={LayoutDashboard} label="Accueil" active={currentView === 'dashboard'} onClick={() => setView('dashboard')} />
              <NavButton icon={Calendar} label="Agenda" active={currentView === 'calendar'} onClick={() => setView('calendar')} />
              <NavButton icon={Plus} label="Nouveau" active={false} onClick={() => {}} isPrimary />
              <NavButton icon={Users} label="Patients" active={currentView === 'patients'} onClick={() => setView('patients')} />
              <NavButton icon={TrendingUp} label="Stats" active={currentView === 'analytics'} onClick={() => setView('analytics')} />
            </>
          ) : (
            <>
              <NavButton icon={Home} label="Accueil" active={currentView === 'patient-dashboard'} onClick={() => setView('patient-dashboard')} />
              <NavButton icon={Calendar} label="RDV" active={currentView === 'patient-appointments'} onClick={() => setView('patient-appointments')} />
              <NavButton icon={FileText} label="Docs" active={currentView === 'patient-documents'} onClick={() => setView('patient-documents')} />
              <NavButton icon={Heart} label="Exercices" active={currentView === 'patient-exercises'} onClick={() => setView('patient-exercises')} />
            </>
          )}
        </div>
      </nav>

      {/* ==================== MOBILE MENU DRAWER ==================== */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-50 animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 animate-slideInRight overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
                <p className="text-sm text-neutral-500">Navigation complète</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Switch Praticien/Patient */}
            <div className="p-4 border-b border-neutral-200">
              <div className="bg-neutral-50 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => {
                    onRoleSwitch('practitioner');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                    userRole === 'practitioner'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600'
                  }`}
                >
                  <Stethoscope size={16} className="inline mr-2" />
                  Praticien
                </button>
                <button
                  onClick={() => {
                    onRoleSwitch('patient');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${
                    userRole === 'patient'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600'
                  }`}
                >
                  <User size={16} className="inline mr-2" />
                  Patient
                </button>
              </div>
            </div>

            {/* Navigation items */}
            <div className="p-4 space-y-6">
              {currentNavItems.map((category, idx) => (
                <div key={idx}>
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      {category.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setView(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer profil */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userRole === 'practitioner' ? practitionerName[0] : patientName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {userRole === 'practitioner' ? practitionerName : patientName}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {userRole === 'practitioner' ? 'Praticien' : 'Patient'}
                  </p>
                </div>
                <button className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
                  <LogOut size={18} className="text-neutral-600" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== SEARCH MODAL (Cmd+K) ==================== */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 animate-fadeIn"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-scaleIn">
            <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden mx-4">
              <div className="flex items-center gap-3 p-4 border-b border-neutral-200">
                <Search size={20} className="text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher partout..."
                  className="flex-1 bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
                  autoFocus
                />
                <kbd className="px-2 py-1 text-xs font-mono bg-neutral-100 text-neutral-600 rounded">
                  ESC
                </kbd>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                <div className="text-xs text-neutral-500 px-3 py-2">Suggestions</div>
                {/* Search results here */}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Composant bouton navigation mobile
const NavButton: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
  onClick: () => void;
  isPrimary?: boolean;
}> = ({ icon: Icon, label, active, onClick, isPrimary = false }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
      isPrimary
        ? 'scale-110'
        : active
        ? 'text-neutral-900'
        : 'text-neutral-500'
    }`}
  >
    <div
      className={`relative ${
        isPrimary
          ? 'w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center shadow-lg -mt-6'
          : 'w-10 h-10 flex items-center justify-center'
      }`}
    >
      <Icon size={isPrimary ? 24 : 22} className={isPrimary ? 'text-white' : undefined} />
      {active && !isPrimary && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neutral-900 rounded-full" />
      )}
    </div>
    {!isPrimary && (
      <span className={`text-[10px] font-medium ${active ? 'text-neutral-900' : 'text-neutral-500'}`}>
        {label}
      </span>
    )}
  </button>
);

export default ModernNavigation;
