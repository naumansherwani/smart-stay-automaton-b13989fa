REVOKE SELECT (access_token_encrypted, refresh_token_encrypted) ON public.crm_google_connections FROM authenticated;
REVOKE SELECT (access_token_encrypted, refresh_token_encrypted) ON public.crm_google_connections FROM anon;
GRANT SELECT (id, user_id, google_email, scopes, token_expires_at, last_sync_at, sync_status, gmail_sync_enabled, calendar_sync_enabled, chat_sync_enabled, metadata, created_at, updated_at) ON public.crm_google_connections TO authenticated;
GRANT ALL ON public.crm_google_connections TO service_role;