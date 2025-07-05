interface ClusterGraphData {
  nodes: Array<{ id: string }>;
  links: Array<{ source: string | { id: string }; target: string | { id: string } }>;
}

type ClusterMap = Record<string, string>;

/**
 * @description Compute community clusters for a graph.
 * Tries to use `graphology` with the Louvain algorithm when available and
 * otherwise groups connected components.
 * @param data - Graph nodes and links to cluster.
 * @returns Mapping of node id to cluster id.
 */
export function computeClusters(data: ClusterGraphData): ClusterMap {
  try {
    // Dynamically import graphology packages if present
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Graphology = require('graphology');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  } catch {
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
    let clusterIndex = 0;
    for (const id of Object.keys(adj)) {
      if (clusters[id]) continue;
      const queue = [id];
      clusters[id] = String(clusterIndex);
      while (queue.length) {
        const current = queue.pop() as string;
        for (const neighborId of adj[current]) {
          if (!clusters[neighborId]) {
            clusters[neighborId] = String(clusterIndex);
            queue.push(neighborId);
          }
        }
      }
      clusterIndex++;
    }
    return clusters;
  }
}
