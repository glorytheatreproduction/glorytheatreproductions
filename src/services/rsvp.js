const RSVP_ENDPOINT = '/.netlify/functions/rsvp-handler'

export async function submitRsvp({
  name,
  email,
  phone,
  seats,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
}) {
  const response = await fetch(RSVP_ENDPOINT, {
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
