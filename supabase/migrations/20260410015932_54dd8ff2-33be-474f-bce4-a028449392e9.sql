
-- Create separate admin-only table for withdrawal admin notes
CREATE TABLE public.withdrawal_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage withdrawal notes"
  ON public.withdrawal_admin_notes
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remove admin_notes column from withdrawal_requests
ALTER TABLE public.withdrawal_requests DROP COLUMN IF EXISTS admin_notes;
