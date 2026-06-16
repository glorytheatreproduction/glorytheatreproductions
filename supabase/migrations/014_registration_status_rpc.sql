-- Public ticket status lookup by registration ID (returns only non-sensitive fields)

CREATE OR REPLACE FUNCTION public.get_registration_ticket_status(p_registration_id uuid)
RETURNS TABLE (ticket_id text, ticket_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.ticket_id, r.ticket_status
  FROM public.registrations r
  WHERE r.id = p_registration_id;
$$;

REVOKE ALL ON FUNCTION public.get_registration_ticket_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_ticket_status(uuid) TO anon, authenticated;
