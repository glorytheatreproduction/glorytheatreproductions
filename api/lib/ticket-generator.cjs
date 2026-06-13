/**
 * Ticket Generator Module
 * 
 * Generates high-quality PNG tickets for dance and theatre events.
 * Designed for Netlify Functions with node-canvas.
 * 
 * Usage:
 * const { generateTicket } = require('./ticket-generator');
 * const ticketBuffer = await generateTicket(ticketData);
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const QRCode = require('qrcode');

/**
 * Default theme configuration
 * Easy to customize colors, fonts, and layout
 */
const THEME = {
  // Canvas dimensions (landscape, high DPI)
  width: 1600,
  height: 900,
  
  // Colors - Dark theme with gold accents
  colors: {
    background: '#0a0a0a',           // Near black
    backgroundGradient: '#1a1a1a',   // Slightly lighter for gradient
    gold: '#eab308',                  // Primary gold (yellow-500)
    goldLight: '#facc15',             // Light gold (yellow-400)
    goldDark: '#ca8a04',              // Dark gold (yellow-600)
    textPrimary: '#ffffff',           // White
    textSecondary: '#d1d5db',         // Gray-300
    textTertiary: '#9ca3af',          // Gray-400
    accentLine: '#eab308',            // Gold accent lines
  },
  
  // Typography
  fonts: {
    eventName: {
      size: 72,
      weight: 'bold',
      family: 'Arial, sans-serif', // Fallback if custom font not loaded
    },
    attendeeName: {
      size: 96,
      weight: 'bold',
      family: 'Arial, sans-serif',
    },
    dateTime: {
      size: 36,
      weight: 'normal',
      family: 'Arial, sans-serif',
    },
    venue: {
      size: 32,
      weight: 'normal',
      family: 'Arial, sans-serif',
    },
    ticketId: {
      size: 20,
      weight: 'normal',
      family: 'Arial, sans-serif',
    },
    freeEntry: {
      size: 28,
      weight: 'bold',
      family: 'Arial, sans-serif',
    },
  },
  
  // Layout spacing (in pixels)
  spacing: {
    padding: 80,
    sectionGap: 40,
    elementGap: 20,
  },
};

/**
 * Generate QR code for ticket with secure payload
 * @param {string} ticketId - Unique ticket identifier
 * @param {string} eventName - Event name (will be normalized to eventId)
 * @param {string} secretKey - Optional secret key for signing payload
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRCode(ticketId, eventName, secretKey = null) {
  try {
    const { createTicketPayload } = require('./ticket-payload.cjs');
    
    // Create secure payload with ticketId and eventId
    const payload = createTicketPayload(ticketId, eventName, secretKey);
    
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M', // Medium error correction for better readability
      color: {
        dark: '#eab308',  // Gold QR code
        light: '#0a0a0a',  // Dark background
      },
    });
    
    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
}

/**
 * Load logo image (optional)
 * @param {string} logoPath - Path or URL to logo image
 * @returns {Promise<Image|null>} Logo image or null if not available
 */
async function loadLogo(logoPath) {
  if (!logoPath) return null;
  
  try {
    return await loadImage(logoPath);
  } catch (error) {
    console.warn('Logo not found, continuing without logo:', error.message);
    return null;
  }
}

/**
 * Draw gradient background with vignette effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawBackground(ctx, width, height) {
  // Base dark background
  ctx.fillStyle = THEME.colors.background;
  ctx.fillRect(0, 0, width, height);
  
  // Subtle gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, THEME.colors.backgroundGradient);
  gradient.addColorStop(1, THEME.colors.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Vignette effect (darker edges)
  const radialGradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw decorative gold accent lines
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 */
function drawAccentLines(ctx, width) {
  ctx.strokeStyle = THEME.colors.accentLine;
  ctx.lineWidth = 4;
  
  // Top accent line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();
  
  // Bottom accent line (thinner)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, THEME.height - 2);
  ctx.lineTo(width, THEME.height - 2);
  ctx.stroke();
  
  // Side decorative elements
  const sideLineY = THEME.height * 0.3;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(60, sideLineY);
  ctx.lineTo(60, sideLineY + 100);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(width - 60, sideLineY);
  ctx.lineTo(width - 60, sideLineY + 100);
  ctx.stroke();
  
  ctx.setLineDash([]); // Reset dash
}

/**
 * Draw text with shadow for depth
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} style - Font style object
 * @param {string} color - Text color
 * @param {boolean} center - Center align text
 */
