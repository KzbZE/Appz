import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, Clock, MapPin, Loader } from 'lucide-react';
import { db } from '../db';
import { AppointmentRequestStatus } from '../types';

interface AppointmentValidationProps {
    token: string;
}

const AppointmentValidation: React.FC<AppointmentValidationProps> = ({ token }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isValidating, setIsValidating] = useState(false);
    const [request, setRequest] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadRequest();
    }, [token]);

    const loadRequest = async () => {
        try {
            // Chercher la demande de RDV avec ce token
            const foundRequest = await db.appointmentRequests
                .filter(req => req.validationToken === token)
                .first();

            if (!foundRequest) {
                setError('Lien de validation invalide ou expiré.');
                setIsLoading(false);
                return;
            }

            if (foundRequest.validated) {
                setSuccess(true);
                setError('Ce créneau a déjà été validé.');
                setIsLoading(false);
                return;
            }

            setRequest(foundRequest);
            setIsLoading(false);
        } catch (err) {
            console.error('Erreur chargement demande:', err);
            setError('Erreur lors du chargement de votre demande.');
            setIsLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!request?.id) return;

        setIsValidating(true);
        try {
            // Mettre à jour la demande comme validée
            await db.appointmentRequests.update(request.id, {
                validated: true,
                status: AppointmentRequestStatus.CONFIRMED,
                updatedAt: new Date().toISOString(),
                history: [
                    ...request.history,
                    {
                        date: new Date().toISOString(),
                        action: 'ACCEPTED',
                        by: 'PATIENT',
                        message: 'Créneau validé par email'
                    }
                ]
            });

            setSuccess(true);
            setError('');
        } catch (err) {
            console.error('Erreur validation:', err);
            setError('Erreur lors de la validation. Veuillez réessayer.');
        }
        setIsValidating(false);
    };

    const handleReject = async () => {
        if (!request?.id) return;

        if (!confirm('Êtes-vous sûr de vouloir refuser ce créneau ?')) return;

        setIsValidating(true);
        try {
            await db.appointmentRequests.update(request.id, {
                validated: false,
                status: AppointmentRequestStatus.REJECTED,
                updatedAt: new Date().toISOString(),
                history: [
                    ...request.history,
                    {
                        date: new Date().toISOString(),
                        action: 'REJECTED',
                        by: 'PATIENT',
                        message: 'Créneau refusé par email'
                    }
                ]
            });

            setSuccess(true);
            setError('Créneau refusé. Le praticien vous proposera une alternative.');
        } catch (err) {
            console.error('Erreur rejet:', err);
            setError('Erreur lors du rejet. Veuillez réessayer.');
        }
        setIsValidating(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader size={48} className="text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Chargement de votre demande...</p>
                </div>
            </div>
        );
    }

    if (error && !request) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <XCircle size={64} className="text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Erreur</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
                    <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">
                        {error ? 'Action effectuée' : 'Créneau validé !'}
                    </h1>
                    <p className="text-slate-600 mb-6">
                        {error || 'Votre rendez-vous a été confirmé. Vous recevrez un SMS de confirmation prochainement.'}
                    </p>
                    <div className="bg-primary-50 rounded-xl p-4 text-left">
                        <p className="text-sm font-medium text-primary-900 mb-2">Détails du rendez-vous</p>
                        <div className="space-y-2">
                            <div className="flex items-center text-sm text-slate-600">
                                <Calendar size={16} className="mr-2 text-primary-600" />
                                {new Date(request?.requestedStartTime).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <Clock size={16} className="mr-2 text-primary-600" />
                                {new Date(request?.requestedStartTime).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <MapPin size={16} className="mr-2 text-primary-600" />
                                {request?.type === 'CABINET' ? 'Cabinet' : request?.patientAddress || 'À domicile'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
                <div className="text-center mb-6">
                    <Calendar size={48} className="text-primary-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirmer votre rendez-vous</h1>
                    <p className="text-slate-600">Le praticien vous propose ce créneau</p>
                </div>

                {/* Détails du RDV */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <Calendar size={20} className="mr-3 text-primary-600" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Date</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {new Date(request?.requestedStartTime).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Clock size={20} className="mr-3 text-primary-600" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Heure</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {new Date(request?.requestedStartTime).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} - {request?.durationMin} minutes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin size={20} className="mr-3 text-primary-600" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Lieu</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {request?.type === 'CABINET' ? 'Cabinet' : request?.patientAddress || 'À domicile'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-3">
                    <button
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isValidating ? (
                            <>
                                <Loader size={20} className="animate-spin mr-2" />
                                Validation...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} className="mr-2" />
                                Confirmer ce créneau
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={isValidating}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <XCircle size={20} className="mr-2" />
                        Refuser ce créneau
                    </button>
                </div>

                {error && (
                    <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl">
                        <XCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentValidation;
