import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { useAppointmentRequests } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PractitionerRequestsManager: React.FC = () => {
  const { data: requests, isLoading, refresh } = useAppointmentRequests();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<Record<number, string>>({});

  const handleApprove = async (request: any) => {
    try {
      setProcessingId(request.id);

      // 1. Create the appointment
      const { data: newAppointment, error: apptError } = await supabase
        .from('appointments')
        .insert([{
          user_id: request.practitioner_id,
          patient_id: request.patient_id,
          start_time: request.requested_date,
          duration_min: request.duration_min || 60,
          status: 'SCHEDULED',
          type: request.type,
          notes: request.reason,
          request_id: request.id,
          practitioner_id: request.practitioner_id,
        }])
        .select()
        .single();

      if (apptError) throw apptError;

      // 2. Update the request status
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
          status: 'APPROVED',
          practitioner_response: responseText[request.id] || 'Rendez-vous confirmé',
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      alert('✅ Demande approuvée et rendez-vous créé !');
      setResponseText(prev => ({ ...prev, [request.id]: '' }));
      await refresh();
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: any) => {
    try {
      setProcessingId(request.id);

      const response = responseText[request.id] || 'Demande refusée';

      const { error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'REJECTED',
          practitioner_response: response,
        })
        .eq('id', request.id);

      if (error) throw error;

      alert('Demande refusée');
      setResponseText(prev => ({ ...prev, [request.id]: '' }));
      await refresh();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING');

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="text-orange-600" size={32} />
        <div>
          <h2 className="text-2xl font-black text-slate-800">Demandes de Rendez-vous</h2>
          <p className="text-sm text-slate-600">{pendingRequests.length} en attente</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Clock size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="font-bold">Aucune demande en attente</p>
          <p className="text-sm">Les nouvelles demandes apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <div key={request.id} className="p-5 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm">
              {/* Request Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <User className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg mb-1">
                      Nouvelle demande
                    </p>
                    <p className="text-sm text-slate-600">
                      Demandé le {format(new Date(request.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock size={14} />
                  EN ATTENTE
                </span>
              </div>

              {/* Request Details */}
              <div className="bg-white rounded-xl p-4 mb-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="font-bold">
                    {format(new Date(request.requested_date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 font-bold">Type</p>
                    <p className="text-slate-800">{request.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold">Durée</p>
                    <p className="text-slate-800">{request.duration_min || 60} minutes</p>
                  </div>
                </div>

                {request.reason && (
                  <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">Motif de consultation</p>
                    <p className="text-slate-800 text-sm bg-slate-50 p-3 rounded-lg">{request.reason}</p>
                  </div>
                )}

                {request.notes && (
                  <div>
                    <p className="text-slate-500 font-bold text-sm mb-1">Notes du patient</p>
                    <p className="text-slate-700 text-sm">{request.notes}</p>
                  </div>
                )}
              </div>

              {/* Response TextArea */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Message de réponse (optionnel)
                </label>
                <textarea
                  value={responseText[request.id] || ''}
                  onChange={(e) => setResponseText(prev => ({ ...prev, [request.id]: e.target.value }))}
                  placeholder="Ajouter un message pour le patient..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  {processingId === request.id ? 'Traitement...' : 'Approuver'}
                </button>
                <button
                  onClick={() => handleReject(request)}
                  disabled={processingId === request.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={20} />
                  {processingId === request.id ? 'Traitement...' : 'Refuser'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Section */}
      {requests.filter((r: any) => r.status !== 'PENDING').length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-black text-slate-800 mb-4">Historique</h3>
          <div className="space-y-3">
            {requests
              .filter((r: any) => r.status !== 'PENDING')
              .slice(0, 10)
              .map((request: any) => (
                <div key={request.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">
                        {format(new Date(request.requested_date), 'd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      <p className="text-sm text-slate-600">{request.type}</p>
                      {request.practitioner_response && (
                        <p className="text-sm text-slate-700 mt-2 italic">"{request.practitioner_response}"</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'APPROVED' ? '✅ Approuvé' :
                       request.status === 'REJECTED' ? '❌ Refusé' :
                       request.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PractitionerRequestsManager;
