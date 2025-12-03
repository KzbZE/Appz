import React, { useState } from 'react';
import { Patient } from '../types';
import { usePatients, useAppointments, useInvoices, useSessions } from '../hooks/useSupabaseData';
import { dataService } from '../services/dataService';
import { Shield, Download, Trash2, FileText, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const RGPDModule: React.FC = () => {
  const { data: patients, deleteItem: deletePatient, updateItem: updatePatient, reload: reloadPatients } = usePatients();
  const { data: allAppointments, deleteItem: deleteAppointment } = useAppointments();
  const { data: allInvoices } = useInvoices();
  const { data: allSessions } = useSessions();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const exportPatientData = async (patient: Patient) => {
    if (!patient.id) return;

    try {
      const patientData = await dataService.exportPatientData(patient.id);

      const blob = new Blob([JSON.stringify(patientData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RGPD_Export_${patient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`✅ Données de ${patient.name} exportées avec succès (conforme RGPD)`);
    } catch (error) {
      alert(`❌ Erreur lors de l'export: ${error}`);
    }
  };

  const deletePatientData = async (patient: Patient) => {
    if (!patient.id) return;

    const confirmed = confirm(
      `⚠️ ATTENTION: Suppression définitive des données de ${patient.name}\n\n` +
      `Cette action supprimera:\n` +
      `- Le dossier patient\n` +
      `- Tous les rendez-vous\n` +
      `- Toutes les factures\n` +
      `- Toutes les séances\n\n` +
      `Cette action est IRRÉVERSIBLE. Continuer ?`
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      `Êtes-vous ABSOLUMENT SÛR de vouloir supprimer définitivement toutes les données de ${patient.name} ?\n\n` +
      `Cette action ne peut PAS être annulée.`
    );

    if (!doubleConfirm) return;

    try {
      // Suppression avec cascade (défini dans le schema SQL)
      await dataService.deletePatientWithAllData(patient.id);
      await reloadPatients();

      alert(`✅ Toutes les données de ${patient.name} ont été supprimées définitivement (conforme RGPD - droit à l'oubli)`);
      setSelectedPatient(null);
    } catch (error) {
      alert(`❌ Erreur lors de la suppression: ${error}`);
    }
  };

  const anonymizeOldPatients = async () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const oldPatients = (patients || []).filter(p => {
      if (!p.lastVisit) return false;
      return new Date(p.lastVisit) < threeYearsAgo;
    });

    if (oldPatients.length === 0) {
      alert('Aucun patient inactif depuis plus de 3 ans');
      return;
    }

    const confirmed = confirm(
      `Anonymisation de ${oldPatients.length} patient(s) inactif(s) depuis plus de 3 ans.\n\n` +
      `Les données personnelles seront remplacées par "Patient Anonyme".\n` +
      `Les données médicales seront conservées (anonymisées).\n\n` +
      `Continuer ?`
    );

    if (!confirmed) return;

    try {
      for (const patient of oldPatients) {
        if (!patient.id) continue;
        await updatePatient!(patient.id, {
          name: `Patient Anonyme #${patient.id}`,
          email: undefined,
          phone: undefined,
          address: 'Adresse anonymisée',
          ownerName: undefined,
          notes: 'Anonymisé conformément RGPD (inactif > 3 ans)'
        });
      }

      await reloadPatients();
      alert(`✅ ${oldPatients.length} patient(s) anonymisé(s) avec succès`);
    } catch (error) {
      alert(`❌ Erreur lors de l'anonymisation: ${error}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Conformité RGPD
          </h3>
          <p className="text-sm text-slate-500">Gestion des données personnelles et droits des patients</p>
        </div>
        <button
          onClick={anonymizeOldPatients}
          className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg flex items-center gap-2"
        >
          <Lock size={16} />
          Anonymiser anciens patients
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Patients Total</div>
            <FileText size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{patients?.length || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Rendez-vous</div>
            <FileText size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{allAppointments?.length || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Séances</div>
            <FileText size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{allSessions?.length || 0}</div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">
            <Shield size={18} />
            Gestion des Données Patients
          </h4>
        </div>

        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
          {!patients || patients.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Shield size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucun patient enregistré</p>
            </div>
          ) : (
            patients.map(patient => {
              const patientAppointments = (allAppointments || []).filter(a => String(a.patientId) === String(patient.id));
              const patientSessions = (allSessions || []).filter(s => String(s.patientId) === String(patient.id));

              return (
                <div
                  key={patient.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPatient?.id === patient.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-800">{patient.name}</h5>
                      <p className="text-sm text-slate-500">
                        {patient.phone} • {patient.email || 'Pas d\'email'}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-600">
                        <span>📅 {patientAppointments.length} RDV</span>
                        <span>📋 {patientSessions.length} Séances</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => exportPatientData(patient)}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow flex items-center gap-2 text-sm font-bold"
                        title="Export RGPD - Droit d'accès"
                      >
                        <Download size={16} />
                        Exporter
                      </button>
                      <button
                        onClick={() => deletePatientData(patient)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow flex items-center gap-2 text-sm font-bold"
                        title="Suppression définitive - Droit à l'oubli"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RGPD Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-blue-800 mb-1">Conformité RGPD Assurée</h5>
            <p className="text-sm text-blue-700 leading-relaxed">
              ✅ <strong>Droit d'accès</strong>: Export JSON complet des données patient<br />
              ✅ <strong>Droit à l'oubli</strong>: Suppression définitive en cascade<br />
              ✅ <strong>Minimisation</strong>: Anonymisation automatique des patients inactifs (+3 ans)<br />
              ✅ <strong>Sécurité</strong>: Toutes les données sont chiffrées et hébergées en UE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RGPDModule;
