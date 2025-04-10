import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UMAP } from 'umap-js'; // Import UMAP
import type { Database } from '@/lib/database.types';

// Define the expected structure for nodes and links in the graph
interface GraphNode {
  id: string; // Unique identifier for the node
  label: string; // Text label displayed for the node
  isRoot?: boolean; // Flag to identify the central root node
  fx?: number; // CHANGED: Use fx for fixed X coordinate
  fy?: number; // CHANGED: Use fy for fixed Y coordinate
  fz?: number; // CHANGED: Use fz for fixed Z coordinate
  // Keep x, y, z for potential dynamic simulation use if needed
  x?: number;
  y?: number;
  z?: number;
  // Add other potential node properties if needed later (e.g., color, size)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

interface GraphLink {
  source: string; // ID of the source node
  target: string; // ID of the target node
  // Add other potential link properties if needed later (e.g., label, curvature)
  [key: string]: any; // Allow arbitrary properties for flexibility
}

// Define structure for Knowledge Cards
interface KnowledgeCard {
  nodeId: string; // Corresponds to a node ID in visualizationData.
  title: string; // Concept title (often matches node label)
  description: string; // Concise explanation of the concept (2-4 sentences)
}

// Define structure for visualization data (used in both initial and expansion)
// Note: GraphNode now includes optional x, y, z
interface VisualizationData {
    nodes: GraphNode[];
    links: GraphLink[];
}

// Define the structure returned by the LLM for expansion requests
interface LLMExpansionResponse {
    nodes: GraphNode[]; // New nodes only
    links: GraphLink[]; // New links only (can connect to existing nodes)
    knowledgeCards: KnowledgeCard[]; // New cards only (one per new node)
}

// Define the expected structure of the *complete* initial response (sent to client)
export interface IntelleaResponse {
  explanationMarkdown: string | null;
  knowledgeCards: KnowledgeCard[] | null; // All cards for the initial graph
  visualizationData: VisualizationData; // Includes nodes with calculated x, y, z
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Define the structure of the *complete* expansion response (sent to client)
// Contains the full updated graph and only the newly added cards
export interface ExpansionResponse {
    updatedVisualizationData: VisualizationData; // All nodes (with updated x, y, z) and all links
    newKnowledgeCards: KnowledgeCard[]; // Only the cards corresponding to the newly added nodes
}


// Ensure API keys are available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Helper Functions ---

// Get text content for embedding (prioritize description, fallback to title/label)
function getNodeTextForEmbedding(node: GraphNode, cards: KnowledgeCard[]): string {
    const card = cards.find(c => c.nodeId === node.id);
    return card?.description || node.label || node.id; // Use description if available, else label, else ID
}

// Get embeddings from OpenAI
async function getNodeEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    try {
        console.log(`Requesting embeddings for ${texts.length} texts...`);
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small", // Efficient embedding model
            input: texts,
        });
        console.log(`Embeddings received.`);
        return response.data.map(emb => emb.embedding);
    } catch (error) {
        console.error("Error getting embeddings:", error);
        throw new Error("Failed to generate node embeddings.");
    }
}

