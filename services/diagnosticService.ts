import { db } from '../db';
import { initService } from './initService';
import { localAuthService } from './localAuthService';

/**
 * Service de diagnostic pour déboguer les problèmes d'authentification
 */
export class DiagnosticService {
  /**
   * Afficher tous les utilisateurs dans la console
   */
  async listAllUsers() {
    try {
      const users = await db.users.toArray();
      console.log('📋 Utilisateurs dans la base de données:');
      console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHashPreview: u.passwordHash.substring(0, 20) + '...',
        createdAt: u.createdAt
      })));
      return users;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  /**
   * Tester le hash d'un mot de passe
   */
  async testPasswordHash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`🔐 Hash de "${password}":`, hash);
    return hash;
  }

  /**
   * Vérifier si un utilisateur existe et si son mot de passe est correct
   */
  async verifyUser(email: string, password: string) {
    try {
      console.log(`\n🔍 Vérification du compte: ${email}`);

      // Chercher l'utilisateur
      const user = await db.users.where('email').equals(email).first();

      if (!user) {
        console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
        return false;
      }

      console.log(`✅ Utilisateur trouvé:`, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      // Calculer le hash du mot de passe fourni
      const inputHash = await this.testPasswordHash(password);

      console.log(`🔑 Hash stocké:`, user.passwordHash);
      console.log(`🔑 Hash fourni:`, inputHash);
      console.log(`🔍 Correspondance:`, inputHash === user.passwordHash ? '✅ OUI' : '❌ NON');

      return inputHash === user.passwordHash;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return false;
    }
  }

  /**
   * Réinitialiser complètement la base de données
   */
  async resetDatabase() {
    try {
      console.log('🔄 Réinitialisation de la base de données...');

      // Supprimer tous les utilisateurs
      await db.users.clear();
      console.log('✅ Tous les utilisateurs supprimés');

      // Vider la session
      localStorage.removeItem('theraflow_local_session');
      console.log('✅ Session effacée');

      // Recréer les comptes par défaut
      console.log('🚀 Recréation des comptes par défaut...');
      const result = await initService.initialize();
      console.log(result.message);

      // Vérifier les comptes créés
      await this.listAllUsers();

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      return false;
    }
  }

  /**
   * Tester la connexion avec les identifiants par défaut
   */
  async testDefaultLogins() {
    console.log('\n🧪 Test des identifiants par défaut...\n');

    const credentials = [
      { email: 'arnaudvb7@gmail.com', password: 'Jiskan22', role: 'PRACTITIONER' },
      { email: 'admin@admin.com', password: 'adminadmin', role: 'ADMIN' }
    ];

    for (const cred of credentials) {
      console.log(`\n--- Test ${cred.role} ---`);
      const isValid = await this.verifyUser(cred.email, cred.password);

      if (isValid) {
        console.log(`✅ ${cred.role}: Login fonctionne`);
      } else {
        console.log(`❌ ${cred.role}: Login ne fonctionne PAS`);
      }
    }
  }

  /**
   * Créer manuellement un compte avec hash explicite
   */
  async createAccountManually(email: string, password: string, name: string, role: 'ADMIN' | 'PRACTITIONER' | 'PATIENT') {
    try {
      console.log(`\n📝 Création manuelle du compte: ${email}`);

      // Vérifier si le compte existe déjà
      const existing = await db.users.where('email').equals(email).first();
      if (existing) {
        console.log(`⚠️  Le compte existe déjà, suppression...`);
        await db.users.delete(existing.id!);
      }

      // Hasher le mot de passe
      const passwordHash = await this.testPasswordHash(password);

      // Créer le compte
      const userId = await db.users.add({
        email,
        passwordHash,
        name,
        role,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Compte créé avec ID: ${userId}`);

      // Vérifier immédiatement
      const verification = await this.verifyUser(email, password);
      console.log(`🔍 Vérification post-création: ${verification ? '✅ OK' : '❌ ÉCHEC'}`);

      return userId;
    } catch (error) {
      console.error('❌ Erreur lors de la création manuelle:', error);
      return null;
    }
  }

  /**
   * Diagnostic complet
   */
  async runFullDiagnostic() {
    console.log('🏥 === DIAGNOSTIC COMPLET ===\n');

    // 1. Lister les utilisateurs
    console.log('1️⃣ Utilisateurs actuels:');
    const users = await this.listAllUsers();

    // 2. Tester les hashs
    console.log('\n2️⃣ Test des hashs de mots de passe:');
    await this.testPasswordHash('Jiskan22');
    await this.testPasswordHash('adminadmin');

    // 3. Tester les connexions
    console.log('\n3️⃣ Test des connexions:');
    await this.testDefaultLogins();

    console.log('\n✅ Diagnostic terminé\n');

    return {
      usersCount: users.length,
      users: users
    };
  }
}

export const diagnosticService = new DiagnosticService();

// Exposer globalement pour accès depuis la console
if (typeof window !== 'undefined') {
  (window as any).diagnostic = diagnosticService;
  console.log('💡 Service de diagnostic disponible dans la console via: window.diagnostic');
}
