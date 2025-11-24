import { Handler, HandlerEvent } from '@netlify/functions';

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  relatedRequestId?: number | string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
  }>;
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
    const { to, subject, message, attachments }: EmailRequest = JSON.parse(event.body || '{}');

    // Validate inputs
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, message' })
      };
    }

    // Get Resend API key from environment (without VITE_ prefix for backend)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    // Prepare email payload
    const emailPayload: any = {
      from: 'TheraFlow <onboarding@resend.dev>', // Replace with your verified domain
      to: [to],
      subject,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        ${message.replace(/\n/g, '<br>')}
      </div>`
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content
      }));
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseData = await response.json();

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          messageId: responseData.id
        })
      };
    } else {
      console.error('Resend API error:', responseData);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to send email',
          details: responseData
        })
      };
    }
  } catch (error: any) {
    console.error('Email function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
