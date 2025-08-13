/**
 * @fileoverview Document management service - handles both direct processing and persistent storage
 * Exports: processAndStoreDocuments, ensureUserVectorStore, getSessionVectorStore
 */

import { createClient } from '@/lib/supabase/server';
import { uploadFile, validateStorageLimit } from './openaiFiles';
import { createVectorStore, addFileToVectorStore, getVectorStore } from './openaiVectorStores';

export interface DocumentProcessingResult {
  files: File[]; // Original files for direct processing
  vectorStoreId: string; // Vector store ID for future file_search
  uploadedFileIds: string[]; // OpenAI file IDs
  totalBytes: number; // Total bytes uploaded
}

/**
 * Ensure user has a vector store, create one if needed
 */
export async function ensureUserVectorStore(userId: string): Promise<string> {
  const supabase = await createClient();
  
  // Check if user already has a vector store
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('openai_vector_store_id, file_storage_bytes')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Failed to get user data: ${userError.message}`);
  }
  
  if (user.openai_vector_store_id) {
    // Verify vector store still exists
    try {
      await getVectorStore(user.openai_vector_store_id);
      if (process.env.APP_DEBUG === 'true') console.log(`Using existing vector store: ${user.openai_vector_store_id}`);
      return user.openai_vector_store_id;
    } catch (error) {
      console.warn(`Vector store ${user.openai_vector_store_id} not found, creating new one`);
    }
  }
  
  // Create new vector store
  if (process.env.APP_DEBUG === 'true') console.log(`Creating new vector store for user: ${userId}`);
  const vectorStore = await createVectorStore(userId);
  
  // Update user record
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      openai_vector_store_id: vectorStore.id,
      vector_store_created_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (updateError) {
    throw new Error(`Failed to update user vector store: ${updateError.message}`);
  }
  
  if (process.env.APP_DEBUG === 'true') console.log(`Vector store created and saved: ${vectorStore.id}`);
  return vectorStore.id;
}

/**
 * Process documents for session creation - hybrid approach
 * Returns both files for direct processing AND stores them persistently
 */
export async function processAndStoreDocuments(
  files: File[],
  userId: string,
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
  const vectorStoreId = await ensureUserVectorStore(userId);
  
  // Upload files to OpenAI in parallel (background processing)
  const uploadPromises = files.map(async (file) => {
    if (process.env.APP_DEBUG === 'true') console.log(`Uploading file to OpenAI: ${file.name}`);
    
    try {
      // Upload to OpenAI Files API
      const uploadResult = await uploadFile(file, userId);
      
      // Add to vector store
      await addFileToVectorStore(vectorStoreId, uploadResult.fileId, file.name);
      
      // Store in database if sessionId provided
      if (sessionId) {
        const sessionSupabase = await createClient();
        const { error: fileError } = await sessionSupabase
          .from('session_files')
          .insert({
            session_id: sessionId,
            user_id: userId,
            openai_file_id: uploadResult.fileId,
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            upload_status: 'completed',
          });
          
        if (fileError) {
          console.error(`Failed to store file record: ${fileError.message}`);
          // Don't throw - the file is uploaded, just database record failed
        }
      }
      
      return uploadResult.fileId;
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      
      // Store failed record if sessionId provided
      if (sessionId) {
        const failedSupabase = await createClient();
        await failedSupabase
          .from('session_files')
          .insert({
            session_id: sessionId,
            user_id: userId,
            openai_file_id: 'failed',
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            upload_status: 'failed',
          });
      }
      
      throw error;
    }
  });
  
  // Don't wait for uploads to complete - return files for immediate processing
  // Background uploads will complete asynchronously
  const uploadedFileIds: string[] = [];
  
  // Start uploads in background
  Promise.all(uploadPromises)
    .then((fileIds) => {
      uploadedFileIds.push(...fileIds);
      
      // Update user storage usage
      return supabase
        .from('profiles')
        .update({ file_storage_bytes: currentBytes + additionalBytes })
        .eq('id', userId);
    })
    .then(({ error }) => {
      if (error) {
        console.error('Failed to update user storage usage:', error);
      } else {
        if (process.env.APP_DEBUG === 'true') console.log(`Successfully uploaded ${files.length} files to vector store ${vectorStoreId}`);
      }
    })
    .catch((error) => {
      console.error('Background file upload failed:', error);
    });
  
  return {
    files, // Return original files for immediate direct processing
    vectorStoreId,
    uploadedFileIds, // Will be empty initially, filled by background process
    totalBytes: additionalBytes,
  };
}

/**
 * Get vector store ID for a session (for expansions)
 */
export async function getSessionVectorStore(sessionId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: session, error } = await supabase
    .from('sessions')
    .select('vector_store_id, user_id')
    .eq('id', sessionId)
    .single();
    
  if (error || !session) {
    console.error(`Failed to get session vector store: ${error?.message}`);
    return null;
  }
  
  if (session.vector_store_id) {
    return session.vector_store_id;
  }
  
  // Fallback: get user's main vector store
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('openai_vector_store_id')
    .eq('id', session.user_id)
    .single();
    
  if (userError || !user?.openai_vector_store_id) {
    console.error(`Failed to get user vector store: ${userError?.message}`);
    return null;
  }
  
  return user.openai_vector_store_id;
}