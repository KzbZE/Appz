import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Send } from 'lucide-react';
import { db } from '../db';
import { AppointmentRequestStatus } from '../types';

interface PatientNewRequestModalProps {
  patientId: number;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  onClose: () => void;
}

const PatientNewRequestModal: React.FC<PatientNewRequestModalProps> = ({
  patientId,
  patientEmail,
  patientName,
  patientPhone,
  patientAddress,
  onClose
}) => {
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [type, setType] = useState<'CABINET' | 'HOME'>('CABINET');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedDate || !requestedTime) {
      alert('Veuillez renseigner une date et une heure');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combiner date et heure
      const startTime = new Date(`${requestedDate}T${requestedTime}`);

      await db.appointmentRequests.add({
        patientId,
        patientName,
        patientEmail,
        patientPhone,
        patientAddress: type === 'HOME' ? patientAddress || '' : '',
        requestedStartTime: startTime.toISOString(),
        durationMin,
        type,
        notes,
        status: AppointmentRequestStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        validated: false,
        proposedBy: 'PATIENT',
        history: [
          {
            date: new Date().toISOString(),
            action: 'CREATED',
            by: 'PATIENT',
            message: 'Demande créée par le patient'
          }
        ]
      });

      alert('✅ Demande de rendez-vous envoyée ! Le praticien vous répondra rapidement.');
      onClose();
    } catch (error) {
      console.error('Erreur création demande:', error);
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
          <h2 className="text-2xl font-bold text-slate-800">Nouvelle demande de rendez-vous</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de RDV */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Type de rendez-vous</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('CABINET')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'CABINET'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <MapPin size={24} className={`mx-auto mb-2 ${type === 'CABINET' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <p className="font-bold text-sm">Au cabinet</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('HOME')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'HOME'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <MapPin size={24} className={`mx-auto mb-2 ${type === 'HOME' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <p className="font-bold text-sm">À domicile</p>
                </div>
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Date souhaitée
            </label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Heure */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Clock size={16} className="inline mr-1" />
              Heure souhaitée
            </label>
            <input
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Durée estimée</label>
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 heure</option>
              <option value={90}>1h30</option>
              <option value={120}>2 heures</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisez le motif de la consultation, vos disponibilités, etc."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              💡 Votre demande sera envoyée au praticien qui vous confirmera le rendez-vous ou vous proposera un créneau alternatif.
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

export default PatientNewRequestModal;
