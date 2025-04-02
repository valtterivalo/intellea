import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the expected structure for nodes and links in the graph
interface GraphNode {
  id: string; // Unique identifier for the node
  label: string; // Text label displayed for the node
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
  id: string; // Corresponds to a node ID in visualizationData
  title: string; // Concept title (often matches node label)
  description: string; // Concise explanation of the concept (2-4 sentences)
  // Add other potential fields later (e.g., relatedConcepts: string[])
}

// Define structure for expansion data
interface GraphExpansionData {
    nodes: GraphNode[];
    links: GraphLink[];
    knowledgeCards?: KnowledgeCard[]; // Add optional knowledge cards for new nodes
}

// Define the expected structure of the INITIAL response from the LLM
export interface CognitionResponse { // Exporting for frontend use
  explanationMarkdown: string;
  // keyTerms?: { term: string; definition: string }[]; // Replaced by knowledgeCards
  knowledgeCards?: KnowledgeCard[]; // Optional: List of cards linked to graph nodes.
  visualizationData?: GraphExpansionData; // Reuse expansion structure
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
const INITIAL_SYSTEM_PROMPT = `You are Cognition, an expert AI assistant generating structured learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object matching this structure:

{
  "explanationMarkdown": "string", // MANDATORY: A **single paragraph** high-level summary. Max 3-4 sentences. Use Markdown. **ABSOLUTELY NO definitions here.** Just the core idea/flow.
  "knowledgeCards": [ { "id": "string", "title": "string", "description": "string" } ], // Optional: Detailed cards for each node. 'id' MUST match a 'visualizationData.nodes.id'. 'title' should match node 'label'. 'description' is 2-4 sentences explaining the concept.
  "visualizationData": { // Optional: Data for the 3D graph. Generate a SMALL initial graph (3-7 nodes max) representing core concepts.
    "nodes": [ { "id": "string", "label": "string" } ], // Node list. 'id' must be unique. 'label' is display text.
    "links": [ { "source": "string", "target": "string" } ] // Link list connecting nodes by 'id'. 'source' and 'target' MUST match node IDs.
   },
  "quiz": { "question": "string", "options": [\"A) Option text\", \"B) Option text\", ...], "correctAnswerLetter": \"string\" } // Optional: One MCQ. Options MUST start with A), B), C), D).
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. explanationMarkdown: MANDATORY, **1 paragraph max**, NO definitions.
3. knowledgeCards: Optional. If included, each card's 'id' MUST correspond to a node 'id' in 'visualizationData.nodes'. 'title' should match the node 'label'. 'description' MUST be 2-4 sentences per card.
4. visualizationData: If included, MUST follow { nodes: [{id, label}], links: [{source, target}] } structure. Generate a SMALL initial graph. Ensure all link source/target IDs exist in the nodes list. Ensure all node IDs match a knowledgeCard ID.
5. quiz: If included, options MUST be formatted as "A) ...", "B) ..." etc.
6. Optional fields only if valuable. Ensure information isn't duplicated unnecessarily (e.g., definitions belong in knowledgeCards, not explanationMarkdown).
`;

// System prompt for GRAPH EXPANSION
const EXPANSION_SYSTEM_PROMPT = `You are Cognition, an AI assistant expanding an existing knowledge graph. Given a clicked node (ID and Label) and the current graph structure (nodes and links), generate **ONLY new, relevant nodes, links, and corresponding knowledge cards** to expand the graph from the clicked node. Respond ONLY with a single, valid JSON object matching this structure:

{
  "nodes": [ { "id": "string", "label": "string" } ], // **NEW nodes ONLY**. 'id' MUST be unique within the ENTIRE graph (existing + new). 'label' is display text. Max 2-3 new nodes.
  "links": [ { "source": "string", "target": "string" } ], // **NEW links ONLY**. Connect new nodes OR connect new nodes to EXISTING nodes. 'source' and 'target' MUST match node IDs (either existing or new). Max 3-4 new links.
  "knowledgeCards": [ { "id": "string", "title": "string", "description": "string" } ] // **NEW cards ONLY**. Generate ONE card for EACH new node. 'id' MUST match the new node's 'id'. 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. Only include nodes/links/cards that are **directly relevant** to the clicked node and **add new information** not already present.
3. Generate **ONE KnowledgeCard for EACH new node**. Card 'id' MUST match the corresponding new node 'id'. Card 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
4. **DO NOT** include the clicked node itself or any existing nodes/links/cards in the response.
5. Ensure all node IDs (in nodes, links, and cards) are unique strings across the entire graph context (existing + new).
6. Ensure all link source/target IDs exist in either the provided existing graph or the new nodes list.
7. Keep the expansion focused: generate a maximum of 2-3 new nodes, 3-4 new links, and their corresponding cards per request.
8. If no relevant expansion is possible, return { "nodes": [], "links": [], "knowledgeCards": [] }.
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
        // Validate expansion structure, including optional knowledgeCards
        if (!parsedJson.nodes || !parsedJson.links) { // Keep basic check
            throw new Error("Missing required fields for expansion: nodes or links");
        }
        // Add checks for knowledgeCards if they are expected to always exist
        // if (!parsedJson.knowledgeCards) {
        //    throw new Error("Missing required field for expansion: knowledgeCards");
        // }
        const expansionData: GraphExpansionData = parsedJson; // Type now includes knowledgeCards?
        console.log(`Expansion generated: ${expansionData.nodes.length} nodes, ${expansionData.links.length} links, ${expansionData.knowledgeCards?.length ?? 0} cards.`);
        return NextResponse.json({ expansionData }); // Return the full expansion data
      } else {
        // Validate basic initial structure
        if (!parsedJson.explanationMarkdown) {
            throw new Error("Missing required field for initial response: explanationMarkdown");
        }
        const output: CognitionResponse = parsedJson; // Assume structure is correct
        return NextResponse.json({ output }); // Return full output object
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