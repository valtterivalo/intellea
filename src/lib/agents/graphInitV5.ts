/**
 * @fileoverview Graph initialization with AI SDK v5
 * Exports: generateInitialGraph
 */
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';

// Enhanced Zod schemas supporting multi-parent hierarchical structures
const NodeObjectSchema = z.object({
  id: z.string(),
  label: z.string(),
  isRoot: z.boolean(),
  depth: z.number().min(0).max(3).optional(), // 0=root, 1=level1, 2=level2, 3=level3
  parentIds: z.array(z.string()).optional(), // Array of parent node IDs, empty for root
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

/**
 * Zod schema for the output of the graph initialization.
 * This corresponds to the `IntelleaResponse` type.
 */
const GraphInitOutSchema = z.object({
    sessionTitle: z.string(), // Concise title for the learning session
    explanationMarkdown: z.string().nullable(),
    knowledgeCards: z.array(KnowledgeCardSchema).nullable(),
    visualizationData: GraphDataSchema,
}).strict();

const INITIAL_SYSTEM_PROMPT = `You are Intellea, an expert AI assistant generating structured multi-parent hierarchical learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

**Instructions:**
1. Identify the core subject/topic from the user's prompt.
2. Create a central "root" node representing this core topic. This node MUST have:
   - \`"isRoot": true\`
   - \`"depth": 0\`
   - \`"parentIds": []\` (empty array)
3. Generate sub-concepts as child nodes. Use your judgment to determine:
   - How many nodes are needed to properly represent the topic
   - How many levels deep the hierarchy should go (max 3 levels: 0, 1, 2)
   - Which concepts have natural connections to multiple parent concepts
4. For each non-root node, set:
   - \`"isRoot": false\`
   - \`"depth": <minimum parent depth + 1>\`
   - \`"parentIds": [<array of parent node ids>]\` (can have multiple parents!)
5. Create meaningful cross-connections:
   - A concept can belong to multiple parent domains
   - Example: "Machine Learning" could be a child of both "Data Science" and "Statistics"
   - Example: "Calculus" could connect to both "Mathematics" and "Physics"
6. Generate links for ALL parent-child relationships:
   - Create a link for each parent in a node's \`parentIds\` array
   - \`{ "source": "parent_id", "target": "child_id" }\`
7. Generate ONE \`knowledgeCard\` for EACH node with \`nodeId\` matching the node \`id\`.
8. Create a concise, descriptive \`sessionTitle\` that captures the essence of the learning session (5-10 words).
9. Provide \`explanationMarkdown\` explaining the topic's interconnected structure.

**Multi-Parent Examples:**
\`\`\`
Data Science (depth: 1)
├── Machine Learning (depth: 2) ←┐
├── Data Visualization (depth: 2) │
Statistics (depth: 1)             │
├── Machine Learning (depth: 2) ←┘  # Same node, multiple parents
├── Hypothesis Testing (depth: 2)
Mathematics (depth: 1)
├── Linear Algebra (depth: 2)
├── Calculus (depth: 2) ←┐
Physics (depth: 1)        │
├── Calculus (depth: 2) ←┘         # Cross-domain connection
\`\`\`

**Flexibility Guidelines:**
- Simple topics: Create 2-level hierarchies with some cross-connections
- Complex topics: Create 3-level hierarchies with rich interconnections
- Research papers: Mirror logical dependencies and cross-references
- Technical subjects: Show how concepts build on multiple foundations
- Use as many nodes and connections as needed for accurate representation

**JSON Structure:**
{
  "sessionTitle": "string", // Concise, descriptive title for the learning session (5-10 words)
  "explanationMarkdown": "string", // Brief explanation of the interconnected topic structure
  "knowledgeCards": [ { "nodeId": "string", "title": "string", "description": "string" } ], // One card per node
  "visualizationData": {
    "nodes": [
      {
        "id": "string",
        "label": "string",
        "isRoot": boolean,
        "depth": number, // 0 for root, minimum parent depth + 1 for children
        "parentIds": ["parent_id_1", "parent_id_2"] // Array of parent IDs (empty for root)
      }
    ],
    "links": [ { "source": "parent_id", "target": "child_id" } ] // All parent-child relationships
  }
}

**Requirements:**
- Exactly one root node with \`isRoot: true\` and empty \`parentIds\`
- Nodes can have multiple parents when conceptually appropriate
- All node IDs must be unique
- Create a link for every parent-child relationship
- Maximum depth of 2 (3 total levels: 0, 1, 2)
- Ensure no circular dependencies (child cannot be ancestor of its parent)
`;

/**
 * Generate initial knowledge graph using AI SDK v5
 */
export async function generateInitialGraph(
  prompt: string, 
  hasDocuments = false,
  files?: File[]
) {
  // Use multimodal model for document processing, Kimi K2 for text-only
  const model = hasDocuments 
    ? openai.responses('gpt-5')  // Use Responses API for document processing
    : groq('moonshotai/kimi-k2-instruct');  // Smart and fast for text-only
  
  const systemPrompt = hasDocuments 
    ? `${INITIAL_SYSTEM_PROMPT}\n\nWhen documents are provided, analyze their content and create a knowledge graph that captures the key concepts and relationships from the documents, while also considering the user's specific request.`
    : INITIAL_SYSTEM_PROMPT;

  if (hasDocuments && files) {
    // For multimodal content, use messages format with File objects
    if (process.env.APP_DEBUG === 'true') console.log('Processing files for AI SDK:', files.map(f => ({ 
      name: f.name, 
      type: f.type, 
      size: f.size 
    })));
    
    const fileContent = await Promise.all(files.map(async file => {
      if (process.env.APP_DEBUG === 'true') console.log(`Processing file ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Convert File to base64 data URL for OpenAI Responses API
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64String = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64String}`;
      
      if (process.env.APP_DEBUG === 'true') console.log(`Converted to base64 data URL: ${dataUrl.substring(0, 100)}...`);
      
      return {
        type: 'file' as const,
        data: dataUrl,
        mediaType: file.type,
        filename: file.name,
      };
    }));
    
    const messageContent = [
      { type: 'text' as const, text: prompt },
      ...fileContent
    ];
    
    if (process.env.APP_DEBUG === 'true') console.log('Sending to OpenAI Responses API with content types:', messageContent.map(c => c.type));
    
    const result = await generateObject({
      model: model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        }
      ],
      schema: GraphInitOutSchema,
    });
    return result.object;
  } else {
    // For text-only, use prompt format (cleaner than messages for simple text)
    const result = await generateObject({
      model: model,
      system: systemPrompt,
      prompt: prompt,
      schema: GraphInitOutSchema,
    });
    return result.object;
  }
}