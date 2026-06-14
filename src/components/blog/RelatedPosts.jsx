import { Link } from 'react-router-dom'
import SectionLabel from '../ui/SectionLabel'
import CmsImage from '../ui/CmsImage'

export default function RelatedPosts({ posts }) {
  if (!posts.length) return null

  return (
    <section className="border-t border-border-light pt-16 mt-16" data-reveal>
      <SectionLabel className="mb-8">Related Stories</SectionLabel>

      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="group block border border-border-light bg-paper overflow-hidden hover:border-gold/30 transition-colors"
          >
            <div className="overflow-hidden">
              <CmsImage
                src={post.image}
                alt={post.title}
                className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-5">
              <span
                className="font-mono text-[10px] uppercase tracking-widest text-gold"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {post.category}
              </span>
              <h3
                className="font-display text-lg text-ink mt-2 leading-snug group-hover:text-gold transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {post.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
