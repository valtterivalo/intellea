/**
 * @fileoverview Streaming-aware OpenAI Vector Stores API service with progress tracking
 * Exports: addFileToVectorStoreWithProgress
 */

import type { StreamEmitter } from '@/types/streaming';
import { getOpenAIClient } from '@/lib/openaiClient';

/**
 * Add a file to a vector store with streaming progress updates
 */
export async function addFileToVectorStoreWithProgress(
  vectorStoreId: string,
  fileId: string,
  fileName: string,
  emitter: StreamEmitter
): Promise<void> {
  try {
    const openai = getOpenAIClient();
    emitter.emit({
      type: 'file-upload-progress',
      fileName,
      stage: 'adding-to-vectorstore'
    });
    
    const vectorStoreStart = Date.now();
    if (process.env.APP_DEBUG === 'true') console.log(`Adding file ${fileId} to vector store ${vectorStoreId}`);
    
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: fileId,
      attributes: { filename: fileName },
    });
    
    const vectorStoreTime = Date.now() - vectorStoreStart;
    if (process.env.APP_DEBUG === 'true') console.log(`File ${fileId} added to vector store successfully (${vectorStoreTime}ms)`);
  } catch (error) {
    console.error(`Failed to add file ${fileId} to vector store ${vectorStoreId}:`, error);
    emitter.emit({
      type: 'error',
      error: `Failed to add ${fileName} to vector store: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stage: 'vector-store'
    });
    throw error;
  }
}
