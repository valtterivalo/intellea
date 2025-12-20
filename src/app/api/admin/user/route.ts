/**
 * @fileoverview API route handlers.
 * Exports: GET, POST
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase admin environment variables');
}

if (!process.env.ADMIN_SECRET_KEY) {
  throw new Error('Missing ADMIN_SECRET_KEY environment variable');
}

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isAuthorized = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${process.env.ADMIN_SECRET_KEY}`;
};

const findUserByEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const perPage = 200;
  const maxPages = 20;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }
    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (user) {
      return user;
    }
    if (data.users.length < perPage) {
      break;
    }
  }

  return null;
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
      user = await findUserByEmail(email);
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
    const body = await req.json();
    const { action, userId, subscriptionStatus, customerId, subscriptionId, status } = body;

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

      case 'sync_stripe_subscription':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Get user profile to find Stripe customer ID
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('stripe_customer_id, stripe_subscription_id')
          .eq('id', userId)
          .single();

        if (!userProfile?.stripe_customer_id) {
          return NextResponse.json({ error: 'No Stripe customer ID found for this user' }, { status: 400 });
        }

        try {
          // Get latest subscription status from Stripe
          let latestStatus = 'inactive';
          
          if (userProfile.stripe_subscription_id) {
            const subscription = await stripe.subscriptions.retrieve(userProfile.stripe_subscription_id);
            
            // Map Stripe status to internal status
            switch (subscription.status) {
              case 'active':
              case 'trialing':
                latestStatus = subscription.status;
                break;
              default:
                latestStatus = 'inactive';
            }
          }

          // Update profile with latest status
          const { error: syncError } = await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: latestStatus })
            .eq('id', userId);

          if (syncError) {
            return NextResponse.json({ error: syncError.message }, { status: 500 });
          }

          return NextResponse.json({ 
            success: true, 
            message: `Synced subscription status to: ${latestStatus}`,
            newStatus: latestStatus
          });

        } catch (stripeError) {
          console.error('Error syncing with Stripe:', stripeError);
          return NextResponse.json({ error: 'Failed to sync with Stripe' }, { status: 500 });
        }

      case 'manual_subscription_update':
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        if (!customerId || !status) {
          return NextResponse.json({ error: 'customerId and status required' }, { status: 400 });
        }

        const { error: manualUpdateError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || null,
            subscription_status: status,
          });

        if (manualUpdateError) {
          return NextResponse.json({ error: manualUpdateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Manually updated subscription status to: ${status}` 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in admin action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
