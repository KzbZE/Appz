import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  Brain,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  Lightbulb,
  Send,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  analyzePatientHistory,
  suggestOptimalTimeSlots,
  sendSuggestionToPatient,
  getPlanningInsights,
  predictFillingRate
} from '../services/aiPlanningAssistant';

const AIPlanning: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientAnalysis, setPatientAnalysis] = useState<any>(null);
  const [timeSlotSuggestions, setTimeSlotSuggestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [fillingRatePrediction, setFillingRatePrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les insights automatiquement
    loadInsights();
    loadFillingRatePrediction();
  }, [appointments]);

  const loadInsights = async () => {
    const insightsData = await getPlanningInsights(appointments, patients);
    setInsights(insightsData);
  };

  const loadFillingRatePrediction = async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const prediction = await predictFillingRate(nextWeek, appointments);
    setFillingRatePrediction(prediction);
  };

  const handleAnalyzePatient = async () => {
    if (!selectedPatientId) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    setLoading(true);

    try {
      const analysis = await analyzePatientHistory(selectedPatientId, appointments, patients);
      setPatientAnalysis(analysis);

      if (analysis.needsFollowUp) {
        const suggestions = await suggestOptimalTimeSlots(
          selectedPatientId,
          appointments,
          patients,
          new Date()
        );
        setTimeSlotSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      alert('Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async (slot: any) => {
    if (!selectedPatientId) return;

    try {
      await sendSuggestionToPatient(selectedPatientId, slot, 'sms');
      alert('✅ Suggestion envoyée par SMS au patient');
    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('Erreur lors de l\'envoi de la suggestion');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100';
    if (confidence >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Assistant Planification IA</h1>
              <p className="text-slate-600">Optimisez votre planning avec l'intelligence artificielle</p>
            </div>
          </div>
        </div>

        {/* Prédiction taux de remplissage */}
        {fillingRatePrediction && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={24} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">Prédiction Semaine Prochaine</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Taux de remplissage</span>
                  <TrendingUp className={fillingRatePrediction.predicted >= 0.7 ? 'text-green-600' : 'text-yellow-600'} size={20} />
                </div>
                <p className="text-3xl font-black text-slate-900">{Math.round(fillingRatePrediction.predicted * 100)}%</p>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-1000"
                    style={{ width: `${fillingRatePrediction.predicted * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Créneaux disponibles</p>
                <p className="text-3xl font-black text-slate-900">{fillingRatePrediction.availableSlots}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Confiance IA</p>
                <p className="text-3xl font-black text-slate-900">{Math.round(fillingRatePrediction.confidence * 100)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Insights de planification */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Patients inactifs */}
            {insights.inactivePatients && insights.inactivePatients.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Users className="text-red-600" size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900">Patients Inactifs</h3>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-2">{insights.inactivePatients.length}</p>
                <p className="text-sm text-slate-600">Risque de perte</p>
              </div>
            )}

            {/* Créneaux vides récurrents */}
            {insights.emptySlots && insights.emptySlots.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="text-yellow-600" size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900">Créneaux Vides</h3>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-2">{insights.emptySlots.length}</p>
                <p className="text-sm text-slate-600">Créneaux récurrents</p>
              </div>
            )}

            {/* Patterns géographiques */}
            {insights.geoPatterns && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="text-blue-600" size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900">Zones Actives</h3>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-2">{insights.geoPatterns.length}</p>
                <p className="text-sm text-slate-600">Patterns identifiés</p>
              </div>
            )}
          </div>
        )}

        {/* Analyse patient */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target size={24} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Analyser un Patient</h2>
          </div>

          <div className="flex gap-4 mb-6">
            <select
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none"
            >
              <option value="">Sélectionnez un patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleAnalyzePatient}
              disabled={!selectedPatientId || loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>

          {/* Résultat analyse patient */}
          {patientAnalysis && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Fréquence moyenne</p>
                    <p className="text-xl font-bold text-slate-900">{patientAnalysis.avgDaysBetween} jours</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Jour préféré</p>
                    <p className="text-xl font-bold text-slate-900">{patientAnalysis.preferredDay}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Heure préférée</p>
                    <p className="text-xl font-bold text-slate-900">{patientAnalysis.preferredHour}h</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Suivi nécessaire</p>
                    <p className={`text-xl font-bold ${patientAnalysis.needsFollowUp ? 'text-red-600' : 'text-green-600'}`}>
                      {patientAnalysis.needsFollowUp ? 'OUI' : 'NON'}
                    </p>
                  </div>
                </div>

                {patientAnalysis.nextRecommendedDate && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Prochaine séance recommandée</p>
                    <p className="text-lg font-bold text-slate-900">
                      {new Date(patientAnalysis.nextRecommendedDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-slate-600">Confiance:</span>
                      <span className={`font-bold ${getConfidenceColor(patientAnalysis.confidence)}`}>
                        {Math.round(patientAnalysis.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions de créneaux */}
              {timeSlotSuggestions.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="text-yellow-600" size={20} />
                    Créneaux suggérés pour ce patient
                  </h3>
                  <div className="space-y-3">
                    {timeSlotSuggestions.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-indigo-600" size={20} />
                            <p className="font-bold text-slate-900">
                              {new Date(slot.datetime).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock size={16} />
                              {slot.time}
                            </span>
                            <span className={`px-3 py-1 rounded-full font-semibold ${getConfidenceBg(slot.score)}`}>
                              Score: {Math.round(slot.score * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">{slot.reason}</p>
                        </div>

                        <button
                          onClick={() => handleSendSuggestion(slot)}
                          className="ml-4 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights détaillés */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patients inactifs détaillés */}
            {insights.inactivePatients && insights.inactivePatients.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={24} className="text-red-600" />
                  <h3 className="text-lg font-bold text-slate-900">Patients à Relancer</h3>
                </div>

                <div className="space-y-3">
                  {insights.inactivePatients.slice(0, 5).map((patient: any) => {
                    const patientData = patients.find(p => p.id === patient.patientId);
                    return (
                      <div key={patient.patientId} className="p-3 bg-red-50 rounded-xl border border-red-200">
                        <p className="font-bold text-slate-900">{patientData?.name}</p>
                        <p className="text-sm text-slate-600">Dernière visite: {patient.daysSinceLastVisit} jours</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Créneaux vides */}
            {insights.emptySlots && insights.emptySlots.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={24} className="text-yellow-600" />
                  <h3 className="text-lg font-bold text-slate-900">Créneaux à Optimiser</h3>
                </div>

                <div className="space-y-3">
                  {insights.emptySlots.slice(0, 5).map((slot: any, idx: number) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="font-bold text-slate-900">{slot.dayOfWeek}</p>
                      <p className="text-sm text-slate-600">{slot.timeRange} - Fréquence: {slot.frequency}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPlanning;
