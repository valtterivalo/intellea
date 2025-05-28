export interface ClusterGraphData {
  nodes: Array<{ id: string }>;
  links: Array<{ source: string | { id: string }; target: string | { id: string } }>;
}

export type ClusterMap = Record<string, string>;

/**
 * Compute clusters for a graph.
 *
 * Tries to use `graphology` with the Louvain algorithm if available.
 * Falls back to grouping connected components when the library is missing.
 */
export function computeClusters(data: ClusterGraphData): ClusterMap {
  try {
    // Dynamically require graphology packages if present
    const Graphology = require('graphology');
    const louvain = require('graphology-communities-louvain');

    const graph = new Graphology.UndirectedGraph();
    data.nodes.forEach(n => graph.addNode(n.id));
    data.links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (graph.hasNode(s) && graph.hasNode(t)) {
        graph.addUndirectedEdgeWithKey(`${s}-${t}`, s, t);
      }
    });
    return louvain.louvain(graph);
  } catch (err) {
    // Fallback simple connected components clustering
    const adj: Record<string, Set<string>> = {};
    data.nodes.forEach(n => {
      adj[n.id] = adj[n.id] || new Set();
    });
    data.links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (!adj[s]) adj[s] = new Set();
      if (!adj[t]) adj[t] = new Set();
      adj[s].add(t);
      adj[t].add(s);
    });
    const clusters: ClusterMap = {};
    let cid = 0;
    for (const id of Object.keys(adj)) {
      if (clusters[id]) continue;
      const queue = [id];
      clusters[id] = String(cid);
      while (queue.length) {
        const n = queue.pop() as string;
        for (const nb of adj[n]) {
          if (!clusters[nb]) {
            clusters[nb] = String(cid);
            queue.push(nb);
          }
        }
      }
      cid++;
    }
    return clusters;
  }
}
