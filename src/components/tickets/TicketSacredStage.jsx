import { TICKET_FONTS, resolveTicketColors } from '../../../shared/tickets/ticketTokens.js'

const F = TICKET_FONTS.weights

export default function TicketSacredStage({ data, className = '' }) {
  const d = data || {}
  const c = resolveTicketColors({ colors: d.colors, accentColor: d.accentColor })

  return (
    <div
      className={`relative mx-auto grid min-h-[300px] w-full max-w-[840px] grid-cols-[38%_1fr] overflow-hidden rounded-2xl ${className}`}
      style={{
        fontFamily: TICKET_FONTS.body,
        boxShadow: '0 4px 6px rgba(0,0,0,.05), 0 20px 40px rgba(0,0,0,.14)',
      }}
    >
      <div
        className="absolute z-10 h-9 w-[18px] -translate-y-1/2 rounded-full"
        style={{ left: 'calc(38% - 9px)', top: '50%', background: c.stubNotchColor }}
      />
      <div
        className="absolute -right-[9px] top-1/2 z-10 h-9 w-[18px] -translate-y-1/2 rounded-full"
        style={{ background: c.stubNotchColor }}
      />

      <div className="relative bg-cover bg-center" style={{ backgroundColor: c.imagePanelColor }}>
        {d.eventImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${d.eventImageUrl})` }}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.15) 0%, transparent 40%, transparent 100%)' }}
        />
      </div>

      <div
        className="relative flex flex-col gap-5 px-8 py-7"
        style={{ background: c.accentColor, color: c.panelTextColor }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <span
              className="mb-2 block text-[9px] uppercase tracking-[0.22em] opacity-70"
              style={{ fontFamily: TICKET_FONTS.label, fontWeight: F.label }}
            >
              Glory Theatre
            </span>
            <h1
              className="text-[26px] leading-tight tracking-tight"
              style={{ fontFamily: TICKET_FONTS.display, fontWeight: F.display }}
            >
              {d.eventName}
            </h1>
            <p className="mt-2 text-xs leading-snug opacity-82" style={{ fontWeight: F.body }}>
              {d.venue}
            </p>
            <p
              className="mt-2.5 text-base leading-tight tracking-tight"
              style={{ fontFamily: TICKET_FONTS.heading, fontWeight: F.heading }}
            >
              {d.attendeeName}
            </p>
          </div>

          <div
            className="flex shrink-0 flex-col items-center gap-2 rounded-[10px] p-3"
            style={{ background: c.qrBackground }}
          >
            <img src={d.qrDataUrl} alt="QR code preview" className="h-[88px] w-[88px]" />
            <span
              className="text-[8px] uppercase tracking-[0.18em]"
              style={{ fontFamily: TICKET_FONTS.label, fontWeight: F.label, color: c.accentColor }}
            >
              Scan here
            </span>
          </div>
        </div>

        <div
          className="h-px"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.25), rgba(255,255,255,.08))' }}
        />

        <div className="grid grid-cols-4 gap-4">
          {[
            ['Ticket', d.ticketId],
            ['Date', d.date],
            ['Time', d.time],
            ['Cost', d.amount],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <span
                className="mb-1 block text-[8px] uppercase tracking-[0.16em] opacity-65"
                style={{ fontFamily: TICKET_FONTS.label, fontWeight: F.label }}
              >
                {label}
              </span>
              <span
                className="block text-[15px] leading-tight tracking-tight"
                style={{ fontFamily: TICKET_FONTS.heading, fontWeight: F.heading }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {d.customMessage ? (
          <p className="-mt-1 text-[11px] leading-relaxed opacity-78" style={{ fontWeight: F.body }}>
            {d.customMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}
