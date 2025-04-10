**Technical Specification: Intellea - Interactive LLM-Based Learning Interface**

---

### **1. System Architecture Overview**
A modern web-based application that interfaces with multiple LLM APIs to generate dynamic, interactive learning content.

**Frontend:**
- Built with **React** + **TailwindCSS**
- Uses **Next.js** for SSR and routing
- Interactive animations via **Framer Motion** and **React Spring**
- Visual elements rendered using **SVG**, **Canvas API**, or lightweight libraries like **Recharts**, **VisX**, or **Konva**
- Quizzes and flashcards managed via local React state and contextual stores (e.g., Zustand)

**Backend:**
- **Node.js** service layer for request handling and orchestration (Next.js API Routes)
- **Node.js** adapter for LLM API handling
- Optional **Redis** cache layer for rate-limited API responses
- Vector store integration for local retrieval-based memory (e.g., **Weaviate**, **Qdrant**, or **Chroma**)

**APIs Supported:**
- OpenAI (gpt-4, gpt-4-turbo)
- Anthropic (Claude)
- Mistral (via third-party endpoints)
- DeepSeek
- xAI (via future plugin architecture)

**Deployment:**
- Initially deployed on **Vercel** or **Render**
- Plan for self-hostable version with Docker support

---

### **2. Core Components**

#### **Prompt Engine**
- Central module for converting user goals/questions into structured sub-requests
- Uses prompt templates for visual outputs, summaries, quiz generation, etc.
- Handles system prompt injection based on the type of content requested (diagram, animation description, etc.)

#### **UI Renderer Modules**
- **Visualizer:** Accepts structured data (e.g., graph or tree JSON) and renders it as a live SVG or Canvas visualization
- **KnowledgeCards:** Generates detailed cards corresponding to graph nodes from LLM output, supports focusing the graph view on the corresponding node.
- **AnimationPlayer:** Translates descriptive animation steps into JS-controlled transitions (e.g., Framer-based visual explainers)
- **Quiz Engine:** Converts concepts into MCQs or flashcard Q&A using predefined formats, handles correctness logic locally

#### **Memory & Session State**
- Local context retained in browser (sessionStorage or IndexedDB)
- Project sessions optionally persist to backend DB (e.g., SQLite, Postgres)
- Contextual memory cards rendered via dynamic panels with AI-summarized state

---

### **3. Prompt-Oriented Interactivity**
Every UI component (term, diagram node, quiz question) is tied to a lightweight prompt action.

Example:
- Clicking a term like "entropy" sends `"Explain entropy in simpler terms with a 2-step animation"`
- Selecting a node in a decision tree allows user to ask `"What happens if this node is removed?"`
- Finishing a quiz shows follow-up prompt: `"Give a challenge question based on what I got wrong"`

---

### **4. Tooling and Developer Experience**
- Dev server with **hot reload via Vite**
- Unified LLM request SDK with support for provider switching (OpenAI, Claude, etc.)
- Strict TypeScript support for all frontend and backend code
- Integrated prompt-testing utility (text-based preview before binding to UI)
- Markdown-based content mocking for rapid prototyping without live API usage

---

### **5. Future-Proofing and Extensibility**
- Plugin-style architecture to add new LLM providers
- Renderer system modularized for plugging in custom UI components (e.g., 3D visualizations)
- Scoped user auth and saved session sync (optional, but designed in)
- Analytics hooks to track how users engage with each type of learning output (for later personalization)

---

### **6. Tech Stack Summary**
| Area | Tech |
|------|------|
| Frontend Framework | React + TailwindCSS |
| Backend Runtime | Node.js (via Next.js) |
| Hosting | Vercel (frontend), optional Docker |
| LLM APIs | OpenAI, Anthropic, Mistral, DeepSeek, xAI |
| Visualizations | SVG, Canvas, Framer Motion |
| State Mgmt | Zustand + localStorage / DB fallback |
| DB (optional) | SQLite or Postgres |
| Vector Store (optional) | Chroma / Qdrant / Weaviate |
| **3D Visualization** | **react-force-graph / Three.js** |
| **Text Embeddings** | **OpenAI's text-embedding-3-small** |
| **Dimensionality Reduction** | **UMAP.js** |

---

### **7. Development Plan (MVP-Ready for Monetization)**

The MVP must deliver **real user value**, especially for learners with short attention spans or visual-first intellea styles. Our monetizable MVP will include:

1. **User-facing dashboard with new session creation**
2. **Prompt input + mode selector (visualize, quiz, explain)**
3. **Dynamic visual output: diagrams, trees, process maps**
4. **Interactive Knowledge Cards linked to graph nodes, with graph focusing.**
5. **Basic animation support (2-5 step visual explainers)**
6. **Lightweight quizzes (auto-generated from topic)**
7. **Session memory view with pinned cards and visual state**
8. **Frontend-only user login (email or magic link)**
9. **Basic Stripe integration: monthly subscription paywall for unlimited usage**
10. **Shareable public sessions (read-only)**

✅ This MVP can **launch and generate revenue.** It solves pain points, is sticky, and delivers a premium experience from day one.

---

### **7.1 Development Progress Log**

**Phase 1: Foundation Setup (Completed)**

*   **Project Initialization:**
    *   Created Next.js 15 project (`intellea`) using `create-next-app`.
    *   Configured with TypeScript, Tailwind CSS, ESLint, App Router (`/src`), and `@/*` alias.
*   **Core Dependencies:**
    *   Installed `zustand` for state management.
    *   Installed `framer-motion` for animations.
*   **Basic UI Layout:**
    *   Modified `layout.tsx` with project title, description, and basic dark theme.
    *   Created initial `page.tsx` structure with header, output area, mode selectors, prompt input, and send button.
*   **State Management Integration:**
    *   Created `src/store/useAppStore.ts` (Zustand store) to manage `prompt`, `mode`, `output`, and `isLoading` states.
    *   Integrated the store into `page.tsx`, connecting UI elements and implementing loading state indication.

**Phase 2: Core LLM Integration (Completed)**

*   **OpenAI SDK:**
    *   Installed the `openai` npm package.
