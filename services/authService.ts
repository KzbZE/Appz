import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'practitioner' | 'assistant';
  name?: string;
  createdAt: string;
}

/**
 * Service d'authentification Supabase
 * Gère la connexion, inscription, et gestion des sessions
 */
export class AuthService {
  /**
   * Inscription d'un nouveau praticien
   */
  async signUp(email: string, password: string, metadata?: {
    name?: string;
    role?: 'admin' | 'practitioner' | 'assistant';
  }): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata?.name || '',
          role: metadata?.role || 'practitioner'
        }
      }
    });

    return { user: data.user, error };
  }

  /**
   * Connexion d'un praticien
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { user: data.user, error };
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Récupération de la session courante
   */
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Récupération de l'utilisateur courant
   */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  /**
   * Écoute des changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(email: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  }

  /**
   * Mise à jour du mot de passe
   */
  async updatePassword(newPassword: string): Promise<{ error: any }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(updates: {
    name?: string;
    role?: 'admin' | 'practitioner' | 'assistant';
  }): Promise<{ error: any }> {
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    return { error };
  }

  /**
   * Vérification si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * Vérification du rôle utilisateur
   */
  async hasRole(requiredRole: 'admin' | 'practitioner' | 'assistant'): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const userRole = user.user_metadata?.role || 'practitioner';

    // Hiérarchie: admin > practitioner > assistant
    const roleHierarchy = {
      admin: 3,
      practitioner: 2,
      assistant: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Extraction des métadonnées utilisateur formatées
   */
  async getAuthUser(): Promise<AuthUser | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'practitioner',
      name: user.user_metadata?.name || '',
      createdAt: user.created_at
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
