import { Link } from 'react-router-dom'
import { ADMIN_PANEL } from '../../components/admin/adminStyles'
import { useCms } from '../../context/CmsContext'

const cards = [
  { to: '/admin/home', title: 'Home Page', desc: 'Hero, mission, join CTA, testimonials, season label' },
  { to: '/admin/events', title: 'Events', desc: 'Shows, dates, images, RSVP capacity' },
  { to: '/admin/gallery', title: 'Gallery', desc: 'Albums and photo collages' },
  { to: '/admin/blog', title: 'Blog', desc: 'Articles and featured posts' },
  { to: '/admin/media', title: 'Media', desc: 'Upload and manage images' },
]

export default function AdminDashboard() {
  const { cmsEnabled, events, galleryAlbums, blogPosts } = useCms()

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {cmsEnabled ? 'Connected to Supabase CMS.' : 'Using local defaults — configure Supabase to enable live editing.'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{events.length}</p><p className="text-sm text-ink-muted">Events</p></div>
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{galleryAlbums.length}</p><p className="text-sm text-ink-muted">Albums</p></div>
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{blogPosts.length}</p><p className="text-sm text-ink-muted">Blog posts</p></div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(({ to, title, desc }) => (
          <Link key={to} to={to} className={`${ADMIN_PANEL} transition hover:border-gold/40`}>
            <h2 className="font-display text-xl text-ink">{title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
