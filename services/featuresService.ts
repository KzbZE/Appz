/**
 * Service de gestion des fonctionnalités
 * Gère l'activation/désactivation des features selon l'onboarding
 */

export interface SystemConfig {
  // Clés API Système (Backend Admin only)
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  stripeSecretKeyGlobal?: string;
  paypalClientIdGlobal?: string;
  twilioApiKey?: string;

  // Features système
  features: {
    multiPractitioners: boolean;
    aiAssistant: boolean;
    businessIntelligence: boolean;
    onlinePayments: boolean;
    ocrScanner: boolean;
    voiceNotes: boolean;
    interactiveMap: boolean;
    reminderAutomation: boolean;
    accounting: boolean;
    mediaGallery: boolean;
    marketing: boolean;
    satisfaction: boolean;
    loyalty: boolean;
    goals: boolean;
  };
}

class FeaturesService {
  private SYSTEM_CONFIG_KEY = 'theraflow_system_config';
  private ENABLED_FEATURES_KEY = 'theraflow_enabled_features';

  /**
   * Obtenir la configuration système (Admin only)
   */
  getSystemConfig(): SystemConfig {
    try {
      const configData = localStorage.getItem(this.SYSTEM_CONFIG_KEY);
      if (!configData) {
        return this.getDefaultConfig();
      }
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error loading system config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Sauvegarder la configuration système (Admin only)
   */
  saveSystemConfig(config: SystemConfig): void {
    localStorage.setItem(this.SYSTEM_CONFIG_KEY, JSON.stringify(config));
  }

  /**
   * Configuration par défaut
   */
  private getDefaultConfig(): SystemConfig {
    return {
      features: {
        multiPractitioners: true,
        aiAssistant: true,
        businessIntelligence: true,
        onlinePayments: true,
        ocrScanner: true,
        voiceNotes: true,
        interactiveMap: true,
        reminderAutomation: true,
        accounting: true,
        mediaGallery: true,
        marketing: true,
        satisfaction: true,
        loyalty: true,
        goals: true
      }
    };
  }

  /**
   * Obtenir les fonctionnalités activées pour l'utilisateur courant
   */
  getEnabledFeatures(): string[] {
    try {
      const featuresData = localStorage.getItem(this.ENABLED_FEATURES_KEY);
      if (!featuresData) {
        return this.getDefaultEnabledFeatures();
      }
      return JSON.parse(featuresData);
    } catch (error) {
      console.error('Error loading enabled features:', error);
      return this.getDefaultEnabledFeatures();
    }
  }

  /**
   * Sauvegarder les fonctionnalités activées
   */
  saveEnabledFeatures(features: string[]): void {
    localStorage.setItem(this.ENABLED_FEATURES_KEY, JSON.stringify(features));
  }

  /**
   * Features par défaut (tout activé)
   */
  private getDefaultEnabledFeatures(): string[] {
    return [
      'calendar',
      'patients',
      'invoices',
      'sessions',
      'ocr',
      'voice',
      'ai',
      'stripe',
      'stats',
      'reminders',
      'media',
      'map',
      'marketing',
      'satisfaction',
      'loyalty',
      'goals',
      'multi-practitioners',
      'business-intelligence',
      'ai-assistant'
    ];
  }

  /**
   * Vérifier si une fonctionnalité est activée
   */
  isFeatureEnabled(featureId: string): boolean {
    const enabledFeatures = this.getEnabledFeatures();
    return enabledFeatures.includes(featureId);
  }

  /**
   * Activer/désactiver une fonctionnalité
   */
  toggleFeature(featureId: string, enabled: boolean): void {
    let features = this.getEnabledFeatures();

    if (enabled) {
      if (!features.includes(featureId)) {
        features.push(featureId);
      }
    } else {
      features = features.filter(f => f !== featureId);
    }

    this.saveEnabledFeatures(features);
  }

  /**
   * Activer des features depuis l'onboarding
   */
  activateFeaturesFromOnboarding(selectedFeatures: string[]): void {
    // Mapper les IDs de l'onboarding aux IDs des features
    const featureMapping: Record<string, string> = {
      'calendar': 'calendar',
      'patients': 'patients',
      'invoices': 'invoices',
      'ocr': 'ocr',
      'voice': 'voice',
      'ai': 'ai-assistant',
      'stripe': 'payments',
      'stats': 'business-intelligence'
    };

    const mappedFeatures = selectedFeatures.map(f => featureMapping[f] || f);

    // Toujours activer les features essentielles
    const essentialFeatures = ['calendar', 'patients', 'invoices', 'sessions', 'settings'];

    const allFeatures = [...new Set([...essentialFeatures, ...mappedFeatures])];
    this.saveEnabledFeatures(allFeatures);
  }

  /**
   * Obtenir la clé API système (selon le service)
   */
  getSystemApiKey(service: 'gemini' | 'openai' | 'anthropic' | 'stripe' | 'paypal' | 'twilio'): string | undefined {
    const config = this.getSystemConfig();

    switch (service) {
      case 'gemini': return config.geminiApiKey;
      case 'openai': return config.openaiApiKey;
      case 'anthropic': return config.anthropicApiKey;
      case 'stripe': return config.stripeSecretKeyGlobal;
      case 'paypal': return config.paypalClientIdGlobal;
      case 'twilio': return config.twilioApiKey;
      default: return undefined;
    }
  }

  /**
   * Sauvegarder une clé API système
   */
  setSystemApiKey(service: string, apiKey: string): void {
    const config = this.getSystemConfig();

    switch (service) {
      case 'gemini': config.geminiApiKey = apiKey; break;
      case 'openai': config.openaiApiKey = apiKey; break;
      case 'anthropic': config.anthropicApiKey = apiKey; break;
      case 'stripe': config.stripeSecretKeyGlobal = apiKey; break;
      case 'paypal': config.paypalClientIdGlobal = apiKey; break;
      case 'twilio': config.twilioApiKey = apiKey; break;
    }

    this.saveSystemConfig(config);
  }
}

export const featuresService = new FeaturesService();
