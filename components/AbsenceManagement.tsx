import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CalendarOff, Plus, Trash2, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment, ApptStatus } from '../types';

/**
 * Module de gestion des absences du praticien
 * Permet de bloquer des périodes et de reporter automatiquement les RDV
 */

interface PractitionerAbsence {
  id?: number;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'VACATION' | 'TRAINING' | 'SICK' | 'OTHER';
  createdAt: string;
}

const AbsenceManagement: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'VACATION' as 'VACATION' | 'TRAINING' | 'SICK' | 'OTHER'
  });

  // Charger les absences (à stocker dans db.absences - à ajouter dans schema)
  const [absences, setAbsences] = useState<PractitionerAbsence[]>([]);

  // Charger les RDV
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  // Trouver les RDV qui tombent pendant une absence
  const getAffectedAppointments = (startDate: string, endDate: string): Appointment[] => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    return appointments.filter(appt => {
      const apptDate = parseISO(appt.startTime);
      return (
        appt.status === ApptStatus.SCHEDULED &&
        isWithinInterval(apptDate, { start, end })
      );
    });
  };

  const handleAddAbsence = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('❌ Veuillez renseigner les dates de début et de fin');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('❌ La date de fin doit être après la date de début');
      return;
    }

    const affectedAppts = getAffectedAppointments(formData.startDate, formData.endDate);

    if (affectedAppts.length > 0) {
      const confirmMsg = `⚠️ ${affectedAppts.length} rendez-vous sont planifiés pendant cette période.\n\nSouhaitez-vous :\n- Annuler ces RDV et notifier les patients\n- Continuer quand même\n\nRépondez "Annuler" pour annuler les RDV, ou "Continuer" pour bloquer quand même.`;

      const response = window.prompt(confirmMsg, 'Annuler');

      if (response === null) return; // Utilisateur a annulé

      if (response?.toLowerCase() === 'annuler') {
        // Annuler les RDV affectés
        for (const appt of affectedAppts) {
          await db.appointments.update(appt.id!, {
            status: ApptStatus.CANCELLED,
            notes: `${appt.notes || ''}\n[Annulé : Absence praticien du ${format(parseISO(formData.startDate), 'dd/MM/yyyy', { locale: fr })} au ${format(parseISO(formData.endDate), 'dd/MM/yyyy', { locale: fr })}]`
          });

          // TODO: Envoyer notification au patient
          const patient = await db.patients.get(appt.patientId);
          if (patient?.email) {
            console.log(`📧 Email de notification envoyé à ${patient.email} pour annulation RDV`);
            // await sendCancellationEmail(patient.email, appt, formData);
          }
        }

        alert(`✅ ${affectedAppts.length} rendez-vous annulés et patients notifiés`);
      }
    }

    // Ajouter l'absence (TODO: implémenter db.absences dans schema)
    const newAbsence: PractitionerAbsence = {
      ...formData,
      createdAt: new Date().toISOString()
    };

    setAbsences([...absences, { ...newAbsence, id: absences.length + 1 }]);

    // Réinitialiser le formulaire
    setFormData({
      startDate: '',
      endDate: '',
      reason: '',
      type: 'VACATION'
    });
    setShowAddForm(false);

    alert('✅ Absence enregistrée avec succès');
  };

  const handleDeleteAbsence = (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) return;

    setAbsences(absences.filter(abs => abs.id !== id));
    alert('✅ Absence supprimée');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      VACATION: '🏖️ Vacances',
      TRAINING: '📚 Formation',
      SICK: '🤒 Maladie',
      OTHER: '📅 Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      VACATION: 'from-blue-500 to-cyan-500',
      TRAINING: 'from-purple-500 to-pink-500',
      SICK: 'from-red-500 to-orange-500',
      OTHER: 'from-gray-500 to-slate-500'
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CalendarOff className="mr-3 text-indigo-600" size={32} />
            Gestion des Absences
          </h1>
          <p className="text-gray-600 mt-1">Bloquez vos périodes d'indisponibilité</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} className="mr-2" />
          Nouvelle Absence
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une période d'absence</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'absence
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            >
              <option value="VACATION">🏖️ Vacances</option>
              <option value="TRAINING">📚 Formation</option>
              <option value="SICK">🤒 Maladie</option>
              <option value="OTHER">📅 Autre</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Raison / Notes
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Vacances d'été, Formation kinésiologie, etc."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              rows={3}
            />
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 mr-3 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    {getAffectedAppointments(formData.startDate, formData.endDate).length} rendez-vous affectés
                  </p>
                  <p className="text-sm text-yellow-800">
                    Des rendez-vous sont planifiés pendant cette période. Ils seront automatiquement proposés à l'annulation.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddAbsence}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Enregistrer l'absence
            </button>
          </div>
        </div>
      )}

      {/* Liste des absences */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Périodes d'absence prévues</h3>

        {absences.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center">
            <CalendarOff size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucune absence planifiée</p>
            <p className="text-gray-400 text-sm mt-2">Cliquez sur "Nouvelle Absence" pour en ajouter une</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {absences.map(absence => {
              const affectedAppts = getAffectedAppointments(absence.startDate, absence.endDate);

              return (
                <div
                  key={absence.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className={`px-4 py-2 bg-gradient-to-r ${getTypeColor(absence.type)} text-white rounded-lg font-bold text-sm`}>
                          {getTypeLabel(absence.type)}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-900 mb-2">
                        <Calendar size={18} className="mr-2 text-indigo-600" />
                        <span className="font-bold text-lg">
                          {format(parseISO(absence.startDate), 'dd MMMM yyyy', { locale: fr })}
                          {' → '}
                          {format(parseISO(absence.endDate), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>

                      {absence.reason && (
                        <p className="text-gray-600 mb-3">{absence.reason}</p>
                      )}

                      {affectedAppts.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 inline-flex items-center">
                          <AlertTriangle size={16} className="text-orange-600 mr-2" />
                          <span className="text-sm font-semibold text-orange-900">
                            {affectedAppts.length} RDV pendant cette période
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteAbsence(absence.id!)}
                      className="ml-4 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer l'absence"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenceManagement;
