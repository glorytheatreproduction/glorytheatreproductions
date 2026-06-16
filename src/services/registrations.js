import { getSupabase } from '../lib/supabaseClient'
import { invokeEdgeFunction } from '../lib/invokeEdgeFunction'
import { buildCsv, downloadCsv, formatExportDate } from '../lib/exportCsv'

export function mapRegistrationRow(row) {
  if (!row) return null
  return {
    id: row.id,
    eventId: row.event_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    seats: row.seats,
    ticketId: row.ticket_id,
    qrPayload: row.qr_payload,
    pngUrl: row.png_url,
    pdfUrl: row.pdf_url,
    ticketStatus: row.ticket_status,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    checkedInSeats: row.checked_in_seats,
    createdAt: row.created_at,
  }
}

export async function createRegistration({ eventId, fullName, email, phone, seats }) {
  const { data, error } = await getSupabase().rpc('create_public_registration', {
    p_event_id: eventId,
    p_full_name: fullName,
    p_email: email || '',
    p_phone: phone || '',
    p_seats: seats || 1,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return mapRegistrationRow(row)
}

export async function fetchRegistrationCountsByEvent() {
  const { data, error } = await getSupabase().rpc('registration_counts_by_event')
  if (error) throw error
  return Object.fromEntries((data || []).map((row) => [row.event_id, Number(row.registration_count)]))
}

export async function fetchRegistrationsByEvent(eventId) {
  const { data, error } = await getSupabase()
    .from('registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapRegistrationRow)
}

export async function fetchTicketErrors(registrationId) {
  const { data, error } = await getSupabase()
    .from('ticket_generation_errors')
    .select('*')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data || []
}

export async function regenerateTicket(registrationId) {
  return invokeEdgeFunction('generate-ticket', { registration_id: registrationId })
}

export async function regenerateAllTickets(eventId, onProgress) {
  const registrations = await fetchRegistrationsByEvent(eventId)
  let done = 0
  const failures = []

  for (const reg of registrations) {
    try {
      await regenerateTicket(reg.id)
    } catch (err) {
      failures.push({ id: reg.id, message: err.message })
    }
    done += 1
    onProgress?.({ done, total: registrations.length, failures })
  }

  return { total: registrations.length, failures }
}

export const TICKET_STATUS_LABELS = {
  pending: 'Pending',
  generated: 'Generated',
  failed: 'Failed',
}

function slugifyFilename(value) {
  return String(value || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'event'
}

export function downloadRegistrationsCsv(registrations, { eventTitle, checkedInOnly = false } = {}) {
  const rows = checkedInOnly ? registrations.filter((row) => row.checkedIn) : registrations

  const headers = [
    'Guest Name',
    'Email',
    'Phone',
    'Reserved Seats',
    'Admitted Seats',
    'Ticket ID',
    'Ticket Status',
    'Checked In',
    'Checked In At',
    'Registered At',
  ]

  const data = rows.map((row) => [
    row.fullName,
    row.email,
    row.phone,
    row.seats,
    row.checkedIn ? (row.checkedInSeats ?? row.seats) : '',
    row.ticketId || '',
    TICKET_STATUS_LABELS[row.ticketStatus] || row.ticketStatus,
    row.checkedIn ? 'Yes' : 'No',
    formatExportDate(row.checkedInAt),
    formatExportDate(row.createdAt),
  ])

  const suffix = checkedInOnly ? '-checked-in' : '-registrations'
  const filename = `${slugifyFilename(eventTitle)}${suffix}.csv`
  downloadCsv(filename, buildCsv(headers, data))
  return { filename, count: rows.length }
}
