-- Create expanded_concepts table
CREATE TABLE IF NOT EXISTS public.expanded_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_concepts JSONB NOT NULL,
  graph_hash TEXT NOT NULL, -- SHA-256 hash of the graph structure (64 characters)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, node_id, graph_hash)
);

COMMENT ON COLUMN public.expanded_concepts.graph_hash IS 'SHA-256 hash of the graph structure for versioning. Previously this was the full node/link list but has been changed to a cryptographic hash to reduce URL length in queries.';

-- Add indexes
CREATE INDEX IF NOT EXISTS expanded_concepts_session_id_idx ON public.expanded_concepts(session_id);
CREATE INDEX IF NOT EXISTS expanded_concepts_node_id_idx ON public.expanded_concepts(node_id);
CREATE INDEX IF NOT EXISTS expanded_concepts_graph_hash_idx ON public.expanded_concepts(graph_hash);

-- Add RLS policies
ALTER TABLE public.expanded_concepts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting - users can only select their own expanded concepts (via sessions)
CREATE POLICY select_expanded_concepts
  ON public.expanded_concepts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for inserting - users can only insert expanded concepts for their own sessions
CREATE POLICY insert_expanded_concepts
  ON public.expanded_concepts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for updating - users can only update their own expanded concepts
CREATE POLICY update_expanded_concepts
  ON public.expanded_concepts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Policy for deleting - users can only delete their own expanded concepts
CREATE POLICY delete_expanded_concepts
  ON public.expanded_concepts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = expanded_concepts.session_id
      AND sessions.user_id = auth.uid()
    )
  ); 