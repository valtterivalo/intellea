# 🚀 Production Deployment Guide

## 1. Environment Variables Setup in Vercel

Add these additional environment variables in your Vercel dashboard:

```env
# Production URLs
NEXT_PUBLIC_SITE_URL=https://www.intellea.app

# Admin Access (generate a secure random string)
ADMIN_SECRET_KEY=your-super-secret-admin-key-here
```

## 2. Supabase Configuration

### Update Authentication Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update:
   - **Site URL**: `https://www.intellea.app`
   - **Redirect URLs**: Add `https://www.intellea.app/auth/callback`

### Create Database Policies (if needed)
Ensure your RLS policies allow service role access for admin functions.

## 3. Stripe Configuration

### Finding Webhook Settings in Stripe Dashboard

**Step-by-step with the current Stripe UI:**

1. **Log into Stripe Dashboard** (dashboard.stripe.com)
2. **Look for the "Developers" section**:
   - It might be in the left sidebar, or
   - In the top navigation, or
   - Click on your profile/account name → "Developers"
3. **Once in Developers section, look for "Webhooks"**:
   - Should be in the left sidebar under "Developers"
   - Might be called "Webhooks" or "Webhook endpoints"
4. **If you can't find it, try this direct URL**: `https://dashboard.stripe.com/webhooks`

### Create/Update Webhook Endpoint
1. Click "Add endpoint" or "Create endpoint"
2. Set **Endpoint URL**: `https://www.intellea.app/api/stripe/webhook`
   - ⚠️ **CRITICAL**: Must include the full path `/api/stripe/webhook`, not just the domain
3. **Select events to listen for** (click "Select events"):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Click "Add endpoint"
5. **Copy the webhook signing secret** (starts with `whsec_...`)
6. Add this to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### ✅ Test Webhook Delivery
After setup, you can test webhook delivery in the Stripe dashboard:
1. Go to your webhook endpoint
2. Click "Send test webhook"
3. Choose `checkout.session.completed` 
4. Check the "Recent deliveries" section for successful 200 responses

## 4. Subscription Management Tools

### Debug Script Usage
Use the included debug script to troubleshoot subscription issues:

```bash
# Check a user's subscription status
node debug-subscription.js user@example.com

# This will show:
# - User data from Supabase
# - Profile subscription status  
# - Stripe customer and subscription data
# - Option to sync or manually fix issues
```

### Admin API Endpoints
Available admin actions via `/api/admin/user`:

1. **Check user status**: `GET /api/admin/user?email=user@example.com`
2. **Sync from Stripe**: `POST /api/admin/user` with `action: 'sync_stripe_subscription'`
3. **Manual update**: `POST /api/admin/user` with `action: 'manual_subscription_update'`
4. **Grant free access**: `POST /api/admin/user` with `action: 'grant_free_subscription'`

### Quick Admin Commands
Save these as shell functions in your `.bashrc` or `.zshrc`:

```bash
# Grant free subscription
grant_free_sub() {
  local email=$1
  local user_id=$(curl -s -X GET "https://www.intellea.app/api/admin/user?email=$email" \
    -H "Authorization: Bearer $ADMIN_SECRET_KEY" | jq -r '.user.id')
  
  curl -X POST "https://www.intellea.app/api/admin/user" \
    -H "Authorization: Bearer $ADMIN_SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"action\": \"grant_free_subscription\", \"userId\": \"$user_id\"}"
}

# Check user status
check_user() {
  curl -X GET "https://www.intellea.app/api/admin/user?email=$1" \
    -H "Authorization: Bearer $ADMIN_SECRET_KEY" | jq .
}
```

Usage:
```bash
export ADMIN_SECRET_KEY="your-super-secret-admin-key-here"
grant_free_sub "friend@example.com"
check_user "friend@example.com"
```

## 5. Common Issues & Solutions

### Issue: User paid but no access
**Cause**: Webhook not delivering properly  
**Solution**: 
1. Check Stripe webhook "Recent deliveries" 
2. Ensure webhook URL includes `/api/stripe/webhook` path
3. Use debug script to manually sync: `node debug-subscription.js user@example.com`

### Issue: Magic Link Redirects to Localhost
**Cause**: Supabase Site URL not updated  
**Solution**: Update Site URL in Supabase Dashboard

### Issue: RLS policy violations  
**Cause**: Using regular Supabase client instead of service role  
**Solution**: The codebase now uses `supabaseAdmin` client for profile updates

### Issue: Subscription status not updating
**Cause**: Missing webhook events  
**Solution**: Ensure all required webhook events are configured (see list above)

### Issue: Users can access chat without subscription
**Cause**: Missing subscription check in chat API  
**Solution**: Already implemented in the updated chat route

## 6. Production Monitoring

### View Logs
```bash
# View function logs in real-time
vercel logs --follow

# View logs for specific function
vercel logs --follow --output json | grep "webhook"

# Check recent webhook events
vercel logs --follow | grep "Webhook"
```

### Check Webhook Status
Monitor webhook delivery in Stripe Dashboard → Developers → Webhooks → [Your Webhook] → Recent Events

### Test Webhook Manually
```bash
# Test webhook endpoint (should return "Missing stripe signature")
curl -X POST "https://www.intellea.app/api/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}' \
  -v
```

## 7. Security Notes

- Keep `ADMIN_SECRET_KEY` secure and don't share it
- Consider IP whitelisting for admin endpoints
- Monitor admin endpoint usage in logs
- Rotate admin keys regularly

## 8. Alternative: Search for Webhooks
If you still can't find webhooks in Stripe Dashboard, try:
- Use the search bar in Stripe Dashboard and type "webhooks"
- Look for a gear/settings icon and check if webhooks are there
- Ensure you're in the correct mode (Test vs Live) using the toggle in top left 