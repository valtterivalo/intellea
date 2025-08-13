/**
 * @fileoverview API route handlers with AI SDK v5 and OpenAI Files integration.
 * Exports: POST
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateInitialGraph } from '@/lib/agents/graphInitV5';
import { expandGraphFromNode } from '@/lib/agents/graphExpansionV5';
import { getNodeTextForEmbedding, getNodeEmbeddings, calculateNodePositions } from '@/lib/generate-helpers';
import type { IntelleaResponse, ExpansionResponse, NodeObject, LinkObject, KnowledgeCard } from '@/types/intellea';
import { verifyUserAccess } from '@/lib/api-helpers';
import { processAndStoreDocuments } from '@/lib/services/documentManager';
import { createClient } from '@/lib/supabase/server';

// --- Handlers for each strategy ---

async function handleInitialGeneration(prompt: string, userId: string, files?: File[], sessionId?: string): Promise<IntelleaResponse> {
    const hasDocuments = files && files.length > 0;
    let vectorStoreId: string | undefined;
    
    if (hasDocuments && files) {
        if (process.env.APP_DEBUG === 'true') console.log(`Processing ${files.length} documents for initial generation`);
        
        // Use hybrid approach: direct processing + background storage
        const documentResult = await processAndStoreDocuments(files, userId, sessionId);
        vectorStoreId = documentResult.vectorStoreId;
        
        if (process.env.APP_DEBUG === 'true') console.log(`Documents queued for background upload to vector store: ${vectorStoreId}`);
    }
    
    // Generate graph with direct document processing (immediate, rich context)
    const initialResponseRaw = await generateInitialGraph(prompt, hasDocuments, files);
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

    const textsToEmbed = nodes.map(node => getNodeTextForEmbedding(node, cards));
    const embeddings = await getNodeEmbeddings(textsToEmbed);
    const positions = await calculateNodePositions(embeddings, nodes);

    const nodesWithPositions = nodes.map((node, index) => ({
        ...node,
        fx: positions[index]?.fx ?? 0,
        fy: positions[index]?.fy ?? 0,
        fz: positions[index]?.fz ?? 0,
        x: positions[index]?.fx ?? 0,
        y: positions[index]?.fy ?? 0,
        z: positions[index]?.fz ?? 0,
    }));

    return {
        ...initialResponseRaw,
        visualizationData: {
            nodes: nodesWithPositions,
            links: initialResponseRaw.visualizationData.links,
        },
    };
}

async function handleExpansion(
    nodeId: string, 
    nodeLabel: string, 
    currentVisualizationData: { nodes: NodeObject[]; links: LinkObject[] }, 
    currentKnowledgeCards: KnowledgeCard[]
): Promise<ExpansionResponse> {
    const contextGraph = { 
        nodes: currentVisualizationData.nodes, 
        links: currentVisualizationData.links 
    };
    
    const llmExpansionResponse = await expandGraphFromNode(
        { id: nodeId, label: nodeLabel },
        contextGraph
    );

    const combinedNodesRaw = [...currentVisualizationData.nodes, ...llmExpansionResponse.nodes];
    const combinedLinks = [...currentVisualizationData.links, ...llmExpansionResponse.links];
    const combinedKnowledgeCards = [...currentKnowledgeCards, ...llmExpansionResponse.knowledgeCards];

    const textsToEmbed = combinedNodesRaw.map(node => getNodeTextForEmbedding(node, combinedKnowledgeCards));
    const allEmbeddings = await getNodeEmbeddings(textsToEmbed);
    const allPositions = await calculateNodePositions(allEmbeddings, combinedNodesRaw);

    const finalNodes = combinedNodesRaw.map((node, index) => ({
        ...node,
        fx: allPositions[index]?.fx ?? (node as any).fx ?? 0,
        fy: allPositions[index]?.fy ?? (node as any).fy ?? 0,
        fz: allPositions[index]?.fz ?? (node as any).fz ?? 0,
        x: (node as any).x ?? 0,
        y: (node as any).y ?? 0,
        z: (node as any).z ?? 0,
    }));

    return {
        updatedVisualizationData: { nodes: finalNodes, links: combinedLinks },
        newKnowledgeCards: llmExpansionResponse.knowledgeCards,
    };
}

// --- Main Route Handler ---

export async function POST(req: NextRequest) {
  const { error, user } = await verifyUserAccess();
  if (error || !user) {
    return error || NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Handle both FormData (with files) and JSON requests
  const contentType = req.headers.get('content-type') || '';
  let prompt: string;
  let nodeId: string | undefined;
  let nodeLabel: string | undefined;
  let currentVisualizationData: any;
  let currentKnowledgeCards: any;
  let files: File[] = [];

  if (contentType.includes('multipart/form-data')) {
    // Handle FormData with files
    const formData = await req.formData();
    prompt = formData.get('prompt') as string;
    nodeId = formData.get('nodeId') as string | undefined;
    nodeLabel = formData.get('nodeLabel') as string | undefined;
    
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
    ({ prompt, nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards } = body);
    files = body.files || [];
    
    if (process.env.APP_DEBUG === 'true') {
      if (process.env.APP_DEBUG === 'true') console.log('API JSON request received:', {
        prompt: prompt?.substring(0, 50) + '...',
        hasNodeId: !!nodeId,
        fileCount: files.length
      });
    }
  }

  try {
    if (nodeId && nodeLabel && currentVisualizationData && currentKnowledgeCards) {
      // Expansion strategy
      const responsePayload = await handleExpansion(nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards);
      return NextResponse.json(responsePayload);
    } else if (prompt) {
      // Initial generation strategy
      const responsePayload = await handleInitialGeneration(prompt, user.id, files);
      return NextResponse.json({ output: responsePayload });
    } else {
      return NextResponse.json({ error: 'Request must include either a prompt or node details for expansion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in /api/generate route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 