# claude.md

this file is for coding assistants working in this repo.

## package manager

use pnpm only.

## commands

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm test`
- `pnpm test:watch`
- `pnpm e2e`
- `pnpm type-check`
- `pnpm dev:reset`
- `pnpm dev:logs`
- `pnpm debug:subscription`

## app overview

intellea is a next.js 15 app with a knowledge graph UI. users create sessions, explore nodes, and expand concepts. landing page supports a text-only demo.

## key paths

- pages: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/auth/page.tsx`
- main client flow: `src/components/MainAppClient.tsx`, `src/components/GraphView.tsx`, `src/components/NewSessionPrompt.tsx`
- state: `src/store/*`
- ai agents: `src/lib/agents/graphInitV5.ts`, `src/lib/agents/graphExpansionV5.ts`, `src/lib/agents/conceptExpandV6.ts`, `src/lib/agents/graphInitRawOpenAI.ts`
- docs/files: `src/lib/services/*`
- voice: `src/components/VoiceAgentWidget.tsx`, `src/lib/agents/tools/*`, `src/app/api/realtime/token/route.ts`

## api routes

- generation: `/api/generate` and `/api/generate/stream`
- concept expansion: `/api/expand-concept` and `/api/expand-concept/stream`
- sessions: `/api/sessions`, `/api/sessions/[sessionId]`, `/api/sessions/[sessionId]/expanded-concepts`
- stripe: `/api/stripe/create-checkout`, `/api/stripe/create-portal-session`, `/api/stripe/webhook`
- admin: `/api/admin/user`
- auth: `/auth/callback`

## environment variables

see `README.md`.
