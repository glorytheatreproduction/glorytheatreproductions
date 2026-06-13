-- Blog writer role + scoped permissions

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'blog_writer', 'viewer'));

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'viewer';

CREATE OR REPLACE FUNCTION public.is_blog_writer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('blog_writer', 'editor', 'admin', 'super_admin')
  );
$$;

DROP POLICY IF EXISTS blog_staff ON public.blog_posts;
CREATE POLICY blog_writer_access ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_blog_writer()) WITH CHECK (public.is_blog_writer());

DROP POLICY IF EXISTS media_staff ON public.media_assets;
CREATE POLICY media_writer_access ON public.media_assets FOR ALL TO authenticated
  USING (public.is_staff() OR public.is_blog_writer())
  WITH CHECK (public.is_staff() OR public.is_blog_writer());

DROP POLICY IF EXISTS storage_staff_upload ON storage.objects;
CREATE POLICY storage_staff_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public' AND (public.is_staff() OR public.is_blog_writer()));

DROP POLICY IF EXISTS storage_staff_update ON storage.objects;
CREATE POLICY storage_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'public' AND (public.is_staff() OR public.is_blog_writer()));

DROP POLICY IF EXISTS storage_staff_delete ON storage.objects;
CREATE POLICY storage_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'public' AND (public.is_staff() OR public.is_blog_writer()));
