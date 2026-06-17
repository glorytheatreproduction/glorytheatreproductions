import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ADMIN_BTN,
  ADMIN_BTN_OUTLINE,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
} from '../../components/admin/adminStyles'
import {
  CHECK_IN_STATUS,
  confirmCheckIn,
  formatSeatCount,
  isTicketIdLookup,
  lookupTicket,
  updateAdmittedSeats,
} from '../../services/checkIn'

const SCANNER_ID = 'ticket-scanner'

function resultTone(tone) {
  if (tone === 'success') return 'border-green-600 bg-green-50 text-green-900'
  if (tone === 'warning') return 'border-amber-500 bg-amber-50 text-amber-950'
  return 'border-burgundy bg-red-50 text-red-950'
}

function SeatStepper({ value, onChange, min = 1, max = 20, disabled = false }) {
  const adjust = (delta) => {
    const next = Math.min(max, Math.max(min, (Number(value) || min) + delta))
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={ADMIN_BTN_OUTLINE}
        onClick={() => adjust(-1)}
        disabled={disabled || Number(value) <= min}
        aria-label="Fewer seats"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className={`${ADMIN_INPUT} w-20 text-center`}
      />
      <button
        type="button"
        className={ADMIN_BTN_OUTLINE}
        onClick={() => adjust(1)}
        disabled={disabled || Number(value) >= max}
        aria-label="More seats"
      >
        +
      </button>
    </div>
  )
}

