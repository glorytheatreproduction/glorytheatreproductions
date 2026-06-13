import { Link } from 'react-router-dom'
import { ADMIN_PANEL } from '../../components/admin/adminStyles'
import { useCms } from '../../context/CmsContext'
import { useAuth } from '../../context/AuthContext'

const cards = [
  { to: '/admin/home', title: 'Home Page', desc: 'Hero, mission, join CTA, testimonials, season label' },
  { to: '/admin/events', title: 'Events', desc: 'Shows, dates, images, RSVP capacity' },
  { to: '/admin/gallery', title: 'Gallery', desc: 'Albums and photo collages' },
  { to: '/admin/blog', title: 'Blog', desc: 'Articles and featured posts' },
  { to: '/admin/media', title: 'Media', desc: 'Upload and manage images' },
  { to: '/admin/members', title: 'Members', desc: 'Invite blog writers and manage CMS roles', adminOnly: true },
]

export default function AdminDashboard() {
  const { cmsEnabled, events, galleryAlbums, blogPosts } = useCms()
  const { isAdmin } = useAuth()

  const visibleCards = cards.filter((card) => !card.adminOnly || isAdmin)

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {cmsEnabled ? 'Your changes publish to the live site.' : 'Sample content is shown until the CMS is fully connected.'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{events.length}</p><p className="text-sm text-ink-muted">Events</p></div>
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{galleryAlbums.length}</p><p className="text-sm text-ink-muted">Albums</p></div>
        <div className={ADMIN_PANEL}><p className="text-2xl font-display text-ink">{blogPosts.length}</p><p className="text-sm text-ink-muted">Blog posts</p></div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {visibleCards.map(({ to, title, desc }) => (
          <Link key={to} to={to} className={`${ADMIN_PANEL} transition hover:border-gold/40`}>
            <h2 className="font-display text-xl text-ink">{title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
