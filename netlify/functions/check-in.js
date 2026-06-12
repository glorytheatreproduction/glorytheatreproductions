/**
 * Netlify Function: Check-In Handler
 * 
 * Handles QR code-based check-in for event attendees.
 * 
 * Features:
 * - Validates ticket payload from QR code
 * - Checks if ticket exists in Google Sheets
 * - Prevents duplicate check-ins
 * - Records check-in timestamp
 * - Returns clear status response
 * 
 * Environment Variables Required:
 * - GOOGLE_SHEETS_SPREADSHEET_ID
 * - GOOGLE_SHEETS_CLIENT_EMAIL
 * - GOOGLE_SHEETS_PRIVATE_KEY
 * - GOOGLE_SHEETS_PROJECT_ID
 * - TICKET_SECRET_KEY (optional, for payload signing)
 * - CHECK_IN_ADMIN_TOKEN (optional, for admin access control)
 */

const { parseTicketPayload, normalizeEventId } = require('./ticket-payload');
const { findRSVPByTicketId, updateCheckInStatus } = require('./google-sheets');

/**
 * Validate admin token (if configured)
 * 
 * @param {string} token - Token from request
 * @returns {boolean} True if token is valid or not required
 */
function validateAdminToken(token) {
  const adminToken = process.env.CHECK_IN_ADMIN_TOKEN;
  
  // If no admin token configured, allow all requests
  if (!adminToken) {
    return true;
  }

  // If admin token configured, require matching token
  return token === adminToken;
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const body = JSON.parse(event.body || '{}');
    const { qrData, ticketId, adminToken } = body;

    // Validate admin token if provided
    if (adminToken && !validateAdminToken(adminToken)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          status: 'unauthorized',
          message: 'Invalid admin token',
        }),
      };
    }

    // Get ticket ID from QR data or direct input
    let parsedTicketId = null;
    let parsedEventId = null;

    if (qrData) {
      // Parse QR code payload
      const secretKey = process.env.TICKET_SECRET_KEY || null;
      const parsed = parseTicketPayload(qrData, secretKey);

      if (!parsed.valid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'invalid',
            message: parsed.error || 'Invalid QR code format',
          }),
        };
      }

      parsedTicketId = parsed.ticketId;
      parsedEventId = parsed.eventId;
    } else if (ticketId) {
      // Manual entry fallback
      parsedTicketId = ticketId;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          status: 'invalid',
          message: 'Missing ticket data. Provide either qrData or ticketId.',
        }),
      };
    }

    // Find ticket using the integration module
    const ticket = await findRSVPByTicketId(parsedTicketId);

    if (!ticket) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          status: 'not_found',
          message: 'Ticket not found',
        }),
      };
    }

    // If event ID from QR code, verify it matches
    if (parsedEventId) {
      const ticketEventId = normalizeEventId(ticket.eventName);
      if (parsedEventId !== ticketEventId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'event_mismatch',
            message: 'Ticket does not match this event',
            ticketEvent: ticket.eventName,
          }),
        };
      }
    }

    // Use the integration module to update check-in status
    // This handles duplicate prevention and status updates
    const checkInResult = await updateCheckInStatus(parsedTicketId);

    if (!checkInResult.success) {
      // Handle already checked in or invalid ticket
      const statusCode = checkInResult.status === 'ALREADY_CHECKED_IN' ? 200 : 404;
      return {
        statusCode,
        headers,
        body: JSON.stringify({
          success: false,
          status: checkInResult.status === 'ALREADY_CHECKED_IN' ? 'already_checked_in' : 'not_found',
          message: checkInResult.message,
          attendeeName: ticket.fullName,
          checkInTimestamp: checkInResult.checkInTimestamp || ticket.checkInTimestamp,
        }),
      };
    }

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: 'checked_in',
        message: 'Check-in successful',
        attendeeName: checkInResult.attendeeName,
        seats: checkInResult.seats,
        eventName: checkInResult.eventName,
        checkInTimestamp: checkInResult.checkInTimestamp,
      }),
    };
  } catch (error) {
    console.error('Check-in handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        status: 'error',
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};
