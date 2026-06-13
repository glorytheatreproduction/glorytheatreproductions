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
import { CATEGORIES } from '../../data/events'
import { buildDateLabel } from '../../lib/eventDates'
import { deleteEvent, fetchAllEvents, upsertEvent } from '../../services/cms/events'

const emptyEvent = () => ({
  id: '',
  title: '',
  description: '',
  longDescription: '',
  category: 'Drama',
  categorySlug: 'drama',
  day: 1,
  month: 'JAN',
  year: new Date().getFullYear(),
  dateLabel: '',
  time: '7:00 PM',
  venue: '',
  image: '',
  availability: 'Seats Available',
  featured: false,
  tags: [],
  capacity: 100,
  entryType: 'free',
  maxSeatsPerRsvp: 4,
  published: true,
  sortOrder: 0,
})

export default function AdminEvents() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyEvent())
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await fetchAllEvents())
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const select = (event) => {
    setSelected(event?.id || null)
    setForm(event ? { ...event } : emptyEvent())
    setStatus('')
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    const id = form.id || slugify(form.title)
    if (!id || !form.title) {
      setStatus('Title is required.')
      return
    }
    setStatus('')
    try {
      const payload = {
        ...form,
        id,
        dateLabel: buildDateLabel(form),
      }
      await upsertEvent(payload)
      await load()
      select(payload)
      setStatus('Event saved.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  const remove = async () => {
    if (!form.id || !window.confirm(`Delete "${form.title}"?`)) return
    try {
      await deleteEvent(form.id)
      select(null)
      await load()
      setStatus('Event deleted.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">Events</h1>
        <button type="button" className={ADMIN_BTN_OUTLINE} onClick={() => select(null)}>New event</button>
      </div>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${ADMIN_PANEL} space-y-2`}>
          {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
          {items.map((event) => (
            <button
              key={event.id}
              type="button"
              className={`block w-full rounded px-3 py-2 text-left text-sm transition ${selected === event.id ? 'bg-gold text-void' : 'hover:bg-surface'}`}
              onClick={() => select(event)}
            >
              {event.title}
              {!event.published ? <span className="ml-2 text-xs opacity-70">(draft)</span> : null}
            </button>
          ))}
        </div>

        <div className={`${ADMIN_PANEL} space-y-4`}>
          <Text label="Title" value={form.title} onChange={(v) => setField('title', v)} />
          <TextArea label="Short description" value={form.description} onChange={(v) => setField('description', v)} />
          <TextArea label="Long description" value={form.longDescription} onChange={(v) => setField('longDescription', v)} rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={form.categorySlug} onChange={(slug) => {
              const cat = CATEGORIES.find((c) => c.slug === slug)
              setForm((prev) => ({ ...prev, categorySlug: slug, category: cat?.label || slug }))
            }} options={CATEGORIES.filter((c) => c.slug !== 'all')} />
            <Select label="Availability" value={form.availability} onChange={(v) => setField('availability', v)} options={[
              { label: 'Seats Available', slug: 'Seats Available' },
              { label: 'Limited Seats', slug: 'Limited Seats' },
              { label: 'Last Seats', slug: 'Last Seats' },
              { label: 'Sold Out', slug: 'Sold Out' },
            ]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Text label="Day" value={form.day} onChange={(v) => setField('day', Number(v) || 0)} type="number" />
            <Text label="Month" value={form.month} onChange={(v) => setField('month', v)} />
            <Text label="Year" value={form.year} onChange={(v) => setField('year', Number(v) || 0)} type="number" />
            <Text label="Sort order" value={form.sortOrder} onChange={(v) => setField('sortOrder', Number(v) || 0)} type="number" />
          </div>
          <Text label="Date label" value={form.dateLabel} onChange={(v) => setField('dateLabel', v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Time" value={form.time} onChange={(v) => setField('time', v)} />
            <Text label="Venue" value={form.venue} onChange={(v) => setField('venue', v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Capacity" value={form.capacity} onChange={(v) => setField('capacity', Number(v) || 0)} type="number" />
            <Text label="Max seats per RSVP" value={form.maxSeatsPerRsvp} onChange={(v) => setField('maxSeatsPerRsvp', Number(v) || 1)} type="number" />
          </div>
          <Text label="Tags (comma separated)" value={(form.tags || []).join(', ')} onChange={(v) => setField('tags', v.split(',').map((t) => t.trim()).filter(Boolean))} />
          <ImageField label="Event image" value={form.image} onChange={(v) => setField('image', v)} folder="events" />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published !== false} onChange={(e) => setField('published', e.target.checked)} /> Published</label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={ADMIN_BTN} onClick={save}>Save event</button>
            {form.id ? <button type="button" className={ADMIN_BTN_DANGER} onClick={remove}>Delete</button> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Text({ label, value, onChange, type = 'text' }) {
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

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <select className={ADMIN_INPUT} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.slug} value={opt.slug}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
