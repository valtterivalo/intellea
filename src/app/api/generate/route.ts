/**
 * @fileoverview API route to generate or expand graphs.
 * Exports POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { GraphInitAgent } from '@/lib/agents/graphInit';
import { GraphExpansionAgent } from '@/lib/agents/graphExpansion';
import { getNodeTextForEmbedding, getNodeEmbeddings, calculateNodePositions } from '@/lib/generate-helpers';
import type { IntelleaResponse, ExpansionResponse, NodeObject, LinkObject, KnowledgeCard } from '@/types/intellea';
import { verifyUserAccess } from '@/lib/api-helpers';

// --- Handlers for each strategy ---

async function handleInitialGeneration(prompt: string): Promise<IntelleaResponse> {
    const result = await run(GraphInitAgent, prompt);
    if (!result.finalOutput) {
        throw new Error("Agent did not produce a final output for initial generation.");
    }
    
    const initialResponseRaw = result.finalOutput as IntelleaResponse;
    const nodes = initialResponseRaw.visualizationData.nodes;
    const cards = initialResponseRaw.knowledgeCards || [];

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
    currentVisualizationData: unknown, 
    currentKnowledgeCards: unknown
): Promise<ExpansionResponse> {
    const contextGraph = { 
        nodes: (currentVisualizationData as { nodes: unknown }).nodes, 
        links: (currentVisualizationData as { links: unknown }).links 
    };
    const agentInput = `Expand the graph from the clicked node:\nNode ID: ${nodeId}\nNode Label: ${nodeLabel}\n\nCurrent Graph Structure (for context only, do not repeat):\n${JSON.stringify(contextGraph, null, 2)}`;
    
    const result = await run(GraphExpansionAgent, agentInput);
    if (!result.finalOutput) {
        throw new Error("Agent did not produce a final output for expansion.");
    }

    const llmExpansionResponse = result.finalOutput as { nodes: NodeObject[], links: LinkObject[], knowledgeCards: KnowledgeCard[] };

    const combinedNodesRaw = [...(currentVisualizationData as { nodes: NodeObject[] }).nodes, ...llmExpansionResponse.nodes];
    const combinedLinks = [...(currentVisualizationData as { links: LinkObject[] }).links, ...llmExpansionResponse.links];
    const combinedKnowledgeCards = [...(currentKnowledgeCards as KnowledgeCard[]), ...llmExpansionResponse.knowledgeCards];

    const textsToEmbed = combinedNodesRaw.map(node => getNodeTextForEmbedding(node, combinedKnowledgeCards));
    const allEmbeddings = await getNodeEmbeddings(textsToEmbed);
    const allPositions = await calculateNodePositions(allEmbeddings, combinedNodesRaw);

    const finalNodes = combinedNodesRaw.map((node, index) => ({
        ...node,
        fx: allPositions[index]?.fx ?? node.fx ?? 0,
        fy: allPositions[index]?.fy ?? node.fy ?? 0,
        fz: allPositions[index]?.fz ?? node.fz ?? 0,
        x: node.x,
        y: node.y,
        z: node.z,
    }));

    return {
        updatedVisualizationData: { nodes: finalNodes, links: combinedLinks },
        newKnowledgeCards: llmExpansionResponse.knowledgeCards,
    };
}

// --- Main Route Handler ---

export async function POST(req: NextRequest) {
  const { error } = await verifyUserAccess();
  if (error) {
    return error;
  }

  const body = await req.json();
  const { prompt, nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards } = body;

  try {
    if (nodeId && nodeLabel && currentVisualizationData && currentKnowledgeCards) {
      // Expansion strategy
      const responsePayload = await handleExpansion(nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards);
      return NextResponse.json(responsePayload);
    } else if (prompt) {
      // Initial generation strategy
      const responsePayload = await handleInitialGeneration(prompt);
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
