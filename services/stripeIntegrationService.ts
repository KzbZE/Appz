/**
 * Service d'Intégration Stripe Avancée
 *
 * Fonctionnalités:
 * - Paiement factures par lien
 * - Acomptes 30%
 * - Abonnements/forfaits
 * - Webhooks Stripe
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Invoice } from '../types';

export interface StripePaymentLink {
  url: string;
  id: string;
  amount: number;
  currency: string;
  invoiceId: number;
  expiresAt: string;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  patientId: number;
  plan: 'pack_5' | 'pack_10' | 'monthly_unlimited';
  priceId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  sessionsRemaining?: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  invoiceId: number;
  receiptUrl?: string;
}

class StripeIntegrationService {
  private stripe: Stripe | null = null;
  private publishableKey: string = '';

  /**
   * Initialise Stripe
   */
  async initialize(publishableKey: string): Promise<void> {
    this.publishableKey = publishableKey;
    this.stripe = await loadStripe(publishableKey);
  }

  /**
   * Crée un lien de paiement pour une facture
   */
  async createPaymentLink(
    invoice: Invoice,
    options: {
      type: 'full' | 'deposit'; // Paiement complet ou acompte
      depositPercentage?: number; // Default: 30%
      expiresInHours?: number; // Default: 48h
    } = { type: 'full' }
  ): Promise<StripePaymentLink> {

    const depositPercentage = options.depositPercentage || 30;
    const amount = options.type === 'deposit'
      ? invoice.amountTTC * (depositPercentage / 100)
      : invoice.amountTTC;

    // Appeler Netlify Function pour créer le payment link côté serveur
    try {
      const response = await fetch('/.netlify/functions/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoice.number,
          amount: Math.round(amount * 100), // Centimes
          currency: 'eur',
          patientName: invoice.patientName,
          description: `Facture ${invoice.number} - ${options.type === 'deposit' ? `Acompte ${depositPercentage}%` : 'Paiement complet'}`,
          invoiceId: invoice.id
        })
      });

      if (!response.ok) throw new Error('Failed to create payment link');

      const data = await response.json();

      return {
        url: data.url,
        id: data.id,
        amount,
        currency: 'eur',
        invoiceId: invoice.id as number,
        expiresAt: new Date(Date.now() + (options.expiresInHours || 48) * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Stripe payment link creation failed:', error);
      throw error;
    }
  }

  /**
   * Crée un abonnement/forfait
   */
  async createSubscription(
    patientEmail: string,
    patientName: string,
    patientId: number,
    plan: 'pack_5' | 'pack_10' | 'monthly_unlimited'
  ): Promise<StripeSubscription> {

    const planDetails: Record<string, { priceId: string; sessions: number; price: number }> = {
      pack_5: { priceId: 'price_pack5', sessions: 5, price: 250 },
      pack_10: { priceId: 'price_pack10', sessions: 10, price: 450 },
      monthly_unlimited: { priceId: 'price_monthly', sessions: -1, price: 400 }
    };

    try {
      const response = await fetch('/.netlify/functions/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientEmail,
          name: patientName,
          patientId,
          priceId: planDetails[plan].priceId
        })
      });

      if (!response.ok) throw new Error('Failed to create subscription');

      const data = await response.json();

      return {
        id: data.subscriptionId,
        customerId: data.customerId,
        patientId,
        plan,
        priceId: planDetails[plan].priceId,
        status: 'active',
        currentPeriodEnd: data.currentPeriodEnd,
        sessionsRemaining: planDetails[plan].sessions
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async checkPaymentStatus(paymentIntentId: string): Promise<StripePaymentIntent> {
    try {
      const response = await fetch(`/.netlify/functions/check-payment?id=${paymentIntentId}`);

      if (!response.ok) throw new Error('Failed to check payment status');

      const data = await response.json();

      return {
        id: data.id,
        amount: data.amount / 100, // Convertir centimes en euros
        status: data.status,
        invoiceId: data.metadata.invoiceId,
        receiptUrl: data.receiptUrl
      };
    } catch (error) {
      console.error('Payment status check failed:', error);
      throw error;
    }
  }

  /**
   * Génère un reçu PDF après paiement
   */
  async generateReceipt(paymentIntent: StripePaymentIntent): Promise<Blob> {
    // Utiliser jsPDF pour générer un reçu
    // TODO: Implémenter avec jsPDF

    return new Blob(['Receipt PDF content'], { type: 'application/pdf' });
  }

  /**
   * Envoie un email de confirmation de paiement
   */
  async sendPaymentConfirmation(
    patientEmail: string,
    invoice: Invoice,
    receiptUrl: string
  ): Promise<void> {
    try {
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: patientEmail,
          subject: `Confirmation de paiement - Facture ${invoice.number}`,
          html: `
            <h2>Paiement confirmé ✅</h2>
            <p>Merci pour votre paiement de <strong>${invoice.amountTTC}€</strong>.</p>
            <p>Facture: ${invoice.number}</p>
            <p><a href="${receiptUrl}">Télécharger le reçu</a></p>
          `
        })
      });
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  }

  /**
   * Webhook handler (à implémenter côté Netlify Function)
   */
  handleWebhook(event: any): void {
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        // TODO: Mettre à jour la facture en base
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // TODO: Notifier le praticien
        break;

      case 'invoice.payment_succeeded':
        console.log('Subscription payment succeeded');
        // TODO: Créer séance dans le forfait
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription canceled');
        // TODO: Mettre à jour le statut
        break;
    }
  }

  /**
   * Obtient les statistiques de paiement
   */
  async getPaymentStats(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    onlinePayments: number;
    averageAmount: number;
    conversionRate: number;
  }> {
    // TODO: Agréger depuis les logs de paiement

    return {
      totalRevenue: 15000,
      onlinePayments: 45,
      averageAmount: 333.33,
      conversionRate: 0.85
    };
  }
}

export default new StripeIntegrationService();
