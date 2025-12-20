/**
 * @fileoverview API route handlers.
 * Exports: POST
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = await createClient();
    const stripe = getStripe();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile to find their Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found' },
        { status: 400 }
      );
    }

    // Verify the customer exists in Stripe, create if not
    let customerId = profile.stripe_customer_id;
    try {
      await stripe.customers.retrieve(customerId);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'resource_missing') {
        console.log(`Customer ${customerId} not found in Stripe, creating new customer for user ${user.id}`);
        
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        
        customerId = customer.id;
        
        // Update the user's profile with the new customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
          
        console.log(`Created new Stripe customer ${customerId} for user ${user.id}`);
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    // Create a portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // Handle specific Stripe portal configuration error
    if (error instanceof Error && 'type' in error && error.type === 'StripeInvalidRequestError' && 
        error.message?.includes('No configuration provided')) {
      return NextResponse.json(
        { 
          error: 'Billing portal is not configured yet. Please contact support or configure your billing portal in Stripe Dashboard.',
          errorType: 'portal_not_configured'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error creating portal session' },
      { status: 500 }
    );
  }
} 
