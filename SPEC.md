# Worktree `feat/graph-ux‐upgrade`

## Objective
Upgrade the 3-D knowledge-graph viewer so users can **navigate, expand, and pin nodes** intuitively, without touching any backend code.

## Key Deliverables
1. **Interactive graph controls**  
   - Left-click = select & center  
   - Double-click = “Expand concept” (fires existing `onNodeExpand`)  
   - Right-click = context menu: *Pin/Unpin*, *Collapse*, *Expand again*  
   - Scroll / drag = zoom & pan (retain current behaviour)
2. **Visual affordances**  
   - Distinct colours per node depth (root = accent, depth 1 = primary, depth ≥2 = slate)  
   - Hover tooltip with `label`
3. **State management additions** (Zustand)  
   - `selectedNodeId: string | null`  
   - `pinnedNodes: Record<string, boolean>` – never re-layout these
4. **Unit tests** covering the new store selectors + the click/keyboard handlers with `@testing-library/react` + `vitest`.

## File-level To-Dos
| File | Action |
| --- | --- |
| `src/components/VisualizationComponent.tsx` | Replace current anonymous callbacks with `useCallback` handlers. Integrate `react-force-graph-3d` event hooks: `onNodeClick`, `onNodeRightClick`, `onNodeHover`. |
| `src/components/FullscreenGraphContainer.tsx` | Add a small floating toolbar (*Zoom ±*, *Fit*, *Reset*) using shadcn Button icons. |
| `src/components/VisualizationSection.tsx` | Pass new store props down; render a coloured legend bar under the canvas. |
| `src/store/useAppStore.ts` | Add `selectedNodeId`, `pinnedNodes`, and corresponding setter actions. |
| `src/lib/graphColors.ts` | **NEW** helper that maps depth → Tailwind colour class. |
| `tests/graph-ux/` | **NEW** vitest test suite. |

## Non-Goals
- No backend/API changes.  
- No design overhaul outside the graph canvas and toolbar.

## Acceptance Criteria
- Selecting, pinning, and expanding work exactly as described.  
- Vitest: ≥90 % coverage for the new store + handlers.  