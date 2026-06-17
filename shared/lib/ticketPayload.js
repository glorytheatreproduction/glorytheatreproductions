export function normalizeEventId(eventName) {
  return String(eventName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
  return binary
}

function parseLegacyTicketPayload(qrData) {
  try {
    const decoded = decodeBase64Url(qrData)
    const parsed = JSON.parse(decoded)

    if (!parsed.ticketId) {
      return { valid: false, error: 'Missing ticket ID' }
    }

    return {
      valid: true,
      ticketId: String(parsed.ticketId),
      eventId: parsed.eventId || normalizeEventId(parsed.eventName || ''),
      registrationId: null,
    }
  } catch {
    return { valid: false, error: 'Invalid QR code format' }
  }
}

export function parseAnyTicketPayload(qrData) {
  if (!qrData || typeof qrData !== 'string') {
    return { valid: false, error: 'Missing QR data' }
  }

  const trimmed = qrData.trim()

  try {
    const parsed = JSON.parse(trimmed)
    const ticketId = parsed.ticket_id || parsed.ticketId
    if (ticketId) {
      return {
        valid: true,
        ticketId: String(ticketId),
        eventId: parsed.event_id || parsed.eventId || null,
        registrationId: parsed.registration_id || parsed.registrationId || null,
        guestName: parsed.full_name || parsed.guestName || parsed.attendeeName || null,
      }
    }
  } catch {
    // fall through to legacy base64url payload
  }

  return parseLegacyTicketPayload(trimmed)
}
