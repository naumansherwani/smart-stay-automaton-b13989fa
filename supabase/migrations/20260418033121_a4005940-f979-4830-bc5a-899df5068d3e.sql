CREATE POLICY "Users can delete own withdrawal requests"
ON public.withdrawal_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conflicts"
ON public.booking_conflicts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);