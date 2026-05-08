import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Compute a deterministic 0-100 churn score from observable signals
function score(signals: Record<string, any>) {
  let s = 0;
  if (signals.no_login_days >= 14) s += 35;
  else if (signals.no_login_days >= 7) s += 20;
  else if (signals.no_login_days >= 3) s += 8;

  if (signals.feature_usage_count === 0) s += 25;
  else if (signals.feature_usage_count < 3) s += 12;

  if (signals.incomplete_onboarding) s += 15;
  if (signals.payment_issue) s += 20;
  if (signals.complaints > 0) s += Math.min(20, signals.complaints * 8);
  if (signals.trial_ending_soon) s += 10;

  return Math.min(100, Math.max(0, s));
}

function suggest(s: number, signals: Record<string, any>): string {
  if (s >= 70) return 'Send personal win-back offer immediately';
  if (s >= 50) return 'Send re-engagement email + 20% discount';
  if (signals.incomplete_onboarding) return 'Trigger onboarding nudge';
  if (signals.no_login_days >= 7) return 'Send "we miss you" email';
  return 'Monitor — healthy';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Admin-only (cron also uses service role). Auth is always required.
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    let isCron = false;
    const token = authHeader.replace('Bearer ', '');
    if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      isCron = true;
    } else {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      const { data: roleOk } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!roleOk) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Fetch all users
    const { data: profiles } = await supabase.from('profiles').select('user_id, industry');
    if (!profiles?.length) return new Response(JSON.stringify({ scored: 0 }), { headers: corsHeaders });

    const now = Date.now();
    let scoredCount = 0;

    for (const p of profiles) {
      const uid = p.user_id;
      // Last login (proxy: most recent activity log or feature usage)
      const [{ data: lastLog }, { data: usageRows }, { data: subRow }] = await Promise.all([
        supabase.from('crm_activity_logs').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('feature_usage').select('id, last_used_at').eq('user_id', uid),
        supabase.from('subscriptions').select('status, trial_ends_at, plan').eq('user_id', uid).maybeSingle(),
      ]);

      const lastActiveAt = lastLog?.created_at ? new Date(lastLog.created_at).getTime() : 0;
      const noLoginDays = lastActiveAt ? Math.floor((now - lastActiveAt) / (1000 * 60 * 60 * 24)) : 30;
      const featureCount = usageRows?.length ?? 0;
      const trialEndingSoon = subRow?.status === 'trialing' && subRow?.trial_ends_at && (new Date(subRow.trial_ends_at).getTime() - now) < 3 * 24 * 60 * 60 * 1000;

      const signals = {
        no_login_days: noLoginDays,
        feature_usage_count: featureCount,
        incomplete_onboarding: featureCount < 2,
        payment_issue: subRow?.status === 'past_due',
        complaints: 0,
        trial_ending_soon: !!trialEndingSoon,
      };
      const s = score(signals);
      const prob = Math.min(99, Math.round(s * 0.95));

      await supabase.from('churn_risk_scores').upsert({
        user_id: uid,
        risk_score: s,
        cancel_probability: prob,
        signals,
        suggested_action: suggest(s, signals),
        computed_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      scoredCount++;
    }

    return new Response(JSON.stringify({ scored: scoredCount, isCron }), { headers: corsHeaders });
  } catch (e) {
    console.error('churn-risk-score error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});