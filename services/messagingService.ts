import { db } from '../db';
import { EncryptionService } from './securityService';

/**
 * Service de messagerie sécurisée patient-praticien
 * Messages chiffrés de bout en bout
 */

export interface Message {
  id?: number;
  conversationId: string; // Format: "patient_{patientId}"
  senderId: string | number; // 'practitioner' ou patientId
  senderType: 'PATIENT' | 'PRACTITIONER';
  senderName: string;
  content: string; // Contenu chiffré
  encryptedContent?: string; // Pour stockage
  timestamp: string;
  read: boolean;
  readAt?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'IMAGE' | 'PDF' | 'DOCUMENT';
  filename: string;
  url: string; // Base64 data URL ou URL externe
  size: number;
}

export interface Conversation {
  id: string; // Format: "patient_{patientId}"
  patientId: number;
  patientName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

class MessagingService {
  private static ENCRYPTION_KEY = 'theraflow-messaging-key-2024'; // À remplacer par clé générée

  /**
   * Envoyer un message
   */
  static async sendMessage(
    patientId: number,
    senderId: string | number,
    senderType: 'PATIENT' | 'PRACTITIONER',
    senderName: string,
    content: string,
    attachments?: MessageAttachment[]
  ): Promise<number> {
    try {
      const conversationId = `patient_${patientId}`;

      // Chiffrer le contenu
      const encryptedContent = await EncryptionService.encrypt(content, this.ENCRYPTION_KEY);

      const message: Message = {
        conversationId,
        senderId,
        senderType,
        senderName,
        content: encryptedContent,
        timestamp: new Date().toISOString(),
        read: false,
        attachments
      };

      // Sauvegarder dans la base de données
      // TODO: Ajouter table messages dans le schema db
      const messageId = await this.saveMessage(message);

      // Mettre à jour la conversation
      await this.updateConversation(conversationId, patientId, content);

      console.log(`✅ Message envoyé: ${senderName} → Conversation ${conversationId}`);

      // Envoyer notification (TODO: intégrer avec notification service)
      if (senderType === 'PATIENT') {
        console.log('📧 Notification praticien: Nouveau message patient');
      } else {
        console.log('📧 Notification patient: Nouveau message praticien');
      }

      return messageId;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      throw error;
    }
  }

  /**
   * Récupérer les messages d'une conversation
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const messages = await this.loadMessages(conversationId);

      // Déchiffrer les messages
      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          content: await EncryptionService.decrypt(msg.content, this.ENCRYPTION_KEY)
        }))
      );

      return decryptedMessages;
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      return [];
    }
  }

  /**
   * Marquer un message comme lu
   */
  static async markAsRead(messageId: number): Promise<void> {
    try {
      // TODO: Mettre à jour dans la base de données
      console.log(`✅ Message ${messageId} marqué comme lu`);
    } catch (error) {
      console.error('❌ Erreur marquage lecture:', error);
    }
  }

  /**
   * Récupérer toutes les conversations (pour le praticien)
   */
  static async getAllConversations(): Promise<Conversation[]> {
    try {
      const conversations = await this.loadConversations();
      return conversations.sort((a, b) =>
        new Date(b.lastMessageAt || b.createdAt).getTime() -
        new Date(a.lastMessageAt || a.createdAt).getTime()
      );
    } catch (error) {
      console.error('❌ Erreur récupération conversations:', error);
      return [];
    }
  }

  /**
   * Récupérer une conversation spécifique
   */
  static async getConversation(patientId: number): Promise<Conversation | null> {
    try {
      const conversationId = `patient_${patientId}`;
      const conversations = await this.loadConversations();
      return conversations.find(c => c.id === conversationId) || null;
    } catch (error) {
      console.error('❌ Erreur récupération conversation:', error);
      return null;
    }
  }

  /**
   * Compter les messages non lus
   */
  static async getUnreadCount(patientId: number, userType: 'PATIENT' | 'PRACTITIONER'): Promise<number> {
    try {
      const conversationId = `patient_${patientId}`;
      const messages = await this.loadMessages(conversationId);

      // Compter les messages non lus envoyés par l'autre partie
      return messages.filter(m =>
        !m.read &&
        ((userType === 'PATIENT' && m.senderType === 'PRACTITIONER') ||
         (userType === 'PRACTITIONER' && m.senderType === 'PATIENT'))
      ).length;
    } catch (error) {
      console.error('❌ Erreur comptage non lus:', error);
      return 0;
    }
  }

  /**
   * Supprimer une conversation
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Supprimer tous les messages
      localStorage.removeItem(`messages_${conversationId}`);

      // Supprimer la conversation
      const conversations = await this.loadConversations();
      const updated = conversations.filter(c => c.id !== conversationId);
      localStorage.setItem('conversations', JSON.stringify(updated));

      console.log(`✅ Conversation ${conversationId} supprimée`);
    } catch (error) {
      console.error('❌ Erreur suppression conversation:', error);
      throw error;
    }
  }

  // ===== MÉTHODES PRIVÉES DE STOCKAGE =====
  // TODO: Remplacer par vraie base de données (IndexedDB avec Dexie)

  private static async saveMessage(message: Message): Promise<number> {
    const messages = await this.loadMessages(message.conversationId);
    const newMessage = { ...message, id: Date.now() };
    messages.push(newMessage);
    localStorage.setItem(`messages_${message.conversationId}`, JSON.stringify(messages));
    return newMessage.id!;
  }

  private static async loadMessages(conversationId: string): Promise<Message[]> {
    try {
      const stored = localStorage.getItem(`messages_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async updateConversation(
    conversationId: string,
    patientId: number,
    lastMessage: string
  ): Promise<void> {
    const conversations = await this.loadConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversationId);

    if (existingIndex >= 0) {
      conversations[existingIndex].lastMessage = lastMessage;
      conversations[existingIndex].lastMessageAt = new Date().toISOString();
      conversations[existingIndex].unreadCount++;
    } else {
      // Créer nouvelle conversation
      const patient = await db.patients.get(patientId);
      const newConversation: Conversation = {
        id: conversationId,
        patientId,
        patientName: patient?.name || 'Patient',
        lastMessage,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1,
        createdAt: new Date().toISOString()
      };
      conversations.push(newConversation);
    }

    localStorage.setItem('conversations', JSON.stringify(conversations));
  }

  private static async loadConversations(): Promise<Conversation[]> {
    try {
      const stored = localStorage.getItem('conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export default MessagingService;

/**
 * TODO: Migrer vers IndexedDB avec Dexie
 *
 * Ajouter dans db.ts:
 *
 * messages: '++id, conversationId, senderId, timestamp, read',
 * conversations: '++id, &conversationId, patientId, lastMessageAt'
 *
 * Avantages:
 * - Stockage persistant et structuré
 * - Requêtes optimisées
 * - Support de grandes quantités de données
 * - Synchronisation hors-ligne
 */
