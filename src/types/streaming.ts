/**
 * @fileoverview Streaming event types for real-time generation progress.
 * Exports: StreamingEvent, StreamEmitter
 */

import type { IntelleaResponse } from './intellea';

export type StreamingEvent = 
  | { type: 'status', message: string, progress?: number, stage?: string }
  | { type: 'graph-partial', data: Partial<IntelleaResponse>, nodeCount?: number, linkCount?: number }
  | { type: 'embeddings-started', totalNodes: number }
  | { type: 'embeddings-progress', completed: number, total: number }  
  | { type: 'positioning-started', stage: 'umap-init' | 'umap-calculate' | 'centering' }
  | { type: 'positioning-progress', progress: number }
  | { type: 'documents-processing', fileName: string, progress: number, total: number }
  | { type: 'file-upload-started', fileName: string, fileSize: number }
  | { type: 'file-upload-progress', fileName: string, stage: 'converting' | 'uploading' | 'processing' | 'adding-to-vectorstore' }
  | { type: 'file-upload-complete', fileName: string, fileId: string }
  | { type: 'complete', data: IntelleaResponse }
  | { type: 'error', error: string, stage?: string };

export interface StreamEmitter {
  emit(event: StreamingEvent): void;
  close(): void;
}

/**
 * @description Create SSE stream emitter for sending events to client.
 */
export function createStreamEmitter(): {
  emitter: StreamEmitter;
  stream: ReadableStream;
} {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      // Stream cancelled by client
      console.log('Stream cancelled by client');
    }
  });

  const emitter: StreamEmitter = {
    emit(event: StreamingEvent) {
      try {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(data));
      } catch (error) {
        console.error('Error emitting stream event:', error);
      }
    },
    close() {
      try {
        controller.close();
      } catch {
        // Stream already closed
      }
    }
  };

  return { emitter, stream };
}

/**
 * @description Utility for creating status messages with consistent formatting.
 */
export const StatusMessages = {
  // Initial stages
  ANALYZING_TOPIC: 'Analyzing your topic...',
  PROCESSING_FILES: 'Processing uploaded documents...',
  
  // Graph generation
  BUILDING_GRAPH: 'Building knowledge graph...',
  CREATING_CONNECTIONS: 'Creating connections...',
  
  // Post-processing
  CALCULATING_EMBEDDINGS: 'Calculating semantic embeddings...',
  POSITIONING_NODES: 'Positioning nodes in 3D space...',
  CENTERING_GRAPH: 'Centering and optimizing layout...',
  
  // Completion
  FINALIZING: 'Finalizing visualization...',
  COMPLETE: 'Knowledge graph ready!'
} as const;