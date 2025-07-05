/**
 * @fileoverview Library utilities.
 * Exports: getStripeCustomerId, stripe
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

// Regular client for reading data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client for writing profile data (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const getStripeCustomerId = async (userId: string, email: string) => {
  try {
    // First, check if we already have a Stripe customer ID in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile for Stripe customer lookup:', profileError);
      throw new Error('Failed to check existing customer');
    }

    if (profile?.stripe_customer_id) {
      console.log(`Found existing Stripe customer ID: ${profile.stripe_customer_id} for user: ${userId}`);
      return profile.stripe_customer_id;
    }

    console.log(`Creating new Stripe customer for user: ${userId}, email: ${email}`);

    // If not, create a new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        supabaseUserId: userId,
      },
    });

    console.log(`Created Stripe customer: ${customer.id} with metadata:`, customer.metadata);

    // Save the Stripe customer ID to the profiles table
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        stripe_customer_id: customer.id,
      });

    if (upsertError) {
      console.error('Error saving Stripe customer ID to profile:', upsertError);
      // Don't throw here - the customer was created successfully
      // Just log the issue and return the customer ID
    } else {
      console.log(`Saved Stripe customer ID ${customer.id} to profile for user: ${userId}`);
    }

    return customer.id;
  } catch (error) {
    console.error('Error in getStripeCustomerId:', error);
    throw error;
  }
}; 