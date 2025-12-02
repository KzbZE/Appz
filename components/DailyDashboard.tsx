
import React, { useState, useEffect } from 'react';
import { Appointment, ApptStatus, AppSettings, Patient, PatientType } from '../types';
import { MapPin, Clock, Navigation as NavIcon, CloudRain, Zap, Users, Search, GripVertical, Calendar, TrendingUp, BarChart2, Smartphone, Sparkles, ArrowRight, Sun, Bell } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AppointmentRequestManager from './AppointmentRequestManager';

interface DailyDashboardProps {
  appointments: Appointment[];
  patients: Patient[];
  settings: AppSettings;
  onStartSession: (appt: Appointment) => void;
  onQuickSession: () => void;
}

const DailyDashboard: React.FC<DailyDashboardProps> = ({ appointments, patients, settings, onStartSession, onQuickSession }) => {
  const [viewMode, setViewMode] = useState<'FIELD' | 'STRATEGY' | 'CLIENTS'>('FIELD');
  const [clientSearch, setClientSearch] = useState('');
  const [recentClients, setRecentClients] = useState<Patient[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const nextAppt = appointments?.find(a => a.status === ApptStatus.SCHEDULED);

  useEffect(() => {
    if (patients) {
        const sorted = [...patients]
            .sort((a, b) => new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime())
            .slice(0, 5);
        setRecentClients(sorted);
    }
  }, [patients]);

  // Data preparation for charts
  const getChartData = () => {
    const days = 7;
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const dayAppts = appointments.filter(a =>
            a.status === ApptStatus.COMPLETED &&
            a.startTime.startsWith(dateStr)
        );

        const revenue = dayAppts.reduce((acc, curr) => acc + (curr.price || 0) + (curr.travelFee || 0), 0);

        data.push({
            name: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
            revenue: revenue,
            sessions: dayAppts.length
        });
    }
    return data;
  };

  const chartData = getChartData();
  const totalRevenueWeek = chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalSessionsWeek = chartData.reduce((acc, curr) => acc + curr.sessions, 0);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedList = [...(clientSearch ? displayClients : recentClients)];
    const [movedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    if (!clientSearch) {
        setRecentClients(updatedList);
    }
    setDraggedIndex(null);
  };

  const displayClients = patients && clientSearch
    ? patients.filter(p => p.name.toLowerCase().includes(clientSearch.toLowerCase()) || (p.ownerName && p.ownerName.toLowerCase().includes(clientSearch.toLowerCase()))).slice(0, 5)
    : recentClients;

  const renderFieldView = () => (
    <div className="space-y-6 pb-24 md:pb-0 animate-fadeIn">
        {/* Header Card - Zoho Style: Blue Marine + Teal */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sun size={16} className="text-amber-400 animate-pulse" />
                            <p className="text-teal-200 text-xs font-bold tracking-wider uppercase">
                                Bonjour {settings?.practitionerName || 'Praticien'}
                            </p>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h1>
                    </div>
                    <div className="flex items-center bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
                        <CloudRain size={18} className="text-cyan-300 mr-2" />
                        <span className="text-sm font-bold">Pluie 14h</span>
                    </div>
                </div>

                <button
                    onClick={onQuickSession}
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 font-black text-base group"
                >
                    <Zap size={22} className="mr-3 text-yellow-200 fill-current group-hover:animate-pulse" />
                    Séance Flash (Sans RDV)
                    <ArrowRight size={20} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                {nextAppt ? (
                    <div className="mt-6 bg-white/10 border-2 border-teal-400/30 p-5 rounded-2xl backdrop-blur-xl shadow-lg shadow-teal-500/20">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center text-teal-100 text-sm font-bold">
                                <Clock size={16} className="mr-2" />
                                PROCHAIN RDV • {new Date(nextAppt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex items-center px-4 py-2 rounded-xl shadow-lg transition-all transform hover:scale-105 text-xs font-black">
                                <NavIcon size={14} className="mr-2" /> Waze
                            </button>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
                            {nextAppt.notes?.split(' - ')[0] || "Patient"}
                        </h3>
                        <p className="text-sm text-cyan-100 mb-3 font-semibold">{nextAppt.notes?.split(' - ')[1] || "Consultation"}</p>
                        <div className="flex items-center text-cyan-200 text-sm mb-4 font-semibold">
                            <MapPin size={16} className="mr-2" />
                            {nextAppt.type === 'STABLE' ? `Extérieur (${nextAppt.travelFee ? (nextAppt.distanceKm || 0) + 'km' : 'Zone A'})` : 'Cabinet Principal'}
                        </div>
                        <button
                            onClick={() => onStartSession(nextAppt)}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                        >
                            Démarrer la Séance Planifiée
                        </button>
                    </div>
                ) : (
                    <div className="mt-6 text-center py-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <p className="text-cyan-100 text-sm font-semibold">Aucun autre rendez-vous planifié aujourd'hui.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Tournée du Jour - Zoho Style */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-3"></div>
                    Tournée du Jour
                </h3>
            </div>
            <div className="p-6 space-y-0 relative">
                <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-gradient-to-b from-teal-200 via-cyan-200 to-teal-200"></div>

                {appointments && appointments
                    .filter(a => new Date(a.startTime).getDate() === new Date().getDate())
                    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((appt, idx) => {
                    const isDone = appt.status === ApptStatus.COMPLETED;
                    const isNext = appt.id === nextAppt?.id;

                    return (
                        <div key={appt.id} className={`relative pl-10 py-3 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                            <div className={`absolute left-[35px] top-5 w-3 h-3 rounded-full border-2 border-white shadow-lg z-10 transition-all
                                ${isNext ? 'bg-gradient-to-br from-teal-500 to-cyan-500 scale-150 ring-4 ring-teal-200 animate-pulse' : isDone ? 'bg-slate-300' : 'bg-white border-teal-400'}`}>
                            </div>

                            <div className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-102 hover:shadow-lg
                                ${isNext ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300 shadow-md' : 'bg-white border-slate-100'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full mb-2 inline-block uppercase tracking-wide
                                            ${appt.type === 'CABINET' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            {appt.type === 'CABINET' ? 'Cabinet' : 'Extérieur'}
                                        </span>
                                        <h4 className="font-black text-slate-800 text-sm mt-2">{appt.notes}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-slate-700">
                                            {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {appt.travelFee && (
                                            <span className="text-xs text-green-600 font-black">+ {appt.travelFee}€</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Demandes de Rendez-vous */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full mr-3"></div>
                    Demandes de Rendez-vous
                    <div className="ml-2 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">
                        <Bell size={14} />
                    </div>
                </h3>
            </div>
            <div className="p-6">
                <AppointmentRequestManager />
            </div>
        </div>
    </div>
  );

  const renderStrategyView = () => (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tendance CA - Zoho Style */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                 <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <h3 className="font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center text-lg">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mr-3 shadow-lg">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            Tendance CA
                        </span>
                        <span className="text-emerald-600 text-3xl font-black">{totalRevenueWeek}€</span>
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-1 ml-14">7 derniers jours</p>
                 </div>
                 <div className="p-6">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: '600'}} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* Volume Séances - Zoho Style */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                 <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                    <h3 className="font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center text-lg">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mr-3 shadow-lg">
                                <BarChart2 size={20} className="text-white" />
                            </div>
                            Volume Séances
                        </span>
                        <span className="text-blue-600 text-3xl font-black">{totalSessionsWeek}</span>
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-1 ml-14">7 derniers jours</p>
                 </div>
                 <div className="p-6">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: '600'}} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="sessions" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              </div>
          </div>
      </div>
  );

  const renderClientsView = () => (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Activité Client</h2>
                        <p className="text-slate-600 text-sm font-semibold mt-1">Accès rapide aux patients récents</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg">
                        <Users size={24} className="text-white" />
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un patient..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all"
                    />
                </div>

                <div className="space-y-3">
                    {displayClients.length === 0 && (
                        <div className="text-center py-12 text-slate-400 font-semibold">Aucun patient trouvé.</div>
                    )}
                    {displayClients.map((p, index) => (
                        <div
                            key={p.id}
                            draggable={!clientSearch}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`flex items-center p-4 bg-white border-2 rounded-2xl hover:shadow-lg transition-all group select-none transform hover:scale-102
                            ${draggedIndex === index ? 'opacity-50 border-dashed border-teal-400 bg-teal-50' : 'border-slate-100 hover:border-teal-200'}
                            ${!clientSearch ? 'cursor-move' : ''}`}
                        >
                            {!clientSearch && (
                                <div className="mr-3 text-slate-300 group-hover:text-teal-400 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={20} />
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm mr-4 shrink-0 shadow-md transform group-hover:scale-110 transition-transform
                                ${p.type === PatientType.HUMAN ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : p.type === PatientType.EQUINE ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                {(p.name || '??').substring(0,2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-800 text-base truncate">{p.name}</h4>
                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                    <span className={`px-2 py-1 rounded-lg mr-2 text-[10px] font-black
                                        ${p.type === 'HUMAN' ? 'bg-teal-100 text-teal-700' : p.type === 'EQUINE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.type}
                                    </span>
                                    {p.type !== 'HUMAN' && <span className="truncate font-semibold">{p.ownerName}</span>}
                                </div>
                            </div>

                            <div className="text-right pl-2">
                                <div className="flex items-center justify-end text-xs text-slate-500 mb-1 font-semibold">
                                    <Calendar size={12} className="mr-1" /> Dernière
                                </div>
                                <p className="text-sm font-black text-slate-700">
                                    {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : '-'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4">
        {/* Tab Switcher - Zoho Style */}
        <div className="flex justify-center md:justify-end">
            <div className="bg-white border-2 border-slate-200 p-1.5 rounded-2xl shadow-lg flex space-x-1">
                <button
                    onClick={() => setViewMode('FIELD')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'FIELD'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                >
                    <Smartphone size={16} className="mr-2" /> Terrain
                </button>
                <button
                    onClick={() => setViewMode('STRATEGY')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'STRATEGY'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                >
                    <BarChart2 size={16} className="mr-2" /> Stratège
                </button>
                <button
                    onClick={() => setViewMode('CLIENTS')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'CLIENTS'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-teal-600'
                    }`}
                >
                    <Users size={16} className="mr-2" /> Clients
                </button>
            </div>
        </div>

        {viewMode === 'FIELD' && renderFieldView()}
        {viewMode === 'STRATEGY' && renderStrategyView()}
        {viewMode === 'CLIENTS' && renderClientsView()}
    </div>
  );
};

export default DailyDashboard;
