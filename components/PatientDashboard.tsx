import React, { useState } from 'react';
import { Calendar, FileText, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments, useInvoices, useConsultationReports, useAppointmentRequests } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PatientRequestAppointment from './PatientRequestAppointment';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointments, isLoading: loadingAppointments } = useAppointments();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: reports, isLoading: loadingReports } = useConsultationReports();
  const { data: requests, isLoading: loadingRequests, refresh: refreshRequests } = useAppointmentRequests();
  const [activeTab, setActiveTab] = useState<'appointments' | 'requests' | 'invoices' | 'reports' | 'new_request'>('appointments');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showCounterProposal, setShowCounterProposal] = useState<Record<number, boolean>>({});
  const [counterProposalDates, setCounterProposalDates] = useState<Record<number, Array<{date: string, time: string}>>>({});
  const [counterProposalMessage, setCounterProposalMessage] = useState<Record<number, string>>({});

  const addCounterProposalDate = (requestId: number) => {
    const current = counterProposalDates[requestId] || [];
    setCounterProposalDates({
      ...counterProposalDates,
      [requestId]: [...current, { date: '', time: '' }]
    });
  };

  const updateCounterProposalDate = (requestId: number, index: number, field: 'date' | 'time', value: string) => {
    const current = counterProposalDates[requestId] || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    setCounterProposalDates({
      ...counterProposalDates,
      [requestId]: updated
    });
  };

  const removeCounterProposalDate = (requestId: number, index: number) => {
    const current = counterProposalDates[requestId] || [];
    setCounterProposalDates({
      ...counterProposalDates,
      [requestId]: current.filter((_, i) => i !== index)
    });
  };

  const handleAcceptAlternativeDate = async (request: any, selectedDate: string) => {
    try {
      setProcessingId(request.id);

      // 1. Create the appointment with the accepted date
      const { error: apptError } = await supabase
        .from('appointments')
        .insert([{
          user_id: request.practitioner_id,
          patient_id: request.patient_id,
          start_time: selectedDate,
          duration_min: request.duration_min || 60,
          status: 'SCHEDULED',
          type: request.type,
          notes: request.reason,
          request_id: request.id,
          practitioner_id: request.practitioner_id,
        }]);

      if (apptError) throw apptError;

      // 2. Update the request status
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
          status: 'APPROVED',
          requested_date: selectedDate,
          patient_response: 'Date alternative acceptée',
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      alert('✅ Rendez-vous confirmé !');
      await refreshRequests();
    } catch (error: any) {
      console.error('Error accepting date:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectProposal = async (request: any) => {
    try {
      setProcessingId(request.id);

      const { error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'REJECTED',
          patient_response: 'Proposition refusée',
        })
        .eq('id', request.id);

      if (error) throw error;

      alert('Demande annulée');
      await refreshRequests();
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendCounterProposal = async (request: any) => {
    try {
      const dates = counterProposalDates[request.id] || [];

      if (dates.length === 0 || dates.some(d => !d.date || !d.time)) {
        alert('❌ Veuillez ajouter au moins une date alternative complète');
        return;
      }

      setProcessingId(request.id);

      // Get existing alternative dates
      const existingDates = request.alternative_dates ? JSON.parse(request.alternative_dates) : [];

      // Add patient's counter-proposal
      const newDates = dates.map(d => ({
        date: new Date(`${d.date}T${d.time}`).toISOString(),
        proposed_by: 'PATIENT'
      }));

      const allDates = [...existingDates, ...newDates];

      const message = counterProposalMessage[request.id] || 'Je vous propose ces créneaux :';

      const { error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'COUNTER_PROPOSAL_PATIENT',
          patient_response: message,
          alternative_dates: JSON.stringify(allDates),
        })
        .eq('id', request.id);

      if (error) throw error;

      alert('✅ Contre-proposition envoyée au praticien !');
      setCounterProposalDates(prev => ({ ...prev, [request.id]: [] }));
      setCounterProposalMessage(prev => ({ ...prev, [request.id]: '' }));
      setShowCounterProposal(prev => ({ ...prev, [request.id]: false }));
      await refreshRequests();
    } catch (error: any) {
      console.error('Error sending counter-proposal:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      SCHEDULED: { label: 'Planifié', color: 'bg-blue-100 text-blue-800', icon: <Clock size={14} /> },
      COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={14} /> },
      APPROVED: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      REJECTED: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
      COUNTER_PROPOSAL_PRACTITIONER: { label: 'Proposition praticien', color: 'bg-blue-100 text-blue-800', icon: <Calendar size={14} /> },
      COUNTER_PROPOSAL_PATIENT: { label: 'Votre contre-proposition', color: 'bg-purple-100 text-purple-800', icon: <Calendar size={14} /> },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: null };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            Bonjour, {user?.name || 'Patient'} 👋
          </h1>
          <p className="text-slate-600">Gérez vos rendez-vous et consultez vos documents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 border border-slate-200">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar size={18} />
              Mes Rendez-vous
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertCircle size={18} />
              Demandes
              {requests.filter((r: any) => r.status === 'COUNTER_PROPOSAL_PRACTITIONER').length > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs">
                  {requests.filter((r: any) => r.status === 'COUNTER_PROPOSAL_PRACTITIONER').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('new_request')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'new_request'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200'
              }`}
            >
              <Plus size={18} />
              Nouveau RDV
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard size={18} />
              Factures
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={18} />
              Comptes Rendus
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mes Rendez-vous</h2>
            {loadingAppointments ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Aucun rendez-vous pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {format(new Date(appointment.start_time), 'EEEE d MMMM yyyy', { locale: fr })}
                        </h3>
                        <p className="text-slate-600">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.duration_min} min
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-slate-600 mt-2">{appointment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Request Tab */}
        {activeTab === 'new_request' && (
          <PatientRequestAppointment />
        )}

        {/* Requests Tab - WITH FULL NEGOTIATION */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mes Demandes de Rendez-vous</h2>
            {loadingRequests ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Aucune demande en cours</p>
                <button
                  onClick={() => setActiveTab('new_request')}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Demander un rendez-vous
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request: any) => (
                  <div key={request.id} className={`p-5 rounded-xl border-2 shadow-sm ${
                    request.status === 'COUNTER_PROPOSAL_PRACTITIONER'
                      ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Request Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {format(new Date(request.requested_date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </h3>
                        <p className="text-slate-600">{request.type} - {request.duration_min} min</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.reason && (
                      <p className="text-sm text-slate-600 mb-3"><strong>Motif:</strong> {request.reason}</p>
                    )}

                    {/* Practitioner Response */}
                    {request.practitioner_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-bold text-blue-800 mb-1">💬 Réponse du praticien:</p>
                        <p className="text-sm text-blue-700">{request.practitioner_response}</p>
                      </div>
                    )}

                    {/* Alternative Dates from Practitioner */}
                    {request.status === 'COUNTER_PROPOSAL_PRACTITIONER' && request.alternative_dates && (
                      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-orange-300">
                        <p className="text-sm font-bold text-orange-800 mb-3">📅 Créneaux proposés par le praticien:</p>
                        <div className="space-y-2 mb-4">
                          {JSON.parse(request.alternative_dates)
                            .filter((d: any) => d.proposed_by === 'PRACTITIONER')
                            .map((alt: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-all">
                                <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-orange-600" />
                                  <span className="font-bold text-slate-800">
                                    {format(new Date(alt.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleAcceptAlternativeDate(request, alt.date)}
                                  disabled={processingId === request.id}
                                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                  ✅ Accepter
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* Counter Proposal Section */}
                        {!showCounterProposal[request.id] ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowCounterProposal(prev => ({ ...prev, [request.id]: true }))}
                              className="flex-1 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                              <CalendarPlus size={18} />
                              Proposer d'autres dates
                            </button>
                            <button
                              onClick={() => handleRejectProposal(request)}
                              disabled={processingId === request.id}
                              className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-all"
                            >
                              ❌ Refuser
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm font-bold text-blue-800 mb-3">🔄 Contre-proposer des dates</p>

                            <textarea
                              value={counterProposalMessage[request.id] || ''}
                              onChange={(e) => setCounterProposalMessage(prev => ({ ...prev, [request.id]: e.target.value }))}
                              placeholder="Message pour le praticien (optionnel)..."
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm mb-3"
                              rows={2}
                            />

                            <div className="space-y-2 mb-3">
                              {(counterProposalDates[request.id] || []).map((alt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input
                                    type="date"
                                    value={alt.date}
                                    onChange={(e) => updateCounterProposalDate(request.id, idx, 'date', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm"
                                  />
                                  <input
                                    type="time"
                                    value={alt.time}
                                    onChange={(e) => updateCounterProposalDate(request.id, idx, 'time', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm"
                                  />
                                  <button
                                    onClick={() => removeCounterProposalDate(request.id, idx)}
                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => addCounterProposalDate(request.id)}
                              className="w-full px-3 py-2 bg-blue-200 text-blue-700 rounded-lg font-bold hover:bg-blue-300 transition-all text-sm mb-3"
                            >
                              + Ajouter un créneau
                            </button>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendCounterProposal(request)}
                                disabled={processingId === request.id || (counterProposalDates[request.id] || []).length === 0}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                              >
                                📤 Envoyer ma contre-proposition
                              </button>
                              <button
                                onClick={() => {
                                  setShowCounterProposal(prev => ({ ...prev, [request.id]: false }));
                                  setCounterProposalDates(prev => ({ ...prev, [request.id]: [] }));
                                  setCounterProposalMessage(prev => ({ ...prev, [request.id]: '' }));
                                }}
                                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Patient's Counter Proposal Display */}
                    {request.status === 'COUNTER_PROPOSAL_PATIENT' && request.patient_response && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-bold text-purple-800 mb-1">🔄 Votre contre-proposition:</p>
                        <p className="text-sm text-purple-700 mb-2">{request.patient_response}</p>
                        {request.alternative_dates && (
                          <div>
                            <p className="text-xs font-bold text-purple-700 mb-1">Dates proposées:</p>
                            {JSON.parse(request.alternative_dates)
                              .filter((d: any) => d.proposed_by === 'PATIENT')
                              .map((alt: any, idx: number) => (
                                <div key={idx} className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                  <Calendar size={12} />
                                  {format(new Date(alt.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                                </div>
                              ))}
                          </div>
                        )}
                        <p className="text-xs text-purple-600 mt-2 italic">⏳ En attente de la réponse du praticien...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mes Factures</h2>
            {loadingInvoices ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CreditCard size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Aucune facture</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice: any) => (
                  <div key={invoice.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Facture N° {invoice.number}</h3>
                        <p className="text-slate-600">
                          {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-800">{invoice.amount_ttc}€</p>
                        {getStatusBadge(invoice.payment_status || invoice.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mes Comptes Rendus</h2>
            {loadingReports ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Aucun compte rendu disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div key={report.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        Consultation du {format(new Date(report.date), 'd MMMM yyyy', { locale: fr })}
                      </h3>
                    </div>
                    {report.diagnosis && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-slate-700">Diagnostic:</p>
                        <p className="text-sm text-slate-600">{report.diagnosis}</p>
                      </div>
                    )}
                    {report.treatment && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-slate-700">Traitement:</p>
                        <p className="text-sm text-slate-600">{report.treatment}</p>
                      </div>
                    )}
                    {report.recommendations && (
                      <div>
                        <p className="text-sm font-bold text-slate-700">Recommandations:</p>
                        <p className="text-sm text-slate-600">{report.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
