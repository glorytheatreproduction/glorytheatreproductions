import { mapBlogRow, mapBlogToRow } from '../../lib/mapDbRows'
import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'

export async function fetchPublishedPosts() {
  if (!supabaseIsConfigured) return null
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapBlogRow)
}

export async function fetchAllPosts() {
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapBlogRow)
}

export async function upsertPost(post) {
  const { data: { user } } = await getSupabase().auth.getUser()
  const row = { ...mapBlogToRow(post), updated_at: new Date().toISOString(), updated_by: user?.id ?? null }
  const { error } = await getSupabase().from('blog_posts').upsert(row)
  if (error) throw error
}

export async function deletePost(id) {
  const { error } = await getSupabase().from('blog_posts').delete().eq('id', id)
  if (error) throw error
}

export function getPostById(posts, id) {
  return posts.find((p) => p.id === id) ?? null
}

export function getRelatedPosts(posts, post, limit = 3) {
  if (!post) return []
  return posts
    .filter((p) => p.id !== post.id && p.categorySlug === post.categorySlug)
    .slice(0, limit)
}

export function filterPosts(posts, { category = 'all', search = '' } = {}) {
  let result = posts
  if (category && category !== 'all') {
    result = result.filter((p) => p.categorySlug === category)
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    )
  }
  return result
}
