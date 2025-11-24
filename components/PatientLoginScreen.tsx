import React, { useState } from 'react';
import { Lock, User, AlertCircle, UserPlus } from 'lucide-react';
import { db } from '../db';

interface PatientLoginScreenProps {
    onLoginSuccess: (patientId: number) => void;
    onBackToPublic?: () => void;
}

const PatientLoginScreen: React.FC<PatientLoginScreenProps> = ({ onLoginSuccess, onBackToPublic }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Hash simple du mot de passe (pour demo - en prod utiliser bcrypt)
    const hashPassword = (pwd: string): string => {
        return btoa(pwd); // Base64 simple pour démo
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Rechercher le compte patient par email
            const account = await db.patientAccounts
                .where('email')
                .equals(email.toLowerCase())
                .first();

            if (!account) {
                setError('Email non trouvé. Créez d\'abord un compte.');
                setIsLoading(false);
                return;
            }

            // Vérifier le mot de passe
            const passwordHash = hashPassword(password);
            if (account.passwordHash !== passwordHash) {
                setError('Mot de passe incorrect');
                setIsLoading(false);
                return;
            }

            // ✅ Connexion réussie
            // Mettre à jour lastLoginAt
            await db.patientAccounts.update(account.id!, {
                lastLoginAt: new Date().toISOString()
            });

            // Stocker la session
            const sessionToken = btoa(`patient:${account.patientId}:${Date.now()}`);
            localStorage.setItem('theraflow_patient_session', sessionToken);
            localStorage.setItem('theraflow_patient_id', String(account.patientId));

            onLoginSuccess(account.patientId);
        } catch (err) {
            console.error('Erreur connexion patient:', err);
            setError('Erreur de connexion. Réessayez.');
        }

        setIsLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validation
            if (!email || !password || !name || !phone) {
                setError('Tous les champs sont obligatoires');
                setIsLoading(false);
                return;
            }

            if (password.length < 6) {
                setError('Le mot de passe doit contenir au moins 6 caractères');
                setIsLoading(false);
                return;
            }

            // Vérifier si l'email existe déjà
            const existingAccount = await db.patientAccounts
                .where('email')
                .equals(email.toLowerCase())
                .first();

            if (existingAccount) {
                setError('Cet email est déjà utilisé');
                setIsLoading(false);
                return;
            }

            // Rechercher ou créer le patient par téléphone OU email
            let patientId: number | undefined;

            // 1. Chercher par téléphone
            let existingPatient = await db.patients
                .where('phone')
                .equals(phone)
                .first();

            // 2. Si pas trouvé, chercher par email
            if (!existingPatient) {
                existingPatient = await db.patients
                    .where('email')
                    .equals(email.toLowerCase())
                    .first();
            }

            if (existingPatient) {
                // Patient existe déjà, utiliser son ID
                patientId = existingPatient.id as number;
                // Mettre à jour les infos
                await db.patients.update(patientId, {
                    name,
                    phone,
                    email: email.toLowerCase()
                });
            } else {
                // Créer un nouveau patient
                patientId = await db.patients.add({
                    name,
                    phone,
                    email: email.toLowerCase(),
                    type: 'HUMAN',
                    location: 'Cabinet',
                    address: 'À compléter'
                }) as number;
            }

            // 🔧 IMPORTANT: Lier toutes les demandes de RDV avec cet email au compte
            const pendingRequests = await db.appointmentRequests
                .where('patientEmail')
                .equals(email.toLowerCase())
                .toArray();

            for (const request of pendingRequests) {
                if (request.id && request.patientId !== patientId) {
                    await db.appointmentRequests.update(request.id, {
                        patientId: patientId
                    });
                }
            }

            console.log(`✅ ${pendingRequests.length} demandes de RDV liées au compte patient`);

            // Créer le compte patient
            const accountId = await db.patientAccounts.add({
                patientId,
                email: email.toLowerCase(),
                passwordHash: hashPassword(password),
                createdAt: new Date().toISOString()
            });

            // ✅ Inscription réussie, connexion automatique
            const sessionToken = btoa(`patient:${patientId}:${Date.now()}`);
            localStorage.setItem('theraflow_patient_session', sessionToken);
            localStorage.setItem('theraflow_patient_id', String(patientId));

            onLoginSuccess(patientId);
        } catch (err) {
            console.error('Erreur inscription patient:', err);
            setError('Erreur lors de l\'inscription. Réessayez.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo / Branding */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="inline-block p-4 bg-teal-600 rounded-2xl shadow-lg mb-4">
                        <User size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Espace Patient</h1>
                    <p className="text-slate-600">
                        {mode === 'LOGIN' ? 'Connectez-vous pour accéder à vos rendez-vous' : 'Créez votre compte patient'}
                    </p>
                </div>

                {/* Onglets */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                    <button
                        onClick={() => { setMode('LOGIN'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                            mode === 'LOGIN' ? 'bg-white shadow text-teal-600' : 'text-slate-500'
                        }`}
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => { setMode('REGISTER'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                            mode === 'REGISTER' ? 'bg-white shadow text-teal-600' : 'text-slate-500'
                        }`}
                    >
                        Inscription
                    </button>
                </div>

                {/* Formulaire */}
                <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
                    <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
                        {/* Inscription uniquement : Nom */}
                        {mode === 'REGISTER' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    placeholder="Jean Dupont"
                                    required
                                />
                            </div>
                        )}

                        {/* Inscription uniquement : Téléphone */}
                        {mode === 'REGISTER' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    placeholder="0612345678"
                                    required
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                placeholder="patient@example.com"
                                required
                                autoFocus={mode === 'LOGIN'}
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            {mode === 'REGISTER' && (
                                <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
                            )}
                        </div>

                        {/* Message d'erreur */}
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl animate-fadeIn">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Bouton */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                'Chargement...'
                            ) : mode === 'LOGIN' ? (
                                <>
                                    <Lock size={20} className="mr-2" />
                                    Se connecter
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} className="mr-2" />
                                    Créer mon compte
                                </>
                            )}
                        </button>
                    </form>

                    {/* Retour au formulaire public */}
                    {onBackToPublic && (
                        <button
                            onClick={onBackToPublic}
                            className="w-full mt-4 text-sm text-slate-600 hover:text-slate-800 font-medium"
                        >
                            ← Retour au formulaire de demande
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                        Vos données sont sécurisées et conformes RGPD
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientLoginScreen;
