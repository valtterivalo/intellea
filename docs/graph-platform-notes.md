# graph platform notes (phase 0)

## current response flow
- user submits a prompt via `NewSessionPrompt`/`usePromptSubmit` or `createSession` in `sessionSlice`
- client sends `POST /api/generate` with `{ prompt }`
- server:
  - `src/app/api/generate/route.ts` → `handleInitialGeneration`
  - `generateInitialGraph` (ai sdk v5) returns `IntelleaResponse` (nodes, links, cards, markdown)
  - `getNodeEmbeddings` (openai embeddings) → `calculateNodePositions` (umap)
  - positions are added to nodes (`fx/fy/fz` and `x/y/z`)
- client:
  - `setOutput` writes `IntelleaResponse` to store
  - `intelleaToGraphResponse` adapts into `GraphResponseV0` for rendering
  - `computeClusters` builds cluster map (graphology louvain fallback)
  - `GraphResponseRenderer` resolves view hints + mode defaults → `VisualizationComponent` (renderer package)

### expansion flow
- user triggers expand from graph interaction
- client sends `POST /api/generate` with `{ nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards }`
- server:
  - `expandGraphFromNode` generates new nodes/links/cards
  - embeddings + umap recomputed for combined graph
  - response: `updatedVisualizationData` + `newKnowledgeCards`
- client:
  - `addGraphExpansion` merges into store

## current interaction contract
- click node: select + focus path + camera focus
- shift+click or double click: expand node
- right click: context menu (pin/unpin, collapse, expand)
- keyboard:
  - `p` pin/unpin selected node
  - `f` focus selected node
  - `e` expand selected node
- background click: clear selection + focus
- graph controls overlay:
  - fit to view
  - toggle labels
  - auto-rotate
  - toggle cluster colors
  - toggle cluster collapse
  - toggle perf mode
- mode controls:
  - mode switcher: auto / map / decision / plan / argument
  - mode gallery: same graph rendered across presets

## layout + rendering inventory
- layout seeds:
  - embeddings: `text-embedding-3-large` over card description or label
  - reducer: `umap-js` in 3d (`calculateNodePositions`)
  - root centering applied after umap
- expansion layout:
  - minor expansions keep existing positions
  - new nodes fan out around the expanded anchor for stability
- renderer:
  - custom three.js instanced renderer with `OrbitControls`
  - nodes are instanced meshes, links are line segments
  - labels use `SpriteText` with density throttling
  - positions use `fx/fy/fz` when present, fallback to `x/y/z`
- styling:
  - depth-based color by default, optional cluster coloring
  - focus/hover neighborhood highlighting
  - label visibility tied to focus/hover + toggle
  - perf profile scales labels, node resolution, and link weight by graph size
  - progressive render shows a core graph first, then promotes to full graph
  - debug perf overlay shows fps + counts when `NEXT_PUBLIC_DEBUG=true`
  - cluster collapse uses per-cluster representatives with expand/collapse in context menu
  - overlay toggle enables/disables cluster collapse globally

## scale targets (initial)
- baseline: 5k nodes with stable interaction and acceptable fps
- stretch: 10k nodes with lod + label culling
- below 1k nodes should feel fluid at all times