// Calculate 3D positions using UMAP and center the root node
async function calculateNodePositions(
    embeddings: number[][],
    nodesForPositioning: GraphNode[] // Pass the raw nodes to find the root
): Promise<Array<{ fx: number; fy: number; fz: number }>> { 
    if (!embeddings || embeddings.length === 0 || embeddings.length !== nodesForPositioning.length) { 
        console.warn("Embeddings or nodes mismatch, returning empty positions.");
        return []; 
    }

    let rawPositions: Array<{ fx: number; fy: number; fz: number }>;

    // Handle edge case: only 1 node (must be root)
    if (embeddings.length === 1) {
        rawPositions = [{ fx: 0, fy: 0, fz: 0 }];
    } 
    // Handle edge case: 2 nodes (root and one other)
    else if (embeddings.length === 2) {
        const rootIndex = nodesForPositioning.findIndex(n => n.isRoot);
        const otherIndex = 1 - rootIndex;
        rawPositions = Array(2).fill({ fx: 0, fy: 0, fz: 0 });
        // Assign non-zero position to the non-root node
        if (rootIndex !== -1 && otherIndex !== -1) {
             rawPositions[rootIndex] = { fx: 0, fy: 0, fz: 0 };
             rawPositions[otherIndex] = { fx: 50, fy: 0, fz: 0 }; // Simple offset
        } else {
             // Fallback if root not found somehow
             rawPositions[0] = { fx: 0, fy: 0, fz: 0 };
             rawPositions[1] = { fx: 50, fy: 0, fz: 0 };
        }
    } 
    // Normal case: 3+ nodes
    else {
        try {
            console.log(`Calculating UMAP for ${embeddings.length} embeddings...`);
            const umap = new UMAP({
                nComponents: 3,
                nNeighbors: Math.min(20, embeddings.length - 1),
                minDist: 0.05,
                spread: 1.2,
            });
            const umapOutput = await umap.fitAsync(embeddings);
            console.log("UMAP calculation complete.");

            const scaleFactor = 150;
            rawPositions = umapOutput.map(pos => ({
                fx: pos[0] * scaleFactor,
                fy: pos[1] * scaleFactor,
                fz: pos[2] * scaleFactor,
            }));
        } catch (error) {
            console.error("Error calculating UMAP positions:", error);
            // Fallback: return origin for all on error
            return nodesForPositioning.map(() => ({ fx: 0, fy: 0, fz: 0 }));
        }
    }

    // --- Center the Root Node --- 
    const rootIndex = nodesForPositioning.findIndex(n => n.isRoot === true);
    if (rootIndex === -1 || !rawPositions[rootIndex]) {
        console.warn("Root node not found or missing position after UMAP. Skipping centering.");
        return rawPositions; // Return uncentered positions if root is missing
    }

    const rootPosition = rawPositions[rootIndex];
    const offsetX = rootPosition.fx;
    const offsetY = rootPosition.fy;
    const offsetZ = rootPosition.fz;

    console.log(`Centering graph around root node. Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}, ${offsetZ.toFixed(2)})`);

    // Apply the offset to all nodes
    const centeredPositions = rawPositions.map(pos => ({
        fx: pos.fx - offsetX,
        fy: pos.fy - offsetY,
        fz: pos.fz - offsetZ,
    }));

    return centeredPositions;
}


// --- System Prompts ---

// System prompt for INITIAL 3D graph generation (Unchanged for now)
const INITIAL_SYSTEM_PROMPT = `You are Intellea, an expert AI assistant generating structured learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

**Instructions:**
1.  Identify the core subject/topic from the user's prompt.
2.  Create a central "root" node representing this core topic. This node object MUST have the property \`"isRoot": true\`. All other nodes MUST NOT have this property or have it set to \`false\`.
3.  Generate 3-6 additional nodes representing key sub-concepts or initial aspects related to the root topic.
4.  Structure the \`visualizationData.links\` so that ALL generated sub-concept nodes link FROM the central root node (e.g., \`{ source: <root_node_id>, target: <sub_concept_node_id> }\`). Do not link sub-concepts to each other in this initial graph.
5.  Generate ONE \`knowledgeCard\` for EACH generated node (including the root node).
6.  Ensure every \`knowledgeCard.nodeId\` EXACTLY matches the \`id\` of its corresponding node.
7.  Provide a single-paragraph \`explanationMarkdown\` summarizing the overall topic.

**JSON Structure:**
{
  "explanationMarkdown": "string", // MANDATORY: 1 paragraph summary (3-4 sentences max). NO definitions.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ], // MANDATORY: One card per node. 'nodeId' MUST match node 'id'. 'title' = node 'label'. 'description' = 2-4 sentences.
  "visualizationData": { // MANDATORY: Data for the graph.
    "nodes": [ { "id": "string", "label": "string", "isRoot": boolean } ], // List of nodes. Exactly ONE node MUST have "isRoot": true. Others MUST have "isRoot": false or omit it.
    "links": [ { "source": "string", "target": "string" } ] // Links list. ALL links MUST originate from the root node (\`source\` = root node ID).
   },
  "quiz": { /* ... (optional quiz structure) ... */ } // Optional.
}

**Constraint Checklist & Summary:**
*   Single JSON response.
*   Identify core topic -> Create root node with \`"isRoot": true\`.
*   Create 3-6 sub-concept nodes (no \`isRoot\` property or \`false\`).
*   Link ALL sub-concepts FROM the root node.
*   Generate ONE knowledge card per node (root + sub-concepts), linked via \`nodeId\` == \`id\`.
*   Provide brief \`explanationMarkdown\`.
*   Ensure all IDs match and constraints are met.
`;

