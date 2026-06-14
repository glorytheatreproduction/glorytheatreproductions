import { Link } from 'react-router-dom'
import { useState } from 'react'
import Lightbox from './Lightbox'
import GalleryImage from './GalleryImage'
import {
  FB_ALBUM_PREVIEW_COUNT,
  facebookCollageLayout,
  facebookHiddenCount,
  facebookShowsMoreTile,
} from '../../lib/galleryFacebookLayout'
import { getAlbumVisibleImages } from '../../lib/galleryImages'

function CollagePhoto({ image, className, onClick, priority = false }) {
  return (
    <button
      type="button"
      className={`group relative m-0 block min-h-0 h-full w-full overflow-hidden border-0 bg-void p-0 ${className}`}
      onClick={onClick}
    >
      <GalleryImage
        src={image.src}
        alt={image.title || 'Album photo'}
        priority={priority}
        className="absolute inset-0 block h-full w-full object-cover object-center transition duration-200 group-hover:brightness-95"
        draggable={false}
      />
    </button>
  )
}

function MorePhotosTile({ hiddenCount, previewSrc, onClick }) {
  return (
    <button
      type="button"
      className="group relative m-0 flex h-full min-h-0 w-full items-center justify-center overflow-hidden border-0 bg-void p-0"
      onClick={onClick}
      aria-label={`View ${hiddenCount} more photos`}
    >
      <GalleryImage
        src={previewSrc}
        alt=""
        priority
        className="absolute inset-0 block h-full w-full object-cover object-center"
        draggable={false}
        aria-hidden
      />
      <span className="absolute inset-0 bg-void/60 transition group-hover:bg-void/50" aria-hidden />
      <span className="relative flex flex-col items-center gap-1 text-cream">
        <span className="text-lg font-medium md:text-xl">+{hiddenCount}</span>
        <span className="text-sm text-cream/90">View more</span>
      </span>
    </button>
  )
}

export default function AlbumCollageGrid({ images = [], cover = '', albumId }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const visibleImages = getAlbumVisibleImages(images, cover)

  if (!visibleImages.length) {
    return <p className="text-center text-sm text-ink-muted">No images in this album yet.</p>
  }

  const total = visibleImages.length
  const showsMore = facebookShowsMoreTile(total)
  const hiddenCount = facebookHiddenCount(total)
  const previewCount = showsMore ? FB_ALBUM_PREVIEW_COUNT : total
  const previewItems = visibleImages.slice(0, previewCount)
  const { gridClass, tiles } = facebookCollageLayout(total)
  const morePreviewSrc = visibleImages[FB_ALBUM_PREVIEW_COUNT]?.src
    || visibleImages[visibleImages.length - 1]?.src
    || visibleImages[0].src

  return (
    <>
      <div
        className={`gallery-collage grid h-[clamp(13rem,42vw,28rem)] gap-0 overflow-hidden bg-void leading-[0] sm:h-[clamp(15rem,38vw,30rem)] md:h-[clamp(17rem,34vw,32rem)] ${gridClass}`}
      >
        {previewItems.map((image, i) => (
          <CollagePhoto
            key={`${image.id || image.src}-${i}`}
            image={image}
            priority={i === 0}
            className={tiles[i]?.className || 'col-span-1 row-span-1'}
            onClick={() => setLightboxIndex(Math.min(i, total - 1))}
          />
        ))}

        {showsMore ? (
          <div className={`min-h-0 h-full ${tiles[4]?.className || 'col-span-1 row-span-1'}`}>
            <MorePhotosTile
              hiddenCount={hiddenCount}
              previewSrc={morePreviewSrc}
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
          images={visibleImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : visibleImages.length - 1))}
          onNext={() => setLightboxIndex((i) => (i < visibleImages.length - 1 ? i + 1 : 0))}
        />
      )}
    </>
  )
}
