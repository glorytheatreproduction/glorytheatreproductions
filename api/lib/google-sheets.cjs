/**
 * Google Sheets Integration Module
 * 
 * A comprehensive, reusable module for interacting with Google Sheets
 * for RSVP and check-in management.
 * 
 * Features:
 * - Service account authentication
 * - RSVP registration
 * - Check-in updates
 * - Event management
 * - Query and analytics functions
 * 
 * Environment Variables Required:
 * - GOOGLE_SHEETS_SPREADSHEET_ID
 * - GOOGLE_SHEETS_CLIENT_EMAIL
 * - GOOGLE_SHEETS_PRIVATE_KEY
 * - GOOGLE_SHEETS_PROJECT_ID
 */

const { google } = require('googleapis');

/**
 * Sheet Names
 */
const SHEETS = {
  RSVPS: 'RSVPs',
  EVENTS: 'Events',
};

/**
 * Column Indices for RSVPs Sheet
 * (0-based indexing)
 */
const RSVP_COLUMNS = {
  TICKET_ID: 0,           // A
  EVENT_ID: 1,             // B
  EVENT_NAME: 2,           // C
  FULL_NAME: 3,            // D
  EMAIL: 4,                // E
  PHONE: 5,                // F
  SEATS: 6,                // G
  SUBMISSION_DATE: 7,      // H
  CHECKED_IN: 8,          // I
  CHECK_IN_TIMESTAMP: 9,   // J
};

/**
 * Column Indices for Events Sheet
 */
const EVENT_COLUMNS = {
  EVENT_ID: 0,            // A
  EVENT_NAME: 1,          // B
  DATE: 2,                // C
  TIME: 3,                // D
  VENUE: 4,               // E
  CAPACITY: 5,            // F
  RSVP_STATUS: 6,        // G
};

/**
 * Initialize Google Sheets API client
 * 
 * @returns {Object} Google Sheets API client
 */
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Get spreadsheet ID from environment
 * 
 * @returns {string} Spreadsheet ID
 * @throws {Error} If spreadsheet ID is not configured
 */
function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set');
  }
  
  return spreadsheetId;
}

/**
 * Create a new RSVP registration
 * 
 * @param {Object} rsvpData - RSVP data
 * @param {string} rsvpData.ticketId - Unique ticket identifier
 * @param {string} rsvpData.eventId - Event identifier (normalized)
 * @param {string} rsvpData.eventName - Event name
 * @param {string} rsvpData.fullName - Attendee full name
 * @param {string} rsvpData.email - Attendee email
 * @param {string} [rsvpData.phone] - Phone number (optional)
 * @param {number|string} rsvpData.seats - Number of seats
 * @returns {Promise<Object>} Result with success status and row number
 */
async function createRSVP(rsvpData) {
  const {
    ticketId,
    eventId,
    eventName,
    fullName,
    email,
    phone = '',
    seats = 1,
  } = rsvpData;

  // Validate required fields
  if (!ticketId || !eventId || !eventName || !fullName || !email) {
    throw new Error('Missing required RSVP fields: ticketId, eventId, eventName, fullName, email');
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Prepare row data in exact column order
  const rowData = [
    ticketId,                          // A: Ticket ID
    eventId,                            // B: Event ID
    eventName,                          // C: Event Name
    fullName,                           // D: Full Name
    email,                              // E: Email
    phone || '',                        // F: Phone
    seats.toString(),                   // G: Seats
    new Date().toISOString(),           // H: Submission Date
    'FALSE',                            // I: Checked In (default FALSE)
    '',                                 // J: Check-in Timestamp (empty initially)
  ];

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEETS.RSVPS}!A:J`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    });

    return {
      success: true,
      rowNumber: response.data.updates?.updatedRange?.match(/\d+$/)?.[0] || null,
      ticketId,
    };
  } catch (error) {
    console.error('Error creating RSVP:', error);
    throw new Error(`Failed to create RSVP: ${error.message}`);
  }
}

/**
 * Find RSVP by Ticket ID
 * 
 * @param {string} ticketId - Ticket ID to search for
 * @returns {Promise<Object|null>} RSVP data or null if not found
 */
async function findRSVPByTicketId(ticketId) {
  if (!ticketId) {
    return null;
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    // Read all RSVPs
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.RSVPS}!A:J`,
    });

    const rows = response.data.values || [];
    
    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[RSVP_COLUMNS.TICKET_ID] === ticketId) {
        return {
          ticketId: row[RSVP_COLUMNS.TICKET_ID],
          eventId: row[RSVP_COLUMNS.EVENT_ID] || '',
          eventName: row[RSVP_COLUMNS.EVENT_NAME] || '',
          fullName: row[RSVP_COLUMNS.FULL_NAME] || '',
          email: row[RSVP_COLUMNS.EMAIL] || '',
          phone: row[RSVP_COLUMNS.PHONE] || '',
          seats: row[RSVP_COLUMNS.SEATS] || '1',
          submissionDate: row[RSVP_COLUMNS.SUBMISSION_DATE] || '',
          checkedIn: row[RSVP_COLUMNS.CHECKED_IN] === 'TRUE' || row[RSVP_COLUMNS.CHECKED_IN] === true,
          checkInTimestamp: row[RSVP_COLUMNS.CHECK_IN_TIMESTAMP] || null,
          rowIndex: i + 1, // 1-based index for Sheets API
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding RSVP:', error);
    throw new Error(`Failed to find RSVP: ${error.message}`);
  }
}

