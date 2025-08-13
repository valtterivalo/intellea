-- Migration: Add file deduplication support
-- Date: 2025-08-13
-- Description: Add file hash tracking to prevent duplicate uploads

-- Add file hash column for deduplication
ALTER TABLE session_files 
ADD COLUMN file_hash TEXT;

-- Create index for fast hash lookups
CREATE INDEX idx_session_files_file_hash ON session_files(file_hash) WHERE file_hash IS NOT NULL;

-- Create unique constraint on user_id + file_hash to prevent duplicates
-- Note: We allow the same file across different users
CREATE UNIQUE INDEX idx_session_files_user_hash_unique ON session_files(user_id, file_hash) WHERE file_hash IS NOT NULL;

COMMENT ON COLUMN session_files.file_hash IS 'SHA-256 hash of file content for deduplication';