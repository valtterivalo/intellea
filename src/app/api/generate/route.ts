import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the expected structure for nodes and links in the graph
interface GraphNode {
  id: string; // Unique identifier for the node
  label: string; // Text label displayed for the node
  isRoot?: boolean; // ADDED: Flag to identify the central root node
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
  nodeId: string; // RENAMED from id. Corresponds to a node ID in visualizationData.
  title: string; // Concept title (often matches node label)
  description: string; // Concise explanation of the concept (2-4 sentences)
  // Add other potential fields later (e.g., relatedConcepts: string[])
}

// Define structure for expansion data
interface GraphExpansionData {
    nodes: GraphNode[]; // Contains GraphNode which now includes isRoot?
    links: GraphLink[];
    knowledgeCards: KnowledgeCard[]; // Changed from optional to mandatory for expansion
}

// Define the expected structure of the INITIAL response from the LLM
export interface CognitionResponse { // Exporting for frontend use
  explanationMarkdown: string;
  knowledgeCards: KnowledgeCard[]; // Make mandatory, use nodeId
  visualizationData: GraphExpansionData; // Make mandatory, use nodeId
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Ensure the API key is available in the environment
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for INITIAL 3D graph generation
const INITIAL_SYSTEM_PROMPT = `You are Cognition, an expert AI assistant generating structured learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

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

// System prompt for GRAPH EXPANSION
const EXPANSION_SYSTEM_PROMPT = `You are Cognition, an AI assistant expanding an existing knowledge graph. Given a clicked node (ID and Label) and the current graph structure (nodes and links), generate **ONLY new, relevant nodes, links, and corresponding knowledge cards** to expand the graph from the clicked node. Respond ONLY with a single, valid JSON object matching this structure:

{
  "nodes": [ { "id": "string", "label": "string" } ], // **NEW nodes ONLY**. 'id' MUST be unique within the ENTIRE graph (existing + new). 'label' is display text. Max 2-3 new nodes.
  "links": [ { "source": "string", "target": "string" } ], // **NEW links ONLY**. Connect new nodes OR connect new nodes to EXISTING nodes. 'source' and 'target' MUST match node IDs (either existing or new). Max 3-4 new links.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ] // **NEW cards ONLY**. Generate ONE card for EACH new node. 'nodeId' MUST match the new node's 'id'. 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. Only include nodes/links/cards that are **directly relevant** and **add new information**.
3. **CRITICAL: Generate EXACTLY ONE KnowledgeCard for EACH new node generated in the 'nodes' array.** The number of objects in 'knowledgeCards' MUST equal the number of objects in 'nodes'.
4. **Each generated KnowledgeCard object MUST have a 'nodeId' property that EXACTLY matches the 'id' of its corresponding node in the NEW 'nodes' list.** Card 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
5. **DO NOT** include the clicked node itself or any existing nodes/links/cards in the response.
6. Ensure all new node IDs are unique strings across the entire graph context (existing + new).
7. Ensure all link source/target IDs exist in either the provided existing graph or the new nodes list.
8. Max 2-3 new nodes, 3-4 new links, and their corresponding cards.
9. If no relevant expansion is possible, return { "nodes": [], "links": [], "knowledgeCards": [] }.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, nodeId, nodeLabel, currentGraph } = body;

    let systemPrompt: string;
    let userPromptContent: string;
    let responseStructureExample: string; // Hint for the model
    let isExpansion = false;

