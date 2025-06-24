# Intellea - Interactive LLM-Based Learning Interface

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Running Tests

Run `npm test` to execute the Vitest suite.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Features

### Expandable Knowledge Cards

The knowledge cards in Intellea can now be expanded to show detailed information about each concept:

1. Each knowledge card has an "Expand" button alongside the "Focus" button
2. Clicking the "Expand" button opens a fullscreen modal with:
   - Comprehensive markdown-formatted explanation of the concept
   - List of related concepts with their relationships to the main concept
   - Ability to focus on related concepts directly from the expanded view
3. Content is generated dynamically using the LLM, taking into account the current state of the knowledge graph and other concepts
4. Requires an active subscription to use

### Voice Assistant

Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> to connect or disconnect the voice assistant.

When push-to-talk is enabled, hold <kbd>Space</kbd> to speak.

Use `search_and_select_node` to select a node by a partial label. Example:
`search_and_select_node{"labelStartsWith":"Gam"}` will focus the first matching node.

- Say **"read expanded concept"** to have the assistant read the currently expanded concept and any saved notes.

### Graph Visualization

Nodes are coloured by depth by default. Use the **Cluster Colors** toggle below the graph to switch to colouring nodes by their community clusters.

"# intellea"

## Environment Variables

| Variable                             | Description                                                | Example                         |
|--------------------------------------|------------------------------------------------------------|---------------------------------|
| REDIS_URL                            | Redis connection string.                                   | redis://localhost:6379          |
| OPENAI_API_KEY                       | API key for OpenAI.                                        | sk-test-123                     |
| NEXT_PUBLIC_SUPABASE_URL             | URL of your Supabase project.                              | https://xyz.supabase.co         |
| NEXT_PUBLIC_SUPABASE_ANON_KEY        | Supabase anonymous public key.                             | public-anon-key                 |
| STRIPE_SECRET_KEY                    | Stripe secret key for server-side API calls.               | sk_test_123                     |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   | Stripe publishable key for client-side operations.         | pk_test_123                     |
| STRIPE_PRICE_ID                      | Stripe price ID for your subscription product.             | price_123                       |
| NEXT_PUBLIC_SITE_URL                 | Base URL of the deployed site used for redirect callbacks. | http://localhost:3000           |
| STRIPE_WEBHOOK_SECRET                | Signing secret to verify Stripe webhooks.                  | whsec_test_123                  |
| SUPABASE_SERVICE_ROLE_KEY            | Supabase service role key used for secure server actions.  | service-role-key                |
| NEXT_PUBLIC_DEBUG                    | Enable client-side debug logging when set to "true".       | false                           |
| APP_DEBUG                            | Enable backend debug logging when set.                     | true                            |

## Dev Backend

Session state is persisted via Supabase.  Helper functions in
`backend/tools/supabase_io.py` expose CRUD utilities as agent tools:

- `get_session_data(ctx, session_id)` – fetch a single session row
- `save_session(ctx, session)` – insert a new session and return its ID
- `save_concept(ctx, concept)` – insert a concept record

These raise `SupabasePermissionError` when the service role credentials are
invalid or lack permissions.
