const crypto = require('crypto')

function normalizeEventId(eventName) {
  return eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function createTicketPayload(ticketId, eventName, secretKey = null) {
  const eventId = normalizeEventId(eventName)
  const payload = { ticketId, eventId, ts: Date.now() }

  if (secretKey) {
    const { sig: _sig, ...rest } = payload
    const json = JSON.stringify(rest)
    const sig = crypto.createHmac('sha256', secretKey).update(json).digest('hex')
    return Buffer.from(JSON.stringify({ ...payload, sig })).toString('base64url')
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function parseTicketPayload(qrData, secretKey = null) {
  try {
    const decoded = Buffer.from(qrData, 'base64url').toString('utf8')
    const parsed = JSON.parse(decoded)

    if (!parsed.ticketId) {
      return { valid: false, error: 'Missing ticket ID' }
    }

    if (secretKey && parsed.sig) {
      const { sig, ...rest } = parsed
      const json = JSON.stringify(rest)
      const expected = crypto.createHmac('sha256', secretKey).update(json).digest('hex')
      if (sig !== expected) {
        return { valid: false, error: 'Invalid signature' }
      }
    }

    return {
      valid: true,
      ticketId: parsed.ticketId,
      eventId: parsed.eventId || normalizeEventId(parsed.eventName || ''),
    }
  } catch {
    return { valid: false, error: 'Invalid QR code format' }
  }
}

module.exports = {
  normalizeEventId,
  createTicketPayload,
  parseTicketPayload,
}
