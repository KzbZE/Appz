import { loadStripe, Stripe } from '@stripe/stripe-js';
import { db } from '../db';
import { Invoice, InvoiceStatus } from '../types';

/**
 * Service de paiement en ligne avec Stripe
 * Gestion des paiements, acomptes, abonnements, liens de paiement
 */

export interface PaymentLink {
  id?: number;
  invoiceId: number;
  patientId: number;
  patientName: string;
  patientEmail: string;
  amount: number;
  currency: string;
  description: string;
  paymentUrl: string;
  stripeSessionId?: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
}

export interface PaymentSubscription {
  id?: number;
  patientId: number;
  patientName: string;
  type: '5_SESSIONS' | '10_SESSIONS' | '20_SESSIONS' | 'MONTHLY' | 'YEARLY';
  pricePerSession: number;
  totalAmount: number;
  sessionsRemaining: number;
  sessionsTotal: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  stripePriceId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface PaymentConfig {
  stripePublicKey: string;
  stripeSecretKey: string; // À stocker de manière sécurisée côté serveur uniquement
  enabled: boolean;
  currency: string;
  acceptedMethods: ('card' | 'apple_pay' | 'google_pay' | 'sepa_debit')[];
  autoReminders: boolean;
  reminderDaysBefore: number[];
  depositPercentage: number;
  allowInstallments: boolean;
}

class PaymentService {
  private static stripePromise: Promise<Stripe | null> | null = null;

  /**
   * Initialiser Stripe avec la clé publique
   */
  static async initStripe(publicKey: string): Promise<Stripe | null> {
    if (!this.stripePromise) {
      this.stripePromise = loadStripe(publicKey);
    }
    return this.stripePromise;
  }

  /**
   * Créer un lien de paiement pour une facture
   */
  static async createPaymentLink(
    invoice: Invoice,
    patientEmail: string,
    config: PaymentConfig
  ): Promise<PaymentLink> {
    try {
      // En production, ceci devrait être un appel API backend
      // Le backend créerait une session Stripe Checkout

      /*
      BACKEND CODE (Node.js + Express):

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'apple_pay', 'google_pay'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: invoice.description,
            },
            unit_amount: invoice.amount * 100, // Montant en centimes
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/payment/cancel`,
        customer_email: patientEmail,
        metadata: {
          invoice_id: invoice.id,
          patient_id: invoice.patientId
        }
      });

      return { url: session.url, sessionId: session.id };
      */

      // MOCK pour développement
      const mockSessionId = `cs_test_${Date.now()}`;
      const mockPaymentUrl = `https://checkout.stripe.com/pay/${mockSessionId}`;

      const paymentLink: PaymentLink = {
        invoiceId: invoice.id!,
        patientId: typeof invoice.patientId === 'number' ? invoice.patientId : 0,
        patientName: invoice.patientName,
        patientEmail,
        amount: invoice.amount,
        currency: config.currency,
        description: invoice.description,
        paymentUrl: mockPaymentUrl,
        stripeSessionId: mockSessionId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      };

      // Sauvegarder le lien
      await this.savePaymentLink(paymentLink);

      console.log(`✅ Lien de paiement créé: ${mockPaymentUrl}`);
      console.log(`💡 MODE DÉVELOPPEMENT: En production, utiliser Stripe API`);

      return paymentLink;
    } catch (error) {
      console.error('❌ Erreur création lien paiement:', error);
      throw error;
    }
  }

