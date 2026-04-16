import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { newPriceId, environment } = await req.json();
    if (!newPriceId) {
      return new Response(JSON.stringify({ error: 'newPriceId required' }), { status: 400, headers: corsHeaders });
    }

    const env = (environment || 'sandbox') as PaddleEnv;

    // Get user's current subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('paddle_subscription_id, environment')
      .eq('user_id', user.id)
      .eq('environment', env)
      .not('paddle_subscription_id', 'is', null)
      .single();

    if (!sub?.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), { status: 404, headers: corsHeaders });
    }

    // Resolve human-readable price ID to Paddle internal ID
    const priceRes = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(newPriceId)}`);
    const priceData = await priceRes.json();
    if (!priceData.data?.length) {
      return new Response(JSON.stringify({ error: 'Price not found' }), { status: 404, headers: corsHeaders });
    }
    const paddlePriceId = priceData.data[0].id;

    // Update subscription via Paddle API
    const updateRes = await gatewayFetch(env, `/subscriptions/${sub.paddle_subscription_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        items: [{ price_id: paddlePriceId, quantity: 1 }],
        proration_billing_mode: 'prorated_immediately',
      }),
    });

    const updateData = await updateRes.json();
    if (updateData.error) {
      console.error('Paddle update error:', updateData.error);
      return new Response(JSON.stringify({ error: updateData.error.detail || 'Failed to update subscription' }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (e) {
    console.error('Update subscription error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});
