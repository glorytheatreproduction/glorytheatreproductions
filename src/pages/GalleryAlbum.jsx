import { useParams, Navigate } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import MasonryGrid from '../components/gallery/MasonryGrid'
import { getAlbumById, getCategoryLabel } from '../data/gallery'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function GalleryAlbum() {
  const { albumId } = useParams()
  const album = getAlbumById(albumId)

  useDocumentTitle(
    album ? `${album.title} — Gallery` : 'Album Not Found',
    album?.description
  )
  useScrollReveal()

  if (!album) {
    return <Navigate to="/gallery" replace />
  }

  const photoCount = album.images.length

  return (
    <>
      <PageHero
        label={getCategoryLabel(album.category)}
        title={album.title}
        image={album.cover}
        titleSize="detail"
        backLink={{ to: '/gallery', label: 'All Albums' }}
      >
        <p
          className="font-mono text-[10px] uppercase tracking-widest text-cream/75"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {album.date} · {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
        </p>
      </PageHero>

      <section className="bg-parchment py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <p
            className="font-heading italic text-ink text-xl md:text-2xl leading-relaxed max-w-3xl mb-12"
            style={{ fontFamily: 'var(--font-heading)' }}
            data-reveal
          >
            {album.description}
          </p>

          <MasonryGrid images={album.images} />
        </div>
      </section>
    </>
  )
}
