/**
 * @fileoverview Estimate graph buffer preparation cost for the WebGPU renderer.
 */

import { getWebGPUSupportInfo, isWebGPUSupported } from '../packages/graph-renderer/src/lib/webgpu/device';

interface BenchmarkGraphNode {
  id: string;
  x: number;
  y: number;
  z: number;
}

interface BenchmarkGraphLink {
  source: string;
  target: string;
}

interface BenchmarkGraphData {
  nodes: BenchmarkGraphNode[];
  links: BenchmarkGraphLink[];
}

interface BufferBenchmarkResult {
  nodeCount: number;
  linkCount: number;
  nodeBufferBytes: number;
  linkBufferBytes: number;
  preparationMs: number;
}

interface DeterministicRandomState {
  seed: number;
}

function nextRandom(state: DeterministicRandomState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 0xffffffff;
}

function generateGraphData(nodeCount: number, linkCount: number): BenchmarkGraphData {
  const random = { seed: 0xdecafbad };
  const nodes: BenchmarkGraphNode[] = [];
  const links: BenchmarkGraphLink[] = [];

  for (let index = 0; index < nodeCount; index += 1) {
    nodes.push({
      id: `node-${index}`,
      x: (nextRandom(random) - 0.5) * 1000,
      y: (nextRandom(random) - 0.5) * 1000,
      z: (nextRandom(random) - 0.5) * 1000,
    });
  }

  while (links.length < linkCount) {
    const source = Math.floor(nextRandom(random) * nodeCount);
    const target = Math.floor(nextRandom(random) * nodeCount);
    if (source !== target) {
      links.push({
        source: `node-${source}`,
        target: `node-${target}`,
      });
    }
  }

  return { nodes, links };
}

function prepareRendererBuffers(graph: BenchmarkGraphData): BufferBenchmarkResult {
  const startedAt = performance.now();
  const nodeBuffer = new Float32Array(graph.nodes.length * 8);
  const linkBuffer = new Float32Array(graph.links.length * 16);
  const nodeById = new Map<string, BenchmarkGraphNode>();

  graph.nodes.forEach((node, index) => {
    nodeById.set(node.id, node);
    nodeBuffer[index * 8 + 0] = node.x;
    nodeBuffer[index * 8 + 1] = node.y;
    nodeBuffer[index * 8 + 2] = node.z;
    nodeBuffer[index * 8 + 3] = 1;
    nodeBuffer[index * 8 + 4] = 1;
    nodeBuffer[index * 8 + 5] = 1;
    nodeBuffer[index * 8 + 6] = 1;
    nodeBuffer[index * 8 + 7] = 1;
  });

  graph.links.forEach((link, index) => {
    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target) throw new Error(`invalid link ${link.source} -> ${link.target}`);

    const offset = index * 16;
    linkBuffer[offset + 0] = source.x;
    linkBuffer[offset + 1] = source.y;
    linkBuffer[offset + 2] = source.z;
    linkBuffer[offset + 4] = target.x;
    linkBuffer[offset + 5] = target.y;
    linkBuffer[offset + 6] = target.z;
    linkBuffer[offset + 8] = 1;
    linkBuffer[offset + 9] = 1;
    linkBuffer[offset + 10] = 1;
    linkBuffer[offset + 11] = 0.4;
    linkBuffer[offset + 12] = 2;
  });

  return {
    nodeCount: graph.nodes.length,
    linkCount: graph.links.length,
    nodeBufferBytes: nodeBuffer.byteLength,
    linkBufferBytes: linkBuffer.byteLength,
    preparationMs: performance.now() - startedAt,
  };
}

async function runBenchmarks(): Promise<void> {
  const supportInfo = await getWebGPUSupportInfo();
  console.log('WebGPU available:', isWebGPUSupported());
  console.log('WebGPU support:', supportInfo);

  const cases = [
    { nodeCount: 100, linkCount: 200 },
    { nodeCount: 1000, linkCount: 2000 },
    { nodeCount: 5000, linkCount: 10000 },
    { nodeCount: 10000, linkCount: 20000 },
  ];

  for (const testCase of cases) {
    const graph = generateGraphData(testCase.nodeCount, testCase.linkCount);
    const result = prepareRendererBuffers(graph);
    console.log(result);
  }
}

void runBenchmarks();
