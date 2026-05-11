-- 1. New column for the private avatar path (does NOT touch legacy avatar_url)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;

-- 2. Private bucket for identity photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS policies on storage.objects scoped to this bucket.
-- A user can manage only files under their own user-id folder.
DROP POLICY IF EXISTS "profile_avatars_owner_select" ON storage.objects;
CREATE POLICY "profile_avatars_owner_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "profile_avatars_owner_insert" ON storage.objects;
CREATE POLICY "profile_avatars_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "profile_avatars_owner_update" ON storage.objects;
CREATE POLICY "profile_avatars_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "profile_avatars_owner_delete" ON storage.objects;
CREATE POLICY "profile_avatars_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);