/**
 * @fileoverview Streaming-aware document management with granular progress tracking
 * Exports: processAndStoreDocumentsWithProgress
 */

import { createClient } from '@/lib/supabase/server';
import { validateStorageLimit } from './openaiFiles';
import { ensureUserVectorStore } from './documentManager';
import { uploadFileWithProgress } from './openaiFilesStreaming';
import { addFileToVectorStoreWithProgress } from './openaiVectorStoresStreaming';
import { calculateFileHash, findExistingFile, storeFileRecord } from './fileDeduplication';
import type { StreamEmitter } from '@/types/streaming';

export interface DocumentProcessingResult {
  files: File[];
  vectorStoreId: string;
  uploadedFileIds: string[];
  totalBytes: number;
}

/**
 * Process documents with detailed streaming progress updates
 */
export async function processAndStoreDocumentsWithProgress(
  files: File[],
  userId: string,
  emitter: StreamEmitter,
  sessionId?: string
): Promise<DocumentProcessingResult> {
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }
  
  if (process.env.APP_DEBUG === 'true') console.log(`Processing ${files.length} documents for user ${userId}`);
  
  const supabase = await createClient();
  
  // Get current storage usage
  const { data: user, error: userError } = await supabase
    .from('profiles')  
    .select('file_storage_bytes')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Failed to get user storage data: ${userError.message}`);
  }
  
  const currentBytes = user.file_storage_bytes || 0;
  const additionalBytes = files.reduce((total, file) => total + file.size, 0);
  
  // Check storage limits
  validateStorageLimit(currentBytes, additionalBytes);
  
  // Ensure user has vector store
  emitter.emit({
    type: 'status',
    message: 'Preparing document storage...',
    progress: 5
  });
  
  const vectorStoreId = await ensureUserVectorStore(userId);
  
  // Process files sequentially with detailed progress and deduplication
  const uploadedFileIds: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseProgress = 10 + (i / files.length) * 60; // 10-70% for file processing
    
    emitter.emit({
      type: 'status',
      message: `Processing ${file.name} (${i + 1}/${files.length})...`,
      progress: baseProgress
    });
    
    try {
      // Check for existing file using hash
      emitter.emit({
        type: 'status',
        message: `Checking for duplicate: ${file.name}...`,
        progress: baseProgress + 2
      });
      
      const fileHash = await calculateFileHash(file);
      const existingFile = await findExistingFile(userId, fileHash);
      
      let fileId: string;
      
      if (existingFile) {
        // File already exists, use existing file ID
        fileId = existingFile.fileId;
        if (process.env.APP_DEBUG === 'true') {
          console.log(`Using existing file: ${file.name} -> ${fileId}`);
        }
        
        emitter.emit({
          type: 'status',
          message: `Found existing file: ${file.name}`,
          progress: baseProgress + 10
        });
      } else {
        // Upload new file with streaming progress
        const uploadResult = await uploadFileWithProgress(file, emitter);
        fileId = uploadResult.fileId;
        
        // Store record for future deduplication
        await storeFileRecord(
          sessionId,
          userId,
          fileId,
          file.name,
          file.size,
          file.type,
          fileHash
        );
        
        if (process.env.APP_DEBUG === 'true') {
          console.log(`Uploaded new file: ${file.name} -> ${fileId} (hash: ${fileHash.substring(0, 8)}...)`);
        }
      }
      
      // Add to vector store with progress (even existing files need to be in vector store)
      await addFileToVectorStoreWithProgress(
        vectorStoreId, 
        fileId, 
        file.name,
        emitter
      );
      
      uploadedFileIds.push(fileId);
      
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      
      // Store failed record if sessionId provided
      if (sessionId) {
        try {
          const fileHash = await calculateFileHash(file);
          await storeFileRecord(
            sessionId,
            userId,
            'failed',
            file.name,
            file.size,
            file.type,
            fileHash,
            'failed'
          );
        } catch (hashError) {
          console.error('Failed to calculate hash for failed file record:', hashError);
        }
      }
      
      throw error;
    }
  }
  
  // Update user storage usage
  emitter.emit({
    type: 'status',
    message: 'Finalizing document processing...',
    progress: 75
  });
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ file_storage_bytes: currentBytes + additionalBytes })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Failed to update user storage usage:', updateError);
  } else {
    if (process.env.APP_DEBUG === 'true') console.log(`Successfully processed ${files.length} files to vector store ${vectorStoreId}`);
  }
  
  return {
    files,
    vectorStoreId,
    uploadedFileIds,
    totalBytes: additionalBytes,
  };
}