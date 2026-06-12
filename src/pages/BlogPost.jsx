import { Link, useParams, Navigate } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import BlogArticle from '../components/blog/BlogArticle'
import RelatedPosts from '../components/blog/RelatedPosts'
import { getPostById, getRelatedPosts } from '../data/blog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function BlogPost() {
  const { postId } = useParams()
  const post = getPostById(postId)

  useDocumentTitle(
    post ? `${post.title} — Glory Theatre Blog` : 'Post Not Found',
    post?.excerpt
  )
  useScrollReveal()

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const related = getRelatedPosts(post)

  return (
    <>
      <PageHero
        label={post.category}
        title={post.title}
        image={post.image}
        titleSize="detail"
        narrow
        backLink={{ to: '/blog', label: 'All Stories' }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-body text-sm text-cream/90">{post.author}</p>
          <span className="text-cream/60 hidden sm:inline">·</span>
          <p
            className="font-mono text-[10px] uppercase tracking-widest text-cream/75"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {post.date} · {post.readTime} read
          </p>
        </div>
      </PageHero>

      {/* Article */}
      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p
            className="font-heading italic text-ink text-xl md:text-2xl leading-relaxed mb-12 pb-12 border-b border-border-light"
            style={{ fontFamily: 'var(--font-heading)' }}
            data-reveal
          >
            {post.excerpt}
          </p>

          <div data-reveal data-reveal-delay="1">
            <BlogArticle content={post.content} />
          </div>

          {/* Author */}
          <div
            data-reveal
            data-reveal-delay="2"
            className="mt-16 pt-8 border-t border-border-light flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Written by
              </p>
              <p className="font-body text-ink font-medium">{post.author}</p>
              <p className="text-ink-muted text-sm">{post.role}</p>
            </div>
            <Link to="/blog" className="gold-link text-sm">
              More Stories →
            </Link>
          </div>

          <RelatedPosts posts={related} />
        </div>
      </section>
    </>
  )
}
