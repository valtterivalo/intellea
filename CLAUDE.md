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
- `pnpm type-check`
- `pnpm benchmark:graph-response`
- `pnpm benchmark:graph-perf`
- `pnpm mcp:graph-response`

## repo overview

this repo is the public graph platform: schema + renderer + adapters + docs + iframe embed shell.

## key paths

- renderer: `packages/graph-renderer`
- schema: `packages/graph-schema`
- adapters: `packages/graph-adapters`
- docs app: `src/app/docs/*`
- embed shell: `src/app/embed/graph/page.tsx`
- docs markdown: `docs/*`
- examples: `examples/*`

## environment variables

- optional: `NEXT_PUBLIC_DEBUG=true` (shows perf overlay in the embed shell)
