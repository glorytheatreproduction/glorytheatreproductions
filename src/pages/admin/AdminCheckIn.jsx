import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ADMIN_BTN,
  ADMIN_BTN_OUTLINE,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
} from '../../components/admin/adminStyles'
import { CHECK_IN_STATUS, verifyTicket } from '../../services/checkIn'

const SCANNER_ID = 'ticket-scanner'

function resultTone(tone) {
  if (tone === 'success') return 'border-green-600 bg-green-50 text-green-900'
  if (tone === 'warning') return 'border-amber-500 bg-amber-50 text-amber-950'
  return 'border-burgundy bg-red-50 text-red-950'
}

export default function AdminCheckIn() {
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ value: '', at: 0 })

  const handleScanResult = useCallback(async ({ qrData, ticketId }) => {
    const key = qrData || ticketId
    const now = Date.now()
    if (key && lastScanRef.current.value === key && now - lastScanRef.current.at < 2500) {
      return
    }
    lastScanRef.current = { value: key, at: now }

    setBusy(true)
    try {
      const { ok, data } = await verifyTicket({ qrData, ticketId })
      if (!data?.status) {
        throw new Error(data?.message || data?.error || 'Check-in failed')
      }
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
        checkInTimestamp: data.checkInTimestamp,
      }
      setResult(entry)
      setHistory((prev) => [entry, ...prev].slice(0, 12))
    } catch (err) {
      const entry = {
        id: `${Date.now()}`,
        at: new Date().toLocaleTimeString(),
        status: 'error',
        tone: 'error',
        label: 'Error',
        message: err.message,
      }
      setResult(entry)
      setHistory((prev) => [entry, ...prev].slice(0, 12))
    } finally {
      setBusy(false)
    }
  }, [])

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
        (decoded) => handleScanResult({ qrData: decoded }),
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
  }, [handleScanResult, stopScanner])

  useEffect(() => () => { stopScanner() }, [stopScanner])

  const onManualSubmit = async (e) => {
    e.preventDefault()
    const ticketId = manualId.trim()
    if (!ticketId) return
    await handleScanResult({ ticketId })
    setManualId('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Ticket Check-In</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Scan QR codes on guest tickets or enter a ticket ID manually to verify entry.
        </p>
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
              <label className={ADMIN_LABEL} htmlFor="ticket-id">Manual ticket ID</label>
              <input
                id="ticket-id"
                className={ADMIN_INPUT}
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. 000001"
              />
            </div>
            <button type="submit" className={ADMIN_BTN_OUTLINE} disabled={busy || !manualId.trim()}>
              Verify ticket
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {result ? (
            <div className={`rounded border p-5 ${resultTone(result.tone)}`}>
              <p className="text-xs uppercase tracking-widest opacity-80">{result.at}</p>
              <h2 className="mt-1 font-display text-2xl">{result.label}</h2>
              <p className="mt-2 text-sm">{result.message}</p>
              {result.attendeeName ? <p className="mt-3 font-medium">Guest: {result.attendeeName}</p> : null}
              {result.eventName ? <p className="text-sm">Event: {result.eventName}</p> : null}
              {result.seats ? <p className="text-sm">Seats: {result.seats}</p> : null}
              {result.checkInTimestamp ? <p className="mt-2 text-xs opacity-80">Checked in: {result.checkInTimestamp}</p> : null}
            </div>
          ) : (
            <div className={`${ADMIN_PANEL} text-sm text-ink-muted`}>
              Scan results will appear here.
            </div>
          )}

          <div className={`${ADMIN_PANEL} space-y-3`}>
            <h3 className="font-medium text-ink">Recent scans</h3>
            {history.length === 0 ? (
              <p className="text-sm text-ink-muted">No tickets scanned yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="rounded border border-border-light px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.label}</span>
                    <span className="text-xs text-ink-muted">{entry.at}</span>
                  </div>
                  {entry.attendeeName ? <p className="text-ink-muted">{entry.attendeeName}</p> : null}
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
