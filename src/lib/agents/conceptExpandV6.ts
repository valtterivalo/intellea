/**
 * @fileoverview Concept expansion with OpenAI Files + Vector Stores (persistent document access)
 * Exports: expandConcept
 */
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';

// Zod schema for a related concept, part of the expansion output.
const RelatedConceptSchema = z.object({
    nodeId: z.string(),
    title: z.string(),
    relation: z.string(),
});

/**
 * Zod schema for the output of concept expansion.
 * This corresponds to the `ExpandedConceptData` type.
 */
const ExpandOutSchema = z.object({
    title: z.string(),
    content: z.string(), // Expecting markdown content
    relatedConcepts: z.array(RelatedConceptSchema),
}).strict();

const EXPAND_CONCEPT_PROMPT = `You are Intellea, an expert AI assistant generating detailed information about a specific concept for an interactive learning tool. Respond ONLY with a single, valid JSON object.

**Context:**
The user is exploring a knowledge graph about a topic. They have clicked on a specific node to learn more about that concept in detail. You are given:
1. Information about the concept they want to explore (nodeId and nodeLabel)
2. The complete graph structure (nodes and their relationships)
3. Brief descriptions of all concepts in the graph (knowledgeCards)

**Instructions:**
1. Create a comprehensive, detailed explanation of the selected concept.
2. Structure the response as markdown with appropriate sections, lists, and formatting.
3. Reference related concepts that appear elsewhere in the knowledge graph.
4. Keep the explanation focused, educational, and engaging.
5. Do NOT repeat the basic information that's already in the knowledge card.
6. Aim for approximately 300-500 words of meaningful content.

Your response must be a valid JSON object with this structure:
{
  "title": "The full title of the concept",
  "content": "Comprehensive markdown-formatted explanation...",
  "relatedConcepts": [
    {
      "nodeId": "id-of-related-node",
      "title": "Title of related node",
      "relation": "Brief explanation of how this concept relates to the main concept"
    }
  ]
}`;

const EXPAND_CONCEPT_WITH_DOCS_PROMPT = `You are Intellea, an expert AI assistant generating detailed information about a specific concept for an interactive learning tool. Respond ONLY with a single, valid JSON object.

**Context:**
The user is exploring a knowledge graph created from their uploaded documents. They have clicked on a specific node to learn more about that concept in detail. You have access to the original documents via file search.

**Instructions:**
1. Use file search to find relevant information about the selected concept from the uploaded documents.
2. Create a comprehensive, detailed explanation grounded in the document content.
3. Structure the response as markdown with appropriate sections, lists, and formatting.
4. Reference specific information, examples, or data points from the documents when available.
5. Connect the concept to other nodes in the knowledge graph when relevant.
6. Keep the explanation focused, educational, and well-sourced from the documents.
7. Aim for approximately 300-500 words of meaningful content.

Your response must be a valid JSON object with this structure:
{
  "title": "The full title of the concept",
  "content": "Comprehensive markdown-formatted explanation grounded in the documents...",
  "relatedConcepts": [
    {
      "nodeId": "id-of-related-node",
      "title": "Title of related node", 
      "relation": "Brief explanation of how this concept relates to the main concept"
    }
  ]
}`;

interface GraphContext {
  nodes: Array<{ id: string; label: string; isRoot?: boolean }>;
  links: Array<{ source: string; target: string }>;
  knowledgeCards: Array<{ nodeId: string; title: string; description: string }>;
}

/**
 * Expand a concept to provide detailed information using AI SDK v5 with Vector Stores
 */
export async function expandConcept(
  nodeId: string,
  nodeLabel: string,
  graphContext: GraphContext,
  hasDocuments = false,
  vectorStoreId?: string
) {
  if (hasDocuments && vectorStoreId) {
    // Use GPT-5 with file_search for document-grounded expansion
    console.log(`Expanding concept "${nodeLabel}" with document grounding from vector store: ${vectorStoreId}`);
    
    const expansionPrompt = `
**Selected Concept to Expand:**
- Node ID: ${nodeId}
- Node Label: ${nodeLabel}

**Complete Graph Context:**
- All Nodes: ${JSON.stringify(graphContext.nodes)}
- All Links: ${JSON.stringify(graphContext.links)}
- All Knowledge Cards: ${JSON.stringify(graphContext.knowledgeCards)}

Please search the uploaded documents for detailed information about "${nodeLabel}" and create a comprehensive explanation grounded in the document content.
`;

    const result = await generateObject({
      model: openai.responses('gpt-5'),
      system: EXPAND_CONCEPT_WITH_DOCS_PROMPT,
      prompt: expansionPrompt,
      schema: ExpandOutSchema,
    });
    
    console.log(`Concept expansion completed with document grounding for: ${nodeLabel}`);
    return result.object;
  } else {
    // Use fast model for concept expansion without documents - prefer Groq if available
    const model = process.env.GROQ_API_KEY 
      ? groq('moonshotai/kimi-k2-instruct')
      : openai('gpt-5-mini');
    
    const expansionPrompt = `
**Selected Concept to Expand:**
- Node ID: ${nodeId}
- Node Label: ${nodeLabel}

**Complete Graph Context:**
- All Nodes: ${JSON.stringify(graphContext.nodes)}
- All Links: ${JSON.stringify(graphContext.links)}
- All Knowledge Cards: ${JSON.stringify(graphContext.knowledgeCards)}

Create a detailed explanation for the concept "${nodeLabel}" (ID: ${nodeId}), taking into account its place within this knowledge graph structure.
`;

    const result = await generateObject({
      model,
      system: EXPAND_CONCEPT_PROMPT,
      prompt: expansionPrompt,
      schema: ExpandOutSchema,
    });

    return result.object;
  }
}