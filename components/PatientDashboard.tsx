import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Calendar, Clock, MapPin, FileText, CreditCard, LogOut, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ApptStatus, InvoiceStatus, AppointmentRequestStatus } from '../types';

interface PatientDashboardProps {
    patientId: number;
    onLogout: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patientId, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'SESSIONS' | 'INVOICES' | 'REQUESTS' | 'PROFILE'>('APPOINTMENTS');
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [selectedAppointmentToCancel, setSelectedAppointmentToCancel] = useState<number | null>(null);

    // Charger les données du patient
    const patient = useLiveQuery(() => db.patients.get(patientId));
    const patientAccount = useLiveQuery(() =>
        db.patientAccounts.where('patientId').equals(patientId).first()
    );

    // RDV à venir - chercher avec String ET Number pour compatibilité
    const upcomingAppointments = useLiveQuery(async () => {
        const appts = await db.appointments
            .filter(appt =>
                (appt.patientId === patientId || appt.patientId === String(patientId)) &&
                appt.status !== ApptStatus.CANCELLED &&
                new Date(appt.startTime) >= new Date()
            )
            .toArray();
        return appts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }) || [];

    // Historique séances - chercher avec String ET Number pour compatibilité
    const pastSessions = useLiveQuery(async () => {
        const sessions = await db.sessions
            .filter(s => s.patientId === patientId || s.patientId === String(patientId))
            .reverse()
            .sortBy('date');
        return sessions.slice(0, 20); // Augmenter de 10 à 20
    }) || [];

    // Factures
    const invoices = useLiveQuery(() =>
        db.invoices
            .filter(inv => inv.patientName === patient?.name)
            .reverse()
            .limit(20)
            .toArray()
    ) || [];

    // Demandes de RDV - chercher avec String ET Number + par email
    const appointmentRequests = useLiveQuery(async () => {
        const requests = await db.appointmentRequests
            .filter(r =>
                r.patientId === patientId ||
                r.patientId === String(patientId) ||
                (patientAccount?.email && r.patientEmail === patientAccount.email)
            )
            .reverse()
            .sortBy('createdAt');
        return requests.slice(0, 20); // Augmenter de 10 à 20
    }, [patientAccount]) || [];

    const handleLogout = () => {
        localStorage.removeItem('theraflow_patient_session');
        localStorage.removeItem('theraflow_patient_id');
        onLogout();
    };

    const handleValidateRequest = async (requestId: number, validated: boolean) => {
        try {
            await db.appointmentRequests.update(requestId, {
                validated,
                status: validated ? AppointmentRequestStatus.CONFIRMED : AppointmentRequestStatus.REJECTED,
                updatedAt: new Date().toISOString(),
                history: [
                    ...(await db.appointmentRequests.get(requestId))!.history,
                    {
                        date: new Date().toISOString(),
                        action: validated ? 'ACCEPTED' : 'REJECTED',
                        by: 'PATIENT',
                        message: validated ? 'Créneau validé' : 'Créneau refusé'
                    }
                ]
            });

            alert(validated ? '✅ Créneau validé !' : '❌ Créneau refusé. Le praticien vous proposera une alternative.');
        } catch (error) {
            console.error('Erreur validation:', error);
            alert('Erreur lors de la validation');
        }
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointmentToCancel) return;

