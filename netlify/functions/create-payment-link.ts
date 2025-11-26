/**
 * Netlify Function: create-payment-link
 * Crée un lien de paiement Stripe pour une facture
 */

import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { invoiceNumber, amount, currency, patientName, description, invoiceId } = JSON.parse(event.body || '{}');

    // Vérifier les variables d'environnement
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Importer Stripe dynamiquement
    const stripe = require('stripe')(stripeSecretKey);

    // Créer un Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency || 'eur',
            product_data: {
              name: description || `Facture ${invoiceNumber}`,
              description: `Patient: ${patientName}`,
            },
            unit_amount: amount, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceNumber,
        invoiceId: invoiceId.toString(),
        patientName
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.URL || 'http://localhost:3000'}?payment=success&invoice=${invoiceNumber}`
        }
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: paymentLink.url,
        id: paymentLink.id
      })
    };

  } catch (error: any) {
    console.error('Stripe payment link error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to create payment link'
      })
    };
  }
};

export { handler };
