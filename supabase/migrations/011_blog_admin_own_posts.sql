-- Blog admins see and edit only their own posts (staff editors still see all).

CREATE OR REPLACE FUNCTION public.is_scoped_blog_author()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.status = 'active'
      AND p.role IN ('blog_writer', 'blog_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.set_blog_post_author_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF public.is_scoped_blog_author() THEN
      NEW.author_user_id := auth.uid();
    ELSIF NEW.author_user_id IS NULL THEN
      NEW.author_user_id := auth.uid();
    END IF;
  ELSIF TG_OP = 'UPDATE' AND public.is_scoped_blog_author() THEN
    IF NEW.author_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'You can only edit your own posts';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS blog_moderator_access ON public.blog_posts;

CREATE POLICY blog_staff_access ON public.blog_posts FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY blog_admin_own_access ON public.blog_posts FOR ALL TO authenticated
  USING (
    public.is_blog_admin()
    AND author_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_blog_admin()
    AND author_user_id = auth.uid()
  );

COMMENT ON COLUMN public.blog_posts.author_user_id IS
  'Owning CMS user; blog writers and blog admins are restricted to rows where this matches auth.uid().';
