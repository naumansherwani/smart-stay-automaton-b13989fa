import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.SubscriptionActivated:
        await handleSubscriptionActivated(event.data, env);
        break;
      case EventName.SubscriptionPaused:
        await handleSubscriptionPaused(event.data, env);
        break;
      case EventName.SubscriptionResumed:
        await handleSubscriptionResumed(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id, 'env:', env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

function mapProductToPlan(productId: string): string {
  const map: Record<string, string> = {
    basic_plan: 'basic',
    pro_plan: 'pro',
    premium_plan: 'premium',
  };
  return map[productId] || productId;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product.importMeta?.externalId || item.product.id;
  const plan = mapProductToPlan(productId);

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    plan: plan,
    status: status === 'trialing' ? 'trialing' : 'active',
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,environment',
  });
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, items, currentBillingPeriod, scheduledChange } = data;

  // Build update payload
  const updateData: Record<string, any> = {
    status: status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };

  // If items changed (upgrade/downgrade), update plan info
  if (items?.length) {
    const item = items[0];
    const productId = item.product?.importMeta?.externalId || item.product?.id;
    const priceId = item.price?.importMeta?.externalId || item.price?.id;
    if (productId) {
      updateData.product_id = productId;
      updateData.plan = mapProductToPlan(productId);
    }
    if (priceId) {
      updateData.price_id = priceId;
    }
  }

  await supabase.from('subscriptions')
    .update(updateData)
    .eq('paddle_subscription_id', id)
    .eq('environment', env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleSubscriptionActivated(data: any, env: PaddleEnv) {
  // Trial ended → now active
  await supabase.from('subscriptions')
    .update({
      status: 'active',
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleSubscriptionPaused(data: any, env: PaddleEnv) {
  await supabase.from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleSubscriptionResumed(data: any, env: PaddleEnv) {
  await supabase.from('subscriptions')
    .update({
      status: 'active',
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}
