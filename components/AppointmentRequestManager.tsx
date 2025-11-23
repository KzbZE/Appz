import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { AppointmentRequest, AppointmentRequestStatus } from '../types';
import { Calendar, Check, X, Clock, MessageCircle, Send } from 'lucide-react';
import { AppointmentNotifications } from '../services/notificationService';
import { getAllAvailableSlots } from '../services/optimizationService';

const AppointmentRequestManager: React.FC = () => {
  const requests = useLiveQuery(() =>
    db.appointmentRequests
      .where('status')
      .notEqual(AppointmentRequestStatus.CONFIRMED)
      .and(r => r.status !== AppointmentRequestStatus.REJECTED)
      .reverse()
      .sortBy('createdAt')
  );

  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [proposedTime, setProposedTime] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showSuggestedSlots, setShowSuggestedSlots] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);

  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const handleAccept = async (request: AppointmentRequest) => {
    if (!request.id || !settings) return;

    try {
      // Créer le RDV confirmé
      const finalTime = request.proposedStartTime || request.requestedStartTime;

      // Récupérer le patient pour les coordonnées
      const patient = await db.patients.get(request.patientId);

      await db.appointments.add({
        patientId: request.patientId,
        startTime: finalTime,
        durationMin: request.durationMin,
        status: 'SCHEDULED' as any,
        type: request.type,
        notes: request.notes,
        price: 0, // À définir
        isOptimizedSlot: patient?.lat && patient?.lng ? await checkIfOptimized(finalTime, patient.lat, patient.lng) : false
      });

      // Mettre à jour la demande
      await db.appointmentRequests.update(request.id, {
        status: AppointmentRequestStatus.CONFIRMED,
        updatedAt: new Date().toISOString(),
        history: [
          ...request.history,
          {
            date: new Date().toISOString(),
            action: 'ACCEPTED' as any,
            by: 'PRACTITIONER' as any
          }
        ]
      });

      // Notifier le patient
      await AppointmentNotifications.notifyPatientRequestAccepted(
        request.patientEmail,
        request.patientPhone,
        request.patientName,
        finalTime,
        request.id
      );

      alert('✅ Rendez-vous confirmé et patient notifié !');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Erreur lors de l\'acceptation');
    }
  };

  const handlePropose = async (request: AppointmentRequest) => {
    if (!request.id || !proposedTime || !settings) return;

    try {
      await db.appointmentRequests.update(request.id, {
        status: AppointmentRequestStatus.PRACTITIONER_PROPOSED,
        proposedStartTime: proposedTime,
        proposedBy: 'PRACTITIONER',
        updatedAt: new Date().toISOString(),
        history: [
          ...request.history,
          {
            date: new Date().toISOString(),
            action: 'PROPOSED_ALT' as any,
            by: 'PRACTITIONER' as any,
            message: responseMessage,
            proposedTime
          }
        ]
      });

      // Notifier le patient
      await AppointmentNotifications.notifyPatientProposedTime(
        request.patientEmail,
        request.patientPhone,
        request.patientName,
        proposedTime,
        responseMessage,
        request.id
      );

      alert('📅 Nouveau créneau proposé et patient notifié !');
      setSelectedRequest(null);
      setProposedTime('');
      setResponseMessage('');
    } catch (error) {
      console.error('Error proposing time:', error);
      alert('Erreur lors de la proposition');
    }
  };

  const handleReject = async (request: AppointmentRequest) => {
    if (!request.id || !confirm('Refuser cette demande ?')) return;

    try {
      await db.appointmentRequests.update(request.id, {
        status: AppointmentRequestStatus.REJECTED,
        updatedAt: new Date().toISOString(),
        history: [
          ...request.history,
          {
            date: new Date().toISOString(),
            action: 'REJECTED' as any,
            by: 'PRACTITIONER' as any,
            message: responseMessage
          }
        ]
      });

      // Notifier le patient
      await AppointmentNotifications.notifyPatientRequestRejected(
        request.patientEmail,
        request.patientPhone,
        request.patientName,
        responseMessage,
        request.id
      );

      alert('❌ Demande refusée et patient notifié');
      setSelectedRequest(null);
      setResponseMessage('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Erreur lors du refus');
    }
  };

  const loadSuggestedSlots = async (request: AppointmentRequest) => {
    try {
      const patient = await db.patients.get(request.patientId);
      const slots = await getAllAvailableSlots(
        patient?.lat,
        patient?.lng,
        request.durationMin,
        new Date(request.requestedStartTime)
      );

      setSuggestedSlots([...slots.optimized, ...slots.standard]);
      setShowSuggestedSlots(true);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const checkIfOptimized = async (time: string, lat: number, lng: number): Promise<boolean> => {
    const { checkIfOptimized } = await import('../services/optimizationService');
    return checkIfOptimized({ startTime: time } as any, lat, lng);
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Aucune demande de rendez-vous en attente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-800 flex items-center">
        <Clock size={24} className="mr-2 text-orange-500" />
        Demandes de Rendez-vous ({requests.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-xl border-2 border-orange-200 p-4 hover:shadow-lg transition-all"
          >
            {/* En-tête */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-800">{request.patientName}</h4>
                <p className="text-xs text-slate-500">
                  {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                request.status === AppointmentRequestStatus.PENDING
                  ? 'bg-orange-100 text-orange-700'
                  : request.status === AppointmentRequestStatus.PRACTITIONER_PROPOSED
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {request.status === AppointmentRequestStatus.PENDING && 'Nouvelle'}
                {request.status === AppointmentRequestStatus.PRACTITIONER_PROPOSED && 'En attente patient'}
                {request.status === AppointmentRequestStatus.PATIENT_PROPOSED && 'Nouvelle proposition'}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Calendar size={16} className="mr-2 text-slate-400" />
                <span className="font-medium">
                  {new Date(request.proposedStartTime || request.requestedStartTime).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Type: {request.type} • Durée: {request.durationMin} min
              </div>
              {request.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  "{request.notes}"
                </div>
              )}
            </div>

            {/* Historique si échanges */}
            {request.history.length > 1 && (
              <div className="mb-4 bg-blue-50 p-2 rounded text-xs">
                <p className="font-bold text-blue-900 mb-1">Historique:</p>
                {request.history.slice(-2).map((h, i) => (
                  <p key={i} className="text-blue-700">
                    • {h.by === 'PATIENT' ? 'Patient' : 'Vous'}: {h.action} {h.proposedTime && `(${new Date(h.proposedTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })})`}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request)}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center"
                title="Accepter"
              >
                <Check size={16} className="mr-1" /> Accepter
              </button>
              <button
                onClick={() => setSelectedRequest(request)}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-all flex items-center justify-center"
                title="Proposer autre créneau"
              >
                <Calendar size={16} className="mr-1" /> Proposer
              </button>
              <button
                onClick={() => handleReject(request)}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                title="Refuser"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de proposition */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Proposer un autre créneau à {selectedRequest.patientName}</h3>

            <div className="space-y-4">
              {/* Créneau demandé */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-bold text-gray-700">Créneau demandé:</p>
                <p className="text-lg">
                  {new Date(selectedRequest.proposedStartTime || selectedRequest.requestedStartTime).toLocaleString('fr-FR')}
                </p>
              </div>

              {/* Bouton créneaux suggérés */}
              <button
                onClick={() => loadSuggestedSlots(selectedRequest)}
                className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200"
              >
                💡 Voir les créneaux optimisés
              </button>

              {/* Créneaux suggérés */}
              {showSuggestedSlots && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {suggestedSlots.slice(0, 5).map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setProposedTime(slot.startTime);
                        setShowSuggestedSlots(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left border-2 ${
                        slot.isOptimized
                          ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">
                            {new Date(slot.startTime).toLocaleString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-600">{slot.reason}</p>
                        </div>
                        {slot.isOptimized && (
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs font-bold">
                            💡 Score: {slot.score}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sélection manuelle */}
              <div>
                <label className="block text-sm font-bold mb-1">Ou sélectionnez un créneau:</label>
                <input
                  type="datetime-local"
                  value={proposedTime ? new Date(proposedTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setProposedTime(new Date(e.target.value).toISOString())}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold mb-1">Message (optionnel):</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Ex: Désolé, ce créneau ne me convient pas..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setProposedTime('');
                    setResponseMessage('');
                    setShowSuggestedSlots(false);
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handlePropose(selectedRequest)}
                  disabled={!proposedTime}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send size={18} className="mr-2" />
                  Envoyer la proposition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestManager;
