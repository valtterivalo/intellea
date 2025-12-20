/**
 * @fileoverview Library utilities.
 * Exports: getStripeCustomerId, stripe
 */
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let stripeClient: Stripe | null = null;
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripeClient;
}

function getSupabaseClients(): { supabase: SupabaseClient; supabaseAdmin: SupabaseClient } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  return { supabase: supabaseClient, supabaseAdmin: supabaseAdminClient };
}
/**
 * @description Retrieve or create a Stripe customer for a user.
 * @param userId - Supabase user ID.
 * @param email - User email address.
 * @returns Stripe customer ID.
 */

export const getStripeCustomerId = async (userId: string, email: string) => {
  try {
    const stripe = getStripe();
    const { supabase, supabaseAdmin } = getSupabaseClients();

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
