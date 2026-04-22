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
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { cancellationRequestId, language = 'en' } = await req.json().catch(() => ({}));
    const langName = LANG_NAME[language] || 'English';

    // Get default active campaign
    const { data: campaign } = await supabase
      .from('win_back_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ error: 'No active campaign' }), { status: 404, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from('profiles').select('display_name, company_name, industry').eq('user_id', user.id).maybeSingle();

    const userName = profile?.display_name || 'there';
    const discount = campaign.discount_percent || 30;
    const months = campaign.duration_months || 3;

    // Generate personalized script via Lovable AI
    const prompt = `You are a warm, empathetic customer success voice for HostFlow AI.
Write a SHORT (max 3 sentences, ~30 seconds spoken) personalized win-back voice message in ${langName}.

Customer: ${userName}
Industry: ${profile?.industry || 'business'}
Offer: ${discount}% off for ${months} months

Tone: Genuine, not salesy. Acknowledge their decision to leave. Offer the discount as a thank-you, not a desperate plea.
Language: Write ENTIRELY in ${langName} (not English unless language is en).
Do not include emojis or markdown. Just plain spoken words.
Do not mention specific discount codes — only the percentage.`;

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

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI gen failed:', errText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResp.json();
    const script = aiData.choices?.[0]?.message?.content?.trim() || '';

    if (!script) {
      return new Response(JSON.stringify({ error: 'Empty script' }), { status: 500, headers: corsHeaders });
    }

    const expiresAt = new Date(Date.now() + (campaign.expiry_days || 7) * 86400000).toISOString();
    const discountCode = `WB${discount}-${user.id.slice(0, 6).toUpperCase()}`;

    const { data: offer, error: offerErr } = await supabase
      .from('win_back_offers')
      .insert({
        user_id: user.id,
        campaign_id: campaign.id,
        cancellation_request_id: cancellationRequestId ?? null,
        language,
        voice_script: script,
        text_message: script,
        discount_code: discountCode,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();

    if (offerErr) throw offerErr;

    return new Response(JSON.stringify({ success: true, offer }), { headers: corsHeaders });
  } catch (e) {
    console.error('winback-generate-offer error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});