// System prompt for GRAPH EXPANSION (UPDATED)
const EXPANSION_SYSTEM_PROMPT = `You are Intellea, an AI assistant expanding an existing knowledge graph. Given a clicked node (ID and Label) and the current graph structure (nodes and links), generate **ONLY new, relevant nodes, links, and corresponding knowledge cards** to expand the graph from the clicked node. Respond ONLY with a single, valid JSON object matching this structure:

{
  "nodes": [ { "id": "string", "label": "string" } ], // **NEW nodes ONLY**. 'id' MUST be unique within the ENTIRE graph (existing + new). 'label' is display text. Max 2-3 new nodes.
  "links": [ { "source": "string", "target": "string" } ], // **NEW links ONLY**. Include links connecting the clicked node to new nodes AND **potentially links connecting NEW nodes to OTHER EXISTING nodes** if a strong semantic relationship exists. 'source' and 'target' MUST match node IDs (either existing or new). Max 3-5 new links.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ] // **NEW cards ONLY**. Generate ONE card for EACH new node. 'nodeId' MUST match the new node's 'id'. 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. Only include nodes/links/cards that are **directly relevant** and **add new information** based on the clicked node.
3. **Identify potential cross-connections:** Evaluate if any NEWLY generated node has a strong semantic relationship with any OTHER EXISTING node in the provided graph context (besides the clicked node). If yes, add a link in the "links" array connecting the new node to that existing node. Prioritize meaningful connections.
4. **CRITICAL: Generate EXACTLY ONE KnowledgeCard for EACH new node generated in the 'nodes' array.** The number of objects in 'knowledgeCards' MUST equal the number of objects in 'nodes'.
5. **Each generated KnowledgeCard object MUST have a 'nodeId' property that EXACTLY matches the 'id' of its corresponding node in the NEW 'nodes' list.** Card 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
6. **DO NOT** include the clicked node itself or any other existing nodes/links/cards in the response.
7. Ensure all new node IDs are unique strings across the entire graph context (existing + new).
8. Ensure all link source/target IDs exist in either the provided existing graph or the new nodes list.
9. Max 2-3 new nodes, 3-5 new links (including primary and cross-links), and their corresponding cards.
10. If no relevant expansion is possible, return { "nodes": [], "links": [], "knowledgeCards": [] }.
`;

