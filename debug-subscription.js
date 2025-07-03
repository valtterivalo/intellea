#!/usr/bin/env node

/**
 * Subscription Debug Script
 * 
 * Usage: node debug-subscription.js <user-email>
 * 
 * This script helps debug subscription issues by:
 * 1. Looking up user in Supabase
 * 2. Checking their Stripe customer data
 * 3. Checking their subscription status
 * 4. Offering to sync the data
 */

const readline = require('readline');

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!ADMIN_SECRET_KEY) {
  console.error('❌ ADMIN_SECRET_KEY environment variable is required');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: node debug-subscription.js <user-email>');
  process.exit(1);
}

async function debugSubscription(userEmail) {
  try {
    console.log(`🔍 Looking up user: ${userEmail}`);
    
    // Fetch user data from admin API
    const response = await fetch(`${SITE_URL}/api/admin/user?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const userData = await response.json();
    
    console.log('\n📊 USER DATA:');
    console.log(`User ID: ${userData.user.id}`);
    console.log(`Email: ${userData.user.email}`);
    console.log(`Created: ${userData.user.created_at}`);
    console.log(`Last sign in: ${userData.user.last_sign_in_at}`);
    
    console.log('\n📋 PROFILE DATA:');
    if (userData.profile) {
      console.log(`Subscription Status: ${userData.profile.subscription_status || 'null'}`);
      console.log(`Stripe Customer ID: ${userData.profile.stripe_customer_id || 'null'}`);
      console.log(`Stripe Subscription ID: ${userData.profile.stripe_subscription_id || 'null'}`);
    } else {
      console.log('❌ No profile found');
    }
    
    console.log('\n💳 STRIPE DATA:');
    if (userData.stripeCustomer) {
      console.log(`Customer ID: ${userData.stripeCustomer.id}`);
      console.log(`Customer Email: ${userData.stripeCustomer.email}`);
      console.log(`Customer Created: ${new Date(userData.stripeCustomer.created * 1000).toISOString()}`);
      console.log(`Metadata:`, userData.stripeCustomer.metadata);
    } else {
      console.log('❌ No Stripe customer found');
    }
    
    if (userData.stripeSubscription) {
      console.log(`Subscription ID: ${userData.stripeSubscription.id}`);
      console.log(`Subscription Status: ${userData.stripeSubscription.status}`);
    } else {
      console.log('❌ No Stripe subscription found');
    }

    // Check for mismatches
    console.log('\n🔎 ANALYSIS:');
    const issues = [];
    
    if (!userData.profile) {
      issues.push('User profile missing in database');
    }
    
    if (userData.profile && !userData.profile.stripe_customer_id && userData.stripeCustomer) {
      issues.push('Stripe customer exists but not linked to profile');
    }
    
    if (userData.profile && userData.profile.stripe_customer_id && !userData.stripeCustomer) {
      issues.push('Profile has Stripe customer ID but customer not found in Stripe');
    }
    
    if (userData.stripeSubscription && userData.profile) {
      const stripeStatus = userData.stripeSubscription.status;
      const profileStatus = userData.profile.subscription_status;
      
      // Map Stripe status to expected profile status
      let expectedStatus = 'inactive';
      if (stripeStatus === 'active' || stripeStatus === 'trialing') {
        expectedStatus = stripeStatus;
      }
      
      if (profileStatus !== expectedStatus) {
        issues.push(`Status mismatch: Stripe shows "${stripeStatus}" but profile shows "${profileStatus}"`);
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ No issues detected');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      
      // Offer to sync
      if (userData.user && userData.profile && (userData.stripeCustomer || userData.stripeSubscription)) {
                 console.log('\n🔧 Would you like to fix the subscription status?');
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
                 rl.question('Type "sync" to sync from Stripe, or "manual" to manually set active: ', async (answer) => {
           if (answer.toLowerCase() === 'sync') {
             try {
               const syncResponse = await fetch(`${SITE_URL}/api/admin/user`, {
                 method: 'POST',
                 headers: {
                   'Authorization': `Bearer ${ADMIN_SECRET_KEY}`,
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                   action: 'sync_stripe_subscription',
                   userId: userData.user.id
                 })
               });
               
               const syncResult = await syncResponse.json();
               
               if (syncResponse.ok) {
                 console.log(`✅ ${syncResult.message}`);
               } else {
                 console.log(`❌ Sync failed: ${syncResult.error}`);
               }
             } catch (error) {
               console.log(`❌ Sync error: ${error.message}`);
             }
           } else if (answer.toLowerCase() === 'manual') {
             try {
               const manualResponse = await fetch(`${SITE_URL}/api/admin/user`, {
                 method: 'POST',
                 headers: {
                   'Authorization': `Bearer ${ADMIN_SECRET_KEY}`,
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                   action: 'manual_subscription_update',
                   userId: userData.user.id,
                   customerId: userData.stripeCustomer?.id || 'manual',
                   subscriptionId: userData.stripeSubscription?.id || null,
                   status: 'active'
                 })
               });
               
               const manualResult = await manualResponse.json();
               
               if (manualResponse.ok) {
                 console.log(`✅ ${manualResult.message}`);
               } else {
                 console.log(`❌ Manual update failed: ${manualResult.error}`);
               }
             } catch (error) {
               console.log(`❌ Manual update error: ${error.message}`);
             }
           }
           rl.close();
         });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugSubscription(email); 