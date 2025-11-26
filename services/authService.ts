import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { localAuthService } from './localAuthService';

export type UserRole = 'ADMIN' | 'PRACTITIONER' | 'PATIENT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  practitionerId?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Service d'authentification hybride
 * Utilise Supabase si configuré, sinon utilise IndexedDB local
 */
export class AuthService {
  /**
   * Inscription d'un nouveau utilisateur
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    practitionerId?: string;
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    // Utiliser le stockage local si Supabase n'est pas configuré
    if (!isSupabaseConfigured()) {
      return await localAuthService.register(userData);
    }

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          practitionerId: userData.practitionerId,
          createdAt: new Date().toISOString()
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: userData.role,
          name: userData.name,
          practitionerId: userData.practitionerId,
          createdAt: data.user.created_at
        }
      };
    }

    return { success: false, error: 'Erreur lors de l\'inscription' };
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    // Utiliser le stockage local si Supabase n'est pas configuré
    if (!isSupabaseConfigured()) {
      return await localAuthService.login(credentials);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    if (data.user) {
      const authUser = await this.getAuthUser();
      return { success: true, user: authUser || undefined };
    }

    return { success: false, error: 'Erreur lors de la connexion' };
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.logout();
    }
    await supabase.auth.signOut();
  }

  /**
   * Récupération de la session courante
   */
  async getCurrentSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.getCurrentSession();
    }
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Récupération de l'utilisateur Supabase courant
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.getCurrentUser();
    }
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  /**
   * Extraction des métadonnées utilisateur formatées
   */
  async getAuthUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.getAuthUser();
    }

    const user = await this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'PRACTITIONER',
      name: user.user_metadata?.name || '',
      practitionerId: user.user_metadata?.practitionerId,
      avatarUrl: user.user_metadata?.avatarUrl,
      createdAt: user.created_at,
      lastLogin: user.user_metadata?.lastLogin
    };
  }

  /**
   * Vérifier si connecté
   */
  async isAuthenticated(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.isAuthenticated();
    }
    const session = await this.getCurrentSession();
    return !!session;
  }

  /**
   * Vérifier le rôle
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getAuthUser();
    return user?.role === role;
  }

  /**
   * Vérifier si admin
   */
  async isAdmin(): Promise<boolean> {
    return await this.hasRole('ADMIN');
  }

  /**
   * Vérifier si praticien
   */
  async isPractitioner(): Promise<boolean> {
    return await this.hasRole('PRACTITIONER');
  }

  /**
   * Vérifier si patient
   */
  async isPatient(): Promise<boolean> {
    return await this.hasRole('PATIENT');
  }

  /**
   * Créer un compte praticien depuis l'onboarding
   */
  async createPractitionerFromOnboarding(data: {
    name: string;
    email: string;
    phone: string;
  }): Promise<{ success: boolean; user?: AuthUser }> {
    // Générer un mot de passe temporaire
    const tempPassword = `TF${Math.random().toString(36).substr(2, 8)}!`;

    const result = await this.register({
      email: data.email || `praticien${Date.now()}@theraflow.local`,
      password: tempPassword,
      name: data.name,
      role: 'PRACTITIONER'
    });

    if (result.success && result.user) {
      // Auto-login après création
      await this.login({
        email: result.user.email,
        password: tempPassword
      });
    }

    return result;
  }

  /**
   * Écoute des changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser = await this.getAuthUser();
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error: error?.message };
  }

  /**
   * Mise à jour du mot de passe
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    // Vérifier l'ancien mot de passe en tentant une reconnexion
    const user = await this.getCurrentUser();
    if (!user?.email) {
      return { success: false, error: 'Non authentifié' };
    }

    // Tenter de se reconnecter avec l'ancien mot de passe
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });

    if (loginError) {
      return { success: false, error: 'Ancien mot de passe incorrect' };
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(updates: {
    name?: string;
    role?: UserRole;
    avatarUrl?: string;
  }): Promise<{ error?: string }> {
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    return { error: error?.message };
  }

  /**
   * Obtenir tous les utilisateurs (admin only)
   */
  async getAllUsersForAdmin(): Promise<AuthUser[]> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.getAllUsersForAdmin();
    }
    // TODO: Implémenter avec une table profiles Supabase
    console.warn('getAllUsersForAdmin: Nécessite une table profiles dans Supabase');
    return [];
  }

  /**
   * Supprimer un utilisateur (admin only)
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return await localAuthService.deleteUser(userId);
    }
    // TODO: Implémenter avec une fonction edge Supabase
    console.warn('deleteUser: Nécessite une fonction edge Supabase');
    return false;
  }

  /**
   * Changer de rôle (pour testing / démo uniquement)
   */
  async switchRole(newRole: UserRole): Promise<void> {
    await this.updateProfile({ role: newRole });
    window.location.reload();
  }

  /**
   * Initialiser un admin par défaut (pour développement uniquement)
   */
  async initializeDefaultAdmin(): Promise<void> {
    // En production, créer l'admin via Supabase Dashboard ou SQL
    console.info('Pour créer un admin, utilisez le Supabase Dashboard');
  }
}

// Export singleton instance
export const authService = new AuthService();
