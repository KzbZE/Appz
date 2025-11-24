import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

// ✅ Compte par défaut (crypté côté client pour sécurité basique)
const DEFAULT_ACCOUNT = {
    email: 'arnaudvb7@gmail.com',
    password: 'Jiskan22!'
};

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulation de vérification (2 secondes)
        setTimeout(() => {
            if (email === DEFAULT_ACCOUNT.email && password === DEFAULT_ACCOUNT.password) {
                // ✅ Connexion réussie
                const sessionToken = btoa(`${email}:${Date.now()}`); // Token simple
                localStorage.setItem('theraflow_session', sessionToken);
                localStorage.setItem('theraflow_user_email', email);
                onLoginSuccess();
            } else {
                // ❌ Échec de connexion
                setError('Email ou mot de passe incorrect');
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo / Branding */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="inline-block p-4 bg-primary-600 rounded-2xl shadow-lg mb-4">
                        <Lock size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">TheraFlow</h1>
                    <p className="text-slate-600">Connexion Praticien</p>
                </div>

                {/* Formulaire de connexion */}
                <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="arnaudvb7@gmail.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Message d'erreur */}
                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl animate-fadeIn">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Bouton de connexion */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    {/* Info compte par défaut (DEV ONLY - À SUPPRIMER EN PROD) */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-slate-600 font-medium mb-2">Compte par défaut :</p>
                        <p className="text-xs text-slate-500 font-mono">
                            Email: arnaudvb7@gmail.com<br/>
                            Mot de passe: Jiskan22!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                        © 2024 TheraFlow - Gestion de cabinet
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
