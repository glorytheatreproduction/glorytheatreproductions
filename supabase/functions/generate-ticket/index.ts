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
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=${encodeURIComponent(payload)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('QR generation failed')
  return new Uint8Array(await res.arrayBuffer())
}

async function fetchQrDataUrl(payload) {
  const bytes = await fetchQrBytes(payload)
  const base64 = btoa(String.fromCharCode(...bytes))
  return `data:image/png;base64,${base64}`
}

async function renderDesignedTicketPng(html, apiKey) {
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

  const body = await res.json()
  if (!res.ok || !body?.pdf) {
    throw new Error(body?.error || body?.message || 'Designed ticket render failed')
  }

  const imageRes = await fetch(body.pdf)
  if (!imageRes.ok) throw new Error('Could not download rendered ticket image')
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

function pngToBase64(pngBytes) {
  return btoa(String.fromCharCode(...new Uint8Array(pngBytes)))
}

function parseResendError(text) {
  try {
    const parsed = JSON.parse(text)
    return parsed.message || text
  } catch {
    return text || 'Resend email failed'
  }
}

async function sendTicketEmail({
  apiKey,
  fromEmail,
  to,
  name,
  eventName,
  ticketId,
  pngBytes,
  pngUrl,
}) {
  const pngBase64 = pngToBase64(pngBytes)
  const html = buildTicketEmailHtml({ name, eventName, ticketId, pngUrl })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      reply_to: SITE_CONTACT_EMAIL,
      to: [to],
      subject: `Your Ticket: ${eventName}`,
      html,
      attachments: [
        {
          filename: 'ticket.png',
          content: pngBase64,
          type: 'image/png',
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(parseResendError(err))
  }
}

function parseFromAddress(fromEmail: string) {
  const match = fromEmail.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: 'Glory Theatre', email: fromEmail.trim() }
}

function isGmailAddress(email: string) {
  return /@gmail\.com$/i.test(email.trim())
}

function buildTicketEmailHtml({ name, eventName, ticketId, pngUrl }) {
  const downloadBlock = pngUrl
    ? `<p><a href="${pngUrl}" style="display:inline-block;padding:12px 18px;background:#c9a84c;color:#0a0804;text-decoration:none;font-weight:600;">Download Ticket (PNG)</a></p>`
    : ''

  return `
    <p>Hi ${name},</p>
    <p>Thank you for registering for <strong>${eventName}</strong>.</p>
    <p>Your ticket ID is <strong>#${ticketId}</strong>. Your QR code ticket is attached — present it at the venue for entry.</p>
    ${downloadBlock}
    <p>Questions? Email <a href="mailto:${SITE_CONTACT_EMAIL}">${SITE_CONTACT_EMAIL}</a>.</p>
  `
}

async function sendTicketEmailViaSendGrid({
  apiKey,
  fromEmail,
  to,
  name,
  eventName,
  ticketId,
  pngBytes,
  pngUrl,
}) {
  const from = parseFromAddress(fromEmail)
  const pngBase64 = pngToBase64(pngBytes)
  const html = buildTicketEmailHtml({ name, eventName, ticketId, pngUrl })

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
      subject: `Your Ticket: ${eventName}`,
      content: [{ type: 'text/html', value: html }],
      attachments: [
        {
          content: pngBase64,
          filename: 'ticket.png',
          type: 'image/png',
          disposition: 'attachment',
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'SendGrid email failed')
  }
}

async function deliverTicketEmail({
  resendKey,
  sendgridKey,
  fromEmail,
  to,
  name,
  eventName,
  ticketId,
  pngBytes,
  pngUrl,
}) {
  const useSendGridFirst = isGmailAddress(parseFromAddress(fromEmail).email)

  if (useSendGridFirst && sendgridKey) {
    await sendTicketEmailViaSendGrid({
      apiKey: sendgridKey,
      fromEmail,
      to,
      name,
      eventName,
      ticketId,
      pngBytes,
      pngUrl,
    })
    return 'sendgrid'
  }

  if (resendKey && !useSendGridFirst) {
    try {
      await sendTicketEmail({
        apiKey: resendKey,
        fromEmail,
        to,
        name,
        eventName,
        ticketId,
        pngBytes,
        pngUrl,
      })
      return 'resend'
    } catch (err) {
      if (sendgridKey) {
        await sendTicketEmailViaSendGrid({
          apiKey: sendgridKey,
          fromEmail,
          to,
          name,
          eventName,
          ticketId,
          pngBytes,
          pngUrl,
        })
        return 'sendgrid'
      }
      throw err
    }
  }

  if (sendgridKey) {
    await sendTicketEmailViaSendGrid({
      apiKey: sendgridKey,
      fromEmail,
      to,
      name,
      eventName,
      ticketId,
      pngBytes,
      pngUrl,
    })
    return 'sendgrid'
  }

  if (resendKey) {
    await sendTicketEmail({
      apiKey: resendKey,
      fromEmail,
      to,
      name,
      eventName,
      ticketId,
      pngBytes,
      pngUrl,
    })
    return 'resend'
  }

  throw new Error('No email provider configured (set SENDGRID_API_KEY or a verified Resend domain)')
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

async function processRegistration(supabase, registrationId) {
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
      const { data: nextId, error: idError } = await supabase.rpc('next_ticket_id', {
        p_event_id: registration.event_id,
      })
      if (idError) throw idError
      ticketId = nextId
    }

    qrPayload = JSON.stringify({
      event_id: registration.event_id,
      registration_id: registration.id,
      ticket_id: ticketId,
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

    const pngUpload = await supabase.storage.from('tickets').upload(pngPath, pngBytes, {
      contentType: 'image/png',
      upsert: true,
    })
    if (pngUpload.error) throw pngUpload.error

    const { data: pngPublic } = supabase.storage.from('tickets').getPublicUrl(pngPath)
    pngUrl = pngPublic.publicUrl

    await supabase
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
  } catch (err) {
    ticketFailed = true
    await supabase.from('ticket_generation_errors').insert({
      registration_id: registration.id,
      error_message: err.message || 'Ticket generation failed',
    })
    await supabase
      .from('registrations')
      .update({
        ticket_id: ticketId || registration.ticket_id,
        qr_payload: qrPayload || registration.qr_payload,
        ticket_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)
  }

  if (!ticketFailed && pngBytes) {
    const guestEmail = String(registration.email || '').trim()

    if (guestEmail && (resendKey || sendgridKey) && fromEmail) {
      try {
        await deliverTicketEmail({
          resendKey,
          sendgridKey,
          fromEmail,
          to: guestEmail,
          name: registration.full_name,
          eventName: event.title,
          ticketId,
          pngBytes,
          pngUrl,
        })
      } catch (err) {
        await supabase.from('ticket_generation_errors').insert({
          registration_id: registration.id,
          error_message: `Email failed: ${err.message}`,
        })
      }
    } else if (guestEmail && !resendKey && !sendgridKey) {
      await supabase.from('ticket_generation_errors').insert({
        registration_id: registration.id,
        error_message: 'Email skipped: set SENDGRID_API_KEY on Supabase (Gmail sender) or verify a custom domain in Resend',
      })
    }
  }

  return { registration_id: registration.id, ticket_status: ticketFailed ? 'failed' : 'generated' }
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

    const result = await processRegistration(supabase, registrationId)
    return json({ success: true, ...result })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
