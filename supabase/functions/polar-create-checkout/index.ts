import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const POLAR_API = "https://api.polar.sh/v1";

const PLAN_BASE: Record<string, { price: number; discount: number; name: string }> = {
  basic:   { price: 25,  discount: 12, name: "Basic" },
  pro:     { price: 52,  discount: 15, name: "Pro" },
  premium: { price: 108, discount: 20, name: "Premium" },
};

const CAMPAIGN_END = new Date("2026-07-31T23:59:59Z");
const CAMPAIGN_START = new Date("2026-04-30T00:00:00Z");
const CAP = 100;

async function polarFetch(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("POLAR_ACCESS_TOKEN");
  if (!token) throw new Error("POLAR_ACCESS_TOKEN not configured");
  const res = await fetch(`${POLAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Polar API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Find or create a Polar product for a plan + price tier (full or discounted).
 * Stored by metadata.tier so we never duplicate.
 */
async function findOrCreateProduct(plan: string, tier: "full" | "launch") {
  const planInfo = PLAN_BASE[plan];
  const isDiscounted = tier === "launch";
  const priceAmount = isDiscounted
    ? Math.round(planInfo.price * (1 - planInfo.discount / 100) * 100)
    : planInfo.price * 100;

  // Try to find existing
  const list = await polarFetch(`/products/?limit=100`);
  const existing = (list.items || []).find(
    (p: any) =>
      p.metadata?.hostflow_plan === plan &&
      p.metadata?.hostflow_tier === tier
  );
  if (existing) return existing;

  // Create new
  const name = isDiscounted
    ? `HostFlow AI ${planInfo.name} (Launch -${planInfo.discount}%)`
    : `HostFlow AI ${planInfo.name}`;

  const created = await polarFetch(`/products/`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description: `${planInfo.name} subscription for HostFlow AI. Monthly recurring billing in GBP.`,
      recurring_interval: "month",
      prices: [
        {
          amount_type: "fixed",
          price_amount: priceAmount,
          price_currency: "gbp",
        },
      ],
      metadata: {
        hostflow_plan: plan,
        hostflow_tier: tier,
      },
    }),
  });
  return created;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: require logged-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, returnUrl } = await req.json();
    if (!plan || !PLAN_BASE[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client to check redemption eligibility
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date();

    let tier: "full" | "launch" = "full";
    if (now >= CAMPAIGN_START && now <= CAMPAIGN_END) {
      // Check cap for this plan
      const { count } = await admin
        .from("launch_discount_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("plan", plan);

      // Check user hasn't already redeemed this plan
      const { data: existing } = await admin
        .from("launch_discount_redemptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan", plan)
        .maybeSingle();

      if ((count ?? 0) < CAP && !existing) tier = "launch";
    }

    const product = await findOrCreateProduct(plan, tier);
    const productId = product.id;

    const baseUrl = (returnUrl as string) || `${req.headers.get("origin") || ""}`;
    const successUrl = `${baseUrl}/checkout-success?checkout_id={CHECKOUT_ID}`;
    const cancelUrl = `${baseUrl}/checkout-cancelled`;

    const checkout = await polarFetch(`/checkouts/`, {
      method: "POST",
      body: JSON.stringify({
        products: [productId],
        success_url: successUrl,
        // Polar shows this when the customer abandons checkout
        customer_cancel_url: cancelUrl,
        external_customer_id: user.id,
        customer_email: user.email,
        metadata: {
          hostflow_user_id: user.id,
          hostflow_plan: plan,
          hostflow_tier: tier,
        },
      }),
    });

    return new Response(JSON.stringify({
      url: checkout.url,
      tier,
      plan,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[polar-create-checkout]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});