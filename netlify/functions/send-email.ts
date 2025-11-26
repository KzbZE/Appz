/**
 * Netlify Function: send-email
 * Envoie un email via SendGrid
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
    const { to, subject, html, text } = JSON.parse(event.body || '{}');

    // Vérifier les variables d'environnement
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@theraflow.app';

    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Importer SendGrid dynamiquement
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendgridApiKey);

    // Préparer l'email
    const msg = {
      to,
      from: fromEmail,
      subject,
      text: text || '',
      html: html || text || ''
    };

    // Envoyer l'email
    await sgMail.send(msg);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      })
    };

  } catch (error: any) {
    console.error('SendGrid email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to send email'
      })
    };
  }
};

export { handler };
