async function loadNodeClient() {
  const { createNodeClient } = await import('../../shared/lib/supabaseNode.js')
  return createNodeClient
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return { url, serviceKey }
}

async function findRegistration(supabase, { ticketId, registrationId }) {
  const select = 'id, event_id, full_name, email, phone, seats, ticket_id, checked_in, checked_in_at, events(title)'

  if (registrationId) {
    const { data, error } = await supabase
      .from('registrations')
      .select(select)
      .eq('id', registrationId)
      .maybeSingle()
    if (error) throw error
    return data
  }

  if (ticketId) {
    const { data, error } = await supabase
      .from('registrations')
      .select(select)
      .eq('ticket_id', ticketId)
      .maybeSingle()
    if (error) throw error
    return data
  }

  return null
}

async function checkInViaSupabase({ ticketId, registrationId, eventId }) {
  const config = getSupabaseAdmin()
  if (!config) return null

  const createNodeClient = await loadNodeClient()
  const supabase = createNodeClient(config.url, config.serviceKey)

  const registration = await findRegistration(supabase, { ticketId, registrationId })
  if (!registration) {
    return {
      handled: true,
      statusCode: 404,
      body: {
        success: false,
        status: 'not_found',
        message: 'Ticket not found',
      },
    }
  }

  const eventName = registration.events?.title || registration.event_id

  if (eventId && registration.event_id !== eventId) {
    return {
      handled: true,
      statusCode: 400,
      body: {
        success: false,
        status: 'event_mismatch',
        message: 'Ticket does not match this event',
        ticketEvent: eventName,
      },
    }
  }

  if (registration.checked_in) {
    return {
      handled: true,
      statusCode: 200,
      body: {
        success: false,
        status: 'already_checked_in',
        message: 'Guest already checked in',
        attendeeName: registration.full_name,
        eventName,
        seats: registration.seats,
        checkInTimestamp: registration.checked_in_at,
      },
    }
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

  if (updateError) throw updateError

  return {
    handled: true,
    statusCode: 200,
    body: {
      success: true,
      status: 'checked_in',
      message: 'Check-in successful',
      attendeeName: registration.full_name,
      eventName,
      seats: registration.seats,
      checkInTimestamp: checkedInAt,
    },
  }
}

module.exports = {
  checkInViaSupabase,
  getSupabaseAdmin,
}