function drawText(ctx, text, x, y, style, color, center = false) {
  ctx.font = `${style.weight} ${style.size}px ${style.family}`;
  ctx.fillStyle = color;
  ctx.textAlign = center ? 'center' : 'left';
  ctx.textBaseline = 'top';
  
  // Text shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(text, x, y);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draw rounded rectangle (helper function for compatibility)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Border radius
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw "FREE ENTRY" badge
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function drawFreeEntryBadge(ctx, x, y) {
  const badgeWidth = 280;
  const badgeHeight = 60;
  const borderRadius = 8;
  
  // Badge background (gold)
  ctx.fillStyle = THEME.colors.gold;
  drawRoundedRect(ctx, x, y, badgeWidth, badgeHeight, borderRadius);
  ctx.fill();
  
  // Badge text
  drawText(
    ctx,
    'FREE ENTRY',
    x + badgeWidth / 2,
    y + badgeHeight / 2 - THEME.fonts.freeEntry.size / 2,
    THEME.fonts.freeEntry,
    '#000000', // Black text on gold
    true
  );
}

/**
 * Main ticket generation function
 * 
 * @param {Object} ticketData - Ticket data object
 * @param {string} ticketData.eventName - Name of the event
 * @param {string} ticketData.eventDate - Event date (e.g., "May 15, 2024")
 * @param {string} ticketData.eventTime - Event time (e.g., "8:00 PM")
 * @param {string} ticketData.eventVenue - Venue name
 * @param {string} ticketData.attendeeName - Attendee's full name
 * @param {string} ticketData.ticketId - Unique ticket identifier
 * @param {string} [ticketData.logoPath] - Optional path/URL to logo image
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateTicket(ticketData) {
  const {
    eventName,
    eventDate,
    eventTime,
    eventVenue,
    attendeeName,
    ticketId,
    logoPath,
  } = ticketData;

  // Validate required fields
  if (!eventName || !attendeeName || !ticketId) {
    throw new Error('Missing required ticket data: eventName, attendeeName, and ticketId are required');
  }

  // Create canvas
  const canvas = createCanvas(THEME.width, THEME.height);
  const ctx = canvas.getContext('2d');

  // Draw background with gradient and vignette
  drawBackground(ctx, THEME.width, THEME.height);

  // Draw decorative accent lines
  drawAccentLines(ctx, THEME.width);

  // Load optional logo
  const logo = await loadLogo(logoPath);
  
  // Calculate layout positions
  const padding = THEME.spacing.padding;
  const centerX = THEME.width / 2;
  let currentY = padding;

  // Top section: Logo (if available) or Event Name
  if (logo) {
    const logoSize = 120;
    const logoX = padding;
    const logoY = padding;
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    currentY = logoY + logoSize + THEME.spacing.sectionGap;
  }

  // "FREE ENTRY" badge (top right)
  const badgeX = THEME.width - padding - 280;
  const badgeY = padding;
  drawFreeEntryBadge(ctx, badgeX, badgeY);

  // Event Name (large, gold, centered)
  const eventNameY = currentY;
  drawText(
    ctx,
    eventName.toUpperCase(),
    centerX,
    eventNameY,
    THEME.fonts.eventName,
    THEME.colors.gold,
    true
  );
  currentY = eventNameY + THEME.fonts.eventName.size + THEME.spacing.sectionGap;

  // Decorative line under event name
  ctx.strokeStyle = THEME.colors.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 10]);
  ctx.beginPath();
  ctx.moveTo(centerX - 200, currentY - 20);
  ctx.lineTo(centerX + 200, currentY - 20);
  ctx.stroke();
  ctx.setLineDash([]);

  // Attendee Name (prominent, white, centered, bold)
  const attendeeY = currentY + THEME.spacing.elementGap;
  drawText(
    ctx,
    attendeeName,
    centerX,
    attendeeY,
    THEME.fonts.attendeeName,
    THEME.colors.textPrimary,
    true
  );
  currentY = attendeeY + THEME.fonts.attendeeName.size + THEME.spacing.sectionGap;

  // Date & Time section
  const dateTimeText = `${eventDate} at ${eventTime}`;
  const dateTimeY = currentY;
  drawText(
    ctx,
    dateTimeText,
    centerX,
    dateTimeY,
    THEME.fonts.dateTime,
    THEME.colors.goldLight,
    true
  );
  currentY = dateTimeY + THEME.fonts.dateTime.size + THEME.spacing.elementGap;

  // Venue
  const venueY = currentY;
  drawText(
    ctx,
    eventVenue || 'Venue TBA',
    centerX,
    venueY,
    THEME.fonts.venue,
    THEME.colors.textSecondary,
    true
  );

  // Bottom section: Ticket ID and QR code
  const bottomY = THEME.height - padding - 100;

  // Ticket ID (bottom left)
  const ticketIdText = `Ticket ID: ${ticketId}`;
  drawText(
    ctx,
    ticketIdText,
    padding,
    bottomY,
    THEME.fonts.ticketId,
    THEME.colors.textTertiary,
    false
  );

  // Generate and draw QR code (bottom right)
  // Use secret key from parameter or environment
  const qrSecretKey = secretKey || process.env.TICKET_SECRET_KEY || null;
  const qrCodeBuffer = await generateQRCode(ticketId, eventName, qrSecretKey);
  if (qrCodeBuffer) {
    try {
      const qrCodeImage = await loadImage(qrCodeBuffer);
      const qrSize = 150;
      const qrX = THEME.width - padding - qrSize;
      const qrY = bottomY - 10;
      
      // Draw white background for QR code
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      // Draw QR code
      ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
    } catch (error) {
      console.warn('Could not draw QR code:', error.message);
    }
  }

  // Decorative bottom border
  ctx.strokeStyle = THEME.colors.gold;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding, bottomY - 40);
  ctx.lineTo(THEME.width - padding, bottomY - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Convert canvas to PNG buffer
  return canvas.toBuffer('image/png');
}

/**
 * Generate ticket with custom theme
 * Allows overriding default theme colors and fonts
 * 
 * @param {Object} ticketData - Ticket data (same as generateTicket)
 * @param {Object} customTheme - Custom theme overrides
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateTicketWithTheme(ticketData, customTheme = {}) {
  // Merge custom theme with default
  if (customTheme.colors) {
    Object.assign(THEME.colors, customTheme.colors);
  }
  if (customTheme.fonts) {
    Object.assign(THEME.fonts, customTheme.fonts);
  }
  if (customTheme.spacing) {
    Object.assign(THEME.spacing, customTheme.spacing);
  }
  
  return generateTicket(ticketData);
}

module.exports = {
  generateTicket,
  generateTicketWithTheme,
  THEME, // Export theme for customization
};
