import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import CategoryFilter from '../components/events/CategoryFilter'
import EventTab from '../components/events/EventTab'
import EventInfoStrip from '../components/events/EventInfoStrip'
import FeaturedEventBanner from '../components/events/FeaturedEventBanner'
import { useCms } from '../context/CmsContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Events() {
  const { events, season, categories, pageHeroes } = useCms()

  useDocumentTitle(
    'Events & Productions — Glory Theatre Productions',
    'Browse upcoming events and productions from Glory Theatre Productions. Free entry — reserve your digital ticket online.'
  )
  useScrollReveal()

  const [filter, setFilter] = useState('all')
  const hero = pageHeroes.events

  const featured = events.find((e) => e.featured)
  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.categorySlug === filter)

  const showBanner = featured && (filter === 'all' || featured.categorySlug === filter)
  const tabEvents = filtered.filter((e) => !(showBanner && e.featured))

  return (
    <>
      <PageHero
        label={hero.label}
        title={hero.title}
        subtitle={
          <p
            className="font-mono text-xs text-cream/80 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {season}
          </p>
        }
      />

      <EventInfoStrip />

      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {showBanner && <FeaturedEventBanner />}

          <div data-reveal className="mb-12">
            <SectionLabel className="mb-6">Filter by Category</SectionLabel>
            <CategoryFilter
              categories={categories}
              active={filter}
              onChange={setFilter}
              variant="light"
            />
          </div>

          {tabEvents.length > 0 && (
            <div data-reveal data-reveal-delay="1">
              <SectionLabel className="mb-6">
                {showBanner ? 'Other Events' : 'All Events'}
              </SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {tabEvents.map((event, index) => (
                  <EventTab key={event.id} event={event} index={index} />
                ))}
              </div>
            </div>
          )}

          <div data-reveal data-reveal-delay="1">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p
                  className="font-heading italic text-ink-muted text-2xl"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  No events match this category.
                </p>
                <p className="text-ink-muted/60 text-sm mt-4">
                  Try selecting a different filter or check back soon.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
