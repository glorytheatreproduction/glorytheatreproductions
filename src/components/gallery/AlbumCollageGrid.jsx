import { Link } from 'react-router-dom'
import { useState } from 'react'
import Lightbox from './Lightbox'
import {
  FB_ALBUM_PREVIEW_COUNT,
  facebookCollageLayout,
  facebookHiddenCount,
  facebookShowsMoreTile,
} from '../../lib/galleryFacebookLayout'

function CollagePhoto({ image, className, onClick }) {
  return (
    <button
      type="button"
      className={`group relative block min-h-0 h-full w-full overflow-hidden bg-surface ${className}`}
      onClick={onClick}
    >
      <img
        src={image.src}
        alt={image.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:brightness-95"
        loading="lazy"
      />
    </button>
  )
}

function MorePhotosTile({ hiddenCount, previewSrc, onClick }) {
  return (
    <button
      type="button"
      className="group relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-void"
      onClick={onClick}
      aria-label={`View ${hiddenCount} more photos`}
    >
      {previewSrc ? (
        <img
          src={previewSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          aria-hidden
        />
      ) : null}
      <span className="absolute inset-0 bg-void/60 transition group-hover:bg-void/50" aria-hidden />
      <span className="relative flex flex-col items-center gap-1 text-cream">
        <span className="text-lg font-medium md:text-xl">+{hiddenCount}</span>
        <span className="text-sm text-cream/90">View more</span>
      </span>
    </button>
  )
}

export default function AlbumCollageGrid({ images = [], albumId }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!images.length) {
    return <p className="text-center text-sm text-ink-muted">No images in this album yet.</p>
  }

  const total = images.length
  const showsMore = facebookShowsMoreTile(total)
  const hiddenCount = facebookHiddenCount(total)
  const previewItems = showsMore ? images.slice(0, FB_ALBUM_PREVIEW_COUNT) : images
  const { gridClass, tiles } = facebookCollageLayout(total)

  return (
    <>
      <div
        className={`grid h-[clamp(13rem,42vw,28rem)] gap-0 overflow-hidden border border-border-light sm:h-[clamp(15rem,38vw,30rem)] md:h-[clamp(17rem,34vw,32rem)] ${gridClass}`}
      >
        {previewItems.map((image, i) => (
          <CollagePhoto
            key={image.id}
            image={image}
            className={tiles[i]?.className || 'col-span-1 row-span-1'}
            onClick={() => setLightboxIndex(i)}
          />
        ))}

        {showsMore ? (
          <div className={tiles[4]?.className || 'col-span-1 row-span-1'}>
            <MorePhotosTile
              hiddenCount={hiddenCount}
              previewSrc={images[4]?.src || ''}
              onClick={() => setLightboxIndex(FB_ALBUM_PREVIEW_COUNT)}
            />
          </div>
        ) : null}
      </div>

      {(showsMore || total > 1 || (albumId && total > FB_ALBUM_PREVIEW_COUNT)) && (
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {showsMore ? (
          <>
            <button
              type="button"
              className="gold-link text-sm font-medium"
              onClick={() => setLightboxIndex(FB_ALBUM_PREVIEW_COUNT)}
            >
              View {hiddenCount} more →
            </button>
            <button
              type="button"
              className="text-sm text-ink-muted transition hover:text-gold"
              onClick={() => setLightboxIndex(0)}
            >
              View all {total} photos
            </button>
          </>
        ) : total > 1 ? (
          <button
            type="button"
            className="gold-link text-sm font-medium"
            onClick={() => setLightboxIndex(0)}
          >
            View more →
          </button>
        ) : null}

        {albumId && total > FB_ALBUM_PREVIEW_COUNT ? (
          <Link to={`/gallery/${albumId}`} className="text-sm text-ink-muted transition hover:text-gold">
            Full album
          </Link>
        ) : null}
      </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
          onNext={() => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
        />
      )}
    </>
  )
}
