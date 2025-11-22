import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Invoice, Session, PatientType, ApptStatus, InvoiceStatus } from '../types';
import { TrendingUp, Users, PieChart, Award, Activity, DollarSign, MapPin, ArrowUpRight, ArrowDownRight, Search, Calendar, Target, AlertCircle, ChevronRight, Zap, BarChart3 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

const AdvancedStatistics: React.FC = () => {
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const sessions = useLiveQuery(() => db.sessions.toArray()) || [];

  const [period, setPeriod] = useState<Period>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [clientSearch, setClientSearch] = useState('');

  // Calculate period range
  const periodRange = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date = now;

    switch (period) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(selectedYear, selectedMonth, 1);
        end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(selectedYear, quarter * 3, 1);
        end = new Date(selectedYear, (quarter + 1) * 3, 0, 23, 59, 59);
        break;
      case 'year':
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31, 23, 59, 59);
        break;
      default:
        start = new Date(2000, 0, 1);
    }

    return { start, end };
  }, [period, selectedMonth, selectedYear]);

  // Filter data by period
  const filteredAppointments = useMemo(() =>
    appointments.filter(a => {
      const date = new Date(a.startTime);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [appointments, periodRange]
  );

  const filteredSessions = useMemo(() =>
    sessions.filter(s => {
      const date = new Date(s.date);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [sessions, periodRange]
  );

  const filteredInvoices = useMemo(() =>
    invoices.filter(i => {
      const date = new Date(i.date);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [invoices, periodRange]
  );

  // Monthly breakdown for year view
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(selectedYear, i, 1);
      const monthEnd = new Date(selectedYear, i + 1, 0, 23, 59, 59);

      const monthSessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d >= monthStart && d <= monthEnd;
      });

      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d >= monthStart && d <= monthEnd;
      });

      const revenue = monthInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const pending = monthInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0);

      return {
        month: i,
        name: new Date(selectedYear, i).toLocaleDateString('fr-FR', { month: 'short' }),
        sessions: monthSessions.length,
        revenue,
        pending,
        total: revenue + pending
      };
    });

    return months;
  }, [selectedYear, sessions, invoices]);

  // Core statistics
  const stats = useMemo(() => {
    const completedAppts = filteredAppointments.filter(a => a.status === ApptStatus.COMPLETED);
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalPending = filteredInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0);
    const totalSessions = filteredSessions.length;
    const avgSessionPrice = totalSessions > 0 ? (totalRevenue / totalSessions) : 0;

    const overdueInvoices = invoices.filter(inv =>
      inv.status !== InvoiceStatus.PAID &&
      new Date(inv.dueDate) < new Date() &&
      inv.amountPaid < inv.amountTTC
    );

    const activePatients = patients.filter(p => {
      const lastSession = sessions
        .filter(s => s.patientId === p.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!lastSession) return false;
      const daysSince = (new Date().getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 90;
    }).length;

    // Location breakdown
    const cabinetRevenue = completedAppts.filter(a => a.type === 'CABINET').reduce((sum, a) => sum + a.price, 0);
    const externalRevenue = completedAppts.filter(a => a.type !== 'CABINET').reduce((sum, a) => sum + a.price + (a.travelFee || 0), 0);

    return {
      totalRevenue,
      totalPending,
      totalSessions,
      avgSessionPrice,
      activePatients,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0),
      cabinetRevenue,
      externalRevenue,
      conversionRate: filteredAppointments.length > 0 ? (completedAppts.length / filteredAppointments.length) * 100 : 0
    };
  }, [filteredAppointments, filteredInvoices, filteredSessions, patients, sessions, invoices]);

  // Client ranking
  const clientStats = useMemo(() => {
    return patients.map(p => {
      const pSessions = filteredSessions.filter(s => s.patientId === p.id);
      const pInvoices = filteredInvoices.filter(inv => inv.patientName === p.name);

      const sessionCount = pSessions.length;
      const totalSpent = pInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

      const allPatientSessions = sessions.filter(s => s.patientId === p.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastVisit = allPatientSessions[0] ? new Date(allPatientSessions[0].date) : null;

      let status: 'ACTIVE' | 'RISK' | 'LOST' | 'NEW' = 'NEW';
      if (lastVisit) {
        const daysSince = (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 90) status = 'ACTIVE';
        else if (daysSince < 180) status = 'RISK';
        else status = 'LOST';
      }

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        owner: p.ownerName,
        sessionCount,
        totalSpent,
        lastVisit,
        status
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [patients, filteredSessions, filteredInvoices, sessions]);

  // Max value for chart scaling
  const maxRevenue = Math.max(...monthlyData.map(m => m.total), 1);

  const GradientCard = ({ title, value, subtitle, icon: Icon, gradient, trend }: any) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer ${gradient}`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 opacity-20">
        <Icon size={96} strokeWidth={1} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <Icon size={20} className="opacity-75" />
        </div>
        <h3 className="text-3xl font-bold mb-2">{value}</h3>
        {subtitle && (
          <div className="flex items-center text-sm opacity-90">
            {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : trend === 'down' ? <ArrowDownRight size={14} className="mr-1" /> : null}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tableau de Bord Analytique
          </h2>
          <p className="text-slate-500 text-sm mt-1">Pilotage de l'activité et prévisionnel</p>
        </div>

        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as Period)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              {p === 'week' ? '7 jours' : p === 'month' ? 'Mois' : p === 'quarter' ? 'Trimestre' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Period selector for month/year */}
      {period === 'month' && (
        <div className="flex gap-2 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <Calendar size={18} className="text-purple-600" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i).toLocaleDateString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          title="CA Encaissé"
          value={`${stats.totalRevenue.toFixed(0)} €`}
          subtitle={`+${stats.totalPending.toFixed(0)}€ à encaisser`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          trend="up"
        />
        <GradientCard
          title="Séances Réalisées"
          value={stats.totalSessions}
          subtitle={`Taux: ${stats.conversionRate.toFixed(0)}%`}
          icon={Activity}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <GradientCard
          title="Patients Actifs"
          value={stats.activePatients}
          subtitle={`${clientStats.filter(c => c.status === 'RISK').length} à risque`}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          trend={clientStats.filter(c => c.status === 'RISK').length > 0 ? 'down' : 'up'}
        />
        <GradientCard
          title="Panier Moyen"
          value={`${stats.avgSessionPrice.toFixed(0)} €`}
          subtitle={`Objectif: 85€`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          trend="up"
        />
      </div>

      {/* Overdue Invoices Alert */}
      {stats.overdueCount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <AlertCircle size={24} className="text-red-600 mr-3" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900">⚠️ Factures en Retard</h4>
              <p className="text-sm text-red-700">
                {stats.overdueCount} facture{stats.overdueCount > 1 ? 's' : ''} impayée{stats.overdueCount > 1 ? 's' : ''} •
                <span className="font-bold ml-1">{stats.overdueAmount.toFixed(0)}€ à recouvrer</span>
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg flex items-center">
              Gérer les rappels <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Monthly Revenue Chart (Year view) */}
      {period === 'year' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center">
              <BarChart3 size={20} className="mr-2 text-purple-600" />
              Évolution Mensuelle {selectedYear}
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center"><div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded mr-1"></div> CA Total</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded mr-1"></div> Encaissé</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-orange-400 rounded mr-1"></div> En attente</div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-64">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1 items-center justify-end flex-1">
                  {/* Total bar */}
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t-lg hover:shadow-lg transition-all relative group"
                    style={{ height: `${(m.total / maxRevenue) * 100}%`, minHeight: m.total > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {m.total.toFixed(0)}€
                    </div>
                    {/* Pending overlay */}
                    {m.pending > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-orange-400 rounded-t-lg"
                        style={{ height: `${(m.pending / m.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-2">{m.name}</div>
                <div className="text-[10px] text-slate-400">{m.sessions} séances</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location & Revenue Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center">
            <MapPin size={20} className="mr-2 text-purple-600" />
            Répartition Géographique
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-700">Cabinet</span>
                <span className="text-slate-500">{stats.cabinetRevenue.toFixed(0)} €</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
                  style={{ width: `${(stats.cabinetRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-700">Déplacements</span>
                <span className="text-slate-500">{stats.externalRevenue.toFixed(0)} €</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-600 rounded-full transition-all"
                  style={{ width: `${(stats.externalRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <h3 className="font-bold mb-4 flex items-center">
            <Target size={20} className="mr-2" />
            Objectifs & Performance
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1 opacity-90">
                <span>CA Mensuel</span>
                <span>{stats.totalRevenue.toFixed(0)}€ / 5000€</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((stats.totalRevenue / 5000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 opacity-90">
                <span>Séances Réalisées</span>
                <span>{stats.totalSessions} / 60</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((stats.totalSessions / 60) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 opacity-90">
                <span>Taux de Remplissage</span>
                <span>{stats.conversionRate.toFixed(0)}% / 80%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((stats.conversionRate / 80) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Ranking */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Award size={20} className="mr-2 text-yellow-500" />
            Top Clients - Période Sélectionnée
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 text-slate-600 font-bold">
              <tr>
                <th className="p-4 w-16 text-center">#</th>
                <th className="p-4">Patient</th>
                <th className="p-4 text-center">Séances</th>
                <th className="p-4 text-right">CA Généré</th>
                <th className="p-4">Dernière Visite</th>
                <th className="p-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientStats
                .filter(c => c.sessionCount > 0)
                .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.owner && c.owner.toLowerCase().includes(clientSearch.toLowerCase())))
                .slice(0, 20)
                .map((client, index) => (
                  <tr key={client.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="p-4 text-center">
                      {index < 3 ? (
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                          {index + 1}
                        </div>
                      ) : (
                        <span className="font-bold text-slate-400">{index + 1}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{client.name}</div>
                      {client.type !== PatientType.HUMAN && <div className="text-xs text-slate-500">{client.owner}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-purple-100 rounded-full text-sm font-bold text-purple-700">
                        {client.sessionCount}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      {client.totalSpent.toFixed(0)} €
                    </td>
                    <td className="p-4 text-slate-600">
                      {client.lastVisit ? client.lastVisit.toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wide ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : client.status === 'RISK' ? 'bg-orange-100 text-orange-700' : client.status === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {client.status === 'RISK' ? '⚠️ Relancer' : client.status === 'LOST' ? '❌ Perdu' : client.status === 'NEW' ? '🆕 Nouveau' : '✅ Fidèle'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatistics;
