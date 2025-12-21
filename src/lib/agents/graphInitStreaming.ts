/**
 * @fileoverview Streaming graph initialization with real-time progress updates.
 * Exports: generateInitialGraphStreaming
 */
import { streamObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import type { StreamEmitter } from '@/types/streaming';
import { StatusMessages } from '@/types/streaming';
import type { IntelleaResponse } from '@intellea/graph-schema';

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
   - isRoot: true
   - depth: 0
   - parentIds: [] (empty array)

3. Generate 8-15 interconnected nodes representing key concepts, subtopics, or components related to the root topic.

4. Create meaningful links between nodes to show relationships and dependencies.

5. Generate informative knowledge cards for each node with detailed descriptions.

6. Create a concise session title (2-4 words) that captures the essence of the learning topic.

**Multi-Parent Hierarchical Structure:**
- Nodes can have multiple parents (realistic knowledge representation)
- Use parentIds array to specify all direct parents for each node
- Depth represents the minimum distance from root (0=root, 1=direct children, 2=grandchildren, 3=great-grandchildren)
- Links should connect: parent → child relationships AND conceptual relationships
- Ensure rich interconnections while maintaining logical hierarchy

**Output Requirements:**
- sessionTitle: Concise 2-4 word title
- explanationMarkdown: Overview paragraph explaining the topic and how concepts connect
- knowledgeCards: Array of cards with nodeId, title, and detailed description
- visualizationData: Graph with nodes and links

**Quality Guidelines:**
- Nodes should represent substantial, meaningful concepts (not trivial details)
- Links should indicate genuine relationships or dependencies
- Knowledge cards should be informative and educational
- Maintain academic rigor while being accessible
- Cover breadth and depth appropriate to the topic
- Maximum depth of 2 (3 total levels: 0, 1, 2)
- Ensure no circular dependencies (child cannot be ancestor of its parent)
`;

/**
 * Generate initial knowledge graph using streaming AI SDK v5
 */
export async function generateInitialGraphStreaming(
  prompt: string,
  emitter: StreamEmitter,
  hasDocuments = false,
  files?: File[],
  isDemo = false
) {
  try {
    emitter.emit({
      type: 'status',
      message: hasDocuments ? StatusMessages.PROCESSING_FILES : StatusMessages.ANALYZING_TOPIC,
      progress: 10
    });

    // For demo mode, always use the cheapest model
    // Otherwise, use multimodal model for document processing, Kimi K2 for text-only
    const model = isDemo
      ? openai('gpt-5-mini')  // Cheap model for demos
      : hasDocuments 
        ? openai.responses('gpt-5')  // Use Responses API for document processing
        : groq('moonshotai/kimi-k2-instruct');  // Smart and fast for text-only
    
    const systemPrompt = hasDocuments 
      ? `${INITIAL_SYSTEM_PROMPT}\n\nWhen documents are provided, analyze their content and create a knowledge graph that captures the key concepts and relationships from the documents, while also considering the user's specific request.`
      : INITIAL_SYSTEM_PROMPT;

    // Block file processing in demo mode
    if (isDemo && hasDocuments && files && files.length > 0) {
      throw new Error('File uploads are not available in demo mode. Please sign up for full access.');
    }

    emitter.emit({
      type: 'status',
      message: StatusMessages.BUILDING_GRAPH,
      progress: 20
    });

    if (hasDocuments && files && !isDemo) {
      // For multimodal content, use messages format with File objects
      if (process.env.APP_DEBUG === 'true') console.log('Processing files for AI SDK:', files.map(f => ({ 
        name: f.name, 
        type: f.type, 
        size: f.size 
      })));
      
      const fileContent = await Promise.all(files.map(async (file, index) => {
        if (process.env.APP_DEBUG === 'true') console.log(`Processing file ${file.name} (${file.type}, ${file.size} bytes)`);
        
        emitter.emit({
          type: 'documents-processing',
          fileName: file.name,
          progress: index + 1,
          total: files.length
        });
        
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
      
      emitter.emit({
        type: 'status',
        message: StatusMessages.CREATING_CONNECTIONS,
        progress: 40
      });
      
      const { partialObjectStream, object } = streamObject({
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

      // Stream partial updates as they come in
      let nodeCount = 0;
      let linkCount = 0;
      for await (const partialObject of partialObjectStream) {
        const currentNodeCount = partialObject.visualizationData?.nodes?.length || 0;
        const currentLinkCount = partialObject.visualizationData?.links?.length || 0;
        
        if (currentNodeCount > nodeCount || currentLinkCount > linkCount) {
          nodeCount = currentNodeCount;
          linkCount = currentLinkCount;
          
          emitter.emit({
            type: 'graph-partial',
            data: partialObject as Partial<IntelleaResponse>,
            nodeCount,
            linkCount
          });
          
          // Update progress based on node generation
          const estimatedProgress = Math.min(90, 40 + (nodeCount * 3));
          emitter.emit({
            type: 'status',
            message: `${StatusMessages.BUILDING_GRAPH} (${nodeCount} nodes, ${linkCount} connections)`,
            progress: estimatedProgress
          });
        }
      }

      const finalObject = await object;
      return finalObject;
      
    } else {
      // For text-only, use prompt format (cleaner than messages for simple text)
      const { partialObjectStream, object } = streamObject({
        model: model,
        system: systemPrompt,
        prompt: prompt,
        schema: GraphInitOutSchema,
      });

      // Stream partial updates as they come in
      let nodeCount = 0;
      let linkCount = 0;
      for await (const partialObject of partialObjectStream) {
        const currentNodeCount = partialObject.visualizationData?.nodes?.length || 0;
        const currentLinkCount = partialObject.visualizationData?.links?.length || 0;
        
        if (currentNodeCount > nodeCount || currentLinkCount > linkCount) {
          nodeCount = currentNodeCount;
          linkCount = currentLinkCount;
          
          emitter.emit({
            type: 'graph-partial',
            data: partialObject as Partial<IntelleaResponse>,
            nodeCount,
            linkCount
          });
          
          // Update progress based on node generation
          const estimatedProgress = Math.min(90, 40 + (nodeCount * 3));
          emitter.emit({
            type: 'status',
            message: `${StatusMessages.BUILDING_GRAPH} (${nodeCount} nodes, ${linkCount} connections)`,
            progress: estimatedProgress
          });
        }
      }

      const finalObject = await object;
      return finalObject;
    }
  } catch (error) {
    emitter.emit({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error during graph generation',
      stage: 'graph-generation'
    });
    throw error;
  }
}