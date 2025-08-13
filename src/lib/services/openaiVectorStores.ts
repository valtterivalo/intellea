/**
 * @fileoverview OpenAI Vector Stores service for persistent document search
 * Exports: createVectorStore, addFileToVectorStore, searchVectorStore, deleteVectorStore
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VectorStoreResult {
  id: string;
  name: string;
  status: 'in_progress' | 'completed' | 'expired';
  fileCounts: {
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  usageBytes: number;
  createdAt: number;
}

/**
 * Create a new vector store for a user
 */
export async function createVectorStore(
  userId: string,
  name?: string
): Promise<VectorStoreResult> {
  try {
    const storeName = name || `User Documents - ${userId.slice(0, 8)}`;
    
    if (process.env.APP_DEBUG === 'true') console.log(`Creating vector store for user ${userId}: ${storeName}`);
    
    const response = await openai.vectorStores.create({
      name: storeName,
      metadata: {
        user_id: userId,
        created_by: 'intellea_app',
      },
    });
    
    if (process.env.APP_DEBUG === 'true') console.log(`Vector store created successfully: ${response.id}`);
    
    return {
      id: response.id,
      name: response.name || storeName,
      status: response.status as 'in_progress' | 'completed' | 'expired',
      fileCounts: {
        inProgress: response.file_counts.in_progress,
        completed: response.file_counts.completed,
        failed: response.file_counts.failed,
        cancelled: response.file_counts.cancelled,
        total: response.file_counts.total,
      },
      usageBytes: response.usage_bytes,
      createdAt: response.created_at,
    };
  } catch (error) {
    console.error(`Failed to create vector store for user ${userId}:`, error);
    throw new Error(`Vector store creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add a file to a vector store
 */
export async function addFileToVectorStore(
  vectorStoreId: string,
  fileId: string,
  filename?: string
): Promise<void> {
  try {
    if (process.env.APP_DEBUG === 'true') console.log(`Adding file ${fileId} to vector store ${vectorStoreId}`);
    
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: fileId,
      attributes: filename ? { filename } : undefined,
    });
    
    if (process.env.APP_DEBUG === 'true') console.log(`File ${fileId} added to vector store successfully`);
  } catch (error) {
    console.error(`Failed to add file ${fileId} to vector store ${vectorStoreId}:`, error);
    throw new Error(`Add file to vector store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get vector store information
 */
export async function getVectorStore(vectorStoreId: string): Promise<VectorStoreResult> {
  try {
    const response = await openai.vectorStores.retrieve(vectorStoreId);
    
    return {
      id: response.id,
      name: response.name || 'Untitled Vector Store',
      status: response.status as 'in_progress' | 'completed' | 'expired',
      fileCounts: {
        inProgress: response.file_counts.in_progress,
        completed: response.file_counts.completed,
        failed: response.file_counts.failed,
        cancelled: response.file_counts.cancelled,
        total: response.file_counts.total,
      },
      usageBytes: response.usage_bytes,
      createdAt: response.created_at,
    };
  } catch (error) {
    console.error(`Failed to get vector store ${vectorStoreId}:`, error);
    throw new Error(`Get vector store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search vector store for relevant content
 */
export async function searchVectorStore(
  vectorStoreId: string,
  query: string,
  maxResults: number = 10
): Promise<any> {
  try {
    if (process.env.APP_DEBUG === 'true') console.log(`Searching vector store ${vectorStoreId} for: "${query}"`);
    
    const response = await openai.vectorStores.search(vectorStoreId, {
      query,
      max_num_results: maxResults,
    });
    
    return response;
  } catch (error) {
    console.error(`Failed to search vector store ${vectorStoreId}:`, error);
    throw new Error(`Vector store search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List files in a vector store
 */
export async function listVectorStoreFiles(
  vectorStoreId: string
): Promise<OpenAI.VectorStores.Files.VectorStoreFile[]> {
  try {
    const response = await openai.vectorStores.files.list(vectorStoreId);
    return response.data;
  } catch (error) {
    console.error(`Failed to list files in vector store ${vectorStoreId}:`, error);
    throw new Error(`List vector store files failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove a file from a vector store
 */
export async function removeFileFromVectorStore(
  vectorStoreId: string,
  fileId: string
): Promise<boolean> {
  try {
    if (process.env.APP_DEBUG === 'true') console.log(`Removing file ${fileId} from vector store ${vectorStoreId}`);
    
    const response = await openai.vectorStores.files.del(vectorStoreId, fileId);
    
    return response.deleted;
  } catch (error) {
    console.error(`Failed to remove file ${fileId} from vector store ${vectorStoreId}:`, error);
    throw new Error(`Remove file from vector store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a vector store entirely
 */
export async function deleteVectorStore(vectorStoreId: string): Promise<boolean> {
  try {
    if (process.env.APP_DEBUG === 'true') console.log(`Deleting vector store: ${vectorStoreId}`);
    
    const response = await openai.vectorStores.del(vectorStoreId);
    
    return response.deleted;
  } catch (error) {
    console.error(`Failed to delete vector store ${vectorStoreId}:`, error);
    throw new Error(`Delete vector store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wait for vector store processing to complete
 */
export async function waitForVectorStoreReady(
  vectorStoreId: string,
  timeoutMs: number = 60000
): Promise<VectorStoreResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const store = await getVectorStore(vectorStoreId);
    
    if (store.status === 'completed') {
      return store;
    }
    
    if (store.status === 'expired') {
      throw new Error('Vector store expired during processing');
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Vector store processing timeout after ${timeoutMs}ms`);
}