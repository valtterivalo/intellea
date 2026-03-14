/**
 * @fileoverview Community clustering via graphology + Louvain algorithm.
 * Exports: computeClusters
 */
import { UndirectedGraph } from 'graphology';
import louvain from 'graphology-communities-louvain';

interface ClusterGraphData {
  nodes: Array<{ id: string }>;
  links: Array<{ source: string | { id: string }; target: string | { id: string } }>;
}

type ClusterMap = Record<string, string>;

/**
 * @description Compute community clusters using the Louvain algorithm.
 * @param data - Graph nodes and links to cluster.
 * @returns Mapping of node id to cluster id.
 */
export function computeClusters(data: ClusterGraphData): ClusterMap {
  const graph = new UndirectedGraph();
  data.nodes.forEach((n) => graph.addNode(n.id));
  data.links.forEach((l) => {
    const s = typeof l.source === 'string' ? l.source : l.source.id;
    const t = typeof l.target === 'string' ? l.target : l.target.id;
    if (graph.hasNode(s) && graph.hasNode(t)) {
      graph.addUndirectedEdgeWithKey(`${s}-${t}`, s, t);
    }
  });
  const raw = louvain(graph);
  const result: ClusterMap = {};
  for (const [id, cluster] of Object.entries(raw)) {
    result[id] = String(cluster);
  }
  return result;
}
