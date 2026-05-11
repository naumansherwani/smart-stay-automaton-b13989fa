-- 1. Attachments column on advisor_messages
ALTER TABLE public.advisor_messages
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Private bucket for advisor chat uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('advisor-attachments', 'advisor-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS — each user can only access their own folder (path prefix = user_id)
DROP POLICY IF EXISTS "advisor_attachments_select_own" ON storage.objects;
CREATE POLICY "advisor_attachments_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'advisor-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "advisor_attachments_insert_own" ON storage.objects;
CREATE POLICY "advisor_attachments_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'advisor-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "advisor_attachments_update_own" ON storage.objects;
CREATE POLICY "advisor_attachments_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'advisor-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "advisor_attachments_delete_own" ON storage.objects;
CREATE POLICY "advisor_attachments_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'advisor-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );