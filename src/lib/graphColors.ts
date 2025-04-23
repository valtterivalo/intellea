/**
 * Maps a node's depth in the graph to a Tailwind color class.
 * - Root: accent
 * - Depth 1: primary
 * - Depth >=2: slate
 */

export function getNodeColor(depth: number): string {
  if (depth === 0) return 'text-accent-500 fill-accent-500 stroke-accent-600';
  if (depth === 1) return 'text-primary-500 fill-primary-500 stroke-primary-600';
  return 'text-slate-500 fill-slate-500 stroke-slate-600';
}
