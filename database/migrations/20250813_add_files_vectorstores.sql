-- Migration: Add OpenAI Files and Vector Stores support
-- Date: 2025-08-13
-- Description: Add schema for persistent document storage using OpenAI Files API + Vector Stores

-- Add vector store management to users table
ALTER TABLE users 
ADD COLUMN openai_vector_store_id TEXT,
ADD COLUMN file_storage_bytes BIGINT DEFAULT 0,
ADD COLUMN vector_store_created_at TIMESTAMP WITH TIME ZONE;

-- Add document tracking to sessions table  
ALTER TABLE sessions
ADD COLUMN vector_store_id TEXT,
ADD COLUMN has_documents BOOLEAN DEFAULT false;

-- Create session_files table to track individual files per session
CREATE TABLE session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  openai_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  upload_status TEXT DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_session_files_session_id ON session_files(session_id);
CREATE INDEX idx_session_files_user_id ON session_files(user_id);
CREATE INDEX idx_session_files_openai_file_id ON session_files(openai_file_id);
CREATE INDEX idx_users_vector_store_id ON users(openai_vector_store_id) WHERE openai_vector_store_id IS NOT NULL;
CREATE INDEX idx_sessions_vector_store_id ON sessions(vector_store_id) WHERE vector_store_id IS NOT NULL;

-- Add row level security policies
ALTER TABLE session_files ENABLE ROW LEVEL SECURITY;

-- Users can only access their own files
CREATE POLICY "Users can view own session files" ON session_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session files" ON session_files  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session files" ON session_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session files" ON session_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for session_files
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_files_updated_at 
  BEFORE UPDATE ON session_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE session_files IS 'Tracks individual files uploaded to sessions, with OpenAI file IDs for persistent access';
COMMENT ON COLUMN users.openai_vector_store_id IS 'OpenAI Vector Store ID for user document storage';
COMMENT ON COLUMN users.file_storage_bytes IS 'Total bytes used in user file storage';
COMMENT ON COLUMN sessions.vector_store_id IS 'OpenAI Vector Store ID used by this session (usually user vector store)';
COMMENT ON COLUMN sessions.has_documents IS 'Whether this session was created with document uploads';