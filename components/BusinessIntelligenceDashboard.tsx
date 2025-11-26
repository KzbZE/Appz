import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target, Award, AlertTriangle, Zap, BarChart3, PieChart, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const BusinessIntelligenceDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');

  // Mock Data - En production, récupérer depuis la DB
  const kpiData = {
    revenue: {
      current: 12450,
      previous: 10850,
      target: 15000,
      trend: 14.7
    },
    patients: {
      total: 127,
      new: 18,
      returning: 109,
      churnRate: 8.3
    },
    appointments: {
      total: 156,
      completed: 142,
      cancelled: 8,
      noShow: 6,
      fillRate: 91
    },
    satisfaction: {
      average: 4.7,
      nps: 72,
      reviews: 45
    }
  };

  const revenueChartData = [
    { month: 'Jan', revenue: 8500, expenses: 3200, profit: 5300 },
    { month: 'Fév', revenue: 9200, expenses: 3100, profit: 6100 },
    { month: 'Mar', revenue: 10100, expenses: 3400, profit: 6700 },
    { month: 'Avr', revenue: 9800, expenses: 3300, profit: 6500 },
    { month: 'Mai', revenue: 11200, expenses: 3600, profit: 7600 },
    { month: 'Jun', revenue: 12450, expenses: 3800, profit: 8650 }
  ];

  const patientTypeData = [
    { name: 'Humains', value: 75, color: '#10b981' },
    { name: 'Chevaux', value: 35, color: '#f59e0b' },
    { name: 'Chiens', value: 17, color: '#3b82f6' }
  ];

  const hourlyDistribution = [
    { hour: '8h', appointments: 2 },
    { hour: '9h', appointments: 5 },
    { hour: '10h', appointments: 8 },
    { hour: '11h', appointments: 7 },
    { hour: '14h', appointments: 4 },
    { hour: '15h', appointments: 6 },
    { hour: '16h', appointments: 9 },
    { hour: '17h', appointments: 5 }
  ];

  const topPatients = [
    { name: 'Marie Dubois', visits: 24, revenue: 1680, lastVisit: '2 jours' },
    { name: 'Club Équestre Royale', visits: 18, revenue: 2340, lastVisit: '1 semaine' },
    { name: 'Pierre Martin', visits: 15, revenue: 975, lastVisit: '3 jours' },
    { name: 'Sophie Laurent', visits: 12, revenue: 780, lastVisit: '1 jour' },
    { name: 'Centre Canin Pro', visits: 10, revenue: 850, lastVisit: '5 jours' }
  ];

  const insights = [
    {
      type: 'success',
      icon: TrendingUp,
      title: 'Croissance exceptionnelle',
      description: '+14.7% de CA ce mois vs mois dernier',
      action: 'Analyser les facteurs'
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Créneaux sous-utilisés',
      description: '14h-16h seulement 60% remplis',
      action: 'Optimiser planning'
    },
    {
      type: 'info',
      icon: Award,
      title: 'Excellente satisfaction',
      description: 'NPS de 72 (excellent)',
      action: 'Collecter témoignages'
    },
    {
      type: 'success',
      icon: Users,
      title: 'Acquisition forte',
      description: '18 nouveaux patients ce mois',
      action: 'Identifier source'
    }
  ];

  const predictions = {
    nextMonth: {
      revenue: 13200,
      confidence: 87,
      appointments: 165
    },
    quarter: {
      revenue: 39500,
      confidence: 76,
      growth: 18
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">📊 Business Intelligence</h1>
            <p className="text-indigo-100">Dashboard analytique avec prédictions IA</p>
          </div>

          <div className="flex gap-2">
            {(['7d', '30d', '3m', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  timeRange === range
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {range === '7d' && '7 jours'}
                {range === '30d' && '30 jours'}
                {range === '3m' && '3 mois'}
                {range === '1y' && '1 an'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              kpiData.revenue.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {kpiData.revenue.trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-bold">{Math.abs(kpiData.revenue.trend)}%</span>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Chiffre d'Affaires</h3>
          <p className="text-3xl font-black text-gray-800 mb-2">{kpiData.revenue.current.toLocaleString()}€</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
              style={{ width: `${(kpiData.revenue.current / kpiData.revenue.target) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Objectif: {kpiData.revenue.target.toLocaleString()}€
          </p>
        </div>

        {/* Patients */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              <span className="text-sm font-bold">+{kpiData.patients.new}</span>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Patients Total</h3>
          <p className="text-3xl font-black text-gray-800 mb-2">{kpiData.patients.total}</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Fidèles: {kpiData.patients.returning}</span>
            <span>Churn: {kpiData.patients.churnRate}%</span>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              <span className="text-sm font-bold">{kpiData.appointments.fillRate}%</span>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Rendez-vous</h3>
          <p className="text-3xl font-black text-gray-800 mb-2">{kpiData.appointments.total}</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>✅ {kpiData.appointments.completed}</span>
            <span>❌ {kpiData.appointments.cancelled}</span>
            <span>⚠️ {kpiData.appointments.noShow}</span>
          </div>
        </div>

        {/* Satisfaction */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Award className="text-yellow-600" size={24} />
            </div>
            <div className="flex items-center gap-1">
              {'⭐'.repeat(Math.round(kpiData.satisfaction.average))}
            </div>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Satisfaction</h3>
          <p className="text-3xl font-black text-gray-800 mb-2">{kpiData.satisfaction.average}/5</p>
          <div className="text-xs text-gray-500">
            NPS: {kpiData.satisfaction.nps} • {kpiData.satisfaction.reviews} avis
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <TrendingUp className="inline mr-2" size={20} />
            Évolution CA & Profit
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="CA" />
              <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <PieChart className="inline mr-2" size={20} />
            Répartition Patientèle
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={patientTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {patientTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <BarChart3 className="inline mr-2" size={20} />
          Distribution Horaire des RDV
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="appointments" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const colors = {
            success: 'from-green-500 to-emerald-500',
            warning: 'from-yellow-500 to-orange-500',
            info: 'from-blue-500 to-cyan-500'
          };

          return (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-br ${colors[insight.type as keyof typeof colors]} rounded-xl text-white`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-bold">
                    {insight.action} →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Predictions */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-2xl font-black mb-4">
          <Zap className="inline mr-2" size={24} />
          Prédictions IA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h4 className="font-bold mb-2">Mois Prochain</h4>
            <p className="text-4xl font-black mb-2">{predictions.nextMonth.revenue.toLocaleString()}€</p>
            <p className="text-sm text-purple-100">
              Confiance: {predictions.nextMonth.confidence}% • ~{predictions.nextMonth.appointments} RDV prévus
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h4 className="font-bold mb-2">Trimestre</h4>
            <p className="text-4xl font-black mb-2">{predictions.quarter.revenue.toLocaleString()}€</p>
            <p className="text-sm text-purple-100">
              Croissance estimée: +{predictions.quarter.growth}% • Confiance: {predictions.quarter.confidence}%
            </p>
          </div>
        </div>
      </div>

      {/* Top Patients */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <Users className="inline mr-2" size={20} />
          Top 5 Patients (Fidélité & CA)
        </h3>

        <div className="space-y-3">
          {topPatients.map((patient, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black">
                  #{idx + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{patient.name}</p>
                  <p className="text-sm text-gray-500">
                    {patient.visits} visites • Dernière visite: {patient.lastVisit}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-green-600">{patient.revenue}€</p>
                <p className="text-xs text-gray-500">CA total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligenceDashboard;
