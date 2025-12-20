# intellea

intellea is a graph-first interface that turns prompts and documents into interactive concept maps, helping users navigate large-model output without walls of text.

## app flow

- unauthenticated users see the landing page and can run a text-only demo
- authenticated users create sessions, explore graphs, and expand concepts
- subscriptions are required for full access

## features

- graph exploration with expand, pin, collapse, and focus
- completion tracking, notes, and session export
- graph controls for fit-to-view, smart labels, auto-rotate, and cluster coloring

## stack

- next.js 16 (app router), react 19, typescript, tailwind css v4
- supabase auth + postgres
- openai responses api, files api, and vector stores
- groq (kimi k2) for fast text-only generation
- redis (local or upstash) for caching and demo rate limiting
- stripe subscriptions
- openai realtime agents for voice navigation

## development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## environment variables

```env
# core ai
OPENAI_API_KEY=
GROQ_API_KEY=

# supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# redis (pick one)
REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_YEARLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=

# app
NEXT_PUBLIC_SITE_URL=
ADMIN_SECRET_KEY=
NEXT_PUBLIC_DEBUG=
APP_DEBUG=
```

notes:
- OPENAI_API_KEY is required. groq is used for faster text-only generation.
- demo mode is text-only.

## commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check
pnpm test
pnpm e2e
pnpm debug:subscription user@example.com
```

## graph controls

- click to focus a node
- shift+click to expand a node
- right click for pin/collapse/expand
- use the overlay controls to fit the graph, toggle labels, auto-rotate, or switch to cluster colors

## admin and debugging

- admin api: `/api/admin/user` (bearer `ADMIN_SECRET_KEY`)
- subscription debug script: `node debug-subscription.js user@example.com`
