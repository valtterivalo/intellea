/**
 * @fileoverview Streaming API route for real-time graph generation progress.
 * Exports: POST
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateInitialGraphStreamingOptimized } from '@/lib/agents/graphInitStreamingOptimized';
import { generateInitialGraphWithRawOpenAI } from '@/lib/agents/graphInitRawOpenAI';
import { getNodeTextForEmbedding } from '@/lib/generate-helpers';
import { getNodeEmbeddingsStreaming, calculateNodePositionsStreaming } from '@/lib/generate-helpers-streaming';
import { verifyUserAccessWithDemo } from '@/lib/api-helpers';
import { processAndStoreDocumentsWithProgress } from '@/lib/services/documentManagerStreaming';
import { createClient } from '@/lib/supabase/server';
import { createStreamEmitter } from '@/types/streaming';
import { StatusMessages } from '@/types/streaming';
import type { IntelleaResponse, NodeObject, LinkObject, KnowledgeCard } from '@/types/intellea';

async function handleInitialGenerationStreaming(
  prompt: string,
  userId: string,
  files?: File[],
  sessionId?: string,
  isDemo = false
): Promise<Response> {
  const { emitter, stream } = createStreamEmitter();
  
  // Start the async generation process
  (async () => {
    try {
      const hasDocuments = files && files.length > 0;
      let vectorStoreId: string | undefined;
      
      let uploadedFileIds: string[] = [];
      
      if (hasDocuments && files && !isDemo) {
        if (process.env.APP_DEBUG === 'true') console.log(`Processing ${files.length} documents for initial generation`);
        
        // Use streaming document processing with detailed progress
        const documentResult = await processAndStoreDocumentsWithProgress(files, userId, emitter, sessionId);
        vectorStoreId = documentResult.vectorStoreId;
        uploadedFileIds = documentResult.uploadedFileIds;
        
        if (process.env.APP_DEBUG === 'true') console.log(`Documents processed and uploaded. File IDs: ${uploadedFileIds.join(', ')}`);
      }
      
      // Generate graph using appropriate method based on file presence
      let initialResponseRaw: IntelleaResponse;
      
      if (hasDocuments && uploadedFileIds.length > 0 && !isDemo) {
        // Use raw OpenAI API for proper file handling with uploaded file IDs
        initialResponseRaw = await generateInitialGraphWithRawOpenAI(
          prompt,
          emitter,
          uploadedFileIds,
          isDemo
        );
      } else {
        // Use AI SDK for text-only generation (faster)
        initialResponseRaw = await generateInitialGraphStreamingOptimized(
          prompt,
          emitter,
          false, // no documents for AI SDK path
          [],   // no file IDs
          isDemo
        ) as IntelleaResponse;
      }
      
      const nodes = initialResponseRaw.visualizationData.nodes;
      const cards = initialResponseRaw.knowledgeCards || [];

      // Update session with vector store info if documents were processed
      if (hasDocuments && vectorStoreId && sessionId) {
        const supabase = await createClient();
        const { error } = await supabase
          .from('sessions')
          .update({ 
            vector_store_id: vectorStoreId,
            has_documents: true 
          })
          .eq('id', sessionId);
          
        if (error) {
          console.error('Failed to update session with vector store:', error);
        }
      }

      // Embeddings stage
      emitter.emit({
        type: 'embeddings-started',
        totalNodes: nodes.length
      });

      emitter.emit({
        type: 'status',
        message: StatusMessages.CALCULATING_EMBEDDINGS,
        progress: 70
      });

      const textsToEmbed = nodes.map(node => getNodeTextForEmbedding(node, cards));
      const embeddings = await getNodeEmbeddingsStreaming(textsToEmbed, emitter);

      // Positioning stage
      emitter.emit({
        type: 'status',
        message: StatusMessages.POSITIONING_NODES,
        progress: 85
      });

      const positions = await calculateNodePositionsStreaming(embeddings, nodes, emitter);

      emitter.emit({
        type: 'status',
        message: StatusMessages.CENTERING_GRAPH,
        progress: 95
      });

      const nodesWithPositions = nodes.map((node: NodeObject, index: number) => ({
        ...node,
        fx: positions[index]?.fx ?? 0,
        fy: positions[index]?.fy ?? 0,
        fz: positions[index]?.fz ?? 0,
        x: positions[index]?.fx ?? 0,
        y: positions[index]?.fy ?? 0,
        z: positions[index]?.fz ?? 0,
      }));

      const finalResponse: IntelleaResponse = {
        sessionTitle: initialResponseRaw.sessionTitle,
        explanationMarkdown: initialResponseRaw.explanationMarkdown,
        knowledgeCards: initialResponseRaw.knowledgeCards,
        visualizationData: {
          nodes: nodesWithPositions,
          links: initialResponseRaw.visualizationData.links,
        },
      };

      emitter.emit({
        type: 'status',
        message: StatusMessages.COMPLETE,
        progress: 100
      });

      // Send final complete data
      emitter.emit({
        type: 'complete',
        data: finalResponse
      });

    } catch (error) {
      console.error('Error in streaming generation:', error);
      emitter.emit({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      emitter.close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  // Handle both FormData (with files) and JSON requests
  const contentType = req.headers.get('content-type') || '';
  let prompt: string;
  let nodeId: string | undefined;
  let nodeLabel: string | undefined;
  let currentVisualizationData: { nodes: NodeObject[]; links: LinkObject[] } | undefined;
  let currentKnowledgeCards: KnowledgeCard[] | undefined;
  let files: File[] = [];
  let isDemo = false;

  if (contentType.includes('multipart/form-data')) {
    // Handle FormData with files
    const formData = await req.formData();
    prompt = formData.get('prompt') as string;
    nodeId = formData.get('nodeId') as string | undefined;
    nodeLabel = formData.get('nodeLabel') as string | undefined;
    isDemo = formData.get('isDemo') === 'true';
    
    // Extract files
    const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'));
    files = fileEntries.map(([, file]) => file as File);
    
    if (process.env.APP_DEBUG === 'true') {
      if (process.env.APP_DEBUG === 'true') console.log('API FormData request received:', {
        prompt: prompt?.substring(0, 50) + '...',
        hasNodeId: !!nodeId,
        fileCount: files.length,
        fileDetails: files.map(f => ({
          filename: f.name,
          mediaType: f.type,
          size: f.size
        }))
      });
    }
  } else {
    // Handle JSON requests (no files or data URLs)
    const body = await req.json();
    ({ prompt, nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards, isDemo } = body);
    files = body.files || [];
    isDemo = isDemo === true;
    
    if (process.env.APP_DEBUG === 'true') {
      if (process.env.APP_DEBUG === 'true') console.log('API JSON request received:', {
        prompt: prompt?.substring(0, 50) + '...',
        hasNodeId: !!nodeId,
        fileCount: files.length
      });
    }
  }

  // Verify user access with demo support
  const { error, user } = await verifyUserAccessWithDemo(isDemo, req);
  if (error) {
    return error;
  }

  try {
    if (nodeId && nodeLabel && currentVisualizationData && currentKnowledgeCards) {
      // Expansion strategy - not yet implemented for streaming
      // For now, return error suggesting to use non-streaming endpoint
      return NextResponse.json({ error: 'Graph expansion streaming not yet implemented. Please use /api/generate for expansions.' }, { status: 400 });
    } else if (prompt) {
      // Initial generation strategy with streaming
      return await handleInitialGenerationStreaming(prompt, user?.id || 'demo-user', files, undefined, isDemo);
    } else {
      return NextResponse.json({ error: 'Request must include either a prompt or node details for expansion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in /api/generate/stream route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}