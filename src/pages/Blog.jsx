import { useState, useMemo } from 'react'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import CategoryFilter from '../components/events/CategoryFilter'
import FeaturedPost from '../components/blog/FeaturedPost'
import BlogCard from '../components/blog/BlogCard'
import BlogSearch from '../components/blog/BlogSearch'
import { useCms } from '../context/CmsContext'
import { filterPosts } from '../services/cms/blog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Blog() {
  const { blogPosts, blogCategories, pageHeroes } = useCms()
  const hero = pageHeroes.blog

  useDocumentTitle(
    'Blog & Stories — Glory Theatre Productions',
    'Read behind-the-scenes stories, rehearsal diaries, artist spotlights, and articles from Glory Theatre Productions.'
  )
  useScrollReveal()

  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const featured = blogPosts.find((p) => p.featured)
  const showFeatured = featured && category === 'all' && !search.trim()

  const filtered = useMemo(() => {
    const posts = filterPosts(blogPosts, { category, search })
    return showFeatured ? posts.filter((p) => !p.featured) : posts
  }, [blogPosts, category, search, showFeatured])

  return (
    <>
      <PageHero
        label={hero.label}
        title={hero.title}
        subtitle={
          <p className="text-cream/85 text-base max-w-xl">
            {hero.subtitle}
          </p>
        }
      />

      <section className="bg-parchment py-8 border-b border-border-light sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <BlogSearch value={search} onChange={setSearch} />
          <CategoryFilter
            categories={blogCategories}
            active={category}
            onChange={setCategory}
            variant="light"
          />
        </div>
      </section>

      {showFeatured && (
        <section className="bg-paper pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <SectionLabel className="mb-8">Featured Story</SectionLabel>
            <FeaturedPost post={featured} />
          </div>
        </section>
      )}

      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div data-reveal>
            <SectionLabel>
              {search.trim() ? 'Search Results' : 'Latest Stories'}
            </SectionLabel>
          </div>

          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8" data-reveal data-reveal-delay="1">
              {filtered.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center" data-reveal>
              <p
                className="font-heading italic text-ink-muted text-2xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                No stories match your search.
              </p>
              <p className="text-ink-muted/60 text-sm mt-4">
                Try a different category or search term.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
