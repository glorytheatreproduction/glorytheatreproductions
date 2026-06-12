import { useState } from 'react'
import Lightbox from './Lightbox'

export default function MasonryGrid({ images }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const openLightbox = (index) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = () => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  const goNext = () => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0))

  return (
    <>
      <div className="masonry-grid">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            data-reveal
            data-reveal-delay={String((index % 3) + 1)}
            className="masonry-item relative overflow-hidden group cursor-pointer w-full block"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-auto"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-void/80 px-4 py-3">
              <p
                className="font-mono text-xs text-gold uppercase tracking-widest text-left"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {image.title}
              </p>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  )
}
