import { testimonials as defaultTestimonials } from '../data/blog.js'

export const CONTENT_KEYS = {
  homeHero: 'home.hero.v1',
  homeMission: 'home.mission.v1',
  homeJoin: 'home.join.v1',
  homeTestimonials: 'home.testimonials.v1',
  settingsSeason: 'settings.season.v1',
  pageEventsHero: 'page.events.hero.v1',
  pageGalleryHero: 'page.gallery.hero.v1',
  pageBlogHero: 'page.blog.hero.v1',
  settingsSocialLinks: 'settings.social.v1',
}

export const homeHeroDefaults = {
  label: '/ Drama · Choreography · Spoken Word',
  line1: 'MOVEMENT.',
  line2: 'STORY.',
  line2Accent: 'STAGE.',
  tagline: 'A collective of creative youth, proclaiming CHRIST through the arts.',
  backgroundImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1920',
  primaryCtaLabel: 'Buy Tickets',
  secondaryCtaLabel: 'See Shows',
  locationLabel: 'Accra, Ghana · Est. 2013',
}

export const homeMissionDefaults = {
  label: 'Our Mission',
  quote: 'Representing and proclaiming CHRIST through our arts.',
  paragraphs: [
    'Glory Theatre Productions is a Christian youth creative collective based in Accra, Ghana. We use drama, choreography, and spoken word as forms of worship and proclamation — bringing the gospel to life through the performing arts.',
    'Founded in 2013, our collective brings together young artists who are passionate about using their God-given talents to inspire, challenge, and transform audiences through powerful, intentional storytelling.',
    'Every production is an act of worship — a sacred space where movement, story, and stage converge to proclaim the glory of Christ.',
  ],
}

export const homeJoinDefaults = {
  label: 'Join the Collective',
  title: 'Become Part of the Story',
  description: 'Whether you perform, volunteer, or simply believe in what we do — there is a place for you in Glory Theatre Productions.',
  emailPlaceholder: 'your@email.com',
  buttonLabel: 'Stay Connected',
}

export const pageHeroDefaults = {
  events: {
    label: 'Upcoming Shows',
    title: 'Events & Performances',
    subtitle: 'Free entry · RSVP required · Digital tickets',
  },
  gallery: {
    label: 'Visual Gallery',
    title: 'Show the Magic',
    subtitle: 'Production albums · Behind the scenes · In motion',
  },
  blog: {
    label: 'Journal',
    title: 'Stories from the Stage',
    subtitle: 'Rehearsal diaries · Spotlights · Behind the curtain',
  },
}

export const seasonDefaults = { season: 'Season 25–26' }

export const socialLinksDefaults = {
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  tiktok: '',
}

export const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X (Twitter)' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
]

export const testimonialsDefaults = { items: defaultTestimonials }

export function mergeContent(defaults, remote) {
  if (!remote || typeof remote !== 'object') return { ...defaults }
  const merged = { ...defaults }
  for (const [key, value] of Object.entries(remote)) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim() === '' && typeof defaults[key] === 'string' && defaults[key]) {
      continue
    }
    if (Array.isArray(value)) {
      merged[key] = value.length ? value : defaults[key]
    } else if (typeof value === 'object' && !Array.isArray(value) && defaults[key] && typeof defaults[key] === 'object') {
      merged[key] = mergeContent(defaults[key], value)
    } else {
      merged[key] = value
    }
  }
  return merged
}
