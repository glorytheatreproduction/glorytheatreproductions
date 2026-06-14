import { Link } from 'react-router-dom'
import CmsImage from '../ui/CmsImage'

export default function FeaturedPost({ post }) {
  return (
    <article
      className="grid lg:grid-cols-[55%_45%] gap-0 border border-border-light bg-parchment overflow-hidden"
      data-reveal
    >
      <Link to={`/blog/${post.id}`} className="overflow-hidden block group">
        <CmsImage
          src={post.image}
          alt={post.title}
          className="w-full h-full min-h-[300px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="p-8 md:p-12 flex flex-col justify-center">
        <span
          className="font-mono text-[10px] uppercase tracking-widest text-gold mb-4"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {post.category}
        </span>

        <Link to={`/blog/${post.id}`}>
          <h2
            className="font-display text-3xl md:text-4xl text-ink leading-tight mb-4 hover:text-gold transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {post.title}
          </h2>
        </Link>

        <p className="text-ink-muted text-base leading-relaxed mb-6">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div>
            <p className="font-body text-sm font-medium text-ink">{post.author}</p>
            <p
              className="font-mono text-[10px] text-ink-muted uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {post.role} · {post.readTime} read
            </p>
          </div>
        </div>

        <Link to={`/blog/${post.id}`} className="gold-link text-sm self-start">
          Read Full Story →
        </Link>
      </div>
    </article>
  )
}
