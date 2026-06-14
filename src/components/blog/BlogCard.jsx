import { Link } from 'react-router-dom'
import CmsImage from '../ui/CmsImage'

export default function BlogCard({ post }) {
  return (
    <article className="group bg-paper border border-border-light overflow-hidden transition-all duration-300 hover:border-gold/30">
      <Link to={`/blog/${post.id}`} className="block overflow-hidden">
        <CmsImage
          src={post.image}
          alt={post.title}
          className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="p-6">
        <span
          className="font-mono text-[10px] uppercase tracking-widest text-gold"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {post.category}
        </span>

        <Link to={`/blog/${post.id}`}>
          <h3
            className="font-display text-xl text-ink mt-3 mb-3 group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4 transition-all"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {post.title}
          </h3>
        </Link>

        <p className="text-ink-muted text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <p
            className="font-mono text-[10px] text-ink-muted uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {post.date} · {post.readTime} read
          </p>
          <Link to={`/blog/${post.id}`} className="gold-link text-sm">
            Read →
          </Link>
        </div>
      </div>
    </article>
  )
}
