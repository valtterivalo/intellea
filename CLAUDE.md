# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**IMPORTANT: This project uses pnpm exclusively.** Do not use npm or yarn commands.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint to check code quality
- `pnpm test` - Run Vitest test suite
- `pnpm test:watch` - Run Vitest in watch mode
- `pnpm e2e` - Run Cypress end-to-end tests
- `pnpm type-check` - Run TypeScript type checking without emitting files
- `pnpm dev:setup` - Run development setup script
- `pnpm dev:reset` - Clear Next.js cache and restart dev server
- `pnpm dev:logs` - Start dev server with filtered logging
- `pnpm debug:subscription` - Debug subscription status (utility script)

## Architecture Overview

Intellea is an interactive LLM-based learning interface built with Next.js 15, featuring knowledge graph visualization and AI-powered concept expansion.

### Core Architecture

**Frontend Stack:**
- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS + Radix UI + shadcn components with custom Matsu theme. shadcn-ui is deprecated, shadcn is correct
- Zustand for state management with persistence
- Force-directed graph visualization using react-force-graph-2d/3d

**Backend Integration:**
- Supabase for authentication and session persistence
- OpenAI Agents framework (v0.0.9) for AI functionality with agent routing
- Upstash Redis for session/state caching
- Stripe for subscription billing with webhooks
- UMAP.js for graph node positioning and embeddings

### Key Components Structure

**State Management (`/src/store/`):**
- `useAppStore.ts` - Main Zustand store combining all slices
- Individual slices: `graphSlice`, `sessionSlice`, `billingSlice`, `conceptSlice`, `chatSlice`, `voiceSlice`
- Persistent storage with localStorage fallback to memory store

**AI Agents (`/src/lib/agents/`):**
- `router.ts` - Main routing agent that delegates to specialized agents
- `graphInit.ts` - Creates initial knowledge graphs from topics
- `graphExpansion.ts` - Expands existing graphs with new nodes
- `conceptExpand.ts` - Provides detailed concept explanations
- `tools.ts` - Agent tools for graph manipulation and user interaction

**Core Data Flow:**
1. User input → Router Agent → Specialized Agent
2. Agent generates graph data → Store updates → Component re-renders
3. Session state persisted to Supabase for cross-device continuity

### Key Features Implementation

**Knowledge Graph Visualization:**
- 2D/3D force-directed graphs with community clustering
- Node focusing with path highlighting
- Pinnable nodes and dynamic expansion/collapse
- Color coding by depth or community clusters

**Voice Assistant Integration:**
- Push-to-talk functionality (Space key when enabled)
- Voice commands for graph navigation and concept reading
- Keyboard shortcut: Ctrl+Shift+V to toggle connection

**Expandable Knowledge Cards:**
- Full-screen concept explanations with markdown rendering
- Related concept navigation
- User notes and learning progress tracking
- Premium feature requiring active subscription

### Authentication & Billing

- Supabase Auth with email/password and social logins
- Stripe integration for subscription management
- Server-side session validation and user permission checks
- Environment variables for API keys and configuration

### Testing Strategy

- Vitest for unit tests with React Testing Library
- Cypress for E2E testing
- Test coverage for stores, components, and agent tools
- Mock implementations for external services (Redis, Supabase)

### Environment Variables

Required for development:
- `OPENAI_API_KEY` - OpenAI API access for agents and embeddings
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis connection
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase project config
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin operations (webhooks, user management)
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe integration
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- `NEXT_PUBLIC_DEBUG` - Enable client-side debug logging
- `APP_DEBUG` - Enable server-side debug logging

### Development Notes

**Graph State Management:**
- Focus paths calculated dynamically based on node relationships
- Cluster colors computed using Louvain community detection
- Node positions persisted across sessions for consistent layout

**Agent Tools System:**
- Tools defined in `/src/lib/agents/tools.ts` provide graph manipulation capabilities
- Voice assistant can execute tools via natural language commands
- Tools include: focus node, search nodes, pin/unpin, add notes, zoom controls

**Session Management:**
- Sessions auto-save to Supabase with graph state and user progress
- Session summaries generated for easy navigation
- Cross-device session continuity via authenticated state sync

**UI Styling & Theme:**
- Uses custom Matsu theme with warm beige color palette
- Custom scrollbar styling integrated with theme colors using CSS custom properties
- shadcn ScrollArea components used for consistent scroll behavior throughout app
- CSS variables defined in globals.css for theme consistency
- Fixed layout expansion issues when focusing graph nodes (ScrollArea viewport overflow)

**Known Issues & Debugging Notes:**
- ScrollArea viewport can be sensitive to child element width calculations
- Use `w-fit` instead of `w-max` for horizontal scroll containers to prevent expansion
- ResizeObserver and getBoundingClientRect() calls can trigger layout recalculations
- Sticky knowledge card scroll detection requires targeting the actual ScrollArea viewport element (`[data-radix-scroll-area-viewport]`) rather than the wrapper

### API Routes Structure

**Main Generation APIs (`/src/app/api/`):**
- `generate/route.ts` - Main graph generation and expansion endpoint
- `chat/route.ts` - Chat interface for conversational interactions
- `expand-concept/route.ts` - Detailed concept expansion with streaming support
- `sessions/` - Session management (CRUD, streaming updates)
- `realtime/token/` - Real-time connection tokens for voice features

**Authentication & Billing APIs:**
- `auth/callback/route.ts` - Supabase auth callback handling
- `stripe/` - Stripe checkout, portal sessions, and webhook processing
- `admin/user/route.ts` - Admin user management operations

### Configuration Files

**Build & Development:**
- `next.config.ts` - Next.js configuration (minimal, using defaults)
- `tailwind.config.ts` - Tailwind CSS with `tailwindcss-animate` plugin
- `components.json` - `shadcn` component configuration with "New York" style
- `vitest.config.ts` - Test configuration with `jsdom` environment
- `cypress.config.ts` - E2E testing configuration
- `tsconfig.json` - TypeScript configuration

**Type Definitions:**
- `src/types/intellea.ts` - Core data structures (NodeObject, GraphData, etc.)
- `src/lib/database.types.ts` - Supabase database type definitions

### Key Libraries & Dependencies

**Graph Visualization:**
- `react-force-graph-2d/3d` - Interactive force-directed graphs
- `three` & `three-spritetext` - 3D rendering and text labels
- `graphology` & `graphology-communities-louvain` - Graph algorithms and clustering

**AI & Data Processing:**
- `@openai/agents` & `@openai/agents-core` - OpenAI Agents framework
- `umap-js` - Dimensionality reduction for node positioning
- `openai` - Direct OpenAI API client for embeddings

**State & Storage:**
- `zustand` - State management with persistence middleware
- `@upstash/redis` - Redis client for caching
- `ioredis` & `ioredis-mock` - Redis client and testing mock