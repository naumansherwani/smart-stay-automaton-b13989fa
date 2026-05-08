
-- Trigger-only or internal cron functions: revoke from public/anon/authenticated entirely.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.enqueue_email(text, jsonb)',
    'public.delete_email(text, bigint)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.read_email_batch(text, integer, integer)',
    'public.notify_refund_event()',
    'public.notify_high_value_churn()',
    'public.handle_new_user()',
    'public.bump_founder_conversation()',
    'public.check_crm_security()',
    'public.prevent_booking_tampering()',
    'public.prevent_railway_booking_tampering()',
    'public.update_updated_at_column()'
  ]) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- RLS / user-callable helpers: keep authenticated, revoke anon + public.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.has_role(uuid, app_role)',
    'public.has_active_subscription(uuid)',
    'public.has_lifetime_access(uuid)',
    'public.can_join_conversation(uuid)',
    'public.create_conversation_with_participant(uuid, text)',
    'public.insert_activity_log(text, text, text, uuid, text, jsonb)',
    'public.update_workspace_safe(uuid, text, boolean)',
    'public.get_launch_discount_status()'
  ]) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;
