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
import { GALLERY_CATEGORIES } from '../../data/gallery'
import { deleteAlbum, fetchAllAlbums, upsertAlbum } from '../../services/cms/gallery'

const emptyAlbum = () => ({
  id: '',
  title: '',
  description: '',
  category: 'drama',
  date: '',
  cover: '',
  images: [],
  published: true,
  sortOrder: 0,
})

export default function AdminGallery() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyAlbum())
  const [imagesJson, setImagesJson] = useState('[]')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await fetchAllAlbums())
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const select = (album) => {
    setSelected(album?.id || null)
    setForm(album ? { ...album } : emptyAlbum())
    setImagesJson(JSON.stringify(album?.images || [], null, 2))
    setStatus('')
  }

  const save = async () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      setStatus('Title is required.')
      return
    }
    let images = []
    try {
      images = JSON.parse(imagesJson)
    } catch {
      setStatus('Images JSON is invalid.')
      return
    }
    try {
      await upsertAlbum({ ...form, id, images, cover: form.cover || images[0]?.src || '' })
      await load()
      select({ ...form, id, images })
      setStatus('Album saved.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  const remove = async () => {
    if (!form.id || !window.confirm(`Delete "${form.title}"?`)) return
    try {
      await deleteAlbum(form.id)
      select(null)
      await load()
      setStatus('Album deleted.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">Gallery Albums</h1>
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => select(null)}>New album</button>
      </div>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${ADMIN_PANEL} space-y-2`}>
          {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
          {items.map((album) => (
            <button
              key={album.id}
              type="button"
              className={`block w-full rounded px-3 py-2 text-left text-sm transition ${selected === album.id ? 'bg-gold text-void' : 'hover:bg-surface'}`}
              onClick={() => select(album)}
            >
              {album.title}
            </button>
          ))}
        </div>

        <div className={`${ADMIN_PANEL} space-y-4`}>
          <Field label="ID" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Field label="Date label" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <div>
            <label className={ADMIN_LABEL}>Category</label>
            <select className={ADMIN_INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {GALLERY_CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <Field label="Sort order" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: Number(v) || 0 })} type="number" />
          <ImageField label="Cover image" value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} folder="gallery" />
          <div>
            <label className={ADMIN_LABEL}>Photos (JSON array)</label>
            <p className="mb-2 text-xs text-ink-muted">Format: [{`{ "id": "photo-1", "src": "https://...", "title": "Caption" }`}]</p>
            <textarea className={ADMIN_INPUT} rows={12} value={imagesJson} onChange={(e) => setImagesJson(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published !== false} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={ADMIN_BTN} onClick={save}>Save album</button>
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
