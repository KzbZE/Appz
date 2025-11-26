/**
 * Service d'authentification LOCAL (localStorage)
 * Gère les rôles: ADMIN (backend), PRACTITIONER (praticien), PATIENT
 * Sans dépendances externes (Supabase, Firebase, etc.)
 */

export type UserRole = 'ADMIN' | 'PRACTITIONER' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  practitionerId?: string; // Pour lier un patient à un praticien
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private SESSION_KEY = 'theraflow_auth_session';
  private USERS_KEY = 'theraflow_users';
  private PASSWORDS_KEY = 'theraflow_passwords'; // Hash des mots de passe

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const users = this.getAllUsers();
      const passwords = this.getPasswords();

      // Trouver l'utilisateur
      const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

      if (!user) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Vérifier le mot de passe
      const storedPassword = passwords[user.id];
      if (storedPassword !== this.hashPassword(credentials.password)) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Créer la session
      const session: AuthSession = {
        user: {
          ...user,
          lastLogin: new Date().toISOString()
        },
        token: this.generateToken(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      // Mettre à jour lastLogin
      this.updateUserLastLogin(user.id);

      return { success: true, user: session.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Obtenir la session courante
   */
  getCurrentSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: AuthSession = JSON.parse(sessionData);

      // Vérifier l'expiration
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Vérifier si connecté
   */
  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  /**
   * Vérifier le rôle
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Vérifier si admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Vérifier si praticien
   */
  isPractitioner(): boolean {
    return this.hasRole('PRACTITIONER');
  }

  /**
   * Vérifier si patient
   */
  isPatient(): boolean {
    return this.hasRole('PATIENT');
  }

  /**
   * Créer un utilisateur (inscription)
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    practitionerId?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const users = this.getAllUsers();

      // Vérifier si l'email existe déjà
      if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return { success: false, error: 'Cet email est déjà utilisé' };
      }

      // Créer le nouvel utilisateur
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        practitionerId: userData.practitionerId,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);

      // Sauvegarder le mot de passe (hashé)
      const passwords = this.getPasswords();
      passwords[newUser.id] = this.hashPassword(userData.password);
      this.savePasswords(passwords);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  }

  /**
   * Initialiser un utilisateur admin par défaut
   */
  initializeDefaultAdmin(): void {
    const users = this.getAllUsers();

    if (!users.find(u => u.role === 'ADMIN')) {
      const defaultAdmin: User = {
        id: 'admin_default',
        email: 'admin@theraflow.local',
        name: 'Administrateur',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      };

      users.push(defaultAdmin);
      this.saveUsers(users);

      // Mot de passe par défaut: admin123
      const passwords = this.getPasswords();
      passwords[defaultAdmin.id] = this.hashPassword('admin123');
      this.savePasswords(passwords);

      console.log('✅ Admin par défaut créé: admin@theraflow.local / admin123');
    }
  }

  /**
   * Créer un compte praticien depuis l'onboarding
   */
  async createPractitionerFromOnboarding(data: {
    name: string;
    email: string;
    phone: string;
  }): Promise<{ success: boolean; user?: User }> {
    // Générer un email temporaire si non fourni
    const email = data.email || `praticien${Date.now()}@theraflow.local`;

    const result = await this.register({
      email,
      password: 'theraflow2024', // Mot de passe par défaut
      name: data.name,
      role: 'PRACTITIONER'
    });

    if (result.success && result.user) {
      // Auto-login après création
      await this.login({
        email,
        password: 'theraflow2024'
      });
    }

    return result;
  }

  /**
   * Obtenir tous les utilisateurs
   */
  private getAllUsers(): User[] {
    try {
      const usersData = localStorage.getItem(this.USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Sauvegarder les utilisateurs
   */
  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  /**
   * Obtenir les mots de passe
   */
  private getPasswords(): Record<string, string> {
    try {
      const passwordsData = localStorage.getItem(this.PASSWORDS_KEY);
      return passwordsData ? JSON.parse(passwordsData) : {};
    } catch (error) {
      console.error('Error getting passwords:', error);
      return {};
    }
  }

  /**
   * Sauvegarder les mots de passe
   */
  private savePasswords(passwords: Record<string, string>): void {
    localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));
  }

  /**
   * Hash simple d'un mot de passe (à remplacer par bcrypt en production)
   */
  private hashPassword(password: string): string {
    // Simple hash pour le prototype (utiliser bcrypt en production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Mettre à jour le lastLogin
   */
  private updateUserLastLogin(userId: string): void {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      this.saveUsers(users);
    }
  }

  /**
   * Générer un token aléatoire
   */
  private generateToken(): string {
    return `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Obtenir tous les utilisateurs (admin only)
   */
  getAllUsersForAdmin(): User[] {
    if (!this.isAdmin()) {
      throw new Error('Accès non autorisé');
    }
    return this.getAllUsers();
  }

  /**
   * Supprimer un utilisateur (admin only)
   */
  deleteUser(userId: string): boolean {
    if (!this.isAdmin()) {
      throw new Error('Accès non autorisé');
    }

    const users = this.getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);

    if (filteredUsers.length < users.length) {
      this.saveUsers(filteredUsers);

      // Supprimer aussi le mot de passe
      const passwords = this.getPasswords();
      delete passwords[userId];
      this.savePasswords(passwords);

      return true;
    }

    return false;
  }

  /**
   * Changer de rôle (pour testing / démo)
   */
  switchRole(newRole: UserRole): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.user.role = newRole;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    // Recharger la page pour appliquer les changements
    window.location.reload();
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    const passwords = this.getPasswords();
    const storedPassword = passwords[user.id];

    // Vérifier l'ancien mot de passe
    if (storedPassword !== this.hashPassword(oldPassword)) {
      return { success: false, error: 'Ancien mot de passe incorrect' };
    }

    // Mettre à jour le mot de passe
    passwords[user.id] = this.hashPassword(newPassword);
    this.savePasswords(passwords);

    return { success: true };
  }
}

export const authService = new AuthService();

// Initialiser l'admin par défaut au chargement
authService.initializeDefaultAdmin();
