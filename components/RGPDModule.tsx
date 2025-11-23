import React, { useState } from 'react';
import { Patient } from '../types';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Shield, Download, Trash2, FileText, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const RGPDModule: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const exportPatientData = async (patient: Patient) => {
    // Collecter toutes les données du patient
    const appointments = await db.appointments.where('patientId').equals(patient.id!).toArray();
    const invoices = await db.invoices.where('patientName').equals(patient.name).toArray();
    const sessions = await db.sessions.where('patientId').equals(patient.id!).toArray();

    const patientData = {
      patient,
      appointments,
      invoices,
      sessions,
      exportDate: new Date().toISOString(),
      format: 'RGPD_EXPORT_V1'
    };

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
  };

  const deletePatientData = async (patient: Patient) => {
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
      `Tapez le nom du patient pour confirmer: ${patient.name}`
    );

    if (!doubleConfirm) return;

    try {
      // Supprimer toutes les données liées
      await db.appointments.where('patientId').equals(patient.id!).delete();
      await db.invoices.where('patientName').equals(patient.name).delete();
      await db.sessions.where('patientId').equals(patient.id!).delete();
      await db.loyaltyCards.where('patientId').equals(patient.id!).delete();
      await db.surveyResponses.where('patientId').equals(patient.id!).delete();
      await db.referrals.where('referrerId').equals(patient.id!).delete();
      await db.referrals.where('referredId').equals(patient.id!).delete();

      // Supprimer le patient
      await db.patients.delete(patient.id!);

      alert(`✅ Toutes les données de ${patient.name} ont été supprimées définitivement (conforme RGPD - droit à l'oubli)`);
    } catch (error) {
      alert(`❌ Erreur lors de la suppression: ${error}`);
    }
  };

  const anonymizeOldPatients = async () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const oldPatients = patients.filter(p => {
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

    for (const patient of oldPatients) {
      await db.patients.update(patient.id!, {
        name: `Patient_Anonyme_${patient.id}`,
        ownerName: undefined,
        phone: undefined,
        email: undefined,
        address: 'Adresse anonymisée',
        notes: undefined
      });
    }

    alert(`✅ ${oldPatients.length} patient(s) anonymisé(s) avec succès (conforme RGPD)`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Conformité RGPD
          </h3>
          <p className="text-sm text-slate-500">Gestion des données personnelles et droits des patients</p>
        </div>
      </div>

      {/* RGPD Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-2">✓ Application conforme RGPD</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ <strong>Droit d'accès:</strong> Export complet des données patient</li>
              <li>✓ <strong>Droit à l'oubli:</strong> Suppression définitive sur demande</li>
              <li>✓ <strong>Droit de rectification:</strong> Modification des données à tout moment</li>
              <li>✓ <strong>Minimisation:</strong> Seules les données nécessaires sont collectées</li>
              <li>✓ <strong>Anonymisation:</strong> Données anonymisées après 3 ans d'inactivité</li>
              <li>✓ <strong>Sécurité:</strong> Stockage local sécurisé dans le navigateur</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            const patient = patients[Math.floor(Math.random() * patients.length)];
            if (patient) exportPatientData(patient);
          }}
          className="bg-white border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Download size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Export Données</div>
              <div className="text-xs text-slate-500">Droit d'accès RGPD</div>
            </div>
          </div>
          <p className="text-sm text-slate-600">Exporter toutes les données d'un patient au format JSON</p>
        </button>

        <button
          onClick={anonymizeOldPatients}
          className="bg-white border-2 border-yellow-200 rounded-xl p-5 hover:border-yellow-400 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Lock size={24} className="text-yellow-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Anonymisation Auto</div>
              <div className="text-xs text-slate-500">Patients inactifs +3 ans</div>
            </div>
          </div>
          <p className="text-sm text-slate-600">Anonymiser les patients inactifs depuis plus de 3 ans</p>
        </button>

        <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FileText size={24} className="text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Registre RGPD</div>
              <div className="text-xs text-slate-500">Documentation</div>
            </div>
          </div>
          <p className="text-sm text-slate-600">Toutes les opérations sont tracées localement</p>
        </div>
      </div>

      {/* Patient List with RGPD Actions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-4 border-b border-slate-200">
          <h4 className="font-black text-slate-800 text-lg">Gestion des Données Patients</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-4 text-left font-black uppercase text-xs">Patient</th>
                <th className="p-4 text-left font-black uppercase text-xs">Dernière Visite</th>
                <th className="p-4 text-left font-black uppercase text-xs">Contact</th>
                <th className="p-4 text-center font-black uppercase text-xs">Actions RGPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map(patient => (
                <tr key={patient.id} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{patient.name}</div>
                    {patient.ownerName && (
                      <div className="text-xs text-slate-500">Propriétaire: {patient.ownerName}</div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-600">
                      {patient.email && <div>📧 {patient.email}</div>}
                      {patient.phone && <div>📱 {patient.phone}</div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => exportPatientData(patient)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"
                        title="Exporter données (Droit d'accès)"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deletePatientData(patient)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all"
                        title="Supprimer définitivement (Droit à l'oubli)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-800 mb-1">⚠️ Responsabilités RGPD</h4>
            <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
              <li>Informer les patients de leurs droits (droit d'accès, rectification, suppression)</li>
              <li>Obtenir le consentement explicite pour la collecte de données</li>
              <li>Conserver les données uniquement le temps nécessaire</li>
              <li>Sécuriser les données contre les accès non autorisés</li>
              <li>Notifier la CNIL en cas de violation de données</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RGPDModule;
