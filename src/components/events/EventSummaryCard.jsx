import DateBlock from '../ui/DateBlock'
import AvailabilityBadge from '../ui/AvailabilityBadge'
import CmsImage from '../ui/CmsImage'

export default function EventSummaryCard({ event }) {
  return (
    <div className="bg-parchment border border-border-light p-6 md:p-8">
      <div className="overflow-hidden mb-6 -mx-6 md:-mx-8 -mt-6 md:-mt-8">
        <CmsImage
          src={event.image}
          alt={event.title}
          className="w-full aspect-[16/10] object-cover"
        />
      </div>

      <DateBlock day={event.day} month={event.month} className="mb-4" />

      <h2
        className="font-display text-2xl text-ink leading-tight mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {event.title}
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AvailabilityBadge status={event.availability} />
        <span
          className="px-3 py-1 bg-gold-light text-gold-muted text-[10px] font-mono uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {event.category}
        </span>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Date
          </dt>
          <dd className="text-ink-muted">{event.dateLabel}</dd>
        </div>
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Time
          </dt>
          <dd className="text-ink-muted">{event.time}</dd>
        </div>
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Venue
          </dt>
          <dd className="text-ink-muted">{event.venue}</dd>
        </div>
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Entry
          </dt>
          <dd className="text-ink-muted">Free — ticket required for entry</dd>
        </div>
      </dl>
    </div>
  )
}
