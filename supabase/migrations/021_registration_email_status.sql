-- Track whether each guest's ticket email actually went out.
--
-- The generate-ticket function uses email_sent_at to avoid emailing a guest twice when an admin
-- regenerates a ticket (it only re-sends when explicitly asked). email_status will also let the
-- confirmation screen and admin view show the real outcome instead of always saying "sent".
--
--   pending  – not attempted yet
--   sent     – delivered to the email service
--   failed   – the email service rejected it, or every attempt failed
--   skipped  – no email service is configured
--   no_email – the guest registered with a phone number only

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_email_status_check;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_email_status_check
  CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped', 'no_email'));

-- ── Backfill existing registrations (only rows still 'pending', so re-running is safe) ──────────
-- Guests without an email address.
UPDATE public.registrations
SET email_status = 'no_email'
WHERE email_status = 'pending'
  AND coalesce(email::text, '') = '';

-- Generated tickets with no email error logged were most likely emailed. Marking them 'sent'
-- stops a "Regenerate all" from emailing every existing guest again.
UPDATE public.registrations r
SET email_status = 'sent',
    email_sent_at = r.updated_at
WHERE r.email_status = 'pending'
  AND r.ticket_status = 'generated'
  AND NOT EXISTS (
    SELECT 1 FROM public.ticket_generation_errors e
    WHERE e.registration_id = r.id AND e.error_message ILIKE 'Email%'
  );

-- Generated tickets whose email was skipped or failed.
UPDATE public.registrations r
SET email_status = 'failed'
WHERE r.email_status = 'pending'
  AND r.ticket_status = 'generated';
