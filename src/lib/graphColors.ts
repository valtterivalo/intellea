/**
 * Maps a node's depth in the graph to a stable hex color.
 * The palette mirrors the visual legend used in the UI.
 */
export function getNodeColor(depth: number): string {
  if (depth === 0) return '#ef4444';
  if (depth === 1) return '#3b82f6';
  if (depth === 2) return '#10b981';
  if (depth === 3) return '#f59e0b';
  return '#8b5cf6';
}
