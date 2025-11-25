/**
 * Service de chiffrement et sécurisation des données
 * Utilise Web Crypto API (standard navigateur moderne)
 * Chiffrement AES-GCM 256 bits
 */

export class EncryptionService {
  private static ALGORITHM = 'AES-GCM';
  private static KEY_LENGTH = 256;
  private static IV_LENGTH = 12; // 96 bits recommandé pour GCM

  /**
   * Génère une clé de chiffrement dérivée d'un mot de passe
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Importer le password comme clé
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Dériver une clé AES-GCM forte
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // OWASP recommande 100k+
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Chiffre des données sensibles
   */
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Générer salt et IV aléatoires
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Dériver la clé
      const key = await this.deriveKey(password, salt);

      // Chiffrer
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combiner salt + iv + encrypted data
      const encrypted = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(encrypted, salt.length + iv.length);

      // Encoder en base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Déchiffre des données
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Décoder base64
      const combined = this.base64ToArrayBuffer(encryptedData);

      // Extraire salt, iv, et encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 16 + this.IV_LENGTH);
      const encrypted = combined.slice(16 + this.IV_LENGTH);

      // Dériver la clé
      const key = await this.deriveKey(password, salt);

      // Déchiffrer
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      );

      // Décoder
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - wrong password or corrupted data');
    }
  }

  /**
   * Hash sécurisé (pour mots de passe)
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Vérifie un mot de passe hashé
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Génère un token aléatoire sécurisé
   */
  static generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array).substring(0, length);
  }

  /**
   * Génère un code PIN numérique
   */
  static generatePIN(digits: number = 6): string {
    const max = Math.pow(10, digits);
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % max).toString().padStart(digits, '0');
  }

  /**
   * Utilitaires conversion
   */
  private static arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Protection contre les fuites de données
 */
export class DataProtectionService {
  /**
   * Nettoie les données sensibles avant logs
   */
  static sanitizeForLogs(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'passwordHash',
      'email',
      'phone',
      'address',
      'ssn',
      'creditCard',
      'cvv',
      'apiKey',
      'token',
      'secret'
    ];

    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const sanitized: any = {};
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitize(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
      return sanitized;
    };

    return sanitize(data);
  }

  /**
   * Masque les données sensibles pour affichage
   */
  static maskSensitiveData(value: string, type: 'email' | 'phone' | 'card'): string {
    if (!value) return '';

    switch (type) {
      case 'email':
        const [local, domain] = value.split('@');
        if (!domain) return value;
        const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
        return `${maskedLocal}@${domain}`;

      case 'phone':
        if (value.length < 4) return '***';
        return '***' + value.slice(-4);

      case 'card':
        if (value.length < 4) return '***';
        return '**** **** **** ' + value.slice(-4);

      default:
        return '***';
    }
  }

  /**
   * Valide la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Longueur
    if (password.length < 8) {
      feedback.push('Au moins 8 caractères requis');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Majuscules
    if (!/[A-Z]/.test(password)) {
      feedback.push('Ajouter au moins une majuscule');
    } else {
      score += 1;
    }

    // Minuscules
    if (!/[a-z]/.test(password)) {
      feedback.push('Ajouter au moins une minuscule');
    } else {
      score += 1;
    }

    // Chiffres
    if (!/[0-9]/.test(password)) {
      feedback.push('Ajouter au moins un chiffre');
    } else {
      score += 1;
    }

    // Caractères spéciaux
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      feedback.push('Ajouter au moins un caractère spécial (!@#$...)');
    } else {
      score += 2;
    }

    // Mots de passe courants
    const commonPasswords = ['password', '123456', 'azerty', 'qwerty', 'admin'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      feedback.push('Évitez les mots de passe courants');
      score = Math.max(0, score - 3);
    }

    return {
      isValid: score >= 4 && password.length >= 8,
      score: Math.min(7, score),
      feedback
    };
  }

  /**
   * Détection de patterns suspects (tentative injection)
   */
  static detectSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i, // onclick=, onload=, etc.
      /\.\.\//,  // Directory traversal
      /union.*select/i, // SQL injection
      /;.*drop.*table/i,
      /exec\(/i,
      /eval\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input pour prévenir XSS
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

/**
 * Service de gestion des sessions sécurisées
 */
export class SessionService {
  private static SESSION_KEY = 'theraflow_session';
  private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static createSession(userId: string | number, role: 'practitioner' | 'patient'): void {
    const session = {
      userId,
      role,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      token: EncryptionService.generateToken()
    };

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  static getSession(): { userId: string | number; role: string; token: string } | null {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);

      // Vérifier timeout
      if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
        this.destroySession();
        return null;
      }

      // Mettre à jour lastActivity
      session.lastActivity = Date.now();
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return session;
    } catch {
      return null;
    }
  }

  static destroySession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  static isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  static getRole(): 'practitioner' | 'patient' | null {
    const session = this.getSession();
    return session?.role as 'practitioner' | 'patient' | null;
  }
}

export default EncryptionService;
