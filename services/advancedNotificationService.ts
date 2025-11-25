/**
 * Service de notifications intelligentes multi-canal
 * Push, Email, SMS, WhatsApp/Telegram
 */

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'TELEGRAM';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationRecipientType = 'PRACTITIONER' | 'PATIENT';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationEventType;
  subject: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  recipientType: NotificationRecipientType;
  variables: string[]; // Variables dynamiques ex: {{patientName}}, {{date}}
}

export type NotificationEventType =
  // Praticien
  | 'NEW_BOOKING'
  | 'PATIENT_CANCELLATION'
  | 'INVOICE_PAID'
  | 'PATIENT_BIRTHDAY'
  | 'FREE_SLOTS_TOMORROW'
  | 'NEW_MESSAGE_FROM_PATIENT'
  | 'PAYMENT_RECEIVED'
  | 'LOW_STOCK_ALERT'
  // Patient
  | 'APPOINTMENT_REMINDER_D_MINUS_1'
  | 'APPOINTMENT_REMINDER_H_MINUS_2'
  | 'REPORT_AVAILABLE'
  | 'SATISFACTION_SURVEY'
  | 'PROMOTION_AVAILABLE'
  | 'BIRTHDAY_WISHES'
  | 'NEW_MESSAGE_FROM_PRACTITIONER'
  | 'INVOICE_READY'
  | 'PAYMENT_LINK_SENT';

export interface Notification {
  id?: number;
  recipientId: number; // patientId ou practitionerId
  recipientType: NotificationRecipientType;
  recipientEmail?: string;
  recipientPhone?: string;
  type: NotificationEventType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  subject: string;
  message: string;
  data?: Record<string, any>; // Données additionnelles
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sentAt?: string;
  readAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: number;
  userType: NotificationRecipientType;
  // Canaux préférés par type de notification
  channelPreferences: Record<NotificationEventType, NotificationChannel[]>;
  // Plages horaires préférées
  preferredTimeStart: string; // Format HH:mm
  preferredTimeEnd: string; // Format HH:mm
  // Fréquence maximale (notifications par jour)
  maxNotificationsPerDay: number;
  // Types de notifications désactivées
  disabledTypes: NotificationEventType[];
  // Quiet hours (ne pas déranger)
  quietHoursEnabled: boolean;
  quietHoursStart: string; // Format HH:mm
  quietHoursEnd: string; // Format HH:mm
}

