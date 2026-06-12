import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import CategoryFilter from '../components/events/CategoryFilter'
import AlbumCard from '../components/gallery/AlbumCard'
import { GALLERY_CATEGORIES, filterAlbums } from '../data/gallery'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Gallery() {
  useDocumentTitle(
    'Gallery — Glory Theatre Productions',
    'Browse photo albums from Glory Theatre Productions performances, choreography, spoken word, and behind-the-scenes moments.'
  )
  useScrollReveal()

  const [filter, setFilter] = useState('all')
  const filtered = filterAlbums(filter)

  return (
    <>
      <PageHero
        label="Visual Gallery"
        title="Show the Magic"
        subtitle={
          <p
            className="font-mono text-xs text-cream/80 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Production albums · Behind the scenes · In motion
          </p>
        }
      />

      <section className="bg-paper py-8 border-b border-border-light sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <CategoryFilter
            categories={GALLERY_CATEGORIES}
            active={filter}
            onChange={setFilter}
            variant="light"
          />
        </div>
      </section>

      <section className="bg-parchment py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div data-reveal>
            <SectionLabel className="mb-10">
              {filter === 'all' ? 'All Albums' : GALLERY_CATEGORIES.find((c) => c.slug === filter)?.label}
            </SectionLabel>
          </div>

          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8" key={filter}>
              {filtered.map((album, index) => (
                <AlbumCard key={album.id} album={album} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center" data-reveal>
              <p
                className="font-heading italic text-ink-muted text-2xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                No albums in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
