import { supabase } from "@/integrations/supabase/client";

/**
 * Replit backend base URL.
 * Falls back to VITE_REPLIT_INBOX_URL / VITE_REPLIT_ADVISOR_URL for backwards compat,
 * then to the pinned Replit dev origin. Auth is enforced server-side via Supabase JWT.
 */
export const REPLIT_URL: string =
  (import.meta.env.VITE_REPLIT_URL as string | undefined) ||
  (import.meta.env.VITE_REPLIT_INBOX_URL as string | undefined) ||
  (import.meta.env.VITE_REPLIT_ADVISOR_URL as string | undefined) ||
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev";

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