
import React, { useState, useEffect } from 'react';
import { Appointment, ApptStatus, AppSettings, Patient, PatientType } from '../types';
import { MapPin, Clock, Navigation as NavIcon, CloudRain, Zap, Users, Search, GripVertical, Calendar, TrendingUp, BarChart2, Smartphone, Sparkles, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
        {/* Header Card - Ultra Modern */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white p-6 md:p-8 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                            <p className="text-purple-200 text-xs font-bold tracking-wider uppercase">
                                Bonjour {settings?.practitionerName || 'Praticien'}
                            </p>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h1>
                    </div>
                    <div className="flex items-center bg-white/20 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
                        <CloudRain size={18} className="text-blue-200 mr-2" />
                        <span className="text-sm font-bold">Pluie 14h</span>
                    </div>
                </div>

                <button
                    onClick={onQuickSession}
                    className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 font-black text-base group"
                >
                    <Zap size={22} className="mr-3 text-yellow-200 fill-current group-hover:animate-pulse" />
                    Séance Flash (Sans RDV)
                    <ArrowRight size={20} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                {nextAppt ? (
                    <div className="mt-6 bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center text-purple-100 text-sm font-bold">
                                <Clock size={16} className="mr-2" />
                                PROCHAIN RDV • {new Date(nextAppt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white flex items-center px-4 py-2 rounded-xl shadow-lg transition-all transform hover:scale-105 text-xs font-black">
                                <NavIcon size={14} className="mr-2" /> Waze
                            </button>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
                            {nextAppt.notes?.split(' - ')[0] || "Patient"}
                        </h3>
                        <p className="text-sm text-purple-100 mb-3 font-semibold">{nextAppt.notes?.split(' - ')[1] || "Consultation"}</p>
                        <div className="flex items-center text-purple-200 text-sm mb-4 font-semibold">
                            <MapPin size={16} className="mr-2" />
                            {nextAppt.type === 'STABLE' ? `Extérieur (${nextAppt.travelFee ? (nextAppt.distanceKm || 0) + 'km' : 'Zone A'})` : 'Cabinet Principal'}
                        </div>
                        <button
                            onClick={() => onStartSession(nextAppt)}
                            className="w-full py-4 bg-white text-purple-600 font-black rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                        >
                            Démarrer la Séance Planifiée
                        </button>
                    </div>
                ) : (
                    <div className="mt-6 text-center py-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <p className="text-purple-100 text-sm font-semibold">Aucun autre rendez-vous planifié aujourd'hui.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Tournée du Jour - Ultra Modern */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-purple-100 shadow-2xl">
            <h3 className="text-sm font-black text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text uppercase tracking-wider mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full mr-3"></div>
                Tournée du Jour
            </h3>
            <div className="space-y-0 relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-300 via-blue-300 to-purple-300"></div>

                {appointments && appointments
                    .filter(a => new Date(a.startTime).getDate() === new Date().getDate())
                    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((appt, idx) => {
                    const isDone = appt.status === ApptStatus.COMPLETED;
                    const isNext = appt.id === nextAppt?.id;

                    return (
                        <div key={appt.id} className={`relative pl-10 py-3 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                            <div className={`absolute left-[11px] top-5 w-3 h-3 rounded-full border-2 border-white shadow-lg z-10 transition-all
                                ${isNext ? 'bg-gradient-to-br from-purple-600 to-blue-600 scale-150 ring-4 ring-purple-200 animate-pulse' : isDone ? 'bg-slate-300' : 'bg-white border-purple-300'}`}>
                            </div>

                            <div className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-102 hover:shadow-xl
                                ${isNext ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full mb-2 inline-block uppercase tracking-wide shadow-sm
                                            ${appt.type === 'CABINET' ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'}`}>
                                            {appt.type === 'CABINET' ? 'Cabinet' : 'Extérieur'}
                                        </span>
                                        <h4 className="font-black text-slate-800 text-sm mt-2">{appt.notes}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
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
    </div>
  );

  const renderStrategyView = () => (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tendance CA - Ultra Modern */}
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-purple-100 shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"></div>
                 <div className="relative z-10">
                    <h3 className="font-black text-slate-800 mb-2 flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mr-3">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            <span className="text-lg">Tendance CA</span>
                        </span>
                        <span className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-black">{totalRevenueWeek}€</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mb-4 ml-14">7 derniers jours</p>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* Volume Séances - Ultra Modern */}
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-purple-100 shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                 <div className="relative z-10">
                    <h3 className="font-black text-slate-800 mb-2 flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mr-3">
                                <BarChart2 size={20} className="text-white" />
                            </div>
                            <span className="text-lg">Volume Séances</span>
                        </span>
                        <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-black">{totalSessionsWeek}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mb-4 ml-14">7 derniers jours</p>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                                <Bar dataKey="sessions" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
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
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-purple-100 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">Activité Client</h2>
                    <p className="text-slate-500 text-sm font-semibold mt-1">Accès rapide aux patients récents</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                    <Users size={24} className="text-white" />
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un patient..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-12 p-4 bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-100 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-purple-200 transition-all"
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
                        className={`flex items-center p-4 bg-white border-2 rounded-2xl hover:shadow-xl transition-all group select-none transform hover:scale-102
                        ${draggedIndex === index ? 'opacity-50 border-dashed border-purple-400 bg-purple-50' : 'border-gray-100'}
                        ${!clientSearch ? 'cursor-move' : ''}`}
                    >
                        {!clientSearch && (
                            <div className="mr-3 text-gray-300 group-hover:text-purple-400 cursor-grab active:cursor-grabbing">
                                <GripVertical size={20} />
                            </div>
                        )}

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm mr-4 shrink-0 shadow-lg transform group-hover:scale-110 transition-transform
                            ${p.type === PatientType.HUMAN ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : p.type === PatientType.EQUINE ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                            {p.name.substring(0,2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-800 text-base truncate">{p.name}</h4>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                                <span className={`px-2 py-1 rounded-lg mr-2 text-[10px] font-black
                                    ${p.type === 'HUMAN' ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700' : p.type === 'EQUINE' ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700' : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'}`}>
                                    {p.type}
                                </span>
                                {p.type !== 'HUMAN' && <span className="truncate font-semibold">{p.ownerName}</span>}
                            </div>
                        </div>

                        <div className="text-right pl-2">
                            <div className="flex items-center justify-end text-xs text-slate-400 mb-1 font-semibold">
                                <Calendar size={12} className="mr-1" /> Dernière
                            </div>
                            <p className="text-sm font-black text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                                {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : '-'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4">
        {/* Tab Switcher - Ultra Modern */}
        <div className="flex justify-center md:justify-end">
            <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border-2 border-purple-100 shadow-xl flex space-x-1">
                <button
                    onClick={() => setViewMode('FIELD')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'FIELD'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                            : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                >
                    <Smartphone size={16} className="mr-2" /> Terrain
                </button>
                <button
                    onClick={() => setViewMode('STRATEGY')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'STRATEGY'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                            : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                >
                    <BarChart2 size={16} className="mr-2" /> Stratège
                </button>
                <button
                    onClick={() => setViewMode('CLIENTS')}
                    className={`flex items-center px-4 py-2.5 text-xs font-black rounded-xl transition-all ${
                        viewMode === 'CLIENTS'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                            : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
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
