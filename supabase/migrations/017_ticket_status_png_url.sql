-- Include ticket PNG URL in public status lookup (for on-page download fallback)

DROP FUNCTION IF EXISTS public.get_registration_ticket_status(uuid);

CREATE FUNCTION public.get_registration_ticket_status(p_registration_id uuid)
RETURNS TABLE (ticket_id text, ticket_status text, png_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.ticket_id, r.ticket_status, r.png_url
  FROM public.registrations r
  WHERE r.id = p_registration_id;
$$;

REVOKE ALL ON FUNCTION public.get_registration_ticket_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_ticket_status(uuid) TO anon, authenticated;
