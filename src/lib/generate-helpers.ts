/**
 * @fileoverview Library utilities.
 * Exports: calculateNodePositions, getNodeEmbeddings, getNodeTextForEmbedding
 */
import OpenAI from 'openai';
import { UMAP } from 'umap-js';
import type { NodeObject as GraphNode, KnowledgeCard } from '@/types/intellea';

// Ensure API keys are available for embedding requests
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get text content for embedding (prioritizes knowledge card description,
 * falling back to node label or ID).
 */
export function getNodeTextForEmbedding(
  node: GraphNode,
  cards: KnowledgeCard[]
): string {
  const card = cards.find((c) => c.nodeId === node.id);
  return card?.description || node.label || node.id;
}

/**
 * Retrieve embeddings for an array of texts from OpenAI.
 */
export async function getNodeEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];
  try {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`Requesting embeddings for ${texts.length} texts...`);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('Embeddings received.');
    return response.data.map((emb) => emb.embedding);
  } catch (error) {
    console.error('Error getting embeddings:', error);
    throw new Error('Failed to generate node embeddings.');
  }
}

/**
 * Calculate 3D node positions using UMAP and center the root node.
 */
export async function calculateNodePositions(
  embeddings: number[][],
  nodesForPositioning: GraphNode[]
): Promise<Array<{ fx: number; fy: number; fz: number }>> {
  if (
    !embeddings ||
    embeddings.length === 0 ||
    embeddings.length !== nodesForPositioning.length
  ) {
    console.warn('Embeddings or nodes mismatch, returning empty positions.');
    return [];
  }

  let rawPositions: Array<{ fx: number; fy: number; fz: number }>;

  // Handle edge case: only 1 node (must be root)
  if (embeddings.length === 1) {
    rawPositions = [{ fx: 0, fy: 0, fz: 0 }];
  }
  // Handle edge case: 2 nodes (root and one other)
  else if (embeddings.length === 2) {
    const rootIndex = nodesForPositioning.findIndex((n) => n.isRoot);
    const otherIndex = 1 - rootIndex;
    rawPositions = Array(2).fill({ fx: 0, fy: 0, fz: 0 });
    if (rootIndex !== -1 && otherIndex !== -1) {
      rawPositions[rootIndex] = { fx: 0, fy: 0, fz: 0 };
      rawPositions[otherIndex] = { fx: 50, fy: 0, fz: 0 };
    } else {
      rawPositions[0] = { fx: 0, fy: 0, fz: 0 };
      rawPositions[1] = { fx: 50, fy: 0, fz: 0 };
    }
  }
  // Normal case: 3+ nodes
  else {
    try {
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(`Calculating UMAP for ${embeddings.length} embeddings...`);
      const umap = new UMAP({
        nComponents: 3,
        nNeighbors: Math.min(20, embeddings.length - 1),
        minDist: 0.05,
        spread: 1.2,
      });
      const umapOutput = await umap.fitAsync(embeddings);
      if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log('UMAP calculation complete.');

      const scaleFactor = 150;
      rawPositions = umapOutput.map((pos) => ({
        fx: pos[0] * scaleFactor,
        fy: pos[1] * scaleFactor,
        fz: pos[2] * scaleFactor,
      }));
    } catch (error) {
      console.error('Error calculating UMAP positions:', error);
      return nodesForPositioning.map(() => ({ fx: 0, fy: 0, fz: 0 }));
    }
  }

  // --- Center the Root Node ---
  const rootIndex = nodesForPositioning.findIndex((n) => n.isRoot === true);
  if (rootIndex === -1 || !rawPositions[rootIndex]) {
    console.warn(
      'Root node not found or missing position after UMAP. Skipping centering.'
    );
    return rawPositions;
  }

  const rootPosition = rawPositions[rootIndex];
  const offsetX = rootPosition.fx;
  const offsetY = rootPosition.fy;
  const offsetZ = rootPosition.fz;

  if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log(
    `Centering graph around root node. Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}, ${offsetZ.toFixed(2)})`
  );

  const centeredPositions = rawPositions.map((pos) => ({
    fx: pos.fx - offsetX,
    fy: pos.fy - offsetY,
    fz: pos.fz - offsetZ,
  }));

  return centeredPositions;
}

