export const GALLERY_CATEGORIES = [
  { label: 'All Albums', slug: 'all' },
  { label: 'Drama', slug: 'drama' },
  { label: 'Choreography', slug: 'choreography' },
  { label: 'Spoken Word', slug: 'spoken-word' },
  { label: 'Behind the Scenes', slug: 'behind-scenes' },
]

export const galleryAlbums = [
  {
    id: 'the-enchanted-stage',
    title: 'The Enchanted Stage',
    description:
      'Faith and fantasy intertwine on the Main Stage — from costume fittings to the finale curtain call.',
    category: 'drama',
    date: 'March 2024',
    cover: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200',
    images: [
      {
        id: 'es-1',
        src: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200',
        title: 'Opening Night',
      },
      {
        id: 'es-2',
        src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
        title: 'Stage Design',
      },
      {
        id: 'es-3',
        src: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
        title: 'Costume Design',
      },
      {
        id: 'es-4',
        src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
        title: 'Finale Scene',
      },
    ],
  },
  {
    id: 'rhythm-and-motion',
    title: 'Rhythm & Motion',
    description:
      'Contemporary dance in worship — movement sequences, ensemble lifts, and the language of resurrection.',
    category: 'choreography',
    date: 'February 2024',
    cover: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
    images: [
      {
        id: 'rm-1',
        src: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
        title: 'Ensemble Opening',
      },
      {
        id: 'rm-2',
        src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
        title: 'Dance Performance',
      },
      {
        id: 'rm-3',
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
        title: 'Choreography Session',
      },
    ],
  },
  {
    id: 'city-lights',
    title: 'City Lights',
    description:
      'Spoken word under city glow — monologues, ensemble pieces, and the pulse of urban worship.',
    category: 'spoken-word',
    date: 'January 2024',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
    images: [
      {
        id: 'cl-1',
        src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
        title: 'City Lights Performance',
      },
      {
        id: 'cl-2',
        src: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200',
        title: 'Musical Number',
      },
      {
        id: 'cl-3',
        src: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
        title: 'Ensemble Performance',
      },
    ],
  },
  {
    id: 'behind-the-scenes',
    title: 'Behind the Scenes',
    description:
      'The quiet hours before the lights rise — rehearsals, makeup, prayer circles, and preparation.',
    category: 'behind-scenes',
    date: 'Season 25–26',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
    images: [
      {
        id: 'bts-1',
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
        title: 'Rehearsal Moments',
      },
      {
        id: 'bts-2',
        src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
        title: 'Makeup & Preparation',
      },
      {
        id: 'bts-3',
        src: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200',
        title: 'Pre-Show Circle',
      },
    ],
  },
  {
    id: 'christian-creatives-workshop',
    title: 'Christian Creatives Workshop',
    description:
      'Young artists discovering movement, storytelling, and spoken word as tools for worship.',
    category: 'choreography',
    date: 'March 2026',
    cover: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
    images: [
      {
        id: 'ccw-1',
        src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200',
        title: 'Workshop Warm-Up',
      },
      {
        id: 'ccw-2',
        src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
        title: 'Creative Session',
      },
    ],
  },
]

export function getAlbumById(id) {
  return galleryAlbums.find((album) => album.id === id) ?? null
}

export function filterAlbums(category = 'all') {
  if (category === 'all') return galleryAlbums
  return galleryAlbums.filter((album) => album.category === category)
}

export function getCategoryLabel(slug) {
  return GALLERY_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}
