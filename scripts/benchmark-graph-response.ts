/**
 * @fileoverview Benchmark adapters for large graph payloads.
 */

import { performance } from 'node:perf_hooks';
import { markdownToGraphResponse } from '@intellea/graph-adapters';

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

  const markdownPayload = buildMarkdownPayload(targetNodes);

  const startMarkdown = performance.now();
  markdownToGraphResponse(markdownPayload, { maxNodes: targetNodes + 5 });
  const endMarkdown = performance.now();
  console.log(`markdown adapter: ${formatMs(endMarkdown - startMarkdown)}`);
  reportMemory('after markdown');
};

run();