        try {
            await db.appointments.update(selectedAppointmentToCancel, {
                status: ApptStatus.CANCELLED
            });

            alert('✅ Rendez-vous annulé. Le praticien en sera informé.');
            setShowCancelModal(false);
            setSelectedAppointmentToCancel(null);
        } catch (error) {
            console.error('Erreur annulation:', error);
            alert('Erreur lors de l\'annulation');
        }
    };

    const handleUpdateProfile = async (updatedData: { name?: string; phone?: string; address?: string }) => {
        try {
            await db.patients.update(patientId, updatedData);
            alert('✅ Profil mis à jour !');
            setShowEditProfileModal(false);
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    if (!patient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-slate-600">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <User size={24} className="text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
                                <p className="text-sm text-slate-500">{patientAccount?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                        >
                            <LogOut size={18} className="mr-2" />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('REQUESTS')}
                            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'REQUESTS'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Demandes RDV
                        </button>
                        <button
                            onClick={() => setActiveTab('APPOINTMENTS')}
                            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'APPOINTMENTS'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            RDV à venir
                        </button>
                        <button
                            onClick={() => setActiveTab('SESSIONS')}
                            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'SESSIONS'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Historique séances
                        </button>
                        <button
                            onClick={() => setActiveTab('INVOICES')}
                            className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'INVOICES'
                                    ? 'border-teal-600 text-teal-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Factures
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Demandes RDV */}
                {activeTab === 'REQUESTS' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Vos demandes de rendez-vous</h2>
                        {appointmentRequests.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-8 text-center">
                                <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Aucune demande de rendez-vous</p>
                            </div>
                        ) : (
                            appointmentRequests.map(request => (
                                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Calendar size={20} className="text-teal-600" />
                                                <span className="font-bold text-lg text-slate-800">
                                                    {new Date(request.requestedStartTime).toLocaleDateString('fr-FR', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Clock size={18} className="text-slate-400" />
                                                <span className="text-slate-600">
                                                    {new Date(request.requestedStartTime).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })} - {request.durationMin} min
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin size={18} className="text-slate-400" />
                                                <span className="text-slate-600">
                                                    {request.type === 'CABINET' ? 'Cabinet' : request.patientAddress || 'À domicile'}
                                                </span>
                                            </div>
                                            {request.notes && (
                                                <p className="text-sm text-slate-500 mt-3 italic">"{request.notes}"</p>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            {request.status === AppointmentRequestStatus.PENDING && !request.validated && (
                                                <div className="flex flex-col space-y-2">
                                                    <button
                                                        onClick={() => handleValidateRequest(request.id!, true)}
                                                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle size={18} className="mr-2" />
                                                        Valider
                                                    </button>
                                                    <button
                                                        onClick={() => handleValidateRequest(request.id!, false)}
                                                        className="flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                                                    >
                                                        <XCircle size={18} className="mr-2" />
                                                        Refuser
                                                    </button>
                                                </div>
                                            )}
                                            {request.status === AppointmentRequestStatus.CONFIRMED && (
                                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                                    <CheckCircle size={16} className="mr-1" />
                                                    Confirmé
                                                </span>
                                            )}
                                            {request.status === AppointmentRequestStatus.REJECTED && (
                                                <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                                                    <XCircle size={16} className="mr-1" />
                                                    Refusé
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* RDV à venir */}
                {activeTab === 'APPOINTMENTS' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Vos rendez-vous à venir</h2>
                        {upcomingAppointments.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-8 text-center">
                                <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Aucun rendez-vous à venir</p>
                            </div>
                        ) : (
                            upcomingAppointments.map(appt => (
                                <div key={appt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-teal-100 rounded-xl">
                                            <Calendar size={24} className="text-teal-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-slate-800">
                                                {new Date(appt.startTime).toLocaleDateString('fr-FR', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                                                <span className="flex items-center">
                                                    <Clock size={16} className="mr-1" />
                                                    {new Date(appt.startTime).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                <span className="flex items-center">
                                                    <MapPin size={16} className="mr-1" />
                                                    {appt.type}
                                                </span>
                                            </div>
                                            {appt.notes && (
                                                <p className="text-sm text-slate-500 mt-2 italic">"{appt.notes}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Historique séances */}
                {activeTab === 'SESSIONS' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Historique de vos séances</h2>
                        {pastSessions.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-8 text-center">
                                <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Aucune séance enregistrée</p>
                            </div>
                        ) : (
                            pastSessions.map(session => (
                                <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <FileText size={24} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-slate-800">
                                                {new Date(session.date).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </h3>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Type : {session.type} - Durée : {session.durationMin} min
                                            </p>
                                            {session.sessionSummary && (
                                                <p className="text-sm text-slate-500 mt-2 italic">
                                                    "{session.sessionSummary.substring(0, 100)}..."
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Factures */}
                {activeTab === 'INVOICES' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Vos factures</h2>
                        {invoices.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-8 text-center">
                                <CreditCard size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Aucune facture</p>
                            </div>
                        ) : (
                            invoices.map(invoice => (
                                <div key={invoice.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-amber-100 rounded-xl">
                                                <CreditCard size={24} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">
                                                    Facture #{invoice.number}
                                                </h3>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-800">
                                                {invoice.totalTTC.toFixed(2)} €
                                            </p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                                                invoice.status === InvoiceStatus.PAID
                                                    ? 'bg-green-100 text-green-800'
                                                    : invoice.status === InvoiceStatus.PENDING
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {invoice.status === InvoiceStatus.PAID ? 'Payée' :
                                                 invoice.status === InvoiceStatus.PENDING ? 'En attente' : 'En retard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;
