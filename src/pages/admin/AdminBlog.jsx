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
import {
  REVIEW_STATUS_LABELS,
  deletePost,
  fetchAllPosts,
  reviewStatusTone,
  upsertPost,
} from '../../services/cms/blog'
import { uploadMediaAsset, uploadMediaAssets } from '../../services/cms/media'
import { useAuth } from '../../context/AuthContext'

const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'quote', label: 'Quote' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Music' },
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
  backgroundMusic: { url: '', title: '', artist: '' },
  author: '',
  role: '',
  featured: false,
  content: [],
  published: false,
  reviewStatus: 'draft',
  sortOrder: 0,
  authorUserId: null,
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

function emptyAudioBlock() {
  return { type: 'audio', url: '', title: '', artist: '', cover: '', caption: '', position: 'center' }
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
  if (block?.type === 'audio') {
    return {
      type: 'audio',
      url: block.url || block.src || '',
      title: block.title || '',
      artist: block.artist || '',
      cover: block.cover || '',
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
  if (block.type === 'audio') {
    return {
      type: 'audio',
      url: block.url?.trim() || '',
      title: block.title?.trim() || '',
      artist: block.artist?.trim() || '',
      cover: block.cover?.trim() || '',
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
  if (block.type === 'audio') return Boolean(block.url?.trim())
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
  const { profile, canModerateBlog, isBlogAdmin, isBlogWriter, isStaff } = useAuth()
  const ownsPostsOnly = isBlogWriter || isBlogAdmin
  const writerOnly = isBlogWriter
  const canReviewOthers = isStaff
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
      setForm({
        ...post,
        backgroundMusic: post.backgroundMusic || { url: '', title: '', artist: '' },
      })
    } else {
      setForm({
        ...emptyPost(),
        author: profile?.full_name || '',
        role: isBlogWriter ? 'Blog Writer' : isBlogAdmin ? 'Blog Admin' : '',
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
      if (type === 'audio') return emptyAudioBlock()
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

  const onUploadAudio = async (e, index) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBlock(index)
    setStatus('')
    try {
      const asset = await uploadMediaAsset(file, { folder: 'blog', title: file.name.replace(/\.[^.]+$/, '') })
      updateBlock(index, 'url', asset.publicUrl)
      if (!blocks[index]?.title) {
        updateBlock(index, 'title', asset.title?.replace(/\.[^.]+$/, '') || file.name.replace(/\.[^.]+$/, ''))
      }
      setStatus('Audio uploaded.')
    } catch (err) {
      setStatus(err.message || 'Audio upload failed.')
    } finally {
      setUploadingBlock(null)
      e.target.value = ''
    }
  }

  const buildPayload = () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      throw new Error('Title is required.')
    }
    const content = blocks.map(serializeBlock).filter(isBlockFilled)
    if (!content.length) {
      throw new Error('Add at least one content section.')
    }
    return { ...form, id, content }
  }

  const persistPost = async (patch, successMessage) => {
    try {
      const payload = { ...buildPayload(), ...patch }
      await upsertPost(payload)
      await load()
      select(payload)
      setStatus(successMessage)
    } catch (err) {
      setStatus(err.message)
    }
  }

  const saveDraft = () => persistPost(
    writerOnly
      ? { published: false, reviewStatus: 'draft' }
      : { published: form.published === true, reviewStatus: form.published ? 'approved' : (form.reviewStatus || 'draft') },
    writerOnly ? 'Draft saved.' : 'Post saved.'
  )

  const submitForReview = () => persistPost(
    { published: false, reviewStatus: 'pending' },
    'Submitted for admin review. You will be notified when it is approved.'
  )

  const approvePost = () => persistPost(
    { published: true, reviewStatus: 'approved' },
    'Post approved and published.'
  )

  const requestChanges = () => persistPost(
    { published: false, reviewStatus: 'rejected' },
    'Sent back to the writer for changes.'
  )

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

  const pendingCount = items.filter((p) => p.reviewStatus === 'pending').length
  const reviewStatus = form.reviewStatus || 'draft'

  const sortedItems = canReviewOthers
    ? [...items].sort((a, b) => {
        const order = { pending: 0, rejected: 1, draft: 2, approved: 3 }
        const diff = (order[a.reviewStatus] ?? 9) - (order[b.reviewStatus] ?? 9)
        return diff !== 0 ? diff : (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      })
    : items

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Blog</h1>
          {ownsPostsOnly ? (
            <p className="mt-1 text-sm text-ink-muted">Showing your posts only</p>
          ) : null}
          {canReviewOthers && pendingCount > 0 ? (
            <p className="mt-1 text-sm text-gold-muted">{pendingCount} post{pendingCount === 1 ? '' : 's'} awaiting review</p>
          ) : null}
        </div>
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => select(null)}>New post</button>
      </div>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${ADMIN_PANEL} space-y-2`}>
          {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
          {sortedItems.map((post) => (
            <button
              key={post.id}
              type="button"
              className={`block w-full rounded px-3 py-2 text-left text-sm transition ${selected === post.id ? 'bg-gold text-void' : 'hover:bg-surface'}`}
              onClick={() => select(post)}
            >
              <span className="block truncate">{post.title}</span>
              <span className={`mt-0.5 block text-xs ${selected === post.id ? 'text-void/80' : reviewStatusTone(post.reviewStatus)}`}>
                {REVIEW_STATUS_LABELS[post.reviewStatus] || REVIEW_STATUS_LABELS.draft}
                {post.published ? ' · Live' : ''}
              </span>
            </button>
          ))}
        </div>

        <div className={`${ADMIN_PANEL} space-y-4`}>
          {form.id || form.title ? (
            <div className={`rounded border px-4 py-3 text-sm ${
              reviewStatus === 'pending'
                ? 'border-gold/40 bg-gold/10 text-ink'
                : reviewStatus === 'rejected'
                  ? 'border-burgundy/30 bg-burgundy/5 text-ink'
                  : 'border-border-light bg-surface text-ink-muted'
            }`}>
              <span className={`font-medium ${reviewStatusTone(reviewStatus)}`}>
                {REVIEW_STATUS_LABELS[reviewStatus] || REVIEW_STATUS_LABELS.draft}
              </span>
              {writerOnly && reviewStatus === 'pending' ? (
                <p className="mt-1">Your post is with an admin for review. You cannot publish it yourself.</p>
              ) : null}
              {writerOnly && reviewStatus === 'rejected' ? (
                <p className="mt-1">An admin requested changes. Edit the post, then save a draft or submit again for review.</p>
              ) : null}
              {writerOnly && reviewStatus === 'approved' && form.published ? (
                <p className="mt-1">This post is live on the website.</p>
              ) : null}
            </div>
          ) : null}
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
          <ImageField
            label="Cover image"
            value={form.image}
            onChange={(v) => setForm({ ...form, image: v })}
            folder="blog"
            browseAllMedia
          />

          <div className="space-y-4 rounded border border-border-light p-4">
            <div>
              <h3 className="font-medium text-ink">Background music</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Optional soundtrack that loops while visitors read this post. It autoplays when the post opens; visitors can pause from the floating bar.
              </p>
            </div>
            <Field
              label="Audio URL"
              value={form.backgroundMusic?.url || ''}
              onChange={(v) => setForm({
                ...form,
                backgroundMusic: { ...form.backgroundMusic, url: v },
              })}
            />
            <label className={`${ADMIN_BTN_OUTLINE} inline-block cursor-pointer`}>
              {uploadingBlock === 'soundtrack' ? 'Uploading…' : 'Upload audio file'}
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg"
                className="hidden"
                disabled={uploadingBlock != null}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingBlock('soundtrack')
                  setStatus('')
                  try {
                    const asset = await uploadMediaAsset(file, {
                      folder: 'blog',
                      title: file.name.replace(/\.[^.]+$/, ''),
                    })
                    const trackTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
                    setForm({
                      ...form,
                      backgroundMusic: {
                        url: asset.publicUrl,
                        title: form.backgroundMusic?.title || trackTitle,
                        artist: form.backgroundMusic?.artist || '',
                      },
                    })
                    setStatus('Background music uploaded.')
                  } catch (err) {
                    setStatus(err.message || 'Audio upload failed.')
                  } finally {
                    setUploadingBlock(null)
                    e.target.value = ''
                  }
                }}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Track title"
                value={form.backgroundMusic?.title || ''}
                onChange={(v) => setForm({
                  ...form,
                  backgroundMusic: { ...form.backgroundMusic, title: v },
                })}
              />
              <Field
                label="Artist"
                value={form.backgroundMusic?.artist || ''}
                onChange={(v) => setForm({
                  ...form,
                  backgroundMusic: { ...form.backgroundMusic, artist: v },
                })}
              />
            </div>
          </div>

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
                <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => insertBlock(emptyAudioBlock())}>
                  Insert music
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
              Insert images, videos, or music anywhere in the post. Music sections support a cover image, track title, and artist — similar to an Instagram post. Move sections up or down to reorder.
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
                      browseAllMedia
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

                {block.type === 'audio' ? (
                  <>
                    <Field label="Audio URL" value={block.url} onChange={(v) => updateBlock(index, 'url', v)} />
                    <label className={`${ADMIN_BTN_OUTLINE} inline-block cursor-pointer`}>
                      {uploadingBlock === index ? 'Uploading…' : 'Upload audio file'}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav,.ogg"
                        className="hidden"
                        disabled={uploadingBlock != null}
                        onChange={(e) => onUploadAudio(e, index)}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Track title" value={block.title} onChange={(v) => updateBlock(index, 'title', v)} />
                      <Field label="Artist" value={block.artist} onChange={(v) => updateBlock(index, 'artist', v)} />
                    </div>
                    <ImageField
                      label="Cover image (optional)"
                      value={block.cover}
                      onChange={(v) => updateBlock(index, 'cover', v)}
                      folder="blog"
                      browseAllMedia
                    />
                    <Field label="Caption" value={block.caption} onChange={(v) => updateBlock(index, 'caption', v)} />
                    <MediaPositionSelect value={block.position} onChange={(v) => updateBlock(index, 'position', v)} />
                  </>
                ) : null}

                {block.type !== 'image' && block.type !== 'video' && block.type !== 'audio' ? (
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

          {canModerateBlog ? (
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published === true}
                  onChange={(e) => setForm({
                    ...form,
                    published: e.target.checked,
                    reviewStatus: e.target.checked ? 'approved' : (form.reviewStatus === 'approved' ? 'draft' : form.reviewStatus),
                  })}
                />
                Published
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {writerOnly ? (
              <>
                <button type="button" className={ADMIN_BTN} onClick={saveDraft}>Save draft</button>
                <button
                  type="button"
                  className={ADMIN_BTN_OUTLINE}
                  onClick={submitForReview}
                  disabled={reviewStatus === 'pending'}
                >
                  {reviewStatus === 'pending' ? 'Awaiting review' : 'Submit for review'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={ADMIN_BTN} onClick={saveDraft}>Save post</button>
                {form.id && canReviewOthers && reviewStatus === 'pending' ? (
                  <>
                    <button type="button" className={ADMIN_BTN} onClick={approvePost}>Approve &amp; publish</button>
                    <button type="button" className={ADMIN_BTN_OUTLINE} onClick={requestChanges}>Request changes</button>
                  </>
                ) : null}
              </>
            )}
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
