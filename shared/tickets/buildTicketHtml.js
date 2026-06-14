import {
  TICKET_FONTS,
  buildGothamFontFaceCss,
  resolveTicketColors,
} from './ticketTokens.js'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colorsOf(data) {
  return resolveTicketColors({ colors: data.colors, accentColor: data.accentColor })
}

function classicHtml(data) {
  const image = esc(data.eventImageUrl)
  const qr = esc(data.qrDataUrl)
  return `
  <div class="ticket classic">
    <div class="scallop top"></div>
    <div class="hero" style="background-image:url('${image}')">
      <div class="hero-overlay">
        <span class="eyebrow">Admission</span>
        <h1 class="event-title">${esc(data.eventName)}</h1>
        <p class="event-venue">${esc(data.venue)}</p>
      </div>
    </div>
    <div class="details">
      <div class="detail"><span class="label">Date</span><span class="value">${esc(data.date)}</span></div>
      <div class="detail"><span class="label">Time</span><span class="value">${esc(data.time)}</span></div>
      <div class="detail"><span class="label">Amount</span><span class="value">${esc(data.amount)}</span></div>
      <div class="detail"><span class="label">Ticket</span><span class="value mono">${esc(data.ticketId)}</span></div>
    </div>
    ${data.customMessage ? `<p class="note">${esc(data.customMessage)}</p>` : ''}
    <div class="perforation"><span></span><span></span><span></span><span></span><span></span></div>
    <div class="qr-section">
      <div class="qr-card">
        <img class="qr" src="${qr}" alt="QR code" />
        <span class="qr-label">Scan for entry</span>
      </div>
    </div>
    <div class="scallop bottom"></div>
  </div>`
}

function sacredStageHtml(data) {
  const c = colorsOf(data)
  const accent = esc(c.accentColor)
  const image = esc(data.eventImageUrl)
  const qr = esc(data.qrDataUrl)
  return `
  <div class="ticket sacred">
    <div class="notch left"></div>
    <div class="panel image" style="background-image:url('${image}')">
      <div class="image-shade"></div>
    </div>
    <div class="panel info" style="background:${accent}">
      <div class="info-top">
        <div class="copy">
          <span class="eyebrow">Glory Theatre</span>
          <h1 class="event">${esc(data.eventName)}</h1>
          <p class="venue">${esc(data.venue)}</p>
        </div>
        <div class="qr-box">
          <img class="qr" src="${qr}" alt="QR code" />
          <span>Scan here</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="meta">
        <div class="meta-item"><span class="k">Ticket</span><span class="v">${esc(data.ticketId)}</span></div>
        <div class="meta-item"><span class="k">Date</span><span class="v">${esc(data.date)}</span></div>
        <div class="meta-item"><span class="k">Time</span><span class="v">${esc(data.time)}</span></div>
        <div class="meta-item"><span class="k">Cost</span><span class="v">${esc(data.amount)}</span></div>
      </div>
      ${data.customMessage ? `<p class="note">${esc(data.customMessage)}</p>` : ''}
    </div>
    <div class="notch right"></div>
  </div>`
}

