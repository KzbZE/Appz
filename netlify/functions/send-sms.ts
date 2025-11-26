/**
 * Netlify Function: send-sms
 * Envoie un SMS via Twilio
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
    const { to, message } = JSON.parse(event.body || '{}');

    // Vérifier les variables d'environnement
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Importer Twilio dynamiquement
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Envoyer le SMS
    const sms = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        sid: sms.sid,
        status: sms.status
      })
    };

  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to send SMS'
      })
    };
  }
};

export { handler };
