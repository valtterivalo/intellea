import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Validate environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

// Create a Supabase client configured to use the Service Role Key
// This client bypasses RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Webhook Event Handlers ---

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log(`Processing checkout completion for customer: ${customerId}, subscription: ${subscriptionId}`);

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) {
      console.error(`Webhook Error: Customer ${customerId} not found or deleted.`);
      return;
  }
  
  const supabaseUserId = (customer as Stripe.Customer).metadata.supabaseUserId;
  if (!supabaseUserId) {
    console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId}`);
    return; 
  }

  console.log(`Updating subscription for user: ${supabaseUserId} to active`);

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
    })
    .eq('id', supabaseUserId);

  if (updateError) {
    console.error(`Webhook DB Error (checkout.session.completed) for user ${supabaseUserId}:`, updateError);
  } else {
    console.log(`Webhook Success: Updated profile for user ${supabaseUserId} to active.`);
  }
}

async function handleSubscriptionChange(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  console.log(`Processing subscription ${event.type} for customer: ${customerId}, status: ${subscription.status}`);

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) {
      console.error(`Webhook Error: Customer ${customerId} not found or deleted during subscription change.`);
      return;
  }

  const supabaseUserId = (customer as Stripe.Customer).metadata.supabaseUserId;
  if (!supabaseUserId) {
    console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId} during subscription update/delete`);
    return;
  }

  console.log(`Updating subscription status for user: ${supabaseUserId} to ${subscription.status}`);

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status, 
      stripe_subscription_id: subscription.id, 
    })
    .eq('id', supabaseUserId);

  if (updateError) {
      console.error(`Webhook DB Error (${event.type}) for user ${supabaseUserId}:`, updateError);
  } else {
      console.log(`Webhook Success: Updated subscription status to '${subscription.status}' for user ${supabaseUserId}.`);
  }
}

const eventHandlers: Record<string, (event: Stripe.Event) => Promise<void>> = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.updated': handleSubscriptionChange,
  'customer.subscription.deleted': handleSubscriptionChange,
};

// --- Main Webhook Route ---

export async function POST(req: Request) {
  let body: string;
  let signature: string | null;

  try {
    // Get the raw body as buffer first, then convert to string
    const buffer = await req.arrayBuffer();
    body = Buffer.from(buffer).toString('utf8');
    signature = req.headers.get('stripe-signature');
  } catch (err) {
    console.error('Error reading request body:', err);
    return NextResponse.json({ error: 'Error reading request body' }, { status: 400 });
  }

  if (!signature) {
    console.error('Webhook Error: Missing stripe signature');
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook Error: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Webhook received: ${event.type}, event ID: ${event.id}`);

    const handler = eventHandlers[event.type];

    if (handler) {
      console.log(`Processing handler for: ${event.type}`);
      await handler(event);
      console.log(`Successfully processed webhook: ${event.type}`);
    } else {
      console.log(`Webhook received unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Stripe Webhook Error:', errorMessage);
    console.error('Request headers:', Object.fromEntries(req.headers.entries()));
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 400 }
    );
  }
} 