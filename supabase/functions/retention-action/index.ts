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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { action, reason, reasonDetails, competitorName, featureRequested, valueSummary, offerShown, pauseDays, downgradeTo, freeText, satisfactionScore } = body;

    if (!action || !['stayed', 'paused', 'downgraded', 'canceled'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
    }

    // Fetch user profile for industry/country
    const { data: profile } = await supabase.from('profiles').select('industry, company_name').eq('user_id', user.id).maybeSingle();
    const { data: sub } = await supabase.from('subscriptions').select('id, plan').eq('user_id', user.id).maybeSingle();

    // Insert cancellation request
    const { data: cr, error: crErr } = await supabase
      .from('cancellation_requests')
      .insert({
        user_id: user.id,
        subscription_id: sub?.id ?? null,
        reason: reason || 'other',
        reason_details: reasonDetails ?? null,
        competitor_name: competitorName ?? null,
        feature_requested: featureRequested ?? null,
        value_summary: valueSummary ?? {},
        offer_shown: offerShown ?? null,
        final_action: action,
        industry: profile?.industry ?? null,
        plan: sub?.plan ?? null,
      })
      .select()
      .single();
    if (crErr) throw crErr;

    // Handle action
    if (action === 'paused' && pauseDays && [7, 30, 60].includes(pauseDays)) {
      const ends = new Date(Date.now() + pauseDays * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('subscription_pauses').insert({
        user_id: user.id,
        subscription_id: sub?.id ?? null,
        pause_days: pauseDays,
        ends_at: ends,
      });
      if (sub?.id) {
        await supabase.from('subscriptions').update({ status: 'paused' as any }).eq('id', sub.id);
      }
    } else if (action === 'canceled') {
      if (sub?.id) {
        await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('id', sub.id);
      }
      // Save exit survey if free text supplied
      if (freeText || satisfactionScore) {
        await supabase.from('exit_surveys').insert({
          user_id: user.id,
          cancellation_request_id: cr.id,
          free_text: freeText ?? null,
          satisfaction_score: satisfactionScore ?? null,
        });
      }

      // 🎯 Auto-generate Win-Back Offer in user's preferred language
      try {
        const { data: prefLang } = await supabase
          .from('profiles').select('preferred_language').eq('user_id', user.id).maybeSingle();
        const language = (prefLang as any)?.preferred_language || 'en';

        const { data: campaign } = await supabase
          .from('win_back_campaigns')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (campaign) {
          const expiresAt = new Date(Date.now() + (campaign.expiry_days || 7) * 86400000).toISOString();
          const discountCode = `WB${campaign.discount_percent}-${user.id.slice(0, 6).toUpperCase()}`;
          await supabase.from('win_back_offers').insert({
            user_id: user.id,
            campaign_id: campaign.id,
            cancellation_request_id: cr.id,
            language,
            discount_code: discountCode,
            expires_at: expiresAt,
            status: 'pending', // admin will approve, then script generated
          });
        }
      } catch (wbErr) {
        console.warn('win-back offer queue failed (non-fatal):', wbErr);
      }
    } else if (action === 'downgraded' && downgradeTo) {
      if (sub?.id) {
        const VALID_DOWNGRADES = ['basic', 'trial'];
        if (!VALID_DOWNGRADES.includes(downgradeTo)) {
          return new Response(JSON.stringify({ error: 'Invalid downgrade plan' }), { status: 400, headers: corsHeaders });
        }
        await supabase.from('subscriptions').update({ plan: downgradeTo }).eq('id', sub.id);
      }
    }

    return new Response(JSON.stringify({ success: true, cancellationRequestId: cr.id }), { headers: corsHeaders });
  } catch (e) {
    console.error('retention-action error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});