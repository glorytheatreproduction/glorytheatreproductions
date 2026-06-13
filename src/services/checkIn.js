import { getSupabase } from '../lib/supabaseClient'

export async function verifyTicket({ qrData, ticketId }) {
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

export const CHECK_IN_STATUS = {
  checked_in: { label: 'Checked in', tone: 'success' },
  already_checked_in: { label: 'Already checked in', tone: 'warning' },
  not_found: { label: 'Ticket not found', tone: 'error' },
  invalid: { label: 'Invalid ticket', tone: 'error' },
  event_mismatch: { label: 'Wrong event', tone: 'error' },
  unauthorized: { label: 'Not authorized', tone: 'error' },
  error: { label: 'Error', tone: 'error' },
}
