import { EncryptionService } from './securityService';

/**
 * Service SMS pour envoi de codes de vérification
 * Mock pour développement - À remplacer par Twilio/AWS SNS en production
 */

export interface SMSVerificationCode {
  id?: number;
  phone: string;
  code: string;
  expiresAt: string;
  attempts: number;
  verified: boolean;
  createdAt: string;
}

class SMSService {
  private static VERIFICATION_CODE_LENGTH = 6;
  private static CODE_EXPIRY_MINUTES = 10;
  private static MAX_ATTEMPTS = 3;

  /**
   * Envoyer un code de vérification par SMS
   * MOCK: En développement, affiche le code dans la console
   * PRODUCTION: Remplacer par appel API Twilio/AWS SNS
   */
  static async sendVerificationCode(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
    try {
      // Générer un code à 6 chiffres
      const code = EncryptionService.generatePIN(this.VERIFICATION_CODE_LENGTH);

      // Calculer l'expiration
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // ⚠️ MODE DÉVELOPPEMENT: Afficher le code dans la console
      // En production, remplacer par l'envoi SMS réel
      console.log(`📱 [SMS MOCK] Code envoyé au ${phone}: ${code}`);
      console.log(`⏰ Expire dans ${this.CODE_EXPIRY_MINUTES} minutes`);

      // PRODUCTION: Décommenter et configurer
      /*
      const twilioClient = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await twilioClient.messages.create({
        body: `Votre code de vérification TheraFlow: ${code}. Valide ${this.CODE_EXPIRY_MINUTES}min.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      */

      // Stocker le code (en dev, on le retourne aussi)
      const verificationData: SMSVerificationCode = {
        phone,
        code,
        expiresAt,
        attempts: 0,
        verified: false,
        createdAt: new Date().toISOString()
      };

      // Sauvegarder dans localStorage pour la démo
      // En production, sauvegarder en base de données ou Redis
      const existingCodes = this.getStoredCodes();
      const updatedCodes = [...existingCodes.filter(c => c.phone !== phone), verificationData];
      localStorage.setItem('sms_verification_codes', JSON.stringify(updatedCodes));

      return {
        success: true,
        message: `Code envoyé au ${this.maskPhone(phone)}`,
        code: process.env.NODE_ENV === 'development' ? code : undefined // Retourner le code en dev uniquement
      };
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi du SMS. Réessayez.'
      };
    }
  }

  /**
   * Vérifier un code SMS
   */
  static verifyCode(phone: string, code: string): { success: boolean; message: string } {
    const storedCodes = this.getStoredCodes();
    const verificationRecord = storedCodes.find(c => c.phone === phone && !c.verified);

    if (!verificationRecord) {
      return {
        success: false,
        message: 'Aucun code trouvé pour ce numéro. Demandez un nouveau code.'
      };
    }

    // Vérifier l'expiration
    if (new Date(verificationRecord.expiresAt) < new Date()) {
      return {
        success: false,
        message: 'Code expiré. Demandez un nouveau code.'
      };
    }

    // Vérifier le nombre de tentatives
    if (verificationRecord.attempts >= this.MAX_ATTEMPTS) {
      return {
        success: false,
        message: 'Trop de tentatives. Demandez un nouveau code.'
      };
    }

    // Vérifier le code
    if (verificationRecord.code !== code) {
      // Incrémenter les tentatives
      verificationRecord.attempts++;
      this.updateStoredCode(verificationRecord);

      return {
        success: false,
        message: `Code incorrect. ${this.MAX_ATTEMPTS - verificationRecord.attempts} tentative(s) restante(s).`
      };
    }

    // ✅ Code valide
    verificationRecord.verified = true;
    this.updateStoredCode(verificationRecord);

    console.log(`✅ Code vérifié avec succès pour ${phone}`);

    return {
      success: true,
      message: 'Téléphone vérifié avec succès'
    };
  }

  /**
   * Vérifier si un numéro a été vérifié récemment
   */
  static isPhoneVerified(phone: string): boolean {
    const storedCodes = this.getStoredCodes();
    const recentVerification = storedCodes.find(
      c => c.phone === phone &&
           c.verified &&
           new Date(c.expiresAt) > new Date()
    );
    return !!recentVerification;
  }

  /**
   * Nettoyer les codes expirés
   */
  static cleanupExpiredCodes(): void {
    const storedCodes = this.getStoredCodes();
    const validCodes = storedCodes.filter(c => new Date(c.expiresAt) > new Date());
    localStorage.setItem('sms_verification_codes', JSON.stringify(validCodes));
  }

  /**
   * Masquer le numéro de téléphone (pour affichage)
   */
  private static maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
  }

  /**
   * Récupérer les codes stockés
   */
  private static getStoredCodes(): SMSVerificationCode[] {
    try {
      const stored = localStorage.getItem('sms_verification_codes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Mettre à jour un code stocké
   */
  private static updateStoredCode(updatedCode: SMSVerificationCode): void {
    const storedCodes = this.getStoredCodes();
    const updatedCodes = storedCodes.map(c =>
      c.phone === updatedCode.phone && c.code === updatedCode.code ? updatedCode : c
    );
    localStorage.setItem('sms_verification_codes', JSON.stringify(updatedCodes));
  }
}

/**
 * Hook pour intégration Twilio en production
 *
 * Installation:
 * npm install twilio
 *
 * Configuration (.env):
 * TWILIO_ACCOUNT_SID=your_account_sid
 * TWILIO_AUTH_TOKEN=your_auth_token
 * TWILIO_PHONE_NUMBER=+33XXXXXXXXX
 *
 * Utilisation:
 * const twilio = require('twilio');
 * const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *
 * await client.messages.create({
 *   body: 'Votre code: 123456',
 *   from: process.env.TWILIO_PHONE_NUMBER,
 *   to: '+33612345678'
 * });
 */

export default SMSService;
