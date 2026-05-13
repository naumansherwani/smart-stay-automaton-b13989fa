-- Admin SELECT on email_send_log
CREATE POLICY "Admins can view email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin DELETE on suppressed_emails
CREATE POLICY "Admins can delete suppressed emails"
ON public.suppressed_emails
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role DELETE on email_unsubscribe_tokens (for cleanup)
CREATE POLICY "Service role can delete unsubscribe tokens"
ON public.email_unsubscribe_tokens
FOR DELETE
TO service_role
USING (true);