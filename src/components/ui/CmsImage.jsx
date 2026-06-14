import { sanitizeImageUrl } from '../../lib/cmsImage'

export default function CmsImage({
  src,
  alt = '',
  className = '',
  placeholderClassName = 'bg-gradient-to-br from-stage via-void to-burgundy/40',
  ...props
}) {
  const url = sanitizeImageUrl(src)

  if (!url) {
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
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      {...props}
    />
  )
}
