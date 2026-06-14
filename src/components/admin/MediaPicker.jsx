import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { listMediaAssets, uploadMediaAsset } from '../../services/cms/media'
import { ADMIN_BTN_OUTLINE, ADMIN_PANEL } from './adminStyles'

const MEDIA_FOLDERS = ['general', 'cms', 'events', 'gallery', 'blog']

function isImageAsset(asset) {
  return !asset.mimeType || asset.mimeType.startsWith('image/')
}

export default function MediaPicker({
  folder = 'general',
  browseAll = false,
  onSelect,
  onClose,
}) {
  const [activeFolder, setActiveFolder] = useState(browseAll ? 'all' : folder)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const uploadFolder = browseAll && activeFolder !== 'all' ? activeFolder : (folder || 'general')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const list = browseAll && activeFolder === 'all'
        ? await listMediaAssets('')
        : await listMediaAssets(browseAll ? activeFolder : folder)
      setAssets(list.filter(isImageAsset))
    } catch (err) {
      setError(err.message || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [folder, browseAll, activeFolder])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const targetFolder = uploadFolder
      await uploadMediaAsset(file, { folder: targetFolder })
      await load()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-void/80 p-4" onMouseDown={onClose}>
      <div className={`${ADMIN_PANEL} relative z-[1] max-h-[85vh] w-full max-w-3xl overflow-y-auto`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-xl text-ink">Media Library</h3>
          <div className="flex gap-2">
            <label className={`${ADMIN_BTN_OUTLINE} cursor-pointer`}>
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
            </label>
            <button type="button" className={ADMIN_BTN_OUTLINE} onClick={onClose}>Close</button>
          </div>
        </div>

        {browseAll ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded px-3 py-1.5 text-sm capitalize transition ${activeFolder === 'all' ? 'bg-gold text-void' : 'bg-surface text-ink-muted hover:text-ink'}`}
              onClick={() => setActiveFolder('all')}
            >
              All
            </button>
            {MEDIA_FOLDERS.map((name) => (
              <button
                key={name}
                type="button"
                className={`rounded px-3 py-1.5 text-sm capitalize transition ${activeFolder === name ? 'bg-gold text-void' : 'bg-surface text-ink-muted hover:text-ink'}`}
                onClick={() => setActiveFolder(name)}
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="mb-4 text-sm text-burgundy">{error}</p> : null}
        {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="group overflow-hidden rounded border border-border-light text-left transition hover:border-gold"
              onClick={() => onSelect(asset.publicUrl)}
            >
              <img src={asset.publicUrl} alt={asset.alt || asset.title || ''} className="aspect-square w-full object-cover" />
              <span className="block truncate px-2 py-1 text-xs text-ink-muted">
                {asset.title || asset.path}
              </span>
              {browseAll && asset.folder ? (
                <span className="block truncate px-2 pb-1 text-[10px] uppercase tracking-wider text-ink-muted/70">
                  {asset.folder}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {!loading && assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No images yet. Upload one to get started.</p>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
