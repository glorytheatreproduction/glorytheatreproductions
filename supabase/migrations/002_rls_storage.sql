-- RLS helpers & policies

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('editor', 'admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('admin', 'super_admin')
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_admin ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Site content — public read, staff write
CREATE POLICY site_content_read ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_content_staff ON public.site_content FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Events — published public read
CREATE POLICY events_public_read ON public.events FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY events_staff ON public.events FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Gallery — published public read
CREATE POLICY gallery_public_read ON public.gallery_albums FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY gallery_staff ON public.gallery_albums FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Blog — published public read
CREATE POLICY blog_public_read ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY blog_staff ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Media — public read, staff write
CREATE POLICY media_read ON public.media_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY media_staff ON public.media_assets FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY storage_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public');

CREATE POLICY storage_staff_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public' AND public.is_staff());

CREATE POLICY storage_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'public' AND public.is_staff());

CREATE POLICY storage_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'public' AND public.is_staff());
