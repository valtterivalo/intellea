import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil' as const,
});

export const getStripeCustomerId = async (userId: string, email: string) => {
  // First, check if we already have a Stripe customer ID in the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // If not, create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabaseUserId: userId,
    },
  });

  // Save the Stripe customer ID to the profiles table
  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      stripe_customer_id: customer.id,
    });

  return customer.id;
}; 