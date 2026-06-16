import { parseAnyTicketPayload } from '../../shared/lib/ticketPayload.js'
import { getSupabase, supabaseIsConfigured } from '../lib/supabaseClient'

const REGISTRATION_SELECT = 'id, event_id, full_name, seats, ticket_id, checked_in, checked_in_at, events(title)'

function buildResult(data, ok = true) {
  return { ok, status: ok ? 200 : 400, data }
}

async function findRegistration(supabase, { ticketId, registrationId }) {
  let query = supabase.from('registrations').select(REGISTRATION_SELECT)

  if (registrationId) {
    query = query.eq('id', registrationId)
  } else if (ticketId) {
    query = query.eq('ticket_id', ticketId)
  } else {
    return { registration: null, error: null }
  }

  const { data, error } = await query.maybeSingle()
  return { registration: data, error }
}

async function verifyTicketViaSupabase({ qrData, ticketId }) {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to scan tickets')
  }

  let parsedTicketId = ticketId?.trim() || null
  let parsedEventId = null
  let parsedRegistrationId = null

  if (qrData) {
    const parsed = parseAnyTicketPayload(qrData)
    if (!parsed.valid) {
      return buildResult({
        success: false,
        status: 'invalid',
        message: parsed.error || 'Invalid QR code format',
      }, false)
    }

    parsedTicketId = parsed.ticketId
    parsedEventId = parsed.eventId
    parsedRegistrationId = parsed.registrationId
  }

  if (!parsedTicketId && !parsedRegistrationId) {
    return buildResult({
      success: false,
      status: 'invalid',
      message: 'Missing ticket data. Scan the QR code or enter a ticket ID.',
    }, false)
  }

  const { registration, error } = await findRegistration(supabase, {
    ticketId: parsedTicketId,
    registrationId: parsedRegistrationId,
  })

  if (error) {
    if (error.code === '42501' || /policy|permission|authorized/i.test(error.message || '')) {
      throw new Error('Your account cannot verify tickets. Sign in with an admin or ticket scanner account.')
    }
    throw new Error(error.message || 'Could not look up ticket')
  }

  if (!registration) {
    return buildResult({
      success: false,
      status: 'not_found',
      message: 'Ticket not found',
    }, false)
  }

  const eventName = registration.events?.title || registration.event_id

  if (parsedEventId && registration.event_id !== parsedEventId) {
    return buildResult({
      success: false,
      status: 'event_mismatch',
      message: 'Ticket does not match this event',
      ticketEvent: eventName,
    }, false)
  }

  if (registration.checked_in) {
    return buildResult({
      success: false,
      status: 'already_checked_in',
      message: 'Guest already checked in',
      attendeeName: registration.full_name,
      eventName,
      seats: registration.seats,
      checkInTimestamp: registration.checked_in_at,
    })
  }

  const checkedInAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      checked_in: true,
      checked_in_at: checkedInAt,
      updated_at: checkedInAt,
    })
    .eq('id', registration.id)

  if (updateError) {
    if (updateError.code === '42501' || /policy|permission|authorized/i.test(updateError.message || '')) {
      throw new Error('Your account cannot check in tickets. Sign in with an admin or ticket scanner account.')
    }
    throw new Error(updateError.message || 'Check-in update failed')
  }

  return buildResult({
    success: true,
    status: 'checked_in',
    message: 'Check-in successful',
    attendeeName: registration.full_name,
    eventName,
    seats: registration.seats,
    checkInTimestamp: checkedInAt,
  })
}

async function verifyTicketViaApi({ qrData, ticketId }) {
  const { data: { session } } = await getSupabase().auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to scan tickets')
  }

  const res = await fetch('/api/check-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      ...(qrData ? { qrData } : {}),
      ...(ticketId ? { ticketId } : {}),
    }),
  })

  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export async function verifyTicket({ qrData, ticketId }) {
  if (supabaseIsConfigured) {
    return verifyTicketViaSupabase({ qrData, ticketId })
  }
  return verifyTicketViaApi({ qrData, ticketId })
}

export const CHECK_IN_STATUS = {
  checked_in: { label: 'Checked in', tone: 'success' },
  already_checked_in: { label: 'Already checked in', tone: 'warning' },
  not_found: { label: 'Ticket not found', tone: 'error' },
  invalid: { label: 'Invalid ticket', tone: 'error' },
  event_mismatch: { label: 'Wrong event', tone: 'error' },
  unauthorized: { label: 'Not authorized', tone: 'error' },
  error: { label: 'Error', tone: 'error' },
}
