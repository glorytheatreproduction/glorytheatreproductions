import { useEffect, useMemo, useState } from 'react'
import ImageField from './ImageField'
import { ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from './adminStyles'
import TicketClassic from '../tickets/TicketClassic'
import TicketSacredStage from '../tickets/TicketSacredStage'
import {
  CLASSIC_COLOR_FIELDS,
  DEFAULT_TICKET_COLOR_SETTINGS,
  DEFAULT_TICKET_SETTINGS,
  SACRED_STAGE_COLOR_FIELDS,
  TICKET_TEMPLATES,
  buildPreviewTicketData,
  resolveTicketSettings,
} from '../../../shared/tickets/ticketTokens.js'

const TEMPLATE_OPTIONS = [
  {
    id: TICKET_TEMPLATES.classic,
    label: 'Classic',
    description: 'Image hero, 2×2 detail grid, centred QR — clean vertical layout.',
  },
  {
    id: TICKET_TEMPLATES.sacred_stage,
    label: 'Sacred Stage',
    description: 'Wide stub, balanced copy + QR, four-column meta row.',
  },
]

const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function normalizeSettings(raw = {}) {
  return {
    ...DEFAULT_TICKET_SETTINGS,
    ...raw,
    colors: {
      ...DEFAULT_TICKET_COLOR_SETTINGS,
      ...(raw.colors || {}),
      ...(raw.accentColor ? { accentColor: raw.accentColor } : {}),
    },
  }
}

export default function EventTicketDesign({ event, ticketTemplate, ticketSettings, onChange }) {
  const [settings, setSettings] = useState(() => normalizeSettings(ticketSettings))

  useEffect(() => {
    setSettings(normalizeSettings(ticketSettings))
  }, [event?.id, ticketSettings])

  const debouncedSettings = useDebouncedValue(settings, 300)
  const previewData = useMemo(
    () => buildPreviewTicketData(event, debouncedSettings, SITE_ORIGIN),
    [event, debouncedSettings]
  )

  const updateSettings = (patch) => {
    const next = normalizeSettings({ ...settings, ...patch })
    setSettings(next)
    onChange({ ticketTemplate, ticketSettings: next })
  }

  const updateColor = (key, value) => {
    updateSettings({
      colors: { ...settings.colors, [key]: value },
      ...(key === 'accentColor' ? { accentColor: value } : {}),
    })
  }

  const resetColors = () => {
    updateSettings({ colors: { ...DEFAULT_TICKET_COLOR_SETTINGS }, accentColor: '' })
  }

  const selectTemplate = (template) => {
    onChange({ ticketTemplate: template, ticketSettings: settings })
  }

  const resolved = resolveTicketSettings(event, settings)
  const colorFields = ticketTemplate === TICKET_TEMPLATES.classic
    ? CLASSIC_COLOR_FIELDS
    : SACRED_STAGE_COLOR_FIELDS

  return (
    <section className={`${ADMIN_PANEL} space-y-6`}>
      <div>
        <h2 className="font-display text-xl text-ink">Ticket Design</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Gotham typeface throughout. Colours update live in the preview below.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <p className={ADMIN_LABEL}>Template</p>
          {TEMPLATE_OPTIONS.map((option) => {
            const active = ticketTemplate === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectTemplate(option.id)}
                className={`w-full rounded border p-3 text-left transition ${
                  active ? 'border-gold bg-gold/10 ring-1 ring-gold/40' : 'border-border-light hover:border-gold/30'
                }`}
              >
                <span className="block font-medium text-ink">{option.label}</span>
                <span className="mt-1 block text-xs text-ink-muted">{option.description}</span>
              </button>
            )
          })}
        </div>

        <div
          className="overflow-x-auto rounded border border-border-light p-4"
          style={{ background: resolved.colors.outerBackground }}
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">Live preview</p>
          {ticketTemplate === TICKET_TEMPLATES.classic ? (
            <TicketClassic data={previewData} />
          ) : (
            <TicketSacredStage data={previewData} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageField
          label="Ticket event image"
          value={settings.eventImageUrl || event.image || ''}
          onChange={(v) => updateSettings({ eventImageUrl: v })}
          folder="events"
        />
        <Field
          label="Venue on ticket"
          value={settings.venueName}
          placeholder={event.venue || 'Venue name'}
          onChange={(v) => updateSettings({ venueName: v })}
        />
        <Field
          label="Date on ticket"
          value={settings.dateLabel}
          placeholder={event.dateLabel || 'Date label'}
          onChange={(v) => updateSettings({ dateLabel: v })}
        />
        <Field
          label="Time on ticket"
          value={settings.timeLabel}
          placeholder={event.time || '7:00 PM'}
          onChange={(v) => updateSettings({ timeLabel: v })}
        />
        <Field
          label="Cost / amount text"
          value={settings.ticketAmountLabel}
          placeholder={resolved.ticketAmountLabel}
          onChange={(v) => updateSettings({ ticketAmountLabel: v })}
        />
        <div className="md:col-span-2">
          <label className={ADMIN_LABEL}>Custom note (optional)</label>
          <textarea
            className={ADMIN_INPUT}
            rows={2}
            value={settings.customMessage || ''}
            onChange={(e) => updateSettings({ customMessage: e.target.value })}
            placeholder="e.g. Doors open 30 minutes before showtime"
          />
        </div>
      </div>

      <div className="space-y-4 rounded border border-border-light p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-ink">Ticket colours</h3>
            <p className="text-xs text-ink-muted">Fields shown match the selected template.</p>
          </div>
          <button type="button" className="text-sm text-gold-muted hover:text-gold" onClick={resetColors}>
            Reset to defaults
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colorFields.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={settings.colors?.[key] || DEFAULT_TICKET_COLOR_SETTINGS[key]}
              onChange={(v) => updateColor(key, v)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <input
        className={ADMIN_INPUT}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  const hexValue = value?.startsWith('#') ? value.slice(0, 7) : '#000000'
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border-light bg-paper p-1"
        />
        <input
          className={ADMIN_INPUT}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000 or rgba(...)"
        />
      </div>
    </div>
  )
}
