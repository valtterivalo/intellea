/**
 * @description Compute completion percentage for a set of nodes.
 * @param total - Total number of nodes.
 * @param completedIds - IDs of completed nodes.
 * @returns Percentage complete from 0 to 100.
 */
export function computeProgress(total: number, completedIds: Set<string>): number {
  if (total === 0) return 0;
  return (completedIds.size / total) * 100;
}

import type { GraphData, NodeObject } from '@/store/useAppStore';
/**
 * @description Suggest the next uncompleted node using BFS traversal.
 * @param graph - Graph data to evaluate.
 * @param completedIds - Set of completed node IDs.
 * @returns The next node to complete or null.
 */

export function suggestNextNode(graph: GraphData | null, completedIds: Set<string>): NodeObject | null {
  if (!graph || !graph.nodes || !graph.links || graph.nodes.length === 0) {
    return null;
  }
  const root = graph.nodes.find(n => n.isRoot) || graph.nodes[0];
  const adj = new Map<string, Set<string>>();
  graph.links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (!adj.has(s)) adj.set(s, new Set());
    if (!adj.has(t)) adj.set(t, new Set());
    adj.get(s)!.add(t);
    adj.get(t)!.add(s);
  });

  const visited = new Set<string>([root.id]);
  const queue: string[] = [root.id];

  while (queue.length) {
    const id = queue.shift()!;
    if (id !== root.id && !completedIds.has(id)) {
      return graph.nodes.find(n => n.id === id) || null;
    }
    adj.get(id)?.forEach(n => {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    });
  }
  return null;
}