*   **API Key Management:**
    *   Instructed user to create `.env.local` and store `OPENAI_API_KEY` securely.
*   **Backend API Route:**
    *   Created Next.js API route handler at `src/app/api/generate/route.ts`.
    *   Implemented logic to read API key from environment variables.
    *   Instantiated OpenAI client.
    *   Handles POST requests, parsing `prompt` and `mode`.
    *   Includes basic mode-based prompt engineering (using `gpt-4-turbo-preview`).
    *   Calls OpenAI Chat Completions API.
    *   Returns AI response (or error) as JSON `{ "output": "..." }`.
*   **Frontend API Call:**
    *   Modified `handleSubmit` in `page.tsx` to be `async`.
    *   Replaced placeholder logic with `fetch` call to `/api/generate` endpoint.
    *   Sends `prompt` and `mode` in the request body.
    *   Updates Zustand store (`output`, `isLoading`) based on API response or errors.
    *   Displays raw text output or error message in the main content area.
    *   Disables input elements during loading state.

**Phase 3: Output Rendering & JSON Mode (Superseded by Phase 4)**

*   ~~API Route Enhancement (JSON Mode)~~ 
*   ~~Output Renderer Component~~ 
*   ~~Frontend Integration~~ 

**Phase 4: Unified Response Refactor (Completed)**

*   **Conceptual Shift:**
    *   Removed distinct 'Visualize', 'Quiz', 'Explain' modes based on user feedback.
    *   Adopted a unified approach: AI attempts to provide multiple facets (explanation, terms, viz, quiz) for every prompt.
*   **API Route Refactor (`/api/generate/route.ts`):**
    *   Removed all mode-specific logic.
    *   Defined `IntelleaResponse` interface for the target structured JSON output.
    *   Implemented a new unified `SYSTEM_PROMPT` instructing the LLM to always return JSON matching `IntelleaResponse`.
    *   Enforced `response_format: { type: "json_object" }` for all requests.
    *   Added server-side parsing of the LLM's JSON response string with error handling for parse failures.
    *   Returns the *parsed* `IntelleaResponse` object or an error object (`{ error: ... }`).
*   **State Management Refactor (`useAppStore.ts`):**
    *   Removed `mode` and `setMode` from the state.
    *   Updated `output` type definition to `IntelleaResponse | null | string`.
    *   Exported `IntelleaResponse` interface for use in frontend components.
*   **UI Refactor (`page.tsx`):**
    *   Removed mode selector buttons and associated logic (`handleModeChange`, `getButtonClass`).
    *   Updated `handleSubmit` to only send `prompt` to the API.
    *   Updated textarea placeholder text.
*   **Output Renderer Refactor (`OutputRenderer.tsx`):**
    *   Updated expected `output` prop type.
    *   Added `isIntelleaResponse` type guard.
    *   Renders different sections (`Explanation`, `Key Terms`, `Visualization Data`, `Check Understanding`) based on the presence of data in the `IntelleaResponse` object.
    *   Uses `ReactMarkdown` with custom components (`h1`, `h2`, `h3`, `p`) and improved `prose` styling for `explanationMarkdown`.
    *   Renders `keyTerms` as styled cards.
    *   Uses existing `JsonRenderer` helper for `visualizationData`.
    *   Includes a basic, non-interactive placeholder for `quiz` data.
    *   Handles error string display and a final fallback for unexpected output format.

**Phase 5: Interactive Quiz & Prompt/Rendering Refinements (Completed)**

*   **Markdown Rendering:** Further improved markdown rendering in `OutputRenderer.tsx` by providing custom components for headings (`h1`-`h3`) and paragraphs (`p`) to `ReactMarkdown` for better styling control (whitespace, emphasis).
*   **System Prompt Refinement:** Updated `SYSTEM_PROMPT` in API route (`route.ts`) with stronger constraints to reduce redundancy between `explanationMarkdown` and `keyTerms`, and lowered temperature slightly (`0.5`).
*   **Interactive Quiz Component:**
    *   Created `src/components/QuizComponent.tsx`.
    *   Component accepts `quizData` prop.
    *   Manages state for selected answer and answered status.
    *   Renders question and options as interactive buttons.
    *   Provides visual feedback on selection and correctness after checking.
*   **Integration:** Integrated `QuizComponent` into `OutputRenderer.tsx`, replacing the static quiz placeholder.
*   **Dependency:** ~~Installed `reactflow` library for future visualization work.~~ (Dependency removed as we pivot to 3D graphs).

**Phase 6: Initial 3D Graph Visualization (Completed)**

*   **Conceptual Pivot:** Shifted from 2D React Flow visualization to a dynamic 3D knowledge graph as the primary interaction model.
*   **Dependencies:** Installed `react-force-graph`, `react-force-graph-3d`, `three`, `three-spritetext`.
*   **System Prompt:** Refined `SYSTEM_PROMPT` in API route (`route.ts`) to explicitly request `visualizationData` as a structured JSON object containing `nodes` (e.g., `{ id: '...', label: '...', ... }`) and `links` (e.g., `{ source: 'id1', target: 'id2', ... }`). Emphasized generating a *small*, core graph initially.
*   **Visualization Component (`VisualizationComponent.tsx`):**
    *   Refactored to use `react-force-graph-3d` via dynamic import (`next/dynamic`).
    *   Handles `{ nodes, links }` data structure.
    *   Includes basic node styling using `SpriteText` for labels and camera controls.
*   **Debugging Rendering Issues:**
    *   Identified that the graph component was not rendering initially.
    *   Troubleshooting steps included:
        *   Adding console logs to verify data flow (data was correct).
        *   Temporarily disabling `SpriteText` rendering (not the root cause).
        *   Temporarily setting fixed pixel `width` and `height` on the graph component, which resolved the issue, indicating a problem with dynamic sizing.
        *   Implementing a `ResizeObserver` with `setTimeout` to reliably measure the container `div`'s dimensions *after* browser layout calculation, ensuring the graph component receives correct `width` and `height` props.
        *   Restored dynamic container classes (`aspect-video w-full`).
