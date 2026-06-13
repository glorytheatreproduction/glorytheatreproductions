/**
 * Ticket Generator — PNG tickets via SVG + sharp (no node-canvas).
 * Works on Vercel serverless without Cairo/pixman native compile.
 */

const QRCode = require('qrcode');
const sharp = require('sharp');

const WIDTH = 1600;
const HEIGHT = 900;

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildTicketSvg(ticketData) {
  const {
    eventName,
    eventDate,
    eventTime,
    eventVenue,
    attendeeName,
    ticketId,
    secretKey,
  } = ticketData;

  const { createTicketPayload } = require('./ticket-payload.cjs');
  const qrPayload = createTicketPayload(
    ticketId,
    eventName,
    secretKey || process.env.TICKET_SECRET_KEY || null
  );

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#eab308', light: '#ffffff' },
  });

  const dateTimeText = `${eventDate} at ${eventTime}`;
  const venueText = eventVenue || 'Venue TBA';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${WIDTH}" height="4" fill="#eab308"/>
  <rect x="0" y="${HEIGHT - 2}" width="${WIDTH}" height="2" fill="#eab308"/>
  <rect x="${WIDTH - 360}" y="72" width="280" height="60" rx="8" fill="#eab308"/>
  <text x="${WIDTH - 220}" y="112" text-anchor="middle" fill="#000000" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">FREE ENTRY</text>
  <text x="${WIDTH / 2}" y="180" text-anchor="middle" fill="#eab308" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">${escapeXml(eventName.toUpperCase())}</text>
  <line x1="${WIDTH / 2 - 200}" y1="220" x2="${WIDTH / 2 + 200}" y2="220" stroke="#eab308" stroke-width="2" stroke-dasharray="20 10"/>
  <text x="${WIDTH / 2}" y="340" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700">${escapeXml(attendeeName)}</text>
  <text x="${WIDTH / 2}" y="460" text-anchor="middle" fill="#facc15" font-family="Arial, Helvetica, sans-serif" font-size="36">${escapeXml(dateTimeText)}</text>
  <text x="${WIDTH / 2}" y="520" text-anchor="middle" fill="#d1d5db" font-family="Arial, Helvetica, sans-serif" font-size="32">${escapeXml(venueText)}</text>
  <text x="80" y="${HEIGHT - 120}" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="20">Ticket ID: ${escapeXml(ticketId)}</text>
  <rect x="${WIDTH - 330}" y="${HEIGHT - 250}" width="250" height="250" rx="8" fill="#ffffff"/>
  <image href="${qrDataUrl}" x="${WIDTH - 315}" y="${HEIGHT - 235}" width="220" height="220"/>
</svg>`;
}

async function generateTicket(ticketData) {
  const { eventName, attendeeName, ticketId } = ticketData;

  if (!eventName || !attendeeName || !ticketId) {
    throw new Error('Missing required ticket data: eventName, attendeeName, and ticketId are required');
  }

  const svg = await buildTicketSvg(ticketData);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateTicketWithTheme(ticketData) {
  return generateTicket(ticketData);
}

module.exports = {
  generateTicket,
  generateTicketWithTheme,
  THEME: {},
};
