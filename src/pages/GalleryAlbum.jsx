import { Link, useParams, Navigate } from 'react-router-dom'
import SectionLabel from '../components/ui/SectionLabel'
import AlbumCollageGrid from '../components/gallery/AlbumCollageGrid'
import { useCms } from '../context/CmsContext'
import { getAlbumById } from '../services/cms/gallery'
import { countAlbumPhotos } from '../lib/galleryImages'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function GalleryAlbum() {
  const { albumId } = useParams()
  const { galleryAlbums, getCategoryLabel, loading } = useCms()
  const album = getAlbumById(galleryAlbums, albumId)

  useDocumentTitle(
    album ? `${album.title} — Gallery` : 'Album Not Found',
    album?.description
  )
  useScrollReveal(loading, albumId)

  if (loading) {
    return (
      <section className="bg-parchment py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p
            className="font-mono text-xs uppercase tracking-widest text-ink-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Loading album…
          </p>
        </div>
      </section>
    )
  }

  if (!album) {
    return <Navigate to="/gallery" replace />
  }

  const photoCount = countAlbumPhotos(album.images, album.cover)

  return (
    <>
      <section className="section-dark relative bg-void border-b border-border-dark pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            to="/gallery"
            className="font-mono text-[10px] uppercase tracking-widest text-cream/85 hover:text-gold transition-colors mb-8 inline-block"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ← All Albums
          </Link>

          <p
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-light mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {getCategoryLabel(album.category)}
          </p>
          <h1
            className="font-display text-3xl md:text-5xl text-cream leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {album.title}
          </h1>
          {album.description ? (
            <p className="text-cream/85 text-base leading-relaxed max-w-3xl mb-4">
              {album.description}
            </p>
          ) : null}
          <p
            className="font-mono text-[10px] uppercase tracking-widest text-cream/75"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {album.date} · {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
          </p>
        </div>
      </section>

      <section className="bg-parchment py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionLabel className="mb-8">Album Preview</SectionLabel>
          <AlbumCollageGrid images={album.images} cover={album.cover} albumId={album.id} />
        </div>
      </section>
    </>
  )
}