*   **Current Status:** Component now renders the 3D graph correctly, sized to its container, with labels displayed using `SpriteText`.
*   **Integration:** Integrated the `VisualizationComponent` into `OutputRenderer.tsx`.

**Phase 7: UI Theme Integration & Styling (Completed - Minor Adjustments May Be Needed)**

*   **Theme Setup:**
    *   Initialized `shadcn/ui` using `npx shadcn@latest init`.
    *   Added Matsu theme via `npx shadcn@canary add https://matsu-theme.vercel.app/r/matsu-theme.json`.
    *   Added core components (`button`, `textarea`, `card`, `separator`) using `npx shadcn@latest add ...`.
*   **Global Styling (`layout.tsx`):**
    *   Replaced default fonts with Matsu theme fonts (`Nunito`, `PT_Sans`).
    *   Applied theme font variables and `.texture` class to `<body>`.
*   **Page Styling (`page.tsx`):**
    *   Replaced `<textarea>` and `<button>` with `shadcn/ui` `Textarea` and `Button`.
    *   Added `Loader2` icon to submit button for loading state.
    *   Wrapped main content area in a `Card` component.
    *   Simplified main `<h1>` header styling.
*   **Output Styling (`OutputRenderer.tsx`):**
    *   Applied `prose dark:prose-invert` for base Markdown styling.
    *   Added `Separator` components between sections.
    *   Styled Key Terms using `Card`, `CardHeader`, `CardTitle`, `CardContent` with refined padding (`py-1`, `p-1`).
    *   Applied consistent `h2` styling for section headers.
*   **Quiz Styling (`QuizComponent.tsx`):**
    *   Wrapped component in a `Card`.
    *   Replaced option buttons and check button with `shadcn/ui` `Button`.
    *   Used button variants (`default`, `destructive`, `secondary`, `outline`) and icons (`Check`, `X`) for selection/feedback states.
*   **Visualization Styling (`VisualizationComponent.tsx`):**
    *   Applied theme background (`bg-card`) to container (replaced with hex `#1F2937` temporarily due to parsing issues).
    *   Styled 3D graph elements (node colors/sizes, link styles, `SpriteText` label color) for visual clarity.
    *   Ensured controls are accessible and fit the theme.
*   **Linter Fixes:** Resolved import path errors after adding components and implicit `any` type errors on event handlers.

**Phase 8: Functional Refinements (Completed)**

*   **Dynamic Header (`page.tsx` & `useAppStore.ts`):**
    *   Added `activePrompt` state to Zustand store.
    *   Set `activePrompt` in `handleSubmit`.
    *   Displayed formatted `activePrompt` in main response `CardTitle`.
*   **Visualization Robustness (`route.ts`):**
    *   Updated `SYSTEM_PROMPT` to strongly require the `{ nodes: [...], links: [...] }` structure for `visualizationData`, specifying node properties like `id` and `label`, and link properties `source` and `target`.
*   **API Expansion Endpoint Logic (`route.ts`):**
    *   Added logic to the `/api/generate` route to detect expansion requests (based on `nodeId`, `nodeLabel`, `currentGraph` in the body).
    *   Implemented `EXPANSION_SYSTEM_PROMPT` to instruct the LLM to generate *only* new nodes and links relevant to the clicked node.
    *   Ensured the API returns only `{ expansionData: { nodes, links } }` for expansion requests.
*   **Store Expansion Logic (`useAppStore.ts`):**
    *   Implemented the `addGraphExpansion` action to merge new nodes and links (received from the API) into the existing `visualizationData` in the store, handling basic deduplication.
*   **Quiz Robustness (`QuizComponent.tsx` & `route.ts`):**
    *   Updated `SYSTEM_PROMPT` to require `A) ...` format for quiz options.
    *   Updated `getOptionLetter`/`getOptionText` regex to accept `A)` or `A.`.
    *   Added textual feedback message (`feedback` state) after answer submission.

**Phase 9: 3D Graph Interaction & Theming Refinements (Completed)**

*   **Theming (Warm Beige Theme):**
    *   Updated graph background color (`backgroundColor`) to match the warm beige page theme (`#FDF5E6`).
    *   Updated base node color (`nodeColor`) to use a muted dark khaki/brown (`#8B7D6B`).
    *   Updated link color (`linkColor`) to use a faint dark khaki/brown (`rgba(139, 125, 107, 0.3)`).
    *   Updated `SpriteText` label color to use a dark brown text color (`#5D4037`) for readability.
*   **Interaction:**
    *   Implemented node hover highlighting using `onNodeHover` and a lighter beige/tan color (`#D8C0A3`).
    *   Ensured node expansion highlighting (using `expandingNodeId` and color `#FBBF24`) takes precedence over hover.
    *   Changed camera navigation controls to `orbit` (`controlType="orbit"`) for potentially smoother exploration.
    *   Adjusted `SpriteText` `textHeight` for label clarity.

**Phase 10: Knowledge Cards & Graph Focusing (Completed)**

*   **Conceptual Refinement:** Replaced "Key Terms" with "Knowledge Cards" as the primary textual learning component, tightly coupled with the 3D graph nodes.
*   **State & API:** Updated `IntelleaResponse` interface and Zustand store (`useAppStore`) to use `knowledgeCards` structure, linking cards to nodes via IDs. Updated API prompt (`INITIAL_SYSTEM_PROMPT`) accordingly.
*   **Component Implementation:**
    *   Refactored `OutputRenderer` to use `KnowledgeCardsSection`.
    *   Created `KnowledgeCardsSection` to fetch and display cards.
    *   Created `KnowledgeCard` component to render individual card details (`title`, `description`) using `shadcn/ui`.
*   **Graph Focusing Interaction:**
    *   Added `focusedNodeId` state to Zustand store.
    *   Implemented "Focus on Graph" button in `KnowledgeCard` that updates `focusedNodeId`.
    *   Added `useEffect` in `VisualizationComponent` to observe `focusedNodeId` and use `cameraPosition` to smoothly animate the camera focus onto the corresponding node (using its stored fixed coordinates `fx`, `fy`, `fz`).
    *   Ensured focus is a one-time action per click, not sticky.
