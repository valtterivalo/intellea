import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple auth check - you might want to make this more secure
const isAuthorized = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${process.env.ADMIN_SECRET_KEY}`;
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  if (!email && !userId) {
    return NextResponse.json({ error: 'Email or userId required' }, { status: 400 });
  }

  try {
    // Find user by email or ID
    let user;
    if (email) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      user = users.users.find(u => u.email === email);
    } else if (userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      user = userData.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get Stripe customer info if exists
    let stripeCustomer = null;
    let stripeSubscription = null;
    
    if (profile?.stripe_customer_id) {
      try {
        stripeCustomer = await stripe.customers.retrieve(profile.stripe_customer_id);
        
        if (profile.stripe_subscription_id) {
          stripeSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe data:', stripeError);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile,
      stripeCustomer: stripeCustomer && !stripeCustomer.deleted ? {
        id: stripeCustomer.id,
        email: (stripeCustomer as Stripe.Customer).email,
        created: (stripeCustomer as Stripe.Customer).created,
        metadata: (stripeCustomer as Stripe.Customer).metadata,
      } : null,
      stripeSubscription: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
      } : null,
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, userId, subscriptionStatus } = await req.json();

    switch (action) {
      case 'update_subscription':
        if (!userId || !subscriptionStatus) {
          return NextResponse.json({ error: 'userId and subscriptionStatus required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            subscription_status: subscriptionStatus,
          });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Updated subscription status to ${subscriptionStatus}` });

      case 'grant_free_subscription':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { error: grantError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            subscription_status: 'active',
            stripe_customer_id: null, // Free subscription, no Stripe customer
            stripe_subscription_id: null,
          });

        if (grantError) {
          return NextResponse.json({ error: grantError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Granted free subscription' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in admin action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 