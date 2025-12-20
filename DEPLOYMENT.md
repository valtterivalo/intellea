# deployment

## 1) env vars

set all variables from `README.md`, plus production values for:
- NEXT_PUBLIC_SITE_URL
- STRIPE_* price ids and webhook secret
- ADMIN_SECRET_KEY

## 2) supabase auth

- site url: `https://www.intellea.app`
- redirect url: `https://www.intellea.app/auth/callback`

## 3) stripe webhooks

endpoint: `https://www.intellea.app/api/stripe/webhook`

events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

## 4) admin tools

- admin api: `/api/admin/user` (bearer `ADMIN_SECRET_KEY`)
- debug script: `node debug-subscription.js user@example.com`
