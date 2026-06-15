-- Blog writers may only read and edit their own posts.

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS blog_posts_author_user_id_idx
  ON public.blog_posts (author_user_id);

-- Backfill ownership from editor metadata or author name.
UPDATE public.blog_posts bp
SET author_user_id = bp.updated_by
WHERE bp.author_user_id IS NULL
  AND bp.updated_by IS NOT NULL;

UPDATE public.blog_posts bp
SET author_user_id = p.user_id
FROM public.profiles p
WHERE bp.author_user_id IS NULL
  AND p.role = 'blog_writer'
  AND p.status = 'active'
  AND p.full_name IS NOT NULL
  AND trim(p.full_name) <> ''
  AND lower(trim(bp.author)) = lower(trim(p.full_name));

CREATE OR REPLACE FUNCTION public.is_blog_writer_only()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role = 'blog_writer'
  );
$$;

CREATE OR REPLACE FUNCTION public.set_blog_post_author_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF public.is_blog_writer_only() THEN
      NEW.author_user_id := auth.uid();
    ELSIF NEW.author_user_id IS NULL THEN
      NEW.author_user_id := auth.uid();
    END IF;
  ELSIF TG_OP = 'UPDATE' AND public.is_blog_writer_only() THEN
    IF NEW.author_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Blog writers can only edit their own posts';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_set_author_user ON public.blog_posts;
CREATE TRIGGER blog_posts_set_author_user
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_post_author_user();

DROP POLICY IF EXISTS blog_writer_access ON public.blog_posts;

CREATE POLICY blog_moderator_access ON public.blog_posts FOR ALL TO authenticated
  USING (public.can_publish_blog())
  WITH CHECK (public.can_publish_blog());

CREATE POLICY blog_writer_own_access ON public.blog_posts FOR ALL TO authenticated
  USING (
    public.is_blog_writer_only()
    AND author_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_blog_writer_only()
    AND author_user_id = auth.uid()
  );

COMMENT ON COLUMN public.blog_posts.author_user_id IS
  'Owning CMS user; blog writers are restricted to rows where this matches auth.uid().';
