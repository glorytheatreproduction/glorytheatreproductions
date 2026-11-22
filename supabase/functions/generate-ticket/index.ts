import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { buildTicketHtml } from '../../../shared/tickets/buildTicketHtml.js'
import { resolveTicketSettings } from '../../../shared/tickets/ticketTokens.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const SITE_CONTACT_EMAIL = 'glorytheatreproduction@gmail.com'
const SITE_FROM_EMAIL = `Glory Theatre <${SITE_CONTACT_EMAIL}>`

function resolveFromEmail(envValue: string) {
  const trimmed = envValue.trim()
  return trimmed || SITE_FROM_EMAIL
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getEnv(name) {
  return Deno.env.get(name) || ''
}

async function fetchQrBytes(payload) {
  return withRetry('QR image', async () => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=${encodeURIComponent(payload)}`
    const res = await fetch(url)
    if (!res.ok) throw new HttpError('QR generation failed', res.status)
    return new Uint8Array(await res.arrayBuffer())
  })
}

async function fetchQrDataUrl(payload) {
  const bytes = await fetchQrBytes(payload)
  return `data:image/png;base64,${bytesToBase64(bytes)}`
}

async function renderDesignedTicketPng(html, apiKey) {
  return withRetry('Ticket render', () => renderDesignedTicketPngOnce(html, apiKey))
}

async function renderDesignedTicketPngOnce(html, apiKey) {
  const res = await fetch('https://v2.api2pdf.com/chrome/html/image', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      options: { fullPage: true, type: 'png', viewportWidth: 984, viewportHeight: 420 },
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.pdf) {
    throw new HttpError(body?.error || body?.message || 'Designed ticket render failed', res.ok ? 502 : res.status)
  }

  const imageRes = await fetch(body.pdf)
  if (!imageRes.ok) throw new HttpError('Could not download rendered ticket image', imageRes.status)
  return new Uint8Array(await imageRes.arrayBuffer())
}

function buildTicketData(event, settings, registration, ticketId, qrDataUrl) {
  const resolved = resolveTicketSettings(
    {
      title: event.title,
      venue: event.venue,
      dateLabel: event.date_label,
      time: event.time,
      image: event.image,
      entryType: event.entry_type,
      ticketSettings: settings,
    },
    settings,
  )

  return {
    eventName: event.title,
    venue: resolved.venueName,
    date: resolved.dateLabel,
    time: resolved.timeLabel,
    amount: resolved.ticketAmountLabel,
    ticketId: `#${ticketId}`,
    attendeeName: registration.full_name,
    customMessage: resolved.customMessage,
    eventImageUrl: resolved.eventImageUrl,
    accentColor: resolved.colors.accentColor,
    colors: resolved.colors,
    fontsBaseUrl: getEnv('SITE_URL') || 'https://glorytheatreproductions.vercel.app',
    qrDataUrl,
  }
}

// Encodes in chunks: spreading a whole image into String.fromCharCode overflows the call stack
// once the image is larger than ~100 KB (the designed ticket is), which broke the attachment.
function bytesToBase64(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < view.length; i += 0x8000) {
    binary += String.fromCharCode(...view.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Retries ─────────────────────────────────────────────────────────────────
// Each outside call (QR image, ticket render, upload, email) gets 3 attempts in total.
const RETRY_DELAYS_MS = [1000, 3000]

class HttpError extends Error {
  status: number
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Network errors, timeouts, 429 and 5xx can succeed on another try. Other 4xx responses mean the
// request itself is wrong (bad key, unverified domain, invalid address), so retrying won't help.
function isRetryable(err) {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500
  return true
}

async function withRetry(label, fn) {
  let lastError
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === RETRY_DELAYS_MS.length) break
      console.warn(`${label} failed (attempt ${attempt + 1}), retrying: ${err.message}`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
  throw lastError
}

// ── Email ───────────────────────────────────────────────────────────────────
// Resend is the email service. SendGrid stays only until the theatre has a domain verified in
// Resend, because Resend can't send from a @gmail.com address and SendGrid can. Once FROM_EMAIL
// is an address on the verified domain, delete sendViaSendGrid and its branch in
// resolveEmailProvider.

function parseFromAddress(fromEmail: string) {
  const match = fromEmail.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: 'Glory Theatre', email: fromEmail.trim() }
}

function isGmailAddress(email: string) {
  return /@gmail\.com$/i.test(email.trim())
}

function resolveEmailProvider({ resendKey, sendgridKey, fromEmail }) {
  if (isGmailAddress(parseFromAddress(fromEmail).email)) {
    return sendgridKey
      ? { name: 'sendgrid', apiKey: sendgridKey }
      : { name: null, reason: 'FROM_EMAIL is a Gmail address, which only SendGrid can send from, and SENDGRID_API_KEY is not set' }
  }
  return resendKey
    ? { name: 'resend', apiKey: resendKey }
    : { name: null, reason: 'RESEND_API_KEY is not set' }
}

function buildTicketEmail({ name, eventName, ticketId, pngUrl }) {
  const safeName = escapeHtml(name)
  const safeEvent = escapeHtml(eventName)
  const safeTicketId = escapeHtml(ticketId)
  const safeUrl = escapeHtml(pngUrl)

  const ticketImage = pngUrl
    ? `<p><img src="${safeUrl}" alt="Your ticket for ${safeEvent}" width="600" style="display:block;max-width:100%;height:auto;border:0;" /></p>`
    : ''
  const downloadButton = pngUrl
    ? `<p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#c9a84c;color:#0a0804;text-decoration:none;font-weight:600;">Download ticket</a></p>`
    : ''

  const html = `
    <p>Hi ${safeName},</p>
    <p>Thank you for registering for <strong>${safeEvent}</strong>.</p>
    <p>Your ticket ID is <strong>#${safeTicketId}</strong>. Show the QR code on your ticket at the entrance. It is also attached to this email so you can open it without internet.</p>
    ${ticketImage}
    ${downloadButton}
    <p>Questions? Email <a href="mailto:${SITE_CONTACT_EMAIL}">${SITE_CONTACT_EMAIL}</a>.</p>
  `

  const text = [
    `Hi ${name},`,
    '',
    `Thank you for registering for ${eventName}.`,
    `Your ticket ID is #${ticketId}. Show the QR code on your ticket at the entrance. It is attached to this email.`,
    pngUrl ? `Download your ticket: ${pngUrl}` : '',
    '',
    `Questions? Email ${SITE_CONTACT_EMAIL}.`,
  ].join('\n')

  const subject = `Your ticket: ${String(eventName).replace(/[\r\n]+/g, ' ')}`

  return { subject, html, text }
}

function parseProviderError(text, fallback) {
  try {
    const parsed = JSON.parse(text)
    return parsed.message || parsed.errors?.[0]?.message || text || fallback
  } catch {
    return text || fallback
  }
}

async function sendViaResend({ apiKey, fromEmail, to, message, pngBase64, idempotencyKey }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Resend drops a repeat of the same key, so a retry after a timeout can't send twice.
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: fromEmail,
      reply_to: SITE_CONTACT_EMAIL,
      to: [to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: [{ filename: 'ticket.png', content: pngBase64, content_type: 'image/png' }],
    }),
  })

  if (!res.ok) {
    throw new HttpError(parseProviderError(await res.text(), 'Resend email failed'), res.status)
  }
}

