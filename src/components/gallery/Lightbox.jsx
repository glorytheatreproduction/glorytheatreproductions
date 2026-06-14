import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import GalleryImage from './GalleryImage'

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const current = images[currentIndex]
  const total = images.length
  const hasMultiple = total > 1

  const goNext = useCallback(() => {
    onNext()
  }, [onNext])

  const goPrev = useCallback(() => {
    onPrev()
  }, [onPrev])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, goNext, goPrev])

  if (!current) return null

  const navBtnClass =
    'absolute top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-void/70 text-cream transition hover:border-gold/80 hover:bg-void/90 disabled:opacity-30'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-void/90 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[2] rounded-full border border-cream/30 bg-void/70 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-cream transition hover:border-gold/80 hover:text-gold"
        style={{ fontFamily: 'var(--font-mono)' }}
        onClick={onClose}
      >
        Close
      </button>

      {hasMultiple ? (
        <>
          <button
            type="button"
            className={`${navBtnClass} left-3 sm:left-6`}
            onClick={goPrev}
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`${navBtnClass} right-3 sm:right-6`}
            onClick={goNext}
            aria-label="Next image"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p
            className="absolute bottom-4 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-void/70 px-3 py-1 font-mono text-xs text-cream/90"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {currentIndex + 1} / {total}
          </p>
        </>
      ) : null}

      <figure
        className="relative z-[1] max-h-[90vh] max-w-4xl px-12 text-center sm:px-16"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GalleryImage
          key={`${current.src}-${currentIndex}`}
          src={current.src}
          alt={current.title || 'Album photo'}
          priority
          className="max-h-[80vh] max-w-full object-contain"
        />
        {current.title ? (
          <figcaption
            className="mt-3 font-mono text-sm uppercase tracking-widest text-gold-light"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {current.title}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body
  )
}
