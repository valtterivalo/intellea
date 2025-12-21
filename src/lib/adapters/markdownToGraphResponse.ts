/**
 * @fileoverview Adapter from markdown/text to GraphResponseV0.
 * Exports: markdownToGraphResponse
 */

import type {
  GraphResponseV0,
  GraphModeV0,
  GraphNodeV0,
  GraphEdgeV0,
  GraphLayoutHintV0,
  GraphLabelDensityV0,
} from '@intellea/graph-schema';

export interface MarkdownAdapterOptions {
  maxNodes?: number;
  mode?: GraphModeV0;
  layout?: GraphLayoutHintV0;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

const labelDensityForCount = (count: number): GraphLabelDensityV0 => {
  if (count > 120) return 'low';
  if (count > 40) return 'medium';
  return 'high';
};

/**
 * @description Convert markdown or plain text into a GraphResponseV0 payload.
 * @param input - Markdown or text content.
 * @param options - Adapter options.
 */
export const markdownToGraphResponse = (
  input: string,
  options: MarkdownAdapterOptions = {}
): GraphResponseV0 => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('markdownToGraphResponse: input is empty.');
  }

  const maxNodes = options.maxNodes ?? 120;
  const mode = options.mode ?? 'map';
  const layout: GraphLayoutHintV0 = options.layout ?? {
    algorithm: 'force',
    dimensions: 3,
  };

  const nodes: GraphNodeV0[] = [];
  const edges: GraphEdgeV0[] = [];
  const idCounts = new Map<string, number>();

  const createNode = (label: string, type: GraphNodeV0['type'], summary?: string) => {
    if (nodes.length >= maxNodes) {
      throw new Error(`markdownToGraphResponse: maxNodes ${maxNodes} exceeded.`);
    }
    const baseId = slugify(label) || `node-${nodes.length + 1}`;
    const count = (idCounts.get(baseId) ?? 0) + 1;
    idCounts.set(baseId, count);
    const id = count === 1 ? baseId : `${baseId}-${count}`;
    const node: GraphNodeV0 = { id, label, type, summary };
    nodes.push(node);
    return node;
  };

  let rootId: string | null = null;
  let currentSectionId: string | null = null;

  const lines = trimmed.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      const title = headingMatch[1].trim();
      if (!title) continue;
      const node = createNode(title, rootId ? 'entity' : 'claim');
      if (!rootId) {
        rootId = node.id;
      } else {
        edges.push({ source: rootId, target: node.id, type: 'relates_to' });
      }
      currentSectionId = node.id;
      continue;
    }

    const listMatch = line.match(/^(\s*[-*+]|\s*\d+\.)\s+(.*)$/);
    if (listMatch) {
      const item = listMatch[2].trim();
      if (!item) continue;
      const node = createNode(item, 'entity');
      const parentId = currentSectionId ?? rootId ?? node.id;
      if (!rootId) {
        rootId = node.id;
      } else if (parentId && parentId !== node.id) {
        edges.push({ source: parentId, target: node.id, type: 'relates_to' });
      }
      continue;
    }

    if (!rootId) {
      const node = createNode(line, 'claim');
      rootId = node.id;
      currentSectionId = node.id;
      continue;
    }
  }

  if (!rootId) {
    const fallbackNode = createNode('untitled', 'claim');
    rootId = fallbackNode.id;
  }

  if (nodes.length === 1) {
    const sentences = splitSentences(trimmed).slice(0, maxNodes - 1);
    for (const sentence of sentences) {
      if (sentence === nodes[0].label) continue;
      const node = createNode(sentence, 'entity');
      edges.push({ source: rootId, target: node.id, type: 'relates_to' });
    }
  }

  return {
    version: 'v0',
    mode,
    nodes,
    edges,
    layout,
    view: {
      labelDensity: labelDensityForCount(nodes.length),
      defaultFocusNodeId: rootId,
      emphasisNodeIds: rootId ? [rootId] : undefined,
    },
    meta: {
      source: 'markdown',
      lineCount: lines.length,
      charCount: trimmed.length,
    },
  };
};