// TEMPORARY — remove once a domain is verified in Resend (see note above).
async function sendViaSendGrid({ apiKey, fromEmail, to, name, message, pngBase64 }) {
  const from = parseFromAddress(fromEmail)

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name }] }],
      from: { email: from.email, name: from.name },
      reply_to: { email: SITE_CONTACT_EMAIL, name: 'Glory Theatre' },
      subject: message.subject,
      content: [
        { type: 'text/plain', value: message.text },
        { type: 'text/html', value: message.html },
      ],
      attachments: [
        { content: pngBase64, filename: 'ticket.png', type: 'image/png', disposition: 'attachment' },
      ],
    }),
  })

  if (!res.ok) {
    throw new HttpError(parseProviderError(await res.text(), 'SendGrid email failed'), res.status)
  }
}

async function deliverTicketEmail(provider, { fromEmail, to, name, eventName, ticketId, pngBytes, pngUrl, idempotencyKey }) {
  const message = buildTicketEmail({ name, eventName, ticketId, pngUrl })
  const pngBase64 = bytesToBase64(pngBytes)

  if (provider.name === 'resend') {
    await sendViaResend({ apiKey: provider.apiKey, fromEmail, to, message, pngBase64, idempotencyKey })
  } else {
    await sendViaSendGrid({ apiKey: provider.apiKey, fromEmail, to, name, message, pngBase64 })
  }
}

