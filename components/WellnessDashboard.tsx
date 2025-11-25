import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  Heart,
  Brain,
  Moon,
  Dumbbell,
  Coffee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import {
  trackDailyMetrics,
  calculateWorkLifeBalance,
  checkBurnoutRisk,
  getWellnessRecommendations,
  getMonthlyReport,
  getAllGoals
} from '../services/practitionerWellnessService';

interface DailyMetrics {
  date: string;
  hoursWorked: number;
  mentalLoad: number;
  physicalFatigue: number;
  satisfaction: number;
  stress: number;
  sleepHours: number;
  exerciseMinutes: number;
  breaks: number;
}

const WellnessDashboard: React.FC = () => {
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const [todayMetrics, setTodayMetrics] = useState<Partial<DailyMetrics>>({
    hoursWorked: 0,
    mentalLoad: 5,
    physicalFatigue: 5,
    satisfaction: 7,
    stress: 5,
    sleepHours: 7,
    exerciseMinutes: 0,
    breaks: 0
  });

  const [workLifeBalance, setWorkLifeBalance] = useState<any>(null);
  const [burnoutRisk, setBurnoutRisk] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [showMetricsForm, setShowMetricsForm] = useState(false);

  useEffect(() => {
    // Calculer les heures travaillées aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });

    const totalMinutes = todayAppointments.reduce((sum, apt) => sum + apt.durationMin, 0);
    const hours = totalMinutes / 60;

    setTodayMetrics(prev => ({ ...prev, hoursWorked: hours }));
  }, [appointments]);

  useEffect(() => {
    // Charger les données sauvegardées
    const loadData = async () => {
      const storedMetrics = localStorage.getItem('wellness_metrics_today');
      if (storedMetrics) {
        const metrics = JSON.parse(storedMetrics);
        const metricsDate = new Date(metrics.date);
        const today = new Date();

        if (metricsDate.toDateString() === today.toDateString()) {
          setTodayMetrics(metrics);
        }
      }

      // Charger les objectifs
      const goalsData = await getAllGoals();
      setGoals(goalsData);
    };

    loadData();
  }, []);

  const handleSaveMetrics = async () => {
    const metrics: DailyMetrics = {
      date: new Date().toISOString(),
      hoursWorked: todayMetrics.hoursWorked || 0,
      mentalLoad: todayMetrics.mentalLoad || 5,
      physicalFatigue: todayMetrics.physicalFatigue || 5,
      satisfaction: todayMetrics.satisfaction || 7,
      stress: todayMetrics.stress || 5,
      sleepHours: todayMetrics.sleepHours || 7,
      exerciseMinutes: todayMetrics.exerciseMinutes || 0,
      breaks: todayMetrics.breaks || 0
    };

    // Sauvegarder
    await trackDailyMetrics(metrics);
    localStorage.setItem('wellness_metrics_today', JSON.stringify(metrics));

    // Calculer équilibre vie pro/perso
    const balance = await calculateWorkLifeBalance(new Date(), new Date());
    setWorkLifeBalance(balance);

    // Vérifier risque burnout
    const risk = await checkBurnoutRisk([metrics]);
    setBurnoutRisk(risk);

    // Obtenir recommandations
    const recs = await getWellnessRecommendations(metrics, balance);
    setRecommendations(recs);

    // Rapport mensuel
    const report = await getMonthlyReport(new Date().getFullYear(), new Date().getMonth() + 1);
    setMonthlyReport(report);

    setShowMetricsForm(false);
    alert('✅ Métriques sauvegardées avec succès !');
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl shadow-lg">
              <Heart className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Bien-être Praticien</h1>
              <p className="text-slate-600">Suivez votre équilibre vie professionnelle / personnelle</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowMetricsForm(!showMetricsForm)}
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Activity size={24} />
            <span className="font-bold">Enregistrer métriques du jour</span>
          </button>

          <button
            onClick={async () => {
              const report = await getMonthlyReport(new Date().getFullYear(), new Date().getMonth() + 1);
              setMonthlyReport(report);
              alert('Rapport mensuel généré !');
            }}
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <BarChart3 size={24} />
            <span className="font-bold">Rapport Mensuel</span>
          </button>
        </div>

        {/* Formulaire métriques */}
        {showMetricsForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Métriques du jour</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heures travaillées */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Clock className="inline mr-2" size={16} />
                  Heures travaillées
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={todayMetrics.hoursWorked}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, hoursWorked: parseFloat(e.target.value) })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              {/* Charge mentale */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Brain className="inline mr-2" size={16} />
                  Charge mentale (0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={todayMetrics.mentalLoad}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, mentalLoad: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-slate-900">{todayMetrics.mentalLoad}/10</div>
              </div>

              {/* Fatigue physique */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Activity className="inline mr-2" size={16} />
                  Fatigue physique (0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={todayMetrics.physicalFatigue}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, physicalFatigue: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-slate-900">{todayMetrics.physicalFatigue}/10</div>
              </div>

              {/* Satisfaction */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Heart className="inline mr-2" size={16} />
                  Satisfaction (0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={todayMetrics.satisfaction}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, satisfaction: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-slate-900">{todayMetrics.satisfaction}/10</div>
              </div>

              {/* Stress */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <AlertTriangle className="inline mr-2" size={16} />
                  Niveau de stress (0-10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={todayMetrics.stress}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, stress: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-2xl font-bold text-slate-900">{todayMetrics.stress}/10</div>
              </div>

              {/* Sommeil */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Moon className="inline mr-2" size={16} />
                  Heures de sommeil
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={todayMetrics.sleepHours}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, sleepHours: parseFloat(e.target.value) })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              {/* Exercice */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Dumbbell className="inline mr-2" size={16} />
                  Exercice (minutes)
                </label>
                <input
                  type="number"
                  value={todayMetrics.exerciseMinutes}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, exerciseMinutes: parseInt(e.target.value) })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              {/* Pauses */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Coffee className="inline mr-2" size={16} />
                  Nombre de pauses
                </label>
                <input
                  type="number"
                  value={todayMetrics.breaks}
                  onChange={(e) => setTodayMetrics({ ...todayMetrics, breaks: parseInt(e.target.value) })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveMetrics}
              className="mt-6 w-full p-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Enregistrer
            </button>
          </div>
        )}

        {/* Équilibre Vie Pro/Perso */}
        {workLifeBalance && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Target size={24} className="text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Équilibre Vie Professionnelle / Personnelle</h2>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700">Score Global</span>
                <span className={`text-4xl font-black ${getScoreColor(workLifeBalance.balanceScore)}`}>
                  {workLifeBalance.balanceScore}/100
                </span>
              </div>

              <div className="relative w-full h-8 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                    workLifeBalance.balanceScore >= 75
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : workLifeBalance.balanceScore >= 50
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                      : 'bg-gradient-to-r from-red-500 to-pink-600'
                  }`}
                  style={{ width: `${workLifeBalance.balanceScore}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Heures travaillées</p>
                <p className="text-2xl font-bold text-slate-900">{workLifeBalance.workHours}h</p>
              </div>

              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Satisfaction moyenne</p>
                <p className="text-2xl font-bold text-slate-900">{workLifeBalance.avgSatisfaction}/10</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Stress moyen</p>
                <p className="text-2xl font-bold text-slate-900">{workLifeBalance.avgStress}/10</p>
              </div>
            </div>
          </div>
        )}

        {/* Risque de burnout */}
        {burnoutRisk && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            burnoutRisk.risk === 'high' ? 'bg-red-50 border-2 border-red-200' :
            burnoutRisk.risk === 'medium' ? 'bg-yellow-50 border-2 border-yellow-200' :
            'bg-green-50 border-2 border-green-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className={
                burnoutRisk.risk === 'high' ? 'text-red-600' :
                burnoutRisk.risk === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              } />
              <h2 className="text-xl font-bold text-slate-900">
                Risque de Burnout: {
                  burnoutRisk.risk === 'high' ? 'ÉLEVÉ' :
                  burnoutRisk.risk === 'medium' ? 'MODÉRÉ' :
                  'FAIBLE'
                }
              </h2>
            </div>

            {burnoutRisk.factors.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold text-slate-900 mb-2">Facteurs de risque:</p>
                <ul className="space-y-2">
                  {burnoutRisk.factors.map((factor: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Recommandations</h2>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <CheckCircle className="flex-shrink-0 text-teal-600 mt-0.5" size={20} />
                  <p className="text-slate-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rapport mensuel */}
        {monthlyReport && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={24} className="text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">Rapport Mensuel</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Heures totales</p>
                <p className="text-2xl font-bold text-slate-900">{monthlyReport.totalHours}h</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Satisfaction</p>
                <p className="text-2xl font-bold text-slate-900">{monthlyReport.avgSatisfaction}/10</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Stress moyen</p>
                <p className="text-2xl font-bold text-slate-900">{monthlyReport.avgStress}/10</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Équilibre</p>
                <p className="text-2xl font-bold text-slate-900">{monthlyReport.balanceScore}/100</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WellnessDashboard;
