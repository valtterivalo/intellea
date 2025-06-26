# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production  
- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run Vitest test suite
- `npm run e2e` - Run Cypress end-to-end tests
- `npm run knip` - Check for unused dependencies and dead code

## Architecture Overview

Intellea is an interactive LLM-based learning interface built with Next.js 15, featuring knowledge graph visualization and AI-powered concept expansion.

### Core Architecture

**Frontend Stack:**
- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS + Radix UI + shadcn components. shadcn-ui is deprecated, shadcn is correct
- Zustand for state management with persistence
- Force-directed graph visualization using react-force-graph-2d/3d

**Backend Integration:**
- Supabase for authentication and session persistence
- OpenAI Agents framework for AI functionality
- Redis for session/state caching
- Stripe for subscription billing

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
- `REDIS_URL` - Redis connection for session caching
- `OPENAI_API_KEY` - OpenAI API access for agents
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase project config
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe integration
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