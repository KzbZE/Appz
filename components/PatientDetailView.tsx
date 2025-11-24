import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Patient, Session, Invoice, Appointment, ApptStatus, InvoiceStatus } from '../types';
import { X, Calendar, FileText, CreditCard, Clock, MapPin, Phone, Mail, User, Activity, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface PatientDetailViewProps {
  patientId: number;
  onClose: () => void;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patientId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SESSIONS' | 'APPOINTMENTS' | 'INVOICES'>('OVERVIEW');

  // Charger toutes les données du patient
  const patient = useLiveQuery(() => db.patients.get(patientId));

  const sessions = useLiveQuery(() =>
    db.sessions
      .where('patientId')
      .equals(patientId)
      .or('patientId')
      .equals(String(patientId))
      .reverse()
      .sortBy('date')
  ) || [];

  const appointments = useLiveQuery(() =>
    db.appointments
      .filter(appt =>
        (appt.patientId === patientId || appt.patientId === String(patientId))
      )
      .toArray()
  ) || [];

  const invoices = useLiveQuery(() =>
    db.invoices
      .filter(inv => inv.patientName === patient?.name)
      .reverse()
      .sortBy('date')
  ) || [];

  const appointmentRequests = useLiveQuery(() =>
    db.appointmentRequests
      .filter(r =>
        r.patientId === patientId ||
        r.patientId === String(patientId) ||
        (patient?.email && r.patientEmail === patient.email)
      )
      .reverse()
      .sortBy('createdAt')
  ) || [];

  if (!patient) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6">
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Statistiques
  const totalSessions = sessions.length;
  const upcomingAppointments = appointments.filter(a =>
    a.status === ApptStatus.SCHEDULED &&
    new Date(a.startTime) >= new Date()
  ).length;

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const unpaidAmount = invoices
    .filter(inv => inv.status !== InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + (inv.totalTTC - (inv.amountPaid || 0)), 0);

  const lastSession = sessions[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{patient.name}</h2>
                <div className="flex items-center space-x-4 text-teal-100 text-sm">
                  {patient.phone && (
                    <div className="flex items-center">
                      <Phone size={14} className="mr-1" />
                      {patient.phone}
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center">
                      <Mail size={14} className="mr-1" />
                      {patient.email}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-teal-100 text-sm">
                  Type: {patient.type}
                  {patient.address && ` • ${patient.address}`}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b flex-shrink-0">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{totalSessions}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Séances totales</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Calendar size={20} className="text-green-600" />
              <span className="text-2xl font-bold text-green-600">{upcomingAppointments}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">RDV à venir</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className="text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{totalRevenue.toFixed(0)}€</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Chiffre d'affaires</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={20} className="text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{unpaidAmount.toFixed(0)}€</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Impayés</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex-shrink-0">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'OVERVIEW'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('SESSIONS')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'SESSIONS'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Séances ({totalSessions})
            </button>
            <button
              onClick={() => setActiveTab('APPOINTMENTS')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'APPOINTMENTS'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Rendez-vous ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'INVOICES'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Factures ({invoices.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Vue d'ensemble */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Dernière séance */}
              {lastSession && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                    <FileText size={20} className="mr-2" />
                    Dernière séance
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">Date</p>
                      <p className="text-blue-900">{new Date(lastSession.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Type</p>
                      <p className="text-blue-900">{lastSession.type}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-blue-700 font-medium mb-1">Résumé</p>
                      <p className="text-blue-900 text-xs">
                        {lastSession.sessionSummary?.substring(0, 200)}
                        {(lastSession.sessionSummary?.length || 0) > 200 && '...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prochain RDV */}
              {upcomingAppointments > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                    <Calendar size={20} className="mr-2" />
                    Prochain rendez-vous
                  </h3>
                  {appointments
                    .filter(a => a.status === ApptStatus.SCHEDULED && new Date(a.startTime) >= new Date())
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .slice(0, 1)
                    .map(appt => (
                      <div key={appt.id} className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-700 font-medium">Date & Heure</p>
                          <p className="text-green-900">
                            {new Date(appt.startTime).toLocaleString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-green-700 font-medium">Lieu</p>
                          <p className="text-green-900">{appt.type}</p>
                        </div>
                        {appt.notes && (
                          <div className="col-span-2">
                            <p className="text-green-700 font-medium">Notes</p>
                            <p className="text-green-900 text-xs">{appt.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Historique récent */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Activité récente</h3>
                <div className="space-y-3">
                  {[...sessions.slice(0, 3), ...appointments.slice(0, 2)]
                    .sort((a, b) => {
                      const dateA = 'date' in a ? new Date(a.date) : new Date(a.startTime);
                      const dateB = 'date' in b ? new Date(b.date) : new Date(b.startTime);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 5)
                    .map((item, i) => {
                      const isSession = 'date' in item;
                      const date = isSession ? new Date(item.date) : new Date(item.startTime);

                      return (
                        <div key={i} className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                          <div className={`p-2 rounded-lg ${isSession ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {isSession ? <FileText size={16} className="text-blue-600" /> : <Calendar size={16} className="text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-800">
                              {isSession ? 'Séance' : 'Rendez-vous'} - {item.type}
                            </p>
                            <p className="text-xs text-slate-500">{date.toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Séances */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucune séance enregistrée</p>
                </div>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">
                          {new Date(session.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {session.type} • {session.durationMin} min
                          {session.price && ` • ${session.price}€`}
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {session.type}
                      </div>
                    </div>

                    {session.anamnesis && (
                      <div className="space-y-2 text-sm">
                        {session.anamnesis.mainComplaint && (
                          <div>
                            <p className="font-semibold text-red-900">Plainte principale:</p>
                            <p className="text-slate-700">{session.anamnesis.mainComplaint}</p>
                          </div>
                        )}
                        {session.treatmentNotes && (
                          <div>
                            <p className="font-semibold text-emerald-900">Traitement:</p>
                            <p className="text-slate-700">{session.treatmentNotes.substring(0, 200)}...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Rendez-vous */}
          {activeTab === 'APPOINTMENTS' && (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucun rendez-vous</p>
                </div>
              ) : (
                appointments
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map(appt => (
                    <div key={appt.id} className="bg-white border rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-slate-800">
                            {new Date(appt.startTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </h4>
                          <div className="flex items-center space-x-3 text-sm text-slate-600 mt-1">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {new Date(appt.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {appt.type}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appt.status === ApptStatus.SCHEDULED
                            ? 'bg-green-100 text-green-800'
                            : appt.status === ApptStatus.COMPLETED
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appt.status === ApptStatus.SCHEDULED && 'Planifié'}
                          {appt.status === ApptStatus.COMPLETED && 'Terminé'}
                          {appt.status === ApptStatus.CANCELLED && 'Annulé'}
                        </span>
                      </div>
                      {appt.notes && (
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Factures */}
          {activeTab === 'INVOICES' && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucune facture</p>
                </div>
              ) : (
                invoices.map(invoice => (
                  <div key={invoice.id} className="bg-white border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">
                          Facture #{invoice.number}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800">
                          {invoice.totalTTC.toFixed(2)} €
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                          invoice.status === InvoiceStatus.PAID
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === InvoiceStatus.PENDING
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status === InvoiceStatus.PAID && (
                            <><CheckCircle size={12} className="inline mr-1" />Payée</>
                          )}
                          {invoice.status === InvoiceStatus.PENDING && 'En attente'}
                          {invoice.status === InvoiceStatus.OVERDUE && (
                            <><XCircle size={12} className="inline mr-1" />En retard</>
                          )}
                        </span>
                      </div>
                    </div>

                    {invoice.status !== InvoiceStatus.PAID && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-900">
                          <span className="font-semibold">Reste à payer:</span> {(invoice.totalTTC - (invoice.amountPaid || 0)).toFixed(2)} €
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailView;
