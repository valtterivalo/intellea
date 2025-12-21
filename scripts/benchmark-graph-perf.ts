/**
 * @fileoverview Benchmark graph perf helpers.
 */

import { performance } from 'node:perf_hooks';
import { applyStableExpansionLayout } from '@/lib/expansionLayout';
import { selectCoreNodeIds } from '@intellea/graph-renderer';

type Node = {
  id: string;
  label: string;
  fx?: number;
  fy?: number;
  fz?: number;
  x?: number;
  y?: number;
  z?: number;
};

type Link = {
  source: string;
  target: string;
};

type Graph = {
  nodes: Node[];
  links: Link[];
};

const buildGraph = (nodeCount: number, linkCount: number): Graph => {
  const nodes: Node[] = Array.from({ length: nodeCount }, (_, index) => ({
    id: `node-${index}`,
    label: `node ${index}`,
  }));
  const links: Link[] = [];
  for (let i = 0; i < linkCount; i += 1) {
    const sourceIndex = Math.floor(Math.random() * nodeCount);
    let targetIndex = Math.floor(Math.random() * nodeCount);
    if (targetIndex === sourceIndex) {
      targetIndex = (targetIndex + 1) % nodeCount;
    }
    links.push({
      source: nodes[sourceIndex].id,
      target: nodes[targetIndex].id,
    });
  }
  return { nodes, links };
};

const buildAdjacency = (links: Link[]): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();
  links.forEach((link) => {
    if (!map.has(link.source)) map.set(link.source, new Set());
    if (!map.has(link.target)) map.set(link.target, new Set());
    map.get(link.source)?.add(link.target);
    map.get(link.target)?.add(link.source);
  });
  return map;
};

const buildLabelAllowSet = (
  adjacency: Map<string, Set<string>>,
  priorityIds: Set<string>,
  maxLabelCount: number
): Set<string> => {
  const degrees = Array.from(adjacency.entries()).sort(
    (a, b) => b[1].size - a[1].size
  );
  const selected = new Set(priorityIds);
  for (const [id] of degrees) {
    if (selected.size >= maxLabelCount) break;
    selected.add(id);
  }
  return selected;
};

const nodeCount = Number(process.argv[2] ?? '5000');
const linkCount = Number(process.argv[3] ?? '20000');
const graph = buildGraph(nodeCount, linkCount);

const coreStart = performance.now();
const coreIds = selectCoreNodeIds(graph, Math.min(700, nodeCount), new Set([graph.nodes[0].id]));
const coreEnd = performance.now();

const adjacencyStart = performance.now();
const adjacency = buildAdjacency(graph.links);
const labelSet = buildLabelAllowSet(adjacency, coreIds, 140);
const adjacencyEnd = performance.now();

const expansionStart = performance.now();
const existingNodes = graph.nodes.slice(0, Math.max(1, nodeCount - 20));
const newNodes = graph.nodes.slice(-20).map((node) => ({
  id: node.id,
  label: node.label,
}));
const laidOut = applyStableExpansionLayout(existingNodes, newNodes, existingNodes[0]?.id);
const expansionEnd = performance.now();

const ms = (value: number) => `${value.toFixed(2)}ms`;

console.log('graph perf benchmark');
console.log(`nodes: ${nodeCount}, links: ${linkCount}`);
console.log(`selectCoreNodeIds: ${ms(coreEnd - coreStart)}`);
console.log(`labelAllowSet: ${ms(adjacencyEnd - adjacencyStart)} (set size ${labelSet.size})`);
console.log(`stable expansion layout: ${ms(expansionEnd - expansionStart)} (nodes ${laidOut.length})`);
