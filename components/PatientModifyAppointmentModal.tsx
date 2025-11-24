import React, { useState } from 'react';
import { X, Calendar, Clock, Send, AlertCircle } from 'lucide-react';
import { db } from '../db';
import { Appointment } from '../types';
import { AppointmentRequestStatus } from '../types';

interface PatientModifyAppointmentModalProps {
  appointment: Appointment;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  onClose: () => void;
}

const PatientModifyAppointmentModal: React.FC<PatientModifyAppointmentModalProps> = ({
  appointment,
  patientEmail,
  patientName,
  patientPhone,
  onClose
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDate = new Date(appointment.startTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDate || !newTime) {
      alert('Veuillez renseigner une nouvelle date et heure');
      return;
    }

    if (!reason.trim()) {
      alert('Veuillez préciser la raison de votre demande de modification');
      return;
    }

    setIsSubmitting(true);

    try {
      // Créer une nouvelle demande de modification
      const newStartTime = new Date(`${newDate}T${newTime}`);

      await db.appointmentRequests.add({
        patientId: appointment.patientId,
        patientName,
        patientEmail,
        patientPhone,
        requestedStartTime: newStartTime.toISOString(),
        durationMin: appointment.durationMin,
        type: appointment.type,
        notes: `Modification du RDV du ${currentDate.toLocaleDateString('fr-FR')} à ${currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Raison: ${reason}`,
        status: AppointmentRequestStatus.PATIENT_PROPOSED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        validated: false,
        proposedBy: 'PATIENT',
        relatedAppointmentId: appointment.id,
        history: [
          {
            date: new Date().toISOString(),
            action: 'PROPOSED_ALT',
            by: 'PATIENT',
            message: `Demande de modification: ${reason}`,
            proposedTime: newStartTime.toISOString()
          }
        ]
      });

      alert('✅ Demande de modification envoyée ! Le praticien vous répondra rapidement.');
      onClose();
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('❌ Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Modifier le rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Info RDV actuel */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-bold text-amber-900 mb-2">Rendez-vous actuel:</p>
          <div className="flex items-center space-x-4 text-amber-800">
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{currentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              <span>{currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nouvelle date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Nouvelle date souhaitée
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Nouvelle heure */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Clock size={16} className="inline mr-1" />
              Nouvelle heure souhaitée
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Raison */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <AlertCircle size={16} className="inline mr-1" />
              Raison de la modification
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Imprévu professionnel, autre engagement..."
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              💡 Votre demande de modification sera envoyée au praticien qui pourra l'accepter ou vous proposer un autre créneau.
              Le rendez-vous actuel restera valide jusqu'à validation de la modification.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                'Envoi en cours...'
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Envoyer la demande
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModifyAppointmentModal;
