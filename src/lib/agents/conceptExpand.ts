import { Agent } from '@openai/agents';
import { z } from 'zod';

// Zod schema for a related concept, part of the expansion output.
const RelatedConceptSchema = z.object({
    nodeId: z.string(),
    title: z.string(),
    relation: z.string(),
});

/**
 * Zod schema for the output of the ConceptExpanderAgent.
 * This corresponds to the `ExpandedConceptData` type.
 */
export const ExpandOutSchema = z.object({
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

/**
 * Agent responsible for expanding a single node in an existing knowledge graph.
 */
export const ConceptExpanderAgent = new Agent({
    name: "concept_expander",
    instructions: EXPAND_CONCEPT_PROMPT,
    outputType: ExpandOutSchema,
    model: "gpt-4.1",
}); 