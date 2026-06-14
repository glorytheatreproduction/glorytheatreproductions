-- Blog admin: edit, approve, and publish blogs (Blog + Media CMS only)

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'blog_admin', 'blog_writer', 'check_in', 'viewer'));

CREATE OR REPLACE FUNCTION public.is_blog_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role = 'blog_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_publish_blog()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff() OR public.is_blog_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_blog_writer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('blog_writer', 'blog_admin', 'editor', 'admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_blog_writer_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_blog_writer() AND NOT public.can_publish_blog() THEN
    NEW.published := false;
    NEW.review_status := CASE
      WHEN NEW.review_status IN ('draft', 'pending') THEN NEW.review_status
      WHEN TG_OP = 'UPDATE' AND OLD.review_status IS NOT NULL THEN OLD.review_status
      ELSE 'draft'
    END;
  END IF;

  IF NEW.review_status = 'approved' AND NEW.published IS DISTINCT FROM true THEN
    NEW.published := true;
  END IF;

  IF NEW.published = true AND NEW.review_status IS DISTINCT FROM 'approved' THEN
    NEW.review_status := 'approved';
  END IF;

  IF NEW.published = false AND NEW.review_status = 'approved' THEN
    NEW.review_status := 'draft';
  END IF;

  RETURN NEW;
END;
$$;
