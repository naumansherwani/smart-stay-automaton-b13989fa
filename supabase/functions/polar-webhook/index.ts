import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const PLAN_BASE: Record<string, { price: number; discount: number }> = {
  basic:   { price: 25,  discount: 12 },
  pro:     { price: 52,  discount: 15 },
  premium: { price: 108, discount: 20 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const WEBHOOK_SECRET = Deno.env.get("POLAR_WEBHOOK_SECRET");

  const rawBody = await req.text();
  let event: any;

  // Verify signature if secret configured
  if (WEBHOOK_SECRET) {
    try {
      const base64Secret = btoa(WEBHOOK_SECRET);
      const wh = new Webhook(base64Secret);
      const headers = {
        "webhook-id": req.headers.get("webhook-id") || "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
        "webhook-signature": req.headers.get("webhook-signature") || "",
      };
      event = wh.verify(rawBody, headers);
    } catch (err) {
      console.error("[polar-webhook] signature verification failed", err);
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    console.warn("[polar-webhook] POLAR_WEBHOOK_SECRET not set — skipping signature verification");
    event = JSON.parse(rawBody);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const type = event?.type as string;
  const data = event?.data || {};

  console.log(`[polar-webhook] event=${type} id=${data?.id}`);

  try {
    // Resolve user_id from external_customer_id or metadata
    const userId =
      data?.metadata?.hostflow_user_id ||
      data?.customer?.external_id ||
      data?.external_customer_id ||
      null;

    const planMeta = data?.metadata?.hostflow_plan || data?.product?.metadata?.hostflow_plan;
    const tierMeta = data?.metadata?.hostflow_tier || data?.product?.metadata?.hostflow_tier;

    switch (type) {
      case "checkout.updated":
      case "checkout.created": {
        // No state change yet; record happens on order/subscription events.
        break;
      }

      case "subscription.created":
      case "subscription.active":
      case "subscription.updated": {
        if (!userId) break;
        const plan = planMeta || "pro";
        const status = data.status === "active" || data.status === "trialing" ? "active" : data.status;

        await admin.from("subscriptions").upsert({
          user_id: userId,
          plan,
          status,
          polar_subscription_id: data.id,
          polar_customer_id: data.customer_id || data.customer?.id,
          polar_product_id: data.product_id || data.product?.id,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          cancel_at_period_end: !!data.cancel_at_period_end,
          discount_applied: tierMeta === "launch",
          discount_percent: tierMeta === "launch" ? PLAN_BASE[plan]?.discount : null,
        }, { onConflict: "user_id" });

        // Record redemption (idempotent via UNIQUE(user_id, plan))
        if (tierMeta === "launch" && PLAN_BASE[plan]) {
          const base = PLAN_BASE[plan].price;
          const discounted = Math.round(base * (1 - PLAN_BASE[plan].discount / 100) * 100) / 100;
          const lockedUntil = new Date();
          lockedUntil.setMonth(lockedUntil.getMonth() + 12);

          // Get user email for admin visibility
          const { data: profile } = await admin
            .from("profiles")
            .select("email, display_name")
            .eq("user_id", userId)
            .maybeSingle();

          await admin.from("launch_discount_redemptions").upsert({
            user_id: userId,
            user_email: (profile as any)?.email || (profile as any)?.display_name || null,
            plan,
            discount_percent: PLAN_BASE[plan].discount,
            original_price: base,
            discounted_price: discounted,
            polar_subscription_id: data.id,
            locked_until: lockedUntil.toISOString(),
          }, { onConflict: "user_id,plan" });
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        if (!userId) break;
        await admin.from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: true })
          .eq("user_id", userId)
          .eq("polar_subscription_id", data.id);
        break;
      }

      case "subscription.past_due": {
        if (!userId) break;
        await admin.from("subscriptions")
          .update({ status: "past_due", failed_payment_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("polar_subscription_id", data.id);
        break;
      }

      case "order.paid":
      case "order.created": {
        // Renewal or first payment confirmation — already handled by subscription events.
        break;
      }

      default:
        console.log(`[polar-webhook] unhandled event ${type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[polar-webhook] handler error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});