*   **Node Dragging Disabled:** Permanently disabled node dragging (`enableNodeDrag={false}`) in `VisualizationComponent` as it doesn't fit the interaction model and caused errors.

**Phase 11: Frontend User Authentication (Supabase - Completed)**

*   **Dependency Installation:** Added `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `@supabase/auth-ui-react`, `@supabase/auth-ui-shared` using npm.
*   **Environment Setup:** Configured `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
*   **Supabase Client:** Created utility (`src/lib/supabase/client.ts`) using `createClientComponentClient`.
*   **Auth UI Component:** Created `AuthComponent.tsx` using `Auth` from `@supabase/auth-ui-react`, configured for magic link, Google, and GitHub providers.
*   **Callback Route:** Implemented `/auth/callback/route.ts` using `createRouteHandlerClient` to handle session exchange.
*   **Layout Integration:** Modified root `layout.tsx` to be `async`, fetch initial server session using `createServerComponentClient`, and include `SupabaseListener` component.
*   **Session Listener:** Created `SupabaseListener.tsx` client component to synchronize client/server session state using `onAuthStateChange` and trigger `router.refresh()`.
*   **Conditional Rendering:** Modified `page.tsx` to be `async`, check server session, and render either `AuthComponent` (no session) or `MainAppClient` (session exists).
*   **Main App Client Component:** Created `MainAppClient.tsx` containing the primary application UI/logic (previously in `page.tsx`), marked as `'use client'`, and added a `handleLogout` function using `supabase.auth.signOut()`.
*   **Documentation:** Updated spec to reflect use of Node.js instead of Bun.

**Phase 12: Backend Session Persistence & UI Integration (Completed)**

*   **Database Schema:**
    *   Created `sessions` table in Supabase with columns: `id`, `user_id` (FK to `auth.users`), `title`, `session_data` (JSONB), `last_prompt`, `created_at`, `last_updated_at`.
    *   Implemented strict Row Level Security (RLS) policies allowing users CRUD access only to their own sessions (`auth.uid() = user_id`).
    *   Added DB index on `user_id` and trigger for auto-updating `last_updated_at`.
*   **Backend API Routes:**
    *   Created `/api/sessions/route.ts` with:
        *   `GET`: Lists sessions (`id`, `title`, `last_updated_at`, `last_prompt`) for the logged-in user.
        *   `POST`: Creates a new session record for the logged-in user.
    *   Created `/api/sessions/[sessionId]/route.ts` with:
        *   `GET`: Fetches full session data (`id`, `title`, `session_data`, `last_prompt`) for a specific session ID owned by the user.
        *   `PUT`: Updates `title`, `session_data`, `last_prompt` for a specific session ID owned by the user.
        *   `DELETE`: Deletes a specific session ID owned by the user.
    *   Ensured all handlers use `createRouteHandlerClient` and include `user_id` checks alongside RLS for defense-in-depth.
*   **State Management (Zustand - `useAppStore.ts`):**
    *   Added state for `sessionsList`, `currentSessionId`, `currentSessionTitle`, loading states (`isSessionListLoading`, `isSessionLoading`, `isSavingSession`), and `error`.
    *   Implemented actions (`fetchSessions`, `loadSession`, `createSession`, `saveSession`, `deleteSession`) to call the backend API routes.
    *   Refactored `persist` middleware to only store `currentSessionId` in `localStorage`, making the database the source of truth for session data.
    *   Added `resetActiveSessionState` action to clear working state.
*   **Frontend Integration (`MainAppClient.tsx`):**
    *   Added `useEffect` hooks to fetch session list on mount and attempt loading persisted `currentSessionId`.
    *   Implemented a collapsible sidebar using `shadcn/ui` `Sheet` component:
        *   Displays `sessionsList` with loading/error states.
        *   Allows creating new sessions (`handleCreateSession`).
        *   Allows loading sessions by clicking (`handleLoadSession`).
        *   Allows deleting sessions with confirmation (`handleDeleteSession`).
        *   Highlights the `currentSessionId`.
    *   Modified header:
        *   Added `SheetTrigger` button.
        *   Made session title editable via `Input` bound to `currentSessionTitle`, saving on blur.
        *   Removed manual save button.
    *   Implemented auto-saving by calling `saveSession` after successful AI generation and graph expansion.
    *   Added global error display using `Alert`.
    *   Disabled prompt input if no session is active.
    *   Handled session reset on logout.
*   **Dependency Installation:** Added `date-fns` and `shadcn/ui` components (`sheet`, `scroll-area`, `alert`, `input`).
*   **Bug Fixes:**
    *   Resolved `DialogTrigger must be used within Dialog` error by restructuring `Sheet` component layout.
    *   Investigated and monitored (currently ignoring) `cookies()` warnings in development console.
    *   Confirmed OAuth linking behavior (same email across providers maps to same user/sessions) is intended.
    *   Fixed session not loading on refresh by adding `useEffect` hook.

**Phase 13: Graph Readability & Single-Node Focus Scoping (Completed)**

*   **Graph Layout & Readability:**
    *   Accessed graph instance (`graphRef`) in `VisualizationComponent.tsx`.
    *   Used `d3Force` method in `useEffect` to modify simulation forces:
        *   Increased node repulsion (negative `'charge'` strength to -120).
        *   Increased default link distance (`'link'` distance to 60).
    *   Adjusted default node size (`nodeVal`) slightly smaller.
    *   Modified `getNodeThreeObject` to calculate label Y-offset dynamically based on `nodeVal`, ensuring labels appear consistently above nodes of varying sizes.
*   **Information Scoping (Single Node):**
    *   Added `activeFocusNodeId` state and `setActiveFocusNodeId` setter to Zustand store (`useAppStore.ts`).
    *   Modified `KnowledgeCard.tsx` button (`handleFocusClick`) to set both transient camera focus (`focusedNodeId`) and persistent active focus (`activeFocusNodeId`).
    *   Updated `VisualizationComponent.tsx`:
        *   Read `activeFocusNodeId` from store.
        *   Implemented `getNodeColor` and `getNodeVal` callbacks to use `activeFocusNodeId` to highlight/enlarge the focused node and dim/shrink others.
        *   Corrected type definitions to align with `react-force-graph-3d` accessors (`NodeObject`) and refactored helper/callbacks.
    *   Updated `KnowledgeCardsSection.tsx`:
        *   Read `activeFocusNodeId` from store using `useShallow` (to fix re-render loop).
        *   Applied conditional `opacity` and `scale` via `motion.div` based on whether a card matches `activeFocusNodeId`.
