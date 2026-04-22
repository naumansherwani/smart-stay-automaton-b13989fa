import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const LANG_NAME: Record<string, string> = {
  en: 'English', hi: 'Hindi', ur: 'Urdu', ar: 'Arabic', es: 'Spanish',
  fr: 'French', de: 'German', 'de-CH': 'Swiss German', pt: 'Portuguese',
  zh: 'Mandarin Chinese', ja: 'Japanese', ko: 'Korean', tr: 'Turkish',
  it: 'Italian', ro: 'Romanian',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userRes } = await userClient.auth.getUser();
    const admin = userRes?.user;
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    // Verify admin
    const { data: roleData } = await supabase.rpc('has_role', { _user_id: admin.id, _role: 'admin' });
    if (!roleData) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });

    const { offerId, action } = await req.json();
    if (!offerId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid params' }), { status: 400, headers: corsHeaders });
    }

    if (action === 'reject') {
      await supabase.from('win_back_offers').update({
        status: 'rejected', approved_by: admin.id, approved_at: new Date().toISOString(),
      }).eq('id', offerId);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // Approve: generate AI script if missing
    const { data: offer } = await supabase
      .from('win_back_offers').select('*, win_back_campaigns(*)').eq('id', offerId).single();
    if (!offer) return new Response(JSON.stringify({ error: 'Offer not found' }), { status: 404, headers: corsHeaders });

    let script = offer.voice_script;
    if (!script) {
      const { data: profile } = await supabase
        .from('profiles').select('display_name, industry').eq('user_id', offer.user_id).maybeSingle();
      const langName = LANG_NAME[offer.language] || 'English';
      const camp: any = (offer as any).win_back_campaigns || {};
      const userName = profile?.display_name || 'there';
      const discount = camp.discount_percent || 30;
      const months = camp.duration_months || 3;

      const prompt = `You are a warm, empathetic customer success voice for HostFlow AI.
Write a SHORT (max 3 sentences, ~30 seconds spoken) personalized win-back voice message in ${langName}.
Customer: ${userName}
Industry: ${profile?.industry || 'business'}
Offer: ${discount}% off for ${months} months.
Tone: Genuine, warm, not salesy. Acknowledge their decision. Offer the discount as thank-you.
Write ENTIRELY in ${langName}. No emojis, no markdown, plain spoken words only.
Do not mention discount codes — only the percentage.`;

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        script = aiData.choices?.[0]?.message?.content?.trim() || '';
      }
    }

    await supabase.from('win_back_offers').update({
      status: 'approved',
      voice_script: script,
      text_message: script,
      approved_by: admin.id,
      approved_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    }).eq('id', offerId);

    return new Response(JSON.stringify({ success: true, script }), { headers: corsHeaders });
  } catch (e) {
    console.error('winback-approve-offer error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});