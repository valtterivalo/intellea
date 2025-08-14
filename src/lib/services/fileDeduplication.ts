/**
 * @fileoverview File deduplication service to avoid re-uploading same files
 * Exports: calculateFileHash, findExistingFile, storeFileRecord
 */

import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * Calculate SHA-256 hash of file content for deduplication
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = createHash('sha256').update(buffer).digest('hex');
  return hash;
}

/**
 * Check if file already exists for user based on hash
 */
export async function findExistingFile(
  userId: string, 
  fileHash: string
): Promise<{ fileId: string; filename: string } | null> {
  const supabase = await createClient();
  
  const { data: existingFile, error } = await supabase
    .from('session_files')
    .select('openai_file_id, filename')
    .eq('user_id', userId)
    .eq('file_hash', fileHash)
    .eq('upload_status', 'completed')
    .not('openai_file_id', 'eq', 'failed')
    .limit(1)
    .single();
    
  if (error || !existingFile) {
    return null;
  }
  
  return {
    fileId: existingFile.openai_file_id,
    filename: existingFile.filename
  };
}

/**
 * Store file record in database with hash for future deduplication
 */
export async function storeFileRecord(
  sessionId: string | undefined,
  userId: string,
  fileId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  fileHash: string,
  status: 'completed' | 'failed' = 'completed'
): Promise<void> {
  if (!sessionId) return;
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('session_files')
    .insert({
      session_id: sessionId,
      user_id: userId,
      openai_file_id: fileId,
      filename,
      file_size: fileSize,
      mime_type: mimeType,
      file_hash: fileHash,
      upload_status: status,
    });
    
  if (error) {
    console.error(`Failed to store file record: ${error.message}`);
  }
}