  /**
   * Créer un abonnement / forfait séances
   */
  static async createSubscription(
    patientId: number,
    patientName: string,
    type: PaymentSubscription['type'],
    pricePerSession: number,
    config: PaymentConfig
  ): Promise<PaymentSubscription> {
    try {
      const sessionsMap = {
        '5_SESSIONS': 5,
        '10_SESSIONS': 10,
        '20_SESSIONS': 20,
        'MONTHLY': 4, // 4 séances/mois
        'YEARLY': 48 // 48 séances/an
      };

      const sessionsTotal = sessionsMap[type];
      const totalAmount = pricePerSession * sessionsTotal;

      // En production, créer via Stripe Subscriptions API
      /*
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        metadata: {
          patient_id: patientId,
          type: type
        }
      });
      */

      const subscription: PaymentSubscription = {
        patientId,
        patientName,
        type,
        pricePerSession,
        totalAmount,
        sessionsRemaining: sessionsTotal,
        sessionsTotal,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        expiresAt: type === 'MONTHLY'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : type === 'YEARLY'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };

      await this.saveSubscription(subscription);

      console.log(`✅ Abonnement créé: ${type} pour ${patientName}`);
      return subscription;
    } catch (error) {
      console.error('❌ Erreur création abonnement:', error);
      throw error;
    }
  }

  /**
   * Enregistrer un paiement reçu
   */
  static async recordPayment(
    invoiceId: number,
    amount: number,
    method: string,
    stripePaymentIntentId?: string
  ): Promise<void> {
    try {
      // Mettre à jour la facture
      await db.invoices.update(invoiceId, {
        status: InvoiceStatus.PAID,
        paidAt: new Date().toISOString(),
        paymentMethod: method
      });

      // Mettre à jour le lien de paiement
      const links = await this.loadPaymentLinks();
      const link = links.find(l => l.invoiceId === invoiceId);
      if (link && link.id) {
        link.status = 'PAID';
        link.paidAt = new Date().toISOString();
        await this.updatePaymentLink(link);
      }

      console.log(`✅ Paiement enregistré: ${amount}€ pour facture #${invoiceId}`);
    } catch (error) {
      console.error('❌ Erreur enregistrement paiement:', error);
      throw error;
    }
  }