// --- API Route Handler ---

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User & Check Subscription
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.subscription_status !== 'active') {
      console.warn(`User ${user.id} attempted access without active subscription. Status: ${profile?.subscription_status ?? 'not found'}`);
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 }); // 402 Payment Required
    }

    // 2. Parse Request Body
    const body = await req.json();
    // ADDED: Expect full current graph data for expansion, including cards
    const { prompt, nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards } = body;

    let systemPrompt: string;
    let userPromptContent: string;
    let isExpansion = false;

    // --- Determine Request Type (Initial or Expansion) ---
    if (nodeId && nodeLabel && currentVisualizationData && currentKnowledgeCards) {
      // --- Expansion Request ---
      isExpansion = true;
      systemPrompt = EXPANSION_SYSTEM_PROMPT;
      // Provide only nodes and links context to the LLM for expansion prompt
      const contextGraph = { nodes: currentVisualizationData.nodes, links: currentVisualizationData.links };
      userPromptContent = `Expand the graph from the clicked node:\nNode ID: ${nodeId}\nNode Label: ${nodeLabel}\n\nCurrent Graph Structure (for context only, do not repeat):\n${JSON.stringify(contextGraph, null, 2)}`;
      console.log(`Calling OpenAI for EXPANSION on node: "${nodeLabel}" (ID: ${nodeId})`);

    } else if (prompt) {
      // --- Initial Request ---
      isExpansion = false;
      systemPrompt = INITIAL_SYSTEM_PROMPT;
      userPromptContent = prompt;
      console.log(`Calling OpenAI for INITIAL prompt: "${prompt.substring(0, 80)}..."`);

    } else {
      return NextResponse.json({ error: 'Request must include either a prompt or node details (nodeId, nodeLabel, currentVisualizationData, currentKnowledgeCards) for expansion' }, { status: 400 });
    }

    // 3. Call OpenAI LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the faster, cheaper model first
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptContent },
      ],
      response_format: { type: 'json_object' },
      temperature: isExpansion ? 0.4 : 0.5, // Adjusted slightly
    });

    const rawResult = completion.choices[0]?.message?.content;

    if (!rawResult) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    console.log(`OpenAI response received for ${isExpansion ? 'EXPANSION' : 'INITIAL'} request.`);

    // 4. Parse, Validate, and Process LLM Response
    try {
        const llmJson = JSON.parse(rawResult);

        if (isExpansion) {
            // --- Process Expansion Response ---
            const llmExpansionResponse: LLMExpansionResponse = llmJson;

            // Validate expansion structure
            if (!llmExpansionResponse.nodes || !llmExpansionResponse.links || !llmExpansionResponse.knowledgeCards) {
                throw new Error("Missing required fields from LLM expansion: nodes, links, or knowledgeCards");
            }
            if (llmExpansionResponse.nodes.length !== llmExpansionResponse.knowledgeCards.length) {
                throw new Error(`Validation Error: Number of new nodes (${llmExpansionResponse.nodes.length}) does not match number of new knowledge cards (${llmExpansionResponse.knowledgeCards.length}).`);
            }
            const newNodeIds = new Set(llmExpansionResponse.nodes.map(n => n.id));
            for (const card of llmExpansionResponse.knowledgeCards) {
                if (!card.nodeId || typeof card.nodeId !== 'string' || !newNodeIds.has(card.nodeId)) {
                    throw new Error(`Validation Error: New knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
                }
            }
             // Simple validation for new link targets/sources (ensure they exist in combined graph)
            const existingNodeIds = new Set(currentVisualizationData.nodes.map((n: GraphNode) => n.id));
            const allNodeIds = new Set([...existingNodeIds, ...newNodeIds]);
            for (const link of llmExpansionResponse.links) {
                if (!allNodeIds.has(link.source) || !allNodeIds.has(link.target)) {
                     throw new Error(`Validation Error: New link connects non-existent node IDs: source="${link.source}", target="${link.target}".`);
                }
            }

            console.log(`LLM expansion validated: ${llmExpansionResponse.nodes.length} new nodes, ${llmExpansionResponse.links.length} new links, ${llmExpansionResponse.knowledgeCards.length} new cards.`);
            // --- DEBUG: Log LLM Links --- 
            console.log("DEBUG: Links received from LLM:", JSON.stringify(llmExpansionResponse.links));
            // --- END DEBUG --- 

            // Combine existing and new data
            const combinedNodesRaw = [...currentVisualizationData.nodes, ...llmExpansionResponse.nodes];
            const combinedLinks = [...currentVisualizationData.links, ...llmExpansionResponse.links];
            const combinedKnowledgeCards = [...currentKnowledgeCards, ...llmExpansionResponse.knowledgeCards];

            // --- DEBUG: Log Combined Links --- 
            console.log(`DEBUG: Existing Links Count: ${currentVisualizationData.links.length}`);
            console.log(`DEBUG: Combined Links Count (Before Deduplication if any): ${combinedLinks.length}`);
            // Optional: Log the full combined list if needed, but can be verbose
            // console.log("DEBUG: Final Combined Links:", JSON.stringify(combinedLinks)); 
            // --- END DEBUG --- 

            // Get text for embedding for ALL nodes
            const textsToEmbed = combinedNodesRaw.map(node => getNodeTextForEmbedding(node, combinedKnowledgeCards));

            // Calculate embeddings and positions for ALL nodes
            const allEmbeddings = await getNodeEmbeddings(textsToEmbed);
            const allPositions = await calculateNodePositions(allEmbeddings, combinedNodesRaw);

             // Create the final updated node list with new positions
            const finalNodes = combinedNodesRaw.map((node, index) => ({
                ...node,
                fx: allPositions[index]?.fx ?? node.fx ?? 0, // Use new fx, fallback to old fx, then 0
                fy: allPositions[index]?.fy ?? node.fy ?? 0, // Use new fy, fallback to old fy, then 0
                fz: allPositions[index]?.fz ?? node.fz ?? 0, // Use new fz, fallback to old fz, then 0
                // Keep original x,y,z if they existed, or let simulation handle them
                x: node.x,
                y: node.y,
                z: node.z,
            }));


            const updatedVisualizationData: VisualizationData = {
                nodes: finalNodes,
                links: combinedLinks, // Use the combined links directly
            };

            // Prepare response for the client
            const responsePayload: ExpansionResponse = {
                updatedVisualizationData: updatedVisualizationData,
                newKnowledgeCards: llmExpansionResponse.knowledgeCards, // Send only the new cards
            };

            console.log(`Expansion processed. Returning updated graph with ${finalNodes.length} total nodes and ${combinedLinks.length} total links.`);
            return NextResponse.json(responsePayload); // Return the structured expansion response

        } else {
            // --- Process Initial Response ---
            const initialResponseRaw: Omit<IntelleaResponse, 'visualizationData'> & { visualizationData: { nodes: GraphNode[], links: GraphLink[] }, knowledgeCards: KnowledgeCard[] } = llmJson;

            // Validate initial structure
             if (!initialResponseRaw.explanationMarkdown || !initialResponseRaw.visualizationData || !initialResponseRaw.knowledgeCards) {
                throw new Error("Missing required fields for initial response: explanationMarkdown, visualizationData, or knowledgeCards");
            }
            const nodes = initialResponseRaw.visualizationData.nodes;
            const cards = initialResponseRaw.knowledgeCards;
            const links = initialResponseRaw.visualizationData.links;

             if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
                throw new Error("Validation Error: visualizationData.nodes is missing, not an array, or empty.");
            }
             if (!cards || !Array.isArray(cards) || cards.length !== nodes.length) {
                 throw new Error(`Validation Error: knowledgeCards missing, not an array, or length (${cards.length}) doesn't match nodes length (${nodes.length}).`);
            }
             if (!links || !Array.isArray(links)) {
                throw new Error("Validation Error: visualizationData.links is missing or not an array.");
            }

            const nodeIds = new Set(nodes.map(n => n.id));
            for (const card of cards) {
                if (!card.nodeId || typeof card.nodeId !== 'string' || !nodeIds.has(card.nodeId)) {
                    throw new Error(`Validation Error: Knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
                }
            }
            const rootNodes = nodes.filter(n => n.isRoot === true);
             if (rootNodes.length !== 1) {
                throw new Error(`Validation Error: Expected exactly 1 root node (with isRoot: true), but found ${rootNodes.length}.`);
            }
            const rootNodeId = rootNodes[0].id;
            // Validate initial links originate from root (optional check, could be removed if we want more complex starts)
            // if (links.length > 0 && nodes.length > 1) {
            //     for (const link of links) {
            //         if (link.source !== rootNodeId) {
            //             // Temporarily relax this for flexibility if needed
            //             // throw new Error(`Validation Error: Initial link source "${link.source}" does not match root node ID "${rootNodeId}".`);
            //         }
            //          if (!nodeIds.has(link.target)) {
            //              throw new Error(`Validation Error: Initial link target "${link.target}" does not exist.`);
            //          }
            //     }
            // }

            console.log(`Initial LLM response validated: Root="${rootNodes[0].label}", ${nodes.length} nodes, ${links.length} links, ${cards.length} cards.`);

            // Get text for embedding
            const textsToEmbed = nodes.map(node => getNodeTextForEmbedding(node, cards));

            // Calculate embeddings and positions
            const embeddings = await getNodeEmbeddings(textsToEmbed);
            const positions = await calculateNodePositions(embeddings, nodes);

            // Add positions to node objects
            const nodesWithPositions = nodes.map((node, index) => ({
                ...node,
                fx: positions[index]?.fx ?? 0, // Use fx
                fy: positions[index]?.fy ?? 0, // Use fy
                fz: positions[index]?.fz ?? 0, // Use fz
                // Initialize x,y,z for potential simulation start
                x: positions[index]?.fx ?? 0, 
                y: positions[index]?.fy ?? 0,
                z: positions[index]?.fz ?? 0, 
            }));

            // Construct the final response object
            const output: IntelleaResponse = {
                explanationMarkdown: initialResponseRaw.explanationMarkdown,
                knowledgeCards: initialResponseRaw.knowledgeCards,
                visualizationData: {
                    nodes: nodesWithPositions,
                    links: initialResponseRaw.visualizationData.links,
                },
                quiz: initialResponseRaw.quiz, // Include quiz if present
            };

            console.log(`Initial response processed with semantic positions.`);
            return NextResponse.json({ output }); // Return the standard initial response structure
        }

    } catch (parseOrProcessError: any) {
      console.error('Failed to parse, validate, or process LLM response:', parseOrProcessError);
      console.error('Raw LLM response string:', rawResult); // Log raw response for debugging
      return NextResponse.json({ error: `Error processing AI response: ${parseOrProcessError.message}` }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 