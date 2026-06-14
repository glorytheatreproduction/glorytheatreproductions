/** Default palette — overridable per event via ticket_settings.colors */
export const DEFAULT_TICKET_COLOR_SETTINGS = {
  outerBackground: '#f8f5f0',
  qrBackground: '#ffffff',
  // Sacred Stage
  accentColor: '#6b1f2a',
  panelTextColor: '#f5f0e8',
  imagePanelColor: '#1a1410',
  stubNotchColor: '#f8f5f0',
  // Classic
  cardBackground: '#e8e4df',
  headerStart: '#e8b896',
  headerEnd: '#d4956a',
  infoBackground: '#111111',
  infoText: '#ffffff',
  labelText: 'rgba(255,255,255,0.55)',
}

export const TICKET_COLORS = { ...DEFAULT_TICKET_COLOR_SETTINGS }

export const TICKET_TEMPLATES = {
  classic: 'classic',
  sacred_stage: 'sacred_stage',
}

export const DEFAULT_TICKET_SETTINGS = {
  eventImageUrl: '',
  venueName: '',
  dateLabel: '',
  timeLabel: '',
  ticketAmountLabel: 'FREE',
  customMessage: '',
  /** @deprecated use colors.accentColor */
  accentColor: '',
  colors: { ...DEFAULT_TICKET_COLOR_SETTINGS },
}

/** Gotham family — place licensed .woff2 files in public/fonts/gotham/ */
export const GOTHAM_FONT_FILES = {
  light: 'Gotham-Light.woff2',
  book: 'Gotham-Book.woff2',
  medium: 'Gotham-Medium.woff2',
  bold: 'Gotham-Bold.woff2',
  black: 'Gotham-Black.woff2',
}

export const TICKET_FONTS = {
  family: 'Gotham',
  light: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  book: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  medium: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  bold: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  black: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  /** Role mapping */
  display: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  heading: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  body: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  label: '"Gotham", "Helvetica Neue", Arial, sans-serif',
  weights: {
    display: 900,
    heading: 500,
    body: 400,
    label: 500,
  },
}

export function buildGothamFontFaceCss(baseUrl = '') {
  const root = `${baseUrl.replace(/\/$/, '')}/fonts/gotham`
  const faces = [
    { file: GOTHAM_FONT_FILES.light, weight: 300 },
    { file: GOTHAM_FONT_FILES.book, weight: 400 },
    { file: GOTHAM_FONT_FILES.medium, weight: 500 },
    { file: GOTHAM_FONT_FILES.bold, weight: 700 },
    { file: GOTHAM_FONT_FILES.black, weight: 900 },
  ]

  return faces.map(({ file, weight }) => `
    @font-face {
      font-family: 'Gotham';
      src: url('${root}/${file}') format('woff2');
      font-weight: ${weight};
      font-style: normal;
      font-display: swap;
    }`).join('\n')
}

export function resolveTicketColors(settings = {}, legacyAccent = '') {
  const merged = {
    ...DEFAULT_TICKET_COLOR_SETTINGS,
    ...(settings.colors || {}),
  }
  if (legacyAccent) merged.accentColor = legacyAccent
  if (settings.accentColor) merged.accentColor = settings.accentColor
  return merged
}

export function resolveTicketSettings(event = {}, overrides = {}) {
  const settings = { ...DEFAULT_TICKET_SETTINGS, ...(event.ticketSettings || {}), ...overrides }
  const colors = resolveTicketColors(settings, settings.accentColor)

  return {
    eventImageUrl: settings.eventImageUrl || event.image || '',
    venueName: settings.venueName || event.venue || '',
    dateLabel: settings.dateLabel || event.dateLabel || '',
    timeLabel: settings.timeLabel || event.time || '',
    ticketAmountLabel:
      settings.ticketAmountLabel
      || (event.entryType === 'free' ? 'FREE' : settings.ticketAmountLabel || 'FREE'),
    customMessage: settings.customMessage || '',
    accentColor: colors.accentColor,
    colors,
  }
}

export function buildPreviewTicketData(event = {}, settingsOverrides = {}, fontsBaseUrl = '') {
  const settings = resolveTicketSettings(event, settingsOverrides)
  return {
    eventName: event.title || 'Event Name',
    venue: settings.venueName,
    date: settings.dateLabel,
    time: settings.timeLabel,
    amount: settings.ticketAmountLabel,
    ticketId: '#000001',
    attendeeName: 'Guest Name',
    customMessage: settings.customMessage,
    eventImageUrl: settings.eventImageUrl,
    accentColor: settings.colors.accentColor,
    colors: settings.colors,
    fontsBaseUrl,
    qrDataUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=PREVIEW',
  }
}

export const SACRED_STAGE_COLOR_FIELDS = [
  { key: 'accentColor', label: 'Panel background' },
  { key: 'panelTextColor', label: 'Panel text' },
  { key: 'imagePanelColor', label: 'Image panel fallback' },
  { key: 'stubNotchColor', label: 'Stub notch / tear edge' },
  { key: 'qrBackground', label: 'QR code background' },
  { key: 'outerBackground', label: 'Outer background' },
]

export const CLASSIC_COLOR_FIELDS = [
  { key: 'cardBackground', label: 'Card background' },
  { key: 'headerStart', label: 'Header gradient start' },
  { key: 'headerEnd', label: 'Header gradient end' },
  { key: 'infoBackground', label: 'Info section background' },
  { key: 'infoText', label: 'Info section text' },
  { key: 'labelText', label: 'Label text' },
  { key: 'qrBackground', label: 'QR code background' },
  { key: 'outerBackground', label: 'Outer background' },
]
