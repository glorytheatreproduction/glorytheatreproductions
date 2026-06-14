import { resolveCmsImageUrl } from './cmsImage'

function parseImagesField(raw) {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? raw : []
}

export function normalizeGalleryImage(image, index = 0) {
  if (typeof image === 'string') {
    const src = resolveCmsImageUrl(image)
    if (!src) return null
    return { id: `photo-${index + 1}`, src, title: '' }
  }

  if (!image || typeof image !== 'object') return null

  const src = resolveCmsImageUrl(image.src || image.url || image.publicUrl || image.public_url || '')
  if (!src) return null

  return {
    ...image,
    id: image.id || `photo-${index + 1}`,
    src,
    title: image.title || image.caption || '',
  }
}

export function normalizeAlbumImages(raw) {
  return parseImagesField(raw)
    .map((image, index) => normalizeGalleryImage(image, index))
    .filter(Boolean)
}

export function getAlbumVisibleImages(images = [], cover = '') {
  const normalized = normalizeAlbumImages(images)
  if (normalized.length) return normalized

  const coverSrc = resolveCmsImageUrl(cover)
  if (coverSrc) {
    return [{ id: 'cover', src: coverSrc, title: 'Album cover' }]
  }

  return []
}

export function countAlbumPhotos(images = [], cover = '') {
  return getAlbumVisibleImages(images, cover).length
}
