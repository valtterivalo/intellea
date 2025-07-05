/**
 * @fileoverview Maps graph depth to color palette.
 * Exports getNodeColor.
 */
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

const clusterPalette = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

export function getClusterColor(clusterId: string | number): string {
  const idx = parseInt(String(clusterId), 10);
  return clusterPalette[idx % clusterPalette.length];
}
