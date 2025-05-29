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

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer) {
            console.error(`Webhook Error: Customer ${customerId} not found.`);
            break;
        }
        if (customer.deleted) {
            console.error(`Webhook Error: Customer ${customerId} was deleted.`);
            break; 
        }
        const supabaseUserId = customer.metadata.supabaseUserId;

        if (!supabaseUserId) {
          console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId}`);
          break; 
        }

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
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer) {
            console.error(`Webhook Error: Customer ${customerId} not found during update/delete.`);
            break;
        }
        if (customer.deleted) {
            console.error(`Webhook Error: Customer ${customerId} was deleted during update/delete.`);
            break; 
        }
        const supabaseUserId = customer.metadata.supabaseUserId;

        if (!supabaseUserId) {
          console.error(`Webhook Error: supabaseUserId missing from metadata for customer ${customerId} during subscription update/delete`);
          break; 
        }

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
        break;
      }
      default: 
        console.log(`Webhook received unhandled event type: ${event.type}`);
    }

    // Return 200 OK to Stripe to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Handle signature verification errors or other issues
    console.error('Stripe Webhook Error:', error.message);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 400 } // Use 400 for signature/request errors
    );
  }
} 