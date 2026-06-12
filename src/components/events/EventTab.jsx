import { Link } from 'react-router-dom'

export default function EventTab({ event, index = 0 }) {
  return (
    <Link
      to={`/events/${event.id}`}
      data-reveal
      data-reveal-delay={String((index % 4) + 1)}
      className="group relative block aspect-square overflow-hidden border border-border-light bg-surface transition-all duration-300 hover:border-gold/50 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(26,20,16,0.12)]"
    >
      <img
        src={event.image}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/35 to-void/10" />

      <div className="absolute top-3 left-3">
        <span
          className="block font-mono font-medium text-cream text-lg leading-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {event.day}
        </span>
        <span
          className="block font-mono text-[9px] uppercase tracking-widest text-cream/75 mt-0.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {event.month}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <span
          className="block font-mono text-[8px] uppercase tracking-widest text-gold-light mb-1 line-clamp-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {event.category}
        </span>
        <h3
          className="font-display text-sm text-cream leading-snug line-clamp-2 group-hover:text-gold transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {event.title}
        </h3>
      </div>
    </Link>
  )
}
