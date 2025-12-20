/**
 * @fileoverview Streaming-aware versions of generation helpers with progress tracking.
 * Exports: getNodeEmbeddingsStreaming, calculateNodePositionsStreaming
 */
import { UMAP } from 'umap-js';
import type { NodeObject as GraphNode } from '@/types/intellea';
import type { StreamEmitter } from '@/types/streaming';
import { getOpenAIClient } from '@/lib/openaiClient';

/**
 * @description Retrieve embeddings for multiple texts using OpenAI with progress updates.
 * @param texts - Array of strings to embed.
 * @param emitter - Stream emitter for progress updates.
 * @returns Array of embedding vectors.
 */
export async function getNodeEmbeddingsStreaming(
  texts: string[],
  emitter: StreamEmitter
): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];
  
  try {
    if (process.env.APP_DEBUG === "true") console.log(`Requesting embeddings for ${texts.length} texts...`);
    
    emitter.emit({
      type: 'embeddings-progress',
      completed: 0,
      total: texts.length
    });
    
    // For large batches, we might want to process in chunks to show progress
    // OpenAI allows up to 2048 texts per request, so usually we can do it in one call
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: texts,
    });
    
    if (process.env.APP_DEBUG === "true") console.log('Embeddings received.');
    
    emitter.emit({
      type: 'embeddings-progress',
      completed: texts.length,
      total: texts.length
    });
    
    return response.data.map((emb) => emb.embedding);
  } catch (error) {
    console.error('Error getting embeddings:', error);
    emitter.emit({
      type: 'error',
      error: 'Failed to generate node embeddings',
      stage: 'embeddings'
    });
    throw new Error('Failed to generate node embeddings.');
  }
}

/**
 * @description Calculate 3D node positions using UMAP with progress updates.
 * @param embeddings - Embedding vectors for each node.
 * @param nodesForPositioning - Nodes whose positions will be calculated.
 * @param emitter - Stream emitter for progress updates.
 * @returns Array of fixed node positions.
 */
export async function calculateNodePositionsStreaming(
  embeddings: number[][],
  nodesForPositioning: GraphNode[],
  emitter: StreamEmitter
): Promise<Array<{ fx: number; fy: number; fz: number }>> {
  if (
    !embeddings ||
    embeddings.length === 0 ||
    embeddings.length !== nodesForPositioning.length
  ) {
    console.warn('Embeddings or nodes mismatch, returning empty positions.');
    return [];
  }

  emitter.emit({
    type: 'positioning-started',
    stage: 'umap-init'
  });

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
      if (process.env.APP_DEBUG === "true") console.log(`Calculating UMAP for ${embeddings.length} embeddings...`);
      
      emitter.emit({
        type: 'positioning-started',
        stage: 'umap-calculate'
      });
      
      const umap = new UMAP({
        nComponents: 3,
        nNeighbors: Math.min(20, embeddings.length - 1),
        minDist: 0.05,
        spread: 1.2,
      });
      
      // UMAP doesn't provide progress callbacks, but we can at least show that it's running
      const umapOutput = await umap.fitAsync(embeddings);
      if (process.env.APP_DEBUG === "true") console.log('UMAP calculation complete.');

      const scaleFactor = 150;
      rawPositions = umapOutput.map((pos) => ({
        fx: pos[0] * scaleFactor,
        fy: pos[1] * scaleFactor,
        fz: pos[2] * scaleFactor,
      }));
    } catch (error) {
      console.error('Error calculating UMAP positions:', error);
      emitter.emit({
        type: 'error',
        error: 'Failed to calculate node positions',
        stage: 'positioning'
      });
      return nodesForPositioning.map(() => ({ fx: 0, fy: 0, fz: 0 }));
    }
  }

  // --- Center the Root Node ---
  emitter.emit({
    type: 'positioning-started',
    stage: 'centering'
  });
  
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

  if (process.env.APP_DEBUG === "true") console.log(
    `Centering graph around root node. Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}, ${offsetZ.toFixed(2)})`
  );

  const centeredPositions = rawPositions.map((pos) => ({
    fx: pos.fx - offsetX,
    fy: pos.fy - offsetY,
    fz: pos.fz - offsetZ,
  }));

  emitter.emit({
    type: 'positioning-progress',
    progress: 100
  });

  return centeredPositions;
}
