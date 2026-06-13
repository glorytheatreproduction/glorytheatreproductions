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
import { uploadMediaAsset, uploadMediaAssets } from '../../services/cms/media'
import { useAuth } from '../../context/AuthContext'

const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'quote', label: 'Quote' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
]

const MEDIA_POSITIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'full', label: 'Full width' },
]

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

function emptyBlock() {
  return { type: 'paragraph', text: '' }
}

function emptyImageBlock() {
  return { type: 'image', src: '', caption: '', position: 'center' }
}

function emptyVideoBlock() {
  return { type: 'video', url: '', caption: '', position: 'center' }
}

function normalizeBlock(block) {
  if (block?.type === 'image') {
    return {
      type: 'image',
      src: block.src || '',
      caption: block.caption || block.text || '',
      position: block.position || 'center',
    }
  }
  if (block?.type === 'video') {
    return {
      type: 'video',
      url: block.url || block.src || '',
      caption: block.caption || '',
      position: block.position || 'center',
    }
  }
  return {
    type: block?.type || 'paragraph',
    text: block?.text || '',
  }
}

function serializeBlock(block) {
  if (block.type === 'image') {
    return {
      type: 'image',
      src: block.src?.trim() || '',
      caption: block.caption?.trim() || '',
      position: block.position || 'center',
    }
  }
  if (block.type === 'video') {
    return {
      type: 'video',
      url: block.url?.trim() || '',
      caption: block.caption?.trim() || '',
      position: block.position || 'center',
    }
  }
  return {
    type: block.type || 'paragraph',
    text: block.text?.trim() || '',
  }
}

function isBlockFilled(block) {
  if (block.type === 'image') return Boolean(block.src?.trim())
  if (block.type === 'video') return Boolean(block.url?.trim())
  return Boolean(block.text?.trim())
}

