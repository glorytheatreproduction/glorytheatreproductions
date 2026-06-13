import { useEffect, useState } from 'react'
import { ADMIN_BTN_DANGER, ADMIN_BTN_OUTLINE, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from '../../components/admin/adminStyles'
import { deleteMediaAsset, listMediaAssets, uploadMediaAsset } from '../../services/cms/media'

const folders = ['general', 'cms', 'events', 'gallery', 'blog']

export default function AdminMedia() {
  const [folder, setFolder] = useState('general')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setAssets(await listMediaAssets(folder))
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [folder])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setStatus('')
    try {
      await uploadMediaAsset(file, { folder })
      await load()
      setStatus('Upload complete.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await deleteMediaAsset(id)
      await load()
      setStatus('Image deleted.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">Media Library</h1>
        <label className={`${ADMIN_BTN_OUTLINE} cursor-pointer`}>
          {uploading ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      </div>

      <div className={`${ADMIN_PANEL} flex flex-wrap gap-2`}>
        {folders.map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded px-3 py-1.5 text-sm capitalize transition ${folder === f ? 'bg-gold text-void' : 'bg-surface text-ink-muted hover:text-ink'}`}
            onClick={() => setFolder(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.id} className={`${ADMIN_PANEL} p-3`}>
            <img src={asset.publicUrl} alt={asset.alt || ''} className="aspect-video w-full rounded object-cover" />
            <p className="mt-2 truncate text-xs text-ink-muted">{asset.title || asset.path}</p>
            <input className={`${ADMIN_INPUT} mt-2 text-xs`} readOnly value={asset.publicUrl} onFocus={(e) => e.target.select()} />
            <button type="button" className={`${ADMIN_BTN_DANGER} mt-3`} onClick={() => remove(asset.id)}>Delete</button>
          </div>
        ))}
      </div>

      {!loading && assets.length === 0 ? (
        <p className="text-sm text-ink-muted">No images in this folder yet.</p>
      ) : null}
    </div>
  )
}