*   **Bug Fixes:**
    *   Resolved infinite re-render loop in `KnowledgeCardsSection` by adding `useShallow` to the state selector.
    *   Cleaned up `useAppStore` by removing redundant `visualizationData`/`knowledgeCards` state/setters and correcting `resetActiveSessionState`.
    *   Installed `@types/three`.
    *   Ignored persistent, potentially spurious linter error in `VisualizationComponent.tsx` after multiple fix attempts.

**Phase 14: Path-Based Focusing & Session Creation Refactor (Completed)**

*   **Path-Based Focusing Implementation:**
    *   **Store (`useAppStore.ts`):** Replaced `activeFocusNodeId: string | null` with `activeFocusPathIds: Set<string> | null`. Added `setActiveFocusPath` action to calculate the path (clicked node ID + direct neighbor IDs based on `visualizationData.links`) and update the state.
    *   **Knowledge Card Interaction (`KnowledgeCard.tsx`):** Modified 'Focus on Graph' button to call the new `setActiveFocusPath` action.
    *   **Graph Styling (`VisualizationComponent.tsx`):** Updated `getNodeColor` and `getNodeVal` callbacks to read `activeFocusPathIds` from the store. Nodes whose IDs are *in* the set are highlighted (using `themeColors.nodeExpanding`) and enlarged, while nodes *not* in the set are visually muted (`themeColors.nodeMuted`) and shrunk. Label height (`getNodeThreeObject`) also adjusts based on path inclusion.
    *   **Card Collapsing (`KnowledgeCardsSection.tsx`):** Updated component to read `activeFocusPathIds`. Uses `framer-motion` to animate `opacity` and `scale` of cards: cards whose `nodeId` is *not* in the `activeFocusPathIds` set are dimmed and slightly shrunk, addressing screen real estate usage when focus is active.
*   **Session Creation Refactor & Root Node:**
    *   **API Route (`/api/generate/route.ts`):** Updated `INITIAL_SYSTEM_PROMPT` to instruct the LLM to identify the core topic, create a central root node (marked with `isRoot: true`), and link all other initial nodes directly from this root. Added corresponding server-side validation to ensure exactly one root node exists and initial links originate correctly.
    *   **Store Action (`createSession`):** Refactored the action to take `initialPrompt` as input. It now orchestrates the process: calls `/api/generate` with the prompt, waits for the response, finds the root node (`isRoot: true`), extracts its `label` to use as the session `title`, inserts the new session into Supabase (saving the `title` and the complete initial API `output` object as `session_data`), and finally updates the Zustand state with the new session details.
    *   **Frontend Flow (`MainAppClient.tsx`):** 
        *   'New Session' button functionality changed to simply reset the active UI state (`resetActiveSessionState`, clear `currentSessionId`/`Title`, clear prompt input) without calling the store's `createSession` action.
        *   `handleSubmit` function modified: Now checks if `currentSessionId` is `null`. If it is (indicating the first prompt for a new session), it calls the `createSession` store action (passing `supabase`, `userId`, and the `prompt` text). If `currentSessionId` exists, it proceeds with the previous logic of fetching updates for the existing session.
*   **API/Data Robustness:**
    *   Further strengthened API prompts and added more server-side validation (`/api/generate/route.ts`) to enforce that `knowledgeCards` are generated with valid `nodeId`s matching `visualizationData.nodes` and that counts match.
    *   Added filtering in `KnowledgeCardsSection.tsx` to only render cards with a valid `nodeId`, preventing key warnings and errors.
*   **Bug Fixes:**
    *   Resolved runtime error from accessing `.length` on potentially null `sessionsList` in `MainAppClient.tsx`.
    *   Resolved runtime errors in `QuizComponent.tsx` by adding checks for potentially undefined `correctAnswerLetter` and `options` array.
    *   Corrected logic in `MainAppClient.tsx` to ensure the prompt input and send button are enabled when starting a new session (i.e., when `currentSessionId` is `null`).

**Phase 15: Hierarchical Knowledge Card Layout (Completed)**

*   **Goal:** Improve clarity and space usage in the Knowledge Cards section when focus is active.
*   **State Refinement (`useAppStore.ts`):** Added `activeClickedNodeId` state to differentiate the specifically clicked node from the broader highlighted path (`activeFocusPathIds`). Modified `setActiveFocusPath` action to set both states correctly, requiring `visualizationData` as input.
*   **Click Handler Update (`KnowledgeCard.tsx`):** Modified the 'Focus on Graph' button handler to fetch `visualizationData` from the store and pass it to the updated `setActiveFocusPath` action.
*   **Layout Calculation (`KnowledgeCardsSection.tsx`):** 
    *   Implemented `useMemo` hook to calculate card groups based on `activeClickedNodeId`.
    *   Uses BFS traversal upwards from the clicked node to find all ancestors.
    *   Identifies direct children.
    *   Groups cards into `ancestorLevels`, `focusedCard`, `childCards`, and `otherCards`.
*   **Rendering Logic (`KnowledgeCardsSection.tsx`):**
    *   **Focus Active:**
        *   Renders ancestor levels (root -> parents -> grandparents...) using CSS Grid (`grid-cols-*`) for horizontal layout, with narrower max-width (`max-w-xl`) and centered content (`place-content-center`).
        *   Renders the focused card centered with a wider max-width (`max-w-3xl`).
        *   Renders direct children using CSS Grid, similar to ancestors (narrower, centered).
        *   Renders `otherCards` (not in the focused path) as `CollapsedKnowledgeCard` components within a horizontal scrolling container (`overflow-x-auto`, `flex-nowrap`) below the main focus path.
        *   Removed `motion.div` wrapper from ancestor/child grid items to prevent layout interference.
    *   **Focus Inactive:** Retains the original layout (root card centered, other cards in a responsive grid).
