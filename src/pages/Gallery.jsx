import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import CategoryFilter from '../components/events/CategoryFilter'
import GalleryAlbums from '../components/gallery/GalleryAlbums'
import { useCms } from '../context/CmsContext'
import { filterAlbums } from '../services/cms/gallery'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Gallery() {
  const { galleryAlbums, galleryCategories, pageHeroes, loading } = useCms()
  const hero = pageHeroes.gallery

  useDocumentTitle(
    'Gallery — Glory Theatre Productions',
    'Browse photo albums from Glory Theatre Productions performances, choreography, spoken word, and behind-the-scenes moments.'
  )
  useScrollReveal(loading)

  const [filter, setFilter] = useState('all')
  const filtered = filterAlbums(galleryAlbums, filter)

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
            {hero.subtitle}
          </p>
        }
      />

      <section className="bg-paper py-8 border-b border-border-light sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <CategoryFilter
            categories={galleryCategories}
            active={filter}
            onChange={setFilter}
            variant="light"
          />
        </div>
      </section>

      <section className="bg-parchment py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="py-20 text-center">
              <p
                className="font-mono text-xs uppercase tracking-widest text-ink-muted"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Loading gallery…
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <GalleryAlbums albums={filtered} />
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
