import React, { useState } from 'react';
import { localAuthService } from '../services/localAuthService';
import { db } from '../db';
import { KeyRound, Mail, ArrowLeft, CheckCircle, Copy } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'success'>('email');

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Chercher l'utilisateur par email
      const user = await db.users.where('email').equals(email.trim()).first();

      if (!user) {
        setError('Aucun compte trouvé avec cet email');
        setIsLoading(false);
        return;
      }

      // Générer un nouveau mot de passe
      const tempPassword = generateRandomPassword();

      // Hasher le nouveau mot de passe
      const encoder = new TextEncoder();
      const data = encoder.encode(tempPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Mettre à jour le mot de passe dans la base de données
      await db.users.update(user.id!, {
        passwordHash: passwordHash
      });

      // Afficher le nouveau mot de passe
      setNewPassword(tempPassword);
      setStep('success');
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    alert('Mot de passe copié dans le presse-papiers!');
  };

  if (step === 'success') {
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

        {/* Success Card */}
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-75"></div>

          <div className="relative bg-white rounded-2xl shadow-2xl p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                Mot de passe réinitialisé!
              </h1>
              <p className="text-gray-600">
                Voici votre nouveau mot de passe temporaire
              </p>
            </div>

            {/* New Password Display */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                <p className="text-sm text-gray-700 font-medium mb-3 text-center">
                  Nouveau mot de passe:
                </p>
                <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-3">
                  <code className="text-2xl font-bold text-purple-600 tracking-wider">
                    {newPassword}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="ml-3 p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Copier"
                  >
                    <Copy size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  ⚠️ Notez ce mot de passe, il ne sera plus affiché
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📋 Prochaines étapes:
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Copiez ce mot de passe temporaire</li>
                <li>Connectez-vous avec votre email et ce mot de passe</li>
                <li>Changez votre mot de passe dans les paramètres</li>
              </ol>
            </div>

            {/* Back to Login Button */}
            <button
              onClick={onBackToLogin}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              Retour à la connexion
            </button>
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

      {/* Forgot Password Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>

        <div className="relative bg-white rounded-2xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Logo & Title */}
          <div className="text-center mb-8 mt-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <KeyRound className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Mot de passe oublié
            </h1>
            <p className="text-gray-600">
              Entrez votre email pour réinitialiser
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Comment ça marche:</strong><br />
              Entrez votre email et nous générerons un nouveau mot de passe temporaire que vous pourrez voir immédiatement.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Adresse email
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
              <p className="mt-2 text-xs text-gray-500">
                L'email associé à votre compte TheraFlow
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="animate-pulse">Réinitialisation...</span>
              ) : (
                <>
                  <KeyRound size={20} className="mr-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className="text-sm text-purple-600 font-bold hover:text-purple-700 transition-colors"
            >
              ← Retour à la connexion
            </button>
          </div>
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

export default ForgotPasswordPage;