async function callerIsStaff(supabase, authHeader) {
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  const anonKey = getEnv('SUPABASE_ANON_KEY')
  if (!anonKey) return false

  const userClient = createClient(getEnv('SUPABASE_URL'), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  return Boolean(
    profile?.status === 'active'
    && ['editor', 'admin', 'super_admin'].includes(profile.role),
  )
}

// Draws a random ticket ID and saves it on the registration before the ticket is rendered, so the
// QR and image always carry the ID that is stored. Retries if another ticket took the same ID at
// the same moment (unique index → 23505). If a parallel run already assigned one, uses that.
async function reserveTicketId(supabase, registration) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { data: candidate, error: idError } = await supabase.rpc('next_ticket_id', {
      p_event_id: registration.event_id,
    })
    if (idError) throw idError

    const { data: saved, error: saveError } = await supabase
      .from('registrations')
      .update({ ticket_id: candidate, updated_at: new Date().toISOString() })
      .eq('id', registration.id)
      .is('ticket_id', null)
      .select('ticket_id')
      .maybeSingle()

    if (saveError?.code === '23505') continue
    if (saveError) throw saveError
    if (saved?.ticket_id) return saved.ticket_id

    const { data: current, error: readError } = await supabase
      .from('registrations')
      .select('ticket_id')
      .eq('id', registration.id)
      .single()
    if (readError) throw readError
    if (current?.ticket_id) return current.ticket_id
  }
  throw new Error('Could not assign a unique ticket ID')
}