function ticketStyles(data = {}) {
  const c = colorsOf(data)
  const f = TICKET_FONTS
  const w = f.weights

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 920px;
      margin: 0;
      padding: 32px;
      background: ${c.outerBackground};
      font-family: ${f.body};
      font-weight: ${w.body};
      -webkit-font-smoothing: antialiased;
    }

    .ticket { position: relative; overflow: hidden; }

    /* ── Classic ───────────────────────────────────────── */
    .classic {
      width: 400px;
      margin: 0 auto;
      background: ${c.cardBackground};
      border-radius: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 24px 48px rgba(0,0,0,.12);
    }
    .classic .scallop {
      height: 14px;
      background: radial-gradient(circle at 10px 0, transparent 9px, ${c.cardBackground} 10px) repeat-x;
      background-size: 20px 14px;
    }
    .classic .scallop.bottom { transform: rotate(180deg); }
    .classic .hero {
      position: relative;
      height: 152px;
      background: linear-gradient(145deg, ${c.headerStart}, ${c.headerEnd});
      background-size: cover;
      background-position: center;
    }
    .classic .hero-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 20px 24px;
      background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.08) 100%);
    }
    .classic .eyebrow {
      display: block;
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 9px;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(255,255,255,.65);
      margin-bottom: 6px;
    }
    .classic .event-title {
      font-family: ${f.display};
      font-weight: ${w.display};
      font-size: 22px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #fff;
      max-width: 100%;
    }
    .classic .event-venue {
      margin-top: 4px;
      font-size: 11px;
      font-weight: ${w.body};
      color: rgba(255,255,255,.75);
      line-height: 1.4;
    }
    .classic .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      background: ${c.infoBackground};
      color: ${c.infoText};
    }
    .classic .detail {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,.06);
      border-right: 1px solid rgba(255,255,255,.06);
    }
    .classic .detail:nth-child(2n) { border-right: none; }
    .classic .detail:nth-last-child(-n+2) { border-bottom: none; }
    .classic .label {
      display: block;
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 9px;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: ${c.labelText};
      margin-bottom: 4px;
    }
    .classic .value {
      display: block;
      font-family: ${f.heading};
      font-weight: ${w.heading};
      font-size: 14px;
      line-height: 1.3;
    }
    .classic .mono {
      font-size: 12px;
      letter-spacing: .08em;
    }
    .classic .note {
      padding: 12px 20px 0;
      background: ${c.infoBackground};
      color: ${c.labelText};
      font-size: 11px;
      line-height: 1.5;
    }
    .classic .perforation {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      background: ${c.infoBackground};
    }
    .classic .perforation span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${c.cardBackground};
      opacity: .9;
    }
    .classic .qr-section {
      display: flex;
      justify-content: center;
      padding: 8px 24px 28px;
      background: ${c.infoBackground};
    }
    .classic .qr-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-radius: 12px;
      background: ${c.qrBackground};
    }
    .classic .qr {
      width: 148px;
      height: 148px;
      display: block;
    }
    .classic .qr-label {
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 9px;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: ${c.infoBackground};
      opacity: .55;
    }

    /* ── Sacred Stage ──────────────────────────────────── */
    .sacred {
      width: 840px;
      min-height: 300px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 38% 1fr;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,.05), 0 20px 40px rgba(0,0,0,.14);
    }
    .sacred .panel.image {
      position: relative;
      background: ${c.imagePanelColor};
      background-size: cover;
      background-position: center;
    }
    .sacred .image-shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(0,0,0,.15) 0%, transparent 40%, transparent 100%);
    }
    .sacred .panel.info {
      color: ${c.panelTextColor};
      padding: 28px 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
    }
    .sacred .info-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    .sacred .copy { flex: 1; min-width: 0; }
    .sacred .eyebrow {
      display: block;
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 9px;
      letter-spacing: .22em;
      text-transform: uppercase;
      opacity: .7;
      margin-bottom: 8px;
    }
    .sacred .event {
      font-family: ${f.display};
      font-weight: ${w.display};
      font-size: 26px;
      line-height: 1.12;
      letter-spacing: -0.025em;
      max-width: 100%;
    }
    .sacred .venue {
      margin-top: 8px;
      font-size: 12px;
      font-weight: ${w.body};
      opacity: .82;
      line-height: 1.45;
    }
    .sacred .qr-box {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 10px;
      background: ${c.qrBackground};
    }
    .sacred .qr-box .qr {
      width: 88px;
      height: 88px;
      display: block;
    }
    .sacred .qr-box span {
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 8px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: ${c.accentColor};
    }
    .sacred .divider {
      height: 1px;
      background: linear-gradient(90deg, rgba(255,255,255,.25), rgba(255,255,255,.08));
    }
    .sacred .meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .sacred .meta-item { min-width: 0; }
    .sacred .meta .k {
      display: block;
      font-family: ${f.label};
      font-weight: ${w.label};
      font-size: 8px;
      letter-spacing: .16em;
      text-transform: uppercase;
      opacity: .65;
      margin-bottom: 5px;
    }
    .sacred .meta .v {
      display: block;
      font-family: ${f.heading};
      font-weight: ${w.heading};
      font-size: 15px;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    .sacred .note {
      font-size: 11px;
      line-height: 1.5;
      opacity: .78;
      margin-top: -4px;
    }
    .sacred .notch {
      position: absolute;
      top: 50%;
      width: 18px;
      height: 36px;
      background: ${c.stubNotchColor};
      border-radius: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    .sacred .notch.left { left: calc(38% - 9px); }
    .sacred .notch.right { right: -9px; }
  `
}

export function buildTicketHtml(template, data) {
  const body = template === 'classic' ? classicHtml(data) : sacredStageHtml(data)
  const fontsBaseUrl = data.fontsBaseUrl || ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    ${buildGothamFontFaceCss(fontsBaseUrl)}
    ${ticketStyles(data)}
  </style>
</head>
<body>${body}</body>
</html>`
}

export function buildTicketBodyHtml(template, data) {
  return template === 'classic' ? classicHtml(data) : sacredStageHtml(data)
}
