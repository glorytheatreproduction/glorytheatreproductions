import { TICKET_FONTS, resolveTicketColors } from '../../../shared/tickets/ticketTokens.js'

const F = TICKET_FONTS.weights

export default function TicketClassic({ data, className = '' }) {
  const d = data || {}
  const c = resolveTicketColors({ colors: d.colors, accentColor: d.accentColor })

  return (
    <div
      className={`relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: c.cardBackground,
        fontFamily: TICKET_FONTS.body,
        boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 24px 48px rgba(0,0,0,.12)',
      }}
    >
      <div
        className="h-[14px]"
        style={{
          background: `radial-gradient(circle at 10px 0, transparent 9px, ${c.cardBackground} 10px) repeat-x`,
          backgroundSize: '20px 14px',
        }}
      />

      <div
        className="relative h-[152px] bg-cover bg-center"
        style={{
          backgroundImage: d.eventImageUrl
            ? `url(${d.eventImageUrl})`
            : `linear-gradient(145deg, ${c.headerStart}, ${c.headerEnd})`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-col justify-end px-6 pb-5 pt-4"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.08) 100%)',
          }}
        >
          <span
            className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-white/65"
            style={{ fontFamily: TICKET_FONTS.label, fontWeight: F.label }}
          >
            Admission
          </span>
          <h1
            className="text-[22px] leading-tight tracking-tight text-white"
            style={{ fontFamily: TICKET_FONTS.display, fontWeight: F.display }}
          >
            {d.eventName}
          </h1>
          <p className="mt-1 text-[11px] leading-snug text-white/75" style={{ fontWeight: F.body }}>
            {d.venue}
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-2"
        style={{ background: c.infoBackground, color: c.infoText }}
      >
        {[
          ['Date', d.date, false],
          ['Time', d.time, false],
          ['Amount', d.amount, false],
          ['Ticket', d.ticketId, true],
        ].map(([label, value, mono], index) => (
          <div
            key={label}
            className={`px-5 py-4 ${index % 2 === 0 ? 'border-r border-white/[0.06]' : ''} ${index < 2 ? 'border-b border-white/[0.06]' : ''}`}
          >
            <span
              className="mb-1 block text-[9px] uppercase tracking-[0.14em]"
              style={{ color: c.labelText, fontFamily: TICKET_FONTS.label, fontWeight: F.label }}
            >
              {label}
            </span>
            <span
              className={`block leading-snug ${mono ? 'text-xs tracking-wider' : 'text-sm'}`}
              style={{ fontFamily: TICKET_FONTS.heading, fontWeight: F.heading }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {d.customMessage ? (
        <p
          className="px-5 pt-3 text-[11px] leading-relaxed"
          style={{ background: c.infoBackground, color: c.labelText, fontWeight: F.body }}
        >
          {d.customMessage}
        </p>
      ) : null}

      <div
        className="flex items-center justify-center gap-2 px-6 py-3.5"
        style={{ background: c.infoBackground }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full opacity-90"
            style={{ background: c.cardBackground }}
          />
        ))}
      </div>

      <div className="flex justify-center px-6 pb-7 pt-2" style={{ background: c.infoBackground }}>
        <div
          className="flex flex-col items-center gap-2.5 rounded-xl p-4"
          style={{ background: c.qrBackground }}
        >
          <img src={d.qrDataUrl} alt="QR code preview" className="h-[148px] w-[148px]" />
          <span
            className="text-[9px] uppercase tracking-[0.16em] opacity-55"
            style={{ fontFamily: TICKET_FONTS.label, fontWeight: F.label, color: c.infoBackground }}
          >
            Scan for entry
          </span>
        </div>
      </div>

      <div
        className="h-[14px] rotate-180"
        style={{
          background: `radial-gradient(circle at 10px 0, transparent 9px, ${c.cardBackground} 10px) repeat-x`,
          backgroundSize: '20px 14px',
        }}
      />
    </div>
  )
}
