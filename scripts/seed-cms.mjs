#!/usr/bin/env node
import { loadEnvLocal } from './loadEnvLocal.js'
loadEnvLocal()

import { createNodeClient } from '../shared/lib/supabaseNode.js'
import { events, SEASON } from '../src/data/events.js'
import { galleryAlbums } from '../src/data/gallery.js'
import { blogPosts, testimonials } from '../src/data/blog.js'
import {
  CONTENT_KEYS,
  homeHeroDefaults,
  homeJoinDefaults,
  homeMissionDefaults,
  pageHeroDefaults,
} from '../src/config/contentDefaults.js'
import { mapAlbumToRow, mapBlogToRow, mapEventToRow } from '../src/lib/mapDbRows.js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createNodeClient(url, serviceKey)

const siteRows = [
  { key: CONTENT_KEYS.homeHero, value: homeHeroDefaults },
  { key: CONTENT_KEYS.homeMission, value: homeMissionDefaults },
  { key: CONTENT_KEYS.homeJoin, value: homeJoinDefaults },
  { key: CONTENT_KEYS.settingsSeason, value: { season: SEASON } },
  { key: CONTENT_KEYS.pageEventsHero, value: pageHeroDefaults.events },
  { key: CONTENT_KEYS.pageGalleryHero, value: pageHeroDefaults.gallery },
  { key: CONTENT_KEYS.pageBlogHero, value: pageHeroDefaults.blog },
  { key: CONTENT_KEYS.homeTestimonials, value: { items: testimonials } },
]

console.log('Seeding site content…')
for (const row of siteRows) {
  const { error } = await supabase.from('site_content').upsert({ key: row.key, value: row.value })
  if (error) throw new Error(`site_content ${row.key}: ${error.message}`)
}

console.log('Seeding events…')
const eventRows = events.map((event, index) => ({ ...mapEventToRow(event), sort_order: index }))
const { error: eventsError } = await supabase.from('events').upsert(eventRows)
if (eventsError) throw new Error(eventsError.message)

console.log('Seeding gallery albums…')
const albumRows = galleryAlbums.map((album, index) => ({ ...mapAlbumToRow(album), sort_order: index }))
const { error: galleryError } = await supabase.from('gallery_albums').upsert(albumRows)
if (galleryError) throw new Error(galleryError.message)

console.log('Seeding blog posts…')
const blogRows = blogPosts.map((post, index) => ({ ...mapBlogToRow(post), sort_order: index }))
const { error: blogError } = await supabase.from('blog_posts').upsert(blogRows)
if (blogError) throw new Error(blogError.message)

console.log('Seed complete.')