*   **Component Creation (`CollapsedKnowledgeCard.tsx`):** Created a minimal card component showing only the title and a focus button for collapsed items.
*   **Bug Fixing:** Resolved various layout issues related to flexbox vs. grid interactions, CSS class specificity (`w-full` override), and ensured correct centering (`place-content-center`).

**Phase 16: Fullscreen Graph View (Completed)**

*   **Goal:** Allow users to view the 3D knowledge graph in a near-fullscreen overlay for better focus and exploration.
*   **State Management (`useAppStore.ts`):**
    *   Added `isGraphFullscreen: boolean` state to manage the view mode.
    *   Added `toggleGraphFullscreen()` action to switch between normal and fullscreen views.
    *   Ensured `isGraphFullscreen` is reset in `resetActiveSessionState`.
*   **Initial Implementation Approach (Issues Encountered):**
    *   Created `FullscreenGraphContainer.tsx` component.
    *   Initially used `AnimatePresence` and conditional rendering (`{isGraphFullscreen && <VisualizationComponent />}`) to mount/unmount the graph component within the fullscreen container.
    *   Added a button to `OutputRenderer.tsx` to trigger `toggleGraphFullscreen`.
    *   **Issue 1 (WebGL Context Leak):** Rapidly toggling fullscreen caused "Too many active WebGL contexts" errors and eventual graph render failure. This indicated the underlying `VisualizationComponent` or `react-force-graph-3d` wasn't cleaning up WebGL resources on unmount.
    *   **Attempted Fix 1 (Dispose Renderer):** Added cleanup logic in `VisualizationComponent`'s `useEffect` hook (within the `ResizeObserver` effect) to call `graphRef.current?.renderer().dispose()` on unmount. This resolved the WebGL context leak error.
    *   **Issue 2 (Node Drifting):** Nodes slightly repositioned (drifted) every time the fullscreen view was closed and the original view was re-rendered. This also occurred on initial page load.
*   **Refined Implementation Approach (Addressing Drift):**
    *   **Hypothesis:** Unmounting/remounting or resizing was causing the force simulation to reset or recalculate, leading to drift.
    *   **Change 1 (Persistent Rendering):** Modified `FullscreenGraphContainer` and `OutputRenderer` to *always* render their respective `VisualizationComponent` instances if `visualizationData` exists. Visibility is now controlled using CSS (`opacity`, `pointer-events`) via `motion.div` variants, rather than mounting/unmounting components.
    *   **Change 2 (Remove Dispose Logic):** Removed the `renderer.dispose()` call added in Attempted Fix 1, as the component is no longer unmounted during toggling.
    *   **Investigation (Cooldown & Resize Sensitivity):**
        *   Added `cooldownTime={1000}` prop to `ForceGraph3DComponent` to encourage faster simulation stabilization. This fixed the drift on initial page load but *not* when closing fullscreen.
        *   Refined `ResizeObserver` logic in `VisualizationComponent` to only call `setDimensions` if the width/height actually changed, reducing sensitivity to minor layout shifts. This also did not fully resolve the close-fullscreen drift.
    *   **Final Fix (Opacity Toggle for Non-Fullscreen View):** Changed the hiding mechanism for the non-fullscreen graph container in `OutputRenderer` from using `display: hidden/block` (via `cn`) to using `opacity` and `pointer-events` managed by `motion.div`, mirroring the fullscreen container's approach. This prevented the layout shift that was likely triggering the simulation adjustment on close.
*   **Current Status:** Fullscreen view toggles smoothly without WebGL leaks or node drifting. The graph state is preserved across view changes.

**Phase 17: Stripe Subscription Integration (Completed)**

