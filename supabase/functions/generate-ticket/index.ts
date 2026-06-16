import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { buildTicketHtml } from '../../../shared/tickets/buildTicketHtml.js'
import { resolveTicketSettings } from '../../../shared/tickets/ticketTokens.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
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

async function renderHtmlAssets(html, apiKey) {
  if (!apiKey) {
    throw new Error('HTML_RENDER_API_KEY is not configured')
  }

  const pngRes = await fetch('https://v2.api2pdf.com/chrome/html/image', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      options: { fullPage: true, type: 'png', viewportWidth: 900, viewportHeight: 420 },
    }),
  })

  const pngJson = await pngRes.json()
  if (!pngRes.ok || !pngJson?.pdf) {
    throw new Error(pngJson?.error || 'PNG render failed')
  }

  const pdfRes = await fetch('https://v2.api2pdf.com/chrome/pdf/html', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      options: { pageWidth: 9, pageHeight: 4.5, printBackground: true },
    }),
  })

  const pdfJson = await pdfRes.json()
  if (!pdfRes.ok || !pdfJson?.pdf) {
    throw new Error(pdfJson?.error || 'PDF render failed')
  }

  const [pngBytes, pdfBytes] = await Promise.all([
    fetch(pngJson.pdf).then((r) => r.arrayBuffer()),
    fetch(pdfJson.pdf).then((r) => r.arrayBuffer()),
  ])

  return { pngBytes, pdfBytes }
}

async function sendResendEmail({
  apiKey,
  fromEmail,
  to,
  name,
  eventName,
  pdfUrl,
  pngBytes,
  ticketFailed,
}) {
  if (!apiKey) return

  const pngBase64 = pngBytes?.length
    ? btoa(String.fromCharCode(...new Uint8Array(pngBytes)))
    : null

  const html = ticketFailed
    ? `
      <p>Hi ${name},</p>
      <p>Thank you for registering for <strong>${eventName}</strong>.</p>
      <p>Your registration is confirmed. Your ticket will follow shortly — if you do not receive it within an hour, please contact us.</p>
    `
    : `
      <p>Hi ${name},</p>
      <p>Thank you for registering for <strong>${eventName}</strong>.</p>
      <p><a href="${pdfUrl}" style="display:inline-block;padding:12px 18px;background:#c9a84c;color:#0a0804;text-decoration:none;font-weight:600;">Download Ticket (PDF)</a></p>
      <p>Your ticket is also shown below. Present it at the venue for entry.</p>
      ${pngBase64 ? `<p><img src="data:image/png;base64,${pngBase64}" alt="Your ticket" style="max-width:100%;height:auto;" /></p>` : ''}
    `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: ticketFailed ? `Registration confirmed: ${eventName}` : `Your Ticket: ${eventName}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Resend email failed')
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

async function processRegistration(supabase, registrationId) {
  const renderKey = getEnv('HTML_RENDER_API_KEY')
  const resendKey = getEnv('RESEND_API_KEY')
  const fromEmail = getEnv('FROM_EMAIL') || 'Glory Theatre <tickets@glorytheatreproductions.com>'

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
  let pdfUrl = registration.pdf_url
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
    const qrDataUrl = await fetchQrDataUrl(qrPayload)
    const pngPath = `${registration.event_id}/${registration.id}.png`
    const pdfPath = `${registration.event_id}/${registration.id}.pdf`

    if (renderKey) {
      const ticketData = buildTicketData(event, settings, registration, ticketId, qrDataUrl)
      const html = buildTicketHtml(event.ticket_template || 'sacred_stage', ticketData)
      const rendered = await renderHtmlAssets(html, renderKey)
      pngBytes = rendered.pngBytes

      const pngUpload = await supabase.storage.from('tickets').upload(pngPath, rendered.pngBytes, {
        contentType: 'image/png',
        upsert: true,
      })
      if (pngUpload.error) throw pngUpload.error

      const pdfUpload = await supabase.storage.from('tickets').upload(pdfPath, rendered.pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })
      if (pdfUpload.error) throw pdfUpload.error
    } else {
      pngBytes = await fetchQrBytes(qrPayload)
      const pngUpload = await supabase.storage.from('tickets').upload(pngPath, pngBytes, {
        contentType: 'image/png',
        upsert: true,
      })
      if (pngUpload.error) throw pngUpload.error
    }

    const { data: pngPublic } = supabase.storage.from('tickets').getPublicUrl(pngPath)
    pngUrl = pngPublic.publicUrl

    if (renderKey) {
      const { data: pdfPublic } = supabase.storage.from('tickets').getPublicUrl(pdfPath)
      pdfUrl = pdfPublic.publicUrl
    } else {
      pdfUrl = null
    }

    await supabase
      .from('registrations')
      .update({
        ticket_id: ticketId,
        qr_payload: qrPayload,
        png_url: pngUrl,
        pdf_url: pdfUrl,
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

  try {
    if (resendKey) {
      await sendResendEmail({
        apiKey: resendKey,
        fromEmail,
        to: registration.email,
        name: registration.full_name,
        eventName: event.title,
        pdfUrl,
        pngBytes: pngBytes || new Uint8Array(),
        ticketFailed,
      })
    }
  } catch (err) {
    await supabase.from('ticket_generation_errors').insert({
      registration_id: registration.id,
      error_message: `Email failed: ${err.message}`,
    })
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
