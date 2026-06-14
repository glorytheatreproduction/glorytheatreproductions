import { sanitizeImageUrl } from '../../shared/lib/cmsImage.js'
import { getPublicStorageUrl, supabaseIsConfigured, supabaseUrl } from './supabaseClient'

/** Resolve CMS image values to a browser-loadable URL. */
export function resolveCmsImageUrl(url) {
  const sanitized = sanitizeImageUrl(url)
  if (!sanitized) return ''

  if (/^https?:\/\//i.test(sanitized) || sanitized.startsWith('data:') || sanitized.startsWith('blob:')) {
    return sanitized
  }

  if (sanitized.startsWith('/storage/v1/object/public/')) {
    const base = supabaseUrl?.replace(/\/$/, '')
    return base ? `${base}${sanitized}` : sanitized
  }

  if (sanitized.startsWith('/')) {
    return sanitized
  }

  if (supabaseIsConfigured) {
    return getPublicStorageUrl(sanitized)
  }

  return sanitized
}

export {
  sanitizeImageUrl,
  hasUsableImage,
  TICKET_QR_PREVIEW_DATA_URL,
} from '../../shared/lib/cmsImage.js'