    if (nodeId && nodeLabel && currentGraph) {
      // --- Expansion Request --- 
      isExpansion = true;
      systemPrompt = EXPANSION_SYSTEM_PROMPT;
      userPromptContent = `Expand the graph from the clicked node:\nNode ID: ${nodeId}\nNode Label: ${nodeLabel}\n\nCurrent Graph Structure (for context only, do not repeat):\n${JSON.stringify(currentGraph, null, 2)}`;
      responseStructureExample = `{ "nodes": [], "links": [], "knowledgeCards": [] }`; 
      console.log(`Calling OpenAI for EXPANSION on node: "${nodeLabel}" (ID: ${nodeId})`);

    } else if (prompt) {
      // --- Initial Request --- 
      isExpansion = false;
      systemPrompt = INITIAL_SYSTEM_PROMPT;
      userPromptContent = prompt;
      responseStructureExample = `{ "explanationMarkdown": "", "visualizationData": { "nodes": [], "links": [] } ... }`; // Full structure
      console.log(`Calling OpenAI for INITIAL prompt: "${prompt.substring(0, 80)}..."`);
    
    } else {
      return NextResponse.json({ error: 'Request must include either a prompt or node details for expansion' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Consider gpt-4-turbo-preview if more complex expansion needed
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptContent },
        // Optionally add a hint about expected structure if needed, but response_format should handle it
        // { role: 'assistant', content: responseStructureExample } 
      ],
      response_format: { type: 'json_object' },
      temperature: isExpansion ? 0.3 : 0.4, // Slightly lower temp for stricter expansion
    });

    const rawResult = completion.choices[0]?.message?.content;

    if (!rawResult) {
      return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
    }

    console.log(`OpenAI response received for ${isExpansion ? 'EXPANSION' : 'INITIAL'} request.`);

    try {
      const parsedJson = JSON.parse(rawResult);

      if (isExpansion) {
        // Validate expansion structure
        if (!parsedJson.nodes || !parsedJson.links || !parsedJson.knowledgeCards) { // Make cards mandatory here too
            throw new Error("Missing required fields for expansion: nodes, links, or knowledgeCards");
        }
        // Add check: Number of new nodes must match number of new cards
        if (parsedJson.nodes.length !== parsedJson.knowledgeCards.length) {
            throw new Error(`Validation Error: Number of new nodes (${parsedJson.nodes.length}) does not match number of new knowledge cards (${parsedJson.knowledgeCards.length}).`);
        }
        // Add check: Ensure all new cards have a valid nodeId matching a new node
        const newNodeIds = new Set(parsedJson.nodes.map((n: any) => n.id));
        for (const card of parsedJson.knowledgeCards) {
            if (!card.nodeId || typeof card.nodeId !== 'string' || !newNodeIds.has(card.nodeId)) {
                throw new Error(`Validation Error: Knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
            }
        }

        const expansionData: GraphExpansionData = parsedJson; // Type now includes knowledgeCards?
        console.log(`Expansion validated: ${expansionData.nodes.length} nodes, ${expansionData.links.length} links, ${expansionData.knowledgeCards?.length ?? 0} cards.`);
        return NextResponse.json({ expansionData }); // Return the full expansion data
      } else {
        // Validate initial structure (make viz and cards mandatory)
        if (!parsedJson.explanationMarkdown || !parsedJson.visualizationData || !parsedJson.knowledgeCards) {
            throw new Error("Missing required fields for initial response: explanationMarkdown, visualizationData, or knowledgeCards");
        }
        // Add check: Number of nodes must match number of cards
         if (parsedJson.visualizationData.nodes.length !== parsedJson.knowledgeCards.length) {
            throw new Error(`Validation Error: Number of nodes (${parsedJson.visualizationData.nodes.length}) does not match number of knowledge cards (${parsedJson.knowledgeCards.length}).`);
        }
        // Add check: Ensure all cards have a valid nodeId matching a node
        const nodeIds = new Set(parsedJson.visualizationData.nodes.map((n: any) => n.id));
        for (const card of parsedJson.knowledgeCards) {
            if (!card.nodeId || typeof card.nodeId !== 'string' || !nodeIds.has(card.nodeId)) {
                 throw new Error(`Validation Error: Knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
            }
        }

        const nodes = parsedJson.visualizationData.nodes;
        const cards = parsedJson.knowledgeCards;
        const links = parsedJson.visualizationData.links;

        if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
             throw new Error("Validation Error: visualizationData.nodes is missing, not an array, or empty.");
        }
        if (!cards || !Array.isArray(cards)) { // Allow empty links array initially if only root exists
            throw new Error("Validation Error: knowledgeCards is missing or not an array.");
        }
        if (!links || !Array.isArray(links)) { 
             throw new Error("Validation Error: visualizationData.links is missing or not an array.");
        }

        // Find the root node
        const rootNodes = nodes.filter((n: any) => n.isRoot === true);
        if (rootNodes.length !== 1) {
            throw new Error(`Validation Error: Expected exactly 1 root node (with isRoot: true), but found ${rootNodes.length}.`);
        }
        const rootNodeId = rootNodes[0].id;

        // Check node count vs card count
         if (nodes.length !== cards.length) {
            throw new Error(`Validation Error: Number of nodes (${nodes.length}) does not match number of knowledge cards (${cards.length}).`);
        }
       
        // Check if all links originate from the root node (if links exist)
        if (links.length > 0 && nodes.length > 1) { // Only check if there are sub-nodes/links
             for (const link of links) {
                 if (link.source !== rootNodeId) {
                     throw new Error(`Validation Error: Link source "${link.source}" does not match root node ID "${rootNodeId}". All links must originate from the root.`);
                 }
             }
        }

        // Check card nodeIds
        const nodeIdsSet = new Set(nodes.map((n: any) => n.id));
        for (const card of cards) {
            if (!card.nodeId || typeof card.nodeId !== 'string' || !nodeIdsSet.has(card.nodeId)) {
                 throw new Error(`Validation Error: Knowledge card with title "${card.title}" has missing, invalid, or non-matching nodeId "${card.nodeId}".`);
            }
        }

        const output: CognitionResponse = parsedJson; 
        console.log(`Initial response validated: Root="${rootNodes[0].label}", ${output.visualizationData.nodes.length} nodes, ${output.visualizationData.links.length} links, ${output.knowledgeCards?.length ?? 0} cards.`);
        return NextResponse.json({ output });
      }

    } catch (parseError: any) {
      console.error('Failed to parse or validate JSON response from LLM:', parseError);
      console.error('Raw LLM response string:', rawResult);
      return NextResponse.json({ error: `AI generated invalid or incomplete JSON response: ${parseError.message}` }, { status: 500 });
    }

  } catch (error) {
    console.error('API Route Error:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 