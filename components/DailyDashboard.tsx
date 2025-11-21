
import React, { useState, useEffect } from 'react';
import { Appointment, ApptStatus, AppSettings, Patient, PatientType } from '../types';
import { MapPin, Clock, Navigation as NavIcon, CloudRain, Zap, Users, Search, GripVertical, Calendar, TrendingUp, BarChart2, Smartphone } from 'lucide-react';
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
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-primary-300 text-xs font-semibold tracking-wider uppercase mb-1">
                        Bonjour {settings?.practitionerName || 'Praticien'}
                    </p>
                    <h1 className="text-2xl font-bold">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
                </div>
                <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    <CloudRain size={16} className="text-blue-300 mr-2" />
                    <span className="text-sm font-medium">Pluie 14h</span>
                </div>
            </div>

            <div className="flex gap-3 mb-6">
                <button 
                    onClick={onQuickSession}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center transition-transform active:scale-95 font-bold text-sm"
                >
                    <Zap size={18} className="mr-2 text-yellow-200" fill="currentColor" />
                    Séance Flash (Sans RDV)
                </button>
            </div>

            {nextAppt ? (
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-primary-200 text-sm font-medium">
                            <Clock size={14} className="mr-1" />
                            PROCHAIN RDV • {new Date(nextAppt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center px-3 py-1.5 rounded-full shadow-lg transition-transform active:scale-95 text-xs font-bold">
                            <NavIcon size={12} className="mr-1" /> Waze
                        </button>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                        {nextAppt.notes?.split(' - ')[0] || "Patient"}
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">{nextAppt.notes?.split(' - ')[1] || "Consultation"}</p>
                    <div className="flex items-center text-slate-400 text-sm mb-4">
                        <MapPin size={14} className="mr-1" />
                        {nextAppt.type === 'STABLE' ? `Extérieur (${nextAppt.travelFee ? (nextAppt.distanceKm || 0) + 'km' : 'Zone A'})` : 'Cabinet Principal'}
                    </div>
                    <button 
                        onClick={() => onStartSession(nextAppt)}
                        className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-lg shadow-lg shadow-primary-900/20 active:bg-primary-600 transition-colors"
                    >
                        Démarrer la Séance Planifiée
                    </button>
                </div>
            ) : (
                <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-slate-300 text-sm">Aucun autre rendez-vous planifié aujourd'hui.</p>
                </div>
            )}
        </div>

        <div className="">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tournée du Jour</h3>
            <div className="space-y-0 relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                {appointments && appointments
                    .filter(a => new Date(a.startTime).getDate() === new Date().getDate())
                    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((appt, idx) => {
                    const isDone = appt.status === ApptStatus.COMPLETED;
                    const isNext = appt.id === nextAppt?.id;
                    
                    return (
                        <div key={appt.id} className={`relative pl-10 py-3 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                            <div className={`absolute left-[11px] top-5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 
                                ${isNext ? 'bg-primary-500 scale-125 ring-4 ring-primary-100' : isDone ? 'bg-slate-300' : 'bg-white border-slate-300'}`}>
                            </div>
                            
                            <div className={`p-4 rounded-xl border transition-all
                                ${isNext ? 'bg-white border-primary-200 shadow-md' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block uppercase tracking-wide
                                            ${appt.type === 'CABINET' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {appt.type === 'CABINET' ? 'Cabinet' : 'Extérieur'}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-sm">{appt.notes}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs font-mono text-slate-500">
                                            {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {appt.travelFee && (
                                            <span className="text-[10px] text-green-600 font-medium">+ {appt.travelFee}€ Route</span>
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
      <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span className="flex items-center"><TrendingUp size={18} className="text-emerald-500 mr-2" /> Tendance CA</span>
                    <span className="text-emerald-700 text-lg">{totalRevenueWeek} €</span>
                 </h3>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span className="flex items-center"><BarChart2 size={18} className="text-indigo-500 mr-2" /> Volume Séances</span>
                    <span className="text-indigo-700 text-lg">{totalSessionsWeek}</span>
                 </h3>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                            <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
          </div>
      </div>
  );

  const renderClientsView = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Activité Client</h2>
                    <p className="text-slate-400 text-xs">Accès rapide aux 5 derniers patients visités</p>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Users size={20} className="text-slate-500" />
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text"
                    placeholder="Rechercher un patient..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                />
            </div>

            <div className="space-y-3">
                {displayClients.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">Aucun patient trouvé.</div>
                )}
                {displayClients.map((p, index) => (
                    <div 
                        key={p.id}
                        draggable={!clientSearch} 
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group select-none
                        ${draggedIndex === index ? 'opacity-50 border-dashed border-primary-400 bg-gray-50' : ''}
                        ${!clientSearch ? 'cursor-move' : ''}`}
                    >
                        {!clientSearch && (
                            <div className="mr-3 text-gray-300 group-hover:text-primary-400 cursor-grab active:cursor-grabbing">
                                <GripVertical size={18} />
                            </div>
                        )}

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 shrink-0 shadow-sm
                            ${p.type === PatientType.HUMAN ? 'bg-teal-500' : p.type === PatientType.EQUINE ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                            {p.name.substring(0,2).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                            <div className="flex items-center text-xs text-slate-500">
                                <span className={`px-1.5 py-0.5 rounded mr-2 text-[10px] font-bold
                                    ${p.type === 'HUMAN' ? 'bg-teal-50 text-teal-700' : p.type === 'EQUINE' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                    {p.type}
                                </span>
                                {p.type !== 'HUMAN' && <span className="truncate">{p.ownerName}</span>}
                            </div>
                        </div>

                        <div className="text-right pl-2">
                            <div className="flex items-center justify-end text-xs text-slate-400 mb-1">
                                <Calendar size={10} className="mr-1" /> Dernière visite
                            </div>
                            <p className="text-xs font-bold text-slate-700">
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
        <div className="flex justify-center md:justify-end">
            <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex space-x-1">
                <button 
                    onClick={() => setViewMode('FIELD')}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'FIELD' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-gray-50'}`}
                >
                    <Smartphone size={14} className="mr-1.5" /> Terrain
                </button>
                <button 
                    onClick={() => setViewMode('STRATEGY')}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'STRATEGY' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-gray-50'}`}
                >
                    <BarChart2 size={14} className="mr-1.5" /> Stratège
                </button>
                <button 
                    onClick={() => setViewMode('CLIENTS')}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'CLIENTS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-gray-50'}`}
                >
                    <Users size={14} className="mr-1.5" /> Clients
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