class AdvancedNotificationService {
  /**
   * Templates de notifications par défaut
   */
  static getDefaultTemplates(): NotificationTemplate[] {
    return [
      // PRATICIEN
      {
        id: 'NEW_BOOKING',
        name: 'Nouveau rendez-vous',
        type: 'NEW_BOOKING',
        subject: '📅 Nouveau RDV: {{patientName}}',
        message: '{{patientName}} a réservé un rendez-vous le {{date}} à {{time}}.',
        channels: ['PUSH', 'EMAIL'],
        priority: 'HIGH',
        recipientType: 'PRACTITIONER',
        variables: ['patientName', 'date', 'time']
      },
      {
        id: 'PATIENT_CANCELLATION',
        name: 'Annulation patient',
        type: 'PATIENT_CANCELLATION',
        subject: '❌ Annulation: {{patientName}}',
        message: '{{patientName}} a annulé son rendez-vous du {{date}} à {{time}}.',
        channels: ['PUSH', 'SMS'],
        priority: 'HIGH',
        recipientType: 'PRACTITIONER',
        variables: ['patientName', 'date', 'time']
      },
      {
        id: 'INVOICE_PAID',
        name: 'Facture payée',
        type: 'INVOICE_PAID',
        subject: '💰 Paiement reçu: {{amount}}€',
        message: '{{patientName}} a payé la facture {{invoiceNumber}} de {{amount}}€.',
        channels: ['PUSH', 'EMAIL'],
        priority: 'NORMAL',
        recipientType: 'PRACTITIONER',
        variables: ['patientName', 'invoiceNumber', 'amount']
      },
      {
        id: 'PATIENT_BIRTHDAY',
        name: 'Anniversaire patient',
        type: 'PATIENT_BIRTHDAY',
        subject: '🎂 Anniversaire: {{patientName}}',
        message: 'C\'est l\'anniversaire de {{patientName}} aujourd\'hui ! Envoyez-lui un message.',
        channels: ['PUSH'],
        priority: 'LOW',
        recipientType: 'PRACTITIONER',
        variables: ['patientName']
      },
      {
        id: 'FREE_SLOTS_TOMORROW',
        name: 'Créneaux libres demain',
        type: 'FREE_SLOTS_TOMORROW',
        subject: '📆 {{count}} créneaux disponibles demain',
        message: 'Vous avez {{count}} créneaux libres demain. Pensez à les remplir !',
        channels: ['PUSH'],
        priority: 'LOW',
        recipientType: 'PRACTITIONER',
        variables: ['count']
      },

      // PATIENT
      {
        id: 'APPOINTMENT_REMINDER_D_MINUS_1',
        name: 'Rappel RDV J-1',
        type: 'APPOINTMENT_REMINDER_D_MINUS_1',
        subject: '📅 RDV demain avec votre praticien',
        message: 'Bonjour {{patientName}}, rappel de votre rendez-vous demain à {{time}}. À bientôt !',
        channels: ['EMAIL', 'SMS', 'PUSH'],
        priority: 'HIGH',
        recipientType: 'PATIENT',
        variables: ['patientName', 'date', 'time']
      },
      {
        id: 'APPOINTMENT_REMINDER_H_MINUS_2',
        name: 'Rappel RDV H-2',
        type: 'APPOINTMENT_REMINDER_H_MINUS_2',
        subject: '⏰ RDV dans 2 heures',
        message: 'Votre rendez-vous est dans 2 heures. À tout à l\'heure !',
        channels: ['SMS', 'PUSH'],
        priority: 'URGENT',
        recipientType: 'PATIENT',
        variables: ['time']
      },
      {
        id: 'REPORT_AVAILABLE',
        name: 'Compte-rendu disponible',
        type: 'REPORT_AVAILABLE',
        subject: '📄 Votre compte-rendu est prêt',
        message: 'Bonjour {{patientName}}, le compte-rendu de votre séance du {{date}} est disponible dans votre espace patient.',
        channels: ['EMAIL', 'PUSH'],
        priority: 'NORMAL',
        recipientType: 'PATIENT',
        variables: ['patientName', 'date']
      },
      {
        id: 'SATISFACTION_SURVEY',
        name: 'Enquête satisfaction',
        type: 'SATISFACTION_SURVEY',
        subject: '⭐ Votre avis compte !',
        message: 'Bonjour {{patientName}}, merci de prendre 2 minutes pour évaluer votre séance.',
        channels: ['EMAIL', 'PUSH'],
        priority: 'LOW',
        recipientType: 'PATIENT',
        variables: ['patientName']
      },
      {
        id: 'BIRTHDAY_WISHES',
        name: 'Anniversaire patient',
        type: 'BIRTHDAY_WISHES',
        subject: '🎉 Joyeux anniversaire {{patientName}} !',
        message: 'Toute l\'équipe vous souhaite un excellent anniversaire ! 🎂',
        channels: ['EMAIL', 'SMS'],
        priority: 'LOW',
        recipientType: 'PATIENT',
        variables: ['patientName']
      },
      {
        id: 'PAYMENT_LINK_SENT',
        name: 'Lien de paiement',
        type: 'PAYMENT_LINK_SENT',
        subject: '💳 Facture {{invoiceNumber}} à régler',
        message: 'Bonjour {{patientName}}, votre facture de {{amount}}€ est prête au paiement. Cliquez ici: {{paymentLink}}',
        channels: ['EMAIL', 'SMS'],
        priority: 'HIGH',
        recipientType: 'PATIENT',
        variables: ['patientName', 'invoiceNumber', 'amount', 'paymentLink']
      }
    ];
  }

  /**
   * Envoyer une notification
   */
  static async sendNotification(notification: Notification): Promise<boolean> {
    try {
      // Vérifier les préférences
      const preferences = await this.getPreferences(notification.recipientId, notification.recipientType);

      // Vérifier si le type est désactivé
      if (preferences.disabledTypes.includes(notification.type)) {
        console.log(`⚠️ Notification ${notification.type} désactivée pour l'utilisateur ${notification.recipientId}`);
        return false;
      }

      // Vérifier quiet hours
      if (this.isQuietHours(preferences)) {
        console.log(`🔕 Quiet hours actives, notification reportée`);
        return false;
      }

      // Vérifier limite quotidienne
      const todayCount = await this.getTodayNotificationCount(notification.recipientId);
      if (todayCount >= preferences.maxNotificationsPerDay) {
        console.log(`⚠️ Limite quotidienne atteinte (${preferences.maxNotificationsPerDay})`);
        return false;
      }

      // Envoyer sur chaque canal
      const results = await Promise.all(
        notification.channels.map(channel => this.sendToChannel(channel, notification))
      );

      const allSuccess = results.every(r => r);

      // Mettre à jour le statut
      notification.status = allSuccess ? 'SENT' : 'FAILED';
      notification.sentAt = new Date().toISOString();
      if (!allSuccess) {
        notification.failureReason = 'Échec sur un ou plusieurs canaux';
      }

      // Sauvegarder
      await this.saveNotification(notification);

      console.log(`${allSuccess ? '✅' : '⚠️'} Notification envoyée: ${notification.subject}`);
      return allSuccess;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      notification.status = 'FAILED';
      notification.failureReason = error instanceof Error ? error.message : 'Erreur inconnue';
      await this.saveNotification(notification);
      return false;
    }
  }

  /**
   * Envoyer sur un canal spécifique
   */
  private static async sendToChannel(
    channel: NotificationChannel,
    notification: Notification
  ): Promise<boolean> {
    try {
      switch (channel) {
        case 'PUSH':
          return await this.sendPushNotification(notification);
        case 'EMAIL':
          return await this.sendEmail(notification);
        case 'SMS':
          return await this.sendSMS(notification);
        case 'WHATSAPP':
          return await this.sendWhatsApp(notification);
        case 'TELEGRAM':
          return await this.sendTelegram(notification);
        default:
          return false;
      }
    } catch (error) {
      console.error(`❌ Erreur canal ${channel}:`, error);
      return false;
    }
  }