*   **Goal:** Implement a basic monthly subscription paywall using Stripe to monetize the application.
*   **Dependencies:** Installed `stripe` (backend) and `@stripe/stripe-js` (frontend).
*   **Environment Setup:** Configured `.env.local` with Stripe test keys (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`), the Price ID for the subscription (`STRIPE_PRICE_ID`), the webhook signing secret (`STRIPE_WEBHOOK_SECRET`), and the base site URL (`NEXT_PUBLIC_SITE_URL`).
*   **Database Schema:**
    *   Created `profiles` table in Supabase with columns `id` (FK to `auth.users`), `stripe_customer_id` (unique), `subscription_status`, `stripe_subscription_id` (unique).
    *   Enabled RLS and added policies for users to select/update their own profiles.
    *   **Fix:** Manually inserted profile rows for existing users created before the table existed.
    *   **Fix:** Removed incorrect `handle_updated_at` trigger from `profiles` table to resolve DB update errors (function name mismatch with column `updated_at`).
*   **Backend API Routes:**
    *   Created `/api/stripe/create-checkout/route.ts`:
        *   Fetches/creates Stripe customer ID (storing `supabaseUserId` in metadata).
        *   Creates a Stripe Checkout Session for the defined `STRIPE_PRICE_ID`.
        *   Redirects user back to the root path (`/`) on success/cancel (corrected from `/dashboard`).
    *   Created `/api/stripe/create-portal-session/route.ts`:
        *   Fetches user's `stripe_customer_id` from `profiles` table.
        *   Creates a Stripe Billing Portal Session for subscription management.
    *   Created `/api/stripe/webhook/route.ts`:
        *   Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`.
        *   Uses Supabase Admin Client (with `SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS for database updates.
        *   Handles `checkout.session.completed` event: Updates `profiles` table with `stripe_customer_id`, `stripe_subscription_id`, and sets `subscription_status` to `active`.
        *   Handles `customer.subscription.updated`/`deleted` events: Updates `subscription_status` in `profiles` based on the event.
        *   Added robust error handling and logging.
*   **Stripe Utility (`src/lib/stripe.ts`):**
    *   Initialized Stripe Node client.
    *   Created `getStripeCustomerId` helper function (though its DB update part might have been initially blocked by RLS).
*   **State Management (`useAppStore.ts`):**
    *   Added `subscriptionStatus` ('active', 'inactive', etc.) and `isSubscriptionLoading` state.
    *   Implemented `fetchSubscriptionStatus` action to query the `profiles` table for the user's status.
    *   Modified `createSession` action to check for 'active' status before proceeding.
*   **Frontend Integration (`MainAppClient.tsx`):**
    *   Loads Stripe.js using `loadStripe`.
    *   Calls `fetchSubscriptionStatus` on mount.
    *   Conditionally renders "Subscribe Now" or "Manage Billing" buttons based on `subscriptionStatus`.
    *   Implements `handleSubscribe` (calls create-checkout API, redirects to Stripe) and `handleManageSubscription` (calls create-portal API, redirects to Stripe).
    *   Disables core features (prompt input, expand button, new session button) if `subscriptionStatus` is not 'active'.
    *   Added loading states for checkout/portal redirection.
*   **API Route Protection:** Added check in `/api/generate/route.ts` to verify `subscription_status` is 'active' before calling the LLM, returning a 402 error if inactive.
*   **Debugging:**
    *   Resolved 406 error by ensuring user profile row exists.
    *   Resolved webhook DB update failures by using Service Role Key and removing the incorrect DB trigger.
    *   Corrected Stripe redirect URLs.

**Phase 18: Project Renaming & Stripe Portal Fix (Completed)**

*   **Project Renaming:**
    *   Changed project name from "Intellea" to "Intellea".
    *   Updated documentation (`design_document.md`, `technical_specification.md`) to reflect the new name.
    *   Refactored codebase: Renamed `IntelleaResponse` type to `IntelleaResponse` and updated all references in state (`useAppStore.ts`), API routes (`/api/generate`, `/api/sessions/[sessionId]`), and components (`OutputRenderer.tsx`). Fixed resulting type errors.
*   **Stripe Portal Return URL:**
    *   Updated `/api/stripe/create-portal-session/route.ts` to set the `return_url` to the root path (`/`) instead of the non-existent `/dashboard`, resolving the redirect issue after managing billing.

**Phase 19: Graph Expansion & Knowledge Card Improvements (Completed)**

**Phase 20: Semantic Graph Layout Implementation (Completed)**

*   **Goal:** Implement a semantically meaningful 3D layout where related concepts appear close to each other in the graph visualization.
*   **Technical Approach:**
    *   **Embedding Generation:** Using OpenAI's `text-embedding-3-small` model to create vector representations for each node/concept description.
    *   **Dimensionality Reduction:** Applied UMAP.js to transform high-dimensional embeddings into 3D coordinates.
    *   **Root-Centered Layout:** Implemented a post-processing step to center the graph around the root node (0,0,0).
    *   **Fixed Node Positioning:** Applied the calculated 3D coordinates as fixed positions (`fx`,`fy`,`fz`) to the graph nodes.
*   **Parameter Tuning:**
    *   Optimized UMAP parameters (`nNeighbors: 20`, `minDist: 0.05`, `spread: 1.2`) for better clustering of related concepts.
*   **Data Sanitization:**
    *   Implemented cleaning of graph data before sending to the LLM to prevent context length errors and minimize token usage.
    *   Removed internal ThreeJS objects (`__threeObj`) and other rendering-specific properties from API requests.
*   **Knowledge Card Hierarchy Improvements:**
    *   Fixed the ancestor/descendant relationship calculation to correctly identify the true root node.
    *   Ensured root node is always included in focus paths.
    *   Fixed multi-root bug in knowledge card display.
*   **Debug Logging:**
    *   Added console logging to track relationship changes during graph expansion.

**Phase 21: Persistent Concept Caching Implementation (Completed)**

*   **Goal:** Implement persistent storage of expanded concept data to maintain it across sessions and devices.
*   **Database Schema:**
    *   Created `expanded_concepts` table in Supabase with columns:
        *   `id`: UUID (Primary Key)
        *   `session_id`: UUID (Foreign Key to sessions table, with cascade delete)
        *   `node_id`: TEXT (ID of the node/concept)
        *   `title`: TEXT (Title of the concept)
        *   `content`: TEXT (Markdown content of the expanded concept)
        *   `related_concepts`: JSONB (Array of related concepts with relationships)
        *   `graph_hash`: TEXT (SHA-256 hash signature of the graph structure for versioning)
        *   `created_at`: TIMESTAMPTZ
    *   Implemented SHA-256 cryptographic hashing of the graph structure to create compact, consistent identifiers for graph state, replacing the previous approach of using full node/link listings (which caused URL length issues)
    *   Added unique constraint on `(session_id, node_id, graph_hash)` to prevent duplicates
    *   Added indexes on `session_id`, `node_id`, and `graph_hash` for query performance
    *   Enabled Row Level Security with appropriate policies for data isolation
    *   Created SQL migration script (`docs/migrations/create_expanded_concepts_table.sql`) that can be run in the Supabase SQL Editor to set up the table, indexes, and security policies with proper error handling using IF NOT EXISTS clauses
*   **API Implementation:**
    *   Created `/api/sessions/[sessionId]/expanded-concepts` endpoints:
        *   `GET`: Fetches all expanded concepts for a session
        *   `POST`: Creates a new expanded concept or updates an existing one
        *   `DELETE`: Removes a specific expanded concept by nodeId
    *   Created specialized `/api/sessions/[sessionId]/expanded-concepts/lookup` endpoint using POST requests to avoid URL length limitations with SHA-256 hash parameters
    *   Added authentication, authorization, and input validation
    *   Implemented data transformation between database and application formats
*   **Store Enhancement:**
    *   Added new state: `expandedConceptCache: Map<string, {data: ExpandedConceptData, graphHash: string}>`
    *   Implemented multi-level caching strategy: memory → database → API
    *   Enhanced `expandConcept` to:
        *   Check memory cache first
        *   Query database if not in cache
        *   Call API only when necessary, then persist result to database
    *   Added `loadExpandedConcepts` function to load concepts from database when a session is loaded
    *   Updated `resetActiveSessionState` to clear concept cache on session switch
    *   Added type-safe interfaces and error handling
*   **Integration:**
    *   Modified `loadSession` to load expanded concepts after session data
    *   Ensured data consistency with graph versioning using hash-based validation
    *   Implemented clean error handling and fallback mechanisms
*   **Benefits:**
    *   Significantly improved performance by reducing redundant API calls
    *   Enhanced user experience with consistent concept explanations
    *   Added cross-device and cross-session availability of expanded content
    *   Reduced API costs by reusing previously generated content

---

### **8. Current Status & Future Development**

#### **8.1 Semantic Layout Characteristics**

*   **Data-Driven Positioning:** Node placement is calculated using UMAP based on text embeddings.
*   **Semantic Relationships:** Positions reflect conceptual proximity - similar concepts appear closer together.
*   **Root-Centered Design:** All graphs are centered around the root node at (0,0,0).
*   **Adaptive Layout:** When expanding the graph, all node positions are recalculated to maintain semantic relationships.

#### **8.2 LLM-Generated Relationships**

*   **Dynamic Edge Creation:** The LLM can create cross-connections between nodes based on its knowledge.
*   **Non-Deterministic:** These connections represent the model's understanding and may occasionally differ from strict hierarchical taxonomies.
*   **Discovery-Oriented:** Cross-connections can reveal unexpected relationships between concepts that might not be immediately obvious.

#### **8.3 Performance Considerations**

*   **Initial Generation:** ~15-20 seconds for the complete initial graph generation.
*   **Node Expansion:** ~10 seconds for typical node expansion.
*   **Embedding Generation:** Adds some latency but delivers significantly improved graph quality.
*   **UMAP Calculation:** Scales with the number of nodes; may need optimization for very large graphs.

#### **8.4 Expandable Knowledge Cards**

*   **Interactive Feature:** Provides detailed explanations of individual concepts in a full-screen modal view.
*   **Related Concepts:** Shows related concepts from the knowledge graph with context-aware relationships.
*   **Markdown Content:** Renders formatted markdown with proper heading hierarchies and spacing.
*   **Performance Optimizations:**
    * Content caching mechanism based on graph structure fingerprinting
    * Immediate loading indicator display before content is available
    * Properly styled loading states to improve user experience

#### **8.5 Known Issues & Future Improvements**

*   **Expandable Knowledge Cards (Completed):**
    * Implementation of fullscreen modal view for detailed concept explanations
    * Related concepts display with context-aware relationships
    * In-memory caching of expanded content based on graph structure
    * Improved markdown rendering with proper styling for headings, paragraphs, and lists
    * Automatic focusing on the expanded concept in the graph view

*   **Persistent Concept Caching (Completed):**
    * Implementation of database schema with `expanded_concepts` table to store expanded concept data
    * Multi-level caching strategy (memory + database) with graph hash validation to ensure freshness
    * New API endpoints for storing, retrieving, and deleting expanded concepts
    * Enhanced Zustand store with functions to load expanded concepts when sessions are loaded
    * Row Level Security (RLS) policies to ensure data isolation and security
    * Cross-device and cross-session availability of previously expanded concepts
    * Significantly improved performance by avoiding redundant API calls

*   **Performance Optimization (Planned):**
    * Current latency from clicking expand button to content display is substantial
    * Future work: Investigate bottlenecks in the expansion process (API, LLM, rendering)
    * Consider implementing streaming response for concept explanations to improve perceived performance
    * Explore pre-fetching of likely-to-be-expanded concepts based on user interaction patterns

*   **Node Interaction Improvements (Planned):**
    * Currently clicking on a node directly attempts to expand the graph
    * Future work: Implement a context menu when clicking on nodes with options:
        * "Expand Graph" - Current functionality, adds sub-concepts to the knowledge graph
        * "Expand Concept" - Opens the detailed explanation modal (same as knowledge card "Expand" button)
        * "Focus on Node" - Centers and highlights the node (same as knowledge card "Focus" button)
    * Consider terminology improvements to clearly differentiate between graph expansion and concept explanation

*   **UI Polish:**
    * Removed double borders and improved container styling
    * Future work: Further refine loading animations and transitions between states

*   **Future Considerations:**
    * Server-side caching for expanded concept data
    * Visual transitions between knowledge card and expanded view
    * Ability to save and bookmark specific expanded concepts

#### **8.6 Next Steps**

*   **Performance Optimization:** Investigate caching strategies for embeddings and optimizing UMAP parameter defaults.
*   **Relationship Validation:** Consider adding an optional user confirmation step for unexpected cross-links.
*   **Animation Refinement:** Add smoother transitions when nodes reposition after expansion.
*   **LLM Model Selection:** Consider more efficient models for specific sub-tasks (e.g., embedding generation).
*   **Improved Layout Algorithm:** Research alternative layout algorithms or hybrid approaches for better results.

---

### **9. Implementation Notes**

#### **9.1 Key Data Structures**

*   **Graph Nodes:** Include semantic coordinates (`fx`, `fy`, `fz`) and role identifiers (e.g., `isRoot`).
*   **Focus Path:** Set of node IDs in the current focus path, including the selected node, its neighbors, and the root.
*   **Knowledge Card Hierarchies:** Organized into ancestor levels, focused card, direct children, and other concepts.

#### **9.2 API Workflow**

*   **Initial Generation:**
    1. LLM generates initial graph structure
    2. Backend generates embeddings using `text-embedding-3-small`
    3. UMAP transforms embeddings to 3D coordinates
    4. Root node centered at origin, other nodes positioned relative to it
    5. Positions stored as fixed coordinates (`fx`,`fy`,`fz`)
    
*   **Node Expansion:**
    1. Frontend sends clean graph data (without rendering artifacts)
    2. LLM generates new nodes and potential cross-connections
    3. Backend regenerates embeddings for ALL nodes
    4. UMAP recalculates positions for the entire graph
    5. Root node recentered at origin
    6. Updated complete graph returned to frontend

---

### **Conclusion**
This spec reflects the current state of development, focusing on delivering a unique, visually interactive learning experience with semantically meaningful graph layouts. The system now produces high-quality 3D knowledge graphs where the positioning of nodes reflects their conceptual relationships, making exploration more intuitive and insightful for users. 