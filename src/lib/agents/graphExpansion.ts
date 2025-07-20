/**
 * @fileoverview Graph expansion agent with Kimi K2 support
 * Exports: GraphExpansionAgent
 */
import { Agent } from '@openai/agents';
import { z } from 'zod';
import { getModel } from '../models/config';

const NodeObjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  // isRoot is not needed for expansion nodes as they are never roots.
}).strict();

const LinkObjectSchema = z.object({
    source: z.string(),
    target: z.string()
}).strict();

const KnowledgeCardSchema = z.object({
    nodeId: z.string(),
    title: z.string(),
    description: z.string(),
}).strict();

/**
 * Zod schema for the output of the GraphExpansionAgent.
 */
const ExpansionResponseSchema = z.object({
    nodes: z.array(NodeObjectSchema),
    links: z.array(LinkObjectSchema),
    knowledgeCards: z.array(KnowledgeCardSchema),
}).strict();

const EXPANSION_SYSTEM_PROMPT = `You are Intellea, an AI assistant expanding an existing knowledge graph. Given a clicked node (ID and Label) and the current graph structure (nodes and links), generate **ONLY new, relevant nodes, links, and corresponding knowledge cards** to expand the graph from the clicked node. Respond ONLY with a single, valid JSON object matching this structure:

{
  "nodes": [ { "id": "string", "label": "string" } ], // **NEW nodes ONLY**. 'id' MUST be unique within the ENTIRE graph (existing + new). 'label' is display text. Max 2-3 new nodes.
  "links": [ { "source": "string", "target": "string" } ], // **NEW links ONLY**. Links should primarily connect the clicked node (provided as context) to the new nodes you are generating. You can also create links *between* the new nodes you generate if it makes sense. **Avoid linking new nodes to any other existing nodes from the provided \`currentGraphStructure\`**.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ] // **NEW cards ONLY**. Generate ONE card for EACH new node. 'nodeId' MUST match the new node's 'id'. 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
}

**Constraint Checklist:**
1. Single JSON object ONLY.
2. Only include nodes/links/cards that are **directly relevant** and **add new information** based on the clicked node.
3. **Link Generation Rules:** Links should originate from the clicked node (identified by \`nodeToExpand.id\` in the user message context) and target a new node, OR links can be between two new nodes generated in this response. **Avoid linking new nodes to any other existing nodes from the provided \`currentGraphStructure\`**.
4. **CRITICAL: Generate EXACTLY ONE KnowledgeCard for EACH new node generated in the 'nodes' array.** The number of objects in 'knowledgeCards' MUST equal the number of objects in 'nodes'.
5. **Each generated KnowledgeCard object MUST have a 'nodeId' property that EXACTLY matches the 'id' of its corresponding node in the NEW 'nodes' list.** Card 'title' should match node 'label'. 'description' MUST be 2-4 concise sentences.
6. **DO NOT** include the clicked node itself or any other existing nodes/links/cards in the response.
7. Ensure all new node IDs are unique strings across the entire graph context (existing + new).
8. Ensure all link source/target IDs reference either the clicked node or one of the new nodes you are creating.
9. Max 2-3 new nodes, 3-5 new links (following the rules above), and their corresponding cards.
10. If no relevant expansion is possible, return { "nodes": [], "links": [], "knowledgeCards": [] }.
`;

/**
 * Agent responsible for expanding an existing knowledge graph from a specific node.
 */
export const GraphExpansionAgent = new Agent({
    name: "graph_expansion",
    instructions: EXPANSION_SYSTEM_PROMPT,
    outputType: ExpansionResponseSchema,
    model: getModel('kimi-k2'), // Use Kimi K2 via Groq with OpenAI fallback
    modelSettings: {
        temperature: 0.4,
    },
}); 