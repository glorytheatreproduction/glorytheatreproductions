import { getSupabase, supabaseIsConfigured } from '../lib/supabaseClient'
import { createRegistration } from './registrations'

export async function submitRsvp({
  eventId,
  name,
  email,
  phone,
  seats,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
}) {
  if (supabaseIsConfigured && eventId) {
    const registration = await createRegistration({
      eventId,
      fullName: name,
      email,
      phone,
      seats,
    })

    return {
      success: true,
      message: 'RSVP confirmed! Your ticket will arrive by email shortly.',
      ticketID: registration.ticketId || 'Pending',
      registrationId: registration.id,
      email,
    }
  }

  const response = await fetch('/api/rsvp-handler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone: phone || '',
      seats,
      eventName,
      eventDate,
      eventTime,
      eventVenue,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Unable to complete reservation. Please try again.')
  }

  return data
}

export async function getRegistrationStatus(registrationId) {
  const { data, error } = await getSupabase().rpc('get_registration_ticket_status', {
    p_registration_id: registrationId,
  })

  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}
