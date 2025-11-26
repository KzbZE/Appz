import { db, LocalUser } from '../db';

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
 * Service d'authentification local (IndexedDB)
 * Alternative à Supabase pour fonctionner sans configuration cloud
 */
export class LocalAuthService {
  private currentUser: AuthUser | null = null;
  private SESSION_KEY = 'theraflow_local_session';

  /**
   * Hash simple d'un mot de passe (pour démo - utiliser bcrypt en production)
   */
  private async hashPassword(password: string): Promise<string> {
    // Simple hash pour démo - en production utiliser bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Vérifier un mot de passe
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

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
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.users.where('email').equals(userData.email).first();
      if (existingUser) {
        return { success: false, error: 'Un compte avec cet email existe déjà' };
      }

      // Hasher le mot de passe
      const passwordHash = await this.hashPassword(userData.password);

      // Créer l'utilisateur
      const localUser: LocalUser = {
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
        practitionerId: userData.practitionerId,
        createdAt: new Date().toISOString()
      };

      const userId = await db.users.add(localUser);

      const authUser: AuthUser = {
        id: userId.toString(),
        email: localUser.email,
        role: localUser.role,
        name: localUser.name,
        practitionerId: localUser.practitionerId,
        createdAt: localUser.createdAt
      };

      return { success: true, user: authUser };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de l\'inscription' };
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Chercher l'utilisateur par email
      const localUser = await db.users.where('email').equals(credentials.email).first();

      if (!localUser) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Vérifier le mot de passe
      const isValid = await this.verifyPassword(credentials.password, localUser.passwordHash);

      if (!isValid) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Mettre à jour la date de dernière connexion
      await db.users.update(localUser.id!, { lastLogin: new Date().toISOString() });

      // Créer l'utilisateur authentifié
      const authUser: AuthUser = {
        id: localUser.id!.toString(),
        email: localUser.email,
        role: localUser.role,
        name: localUser.name,
        practitionerId: localUser.practitionerId,
        avatarUrl: localUser.avatarUrl,
        createdAt: localUser.createdAt,
        lastLogin: new Date().toISOString()
      };

      // Sauvegarder la session
      this.currentUser = authUser;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(authUser));

      return { success: true, user: authUser };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de la connexion' };
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Récupération de la session courante
   */
  async getCurrentSession(): Promise<any> {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  /**
   * Récupération de l'utilisateur courant
   */
  async getCurrentUser(): Promise<any> {
    if (this.currentUser) return this.currentUser;

    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      this.currentUser = JSON.parse(sessionData);
      return this.currentUser;
    }

    return null;
  }

  /**
   * Extraction des métadonnées utilisateur formatées
   */
  async getAuthUser(): Promise<AuthUser | null> {
    return await this.getCurrentUser();
  }

  /**
   * Vérifier si connecté
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
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
    // Simuler l'écoute - en vrai on utiliserait un EventEmitter ou Observable
    const checkAuth = async () => {
      const user = await this.getAuthUser();
      callback(user);
    };

    checkAuth();

    // Retourner une fonction de cleanup
    return {
      data: { subscription: { unsubscribe: () => {} } }
    };
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(updates: {
    name?: string;
    role?: UserRole;
    avatarUrl?: string;
  }): Promise<{ error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: 'Non authentifié' };
      }

      const userId = parseInt(user.id);
      await db.users.update(userId, updates);

      // Mettre à jour la session
      const updatedUser = await db.users.get(userId);
      if (updatedUser) {
        const authUser: AuthUser = {
          id: updatedUser.id!.toString(),
          email: updatedUser.email,
          role: updatedUser.role,
          name: updatedUser.name,
          practitionerId: updatedUser.practitionerId,
          avatarUrl: updatedUser.avatarUrl,
          createdAt: updatedUser.createdAt,
          lastLogin: updatedUser.lastLogin
        };
        this.currentUser = authUser;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(authUser));
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Obtenir tous les utilisateurs (admin only)
   */
  async getAllUsersForAdmin(): Promise<AuthUser[]> {
    try {
      const localUsers = await db.users.toArray();
      return localUsers.map(u => ({
        id: u.id!.toString(),
        email: u.email,
        role: u.role,
        name: u.name,
        practitionerId: u.practitionerId,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Supprimer un utilisateur (admin only)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.users.delete(parseInt(userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Changer de rôle (pour testing / démo uniquement)
   */
  async switchRole(newRole: UserRole): Promise<void> {
    await this.updateProfile({ role: newRole });
    window.location.reload();
  }
}

// Export singleton instance
export const localAuthService = new LocalAuthService();
