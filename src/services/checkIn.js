import { parseAnyTicketPayload } from '../../shared/lib/ticketPayload.js'
import { getSupabase, supabaseIsConfigured } from '../lib/supabaseClient'

const REGISTRATION_SELECT =
  'id, event_id, full_name, seats, ticket_id, checked_in, checked_in_at, checked_in_seats, events(title)'

function buildResult(data, ok = true) {
  return { ok, status: ok ? 200 : 400, data }
}

function mapRegistration(registration) {
  const eventName = registration.events?.title || registration.event_id
  const reservedSeats = Number(registration.seats) || 0
  const checkedInSeats = registration.checked_in
    ? Number(registration.checked_in_seats ?? registration.seats) || 0
    : null

  return {
    registrationId: registration.id,
    attendeeName: registration.full_name,
    eventName,
    ticketId: registration.ticket_id,
    reservedSeats,
    admittedSeats: checkedInSeats,
    checkInTimestamp: registration.checked_in_at,
  }
}

function mapCandidate(registration) {
  const mapped = mapRegistration(registration)
  return {
    ...mapped,
    label: `${mapped.attendeeName} · Ticket #${mapped.ticketId || '—'} · ${mapped.eventName}`,
  }
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

async function findRegistrationsByName(supabase, guestName, { eventId, partial = false } = {}) {
  const name = guestName.trim()
  if (!name) return { registrations: [], error: null }

  let query = supabase.from('registrations').select(REGISTRATION_SELECT)

  if (partial) {
    query = query.ilike('full_name', `%${name}%`)
  } else {
    query = query.ilike('full_name', name)
  }

  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(10)
  return { registrations: data || [], error }
}

function parseTicketInput({ qrData, ticketId, guestName }) {
  let parsedTicketId = ticketId?.trim() || null
  let parsedEventId = null
  let parsedRegistrationId = null
  let parsedGuestName = guestName?.trim() || null

  if (qrData) {
    const parsed = parseAnyTicketPayload(qrData)
    if (!parsed.valid) {
      return { error: parsed.error || 'Invalid QR code format' }
    }
    parsedTicketId = parsed.ticketId
    parsedEventId = parsed.eventId
    parsedRegistrationId = parsed.registrationId
    parsedGuestName = parsed.guestName || parsedGuestName
  }

  if (!parsedTicketId && !parsedRegistrationId && !parsedGuestName) {
    return { error: 'Scan the QR code, enter a ticket ID, or search by guest name.' }
  }

  return { parsedTicketId, parsedEventId, parsedRegistrationId, parsedGuestName }
}

function evaluateRegistration(registration, parsedEventId) {
  if (!registration) {
    return buildResult({
      success: false,
      status: 'not_found',
      message: 'Ticket not found',
    }, false)
  }

  const mapped = mapRegistration(registration)

  if (parsedEventId && registration.event_id !== parsedEventId) {
    return buildResult({
      success: false,
      status: 'event_mismatch',
      message: 'Ticket does not match this event',
      ticketEvent: mapped.eventName,
      ...mapped,
    }, false)
  }

  if (registration.checked_in) {
    return buildResult({
      success: false,
      status: 'already_checked_in',
      message: `Already checked in — admitted ${formatSeatCount(mapped.admittedSeats)} (reserved ${formatSeatCount(mapped.reservedSeats)}).`,
      seats: mapped.admittedSeats,
      reservedSeats: mapped.reservedSeats,
      ...mapped,
    })
  }

  return buildResult({
    success: true,
    status: 'ready_to_check_in',
    message: `Reserved ${formatSeatCount(mapped.reservedSeats)}. Confirm how many guests to admit.`,
    seats: mapped.reservedSeats,
    reservedSeats: mapped.reservedSeats,
    seatsToAdmit: mapped.reservedSeats,
    ...mapped,
  })
}

async function ensureScannerSession() {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to scan tickets')
  }
  return supabase
}

function handleSupabaseError(error, fallbackMessage) {
  if (error.code === '42501' || /policy|permission|authorized/i.test(error.message || '')) {
    throw new Error('Your account cannot verify tickets. Sign in with an admin or ticket scanner account.')
  }
  throw new Error(error.message || fallbackMessage)
}

export function formatSeatCount(seats) {
  const count = Number(seats) || 0
  return count === 1 ? '1 seat' : `${count} seats`
}

export function formatAdmitMessage(seatsToAdmit, reservedSeats) {
  const admit = Number(seatsToAdmit) || 0
  const reserved = Number(reservedSeats) || 0

  if (admit <= 0) return 'Check-in recorded.'

  const admitText = admit === 1 ? '1 guest' : `${admit} guests`
  if (reserved && admit !== reserved) {
    return `Admit ${admitText} (${formatSeatCount(admit)}). Reserved ${formatSeatCount(reserved)}.`
  }
  if (admit === 1) return 'Admit 1 guest — 1 seat on this ticket.'
  return `Admit ${admit} guests — ${admit} seats on this ticket.`
}

export function isTicketIdLookup(value) {
  return /^\d{1,6}$/.test(String(value || '').trim())
}

