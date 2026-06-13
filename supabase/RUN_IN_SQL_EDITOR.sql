-- Run this entire file once in Supabase Dashboard → SQL Editor → New query → Run
-- Project: xjywhejhnplrdxyulnvk

-- ========== 001_cms_schema.sql ==========

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT '',
  day int,
  month text,
  year int,
  date_label text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  availability text NOT NULL DEFAULT 'Seats Available',
  featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  capacity int NOT NULL DEFAULT 100,
  entry_type text NOT NULL DEFAULT 'free',
  max_seats_per_rsvp int NOT NULL DEFAULT 4,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS events_published_idx ON public.events (published, sort_order);

CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'drama',
  date text NOT NULL DEFAULT '',
  cover text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS gallery_albums_published_idx ON public.gallery_albums (published, sort_order);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  read_time text NOT NULL DEFAULT '5 min',
  image text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (published, sort_order);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL DEFAULT 'general',
  bucket text NOT NULL DEFAULT 'public',
  path text NOT NULL,
  public_url text NOT NULL DEFAULT '',
  mime_type text,
  size_bytes bigint,
  alt text,
  title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);

CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets (folder, created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== 002_rls_storage.sql ==========

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

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_admin ON public.profiles;
CREATE POLICY profiles_admin ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_content_read ON public.site_content;
CREATE POLICY site_content_read ON public.site_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS site_content_staff ON public.site_content;
CREATE POLICY site_content_staff ON public.site_content FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY IF EXISTS events_staff ON public.events;
CREATE POLICY events_staff ON public.events FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS gallery_public_read ON public.gallery_albums;
CREATE POLICY gallery_public_read ON public.gallery_albums FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY IF EXISTS gallery_staff ON public.gallery_albums;
CREATE POLICY gallery_staff ON public.gallery_albums FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS blog_public_read ON public.blog_posts;
CREATE POLICY blog_public_read ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY IF EXISTS blog_staff ON public.blog_posts;
CREATE POLICY blog_staff ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS media_read ON public.media_assets;
CREATE POLICY media_read ON public.media_assets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS media_staff ON public.media_assets;
CREATE POLICY media_staff ON public.media_assets FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public');
DROP POLICY IF EXISTS storage_staff_upload ON storage.objects;
CREATE POLICY storage_staff_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public' AND public.is_staff());
DROP POLICY IF EXISTS storage_staff_update ON storage.objects;
CREATE POLICY storage_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'public' AND public.is_staff());
DROP POLICY IF EXISTS storage_staff_delete ON storage.objects;
CREATE POLICY storage_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'public' AND public.is_staff());