/**
 * Update check-in status for a ticket
 * 
 * @param {string} ticketId - Ticket ID
 * @param {string} timestamp - ISO timestamp string
 * @returns {Promise<Object>} Result with status
 */
async function updateCheckInStatus(ticketId, timestamp = null) {
  if (!ticketId) {
    throw new Error('Ticket ID is required');
  }

  // Find the ticket first
  const rsvp = await findRSVPByTicketId(ticketId);

  if (!rsvp) {
    return {
      success: false,
      status: 'INVALID_TICKET',
      message: 'Ticket not found',
    };
  }

  // Check if already checked in
  if (rsvp.checkedIn) {
    return {
      success: false,
      status: 'ALREADY_CHECKED_IN',
      message: 'Ticket already checked in',
      checkInTimestamp: rsvp.checkInTimestamp,
    };
  }

  // Update check-in status
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const checkInTimestamp = timestamp || new Date().toISOString();

  try {
    // Update Checked In (column I) and Check-in Timestamp (column J)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEETS.RSVPS}!I${rsvp.rowIndex}:J${rsvp.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['TRUE', checkInTimestamp]],
      },
    });

    return {
      success: true,
      status: 'SUCCESS',
      message: 'Check-in recorded successfully',
      ticketId,
      checkInTimestamp,
      attendeeName: rsvp.fullName,
      seats: rsvp.seats,
      eventName: rsvp.eventName,
    };
  } catch (error) {
    console.error('Error updating check-in status:', error);
    throw new Error(`Failed to update check-in status: ${error.message}`);
  }
}

/**
 * Get all RSVPs for a specific event
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of RSVP objects
 */
