import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { initService } from '../services/initService';
import { diagnosticService } from '../services/diagnosticService';
import { LogIn, Lock, Mail, Eye, EyeOff, Sparkles, RefreshCw, Bug } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onGoToRegister?: () => void;
  onGoToForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToRegister, onGoToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialiser l'application au montage du composant
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🔍 Vérification de l\'initialisation...');
        const result = await initService.initialize();
        console.log(result.message);
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await authService.login({ email, password });

    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  // Quick login pour démo
  const quickLogin = async (role: 'ADMIN' | 'PRACTITIONER') => {
    setError('');
    setIsLoading(true);

    let credentials;
    if (role === 'ADMIN') {
      credentials = { email: 'admin@admin.com', password: 'adminadmin' };
    } else {
      credentials = { email: 'arnaudvb7@gmail.com', password: 'Jiskan22' };
    }

    const result = await authService.login(credentials);
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  // Fonction de debug pour réinitialiser la base
  const handleDebugReset = async () => {
    if (confirm('⚠️ ATTENTION: Cette action va réinitialiser complètement la base de données et recréer les comptes par défaut. Continuer ?')) {
      setIsLoading(true);
      setError('');

      try {
        console.log('🔧 Début de la réinitialisation...');
        await diagnosticService.resetDatabase();

        setError('');
        alert('✅ Base de données réinitialisée! Les comptes par défaut ont été recréés. Essayez de vous connecter maintenant.');

        // Recharger la page
        window.location.reload();
      } catch (error: any) {
        console.error('Erreur lors de la réinitialisation:', error);
        setError('Erreur lors de la réinitialisation: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Fonction de diagnostic complet
  const handleRunDiagnostic = async () => {
    console.log('🏥 Lancement du diagnostic...');
    await diagnosticService.runFullDiagnostic();
    alert('✅ Diagnostic terminé! Vérifiez la console (F12) pour les résultats.');
  };

  // Afficher un spinner pendant l'initialisation
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Initialisation de TheraFlow...</p>
          <p className="text-white/60 text-sm mt-2">Création des comptes par défaut</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>

        <div className="relative bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              TheraFlow
            </h1>
            <p className="text-gray-600">
              Connexion à votre espace
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="animate-pulse">Connexion...</span>
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Se connecter
                </>
              )}
            </button>

            {/* Forgot Password Link */}
            {onGoToForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onGoToForgotPassword}
                  className="text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Connexion rapide (Démo)
              </span>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => quickLogin('ADMIN')}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center disabled:opacity-50"
            >
              🔐 Admin Backend
            </button>
            <button
              onClick={() => quickLogin('PRACTITIONER')}
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              👨‍⚕️ Praticien
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">
              🔑 Identifiants de connexion :
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li><strong>Praticien:</strong> arnaudvb7@gmail.com / Jiskan22</li>
              <li><strong>Admin:</strong> admin@admin.com / adminadmin</li>
              <li className="text-green-700 font-medium mt-2">✅ Comptes créés automatiquement au premier lancement</li>
            </ul>
          </div>

          {/* Debug Tools */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium mb-3">
              🔧 Outils de dépannage
            </p>
            <div className="space-y-2">
              <button
                onClick={handleDebugReset}
                disabled={isLoading}
                className="w-full py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <RefreshCw size={16} />
                Réinitialiser la base de données
              </button>
              <button
                onClick={handleRunDiagnostic}
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Bug size={16} />
                Lancer le diagnostic (Console F12)
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              ℹ️ Utilisez ces outils si les identifiants ne fonctionnent pas
            </p>
          </div>

          {/* Register Link */}
          {onGoToRegister && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={onGoToRegister}
                  className="text-purple-600 font-bold hover:text-purple-700 transition-colors"
                >
                  Créer un compte
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
