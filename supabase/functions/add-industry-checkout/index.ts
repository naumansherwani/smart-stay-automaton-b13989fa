import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_CONFIG: Record<string, { price: number; maxIndustries: number; discounts: number[]; priceId: string }> = {
  basic: { price: 25, maxIndustries: 2, discounts: [0, 10], priceId: "price_1TK6mV4yrCh8Ql75FqqZJ6M9" },
  pro: { price: 55, maxIndustries: 3, discounts: [0, 10, 15], priceId: "price_1TK6ms4yrCh8Ql757Y9c5Rnk" },
  premium: { price: 110, maxIndustries: 4, discounts: [0, 12, 15, 20], priceId: "price_1TK6oO4yrCh8Ql751jCdSVcs" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    // Parse body
    const body = await req.json();
    const { plan, industry, industryNumber, basePrice, discountPercentage, discountAmount, finalPrice } = body;

    if (!plan || !industry || !industryNumber) {
      throw new Error("Missing required fields: plan, industry, industryNumber");
    }

    const planConfig = PLAN_CONFIG[plan];
    if (!planConfig) throw new Error("Invalid plan");

    // Verify industry count server-side
    const { data: existingWorkspaces } = await supabaseClient
      .from("workspaces")
      .select("id, industry")
      .eq("user_id", user.id);

    const currentCount = existingWorkspaces?.length || 0;

    // Check limit
    if (currentCount >= planConfig.maxIndustries) {
      throw new Error(`Plan limit reached. ${plan} allows max ${planConfig.maxIndustries} industries.`);
    }

    // Check duplicate industry
    if (existingWorkspaces?.some(w => w.industry === industry)) {
      throw new Error("You already have a workspace for this industry.");
    }

    // Server-side recalculate price for security
    const serverDiscountPct = planConfig.discounts[currentCount] || 0;
    const serverBasePrice = planConfig.price;
    const serverDiscountAmount = Math.round((serverBasePrice * serverDiscountPct) / 100 * 100) / 100;
    const serverFinalPrice = Math.round((serverBasePrice - serverDiscountAmount) * 100) / 100;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create a coupon for the discount if applicable
    let discounts: any[] = [];
    if (serverDiscountPct > 0) {
      const coupon = await stripe.coupons.create({
        percent_off: serverDiscountPct,
        duration: "forever",
        name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} - Industry #${currentCount + 1} (${serverDiscountPct}% off)`,
      });
      discounts = [{ coupon: coupon.id }];
    }

    const origin = req.headers.get("origin") || "https://smart-stay-automaton.lovable.app";

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: "subscription",
      discounts,
      success_url: `${origin}/dashboard?new_industry=${industry}&plan=${plan}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        user_id: user.id,
        plan,
        industry,
        industry_number: String(currentCount + 1),
        base_price: String(serverBasePrice),
        discount_percentage: String(serverDiscountPct),
        discount_amount: String(serverDiscountAmount),
        final_price: String(serverFinalPrice),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
