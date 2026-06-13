import { useEffect, useState } from 'react'
import ImageField from '../../components/admin/ImageField'
import {
  ADMIN_BTN,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_OUTLINE,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
  slugify,
} from '../../components/admin/adminStyles'
import { BLOG_CATEGORIES } from '../../data/blog'
import { deletePost, fetchAllPosts, upsertPost } from '../../services/cms/blog'

const emptyPost = () => ({
  id: '',
  title: '',
  excerpt: '',
  category: 'Behind the Scenes',
  categorySlug: 'behind-scenes',
  date: '',
  readTime: '5 min',
  image: '',
  author: '',
  role: '',
  featured: false,
  content: [],
  published: true,
  sortOrder: 0,
})

export default function AdminBlog() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyPost())
  const [contentJson, setContentJson] = useState('[]')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await fetchAllPosts())
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const select = (post) => {
    setSelected(post?.id || null)
    setForm(post ? { ...post } : emptyPost())
    setContentJson(JSON.stringify(post?.content || [], null, 2))
    setStatus('')
  }

  const save = async () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      setStatus('Title is required.')
      return
    }
    let content = []
    try {
      content = JSON.parse(contentJson)
    } catch {
      setStatus('Content JSON is invalid.')
      return
    }
    try {
      await upsertPost({ ...form, id, content })
      await load()
      select({ ...form, id, content })
      setStatus('Post saved.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  const remove = async () => {
    if (!form.id || !window.confirm(`Delete "${form.title}"?`)) return
    try {
      await deletePost(form.id)
      select(null)
      await load()
      setStatus('Post deleted.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">Blog</h1>
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => select(null)}>New post</button>
      </div>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${ADMIN_PANEL} space-y-2`}>
          {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
          {items.map((post) => (
            <button
              key={post.id}
              type="button"
              className={`block w-full rounded px-3 py-2 text-left text-sm transition ${selected === post.id ? 'bg-gold text-void' : 'hover:bg-surface'}`}
              onClick={() => select(post)}
            >
              {post.title}
            </button>
          ))}
        </div>

        <div className={`${ADMIN_PANEL} space-y-4`}>
          <Field label="ID / slug" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextArea label="Excerpt" value={form.excerpt} onChange={(v) => setForm({ ...form, excerpt: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={ADMIN_LABEL}>Category</label>
              <select
                className={ADMIN_INPUT}
                value={form.categorySlug}
                onChange={(e) => {
                  const cat = BLOG_CATEGORIES.find((c) => c.slug === e.target.value)
                  setForm({ ...form, categorySlug: e.target.value, category: cat?.label || e.target.value })
                }}
              >
                {BLOG_CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
            <Field label="Read time" value={form.readTime} onChange={(v) => setForm({ ...form, readTime: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date label" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Sort order" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: Number(v) || 0 })} type="number" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
            <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          </div>
          <ImageField label="Cover image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} folder="blog" />
          <div>
            <label className={ADMIN_LABEL}>Content blocks (JSON)</label>
            <p className="mb-2 text-xs text-ink-muted">Types: paragraph, heading, quote — each with a "text" field.</p>
            <textarea className={ADMIN_INPUT} rows={14} value={contentJson} onChange={(e) => setContentJson(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published !== false} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={ADMIN_BTN} onClick={save}>Save post</button>
            {form.id ? <button type="button" className={ADMIN_BTN_DANGER} onClick={remove}>Delete</button> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <input className={ADMIN_INPUT} type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <textarea className={ADMIN_INPUT} rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