async function getRSVPsByEventId(eventId) {
  if (!eventId) {
    return [];
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.RSVPS}!A:J`,
    });

    const rows = response.data.values || [];
    const rsvps = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[RSVP_COLUMNS.EVENT_ID] === eventId) {
        rsvps.push({
          ticketId: row[RSVP_COLUMNS.TICKET_ID],
          eventId: row[RSVP_COLUMNS.EVENT_ID],
          eventName: row[RSVP_COLUMNS.EVENT_NAME],
          fullName: row[RSVP_COLUMNS.FULL_NAME],
          email: row[RSVP_COLUMNS.EMAIL],
          phone: row[RSVP_COLUMNS.PHONE] || '',
          seats: parseInt(row[RSVP_COLUMNS.SEATS] || '1', 10),
          submissionDate: row[RSVP_COLUMNS.SUBMISSION_DATE],
          checkedIn: row[RSVP_COLUMNS.CHECKED_IN] === 'TRUE',
          checkInTimestamp: row[RSVP_COLUMNS.CHECK_IN_TIMESTAMP] || null,
        });
      }
    }

    return rsvps;
  } catch (error) {
    console.error('Error fetching RSVPs by event:', error);
    throw new Error(`Failed to fetch RSVPs: ${error.message}`);
  }
}

/**
 * Count total RSVPs for an event
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<number>} Total RSVP count
 */
async function countRSVPsByEventId(eventId) {
  const rsvps = await getRSVPsByEventId(eventId);
  return rsvps.length;
}

/**
 * Count checked-in attendees for an event
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<number>} Checked-in count
 */
async function countCheckedInByEventId(eventId) {
  const rsvps = await getRSVPsByEventId(eventId);
  return rsvps.filter(rsvp => rsvp.checkedIn).length;
}

/**
 * Get event details by Event ID
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Event data or null if not found
 */
async function getEventById(eventId) {
  if (!eventId) {
    return null;
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.EVENTS}!A:G`,
    });

    const rows = response.data.values || [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[EVENT_COLUMNS.EVENT_ID] === eventId) {
        return {
          eventId: row[EVENT_COLUMNS.EVENT_ID],
          eventName: row[EVENT_COLUMNS.EVENT_NAME],
          date: row[EVENT_COLUMNS.DATE],
          time: row[EVENT_COLUMNS.TIME],
          venue: row[EVENT_COLUMNS.VENUE],
          capacity: parseInt(row[EVENT_COLUMNS.CAPACITY] || '0', 10),
          rsvpStatus: row[EVENT_COLUMNS.RSVP_STATUS] || 'OPEN',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
}

/**
 * Check if event has available capacity
 * 
 * @param {string} eventId - Event ID
 * @param {number} requestedSeats - Number of seats requested
 * @returns {Promise<Object>} Availability check result
 */
async function checkEventCapacity(eventId, requestedSeats = 1) {
  const event = await getEventById(eventId);
  
  if (!event) {
    return {
      available: false,
      message: 'Event not found',
    };
  }

  if (event.rsvpStatus !== 'OPEN') {
    return {
      available: false,
      message: `Event RSVP status is ${event.rsvpStatus}`,
    };
  }

  const currentRSVPs = await countRSVPsByEventId(eventId);
  const totalSeatsReserved = (await getRSVPsByEventId(eventId))
    .reduce((sum, rsvp) => sum + rsvp.seats, 0);
  
  const availableSeats = event.capacity - totalSeatsReserved;
  const hasCapacity = availableSeats >= requestedSeats;

  return {
    available: hasCapacity,
    eventName: event.eventName,
    capacity: event.capacity,
    totalReserved: totalSeatsReserved,
    availableSeats,
    requestedSeats,
    message: hasCapacity 
      ? `Available: ${availableSeats} seats remaining`
      : `Capacity exceeded: Only ${availableSeats} seats available`,
  };
}

/**
 * Get all events
 * 
 * @returns {Promise<Array>} Array of event objects
 */
async function getAllEvents() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEETS.EVENTS}!A:G`,
    });

    const rows = response.data.values || [];
    const events = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[EVENT_COLUMNS.EVENT_ID]) {
        events.push({
          eventId: row[EVENT_COLUMNS.EVENT_ID],
          eventName: row[EVENT_COLUMNS.EVENT_NAME],
          date: row[EVENT_COLUMNS.DATE],
          time: row[EVENT_COLUMNS.TIME],
          venue: row[EVENT_COLUMNS.VENUE],
          capacity: parseInt(row[EVENT_COLUMNS.CAPACITY] || '0', 10),
          rsvpStatus: row[EVENT_COLUMNS.RSVP_STATUS] || 'OPEN',
        });
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
}

/**
 * Get event statistics
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event statistics
 */
async function getEventStatistics(eventId) {
  const event = await getEventById(eventId);
  
  if (!event) {
    return null;
  }

  const rsvps = await getRSVPsByEventId(eventId);
  const totalRSVPs = rsvps.length;
  const checkedIn = rsvps.filter(r => r.checkedIn).length;
  const totalSeatsReserved = rsvps.reduce((sum, r) => sum + r.seats, 0);
  const seatsCheckedIn = rsvps
    .filter(r => r.checkedIn)
    .reduce((sum, r) => sum + r.seats, 0);

  return {
    eventId,
    eventName: event.eventName,
    capacity: event.capacity,
    totalRSVPs,
    checkedIn,
    notCheckedIn: totalRSVPs - checkedIn,
    totalSeatsReserved,
    seatsCheckedIn,
    seatsNotCheckedIn: totalSeatsReserved - seatsCheckedIn,
    checkInRate: totalRSVPs > 0 ? (checkedIn / totalRSVPs * 100).toFixed(1) : 0,
    capacityUtilization: event.capacity > 0 
      ? (totalSeatsReserved / event.capacity * 100).toFixed(1) 
      : 0,
  };
}

module.exports = {
  // Core functions
  createRSVP,
  findRSVPByTicketId,
  updateCheckInStatus,
  
  // Event functions
  getEventById,
  getAllEvents,
  checkEventCapacity,
  
  // Query functions
  getRSVPsByEventId,
  countRSVPsByEventId,
  countCheckedInByEventId,
  getEventStatistics,
  
  // Utility exports
  SHEETS,
  RSVP_COLUMNS,
  EVENT_COLUMNS,
};
