import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, format, startOfWeek, endOfWeek, getDay, getHours, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardAnalyticsProps {
  onClose: () => void;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ onClose }) => {
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  // Charger toutes les données nécessaires
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];

  // Calculs des métriques
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));
    const currentYearStart = startOfYear(now);
    const currentYearEnd = endOfYear(now);
    const previousYearStart = startOfYear(subYears(now, 1));
    const previousYearEnd = endOfYear(subYears(now, 1));

    // Sessions ce mois
    const currentMonthSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    // Sessions mois précédent
    const previousMonthSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });

    // Sessions cette année
    const currentYearSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= currentYearStart && date <= currentYearEnd;
    });

    // Sessions année précédente
    const previousYearSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= previousYearStart && date <= previousYearEnd;
    });

    // Revenus
    const currentMonthRevenue = currentMonthSessions.reduce((sum, s) => sum + (s.price || 0), 0);
    const previousMonthRevenue = previousMonthSessions.reduce((sum, s) => sum + (s.price || 0), 0);
    const currentYearRevenue = currentYearSessions.reduce((sum, s) => sum + (s.price || 0), 0);
    const previousYearRevenue = previousYearSessions.reduce((sum, s) => sum + (s.price || 0), 0);

    // Calcul évolution
    const revenueChange = period === 'month'
      ? ((currentMonthRevenue - previousMonthRevenue) / (previousMonthRevenue || 1)) * 100
      : ((currentYearRevenue - previousYearRevenue) / (previousYearRevenue || 1)) * 100;

    const sessionsChange = period === 'month'
      ? ((currentMonthSessions.length - previousMonthSessions.length) / (previousMonthSessions.length || 1)) * 100
      : ((currentYearSessions.length - previousYearSessions.length) / (previousYearSessions.length || 1)) * 100;

    // RDV à venir
    const upcomingAppointments = appointments.filter(a => new Date(a.startTime) >= now).length;

    // Patients actifs (avec séance dans les 3 derniers mois)
    const threeMonthsAgo = subMonths(now, 3);
    const activePatientsIds = new Set(
      sessions
        .filter(s => new Date(s.date) >= threeMonthsAgo)
        .map(s => s.patientId)
    );

    return {
      currentRevenue: period === 'month' ? currentMonthRevenue : currentYearRevenue,
      previousRevenue: period === 'month' ? previousMonthRevenue : previousYearRevenue,
      revenueChange,
      currentSessions: period === 'month' ? currentMonthSessions.length : currentYearSessions.length,
      previousSessions: period === 'month' ? previousMonthSessions.length : previousYearSessions.length,
      sessionsChange,
      upcomingAppointments,
      activePatients: activePatientsIds.size,
      totalPatients: patients.length
    };
  }, [sessions, invoices, appointments, patients, period]);

  // Données pour graphique évolution revenus (12 derniers mois)
  const revenueEvolutionData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const monthSessions = sessions.filter(s => {
        const date = new Date(s.date);
        return date >= monthStart && date <= monthEnd;
      });

      const revenue = monthSessions.reduce((sum, s) => sum + (s.price || 0), 0);
      const count = monthSessions.length;

      data.push({
        month: format(monthStart, 'MMM yyyy', { locale: fr }),
        revenue: Math.round(revenue),
        sessions: count
      });
    }

    return data;
  }, [sessions]);

  // Données pour graphique répartition par type de séance
  const sessionTypeData = useMemo(() => {
    const types: Record<string, number> = {};

    sessions.forEach(s => {
      const type = s.type || 'Autre';
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types).map(([name, value]) => ({
      name: name === 'KINESIO' ? 'Kinésiologie' : name === 'MASSAGE' ? 'Massage' : name,
      value
    }));
  }, [sessions]);

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  // Patients les plus actifs
  const topPatients = useMemo(() => {
    const patientSessionCount: Record<number | string, { count: number; revenue: number; name: string }> = {};

    sessions.forEach(s => {
      const pid = s.patientId;
      if (!patientSessionCount[pid]) {
        const patient = patients.find(p => p.id === pid);
        patientSessionCount[pid] = {
          count: 0,
          revenue: 0,
          name: patient?.name || 'Inconnu'
        };
      }
      patientSessionCount[pid].count++;
      patientSessionCount[pid].revenue += s.price || 0;
    });

    return Object.entries(patientSessionCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [sessions, patients]);

  // Heatmap : jours de la semaine vs heures de la journée
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    appointments.forEach(appt => {
      const date = parseISO(appt.startTime);
      const dayOfWeek = getDay(date); // 0 = dimanche
      const hour = getHours(date);
      grid[dayOfWeek][hour]++;
    });

    sessions.forEach(session => {
      const date = new Date(session.date);
      const dayOfWeek = getDay(date);
      // Assume 14h par défaut si pas d'heure
      const hour = 14;
      grid[dayOfWeek][hour]++;
    });

    return grid;
  }, [appointments, sessions]);

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const maxHeatmapValue = Math.max(...heatmapData.flat());

  const getHeatColor = (value: number) => {
    if (value === 0) return '#f3f4f6';
    const intensity = value / maxHeatmapValue;
    if (intensity < 0.25) return '#ddd6fe';
    if (intensity < 0.5) return '#c4b5fd';
    if (intensity < 0.75) return '#a78bfa';
    return '#7c3aed';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 flex justify-between items-center z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">📊 Dashboard Analytics</h2>
            <p className="text-purple-100 text-sm mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Métriques Clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenus */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div className={`flex items-center text-sm font-bold ${analytics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenueChange >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(analytics.revenueChange).toFixed(1)}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Revenus</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.currentRevenue.toFixed(2)} €</p>
              <p className="text-xs text-gray-500 mt-1">vs {analytics.previousRevenue.toFixed(2)} € {period === 'month' ? 'mois dernier' : 'année dernière'}</p>
            </div>

            {/* Séances */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={24} />
                </div>
                <div className={`flex items-center text-sm font-bold ${analytics.sessionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.sessionsChange >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(analytics.sessionsChange).toFixed(1)}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Séances</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.currentSessions}</p>
              <p className="text-xs text-gray-500 mt-1">vs {analytics.previousSessions} {period === 'month' ? 'mois dernier' : 'année dernière'}</p>
            </div>

            {/* RDV à venir */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Calendar className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">RDV à venir</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.upcomingAppointments}</p>
              <p className="text-xs text-gray-500 mt-1">Rendez-vous planifiés</p>
            </div>

            {/* Patients actifs */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Patients actifs</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.activePatients}</p>
              <p className="text-xs text-gray-500 mt-1">sur {analytics.totalPatients} patients total</p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution Revenus */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-violet-600" size={20} />
                Évolution des Revenus
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value} €`, 'Revenus']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} name="Revenus (€)" dot={{ fill: '#8B5CF6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition par Type */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Activity className="mr-2 text-pink-600" size={20} />
                Répartition par Type de Séance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap Calendrier */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2 text-indigo-600" size={20} />
              Heatmap : Jours et Heures les Plus Demandés
            </h3>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex mb-2">
                  <div className="w-12"></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="w-8 text-center text-xs text-gray-500 font-medium">
                      {i}h
                    </div>
                  ))}
                </div>
                {dayNames.map((day, dayIndex) => (
                  <div key={day} className="flex items-center mb-1">
                    <div className="w-12 text-xs font-medium text-gray-700">{day}</div>
                    {heatmapData[dayIndex].map((value, hourIndex) => (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className="w-8 h-8 mx-0.5 rounded"
                        style={{ backgroundColor: getHeatColor(value) }}
                        title={`${day} ${hourIndex}h: ${value} séance(s)`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: '#f3f4f6' }}></div>
                Aucune
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: '#ddd6fe' }}></div>
                Faible
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: '#a78bfa' }}></div>
                Moyenne
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: '#7c3aed' }}></div>
                Élevée
              </div>
            </div>
          </div>

          {/* Top Patients */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2 text-teal-600" size={20} />
              Top 10 Patients les Plus Actifs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rang</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Séances</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {topPatients.map((patient, index) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{patient.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          {patient.count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {patient.revenue.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
