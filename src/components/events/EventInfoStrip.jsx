const items = [
  { label: 'Free', sub: 'Entry' },
  { label: 'RSVP', sub: 'Required' },
  { label: 'Digital', sub: 'Tickets' },
]

export default function EventInfoStrip() {
  return (
    <div
      className="flex flex-wrap justify-center gap-8 md:gap-12 py-8 border-b border-border-light bg-parchment"
      data-reveal
    >
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-8 md:gap-12">
          {i > 0 && <div className="hidden sm:block w-px h-8 bg-border-light" />}
          <div className="text-center">
            <p
              className="font-display text-2xl text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item.label}
            </p>
            <p
              className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mt-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {item.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
