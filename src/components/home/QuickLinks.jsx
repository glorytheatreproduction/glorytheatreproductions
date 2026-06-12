import { Link } from 'react-router-dom'
import SectionLabel from '../ui/SectionLabel'

const links = [
  {
    number: '01',
    title: 'Upcoming Events',
    description: 'Discover our exciting lineup of performances and special events happening this season.',
    to: '/events',
  },
  {
    number: '02',
    title: 'Latest Blog Posts',
    description: 'Read behind-the-scenes stories, artist interviews, and insights into our creative process.',
    to: '/blog',
  },
  {
    number: '03',
    title: 'Photo Gallery',
    description: 'Explore stunning moments captured from our performances and productions.',
    to: '/gallery',
  },
]

export default function QuickLinks() {
  return (
    <section className="bg-parchment py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div data-reveal>
          <SectionLabel className="mb-12">Explore</SectionLabel>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {links.map((link, i) => (
            <Link
              key={link.number}
              to={link.to}
              data-reveal
              data-reveal-delay={String(i + 1)}
              className="relative block p-8 bg-paper border border-border-light transition-colors hover:border-gold/40 group"
            >
              <span
                className="absolute top-4 right-6 font-display text-[80px] leading-none text-gold-light opacity-60 select-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {link.number}
              </span>

              <h3
                className="font-display text-2xl text-ink mb-4 relative z-10"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {link.title}
              </h3>

              <p className="text-ink-muted text-sm leading-relaxed mb-6 relative z-10">
                {link.description}
              </p>

              <span className="gold-link text-sm relative z-10">Explore →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
