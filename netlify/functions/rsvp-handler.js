/**
 * Netlify Function: RSVP Handler
 * 
 * This function handles RSVP form submissions:
 * 1. Validates input
 * 2. Generates unique Ticket ID
 * 3. Saves to Google Sheets
 * 4. Generates PNG ticket
 * 5. Sends email with ticket attachment
 * 
 * Environment Variables Required:
 * - GOOGLE_SHEETS_SPREADSHEET_ID
 * - GOOGLE_SHEETS_CLIENT_EMAIL
 * - GOOGLE_SHEETS_PRIVATE_KEY
 * - GOOGLE_SHEETS_PROJECT_ID
 * - SENDGRID_API_KEY
 * - FROM_EMAIL
 */

const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const { generateTicket } = require('./ticket-generator');
const { createRSVP, checkEventCapacity } = require('./google-sheets');
const { normalizeEventId } = require('./ticket-payload');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Generate unique Ticket ID
 */
function generateTicketID(eventName, attendeeName) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const eventCode = eventName.substring(0, 3).toUpperCase().replace(/\s/g, '');
  return `${eventCode}-${timestamp}-${random}`;
}

/**
 * Generate PNG ticket image using the ticket generator module
 * This is a wrapper that formats data for the ticket generator
 */
async function generateTicketImage(ticketData) {
  const { eventName, attendeeName, date, time, venue, ticketID } = ticketData;
  
  // Format data for ticket generator
  const formattedData = {
    eventName: eventName,
    eventDate: date,
    eventTime: time,
    eventVenue: venue,
    attendeeName: attendeeName,
    ticketId: ticketID,
    // Optional: Add logo path if you have one
    // logoPath: 'https://your-domain.com/logo.png',
  };
  
  // Generate ticket using the reusable module
  return await generateTicket(formattedData);
}

/**
 * Save RSVP to Google Sheets using the integration module
 */
async function saveToGoogleSheets(data) {
  const { ticketID, name, email, phone, seats, eventName } = data;

  try {
    // Normalize event ID
    const eventId = normalizeEventId(eventName);

    // Create RSVP using the integration module
    const result = await createRSVP({
      ticketId: ticketID,
      eventId,
      eventName,
      fullName: name,
      email,
      phone: phone || '',
      seats: seats || 1,
    });

    return result;
  } catch (error) {
    console.error('Google Sheets error:', error);
    throw error;
  }
}

/**
 * Send email with ticket attachment
 */
async function sendTicketEmail(email, name, ticketBuffer, ticketData) {
  const { eventName, date, time, venue, ticketID } = ticketData;

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL || 'noreply@glorytheatre.com',
    subject: `Your Ticket: ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #111827; color: #ffffff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1f2937; padding: 30px; border-radius: 8px; }
            h1 { color: #eab308; }
            .ticket-info { background: #111827; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Your Ticket is Ready!</h1>
            <p>Hi ${name},</p>
            <p>Thank you for reserving your seat for <strong>${eventName}</strong>.</p>
            <div class="ticket-info">
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Venue:</strong> ${venue}</p>
              <p><strong>Ticket ID:</strong> ${ticketID}</p>
            </div>
            <p>Your ticket is attached to this email. Please present it at the venue for entry.</p>
            <p>We look forward to seeing you!</p>
            <div class="footer">
              <p>Glory Theatre Productions</p>
              <p>This is a free event. No payment required.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    attachments: [
      {
        content: ticketBuffer.toString('base64'),
        filename: `ticket-${ticketID}.png`,
        type: 'image/png',
        disposition: 'attachment',
      },
    ],
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { name, email, phone, seats, eventName, eventDate, eventTime, eventVenue } = body;

    // Validation
    if (!name || !email || !eventName || !eventDate || !eventTime || !eventVenue) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' }),
      };
    }

    // Generate Ticket ID
    const ticketID = generateTicketID(eventName, name);

    // Prepare ticket data
    const ticketData = {
      eventName,
      attendeeName: name,
      date: eventDate,
      time: eventTime,
      venue: eventVenue,
      ticketID,
    };

    // Generate ticket image
    const ticketBuffer = await generateTicketImage(ticketData);

    // Save to Google Sheets
    await saveToGoogleSheets({
      ticketID,
      name,
      email,
      phone: phone || '',
      seats: seats || 1,
      eventName,
    });

    // Send email with ticket
    await sendTicketEmail(email, name, ticketBuffer, ticketData);

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'RSVP confirmed! Check your email for your ticket.',
        ticketID,
      }),
    };
  } catch (error) {
    console.error('RSVP handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
