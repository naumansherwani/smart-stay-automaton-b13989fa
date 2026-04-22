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
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const { data: roleOk } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!roleOk) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });

    // Pull recent surveys + cancellation reasons
    const { data: surveys } = await supabase
      .from('exit_surveys')
      .select('free_text, satisfaction_score, cancellation_request_id')
      .order('created_at', { ascending: false })
      .limit(50);
    const { data: cancellations } = await supabase
      .from('cancellation_requests')
      .select('reason, reason_details, competitor_name, feature_requested')
      .order('created_at', { ascending: false })
      .limit(100);

    const text = [
      'EXIT SURVEYS:',
      ...(surveys ?? []).map((s, i) => `${i + 1}. score=${s.satisfaction_score ?? '-'} | ${s.free_text ?? ''}`),
      '',
      'CANCELLATION REASONS:',
      ...(cancellations ?? []).map((c, i) => `${i + 1}. ${c.reason} | ${c.reason_details ?? ''} | competitor=${c.competitor_name ?? '-'} | requested_feature=${c.feature_requested ?? '-'}`),
    ].join('\n');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a SaaS retention analyst. Read exit surveys + cancellation reasons. Return concise JSON.' },
          { role: 'user', content: text },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'summarize_churn',
            description: 'Summarize why users leave',
            parameters: {
              type: 'object',
              properties: {
                summary: { type: 'string', description: '2-3 sentence summary of top churn drivers' },
                top_reasons: { type: 'array', items: { type: 'string' } },
                product_recommendations: { type: 'array', items: { type: 'string' }, description: '3-5 product changes to reduce churn' },
                sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative', 'mixed'] },
              },
              required: ['summary', 'top_reasons', 'product_recommendations', 'sentiment'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'summarize_churn' } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway: ${aiResp.status} ${t}`);
    }
    const aiData = await aiResp.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { summary: 'No data', top_reasons: [], product_recommendations: [], sentiment: 'neutral' };

    return new Response(JSON.stringify(parsed), { headers: corsHeaders });
  } catch (e) {
    console.error('exit-survey-summary error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});