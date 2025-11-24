import { Handler, HandlerEvent } from '@netlify/functions';

interface SMSRequest {
  to: string;
  message: string;
  relatedRequestId?: number | string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const { to, message }: SMSRequest = JSON.parse(event.body || '{}');

    // Validate inputs
    if (!to || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, message' })
      };
    }

    // Get Twilio credentials from environment (without VITE_ prefix for backend)
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'SMS service not configured' })
      };
    }

    // Format phone number (add +33 if French number starting with 0)
    const formattedPhone = to.startsWith('+') ? to : `+33${to.replace(/^0/, '')}`;

    // Send SMS via Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: message
        })
      }
    );

    const responseData = await response.json();

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          messageSid: responseData.sid
        })
      };
    } else {
      console.error('Twilio API error:', responseData);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to send SMS',
          details: responseData
        })
      };
    }
  } catch (error: any) {
    console.error('SMS function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
