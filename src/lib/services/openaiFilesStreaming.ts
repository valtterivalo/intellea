/**
 * @fileoverview Streaming-aware OpenAI Files API service with progress tracking
 * Exports: uploadFileWithProgress
 */

import { FILE_LIMITS, type SupportedFileType } from '@/lib/constants/fileConstants';
import type { StreamEmitter } from '@/types/streaming';
import { getOpenAIClient } from '@/lib/openaiClient';

export interface FileUploadResult {
  fileId: string;
  filename: string;
  bytes: number;
  purpose: 'user_data';
  createdAt: number;
}

/**
 * Upload a file to OpenAI Files API with streaming progress updates
 */
export async function uploadFileWithProgress(
  file: File,
  emitter: StreamEmitter
): Promise<FileUploadResult> {
  // Validate file type
  if (!FILE_LIMITS.SUPPORTED_TYPES.includes(file.type as SupportedFileType)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  
  // Validate file size
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max: ${FILE_LIMITS.MAX_FILE_SIZE})`);
  }
  
  emitter.emit({
    type: 'file-upload-started',
    fileName: file.name,
    fileSize: file.size
  });
  
  if (process.env.APP_DEBUG === 'true') console.log(`Uploading file to OpenAI: ${file.name} (${file.size} bytes)`);
  
  try {
    const startTime = Date.now();
    
    // Stage 1: Converting to buffer
    emitter.emit({
      type: 'file-upload-progress',
      fileName: file.name,
      stage: 'converting'
    });
    
    const convertStart = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const convertTime = Date.now() - convertStart;
    
    if (process.env.APP_DEBUG === 'true') console.log(`File conversion took ${convertTime}ms for ${file.name}`);
    
    // Stage 2: Uploading to OpenAI
    emitter.emit({
      type: 'file-upload-progress',
      fileName: file.name,
      stage: 'uploading'
    });
    
    const uploadStart = Date.now();
    const openai = getOpenAIClient();
    const uploadResponse = await openai.files.create({
      file: new File([buffer], file.name, { type: file.type }),
      purpose: 'user_data',
    });
    const uploadTime = Date.now() - uploadStart;
    
    if (process.env.APP_DEBUG === 'true') console.log(`OpenAI file upload took ${uploadTime}ms for ${file.name}`);
    
    // Stage 3: Processing by OpenAI
    emitter.emit({
      type: 'file-upload-progress',
      fileName: file.name,
      stage: 'processing'
    });
    
    const totalTime = Date.now() - startTime;
    if (process.env.APP_DEBUG === 'true') console.log(`Total file processing took ${totalTime}ms for ${file.name}`);
    
    emitter.emit({
      type: 'file-upload-complete',
      fileName: file.name,
      fileId: uploadResponse.id
    });
    
    if (process.env.APP_DEBUG === 'true') console.log(`File uploaded successfully: ${uploadResponse.id}`);
    
    return {
      fileId: uploadResponse.id,
      filename: file.name,
      bytes: uploadResponse.bytes || file.size,
      purpose: 'user_data',
      createdAt: uploadResponse.created_at,
    };
  } catch (error) {
    console.error(`Error uploading file ${file.name}:`, error);
    emitter.emit({
      type: 'error',
      error: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stage: 'file-upload'
    });
    throw error;
  }
}
