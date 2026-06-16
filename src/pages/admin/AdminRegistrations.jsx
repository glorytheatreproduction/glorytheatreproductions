import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ADMIN_BTN,
  ADMIN_BTN_OUTLINE,
  ADMIN_PANEL,
} from '../../components/admin/adminStyles'
import { fetchAllEvents } from '../../services/cms/events'
import {
  TICKET_STATUS_LABELS,
  fetchRegistrationCountsByEvent,
  fetchRegistrationsByEvent,
  fetchTicketErrors,
  regenerateAllTickets,
  regenerateTicket,
} from '../../services/registrations'

export default function AdminRegistrations() {
  const [events, setEvents] = useState([])
  const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [bulkProgress, setBulkProgress] = useState(null)
  const [errorsByReg, setErrorsByReg] = useState({})
  const [registrationCounts, setRegistrationCounts] = useState({})

  const loadEvents = async () => {
    setLoading(true)
    try {
      const [items, counts] = await Promise.all([
        fetchAllEvents(),
        fetchRegistrationCountsByEvent().catch(() => ({})),
      ])
      setEvents(items)
      setRegistrationCounts(counts)

      if (!eventId && items.length) {
        const withRegs = items
          .filter((event) => counts[event.id] > 0)
          .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
        const published = items.filter((event) => event.published)
        const fallback = withRegs[0] || published[0] || items[0]
        setEventId(fallback.id)
      }
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadRegistrations = async (id = eventId) => {
    if (!id) return
    setLoading(true)
    setStatus('')
    try {
      const registrations = await fetchRegistrationsByEvent(id)
      setRows(registrations)
      const errorMap = {}
      await Promise.all(registrations.filter((r) => r.ticketStatus === 'failed').map(async (reg) => {
        errorMap[reg.id] = await fetchTicketErrors(reg.id)
      }))
      setErrorsByReg(errorMap)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])
  useEffect(() => { if (eventId) loadRegistrations(eventId) }, [eventId])

  const onRegenerate = async (registrationId) => {
    setStatus('')
    try {
      await regenerateTicket(registrationId)
      await loadRegistrations()
      setStatus('Ticket regeneration started.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  const onRegenerateAll = async () => {
    if (!eventId || !window.confirm('Regenerate tickets for all registrations for this event?')) return
    setBulkProgress({ done: 0, total: rows.length, failures: [] })
    setStatus('')
    try {
      const result = await regenerateAllTickets(eventId, setBulkProgress)
      await loadRegistrations()
      setStatus(
        result.failures.length
          ? `Regenerated ${result.total - result.failures.length}/${result.total}. ${result.failures.length} failed.`
          : `Regenerated ${result.total} ticket${result.total === 1 ? '' : 's'}.`
      )
    } catch (err) {
      setStatus(err.message)
    } finally {
      setBulkProgress(null)
    }
  }

  const selectedEvent = events.find((e) => e.id === eventId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Registrations</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage attendee tickets and regenerate after design changes.</p>
        </div>
        {selectedEvent ? (
          <Link to={`/admin/events`} className={ADMIN_BTN_OUTLINE}>
            Edit ticket design
          </Link>
        ) : null}
      </div>

      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      {Object.values(errorsByReg).flat().some((err) => /resend|gmail|domain is not verified/i.test(err.error_message || '')) ? (
        <div className="rounded border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Ticket emails are failing because the sender is not verified in Resend. Verify{' '}
          <strong>glorytheatreproduction@gmail.com</strong> at{' '}
          <a href="https://resend.com/emails" target="_blank" rel="noreferrer" className="underline">
            resend.com/emails
          </a>
          , then use Regenerate on affected tickets.
        </div>
      ) : null}
      {bulkProgress ? (
        <p className="text-sm text-gold-muted">
          Regenerating… {bulkProgress.done}/{bulkProgress.total}
        </p>
      ) : null}

      <div className={`${ADMIN_PANEL} flex flex-wrap items-end gap-4`}>
        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-ink-muted">Event</label>
          <select
            className="w-full rounded border border-border-light bg-paper px-3 py-2 text-sm"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
                {registrationCounts[event.id] ? ` (${registrationCounts[event.id]})` : ''}
                {!event.published ? ' — draft' : ''}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => loadRegistrations()} disabled={!eventId}>
          Refresh
        </button>
        <button type="button" className={ADMIN_BTN} onClick={onRegenerateAll} disabled={!rows.length || bulkProgress}>
          Regenerate all tickets
        </button>
      </div>

      <div className={`${ADMIN_PANEL} overflow-x-auto`}>
        {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
        {!loading && !rows.length ? (
          <p className="text-sm text-ink-muted">No registrations for this event yet.</p>
        ) : null}
        {rows.length ? (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-light text-ink-muted">
                <th className="py-2 pr-4">Guest</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Seats</th>
                <th className="py-2 pr-4">Ticket ID</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Files</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border-light/70">
                  <td className="py-3 pr-4">{row.fullName}</td>
                  <td className="py-3 pr-4">{row.email}</td>
                  <td className="py-3 pr-4">{row.seats}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{row.ticketId || '—'}</td>
                  <td className="py-3 pr-4">{TICKET_STATUS_LABELS[row.ticketStatus] || row.ticketStatus}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {row.pdfUrl ? <a href={row.pdfUrl} target="_blank" rel="noreferrer" className="text-gold-muted hover:text-gold">PDF</a> : null}
                      {row.pngUrl ? <a href={row.pngUrl} target="_blank" rel="noreferrer" className="text-gold-muted hover:text-gold">PNG</a> : null}
                    </div>
                    {errorsByReg[row.id]?.[0]?.error_message ? (
                      <p className="mt-1 text-xs text-burgundy-light">{errorsByReg[row.id][0].error_message}</p>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => onRegenerate(row.id)}>
                      Regenerate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  )
}
