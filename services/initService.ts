import { db, LocalUser } from '../db';
import { localAuthService } from './localAuthService';

/**
 * Service d'initialisation de l'application
 * Crée automatiquement les comptes par défaut au premier lancement
 */
export class InitService {
  private INIT_KEY = 'theraflow_initialized';

  /**
   * Comptes par défaut à créer
   */
  private defaultAccounts = [
    {
      email: 'arnaudvb7@gmail.com',
      password: 'Jiskan22',
      name: 'Arnaud VB',
      role: 'PRACTITIONER' as const
    },
    {
      email: 'admin@admin.com',
      password: 'adminadmin',
      name: 'Administrateur',
      role: 'ADMIN' as const
    }
  ];

  /**
   * Vérifier si l'application a déjà été initialisée
   */
  async isInitialized(): Promise<boolean> {
    try {
      // Vérifier si des utilisateurs existent dans la base
      const usersCount = await db.users.count();
      return usersCount > 0;
    } catch (error) {
      console.error('Error checking initialization:', error);
      return false;
    }
  }

  /**
   * Initialiser l'application avec les comptes par défaut
   */
  async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Initialisation de TheraFlow...');

      // Vérifier si déjà initialisé
      if (await this.isInitialized()) {
        console.log('✅ Application déjà initialisée');
        return { success: true, message: 'Application déjà initialisée' };
      }

      let createdCount = 0;
      let errorCount = 0;

      // Créer les comptes par défaut
      for (const account of this.defaultAccounts) {
        console.log(`📝 Création du compte ${account.role}: ${account.email}...`);

        const result = await localAuthService.register(account);

        if (result.success) {
          console.log(`✅ ${account.role}: Compte créé`);
          createdCount++;
        } else {
          console.error(`❌ ${account.role}: ${result.error}`);
          errorCount++;
        }
      }

      if (createdCount > 0) {
        console.log(`🎉 ${createdCount} compte(s) créé(s) avec succès!`);
        return {
          success: true,
          message: `${createdCount} compte(s) créé(s) avec succès`
        };
      } else {
        return {
          success: false,
          message: 'Aucun compte n\'a pu être créé'
        };
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'initialisation'
      };
    }
  }

  /**
   * Réinitialiser l'application (supprime tous les utilisateurs)
   */
  async reset(): Promise<void> {
    try {
      await db.users.clear();
      localStorage.removeItem(this.INIT_KEY);
      console.log('🔄 Application réinitialisée');
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  }

  /**
   * Obtenir les identifiants par défaut pour l'aide
   */
  getDefaultCredentials() {
    return this.defaultAccounts.map(acc => ({
      email: acc.email,
      password: acc.password,
      role: acc.role,
      name: acc.name
    }));
  }
}

export const initService = new InitService();
