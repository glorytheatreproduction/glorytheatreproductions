-- Ticket scanner / check-in verification role

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'blog_writer', 'check_in', 'viewer'));

CREATE OR REPLACE FUNCTION public.is_check_in_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('check_in', 'editor', 'admin', 'super_admin')
  );
$$;
