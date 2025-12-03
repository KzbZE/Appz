import React, { useState, useMemo } from 'react';
import { Patient, Session } from '../types';
import { Send, Mail, AlertCircle, TrendingDown, Users, X, Check, Clock, Target } from 'lucide-react';
import { usePatients, useSessions, useSettings } from '../hooks/useSupabaseData';

interface InactivePatient {
  patient: Patient;
  lastSession: Session | null;
  daysSinceLastVisit: number;
  totalSessions: number;
  totalRevenue: number;
  riskLevel: 'high' | 'medium' | 'low';
}

const MarketingAutomation: React.FC = () => {
  const { data: patients } = usePatients();
  const { data: sessions } = useSessions();
  const { settings } = useSettings();
  const currentSettings = settings;

  const [selectedPatients, setSelectedPatients] = useState<Set<number | string>>(new Set());
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailForm, setMailForm] = useState({ subject: '', message: '' });
  const [thresholds, setThresholds] = useState({
    highRisk: 180, // 6 months
    mediumRisk: 90,  // 3 months
    lowRisk: 30      // 1 month
  });

  // Analyze inactive patients
  const inactivePatients = useMemo(() => {
    const now = new Date();

    return patients.map(patient => {
      const patientSessions = sessions.filter(s => s.patientId === patient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastSession = patientSessions[0] || null;
      const daysSinceLastVisit = lastSession
        ? Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
        : 9999;

      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      if (daysSinceLastVisit >= thresholds.highRisk) riskLevel = 'high';
      else if (daysSinceLastVisit >= thresholds.mediumRisk) riskLevel = 'medium';

      return {
        patient,
        lastSession,
        daysSinceLastVisit,
        totalSessions: patientSessions.length,
        totalRevenue: 0, // Could be calculated from invoices
        riskLevel
      };
    }).filter(ip => ip.daysSinceLastVisit >= thresholds.lowRisk)
      .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }, [patients, sessions, thresholds]);

  const stats = useMemo(() => {
    const total = inactivePatients.length;
    const high = inactivePatients.filter(ip => ip.riskLevel === 'high').length;
    const medium = inactivePatients.filter(ip => ip.riskLevel === 'medium').length;
    const low = inactivePatients.filter(ip => ip.riskLevel === 'low').length;
    const selected = selectedPatients.size;

    return { total, high, medium, low, selected };
  }, [inactivePatients, selectedPatients]);

  const togglePatientSelection = (patientId: number | string) => {
    const newSet = new Set(selectedPatients);
    if (newSet.has(patientId)) {
      newSet.delete(patientId);
    } else {
      newSet.add(patientId);
    }
    setSelectedPatients(newSet);
  };

  const selectAll = (riskLevel?: 'high' | 'medium' | 'low') => {
    if (riskLevel) {
      const toSelect = inactivePatients
        .filter(ip => ip.riskLevel === riskLevel)
        .map(ip => ip.patient.id!);
      setSelectedPatients(new Set(toSelect));
    } else {
      const allIds = inactivePatients.map(ip => ip.patient.id!);
      setSelectedPatients(new Set(allIds));
    }
  };

  const deselectAll = () => {
    setSelectedPatients(new Set());
  };

  const handleSendCampaign = () => {
    if (selectedPatients.size === 0) {
      alert('Veuillez sélectionner au moins un patient');
      return;
    }

    setMailForm({
      subject: `${currentSettings?.practitionerName || 'Votre thérapeute'} - Nous pensons à vous !`,
      message: `Bonjour [NOM_PATIENT],\n\nCela fait quelques temps que nous ne vous avons pas vu(e) !\n\nNous espérons que tout va bien pour vous. N'hésitez pas à reprendre rendez-vous si vous ressentez le besoin d'une séance.\n\nNous serions ravis de vous accueillir à nouveau.\n\nCordialement,\n${currentSettings?.practitionerName || 'Votre Thérapeute'}`
    });
    setShowMailModal(true);
  };

  const confirmSendCampaign = async () => {
    const selectedList = inactivePatients.filter(ip =>
      selectedPatients.has(ip.patient.id!)
    );

    // Simulate email sending (in reality, would use backend SMTP)
    for (const ip of selectedList) {
      const personalizedMessage = mailForm.message.replace('[NOM_PATIENT]', ip.patient.name);
      const mailto = `mailto:email@example.com?subject=${encodeURIComponent(mailForm.subject)}&body=${encodeURIComponent(personalizedMessage)}`;

      console.log(`Sending to ${ip.patient.name}:`, mailto);
    }

    alert(`Campagne envoyée à ${selectedPatients.size} patient(s) !\n\nNote : Dans une app de production, cela utiliserait un service d'emailing (SendGrid, Mailchimp, etc.)`);
    setShowMailModal(false);
    deselectAll();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'from-red-500 to-pink-600';
      case 'medium': return 'from-orange-500 to-yellow-500';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'high': return '🔴 Risque Élevé';
      case 'medium': return '🟠 Risque Moyen';
      default: return '🟡 Inactif Récent';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
            <Send size={32} className="mr-3 text-purple-600" />
            Marketing Automation
          </h2>
          <p className="text-slate-500 text-sm mt-1">Relance automatique des patients inactifs</p>
        </div>

        {stats.selected > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-50"
            >
              Désélectionner
            </button>
            <button
              onClick={handleSendCampaign}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all flex items-center animate-pulse"
            >
              <Send size={18} className="mr-2" /> Envoyer Campagne ({stats.selected})
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <span className="text-sm font-medium opacity-90">Total Inactifs</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.total}</h3>
          <p className="text-sm opacity-90 mt-1">patients</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={24} />
            <span className="text-sm font-medium opacity-90">Risque Élevé</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.high}</h3>
          <p className="text-sm opacity-90 mt-1">+180 jours</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={24} />
            <span className="text-sm font-medium opacity-90">Risque Moyen</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.medium}</h3>
          <p className="text-sm opacity-90 mt-1">90-180 jours</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock size={24} />
            <span className="text-sm font-medium opacity-90">Inactif Récent</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.low}</h3>
          <p className="text-sm opacity-90 mt-1">30-90 jours</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center">
          <Target size={24} className="text-purple-600 mr-3" />
          <div>
            <h4 className="font-bold text-purple-900">Actions Rapides</h4>
            <p className="text-sm text-purple-700">
              Sélectionnez rapidement un groupe de patients
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => selectAll('high')}
            className="px-3 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700"
          >
            🔴 Risque Élevé
          </button>
          <button
            onClick={() => selectAll('medium')}
            className="px-3 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700"
          >
            🟠 Risque Moyen
          </button>
          <button
            onClick={() => selectAll()}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700"
          >
            Tous
          </button>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-slate-800">Patients Inactifs</h3>
        </div>

        {inactivePatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Check size={48} className="mx-auto mb-4 text-green-500" />
            <p className="font-bold text-lg">Aucun patient inactif ! 🎉</p>
            <p className="text-sm">Tous vos patients sont actifs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-slate-600 font-bold">
                <tr>
                  <th className="p-4 text-left w-16">
                    <input
                      type="checkbox"
                      checked={selectedPatients.size === inactivePatients.length}
                      onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-left">Patient</th>
                  <th className="p-4 text-center">Dernière Visite</th>
                  <th className="p-4 text-center">Jours d'Inactivité</th>
                  <th className="p-4 text-center">Nb Séances</th>
                  <th className="p-4 text-center">Risque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inactivePatients.map((ip) => (
                  <tr
                    key={ip.patient.id}
                    className={`hover:bg-purple-50/30 transition-colors ${selectedPatients.has(ip.patient.id!) ? 'bg-purple-50' : ''
                      }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(ip.patient.id!)}
                        onChange={() => togglePatientSelection(ip.patient.id!)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{ip.patient.name}</div>
                      <div className="text-xs text-slate-500">{ip.patient.type}</div>
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {ip.lastSession ? new Date(ip.lastSession.date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRiskColor(ip.riskLevel)} text-white`}>
                        {ip.daysSinceLastVisit}j
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-slate-600">
                        {ip.totalSessions}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${ip.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          ip.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {getRiskLabel(ip.riskLevel)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mail Modal */}
      {showMailModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <Mail size={20} className="mr-2 text-purple-600" /> Campagne Email
              </h3>
              <button onClick={() => setShowMailModal(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
                <strong>{selectedPatients.size}</strong> patient(s) sélectionné(s)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objet</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={mailForm.subject}
                  onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Message
                  <span className="text-xs text-slate-400 ml-2">(Utilisez [NOM_PATIENT] pour personnaliser)</span>
                </label>
                <textarea
                  rows={8}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={mailForm.message}
                  onChange={(e) => setMailForm({ ...mailForm, message: e.target.value })}
                />
              </div>

              <button
                onClick={confirmSendCampaign}
                disabled={!mailForm.subject || !mailForm.message}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold disabled:opacity-50 hover:shadow-lg transition-all"
              >
                📤 Envoyer la Campagne
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingAutomation;
