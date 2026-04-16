import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, type PaddleEnv } from '../_shared/paddle.ts';

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
    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { environment } = await req.json();
    const env = (environment || 'sandbox') as PaddleEnv;

    // Get user's subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('paddle_subscription_id, paddle_customer_id, environment')
      .eq('user_id', user.id)
      .eq('environment', env)
      .not('paddle_subscription_id', 'is', null)
      .single();

    if (!sub?.paddle_customer_id || !sub?.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), { status: 404, headers: corsHeaders });
    }

    const paddle = getPaddleClient(env);
    const portalSession = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      [sub.paddle_subscription_id]
    );

    const portalUrl = (portalSession as any)?.urls?.general?.overview;
    if (!portalUrl) {
      return new Response(JSON.stringify({ error: 'Could not generate portal URL' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url: portalUrl }), { headers: corsHeaders });
  } catch (e) {
    console.error('Customer portal error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});
