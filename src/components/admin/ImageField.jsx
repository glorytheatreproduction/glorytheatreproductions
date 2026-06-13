import { useState } from 'react'
import { ADMIN_BTN, ADMIN_BTN_OUTLINE, ADMIN_INPUT, ADMIN_LABEL } from './adminStyles'
import MediaPicker from './MediaPicker'

export default function ImageField({ label, value, onChange, folder = 'cms' }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <div className="flex gap-2">
        <input className={ADMIN_INPUT} type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => setPickerOpen(true)}>
          Pick
        </button>
      </div>
      {value ? (
        <img src={value} alt="" className="mt-3 h-24 w-auto max-w-full rounded border border-border-light object-cover" />
      ) : null}
      {pickerOpen ? (
        <MediaPicker folder={folder} onSelect={(url) => { onChange(url); setPickerOpen(false) }} onClose={() => setPickerOpen(false)} />
      ) : null}
    </div>
  )
}
