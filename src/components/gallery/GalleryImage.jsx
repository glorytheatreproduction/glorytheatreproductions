import { useEffect, useMemo, useState } from 'react'
import { resolveCmsImageUrl } from '../../lib/cmsImage'

export default function GalleryImage({
  src,
  alt = '',
  className = '',
  priority = false,
  placeholderClassName = 'bg-gradient-to-br from-stage via-void to-burgundy/30',
  ...props
}) {
  const resolvedSrc = useMemo(() => resolveCmsImageUrl(src), [src])
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [resolvedSrc])

  const requestSrc = useMemo(() => {
    if (!resolvedSrc || attempt === 0) return resolvedSrc
    const joiner = resolvedSrc.includes('?') ? '&' : '?'
    return `${resolvedSrc}${joiner}retry=${attempt}`
  }, [resolvedSrc, attempt])

  if (!resolvedSrc || failed) {
    return (
      <div
        className={`${placeholderClassName} ${className}`}
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      />
    )
  }

  return (
    <img
      src={requestSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => {
        if (attempt < 2) {
          setAttempt((value) => value + 1)
          return
        }
        setFailed(true)
      }}
      {...props}
    />
  )
}
