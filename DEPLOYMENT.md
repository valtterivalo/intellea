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
3. **Select events to listen for** (click "Select events"):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click "Add endpoint"
5. **Copy the webhook signing secret** (starts with `whsec_...`)
6. Add this to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Alternative: Search for Webhooks
If you still can't find it, try:
- Use the search bar in Stripe Dashboard and type "webhooks"
- Look for a gear/settings icon and check if webhooks are there
- Check if you're in "Test mode" vs "Live mode" (toggle in top left)

## 4. 🔍 Production Debugging

### View Logs
```bash
# View function logs in real-time
vercel logs --follow

# View logs for specific function
vercel logs --follow --output json | grep "webhook"
```

### Check Webhook Status
Monitor webhook delivery in Stripe Dashboard → Developers → Webhooks → [Your Webhook] → Recent Events

## 5. 👥 Admin Management

### Give Free Subscription to Friend

1. **Find User ID:**
```bash
curl -X GET "https://www.intellea.app/api/admin/user?email=friend@example.com" \
  -H "Authorization: Bearer your-super-secret-admin-key-here"
```

2. **Grant Free Subscription:**
```bash
curl -X POST "https://www.intellea.app/api/admin/user" \
  -H "Authorization: Bearer your-super-secret-admin-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grant_free_subscription",
    "userId": "user-id-from-step-1"
  }'
```

### Debug User Subscription Issues

**Check user's current status:**
```bash
curl -X GET "https://www.intellea.app/api/admin/user?email=user@example.com" \
  -H "Authorization: Bearer your-super-secret-admin-key-here"
```

**Manually update subscription status:**
```bash
curl -X POST "https://www.intellea.app/api/admin/user" \
  -H "Authorization: Bearer your-super-secret-admin-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_subscription",
    "userId": "user-id-here",
    "subscriptionStatus": "active"
  }'
```

## 6. 🐛 Common Issues & Solutions

### Magic Link Redirects to Localhost
- **Cause**: Supabase Site URL not updated
- **Fix**: Update Site URL in Supabase Dashboard

### Subscription Not Syncing After Payment
- **Cause**: Webhook not reaching your app
- **Fix**: 
  1. Check webhook URL in Stripe Dashboard
  2. Check webhook logs in Vercel
  3. Manually sync using admin API

### Users Can Access Chat Without Subscription
- **Cause**: Missing subscription check in chat API
- **Fix**: Already implemented in the updated chat route

## 7. 📊 Monitoring Commands

### Check Recent Webhook Events
```bash
# View recent webhook logs
vercel logs --follow | grep "Webhook"

# Check for specific user updates
vercel logs --follow | grep "user-id-here"
```

### Test Webhook Manually
```bash
# Test webhook endpoint
curl -X POST "https://www.intellea.app/api/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}' \
  -v
```

## 8. 🔒 Security Notes

- Keep `ADMIN_SECRET_KEY` secure and don't share it
- Consider IP whitelisting for admin endpoints
- Monitor admin endpoint usage in logs
- Rotate admin keys regularly

## 9. 📱 Quick Admin Commands

Save these as shell functions in your `.bashrc` or `.zshrc`:

```bash
# Grant free subscription
grant_free_sub() {
  curl -X GET "https://www.intellea.app/api/admin/user?email=$1" \
    -H "Authorization: Bearer $ADMIN_SECRET_KEY" | jq '.user.id' | xargs -I {} \
  curl -X POST "https://www.intellea.app/api/admin/user" \
    -H "Authorization: Bearer $ADMIN_SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"action\": \"grant_free_subscription\", \"userId\": \"{}\"}"
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