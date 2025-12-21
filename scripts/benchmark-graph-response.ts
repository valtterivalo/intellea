/**
 * @fileoverview Benchmark adapters for large graph payloads.
 */

import { performance } from 'node:perf_hooks';
import { intelleaToGraphResponse } from '@/lib/adapters/intelleaToGraphResponse';
import { markdownToGraphResponse } from '@/lib/adapters/markdownToGraphResponse';
import type { IntelleaResponse } from '@intellea/graph-schema';

const buildSyntheticIntelleaResponse = (nodeCount: number): IntelleaResponse => {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `n-${index}`,
    label: `node ${index}`,
    isRoot: index === 0,
    depth: index === 0 ? 0 : 1,
    fx: index * 2,
    fy: index * -1,
    fz: index % 3 === 0 ? index * 0.5 : undefined,
  }));

  const links = Array.from({ length: nodeCount - 1 }, (_, index) => ({
    source: 'n-0',
    target: `n-${index + 1}`,
  }));

  const knowledgeCards = nodes.map((node) => ({
    nodeId: node.id,
    title: node.label,
    description: `description for ${node.label}`,
  }));

  return {
    sessionTitle: 'benchmark session',
    explanationMarkdown: 'benchmark payload',
    knowledgeCards,
    visualizationData: { nodes, links },
  };
};

const buildMarkdownPayload = (nodeCount: number): string => {
  const lines = ['# benchmark root', '## items'];
  for (let i = 0; i < nodeCount; i += 1) {
    lines.push(`- item ${i}`);
  }
  return lines.join('\n');
};

const formatMs = (value: number): string => `${value.toFixed(2)}ms`;

const reportMemory = (label: string) => {
  const mem = process.memoryUsage();
  const mb = (value: number) => `${(value / 1024 / 1024).toFixed(1)}mb`;
  console.log(`${label}: rss=${mb(mem.rss)} heap=${mb(mem.heapUsed)} external=${mb(mem.external)}`);
};

const run = () => {
  const targetNodes = 5000;
  console.log(`benchmarking adapters with ${targetNodes} nodes`);

  const intelleaPayload = buildSyntheticIntelleaResponse(targetNodes);
  const markdownPayload = buildMarkdownPayload(targetNodes);

  const startIntellea = performance.now();
  intelleaToGraphResponse(intelleaPayload);
  const endIntellea = performance.now();
  console.log(`intellea adapter: ${formatMs(endIntellea - startIntellea)}`);
  reportMemory('after intellea');

  const startMarkdown = performance.now();
  markdownToGraphResponse(markdownPayload, { maxNodes: targetNodes + 5 });
  const endMarkdown = performance.now();
  console.log(`markdown adapter: ${formatMs(endMarkdown - startMarkdown)}`);
  reportMemory('after markdown');
};

run();
