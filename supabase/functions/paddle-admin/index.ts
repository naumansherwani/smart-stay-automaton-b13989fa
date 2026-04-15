const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PADDLE_API_URL = 'https://api.paddle.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY')
  if (!PADDLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'PADDLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { action } = await req.json()

    if (action === 'debug_key') {
      const trimmed = PADDLE_API_KEY.trim()
      return new Response(JSON.stringify({
        length: trimmed.length,
        starts: trimmed.substring(0, 20),
        ends: trimmed.substring(trimmed.length - 5),
        has_newlines: PADDLE_API_KEY.includes('\n'),
        has_spaces: PADDLE_API_KEY !== trimmed,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'create_products') {
      const products = [
        {
          name: 'HostFlow AI Basic',
          description: '1 industry workspace, up to 100 CRM contacts, 50 bookings/month, limited AI features, basic analytics',
          tax_category: 'standard',
          plan: 'basic',
          price: 2500, // cents
        },
        {
          name: 'HostFlow AI Pro',
          description: '1 industry workspace, unlimited contacts and bookings, AI scheduling, AI follow-ups, advanced analytics, priority support',
          tax_category: 'standard',
          plan: 'standard',
          price: 5500,
        },
        {
          name: 'HostFlow AI Premium',
          description: '1 industry workspace, full AI CRM suite, AI Voice Assistant, deal pipeline, Google integration, dedicated account manager',
          tax_category: 'standard',
          plan: 'premium',
          price: 11000,
        },
      ]

      const results = []

      for (const p of products) {
        // Create product
        const prodRes = await fetch(`${PADDLE_API_URL}/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PADDLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: p.name,
            description: p.description,
            tax_category: p.tax_category,
          }),
        })
        const prodData = await prodRes.json()

        if (!prodRes.ok) {
          results.push({ plan: p.plan, error: prodData })
          continue
        }

        const productId = prodData.data.id

        // Create monthly price
        const priceRes = await fetch(`${PADDLE_API_URL}/prices`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PADDLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: productId,
            description: `${p.name} - Monthly`,
            unit_price: {
              amount: String(p.price),
              currency_code: 'USD',
            },
            billing_cycle: {
              interval: 'month',
              frequency: 1,
            },
            trial_period: {
              interval: 'day',
              frequency: 7,
            },
          }),
        })
        const priceData = await priceRes.json()

        results.push({
          plan: p.plan,
          product_id: productId,
          price_id: priceData.data?.id,
          price_amount: p.price,
        })
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'list_products') {
      const res = await fetch(`${PADDLE_API_URL}/products?include=prices`, {
        headers: { 'Authorization': `Bearer ${PADDLE_API_KEY}` },
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'list_prices') {
      const res = await fetch(`${PADDLE_API_URL}/prices`, {
        headers: { 'Authorization': `Bearer ${PADDLE_API_KEY}` },
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
