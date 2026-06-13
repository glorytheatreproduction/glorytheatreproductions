export const ADMIN_INPUT =
  'w-full rounded border border-border-light bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold'

export const ADMIN_LABEL = 'block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1.5'

export const ADMIN_PANEL = 'rounded border border-border-light bg-paper p-6'

export const ADMIN_BTN =
  'inline-flex items-center justify-center rounded bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-void transition hover:bg-gold-light disabled:opacity-50'

export const ADMIN_BTN_OUTLINE =
  'inline-flex items-center justify-center rounded border border-border-light px-4 py-2 text-xs uppercase tracking-widest text-ink transition hover:border-gold hover:text-gold'

export const ADMIN_BTN_DANGER =
  'inline-flex items-center justify-center rounded border border-burgundy/40 px-4 py-2 text-xs uppercase tracking-widest text-burgundy transition hover:bg-burgundy hover:text-cream'

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