export async function lookupTicket({ qrData, ticketId, guestName, eventId, registrationId }) {
  const supabase = await ensureScannerSession()

  if (registrationId) {
    const { registration, error } = await findRegistration(supabase, { registrationId })
    if (error) handleSupabaseError(error, 'Could not look up ticket')
    return evaluateRegistration(registration, eventId || null)
  }

  const parsed = parseTicketInput({ qrData, ticketId, guestName })
  if (parsed.error) {
    return buildResult({
      success: false,
      status: 'invalid',
      message: parsed.error,
    }, false)
  }

  if (parsed.parsedGuestName && !parsed.parsedTicketId && !parsed.parsedRegistrationId) {
    let { registrations, error } = await findRegistrationsByName(supabase, parsed.parsedGuestName, { eventId })

    if (error) handleSupabaseError(error, 'Could not search by guest name')

    if (!registrations.length) {
      const partial = await findRegistrationsByName(supabase, parsed.parsedGuestName, { eventId, partial: true })
      if (partial.error) handleSupabaseError(partial.error, 'Could not search by guest name')
      registrations = partial.registrations
    }

    if (!registrations.length) {
      return buildResult({
        success: false,
        status: 'not_found',
        message: `No registration found for "${parsed.parsedGuestName}"`,
      }, false)
    }

    if (registrations.length > 1) {
      return buildResult({
        success: false,
        status: 'multiple_matches',
        message: `Found ${registrations.length} guests named "${parsed.parsedGuestName}". Select the correct ticket.`,
        candidates: registrations.map(mapCandidate),
      }, false)
    }

    return evaluateRegistration(registrations[0], parsed.parsedEventId)
  }

  const { registration, error } = await findRegistration(supabase, {
    ticketId: parsed.parsedTicketId,
    registrationId: parsed.parsedRegistrationId,
  })

  if (error) handleSupabaseError(error, 'Could not look up ticket')

  return evaluateRegistration(registration, parsed.parsedEventId)
}

export async function confirmCheckIn({ registrationId, seatsToAdmit }) {
  const supabase = await ensureScannerSession()
  const seats = Math.max(1, Number(seatsToAdmit) || 1)

  const { registration, error } = await findRegistration(supabase, { registrationId })
  if (error) handleSupabaseError(error, 'Could not look up ticket')

  if (!registration) {
    return buildResult({
      success: false,
      status: 'not_found',
      message: 'Ticket not found',
    }, false)
  }

  const mapped = mapRegistration(registration)

  if (registration.checked_in) {
    return buildResult({
      success: false,
      status: 'already_checked_in',
      message: `Already checked in — admitted ${formatSeatCount(mapped.admittedSeats)}.`,
      seats: mapped.admittedSeats,
      reservedSeats: mapped.reservedSeats,
      ...mapped,
    })
  }

  const checkedInAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      checked_in: true,
      checked_in_at: checkedInAt,
      checked_in_seats: seats,
      updated_at: checkedInAt,
    })
    .eq('id', registration.id)

  if (updateError) handleSupabaseError(updateError, 'Check-in update failed')

  return buildResult({
    success: true,
    status: 'checked_in',
    message: formatAdmitMessage(seats, mapped.reservedSeats),
    seats,
    reservedSeats: mapped.reservedSeats,
    ...mapped,
    checkInTimestamp: checkedInAt,
  })
}

export async function updateAdmittedSeats({ registrationId, seatsToAdmit }) {
  const supabase = await ensureScannerSession()
  const seats = Math.max(1, Number(seatsToAdmit) || 1)

  const { registration, error } = await findRegistration(supabase, { registrationId })
  if (error) handleSupabaseError(error, 'Could not look up ticket')

  if (!registration) {
    return buildResult({
      success: false,
      status: 'not_found',
      message: 'Ticket not found',
    }, false)
  }

  if (!registration.checked_in) {
    return buildResult({
      success: false,
      status: 'invalid',
      message: 'This ticket has not been checked in yet.',
    }, false)
  }

  const mapped = mapRegistration(registration)
  const checkedInAt = registration.checked_in_at || new Date().toISOString()

  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      checked_in_seats: seats,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration.id)

  if (updateError) handleSupabaseError(updateError, 'Could not update admission count')

  return buildResult({
    success: true,
    status: 'checked_in',
    message: `Admission updated to ${formatSeatCount(seats)} (reserved ${formatSeatCount(mapped.reservedSeats)}).`,
    seats,
    reservedSeats: mapped.reservedSeats,
    ...mapped,
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

/** @deprecated Use lookupTicket + confirmCheckIn */
export async function verifyTicket({ qrData, ticketId }) {
  if (!supabaseIsConfigured) {
    return verifyTicketViaApi({ qrData, ticketId })
  }

  const lookup = await lookupTicket({ qrData, ticketId })
  if (!lookup.ok || lookup.data.status !== 'ready_to_check_in') {
    return lookup
  }

  return confirmCheckIn({
    registrationId: lookup.data.registrationId,
    seatsToAdmit: lookup.data.reservedSeats,
  })
}

export const CHECK_IN_STATUS = {
  ready_to_check_in: { label: 'Confirm admission', tone: 'warning' },
  checked_in: { label: 'Checked in', tone: 'success' },
  already_checked_in: { label: 'Already checked in', tone: 'warning' },
  multiple_matches: { label: 'Select guest', tone: 'warning' },
  not_found: { label: 'Ticket not found', tone: 'error' },
  invalid: { label: 'Invalid ticket', tone: 'error' },
  event_mismatch: { label: 'Wrong event', tone: 'error' },
  unauthorized: { label: 'Not authorized', tone: 'error' },
  error: { label: 'Error', tone: 'error' },
}
