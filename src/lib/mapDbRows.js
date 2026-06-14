import { resolveCmsImageUrl } from './cmsImage'
import { normalizeAlbumImages } from './galleryImages'

function normalizeBackgroundMusic(raw) {
  if (!raw || typeof raw !== 'object') {
    return { url: '', title: '', artist: '' }
  }
  return {
    url: resolveCmsImageUrl(raw.url || ''),
    title: raw.title || '',
    artist: raw.artist || '',
  }
}

function serializeBackgroundMusic(music) {
  if (!music?.url?.trim()) return {}
  return {
    url: music.url.trim(),
    title: music.title?.trim() || '',
    artist: music.artist?.trim() || '',
  }
}

export function mapEventRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    longDescription: row.long_description,
    category: row.category,
    categorySlug: row.category_slug,
    day: row.day,
    month: row.month,
    year: row.year,
    dateLabel: row.date_label,
    time: row.time,
    venue: row.venue,
    image: resolveCmsImageUrl(row.image),
    availability: row.availability,
    featured: row.featured,
    tags: row.tags || [],
    capacity: row.capacity,
    entryType: row.entry_type,
    maxSeatsPerRsvp: row.max_seats_per_rsvp,
    published: row.published,
    sortOrder: row.sort_order,
    ticketTemplate: row.ticket_template || 'sacred_stage',
    ticketSettings: row.ticket_settings || {},
  }
}

export function mapEventToRow(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    long_description: event.longDescription || '',
    category: event.category || '',
    category_slug: event.categorySlug || '',
    day: event.day ?? null,
    month: event.month || '',
    year: event.year ?? null,
    date_label: event.dateLabel || '',
    time: event.time || '',
    venue: event.venue || '',
    image: event.image || '',
    availability: event.availability || 'Seats Available',
    featured: Boolean(event.featured),
    tags: event.tags || [],
    capacity: event.capacity ?? 100,
    entry_type: event.entryType || 'free',
    max_seats_per_rsvp: event.maxSeatsPerRsvp ?? 4,
    published: event.published !== false,
    sort_order: event.sortOrder ?? 0,
    ticket_template: event.ticketTemplate || 'sacred_stage',
    ticket_settings: event.ticketSettings || {},
  }
}

export function mapAlbumRow(row) {
  if (!row) return null
  const images = normalizeAlbumImages(row.images)
  const cover = resolveCmsImageUrl(row.cover) || images[0]?.src || ''
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    date: row.date,
    cover,
    images,
    published: row.published,
    sortOrder: row.sort_order,
  }
}

export function mapAlbumToRow(album) {
  return {
    id: album.id,
    title: album.title,
    description: album.description || '',
    category: album.category || 'drama',
    date: album.date || '',
    cover: album.cover || '',
    images: album.images || [],
    published: album.published !== false,
    sort_order: album.sortOrder ?? 0,
  }
}

export function mapBlogRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    categorySlug: row.category_slug,
    date: row.date,
    readTime: row.read_time,
    image: resolveCmsImageUrl(row.image),
    author: row.author,
    role: row.role,
    featured: row.featured,
    content: Array.isArray(row.content) ? row.content : [],
    backgroundMusic: normalizeBackgroundMusic(row.background_music),
    published: row.published,
    reviewStatus: row.review_status || 'draft',
    sortOrder: row.sort_order,
  }
}

export function mapBlogToRow(post) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || '',
    category: post.category || '',
    category_slug: post.categorySlug || '',
    date: post.date || '',
    read_time: post.readTime || '5 min',
    image: post.image || '',
    author: post.author || '',
    role: post.role || '',
    featured: Boolean(post.featured),
    content: post.content || [],
    background_music: serializeBackgroundMusic(post.backgroundMusic),
    published: post.published === true,
    review_status: post.reviewStatus || 'draft',
    sort_order: post.sortOrder ?? 0,
  }
}

export function mapMediaRow(row) {
  if (!row) return null
  return {
    id: row.id,
    folder: row.folder,
    bucket: row.bucket,
    path: row.path,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    alt: row.alt,
    title: row.title,
    createdAt: row.created_at,
  }
}
