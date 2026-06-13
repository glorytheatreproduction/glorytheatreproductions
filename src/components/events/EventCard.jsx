import { Link } from 'react-router-dom'
import DateBlock from '../ui/DateBlock'
import AvailabilityBadge from '../ui/AvailabilityBadge'
import { isEventBookable } from '../../services/cms/events'

export default function EventCard({ event, visible = true }) {
  const bookable = isEventBookable(event)

  return (
    <article
      className={`group grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-6 md:gap-10 py-10 border-b border-border-light transition-all duration-300 ${
        visible ? 'event-item-enter' : 'event-item-exit pointer-events-none'
      } hover:translate-x-1 hover:border-l-4 hover:border-l-gold hover:pl-4`}
    >
      <DateBlock day={event.day} month={event.month} />

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className="px-3 py-1 border border-border-light text-ink-muted text-[10px] font-mono uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {event.category}
          </span>
        </div>

        <Link to={`/events/${event.id}`}>
          <h3
            className="font-display text-2xl md:text-3xl text-ink mb-3 group-hover:text-gold transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {event.title}
          </h3>
        </Link>

        <p className="text-ink-muted text-sm leading-relaxed max-w-2xl mb-3">
          {event.description}
        </p>

        <p
          className="font-mono text-[11px] text-gold-muted uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {event.dateLabel} · {event.time} · {event.venue}
        </p>
      </div>

      <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-4">
        <AvailabilityBadge status={event.availability} />
        {bookable ? (
          <Link to={`/events/${event.id}/tickets`} className="gold-link text-sm whitespace-nowrap">
            Get Tickets →
          </Link>
        ) : (
          <Link to={`/events/${event.id}`} className="text-ink-muted text-sm whitespace-nowrap">
            View Details →
          </Link>
        )}
      </div>
    </article>
  )
}
