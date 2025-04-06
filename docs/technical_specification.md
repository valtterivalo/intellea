**Technical Specification: Cognition - Interactive LLM-Based Learning Interface**

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

---

### **7. Development Plan (MVP-Ready for Monetization)**

The MVP must deliver **real user value**, especially for learners with short attention spans or visual-first cognition styles. Our monetizable MVP will include:

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
    *   Created Next.js 15 project (`cognition`) using `create-next-app`.
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
    *   Defined `CognitionResponse` interface for the target structured JSON output.
    *   Implemented a new unified `SYSTEM_PROMPT` instructing the LLM to always return JSON matching `CognitionResponse`.
    *   Enforced `response_format: { type: "json_object" }` for all requests.
    *   Added server-side parsing of the LLM's JSON response string with error handling for parse failures.
    *   Returns the *parsed* `CognitionResponse` object or an error object (`{ error: ... }`).
*   **State Management Refactor (`useAppStore.ts`):**
    *   Removed `mode` and `setMode` from the state.
    *   Updated `output` type definition to `CognitionResponse | null | string`.
    *   Exported `CognitionResponse` interface for use in frontend components.
*   **UI Refactor (`page.tsx`):**
    *   Removed mode selector buttons and associated logic (`handleModeChange`, `getButtonClass`).
    *   Updated `handleSubmit` to only send `prompt` to the API.
    *   Updated textarea placeholder text.
*   **Output Renderer Refactor (`OutputRenderer.tsx`):**
    *   Updated expected `output` prop type.
    *   Added `isCognitionResponse` type guard.
    *   Renders different sections (`Explanation`, `Key Terms`, `Visualization Data`, `Check Understanding`) based on the presence of data in the `CognitionResponse` object.
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
*   **State & API:** Updated `CognitionResponse` interface and Zustand store (`useAppStore`) to use `knowledgeCards` structure, linking cards to nodes via IDs. Updated API prompt (`INITIAL_SYSTEM_PROMPT`) accordingly.
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

---

### **8. Future Phases & Known Issues**

#### **8.1 Immediate Next Steps / Enhancements**

*   **Troubleshoot Graph Resizing on Narrowing:**
    *   **Issue:** The `VisualizationComponent` (3D graph) resizes correctly when the window widens but fails to shrink when the window narrows after being widened. This prevents the overall layout from shrinking correctly and introduces horizontal scrollbars below the graph's expanded width (e.g., < 1040px).
    *   **Debugging Done:**
        *   Initial responsiveness fixed by removing `max-w-4xl` and using an inner `max-w-5xl` container. Scrolling restored.
        *   `ResizeObserver` confirmed implemented and fires correctly when widening.
        *   Logging shows `ResizeObserver` stops firing when narrowing, indicating the graph's container `div` is not shrinking.
        *   Attempts to fix with `min-h-0` on the container and its parent section were unsuccessful.
    *   **Hypothesis:** Complex interaction between `aspect-video` on the graph container and the parent flexbox layout (`CardContent` in `MainAppClient.tsx`). Other flex items might prevent vertical shrinking, which `aspect-video` translates into preventing horizontal shrinking.
    *   **Next Step:** Further investigate flex properties (`flex-shrink`, `flex-basis`, `min-height`) of elements within `CardContent`, especially the `VisualizationSection` and its siblings, to allow the graph container to shrink correctly.
*   **User Dashboard / Project Management:** Design and implement a dedicated view (separate page or modal) accessible before loading a specific session where users can:
    *   See a richer list/grid of their saved sessions (perhaps with previews or more metadata).
    *   Explicitly create new sessions/projects.
    *   Rename/delete sessions from this view.
    *   *(This replaces the simple sidebar as the primary entry point)*
*   **Integrate Knowledge Cards into Expansion:** Modify the expansion API prompt, response, and frontend logic (`addGraphExpansion` action) to generate and merge corresponding concise `knowledgeCards` alongside the new graph nodes/links. Ensure prompt requests brief summaries suitable for card display.
*   **Knowledge Card Detail Expansion (Lazy Loading):** Implement functionality to fetch a more detailed explanation for a Knowledge Card on user demand (e.g., via an 'Expand' button). This will trigger a separate API call for the specific topic, fetching richer content only when needed to optimize token usage. The expanded content will be stored temporarily in the frontend state.
*   **Refine Auto-Saving:** Consider more robust auto-saving triggers (e.g., debounced saving on changes to `output` state) or clearer visual indicators of save status.
*   **Latency Optimization:** Address API response latency (~10s for initial generation, ensure expansion calls are faster). Explore streaming for `explanationMarkdown`.
*   **LLM Output Consistency:** Continue monitoring and improving the reliability of the LLM returning the graph structure and other fields correctly.
*   **UI/UX:**
    *   Improve session sidebar (if kept) or dashboard view styling and usability.
    *   Consider adding more visual cues during expansion (e.g., brief node pulse).
    *   Improve label overlap handling in 3D graph if needed.
    *   Style AuthComponent further if desired.
*   **Cookie Warning:** Monitor persistent `cookies()` warnings in development console, revisit if runtime issues appear.

#### **8.2 MVP Features Remaining**

*   ~~User-facing dashboard with new session creation & loading~~ (**Completed via Sidebar**)
*   ~~Session memory view / Backend Persistence~~ (**Completed**)
*   **Basic Stripe integration** (**Next Focus**)

#### **8.3 Post-MVP**

*   **Deeper Personalization:** Backend session history, SR quizzes, visual bookmarks.
*   **Collaboration & Network Effects:** Shared boards, embeds, learning paths.
*   **Pro Mode:** Advanced topics, RAG, multimodal.

---

### **Conclusion**
This spec now reflects a development plan focused on producing **real value and revenue** from the first public release. The MVP delivers a differentiated experience tailored to learners frustrated by chat-based AI tools. It's scoped to ship fast, with a premium feel, and designed to grow into a serious platform.