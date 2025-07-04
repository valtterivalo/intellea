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
  
  console.log(`Customer metadata:`, (customer as Stripe.Customer).metadata);
  
  const supabaseUserId = (customer as Stripe.Customer).metadata.supabaseUserId;
  if (!supabaseUserId) {
    console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId}`);
    console.error(`Available metadata keys:`, Object.keys((customer as Stripe.Customer).metadata));
    return; 
  }

  console.log(`Updating subscription for user: ${supabaseUserId} to active`);

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: supabaseUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
    });

  if (updateError) {
    console.error(`Webhook DB Error (checkout.session.completed) for user ${supabaseUserId}:`, updateError);
  } else {
    console.log(`Webhook Success: Updated profile for user ${supabaseUserId} to active.`);
  }
}

async function handleSubscriptionChange(event: Stripe.Event) {
  let customerId: string;
  let subscriptionStatus: string;
  let subscriptionId: string;

  // Handle different event types
  if (event.type.startsWith('customer.subscription.')) {
    const subscription = event.data.object as Stripe.Subscription;
    customerId = subscription.customer as string;
    subscriptionStatus = subscription.status;
    subscriptionId = subscription.id;
  } else if (event.type.startsWith('invoice.')) {
    const invoice = event.data.object as Stripe.Invoice;
    customerId = invoice.customer as string;
    // Invoice subscription field can be a string ID or expanded subscription object
    const subscription = (invoice as { subscription?: string | { id: string } }).subscription;
    subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id || '';
    
    // For invoice events, get the actual subscription to check status
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        subscriptionStatus = subscription.status;
      } catch (error) {
        console.error(`Error retrieving subscription ${subscriptionId}:`, error);
        return;
      }
    } else {
      // If no subscription, this might be a one-time payment - skip
      return;
    }
  } else {
    console.error(`Unhandled event type in handleSubscriptionChange: ${event.type}`);
    return;
  }

  console.log(`Processing subscription ${event.type} for customer: ${customerId}, status: ${subscriptionStatus}`);

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

  console.log(`Updating subscription status for user: ${supabaseUserId} to ${subscriptionStatus}`);

  // Map Stripe statuses to our internal statuses
  let internalStatus: string;
  switch (subscriptionStatus) {
    case 'active':
    case 'trialing':
      internalStatus = subscriptionStatus;
      break;
    case 'past_due':
    case 'unpaid':
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      internalStatus = 'inactive';
      break;
    default:
      internalStatus = 'inactive';
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: supabaseUserId,
      subscription_status: internalStatus, 
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
    });

  if (updateError) {
      console.error(`Webhook DB Error (${event.type}) for user ${supabaseUserId}:`, updateError);
  } else {
      console.log(`Webhook Success: Updated subscription status to '${internalStatus}' for user ${supabaseUserId}.`);
  }
}

const eventHandlers: Record<string, (event: Stripe.Event) => Promise<void>> = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.updated': handleSubscriptionChange,
  'customer.subscription.deleted': handleSubscriptionChange,
  'invoice.payment_failed': handleSubscriptionChange,
  'invoice.payment_succeeded': handleSubscriptionChange,
  'customer.subscription.trial_will_end': handleSubscriptionChange,
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