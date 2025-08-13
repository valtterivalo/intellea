/**
 * @fileoverview OpenAI Files API service for persistent document storage
 * Exports: uploadFile, listFiles, deleteFile, getFileContent
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Storage limits (per user)
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 512 * 1024 * 1024, // 512 MB per file
  MAX_TOTAL_STORAGE: 10 * 1024 * 1024 * 1024, // 10 GB per user (conservative)
  SUPPORTED_TYPES: [
    'application/pdf',
    'text/plain',
    'text/markdown', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
    'text/javascript',
    'text/typescript',
    'text/x-python',
    'text/html',
    'text/css',
  ] as const,
} as const;

export type SupportedFileType = typeof FILE_LIMITS.SUPPORTED_TYPES[number];

export interface FileUploadResult {
  fileId: string;
  filename: string;
  bytes: number;
  purpose: 'user_data';
  createdAt: number;
}

/**
 * Upload a file to OpenAI Files API
 */
export async function uploadFile(
  file: File,
  userId: string
): Promise<FileUploadResult> {
  // Validate file type
  if (!FILE_LIMITS.SUPPORTED_TYPES.includes(file.type as SupportedFileType)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  
  // Validate file size
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes (max: ${FILE_LIMITS.MAX_FILE_SIZE})`);
  }
  
  if (process.env.APP_DEBUG === 'true') console.log(`Uploading file to OpenAI: ${file.name} (${file.size} bytes)`);
  
  try {
    // Convert File to buffer for OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to OpenAI Files API
    const uploadResponse = await openai.files.create({
      file: new File([buffer], file.name, { type: file.type }),
      purpose: 'user_data', // Flexible file type for document storage
    });
    
    if (process.env.APP_DEBUG === 'true') console.log(`File uploaded successfully: ${uploadResponse.id}`);
    
    return {
      fileId: uploadResponse.id,
      filename: uploadResponse.filename,
      bytes: uploadResponse.bytes,
      purpose: uploadResponse.purpose as 'user_data',
      createdAt: uploadResponse.created_at,
    };
  } catch (error) {
    console.error('Failed to upload file to OpenAI:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List files for a user (filtered by purpose)
 */
export async function listFiles(purpose: 'user_data' = 'user_data'): Promise<OpenAI.Files.FileObject[]> {
  try {
    const response = await openai.files.list({
      purpose,
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to list OpenAI files:', error);
    throw new Error(`List files failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from OpenAI Files API
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    if (process.env.APP_DEBUG === 'true') console.log(`Deleting OpenAI file: ${fileId}`);
    
    const response = await openai.files.del(fileId);
    
    return response.deleted;
  } catch (error) {
    console.error(`Failed to delete OpenAI file ${fileId}:`, error);
    throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file metadata from OpenAI
 */
export async function getFileInfo(fileId: string): Promise<OpenAI.Files.FileObject> {
  try {
    const response = await openai.files.retrieve(fileId);
    return response;
  } catch (error) {
    console.error(`Failed to get OpenAI file info ${fileId}:`, error);
    throw new Error(`Get file info failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file content from OpenAI (returns raw content)
 */
export async function getFileContent(fileId: string): Promise<ArrayBuffer> {
  try {
    const response = await openai.files.content(fileId);
    return response;
  } catch (error) {
    console.error(`Failed to get OpenAI file content ${fileId}:`, error);
    throw new Error(`Get file content failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user is within storage limits
 */
export function validateStorageLimit(currentBytes: number, additionalBytes: number): void {
  const totalBytes = currentBytes + additionalBytes;
  
  if (totalBytes > FILE_LIMITS.MAX_TOTAL_STORAGE) {
    const currentMB = Math.round(currentBytes / (1024 * 1024));
    const additionalMB = Math.round(additionalBytes / (1024 * 1024));
    const maxGB = Math.round(FILE_LIMITS.MAX_TOTAL_STORAGE / (1024 * 1024 * 1024));
    
    throw new Error(`Storage limit exceeded. Current: ${currentMB}MB, Adding: ${additionalMB}MB, Limit: ${maxGB}GB`);
  }
}