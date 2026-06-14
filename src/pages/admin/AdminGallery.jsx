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
import { uploadMediaAssets } from '../../services/cms/media'

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

function emptyPhoto(index = 0) {
  return { id: `photo-${index + 1}`, src: '', title: '' }
}

export default function AdminGallery() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyAlbum())
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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
    setPhotos(album?.images?.length ? album.images.map((img) => ({ ...img })) : [emptyPhoto()])
    setStatus('')
  }

  const updatePhoto = (index, key, value) => {
    setPhotos((prev) => prev.map((photo, i) => (i === index ? { ...photo, [key]: value } : photo)))
  }

  const addPhoto = () => setPhotos((prev) => [...prev, emptyPhoto(prev.length)])

  const removePhoto = (index) => {
    setPhotos((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const onUploadPhotos = async (e) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    setStatus('')
    try {
      const uploaded = await uploadMediaAssets(files, { folder: 'gallery' })
      if (!uploaded.length) {
        setStatus('Choose one or more image files.')
        return
      }

      const newPhotos = uploaded.map((asset, index) => ({
        id: `photo-${Date.now()}-${index}`,
        src: asset.publicUrl,
        title: asset.title?.replace(/\.[^.]+$/, '') || '',
      }))

      setPhotos((prev) => {
        const filled = prev.filter((photo) => photo.src?.trim())
        const onlyEmptyPlaceholder = prev.length === 1 && !prev[0].src?.trim()
        return onlyEmptyPlaceholder ? newPhotos : [...filled, ...newPhotos]
      })

      setForm((prev) => ({
        ...prev,
        cover: prev.cover || newPhotos[0]?.src || '',
      }))

      setStatus(`${newPhotos.length} photo${newPhotos.length === 1 ? '' : 's'} uploaded. Add captions, then save the album.`)
    } catch (err) {
      setStatus(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const save = async () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      setStatus('Title is required.')
      return
    }
    const images = photos
      .filter((photo) => photo.src?.trim())
      .map((photo, index) => ({
        id: photo.id || `photo-${index + 1}`,
        src: photo.src.trim(),
        title: photo.title?.trim() || '',
      }))
    if (!images.length) {
      setStatus('Add at least one photo.')
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
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Field label="Date tag" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="e.g. March 2026 or Season 25–26" />
          <p className="text-xs text-ink-muted -mt-2">Used to sort albums on the gallery page (newest first).</p>
          <div>
            <label className={ADMIN_LABEL}>Category</label>
            <select className={ADMIN_INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {GALLERY_CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <Field label="Manual sort order" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: Number(v) || 0 })} type="number" />
          <ImageField label="Cover image" value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} folder="gallery" />

          <div className="space-y-4 rounded border border-border-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-ink">Photos</h3>
              <div className="flex flex-wrap gap-2">
                <label className={`${ADMIN_BTN} cursor-pointer`}>
                  {uploading ? 'Uploading…' : 'Upload photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onUploadPhotos}
                    disabled={uploading}
                  />
                </label>
                <button type="button" className={ADMIN_BTN_OUTLINE} onClick={addPhoto}>Add photo manually</button>
              </div>
            </div>
            <p className="text-xs text-ink-muted">Select multiple images at once, or add photos one at a time with a URL.</p>
            {photos.map((photo, index) => (
              <div key={`${photo.id}-${index}`} className="space-y-3 rounded border border-border-light p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">Photo {index + 1}</p>
                  {photos.length > 1 ? (
                    <button type="button" className="text-sm text-burgundy" onClick={() => removePhoto(index)}>Remove</button>
                  ) : null}
                </div>
                <ImageField
                  label="Image"
                  value={photo.src}
                  onChange={(v) => updatePhoto(index, 'src', v)}
                  folder="gallery"
                />
                <Field
                  label="Caption"
                  value={photo.title}
                  onChange={(v) => updatePhoto(index, 'title', v)}
                />
              </div>
            ))}
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