  /**
   * Utiliser une séance d'un abonnement
   */
  static async useSubscriptionSession(subscriptionId: number): Promise<boolean> {
    try {
      const subscriptions = await this.loadSubscriptions();
      const subscription = subscriptions.find(s => s.id === subscriptionId);

      if (!subscription) {
        throw new Error('Abonnement introuvable');
      }

      if (subscription.status !== 'ACTIVE') {
        throw new Error('Abonnement inactif');
      }

      if (subscription.sessionsRemaining <= 0) {
        throw new Error('Plus de séances disponibles');
      }

      // Décrémenter les séances restantes
      subscription.sessionsRemaining--;

      // Si toutes les séances sont utilisées, marquer comme complété
      if (subscription.sessionsRemaining === 0) {
        subscription.status = 'COMPLETED';
      }

      await this.updateSubscription(subscription);

      console.log(`✅ Séance utilisée. Restantes: ${subscription.sessionsRemaining}/${subscription.sessionsTotal}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur utilisation séance:', error);
      return false;
    }
  }

  /**
   * Envoyer un lien de paiement par email
   * En production, utiliser un service d'emailing (SendGrid, Mailgun, etc.)
   */
  static async sendPaymentLinkEmail(
    paymentLink: PaymentLink,
    patientEmail: string
  ): Promise<boolean> {
    try {
      // MOCK pour développement
      console.log(`📧 [EMAIL MOCK] Envoi lien de paiement à ${patientEmail}`);
      console.log(`Montant: ${paymentLink.amount}€`);
      console.log(`Lien: ${paymentLink.paymentUrl}`);

      /*
      PRODUCTION CODE:

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: patientEmail,
        from: 'contact@votre-cabinet.fr',
        subject: 'Paiement de votre facture',
        html: `
          <h2>Bonjour ${paymentLink.patientName},</h2>
          <p>Votre facture de ${paymentLink.amount}€ est prête au paiement.</p>
          <p><a href="${paymentLink.paymentUrl}">Payer maintenant</a></p>
        `
      };

      await sgMail.send(msg);
      */

      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email paiement:', error);
      return false;
    }
  }

  /**
   * Envoyer un rappel de paiement
   */
  static async sendPaymentReminder(invoiceId: number): Promise<boolean> {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice || invoice.status === InvoiceStatus.PAID) {
        return false;
      }

      const links = await this.loadPaymentLinks();
      const link = links.find(l => l.invoiceId === invoiceId && l.status === 'PENDING');

      if (!link) {
        return false;
      }

      // Envoyer email de rappel
      console.log(`📧 Rappel de paiement envoyé pour facture #${invoiceId}`);
      return await this.sendPaymentLinkEmail(link, link.patientEmail);
    } catch (error) {
      console.error('❌ Erreur envoi rappel:', error);
      return false;
    }
  }

  /**
   * Réconciliation automatique des paiements Stripe
   * Webhook handler pour les événements Stripe
   */
  static async handleStripeWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          // Session de paiement complétée
          const session = event.data.object;
          const invoiceId = parseInt(session.metadata.invoice_id);
          await this.recordPayment(invoiceId, session.amount_total / 100, 'stripe', session.payment_intent);
          console.log(`✅ Paiement Stripe réconcilié pour facture #${invoiceId}`);
          break;

        case 'payment_intent.succeeded':
          // Paiement réussi
          console.log('✅ Payment Intent succeeded');
          break;

        case 'payment_intent.payment_failed':
          // Paiement échoué
          console.log('❌ Payment Intent failed');
          break;

        default:
          console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
      }
    } catch (error) {
      console.error('❌ Erreur traitement webhook Stripe:', error);
      throw error;
    }
  }

  // ===== MÉTHODES PRIVÉES DE STOCKAGE =====
  // TODO: Migrer vers base de données réelle

  private static async savePaymentLink(link: PaymentLink): Promise<void> {
    const links = await this.loadPaymentLinks();
    link.id = Date.now();
    links.push(link);
    localStorage.setItem('payment_links', JSON.stringify(links));
  }

  private static async loadPaymentLinks(): Promise<PaymentLink[]> {
    try {
      const stored = localStorage.getItem('payment_links');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async updatePaymentLink(link: PaymentLink): Promise<void> {
    const links = await this.loadPaymentLinks();
    const index = links.findIndex(l => l.id === link.id);
    if (index >= 0) {
      links[index] = link;
      localStorage.setItem('payment_links', JSON.stringify(links));
    }
  }

  private static async saveSubscription(sub: PaymentSubscription): Promise<void> {
    const subs = await this.loadSubscriptions();
    sub.id = Date.now();
    subs.push(sub);
    localStorage.setItem('payment_subscriptions', JSON.stringify(subs));
  }

  private static async loadSubscriptions(): Promise<PaymentSubscription[]> {
    try {
      const stored = localStorage.getItem('payment_subscriptions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async updateSubscription(sub: PaymentSubscription): Promise<void> {
    const subs = await this.loadSubscriptions();
    const index = subs.findIndex(s => s.id === sub.id);
    if (index >= 0) {
      subs[index] = sub;
      localStorage.setItem('payment_subscriptions', JSON.stringify(subs));
    }
  }

  /**
   * Récupérer tous les liens de paiement
   */
  static async getAllPaymentLinks(): Promise<PaymentLink[]> {
    return this.loadPaymentLinks();
  }

  /**
   * Récupérer tous les abonnements
   */
  static async getAllSubscriptions(): Promise<PaymentSubscription[]> {
    return this.loadSubscriptions();
  }

  /**
   * Récupérer les abonnements d'un patient
   */
  static async getPatientSubscriptions(patientId: number): Promise<PaymentSubscription[]> {
    const subs = await this.loadSubscriptions();
    return subs.filter(s => s.patientId === patientId);
  }
}

export default PaymentService;

/**
 * Configuration Stripe en production:
 *
 * 1. Créer un compte Stripe: https://dashboard.stripe.com/register
 * 2. Récupérer les clés API (Public Key et Secret Key)
 * 3. Configurer les webhooks pour recevoir les événements de paiement
 * 4. Implémenter un backend sécurisé pour gérer les appels Stripe
 * 5. Utiliser Stripe Elements pour le formulaire de paiement sécurisé
 *
 * Documentation: https://stripe.com/docs/api
 */
