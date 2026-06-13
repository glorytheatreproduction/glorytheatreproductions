export function parseVideoUrl(url) {
  const trimmed = url?.trim()
  if (!trimmed) return null

  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  )
  if (youtubeMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    }
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return {
      kind: 'embed',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    }
  }

  return {
    kind: 'file',
    src: trimmed,
  }
}

export const MEDIA_POSITIONS = {
  left: 'mr-auto max-w-md',
  center: 'mx-auto max-w-2xl',
  right: 'ml-auto max-w-md',
  full: 'w-full max-w-none',
}
