import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "hf_checkout_session";

export function getOrCreateCheckoutSession(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export type CheckoutEventType =
  | "opened"
  | "abandoned"
  | "completed"
  | "rescued"
  | "rescue_shown"
  | "rescue_dismissed";

export async function logCheckoutEvent(
  eventType: CheckoutEventType,
  data: {
    plan?: string;
    priceId?: string;
    sourcePage?: string;
    discountCode?: string;
    userId?: string | null;
    metadata?: Record<string, any>;
  } = {}
) {
  try {
    const sessionId = getOrCreateCheckoutSession();
    await supabase.from("checkout_events").insert({
      user_id: data.userId || null,
      session_id: sessionId,
      event_type: eventType,
      plan: data.plan || null,
      price_id: data.priceId || null,
      source_page: data.sourcePage || (typeof window !== "undefined" ? window.location.pathname : null),
      discount_code: data.discountCode || null,
      metadata: data.metadata || {},
    });
  } catch (e) {
    console.warn("checkout event log failed", e);
  }
}