  /**
   * Notification Push (PWA)
   */
  private static async sendPushNotification(notification: Notification): Promise<boolean> {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(notification.subject, {
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: notification.type,
          requireInteraction: notification.priority === 'URGENT',
          vibrate: notification.priority === 'URGENT' ? [200, 100, 200] : [100]
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        console.log('✅ Push notification envoyée');
        return true;
      } else {
        console.log('⚠️ Notifications push non disponibles');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur push notification:', error);
      return false;
    }
  }

  /**
   * Email (MOCK - Remplacer par SendGrid/Mailgun)
   */
  private static async sendEmail(notification: Notification): Promise<boolean> {
    try {
      console.log(`📧 [EMAIL MOCK] À: ${notification.recipientEmail}`);
      console.log(`Sujet: ${notification.subject}`);
      console.log(`Message: ${notification.message}`);

      return true;
    } catch (error) {
      console.error('❌ Erreur email:', error);
      return false;
    }
  }

  /**
   * SMS (MOCK - Remplacer par Twilio)
   */
  private static async sendSMS(notification: Notification): Promise<boolean> {
    try {
      console.log(`📱 [SMS MOCK] À: ${notification.recipientPhone}`);
      console.log(`Message: ${notification.message}`);

      return true;
    } catch (error) {
      console.error('❌ Erreur SMS:', error);
      return false;
    }
  }

  /**
   * WhatsApp (via Twilio WhatsApp API)
   */
  private static async sendWhatsApp(notification: Notification): Promise<boolean> {
    try {
      console.log(`💬 [WHATSAPP MOCK] À: ${notification.recipientPhone}`);
      console.log(`Message: ${notification.message}`);

      return true;
    } catch (error) {
      console.error('❌ Erreur WhatsApp:', error);
      return false;
    }
  }

  /**
   * Telegram (via Telegram Bot API)
   */
  private static async sendTelegram(notification: Notification): Promise<boolean> {
    try {
      console.log(`✈️ [TELEGRAM MOCK]`);
      console.log(`Message: ${notification.message}`);

      return true;
    } catch (error) {
      console.error('❌ Erreur Telegram:', error);
      return false;
    }
  }

  /**
   * Vérifier si on est en quiet hours
   */
  private static isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= preferences.quietHoursStart && currentTime <= preferences.quietHoursEnd;
  }

  /**
   * Compter les notifications du jour
   */
  private static async getTodayNotificationCount(userId: number): Promise<number> {
    try {
      const notifications = await this.loadNotifications();
      const today = new Date().toDateString();

      return notifications.filter(n =>
        n.recipientId === userId &&
        n.sentAt &&
        new Date(n.sentAt).toDateString() === today
      ).length;
    } catch {
      return 0;
    }
  }

  /**
   * Récupérer les préférences d'un utilisateur
   */
  static async getPreferences(
    userId: number,
    userType: NotificationRecipientType
  ): Promise<NotificationPreferences> {
    try {
      const stored = localStorage.getItem(`notification_prefs_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Préférences par défaut
      return this.getDefaultPreferences(userId, userType);
    } catch {
      return this.getDefaultPreferences(userId, userType);
    }
  }

  /**
   * Préférences par défaut
   */
  private static getDefaultPreferences(
    userId: number,
    userType: NotificationRecipientType
  ): NotificationPreferences {
    return {
      userId,
      userType,
      channelPreferences: {} as any,
      preferredTimeStart: '08:00',
      preferredTimeEnd: '20:00',
      maxNotificationsPerDay: 10,
      disabledTypes: [],
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  }

  /**
   * Sauvegarder les préférences
   */
  static async savePreferences(preferences: NotificationPreferences): Promise<void> {
    localStorage.setItem(
      `notification_prefs_${preferences.userId}`,
      JSON.stringify(preferences)
    );
  }

  /**
   * Marquer comme lu
   */
  static async markAsRead(notificationId: number): Promise<void> {
    try {
      const notifications = await this.loadNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.status = 'READ';
        notification.readAt = new Date().toISOString();
        await this.updateNotification(notification);
      }
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  static async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    try {
      const notifications = await this.loadNotifications();
      return notifications
        .filter(n => n.recipientId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return [];
    }
  }

  // ===== MÉTHODES PRIVÉES DE STOCKAGE =====

  private static async saveNotification(notification: Notification): Promise<void> {
    const notifications = await this.loadNotifications();
    notification.id = Date.now();
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  private static async loadNotifications(): Promise<Notification[]> {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async updateNotification(notification: Notification): Promise<void> {
    const notifications = await this.loadNotifications();
    const index = notifications.findIndex(n => n.id === notification.id);
    if (index >= 0) {
      notifications[index] = notification;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }
}

export default AdvancedNotificationService;