function MediaPositionSelect({ value, onChange }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>Position</label>
      <select className={ADMIN_INPUT} value={value || 'center'} onChange={(e) => onChange(e.target.value)}>
        {MEDIA_POSITIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function AdminBlog() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyPost())
  const [blocks, setBlocks] = useState([emptyBlock()])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingBlock, setUploadingBlock] = useState(null)

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
    if (post) {
      setForm({ ...post })
    } else {
      setForm({
        ...emptyPost(),
        author: profile?.full_name || '',
        role: profile?.role === 'blog_writer' ? 'Blog Writer' : '',
      })
    }
    setBlocks(post?.content?.length ? post.content.map(normalizeBlock) : [emptyBlock()])
    setStatus('')
  }

  const updateBlock = (index, key, value) => {
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, [key]: value } : block)))
  }

  const changeBlockType = (index, type) => {
    setBlocks((prev) => prev.map((block, i) => {
      if (i !== index) return block
      if (type === 'image') return emptyImageBlock()
      if (type === 'video') return emptyVideoBlock()
      return { type, text: block.text || block.caption || '' }
    }))
  }

  const insertBlock = (block) => setBlocks((prev) => [...prev, block])

  const addBlock = () => setBlocks((prev) => [...prev, emptyBlock()])

  const removeBlock = (index) => {
    setBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const moveBlock = (index, direction) => {
    setBlocks((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const onUploadImages = async (e, index = null) => {
    const files = e.target.files
    if (!files?.length) return

    setUploadingBlock(index ?? 'bulk')
    setStatus('')
    try {
      const uploaded = await uploadMediaAssets(files, { folder: 'blog', kind: 'image' })
      if (!uploaded.length) {
        setStatus('Choose one or more image files.')
        return
      }

      const imageBlocks = uploaded.map((asset) => ({
        ...emptyImageBlock(),
        src: asset.publicUrl,
        caption: asset.title?.replace(/\.[^.]+$/, '') || '',
      }))

      if (index != null) {
        updateBlock(index, 'src', imageBlocks[0].src)
        if (!blocks[index]?.caption) updateBlock(index, 'caption', imageBlocks[0].caption)
        if (imageBlocks.length > 1) {
          setBlocks((prev) => {
            const next = [...prev]
            next.splice(index + 1, 0, ...imageBlocks.slice(1))
            return next
          })
        }
      } else {
        setBlocks((prev) => {
          const onlyEmpty = prev.length === 1 && !isBlockFilled(prev[0])
          return onlyEmpty ? imageBlocks : [...prev, ...imageBlocks]
        })
      }

      setStatus(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} added.`)
    } catch (err) {
      setStatus(err.message || 'Image upload failed.')
    } finally {
      setUploadingBlock(null)
      e.target.value = ''
    }
  }

  const onUploadVideo = async (e, index) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBlock(index)
    setStatus('')
    try {
      const asset = await uploadMediaAsset(file, { folder: 'blog', title: file.name })
      updateBlock(index, 'url', asset.publicUrl)
      setStatus('Video uploaded.')
    } catch (err) {
      setStatus(err.message || 'Video upload failed.')
    } finally {
      setUploadingBlock(null)
      e.target.value = ''
    }
  }

  const save = async () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      setStatus('Title is required.')
      return
    }
    const content = blocks.map(serializeBlock).filter(isBlockFilled)
    if (!content.length) {
      setStatus('Add at least one content section.')
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

          <div className="space-y-4 rounded border border-border-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-ink">Article content</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => insertBlock(emptyImageBlock())}>
                  Insert image
                </button>
                <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => insertBlock(emptyVideoBlock())}>
                  Insert video
                </button>
                <label className={`${ADMIN_BTN_OUTLINE} cursor-pointer`}>
                  {uploadingBlock === 'bulk' ? 'Uploading…' : 'Upload images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingBlock != null}
                    onChange={onUploadImages}
                  />
                </label>
                <button type="button" className={ADMIN_BTN_OUTLINE} onClick={addBlock}>Add text section</button>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Insert images or videos anywhere in the post. Use YouTube/Vimeo links or upload MP4/WebM files. Move sections up or down to reorder.
            </p>
            {blocks.map((block, index) => (
              <div key={index} className="space-y-3 rounded border border-border-light p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[180px]">
                    <label className={ADMIN_LABEL}>Section type</label>
                    <select
                      className={ADMIN_INPUT}
                      value={block.type}
                      onChange={(e) => changeBlockType(index, e.target.value)}
                    >
                      {BLOCK_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                      Move up
                    </button>
                    <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>
                      Move down
                    </button>
                    {blocks.length > 1 ? (
                      <button type="button" className="text-sm text-burgundy" onClick={() => removeBlock(index)}>Remove</button>
                    ) : null}
                  </div>
                </div>

                {block.type === 'image' ? (
                  <>
                    <ImageField
                      label="Image"
                      value={block.src}
                      onChange={(v) => updateBlock(index, 'src', v)}
                      folder="blog"
                    />
                    <label className={`${ADMIN_BTN_OUTLINE} inline-block cursor-pointer`}>
                      {uploadingBlock === index ? 'Uploading…' : 'Upload image file'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingBlock != null}
                        onChange={(e) => onUploadImages(e, index)}
                      />
                    </label>
                    <Field label="Caption" value={block.caption} onChange={(v) => updateBlock(index, 'caption', v)} />
                    <MediaPositionSelect value={block.position} onChange={(v) => updateBlock(index, 'position', v)} />
                  </>
                ) : null}

                {block.type === 'video' ? (
                  <>
                    <Field
                      label="Video URL"
                      value={block.url}
                      onChange={(v) => updateBlock(index, 'url', v)}
                    />
                    <p className="text-xs text-ink-muted">Paste a YouTube or Vimeo link, or upload a video file below.</p>
                    <label className={`${ADMIN_BTN_OUTLINE} inline-block cursor-pointer`}>
                      {uploadingBlock === index ? 'Uploading…' : 'Upload video file'}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={uploadingBlock != null}
                        onChange={(e) => onUploadVideo(e, index)}
                      />
                    </label>
                    <Field label="Caption" value={block.caption} onChange={(v) => updateBlock(index, 'caption', v)} />
                    <MediaPositionSelect value={block.position} onChange={(v) => updateBlock(index, 'position', v)} />
                  </>
                ) : null}

                {block.type !== 'image' && block.type !== 'video' ? (
                  <TextArea
                    label="Text"
                    value={block.text}
                    onChange={(v) => updateBlock(index, 'text', v)}
                    rows={block.type === 'paragraph' ? 5 : 3}
                  />
                ) : null}
              </div>
            ))}
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

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <textarea className={ADMIN_INPUT} rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
