/**
 * @fileoverview Library utilities.
 * Exports: computeProgress, suggestNextNode
 */
export function computeProgress(total: number, completedIds: Set<string>): number {
  if (total === 0) return 0;
  return (completedIds.size / total) * 100;
}

import type { GraphData, NodeObject } from '@/store/useAppStore';

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
