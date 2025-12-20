# local development

## 1) env

create `.env.local` and set the variables listed in `README.md`.

notes:
- OPENAI_API_KEY is required for generation and voice.
- GROQ_API_KEY is used for fast text-only generation.
- set either REDIS_URL or UPSTASH_REDIS_REST_*.

## 2) supabase

- create a supabase project (or run supabase locally)
- configure auth redirect url: `http://localhost:3000/auth/callback`
- required tables in public schema:
  - `profiles`
  - `sessions`
  - `expanded_concepts`
  - `session_files`

## 3) stripe (test mode)

- create monthly and yearly prices
- set webhook endpoint: `http://localhost:3000/api/stripe/webhook`
- listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

## 4) run

```bash
pnpm install
pnpm dev
```
