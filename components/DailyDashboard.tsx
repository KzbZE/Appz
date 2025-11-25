import React, { useState, useEffect } from 'react';
import { Appointment, ApptStatus, AppSettings, Patient, PatientType } from '../types';
import { MapPin, Clock, Navigation as NavIcon, CloudRain, Zap, Users, Search, GripVertical, Calendar, TrendingUp, BarChart2, Smartphone, ArrowRight, Sun, Bell, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AppointmentRequestManager from './AppointmentRequestManager';
import { designSystem } from '../design/designSystem';

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

  // Find next scheduled appointment today
  const nextAppt = appointments
    ?.filter(a => {
      const apptDate = new Date(a.startTime);
      const now = new Date();
      return (
        a.status === ApptStatus.SCHEDULED &&
        apptDate.getDate() === now.getDate() &&
        apptDate.getMonth() === now.getMonth() &&
        apptDate.getFullYear() === now.getFullYear() &&
        apptDate.getTime() >= now.getTime()
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  useEffect(() => {
    if (patients) {
        const sorted = [...patients]
            .sort((a, b) => new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime())
            .slice(0, 5);
        setRecentClients(sorted);
    }
  }, [patients]);

  // Chart data preparation
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

  // Drag and drop handlers
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

  // Field View - Mobile-first practitioner view
  const renderFieldView = () => (
    <div className="space-y-4 pb-24 lg:pb-6 animate-fadeIn">
        {/* Welcome Card */}
        <div style={{
          background: `linear-gradient(135deg, ${designSystem.colors.primary[600]} 0%, ${designSystem.colors.primary[700]} 100%)`,
          ...designSystem.components.card.base
        }} className="text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sun size={14} className="text-orange-300" />
                            <p style={{ ...designSystem.typography.fontSize.xs, fontWeight: designSystem.typography.fontWeight.semibold }} className="text-primary-200 uppercase tracking-wide">
                                Bonjour {settings?.practitionerName || 'Praticien'}
                            </p>
                        </div>
                        <h1 style={{ ...designSystem.typography.fontSize['2xl'], fontWeight: designSystem.typography.fontWeight.bold }} className="text-white">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h1>
                    </div>
                    <div style={designSystem.components.badge.base} className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-2 text-white border-white/20">
                        <CloudRain size={16} className="mr-2" />
                        <span style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium }}>Pluie 14h</span>
                    </div>
                </div>

                {/* Quick Session Button */}
                <button
                    onClick={onQuickSession}
                    style={{
                      ...designSystem.components.button.base,
                      ...designSystem.components.button.danger,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    }}
                    className="w-full flex items-center justify-center group hover-lift"
                >
                    <Zap size={18} className="mr-2 fill-current" />
                    <span style={{ fontWeight: designSystem.typography.fontWeight.semibold }}>Séance Flash (Sans RDV)</span>
                    <ArrowRight size={18} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Next Appointment */}
                {nextAppt ? (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center text-white/90" style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium }}>
                                <Clock size={14} className="mr-2" />
                                PROCHAIN • {new Date(nextAppt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <button style={{
                              ...designSystem.components.button.base,
                              ...designSystem.components.button.sm,
                              background: 'rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }} className="flex items-center hover-lift">
                                <NavIcon size={14} className="mr-1" /> Waze
                            </button>
                        </div>
                        <div>
                            <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold }} className="text-white">
                                {nextAppt.notes?.split(' - ')[0] || "Patient"}
                            </h3>
                            <p style={{ ...designSystem.typography.fontSize.sm }} className="text-white/80 mt-1">
                                {nextAppt.notes?.split(' - ')[1] || "Consultation"}
                            </p>
                            <div className="flex items-center text-white/80 mt-2" style={{ ...designSystem.typography.fontSize.sm }}>
                                <MapPin size={14} className="mr-2" />
                                {nextAppt.type === 'STABLE' ? `Extérieur (${nextAppt.travelFee ? (nextAppt.distanceKm || 0) + 'km' : 'Zone A'})` : 'Cabinet Principal'}
                            </div>
                        </div>
                        <button
                            onClick={() => onStartSession(nextAppt)}
                            style={{
                              ...designSystem.components.button.base,
                              background: 'white',
                              color: designSystem.colors.primary[600]
                            }}
                            className="w-full hover-lift"
                        >
                            <span style={{ fontWeight: designSystem.typography.fontWeight.semibold }}>Démarrer la Séance</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
                        <p style={{ ...designSystem.typography.fontSize.sm }} className="text-white/70">
                            Aucun autre rendez-vous planifié aujourd'hui
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* Today's Schedule */}
        <div style={{...designSystem.components.card.base, border: `1px solid ${designSystem.colors.neutral[200]}`}}>
            <div className="p-4 border-b" style={{ borderColor: designSystem.colors.neutral[100] }}>
                <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold }} className="flex items-center">
                    <div className="w-1 h-5 bg-primary-500 rounded-full mr-3" style={{ background: designSystem.colors.primary[500] }}></div>
                    <span style={{ color: designSystem.colors.neutral[900] }}>Tournée du Jour</span>
                </h3>
            </div>
            <div className="p-4 space-y-0 relative">
                {/* Timeline */}
                <div className="absolute left-8 top-4 bottom-4 w-px bg-neutral-200" style={{ background: designSystem.colors.neutral[200] }}></div>

                {appointments && appointments
                    .filter(a => new Date(a.startTime).getDate() === new Date().getDate())
                    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((appt, idx) => {
                    const isDone = appt.status === ApptStatus.COMPLETED;
                    const isNext = appt.id === nextAppt?.id;

                    return (
                        <div key={appt.id} className={`relative pl-8 py-2 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                            {/* Timeline Dot */}
                            <div className={`absolute left-[29px] top-4 w-2.5 h-2.5 rounded-full border-2 z-10 transition-all
                                ${isNext
                                  ? 'scale-150 animate-pulse'
                                  : isDone
                                  ? 'bg-neutral-300 border-neutral-300'
                                  : 'bg-white'}`}
                                style={{
                                  background: isNext ? designSystem.colors.primary[500] : isDone ? designSystem.colors.neutral[300] : 'white',
                                  borderColor: isNext ? designSystem.colors.primary[500] : designSystem.colors.neutral[300],
                                  boxShadow: isNext ? `0 0 0 4px ${designSystem.colors.primary[100]}` : 'none'
                                }}>
                            </div>

                            {/* Appointment Card */}
                            <div className={`p-3 rounded-xl border transition-smooth hover-lift
                                ${isNext ? 'border-primary-300 bg-primary-50' : 'border-neutral-100 bg-white'}`}
                                style={{
                                  borderColor: isNext ? designSystem.colors.primary[300] : designSystem.colors.neutral[100],
                                  background: isNext ? designSystem.colors.primary[50] : 'white'
                                }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <span style={{
                                          ...designSystem.components.badge.base,
                                          ...designSystem.typography.fontSize.xs,
                                          background: appt.type === 'CABINET' ? designSystem.colors.info : '#f97316',
                                          color: 'white',
                                          padding: '4px 10px'
                                        }} className="inline-block mb-2 uppercase">
                                            {appt.type === 'CABINET' ? 'Cabinet' : 'Extérieur'}
                                        </span>
                                        <h4 style={{
                                          ...designSystem.typography.fontSize.sm,
                                          fontWeight: designSystem.typography.fontWeight.semibold,
                                          color: designSystem.colors.neutral[900]
                                        }}>
                                          {appt.notes}
                                        </h4>
                                    </div>
                                    <div className="text-right ml-3">
                                        <span style={{
                                          ...designSystem.typography.fontSize.sm,
                                          fontWeight: designSystem.typography.fontWeight.semibold,
                                          color: designSystem.colors.neutral[700]
                                        }}>
                                            {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {appt.travelFee && (
                                            <span style={{
                                              ...designSystem.typography.fontSize.xs,
                                              fontWeight: designSystem.typography.fontWeight.medium,
                                              color: designSystem.colors.success
                                            }} className="block">
                                              + {appt.travelFee}€
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!isDone && (
                                    <button
                                        onClick={() => onStartSession(appt)}
                                        style={{
                                          ...designSystem.components.button.base,
                                          ...designSystem.components.button.sm,
                                          ...designSystem.components.button.primary
                                        }}
                                        className="w-full"
                                    >
                                        Démarrer
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {(!appointments || appointments.filter(a => new Date(a.startTime).getDate() === new Date().getDate()).length === 0) && (
                  <div className="py-8 text-center" style={{ color: designSystem.colors.neutral[400] }}>
                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                    <p style={{ ...designSystem.typography.fontSize.sm }}>Aucun rendez-vous aujourd'hui</p>
                  </div>
                )}
            </div>
        </div>

        {/* Appointment Requests */}
        <div style={{...designSystem.components.card.base, border: `1px solid ${designSystem.colors.neutral[200]}`}}>
            <div className="p-4 border-b" style={{ borderColor: designSystem.colors.neutral[100] }}>
                <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold }} className="flex items-center">
                    <div className="w-1 h-5 rounded-full mr-3" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}></div>
                    <span style={{ color: designSystem.colors.neutral[900] }}>Demandes de Rendez-vous</span>
                    <div style={{...designSystem.components.badge.base, background: '#f97316', color: 'white', marginLeft: '8px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Bell size={12} />
                    </div>
                </h3>
            </div>
            <div className="p-4">
                <AppointmentRequestManager />
            </div>
        </div>
    </div>
  );

  // Strategy View - Analytics and performance
  const renderStrategyView = () => (
      <div className="space-y-4 animate-fadeIn pb-24 lg:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Chart */}
              <div style={{...designSystem.components.card.base, border: `1px solid ${designSystem.colors.neutral[200]}`}} className="overflow-hidden">
                 <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b" style={{ borderColor: designSystem.colors.neutral[100] }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 rounded-xl mr-3" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <TrendingUp size={20} style={{ color: 'white' }} />
                            </div>
                            <div>
                                <h3 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                                    Tendance CA
                                </h3>
                                <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                                    7 derniers jours
                                </p>
                            </div>
                        </div>
                        <span style={{ ...designSystem.typography.fontSize['2xl'], fontWeight: designSystem.typography.fontWeight.bold, color: '#10b981' }}>
                            {totalRevenueWeek}€
                        </span>
                    </div>
                 </div>
                 <div className="p-4">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis
                                  dataKey="name"
                                  tick={{fontSize: 11, fontWeight: '500', fill: designSystem.colors.neutral[600]}}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        ...designSystem.components.card.base,
                                        border: `1px solid ${designSystem.colors.neutral[200]}`,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* Sessions Chart */}
              <div style={{...designSystem.components.card.base, border: `1px solid ${designSystem.colors.neutral[200]}`}} className="overflow-hidden">
                 <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b" style={{ borderColor: designSystem.colors.neutral[100] }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 rounded-xl mr-3" style={{ background: `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)` }}>
                                <BarChart2 size={20} style={{ color: 'white' }} />
                            </div>
                            <div>
                                <h3 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                                    Volume Séances
                                </h3>
                                <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                                    7 derniers jours
                                </p>
                            </div>
                        </div>
                        <span style={{ ...designSystem.typography.fontSize['2xl'], fontWeight: designSystem.typography.fontWeight.bold, color: designSystem.colors.primary[600] }}>
                            {totalSessionsWeek}
                        </span>
                    </div>
                 </div>
                 <div className="p-4">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis
                                  dataKey="name"
                                  tick={{fontSize: 11, fontWeight: '500', fill: designSystem.colors.neutral[600]}}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip
                                    cursor={{fill: designSystem.colors.neutral[50]}}
                                    contentStyle={{
                                        ...designSystem.components.card.base,
                                        border: `1px solid ${designSystem.colors.neutral[200]}`,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="sessions" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={32} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={designSystem.colors.primary[500]} />
                                        <stop offset="100%" stopColor={designSystem.colors.primary[600]} />
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

  // Clients View - Patient management
  const renderClientsView = () => (
    <div className="space-y-4 animate-fadeIn pb-24 lg:pb-6">
        <div style={{...designSystem.components.card.base, border: `1px solid ${designSystem.colors.neutral[200]}`}}>
            <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50" style={{ borderColor: designSystem.colors.neutral[100] }}>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 style={{ ...designSystem.typography.fontSize.xl, fontWeight: designSystem.typography.fontWeight.bold, color: designSystem.colors.neutral[900] }}>
                            Activité Client
                        </h2>
                        <p style={{ ...designSystem.typography.fontSize.sm, color: designSystem.colors.neutral[600] }} className="mt-1">
                            Accès rapide aux patients récents
                        </p>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{ background: `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)` }}>
                        <Users size={20} style={{ color: 'white' }} />
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: designSystem.colors.neutral[400] }} />
                    <input
                        type="text"
                        placeholder="Rechercher un patient..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        style={{
                          ...designSystem.components.input.base,
                          paddingLeft: '40px'
                        }}
                        className="w-full"
                    />
                </div>

                {/* Patient List */}
                <div className="space-y-2">
                    {displayClients.length === 0 && (
                        <div className="text-center py-12" style={{ color: designSystem.colors.neutral[400] }}>
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p style={{ ...designSystem.typography.fontSize.sm }}>Aucun patient trouvé</p>
                        </div>
                    )}
                    {displayClients.map((p, index) => (
                        <div
                            key={p.id}
                            draggable={!clientSearch}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`flex items-center p-3 rounded-xl border transition-smooth hover-lift group select-none
                            ${draggedIndex === index ? 'opacity-50 border-dashed' : ''}
                            ${!clientSearch ? 'cursor-move' : ''}`}
                            style={{
                              background: 'white',
                              borderColor: draggedIndex === index ? designSystem.colors.primary[300] : designSystem.colors.neutral[200]
                            }}
                        >
                            {!clientSearch && (
                                <div className="mr-3 cursor-grab active:cursor-grabbing" style={{ color: designSystem.colors.neutral[300] }}>
                                    <GripVertical size={18} />
                                </div>
                            )}

                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mr-3 group-hover:scale-110 transition-transform"
                                style={{
                                  ...designSystem.typography.fontSize.xs,
                                  fontWeight: designSystem.typography.fontWeight.bold,
                                  background: p.type === PatientType.HUMAN
                                    ? `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)`
                                    : p.type === PatientType.EQUINE
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                }}>
                                {p.name.substring(0,2).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 style={{
                                  ...designSystem.typography.fontSize.sm,
                                  fontWeight: designSystem.typography.fontWeight.semibold,
                                  color: designSystem.colors.neutral[900]
                                }} className="truncate">
                                  {p.name}
                                </h4>
                                <div className="flex items-center mt-1">
                                    <span style={{
                                      ...designSystem.components.badge.base,
                                      ...designSystem.typography.fontSize.xs,
                                      background: p.type === 'HUMAN'
                                        ? designSystem.colors.primary[100]
                                        : p.type === 'EQUINE'
                                        ? '#fef3c7'
                                        : '#dbeafe',
                                      color: p.type === 'HUMAN'
                                        ? designSystem.colors.primary[700]
                                        : p.type === 'EQUINE'
                                        ? '#d97706'
                                        : '#2563eb',
                                      padding: '2px 8px'
                                    }}>
                                        {p.type}
                                    </span>
                                    {p.type !== 'HUMAN' && (
                                      <span style={{
                                        ...designSystem.typography.fontSize.xs,
                                        color: designSystem.colors.neutral[600]
                                      }} className="ml-2 truncate">
                                        {p.ownerName}
                                      </span>
                                    )}
                                </div>
                            </div>

                            {/* Last Visit */}
                            <div className="text-right pl-2">
                                <div className="flex items-center justify-end mb-1" style={{
                                  ...designSystem.typography.fontSize.xs,
                                  color: designSystem.colors.neutral[500]
                                }}>
                                    <Calendar size={11} className="mr-1" /> Dernière
                                </div>
                                <p style={{
                                  ...designSystem.typography.fontSize.sm,
                                  fontWeight: designSystem.typography.fontWeight.semibold,
                                  color: designSystem.colors.neutral[700]
                                }}>
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
        {/* View Mode Switcher */}
        <div className="flex justify-center lg:justify-end">
            <div className="p-1 rounded-xl flex gap-1" style={{
              background: 'white',
              border: `2px solid ${designSystem.colors.neutral[200]}`,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <button
                    onClick={() => setViewMode('FIELD')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                        viewMode === 'FIELD' ? 'transform scale-105' : ''
                    }`}
                    style={{
                      ...designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.medium,
                      background: viewMode === 'FIELD'
                        ? `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)`
                        : 'transparent',
                      color: viewMode === 'FIELD' ? 'white' : designSystem.colors.neutral[600],
                      boxShadow: viewMode === 'FIELD' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                >
                    <Smartphone size={16} className="mr-2" /> Terrain
                </button>
                <button
                    onClick={() => setViewMode('STRATEGY')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                        viewMode === 'STRATEGY' ? 'transform scale-105' : ''
                    }`}
                    style={{
                      ...designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.medium,
                      background: viewMode === 'STRATEGY'
                        ? `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)`
                        : 'transparent',
                      color: viewMode === 'STRATEGY' ? 'white' : designSystem.colors.neutral[600],
                      boxShadow: viewMode === 'STRATEGY' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                >
                    <BarChart2 size={16} className="mr-2" /> Stratège
                </button>
                <button
                    onClick={() => setViewMode('CLIENTS')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                        viewMode === 'CLIENTS' ? 'transform scale-105' : ''
                    }`}
                    style={{
                      ...designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.medium,
                      background: viewMode === 'CLIENTS'
                        ? `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)`
                        : 'transparent',
                      color: viewMode === 'CLIENTS' ? 'white' : designSystem.colors.neutral[600],
                      boxShadow: viewMode === 'CLIENTS' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
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
