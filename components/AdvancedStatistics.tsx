import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Invoice, Session, PatientType, ApptStatus, InvoiceStatus } from '../types';
import { TrendingUp, Users, PieChart, Award, Activity, DollarSign, MapPin, ArrowUpRight, ArrowDownRight, Search, Calendar, Target, AlertCircle, ChevronRight, Zap, BarChart3, Clock, Route, Percent, TrendingDown, Star, Heart, Navigation, Sparkles, Crown, Trophy, Flame } from 'lucide-react';
import { useAppointments, usePatients, useInvoices, useSessions } from '../hooks/useSupabaseData';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

const AdvancedStatistics: React.FC = () => {
  const { data: appointments } = useAppointments();
  const { data: patients } = usePatients();
  const { data: invoices } = useInvoices();
  const { data: sessions } = useSessions();

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

  // Previous period for comparison
  const previousPeriodRange = useMemo(() => {
    const duration = periodRange.end.getTime() - periodRange.start.getTime();
    return {
      start: new Date(periodRange.start.getTime() - duration),
      end: new Date(periodRange.start.getTime() - 1)
    };
  }, [periodRange]);

  // Filter data by period
  const filteredAppointments = useMemo(() =>
    appointments.filter(a => {
      const date = new Date(a.startTime);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [appointments, periodRange]
  );

  const previousAppointments = useMemo(() =>
    appointments.filter(a => {
      const date = new Date(a.startTime);
      return date >= previousPeriodRange.start && date <= previousPeriodRange.end;
    }),
    [appointments, previousPeriodRange]
  );

  const filteredSessions = useMemo(() =>
    sessions.filter(s => {
      const date = new Date(s.date);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [sessions, periodRange]
  );

  const previousSessions = useMemo(() =>
    sessions.filter(s => {
      const date = new Date(s.date);
      return date >= previousPeriodRange.start && date <= previousPeriodRange.end;
    }),
    [sessions, previousPeriodRange]
  );

  const filteredInvoices = useMemo(() =>
    invoices.filter(i => {
      const date = new Date(i.date);
      return date >= periodRange.start && date <= periodRange.end;
    }),
    [invoices, periodRange]
  );

  const previousInvoices = useMemo(() =>
    invoices.filter(i => {
      const date = new Date(i.date);
      return date >= previousPeriodRange.start && date <= previousPeriodRange.end;
    }),
    [invoices, previousPeriodRange]
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

      const monthAppts = appointments.filter(a => {
        const d = new Date(a.startTime);
        return d >= monthStart && d <= monthEnd;
      });

      const revenue = monthInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const pending = monthInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0);

      return {
        month: i,
        name: new Date(selectedYear, i).toLocaleDateString('fr-FR', { month: 'short' }),
        sessions: monthSessions.length,
        appointments: monthAppts.length,
        revenue,
        pending,
        total: revenue + pending
      };
    });

    return months;
  }, [selectedYear, sessions, invoices, appointments]);

  // ADVANCED STATISTICS
  const stats = useMemo(() => {
    const completedAppts = filteredAppointments.filter(a => a.status === ApptStatus.COMPLETED);
    const prevCompletedAppts = previousAppointments.filter(a => a.status === ApptStatus.COMPLETED);

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const prevRevenue = previousInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const totalPending = filteredInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0);
    const totalSessions = filteredSessions.length;
    const prevSessions = previousSessions.length;
    const sessionGrowth = prevSessions > 0 ? ((totalSessions - prevSessions) / prevSessions) * 100 : 0;

    const avgSessionPrice = totalSessions > 0 ? (totalRevenue / totalSessions) : 0;
    const prevAvgPrice = prevSessions > 0 ? (prevRevenue / prevSessions) : 0;
    const avgPriceGrowth = prevAvgPrice > 0 ? ((avgSessionPrice - prevAvgPrice) / prevAvgPrice) * 100 : 0;

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
    const cabinetAppts = completedAppts.filter(a => a.type === 'CABINET');
    const externalAppts = completedAppts.filter(a => a.type !== 'CABINET' && a.type !== 'BLOCK');
    const cabinetRevenue = cabinetAppts.reduce((sum, a) => sum + a.price, 0);
    const externalRevenue = externalAppts.reduce((sum, a) => sum + a.price + (a.travelFee || 0), 0);

    // Travel stats
    const totalDistance = externalAppts.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
    const totalTravelTime = externalAppts.reduce((sum, a) => sum + (a.travelDurationMin || 0), 0);
    const totalTravelFees = externalAppts.reduce((sum, a) => sum + (a.travelFee || 0), 0);
    const avgDistance = externalAppts.length > 0 ? totalDistance / externalAppts.length : 0;

    // Time analysis
    const totalWorkMinutes = completedAppts.reduce((sum, a) => sum + a.durationMin, 0);
    const totalWorkHours = totalWorkMinutes / 60;
    const revenuePerHour = totalWorkHours > 0 ? totalRevenue / totalWorkHours : 0;

    // Conversion rates
    const conversionRate = filteredAppointments.length > 0 ? (completedAppts.length / filteredAppointments.length) * 100 : 0;
    const noShowRate = filteredAppointments.filter(a => a.status === ApptStatus.CANCELLED).length / (filteredAppointments.length || 1) * 100;

    // Patient type breakdown
    const humanRevenue = completedAppts.filter(a => {
      const p = patients.find(pt => pt.id === a.patientId);
      return p?.type === PatientType.HUMAN;
    }).reduce((sum, a) => sum + a.price, 0);

    const equineRevenue = completedAppts.filter(a => {
      const p = patients.find(pt => pt.id === a.patientId);
      return p?.type === PatientType.EQUINE;
    }).reduce((sum, a) => sum + a.price, 0);

    const canineRevenue = completedAppts.filter(a => {
      const p = patients.find(pt => pt.id === a.patientId);
      return p?.type === PatientType.CANINE;
    }).reduce((sum, a) => sum + a.price, 0);

    // New patients this period
    const newPatients = patients.filter(p => {
      const firstSession = sessions
        .filter(s => s.patientId === p.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      if (!firstSession) return false;
      const date = new Date(firstSession.date);
      return date >= periodRange.start && date <= periodRange.end;
    }).length;

    // Retention rate
    const patientsWithMultipleSessions = patients.filter(p => {
      const pSessions = filteredSessions.filter(s => s.patientId === p.id);
      return pSessions.length > 1;
    }).length;
    const retentionRate = activePatients > 0 ? (patientsWithMultipleSessions / activePatients) * 100 : 0;

    // Forecast next month
    const avgMonthlyRevenue = monthlyData.filter(m => m.revenue > 0).reduce((sum, m) => sum + m.revenue, 0) / Math.max(monthlyData.filter(m => m.revenue > 0).length, 1);
    const forecastNextMonth = avgMonthlyRevenue * (1 + revenueGrowth / 100);

    return {
      totalRevenue,
      revenueGrowth,
      totalPending,
      totalSessions,
      sessionGrowth,
      avgSessionPrice,
      avgPriceGrowth,
      activePatients,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0),
      cabinetRevenue,
      externalRevenue,
      totalDistance,
      totalTravelTime,
      totalTravelFees,
      avgDistance,
      revenuePerHour,
      conversionRate,
      noShowRate,
      humanRevenue,
      equineRevenue,
      canineRevenue,
      newPatients,
      retentionRate,
      forecastNextMonth,
      cabinetCount: cabinetAppts.length,
      externalCount: externalAppts.length
    };
  }, [filteredAppointments, previousAppointments, filteredInvoices, previousInvoices, filteredSessions, previousSessions, patients, sessions, invoices, monthlyData, periodRange]);

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

      const avgPerSession = sessionCount > 0 ? totalSpent / sessionCount : 0;
      const lifetimeValue = totalSpent;

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        owner: p.ownerName,
        sessionCount,
        totalSpent,
        lastVisit,
        status,
        avgPerSession,
        lifetimeValue
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [patients, filteredSessions, filteredInvoices, sessions]);

  // Max value for chart scaling
  const maxRevenue = Math.max(...monthlyData.map(m => m.total), 1);

  const GlassCard = ({ title, value, subtitle, icon: Icon, gradient, trend, trendValue, sparkle }: any) => (
    <div className={`group relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer backdrop-blur-xl border border-white/20 ${gradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 opacity-20 group-hover:opacity-30 transition-opacity duration-500 group-hover:rotate-12">
        <Icon size={128} strokeWidth={1} />
      </div>
      {sparkle && (
        <div className="absolute top-4 right-4">
          <Sparkles size={20} className="animate-pulse" />
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold opacity-90 uppercase tracking-wider">{title}</p>
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon size={20} className="opacity-90" />
          </div>
        </div>
        <h3 className="text-4xl font-black mb-3 tracking-tight">{value}</h3>
        {subtitle && (
          <div className="flex items-center text-sm font-semibold opacity-95">
            {trend === 'up' ? (
              <div className="flex items-center px-2 py-1 bg-green-500/30 rounded-full mr-2">
                <ArrowUpRight size={14} className="mr-1" />
                <span>+{trendValue}%</span>
              </div>
            ) : trend === 'down' ? (
              <div className="flex items-center px-2 py-1 bg-red-500/30 rounded-full mr-2">
                <ArrowDownRight size={14} className="mr-1" />
                <span>{trendValue}%</span>
              </div>
            ) : null}
            <span className="opacity-80">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      {/* Ultra Modern Header with Glassmorphism - Zoho Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <BarChart3 size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">
                  Analytics Pro
                </h2>
                <p className="text-teal-100 text-sm font-semibold mt-1 flex items-center">
                  <Sparkles size={14} className="mr-1" />
                  Intelligence artificielle • Prévisionnel avancé
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-xl">
            {['week', 'month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as Period)}
                className={`px-6 py-3 text-sm font-black rounded-xl transition-all duration-300 ${
                  period === p
                    ? 'bg-white text-teal-600 shadow-lg scale-105'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {p === 'week' ? '7J' : p === 'month' ? 'MOIS' : p === 'quarter' ? 'TRIM' : 'ANNÉE'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period selector for month/year */}
      {(period === 'month' || period === 'year') && (
        <div className="flex gap-3 items-center bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-lg">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white">
            <Calendar size={20} />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 transition-all bg-white"
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
            className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-200 focus:border-teal-500 transition-all bg-white"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* Ultra Modern KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard
          title="Chiffre d'Affaires"
          value={`${stats.totalRevenue.toFixed(0)}€`}
          subtitle={`vs période précédente`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
          trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(stats.revenueGrowth).toFixed(1)}
          sparkle={stats.revenueGrowth > 20}
        />
        <GlassCard
          title="Séances Réalisées"
          value={stats.totalSessions}
          subtitle={`vs période précédente`}
          icon={Activity}
          gradient="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600"
          trend={stats.sessionGrowth >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(stats.sessionGrowth).toFixed(1)}
          sparkle={stats.sessionGrowth > 15}
        />
        <GlassCard
          title="Panier Moyen"
          value={`${stats.avgSessionPrice.toFixed(0)}€`}
          subtitle={`vs période précédente`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600"
          trend={stats.avgPriceGrowth >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(stats.avgPriceGrowth).toFixed(1)}
          sparkle={stats.avgPriceGrowth > 10}
        />
        <GlassCard
          title="Revenu / Heure"
          value={`${stats.revenuePerHour.toFixed(0)}€`}
          subtitle="Rentabilité temps"
          icon={Clock}
          gradient="bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600"
          sparkle={stats.revenuePerHour > 80}
        />
      </div>

      {/* Ultra Modern KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard
          title="Patients Actifs"
          value={stats.activePatients}
          subtitle={`${stats.retentionRate.toFixed(0)}% fidélisation`}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600"
          sparkle={stats.retentionRate > 70}
        />
        <GlassCard
          title="Nouveaux Patients"
          value={stats.newPatients}
          subtitle="Cette période"
          icon={Star}
          gradient="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600"
          sparkle={stats.newPatients > 5}
        />
        <GlassCard
          title="Taux de Remplissage"
          value={`${stats.conversionRate.toFixed(0)}%`}
          subtitle={`No-show: ${stats.noShowRate.toFixed(0)}%`}
          icon={Percent}
          gradient="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"
          trend={stats.conversionRate > 75 ? 'up' : 'down'}
          sparkle={stats.conversionRate > 85}
        />
        <GlassCard
          title="Prévision M+1"
          value={`${stats.forecastNextMonth.toFixed(0)}€`}
          subtitle="Forecast IA"
          icon={Zap}
          gradient="bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600"
          sparkle={true}
        />
      </div>

      {/* Overdue Alert - Zoho Style */}
      {stats.overdueCount > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-red-600 p-6 text-white shadow-2xl border-2 border-orange-300 animate-pulse">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm mr-4">
                <AlertCircle size={32} />
              </div>
              <div>
                <h4 className="font-black text-xl mb-1">🚨 Factures Impayées</h4>
                <p className="text-sm font-bold opacity-90">
                  {stats.overdueCount} facture{stats.overdueCount > 1 ? 's' : ''} en retard •
                  <span className="ml-2 px-3 py-1 bg-white/30 rounded-full">{stats.overdueAmount.toFixed(0)}€</span>
                </p>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-red-600 rounded-xl font-black text-sm hover:bg-red-50 shadow-2xl flex items-center transition-all hover:scale-105">
              Relancer <ChevronRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Monthly Evolution Chart - Zoho Style */}
      {period === 'year' && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl text-white">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-black text-2xl text-slate-800">
                  Évolution {selectedYear}
                </h3>
                <p className="text-sm text-slate-500 font-semibold">Performance mensuelle détaillée</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-bold">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-2 shadow-lg"></div>
                Total
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mr-2 shadow-lg"></div>
                Encaissé
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-400 rounded-full mr-2 shadow-lg"></div>
                Attente
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-80">
            {monthlyData.map((m, idx) => (
              <div key={m.month} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col gap-1 items-center justify-end flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 via-cyan-500 to-blue-500 rounded-t-2xl hover:shadow-2xl transition-all duration-300 relative group/bar cursor-pointer transform hover:scale-105"
                    style={{ height: `${(m.total / maxRevenue) * 100}%`, minHeight: m.total > 0 ? '12px' : '0' }}
                  >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black opacity-0 group-hover/bar:opacity-100 transition-all duration-300 shadow-2xl whitespace-nowrap border border-white/10">
                      <div className="text-center mb-1">{m.total.toFixed(0)}€</div>
                      <div className="text-[10px] opacity-75">{m.sessions} séances</div>
                    </div>
                    {m.pending > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-orange-400 rounded-t-2xl shadow-inner"
                        style={{ height: `${(m.pending / m.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-700 font-bold mt-3 uppercase">{m.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{m.sessions}s</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Breakdown - Zoho Style */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl text-white">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800">Répartition Lieux</h3>
              <p className="text-xs text-slate-500 font-semibold">Cabinet vs Déplacements</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-slate-700">🏥 Cabinet</span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-black">{stats.cabinetCount} séances</span>
                </div>
                <span className="text-slate-900 font-black text-xl">{stats.cabinetRevenue.toFixed(0)}€</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-600 rounded-full transition-all duration-1000 ease-out shadow-lg group-hover:shadow-xl"
                  style={{ width: `${(stats.cabinetRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-lg">
                  {((stats.cabinetRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-slate-700">🚗 Déplacements</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">{stats.externalCount} séances</span>
                </div>
                <span className="text-slate-900 font-black text-xl">{stats.externalRevenue.toFixed(0)}€</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-full transition-all duration-1000 ease-out shadow-lg group-hover:shadow-xl"
                  style={{ width: `${(stats.externalRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-lg">
                  {((stats.externalRevenue / (stats.cabinetRevenue + stats.externalRevenue || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Travel Stats */}
            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                  <div className="text-3xl font-black text-blue-600 mb-1">{stats.totalDistance.toFixed(0)}</div>
                  <div className="text-xs font-bold text-blue-700 uppercase">KM Total</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
                  <div className="text-3xl font-black text-teal-600 mb-1">{stats.avgDistance.toFixed(1)}</div>
                  <div className="text-xs font-bold text-teal-700 uppercase">KM Moyen</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                  <div className="text-3xl font-black text-amber-600 mb-1">{stats.totalTravelFees.toFixed(0)}€</div>
                  <div className="text-xs font-bold text-amber-700 uppercase">Frais KM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Type Breakdown - Zoho Style */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800">CA par Type Patient</h3>
              <p className="text-xs text-slate-500 font-semibold">Humain • Équin • Canin</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="group">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-lg text-slate-700">👤 Humains</span>
                <span className="text-slate-900 font-black text-xl">{stats.humanRevenue.toFixed(0)}€</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${(stats.humanRevenue / (stats.totalRevenue || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-lg">
                  {((stats.humanRevenue / (stats.totalRevenue || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-lg text-slate-700">🐴 Équins</span>
                <span className="text-slate-900 font-black text-xl">{stats.equineRevenue.toFixed(0)}€</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${(stats.equineRevenue / (stats.totalRevenue || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-lg">
                  {((stats.equineRevenue / (stats.totalRevenue || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-lg text-slate-700">🐕 Canins</span>
                <span className="text-slate-900 font-black text-xl">{stats.canineRevenue.toFixed(0)}€</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${(stats.canineRevenue / (stats.totalRevenue || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-lg">
                  {((stats.canineRevenue / (stats.totalRevenue || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Extra Stats */}
            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <div className="flex items-center justify-center mb-2">
                    <Heart size={20} className="text-green-600" />
                  </div>
                  <div className="text-2xl font-black text-green-600 mb-1">{stats.retentionRate.toFixed(0)}%</div>
                  <div className="text-xs font-bold text-green-700 uppercase">Fidélité</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100">
                  <div className="flex items-center justify-center mb-2">
                    <Star size={20} className="text-yellow-600" />
                  </div>
                  <div className="text-2xl font-black text-yellow-600 mb-1">{stats.newPatients}</div>
                  <div className="text-xs font-bold text-yellow-700 uppercase">Nouveaux</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Ranking - Zoho Style */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Trophy size={28} />
              </div>
              <div>
                <h3 className="font-black text-2xl flex items-center gap-2">
                  🏆 Top Clients VIP
                  <Flame size={24} className="animate-pulse" />
                </h3>
                <p className="text-sm font-bold opacity-90">Classement par chiffre d'affaires généré</p>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={18} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-sm font-bold text-white placeholder-white/60 outline-none focus:ring-4 focus:ring-white/30"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-slate-700">
              <tr>
                <th className="p-5 w-20 text-center font-black uppercase text-xs tracking-wider">Rang</th>
                <th className="p-5 font-black uppercase text-xs tracking-wider text-left">Patient</th>
                <th className="p-5 text-center font-black uppercase text-xs tracking-wider">Séances</th>
                <th className="p-5 text-right font-black uppercase text-xs tracking-wider">CA Total</th>
                <th className="p-5 text-right font-black uppercase text-xs tracking-wider">Moy/Séance</th>
                <th className="p-5 font-black uppercase text-xs tracking-wider">Dernière</th>
                <th className="p-5 text-center font-black uppercase text-xs tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {clientStats
                .filter(c => c.sessionCount > 0)
                .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.owner && c.owner.toLowerCase().includes(clientSearch.toLowerCase())))
                .slice(0, 25)
                .map((client, index) => (
                  <tr key={client.id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 group">
                    <td className="p-5 text-center">
                      {index < 3 ? (
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white font-black text-lg shadow-2xl transform group-hover:scale-110 transition-transform ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 animate-pulse' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600' :
                          'bg-gradient-to-br from-orange-400 via-orange-500 to-red-600'
                        }`}>
                          {index === 0 ? <Crown size={24} /> : index + 1}
                        </div>
                      ) : (
                        <span className="font-black text-lg text-slate-400">{index + 1}</span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="font-black text-base text-slate-800 group-hover:text-teal-600 transition-colors">{client.name}</div>
                      {client.type !== PatientType.HUMAN && (
                        <div className="text-xs text-slate-500 font-semibold mt-1">{client.owner}</div>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className="inline-block px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl text-sm font-black text-teal-700 shadow-sm">
                        {client.sessionCount}
                      </span>
                    </td>
                    <td className="p-5 text-right font-black text-lg text-slate-800">
                      {client.totalSpent.toFixed(0)}€
                    </td>
                    <td className="p-5 text-right font-bold text-sm text-slate-600">
                      {client.avgPerSession.toFixed(0)}€
                    </td>
                    <td className="p-5 text-slate-600 font-semibold text-sm">
                      {client.lastVisit ? client.lastVisit.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-'}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-block px-4 py-2 rounded-xl text-xs uppercase font-black tracking-wider shadow-sm ${
                        client.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        client.status === 'RISK' ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700' :
                        client.status === 'NEW' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700' :
                        'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'
                      }`}>
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