export default function AdminCheckIn() {
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [nameMatches, setNameMatches] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [pending, setPending] = useState(null)
  const [seatsToAdmit, setSeatsToAdmit] = useState(1)
  const [correcting, setCorrecting] = useState(null)
  const [history, setHistory] = useState([])
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ value: '', at: 0 })

  const recordResult = (data, ok = true) => {
    if (!data?.status) return null
    const meta = CHECK_IN_STATUS[data.status] || CHECK_IN_STATUS.error
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      at: new Date().toLocaleTimeString(),
      status: data.status,
      tone: meta.tone,
      label: meta.label,
      message: data.message || (ok ? '' : 'Check-in failed'),
      attendeeName: data.attendeeName,
      eventName: data.eventName,
      seats: data.seats,
      reservedSeats: data.reservedSeats,
      ticketId: data.ticketId,
      checkInTimestamp: data.checkInTimestamp,
      registrationId: data.registrationId,
    }
    setResult(entry)
    if (data.status === 'checked_in') {
      setHistory((prev) => [entry, ...prev].slice(0, 12))
    }
    return entry
  }

  const handleLookup = useCallback(async ({ qrData, ticketId, guestName, registrationId }) => {
    const key = qrData || ticketId || guestName || registrationId
    const now = Date.now()
    if (key && lastScanRef.current.value === key && now - lastScanRef.current.at < 2500) {
      return
    }
    lastScanRef.current = { value: key, at: now }

    setBusy(true)
    setCorrecting(null)
    setNameMatches(null)
    try {
      const { ok, data } = await lookupTicket({ qrData, ticketId, guestName, registrationId })
      if (!data?.status) {
        throw new Error(data?.message || data?.error || 'Ticket lookup failed')
      }

      if (data.status === 'ready_to_check_in') {
        setPending(data)
        setSeatsToAdmit(data.seatsToAdmit || data.reservedSeats || 1)
        setResult(null)
        return
      }

      if (data.status === 'multiple_matches') {
        setPending(null)
        setNameMatches(data.candidates || [])
        recordResult(data, ok)
        return
      }

      setPending(null)
      recordResult(data, ok)

      if (data.status === 'already_checked_in') {
        setCorrecting({
          registrationId: data.registrationId,
          reservedSeats: data.reservedSeats,
          seatsToAdmit: data.seats || data.admittedSeats || data.reservedSeats || 1,
        })
        setSeatsToAdmit(data.seats || data.admittedSeats || data.reservedSeats || 1)
      }
    } catch (err) {
      setPending(null)
      setResult({
        id: `${Date.now()}`,
        at: new Date().toLocaleTimeString(),
        status: 'error',
        tone: 'error',
        label: 'Error',
        message: err.message,
      })
    } finally {
      setBusy(false)
    }
  }, [])

  const onConfirmCheckIn = async () => {
    if (!pending?.registrationId) return
    setBusy(true)
    try {
      const { ok, data } = await confirmCheckIn({
        registrationId: pending.registrationId,
        seatsToAdmit,
      })
      if (!data?.status) {
        throw new Error(data?.message || 'Check-in failed')
      }
      setPending(null)
      recordResult(data, ok)
    } catch (err) {
      setResult({
        id: `${Date.now()}`,
        at: new Date().toLocaleTimeString(),
        status: 'error',
        tone: 'error',
        label: 'Error',
        message: err.message,
      })
    } finally {
      setBusy(false)
    }
  }

  const onSaveCorrection = async () => {
    if (!correcting?.registrationId) return
    setBusy(true)
    try {
      const { ok, data } = await updateAdmittedSeats({
        registrationId: correcting.registrationId,
        seatsToAdmit,
      })
      if (!data?.status) {
        throw new Error(data?.message || 'Could not update admission count')
      }
      setCorrecting(null)
      recordResult(data, ok)
    } catch (err) {
      setResult({
        id: `${Date.now()}`,
        at: new Date().toLocaleTimeString(),
        status: 'error',
        tone: 'error',
        label: 'Error',
        message: err.message,
      })
    } finally {
      setBusy(false)
    }
  }

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    setScanning(false)
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      await scanner.clear()
    } catch {
      // ignore cleanup errors
    }
  }, [])

  const startScanner = useCallback(async () => {
    await stopScanner()
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner
    setScanning(true)

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => handleLookup({ qrData: decoded }),
        () => {}
      )
    } catch (err) {
      setScanning(false)
      scannerRef.current = null
      setResult({
        id: 'scanner-error',
        at: new Date().toLocaleTimeString(),
        status: 'error',
        tone: 'error',
        label: 'Camera error',
        message: err.message || 'Could not start camera. Use manual ticket entry instead.',
      })
    }
  }, [handleLookup, stopScanner])

  useEffect(() => () => { stopScanner() }, [stopScanner])

  const onManualSubmit = async (e) => {
    e.preventDefault()
    const value = manualId.trim()
    if (!value) return

    if (isTicketIdLookup(value)) {
      await handleLookup({ ticketId: value.padStart(6, '0') })
    } else {
      await handleLookup({ guestName: value })
    }
    setManualId('')
  }

  const onSelectMatch = async (registrationId) => {
    setNameMatches(null)
    await handleLookup({ registrationId })
  }

  const sessionStats = history.reduce(
    (totals, entry) => {
      if (entry.status !== 'checked_in') return totals
      totals.guests += 1
      totals.seats += Number(entry.seats) || 0
      return totals
    },
    { guests: 0, seats: 0 },
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Ticket Check-In</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Scan a ticket, confirm how many guests are actually arriving, and adjust if the party is larger or smaller than reserved.
        </p>
        {sessionStats.guests > 0 ? (
          <p className="mt-2 text-sm font-medium text-ink">
            This session: {sessionStats.guests} guest{sessionStats.guests === 1 ? '' : 's'} checked in ·{' '}
            {formatSeatCount(sessionStats.seats)} admitted
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${ADMIN_PANEL} space-y-4`}>
          <div className="flex flex-wrap gap-2">
            {!scanning ? (
              <button type="button" className={ADMIN_BTN} onClick={startScanner} disabled={busy}>
                Start camera scanner
              </button>
            ) : (
              <button type="button" className={ADMIN_BTN_OUTLINE} onClick={stopScanner} disabled={busy}>
                Stop scanner
              </button>
            )}
          </div>

          <div
            id={SCANNER_ID}
            className={`min-h-[280px] overflow-hidden rounded border border-border-light bg-void ${scanning ? '' : 'hidden'}`}
          />

          {!scanning ? (
            <p className="text-sm text-ink-muted">
              Start the camera on a phone or tablet at the venue entrance, then point it at each guest ticket QR code.
            </p>
          ) : null}

          <form className="space-y-3 border-t border-border-light pt-4" onSubmit={onManualSubmit}>
            <div>
              <label className={ADMIN_LABEL} htmlFor="ticket-lookup">Ticket ID or guest name</label>
              <input
                id="ticket-lookup"
                className={ADMIN_INPUT}
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. 000001 or Elikplim Adzre"
              />
            </div>
            <button type="submit" className={ADMIN_BTN_OUTLINE} disabled={busy || !manualId.trim()}>
              Look up ticket
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {nameMatches?.length ? (
            <div className={`rounded border p-5 ${resultTone('warning')}`}>
              <p className="text-xs uppercase tracking-widest opacity-80">Multiple guests found</p>
              <p className="mt-2 text-sm">Select the correct registration:</p>
              <div className="mt-4 space-y-2">
                {nameMatches.map((candidate) => (
                  <button
                    key={candidate.registrationId}
                    type="button"
                    className={`${ADMIN_BTN_OUTLINE} w-full justify-start text-left`}
                    onClick={() => onSelectMatch(candidate.registrationId)}
                    disabled={busy}
                  >
                    <span className="block font-medium">{candidate.attendeeName}</span>
                    <span className="block text-xs opacity-80">
                      Ticket #{candidate.ticketId || '—'} · {candidate.eventName} · {formatSeatCount(candidate.reservedSeats)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {pending ? (
            <div className={`rounded border p-5 ${resultTone('warning')}`}>
              <p className="text-xs uppercase tracking-widest opacity-80">Confirm admission</p>
              <h2 className="mt-1 font-display text-2xl">{pending.attendeeName}</h2>
              <p className="text-sm">{pending.eventName}</p>
              {pending.ticketId ? <p className="mt-1 font-mono text-sm">Ticket #{pending.ticketId}</p> : null}
              <p className="mt-4 text-sm">
                Reserved: <strong>{formatSeatCount(pending.reservedSeats)}</strong>
              </p>
              <div className="mt-4 space-y-2">
                <label className={ADMIN_LABEL}>Guests to admit now</label>
                <SeatStepper value={seatsToAdmit} onChange={setSeatsToAdmit} disabled={busy} />
                {Number(seatsToAdmit) !== Number(pending.reservedSeats) ? (
                  <p className="text-xs">
                    Adjusted from reserved {formatSeatCount(pending.reservedSeats)} → admit {formatSeatCount(seatsToAdmit)}.
                  </p>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className={ADMIN_BTN} onClick={onConfirmCheckIn} disabled={busy}>
                  Confirm check-in
                </button>
                <button
                  type="button"
                  className={ADMIN_BTN_OUTLINE}
                  onClick={() => { setPending(null); setSeatsToAdmit(1) }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {correcting && !pending ? (
            <div className={`rounded border p-5 ${resultTone('warning')}`}>
              <p className="text-xs uppercase tracking-widest opacity-80">Correct admission count</p>
              <p className="mt-2 text-sm">
                Reserved {formatSeatCount(correcting.reservedSeats)}. Update how many guests were actually admitted.
              </p>
              <div className="mt-4 space-y-2">
                <label className={ADMIN_LABEL}>Guests admitted</label>
                <SeatStepper value={seatsToAdmit} onChange={setSeatsToAdmit} disabled={busy} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className={ADMIN_BTN} onClick={onSaveCorrection} disabled={busy}>
                  Save correction
                </button>
                <button
                  type="button"
                  className={ADMIN_BTN_OUTLINE}
                  onClick={() => setCorrecting(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {result && !pending ? (
            <div className={`rounded border p-5 ${resultTone(result.tone)}`}>
              <p className="text-xs uppercase tracking-widest opacity-80">{result.at}</p>
              <h2 className="mt-1 font-display text-2xl">{result.label}</h2>
              {result.status === 'checked_in' && result.seats ? (
                <div className="mt-4 inline-flex min-w-[120px] flex-col items-center rounded border border-current/20 bg-white/50 px-6 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">Admitted</p>
                  <p className="font-display text-5xl leading-none">{result.seats}</p>
                  <p className="mt-1 text-sm font-medium">{formatSeatCount(result.seats)}</p>
                  {result.reservedSeats && Number(result.reservedSeats) !== Number(result.seats) ? (
                    <p className="mt-2 text-xs opacity-80">
                      Reserved {formatSeatCount(result.reservedSeats)}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-3 text-sm">{result.message}</p>
              {result.attendeeName ? <p className="mt-3 font-medium">Guest: {result.attendeeName}</p> : null}
              {result.ticketId ? <p className="text-sm font-mono">Ticket #{result.ticketId}</p> : null}
              {result.eventName ? <p className="text-sm">Event: {result.eventName}</p> : null}
              {result.status === 'already_checked_in' && !correcting ? (
                <button
                  type="button"
                  className={`${ADMIN_BTN_OUTLINE} mt-4`}
                  onClick={() => {
                    setCorrecting({
                      registrationId: result.registrationId,
                      reservedSeats: result.reservedSeats,
                      seatsToAdmit: result.seats || result.reservedSeats || 1,
                    })
                    setSeatsToAdmit(result.seats || result.reservedSeats || 1)
                  }}
                >
                  Correct admission count
                </button>
              ) : null}
              {result.checkInTimestamp ? (
                <p className="mt-2 text-xs opacity-80">
                  Checked in: {new Date(result.checkInTimestamp).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}

          {!result && !pending ? (
            <div className={`${ADMIN_PANEL} text-sm text-ink-muted`}>
              Scan results will appear here. You can adjust seat counts before confirming.
            </div>
          ) : null}

          <div className={`${ADMIN_PANEL} space-y-3`}>
            <h3 className="font-medium text-ink">Recent scans</h3>
            {history.length === 0 ? (
              <p className="text-sm text-ink-muted">No tickets checked in yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="rounded border border-border-light px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.label}</span>
                    <span className="text-xs text-ink-muted">{entry.at}</span>
                  </div>
                  {entry.attendeeName ? <p className="text-ink-muted">{entry.attendeeName}</p> : null}
                  {entry.seats ? (
                    <p className="text-xs font-medium text-ink">
                      Admitted: {formatSeatCount(entry.seats)}
                      {entry.reservedSeats && Number(entry.reservedSeats) !== Number(entry.seats)
                        ? ` (reserved ${formatSeatCount(entry.reservedSeats)})`
                        : ''}
                    </p>
                  ) : null}
                  <p className="text-xs text-ink-muted">{entry.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
