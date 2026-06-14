import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  CONTENT_KEYS,
  homeHeroDefaults,
  homeJoinDefaults,
  homeMissionDefaults,
  mergeContent,
  pageHeroDefaults,
  seasonDefaults,
  socialLinksDefaults,
  testimonialsDefaults,
} from '../config/contentDefaults'
import { events as defaultEvents, SEASON as defaultSeason, CATEGORIES } from '../data/events'
import { galleryAlbums as defaultAlbums, GALLERY_CATEGORIES, getCategoryLabel } from '../data/gallery'
import { sortAlbumsByDate } from '../lib/albumDates'
import { blogPosts as defaultPosts, BLOG_CATEGORIES, testimonials as defaultTestimonials } from '../data/blog'
import { supabaseIsConfigured } from '../lib/supabaseClient'
import { fetchPublishedPosts } from '../services/cms/blog'
import { fetchPublishedEvents } from '../services/cms/events'
import { fetchPublishedAlbums } from '../services/cms/gallery'
import { fetchAllSiteContent } from '../services/cms/siteContent'

const CmsContext = createContext(null)

export function CmsProvider({ children }) {
  const [loading, setLoading] = useState(supabaseIsConfigured)
  const [events, setEvents] = useState(defaultEvents)
  const [season, setSeason] = useState(defaultSeason)
  const [galleryAlbums, setGalleryAlbums] = useState(sortAlbumsByDate(defaultAlbums))
  const [blogPosts, setBlogPosts] = useState(defaultPosts)
  const [testimonials, setTestimonials] = useState(defaultTestimonials)
  const [homeHero, setHomeHero] = useState(homeHeroDefaults)
  const [homeMission, setHomeMission] = useState(homeMissionDefaults)
  const [homeJoin, setHomeJoin] = useState(homeJoinDefaults)
  const [pageHeroes, setPageHeroes] = useState(pageHeroDefaults)
  const [socialLinks, setSocialLinks] = useState(socialLinksDefaults)

  const load = useCallback(async () => {
    if (!supabaseIsConfigured) {
      setLoading(false)
      return
    }

    try {
      const [eventsResult, albumsResult, postsResult, contentResult] = await Promise.allSettled([
        fetchPublishedEvents(),
        fetchPublishedAlbums(),
        fetchPublishedPosts(),
        fetchAllSiteContent(),
      ])

      if (eventsResult.status === 'fulfilled' && eventsResult.value !== null) {
        const remoteEvents = eventsResult.value
        setEvents(remoteEvents.length > 0 ? remoteEvents : defaultEvents)
      } else if (eventsResult.status === 'rejected') {
        console.error('[CMS] failed to load events, using defaults', eventsResult.reason)
      }

      if (albumsResult.status === 'fulfilled' && albumsResult.value !== null) {
        const remoteAlbums = albumsResult.value
        setGalleryAlbums(remoteAlbums.length > 0 ? remoteAlbums : sortAlbumsByDate(defaultAlbums))
      } else if (albumsResult.status === 'rejected') {
        console.error('[CMS] failed to load gallery, using defaults', albumsResult.reason)
      }

      if (postsResult.status === 'fulfilled' && postsResult.value !== null) {
        const remotePosts = postsResult.value
        setBlogPosts(remotePosts.length > 0 ? remotePosts : defaultPosts)
      } else if (postsResult.status === 'rejected') {
        console.error('[CMS] failed to load blog posts, using defaults', postsResult.reason)
      }

      const siteContent = contentResult.status === 'fulfilled' ? contentResult.value : {}
      if (contentResult.status === 'rejected') {
        console.error('[CMS] failed to load site content, using defaults', contentResult.reason)
      }

      setHomeHero(mergeContent(homeHeroDefaults, siteContent[CONTENT_KEYS.homeHero]))
      setHomeMission(mergeContent(homeMissionDefaults, siteContent[CONTENT_KEYS.homeMission]))
      setHomeJoin(mergeContent(homeJoinDefaults, siteContent[CONTENT_KEYS.homeJoin]))
      setSeason(mergeContent(seasonDefaults, siteContent[CONTENT_KEYS.settingsSeason]).season)
      setTestimonials(
        mergeContent(testimonialsDefaults, siteContent[CONTENT_KEYS.homeTestimonials]).items || defaultTestimonials
      )
      setPageHeroes({
        events: mergeContent(pageHeroDefaults.events, siteContent[CONTENT_KEYS.pageEventsHero]),
        gallery: mergeContent(pageHeroDefaults.gallery, siteContent[CONTENT_KEYS.pageGalleryHero]),
        blog: mergeContent(pageHeroDefaults.blog, siteContent[CONTENT_KEYS.pageBlogHero]),
      })
      setSocialLinks(mergeContent(socialLinksDefaults, siteContent[CONTENT_KEYS.settingsSocialLinks]))
    } catch (err) {
      console.error('[CMS] unexpected load failure, using defaults', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const value = useMemo(
    () => ({
      loading,
      events,
      season,
      galleryAlbums,
      blogPosts,
      testimonials,
      homeHero,
      homeMission,
      homeJoin,
      pageHeroes,
      socialLinks,
      categories: CATEGORIES,
      galleryCategories: GALLERY_CATEGORIES,
      blogCategories: BLOG_CATEGORIES,
      getCategoryLabel,
      refetch: load,
      cmsEnabled: supabaseIsConfigured,
    }),
    [
      loading,
      events,
      season,
      galleryAlbums,
      blogPosts,
      testimonials,
      homeHero,
      homeMission,
      homeJoin,
      pageHeroes,
      socialLinks,
      load,
    ]
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}
