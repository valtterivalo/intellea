/**
 * @fileoverview File upload constants and types
 * Exports: FILE_LIMITS, SupportedFileType
 */

// Storage limits (per user) - constrained by Vercel Hobby tier
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4 MB per file (Vercel Hobby limit is 4.5MB, leaving buffer)
  MAX_TOTAL_STORAGE: 100 * 1024 * 1024, // 100 MB per user (reasonable for hobby tier)
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