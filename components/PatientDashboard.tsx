import React, { useState } from 'react';
import { Calendar, FileText, CreditCard, Video, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments, useInvoices, useConsultationReports, useAppointmentRequests } from '../hooks/useSupabaseData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointments, isLoading: loadingAppointments } = useAppointments();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: reports, isLoading: loadingReports } = useConsultationReports();
  const { data: requests, isLoading: loadingRequests } = useAppointmentRequests();
  const [activeTab, setActiveTab] = useState<'appointments' | 'requests' | 'invoices' | 'reports'>('appointments');

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      SCHEDULED: { label: 'Planifié', color: 'bg-blue-100 text-blue-800', icon: <Clock size={14} /> },
      COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={14} /> },
      APPROVED: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      REJECTED: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
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

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mes Demandes de Rendez-vous</h2>
            {loadingRequests ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Aucune demande en cours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request: any) => (
                  <div key={request.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {format(new Date(request.requested_date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </h3>
                        <p className="text-slate-600">{request.type} - {request.duration_min} min</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.reason && (
                      <p className="text-sm text-slate-600 mt-2"><strong>Motif:</strong> {request.reason}</p>
                    )}
                    {request.practitioner_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-bold text-blue-800 mb-1">Réponse du praticien:</p>
                        <p className="text-sm text-blue-700">{request.practitioner_response}</p>
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
