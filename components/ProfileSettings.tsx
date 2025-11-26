import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { localAuthService } from '../services/localAuthService';
import { db } from '../db';
import { User, Lock, Mail, Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const user = await authService.getAuthUser();
    if (user) {
      setCurrentUser(user);
      setProfileForm({
        name: user.name || '',
        email: user.email
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier le mot de passe actuel
      const loginResult = await localAuthService.login({
        email: currentUser.email,
        password: passwordForm.currentPassword
      });

      if (!loginResult.success) {
        setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' });
        setIsLoading(false);
        return;
      }

      // Hasher le nouveau mot de passe
      const encoder = new TextEncoder();
      const data = encoder.encode(passwordForm.newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Mettre à jour le mot de passe
      await db.users.update(parseInt(currentUser.id), {
        passwordHash: passwordHash
      });

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      // Mettre à jour le profil
      await db.users.update(parseInt(currentUser.id), {
        name: profileForm.name
      });

      // Mettre à jour la session
      const updatedUser = { ...currentUser, name: profileForm.name };
      localStorage.setItem('theraflow_local_session', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Paramètres du Profil
        </h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={24} />
            Informations Personnelles
          </h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={profileForm.email}
                disabled
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              L'email ne peut pas être modifié
            </p>
          </div>

          {/* Role Badge */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Rôle
            </label>
            <div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-sm ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser.role === 'PRACTITIONER'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {currentUser.role === 'ADMIN' && '🔐 Administrateur'}
                {currentUser.role === 'PRACTITIONER' && '👨‍⚕️ Praticien'}
                {currentUser.role === 'PATIENT' && '👤 Patient'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Mise à jour...</span>
            ) : (
              <>
                <Save size={20} />
                Mettre à jour le profil
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock size={24} />
            Changer le Mot de Passe
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Au moins 6 caractères</p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Changement...</span>
            ) : (
              <>
                <Lock size={20} />
                Changer le mot de passe
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>🔒 Conseil de sécurité:</strong> Utilisez un mot de passe unique et complexe. Changez-le
          régulièrement pour protéger votre compte.
        </p>
      </div>
    </div>
  );
};

export default ProfileSettings;
