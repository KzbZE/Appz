import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'practitioner' as 'admin' | 'practitioner' | 'assistant'
  });

  // Validation de complexité du mot de passe
  const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (!hasUpperCase) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }
    if (!hasLowerCase) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }
    if (!hasNumber) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    if (!hasSpecialChar) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)' };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Vérifier le lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setError(`Trop de tentatives échouées. Réessayez dans ${minutesLeft} minute(s).`);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }

        // Validation de la complexité du mot de passe
        const passwordValidation = validatePasswordStrength(formData.password);
        if (!passwordValidation.valid) {
          setError(passwordValidation.message || 'Mot de passe invalide');
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          role: formData.role.toUpperCase() as 'ADMIN' | 'PRACTITIONER' | 'ASSISTANT'
        });

        if (error) {
          // Message d'erreur générique (pas de détails techniques)
          setError('Impossible de créer le compte. Veuillez réessayer.');
          console.error('Signup error:', error); // Log technique uniquement
        } else {
          // Succès - l'utilisateur est automatiquement connecté
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          // Incrémenter tentatives
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);

          // Lockout après 5 tentatives
          if (newAttempts >= 5) {
            const lockout = Date.now() + (15 * 60 * 1000); // 15 minutes
            setLockoutUntil(lockout);
            setError('Trop de tentatives échouées. Compte temporairement verrouillé (15 minutes).');
            console.error('Login attempt failed:', error);
          } else {
            setError(`Email ou mot de passe incorrect. ${5 - newAttempts} tentative(s) restante(s).`);
            console.error('Login error:', error);
          }
        } else {
          // Réinitialiser le compteur en cas de succès
          setLoginAttempts(0);
          setLockoutUntil(null);
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-20"></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2">TheraFlow Hybrid</h2>
          <p className="text-sm opacity-90">
            {mode === 'login' ? 'Connexion sécurisée' : 'Créer un compte'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              mode === 'login'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-4 text-sm font-bold transition-all ${
              mode === 'register'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                    placeholder="Dr. Jean Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="practitioner">Praticien</option>
                  <option value="admin">Administrateur</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                placeholder="exemple@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-xs text-slate-500 mt-1">Minimum 8 caractères</p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Confirmer mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading
              ? 'Chargement...'
              : mode === 'login'
              ? 'Se connecter'
              : 'Créer mon compte'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              className="w-full text-sm text-teal-600 hover:text-teal-700 font-semibold"
            >
              Mot de passe oublié ?
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
          <p className="text-xs text-slate-500">
            🔒 Connexion sécurisée avec Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