// sendEmail: true re-sends the ticket email even if the guest was already emailed.
async function processRegistration(supabase, registrationId, { sendEmail = false } = {}) {
  const renderKey = getEnv('HTML_RENDER_API_KEY')
  const resendKey = getEnv('RESEND_API_KEY')
  const sendgridKey = getEnv('SENDGRID_API_KEY')
  const fromEmail = resolveFromEmail(getEnv('FROM_EMAIL'))

  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  if (regError || !registration) throw new Error(regError?.message || 'Registration not found')

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', registration.event_id)
    .single()

  if (eventError || !event) throw new Error(eventError?.message || 'Event not found')

  let ticketFailed = false
  let pngUrl = registration.png_url
  let ticketId = registration.ticket_id
  let qrPayload = registration.qr_payload
  let pngBytes = null

  try {
    if (!ticketId) {
      ticketId = await reserveTicketId(supabase, registration)
    }

    qrPayload = JSON.stringify({
      event_id: registration.event_id,
      registration_id: registration.id,
      ticket_id: ticketId,
      full_name: registration.full_name,
    })

    const settings = event.ticket_settings || {}
    const pngPath = `${registration.event_id}/${registration.id}.png`

    if (renderKey) {
      try {
        const qrDataUrl = await fetchQrDataUrl(qrPayload)
        const ticketData = buildTicketData(event, settings, registration, ticketId, qrDataUrl)
        const html = buildTicketHtml(event.ticket_template || 'sacred_stage', ticketData)
        pngBytes = await renderDesignedTicketPng(html, renderKey)
      } catch (renderErr) {
        await supabase.from('ticket_generation_errors').insert({
          registration_id: registration.id,
          error_message: `Designed ticket render failed, using QR fallback: ${renderErr.message}`,
        })
        pngBytes = await fetchQrBytes(qrPayload)
      }
    } else {
      pngBytes = await fetchQrBytes(qrPayload)
    }

    await withRetry('Ticket upload', async () => {
      const { error: uploadError } = await supabase.storage.from('tickets').upload(pngPath, pngBytes, {
        contentType: 'image/png',
        upsert: true,
      })
      if (uploadError) throw uploadError
    })

    const { data: pngPublic } = supabase.storage.from('tickets').getPublicUrl(pngPath)
    pngUrl = pngPublic.publicUrl

    const { error: saveError } = await supabase
      .from('registrations')
      .update({
        ticket_id: ticketId,
        qr_payload: qrPayload,
        png_url: pngUrl,
        pdf_url: null,
        ticket_status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)
    if (saveError) throw new Error(`Could not save ticket: ${saveError.message}`)
  } catch (err) {
    ticketFailed = true
    await supabase.from('ticket_generation_errors').insert({
      registration_id: registration.id,
      error_message: err.message || 'Ticket generation failed',
    })
    const { error: failError } = await supabase
      .from('registrations')
      .update({
        ticket_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)
    if (failError) console.error('Could not mark ticket as failed', registration.id, failError.message)
  }

  let emailStatus = registration.email_status
  let emailSentAt = registration.email_sent_at

  if (!ticketFailed && pngBytes) {
    const guestEmail = String(registration.email || '').trim()
    const logEmailError = (message) =>
      supabase.from('ticket_generation_errors').insert({ registration_id: registration.id, error_message: message })

    if (!guestEmail) {
      emailStatus = 'no_email'
    } else if (registration.email_sent_at && !sendEmail) {
      // Already emailed (e.g. an admin regenerated the ticket). Only re-send when asked to.
    } else {
      const provider = resolveEmailProvider({ resendKey, sendgridKey, fromEmail })

      if (!provider.name) {
        emailStatus = 'skipped'
        await logEmailError(`Email skipped: ${provider.reason}`)
      } else {
        // One key per run: retries inside this run can't double-send; an explicit re-send can.
        const idempotencyKey = `ticket-email/${registration.id}/${crypto.randomUUID()}`
        try {
          await withRetry('Ticket email', () =>
            deliverTicketEmail(provider, {
              fromEmail,
              to: guestEmail,
              name: registration.full_name,
              eventName: event.title,
              ticketId,
              pngBytes,
              pngUrl,
              idempotencyKey,
            }),
          )
          emailStatus = 'sent'
          emailSentAt = new Date().toISOString()
        } catch (err) {
          emailStatus = 'failed'
          await logEmailError(`Email failed (${provider.name}): ${err.message}`)
        }
      }
    }

    if (emailStatus !== registration.email_status || emailSentAt !== registration.email_sent_at) {
      const { error: emailSaveError } = await supabase
        .from('registrations')
        .update({ email_status: emailStatus, email_sent_at: emailSentAt })
        .eq('id', registration.id)
      if (emailSaveError) console.error('Could not save email status', registration.id, emailSaveError.message)
    }
  }

  return {
    registration_id: registration.id,
    ticket_status: ticketFailed ? 'failed' : 'generated',
    email_status: emailStatus,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const webhookSecret = getEnv('DATABASE_WEBHOOK_SECRET')

    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Supabase service env not configured' }, 500)
    }

    const incomingSecret = req.headers.get('x-webhook-secret') || ''
    const authHeader = req.headers.get('authorization') || ''
    const isService = serviceKey && authHeader.includes(serviceKey)
    const isWebhook = webhookSecret
      ? incomingSecret === webhookSecret
      : incomingSecret.length > 0

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const isStaff = !isService && !isWebhook ? await callerIsStaff(supabase, authHeader) : false

    if (!isService && !isWebhook && !isStaff) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json()
    const registrationId = body.registration_id || body.record?.id
    if (!registrationId) return json({ error: 'registration_id required' }, 400)

    const result = await processRegistration(supabase, registrationId, { sendEmail: body.send_email === true })
    return json({ success: true, ...result })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
