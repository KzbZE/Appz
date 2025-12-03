import React, { useState, useEffect } from 'react';
import { SurveyResponse, Patient, AppSettings } from '../types';
import { dataService } from '../services/dataService';
import { Star, ThumbsUp, ThumbsDown, TrendingUp, Users, AlertCircle, CheckCircle, MessageSquare, BarChart3, X, Send } from 'lucide-react';

const SatisfactionSurvey: React.FC = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<AppSettings[]>([]);
  const currentSettings = settings?.[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [surveyData, patientsData, settingsData] = await Promise.all([
          dataService.getSurveyResponses(),
          dataService.getPatients(),
          dataService.getSettings()
        ]);
        setSurveyResponses(surveyData);
        setPatients(patientsData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSendSurveyModal, setShowSendSurveyModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // NPS Calculation
  const calculateNPS = () => {
    const npsResponses = surveyResponses.filter(r => r.npsScore !== undefined);
    if (npsResponses.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0 };

    const promoters = npsResponses.filter(r => r.npsScore! >= 9).length;
    const passives = npsResponses.filter(r => r.npsScore! >= 7 && r.npsScore! <= 8).length;
    const detractors = npsResponses.filter(r => r.npsScore! <= 6).length;

    const npsScore = Math.round(((promoters - detractors) / npsResponses.length) * 100);

    return { score: npsScore, promoters, passives, detractors };
  };

  const npsData = calculateNPS();

  // Average Rating
  const averageRating = surveyResponses.length > 0
    ? surveyResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / surveyResponses.filter(r => r.rating).length
    : 0;

  // Negative Feedback (NPS <= 6 or Rating <= 2)
  const negativeFeedback = surveyResponses.filter(r =>
    (r.npsScore !== undefined && r.npsScore <= 6) ||
    (r.rating !== undefined && r.rating <= 2)
  );

  // Recent Responses
  const recentResponses = [...surveyResponses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleSendSurvey = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowSendSurveyModal(true);
  };

  const confirmSendSurvey = async () => {
    if (!selectedPatient) return;

    // In real implementation, this would send email/SMS with survey link
    alert(`Enquête envoyée à ${selectedPatient.name} via ${selectedPatient.email || selectedPatient.phone || 'email'}`);
    setShowSendSurveyModal(false);
    setSelectedPatient(null);
  };

  const handleViewDetails = (response: SurveyResponse) => {
    setSelectedResponse(response);
    setShowDetailModal(true);
  };

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-emerald-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNPSBgColor = (score: number) => {
    if (score >= 50) return 'from-emerald-500 to-green-600';
    if (score >= 0) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" />
            Enquêtes de Satisfaction & NPS
          </h3>
          <p className="text-sm text-slate-500">Suivez la satisfaction de vos patients en temps réel</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* NPS Score */}
        <div className={`bg-gradient-to-br ${getNPSBgColor(npsData.score)} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Net Promoter Score</div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <div className="text-5xl font-black mb-2">{npsData.score}</div>
          <div className="text-xs opacity-80">
            {npsData.score >= 50 ? '🎉 Excellent !' : npsData.score >= 0 ? '⚠️ À améliorer' : '❌ Critique'}
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Note Moyenne</div>
            <Star size={20} className="opacity-80" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-5xl font-black">{averageRating.toFixed(1)}</div>
            <Star size={24} fill="currentColor" />
          </div>
          <div className="text-xs opacity-80 mt-2">Sur 5 étoiles</div>
        </div>

        {/* Total Responses */}
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Réponses Totales</div>
            <Users size={20} className="opacity-80" />
          </div>
          <div className="text-5xl font-black mb-2">{surveyResponses.length}</div>
          <div className="text-xs opacity-80">Enquêtes complétées</div>
        </div>

        {/* Negative Feedback */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Retours Négatifs</div>
            <AlertCircle size={20} className="opacity-80" />
          </div>
          <div className="text-5xl font-black mb-2">{negativeFeedback.length}</div>
          <div className="text-xs opacity-80">À traiter en priorité</div>
        </div>
      </div>

      {/* NPS Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h4 className="font-black text-lg text-slate-800 mb-4">Répartition NPS</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-emerald-700 font-bold text-sm">Promoteurs (9-10)</div>
              <ThumbsUp size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{npsData.promoters}</div>
            <div className="text-xs text-emerald-600 mt-1">
              {surveyResponses.length > 0 ? Math.round((npsData.promoters / surveyResponses.length) * 100) : 0}% des réponses
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-yellow-700 font-bold text-sm">Passifs (7-8)</div>
              <MessageSquare size={18} className="text-yellow-600" />
            </div>
            <div className="text-3xl font-black text-yellow-600">{npsData.passives}</div>
            <div className="text-xs text-yellow-600 mt-1">
              {surveyResponses.length > 0 ? Math.round((npsData.passives / surveyResponses.length) * 100) : 0}% des réponses
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-red-700 font-bold text-sm">Détracteurs (0-6)</div>
              <ThumbsDown size={18} className="text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-600">{npsData.detractors}</div>
            <div className="text-xs text-red-600 mt-1">
              {surveyResponses.length > 0 ? Math.round((npsData.detractors / surveyResponses.length) * 100) : 0}% des réponses
            </div>
          </div>
        </div>
      </div>

      {/* Negative Feedback Alert */}
      {negativeFeedback.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-red-800 text-lg mb-2">⚠️ Retours Négatifs à Traiter</h4>
              <p className="text-sm text-red-700 mb-3">
                {negativeFeedback.length} patient(s) ont exprimé une insatisfaction. Contactez-les rapidement pour résoudre le problème.
              </p>
              <div className="space-y-2">
                {negativeFeedback.slice(0, 3).map((response) => (
                  <div key={response.id} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800">{response.patientName}</div>
                        <div className="text-xs text-slate-500">{new Date(response.date).toLocaleDateString('fr-FR')}</div>
                        {response.feedback && (
                          <div className="text-sm text-slate-600 mt-1 italic">"{response.feedback}"</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {response.npsScore !== undefined && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                            NPS: {response.npsScore}/10
                          </span>
                        )}
                        {response.rating !== undefined && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                            {response.rating}★
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Responses */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-6 py-4 border-b border-slate-200">
          <h4 className="font-black text-slate-800 text-lg">Réponses Récentes</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-4 text-left font-black uppercase text-xs">Patient</th>
                <th className="p-4 text-left font-black uppercase text-xs">Date</th>
                <th className="p-4 text-center font-black uppercase text-xs">NPS</th>
                <th className="p-4 text-center font-black uppercase text-xs">Note</th>
                <th className="p-4 text-left font-black uppercase text-xs">Recommande</th>
                <th className="p-4 text-left font-black uppercase text-xs">Commentaire</th>
                <th className="p-4 text-center font-black uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    Aucune réponse d'enquête pour le moment.
                  </td>
                </tr>
              ) : (
                recentResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{response.patientName}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(response.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-center">
                      {response.npsScore !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          response.npsScore >= 9 ? 'bg-emerald-100 text-emerald-700' :
                          response.npsScore >= 7 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {response.npsScore}/10
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {response.rating !== undefined && (
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < response.rating! ? 'text-yellow-500' : 'text-slate-300'}
                              fill={i < response.rating! ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {response.wouldRecommend ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                          <CheckCircle size={16} /> Oui
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                          <X size={16} /> Non
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 max-w-xs truncate">
                        {response.feedback || <span className="italic text-slate-400">Aucun commentaire</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleViewDetails(response)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Survey Button */}
      <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl p-6 border border-teal-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-slate-800 text-lg mb-1">Envoyer une Enquête</h4>
            <p className="text-sm text-slate-600">Sélectionnez un patient pour lui envoyer une enquête de satisfaction</p>
          </div>
          <button
            onClick={() => setShowSendSurveyModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Send size={18} />
            Envoyer Enquête
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResponse && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <div>
                <h3 className="font-black text-xl">Détails de l'Enquête</h3>
                <p className="text-sm opacity-90 mt-1">{selectedResponse.patientName}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Date</div>
                  <div className="font-bold text-slate-800">{new Date(selectedResponse.date).toLocaleDateString('fr-FR')}</div>
                </div>

                {selectedResponse.npsScore !== undefined && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-slate-500 text-xs font-semibold mb-1">Score NPS</div>
                    <div className="font-black text-2xl text-blue-600">{selectedResponse.npsScore}/10</div>
                  </div>
                )}

                {selectedResponse.rating !== undefined && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-slate-500 text-xs font-semibold mb-1">Évaluation</div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < selectedResponse.rating! ? 'text-yellow-500' : 'text-slate-300'}
                          fill={i < selectedResponse.rating! ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Recommande</div>
                  <div className="font-bold text-slate-800">{selectedResponse.wouldRecommend ? '✓ Oui' : '✗ Non'}</div>
                </div>
              </div>

              {selectedResponse.feedback && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-blue-700 text-xs font-semibold mb-2">Commentaire</div>
                  <div className="text-slate-800">{selectedResponse.feedback}</div>
                </div>
              )}

              {selectedResponse.answers && Object.keys(selectedResponse.answers).length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 text-sm">Autres Réponses</div>
                  {Object.entries(selectedResponse.answers).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 font-semibold mb-1">{key}</div>
                      <div className="text-slate-800">{String(value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Survey Modal */}
      {showSendSurveyModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-xl">Envoyer une Enquête</h3>
              <button onClick={() => setShowSendSurveyModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionner un Patient</label>
                <select
                  onChange={(e) => {
                    const patient = patients.find(p => String(p.id) === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un patient --</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} {patient.ownerName ? `(${patient.ownerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmSendSurvey}
                  disabled={!selectedPatient}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedPatient
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white hover:scale-105'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  Envoyer
                </button>
                <button
                  onClick={() => setShowSendSurveyModal(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionSurvey;
