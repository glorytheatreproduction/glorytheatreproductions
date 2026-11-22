-- Include the email outcome in the public status lookup, so the RSVP confirmation screen can tell
-- the guest whether their ticket was actually emailed (see 021_registration_email_status.sql).

DROP FUNCTION IF EXISTS public.get_registration_ticket_status(uuid);

CREATE FUNCTION public.get_registration_ticket_status(p_registration_id uuid)
RETURNS TABLE (ticket_id text, ticket_status text, png_url text, email_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.ticket_id, r.ticket_status, r.png_url, r.email_status
  FROM public.registrations r
  WHERE r.id = p_registration_id;
$$;

REVOKE ALL ON FUNCTION public.get_registration_ticket_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_ticket_status(uuid) TO anon, authenticated;
