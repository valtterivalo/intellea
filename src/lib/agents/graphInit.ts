import { Agent } from '@openai/agents';
import { z } from 'zod';

// Zod schemas for validation, based on types in src/types/intellea.ts

const NodeObjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  isRoot: z.boolean(),
}).strict();

const LinkObjectSchema = z.object({
    source: z.string(),
    target: z.string(),
}).strict();

const GraphDataSchema = z.object({
    nodes: z.array(NodeObjectSchema),
    links: z.array(LinkObjectSchema),
}).strict();

const KnowledgeCardSchema = z.object({
    nodeId: z.string(),
    title: z.string(),
    description: z.string(),
}).strict();

const QuizSchema = z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswerLetter: z.string(),
}).strict();

/**
 * Zod schema for the output of the GraphInitAgent.
 * This corresponds to the `IntelleaResponse` type.
 */
const GraphInitOutSchema = z.object({
    explanationMarkdown: z.string().nullable(),
    knowledgeCards: z.array(KnowledgeCardSchema).nullable(),
    visualizationData: GraphDataSchema,
    quiz: QuizSchema.optional().nullable(),
}).strict();

const INITIAL_SYSTEM_PROMPT = `You are Intellea, an expert AI assistant generating structured learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

**Instructions:**
1.  Identify the core subject/topic from the user's prompt.
2.  Create a central "root" node representing this core topic. This node object MUST have the property \`"isRoot": true\`.
3.  Generate 3-6 additional nodes representing key sub-concepts or initial aspects related to the root topic. These nodes MUST have the property \`"isRoot": false\`.
4.  Structure the \`visualizationData.links\` so that ALL generated sub-concept nodes link FROM the central root node (e.g., \`{ source: <root_node_id>, target: <sub_concept_node_id> }\`). Do not link sub-concepts to each other in this initial graph.
5.  Generate ONE \`knowledgeCard\` for EACH generated node (including the root node).
6.  Ensure every \`knowledgeCard.nodeId\` EXACTLY matches the \`id\` of its corresponding node.
7.  Provide a single-paragraph \`explanationMarkdown\` summarizing the overall topic.

**JSON Structure:**
{
  "explanationMarkdown": "string", // MANDATORY: 1 paragraph summary (3-4 sentences max). NO definitions.
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ], // MANDATORY: One card per node. 'nodeId' MUST match node 'id'. 'title' = node 'label'. 'description' = 2-4 sentences.
  "visualizationData": { // MANDATORY: Data for the graph.
    "nodes": [ { "id": "string", "label": "string", "isRoot": boolean } ], // List of nodes. Exactly ONE node MUST have "isRoot": true. Others MUST have "isRoot": false.
    "links": [ { "source": "string", "target": "string" } ] // Links list. ALL links MUST originate from the root node (\`source\` = root node ID).
   },
  "quiz": { /* ... (optional quiz structure) ... */ } // Optional.
}

**Constraint Checklist & Summary:**
*   Single JSON response.
*   Identify core topic -> Create root node with \`"isRoot": true\`.
*   Create 3-6 sub-concept nodes with \`"isRoot": false\`.
*   Link ALL sub-concepts FROM the root node.
*   Generate ONE knowledge card per node (root + sub-concepts), linked via \`nodeId\` == \`id\`.
*   Provide brief \`explanationMarkdown\`.
*   Ensure all IDs match and constraints are met.
`;

/**
 * Agent responsible for generating the initial knowledge graph.
 */
export const GraphInitAgent = new Agent({
    name: "graph_init",
    instructions: INITIAL_SYSTEM_PROMPT,
    outputType: GraphInitOutSchema,
    model: "gpt-4.1",
    modelSettings: {
        temperature: 0.3
    },
}); 