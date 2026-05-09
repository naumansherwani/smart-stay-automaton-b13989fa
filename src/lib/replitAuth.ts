import { supabase } from "@/integrations/supabase/client";
import { REPLIT_ORIGIN } from "@/lib/replitBase";

/**
 * Replit backend base URL.
 * Falls back to VITE_REPLIT_INBOX_URL / VITE_REPLIT_ADVISOR_URL for backwards compat,
 * then to the pinned Replit dev origin. Auth is enforced server-side via Supabase JWT.
 */
export const REPLIT_URL: string =
  REPLIT_ORIGIN;

/** Returns the current Supabase access token (JWT) or "" if signed out. */
export async function getAuthToken(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  } catch {
    return "";
  }
}

/**
 * Resolve the current user's industry from Supabase user metadata.
 * Falls back to "general" when not set.
 */
export async function getUserIndustry(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const industry = (meta.industry as string | undefined) ?? "general";
    return industry || "general";
  } catch {
    return "general";
  }
}

/** Synchronous variant for callers that already have the user object in scope. */
export function getUserIndustryFromUser(
  user: { user_metadata?: Record<string, unknown> | null } | null | undefined,
): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (meta.industry as string | undefined) || "general";
}