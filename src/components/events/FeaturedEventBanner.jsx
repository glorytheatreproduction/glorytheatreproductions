import { Link } from 'react-router-dom'
import SectionLabel from '../ui/SectionLabel'
import DateBlock from '../ui/DateBlock'
import AvailabilityBadge from '../ui/AvailabilityBadge'
import GoldButton from '../ui/GoldButton'
import { useCms } from '../../context/CmsContext'

export default function FeaturedEventBanner() {
  const { events } = useCms()
  const featured = events.find((e) => e.featured)
  if (!featured) return null

  return (
    <div data-reveal className="mb-16 -mx-6 md:-mx-0">
      <div className="grid md:grid-cols-2 w-full min-h-[48vh] md:min-h-[52vh] border border-border-light bg-surface overflow-hidden">
        <div className="relative overflow-hidden min-h-[240px] md:min-h-0 h-full group">
          <img
            src={featured.image}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute top-6 left-6">
            <span
              className="px-3 py-1 bg-gold text-void text-[10px] font-mono uppercase tracking-wider font-medium"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Featured
            </span>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-center h-full min-h-[240px]">
          <SectionLabel className="mb-4">Upcoming Event</SectionLabel>
          <DateBlock day={featured.day} month={featured.month} className="mb-4" />

          <h2
            className="font-display text-3xl md:text-4xl text-ink leading-tight mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link to={`/events/${featured.id}`} className="hover:text-gold transition-colors">
              {featured.title}
            </Link>
          </h2>

          <p className="text-ink-muted text-sm md:text-base leading-relaxed mb-4 max-w-lg">
            {featured.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <AvailabilityBadge status={featured.availability} />
            <span
              className="font-mono text-[10px] text-gold-muted uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {featured.dateLabel} · {featured.venue}
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <GoldButton to={`/events/${featured.id}/tickets`}>Reserve Seat</GoldButton>
            <Link to={`/events/${featured.id}`} className="gold-link text-sm self-center">
              Event Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
