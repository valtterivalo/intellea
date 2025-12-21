/**
 * @fileoverview Raw OpenAI API for initial graph generation with file support
 * Uses OpenAI Responses API directly for proper file handling
 * Exports: generateInitialGraphWithRawOpenAI
 */

import type { StreamEmitter } from '@/types/streaming';
import { StatusMessages } from '@/types/streaming';
import type { IntelleaResponse } from '@intellea/graph-schema';
import { getOpenAIClient } from '@/lib/openaiClient';

const SYSTEM_PROMPT = `You are Intellea, an expert AI assistant generating structured multi-parent hierarchical learning data for an interactive 3D graph visualization. Respond ONLY with a single, valid JSON object.

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
- Each node should have clear, informative descriptions
- Links should represent meaningful relationships between concepts
- Maintain academic rigor while being accessible

When documents are provided, analyze their content and create a knowledge graph that captures the key concepts and relationships from the documents, while also considering the user's specific request.

**JSON Schema:**
{
  "sessionTitle": "string",
  "explanationMarkdown": "string | null",
  "knowledgeCards": [
    {
      "nodeId": "string",
      "title": "string", 
      "description": "string"
    }
  ],
  "visualizationData": {
    "nodes": [
      {
        "id": "string",
        "label": "string", 
        "isRoot": "boolean",
        "depth": "number (0-3)",
        "parentIds": ["string"]
      }
    ],
    "links": [
      {
        "source": "string",
        "target": "string"
      }
    ]
  }
}`;

/**
 * Generate initial graph using raw OpenAI Responses API for proper file handling
 */
export async function generateInitialGraphWithRawOpenAI(
  prompt: string,
  emitter: StreamEmitter,
  fileIds: string[] = [],
  isDemo = false
): Promise<IntelleaResponse> {
  try {
    const openai = getOpenAIClient();
    if (isDemo && fileIds.length > 0) {
      throw new Error('File uploads are not available in demo mode. Please sign up for full access.');
    }

    emitter.emit({
      type: 'status',
      message: fileIds.length > 0 ? 'Analyzing document content...' : StatusMessages.ANALYZING_TOPIC,
      progress: 30
    });

    // Build content array for OpenAI Responses API
    const content: Array<{ type: 'input_text'; text: string } | { type: 'input_file'; file_id: string }> = [
      {
        type: 'input_text',
        text: prompt
      }
    ];

    // Add files using OpenAI file IDs
    if (fileIds.length > 0) {
      fileIds.forEach(fileId => {
        content.push({
          type: 'input_file',
          file_id: fileId
        });
      });
    }

    emitter.emit({
      type: 'status',
      message: StatusMessages.CREATING_CONNECTIONS,
      progress: 40
    });

    if (process.env.APP_DEBUG === 'true') {
      console.log('Using raw OpenAI Responses API with content:', 
        content.map(c => c.type === 'input_file' ? `file:${c.file_id}` : `text:${c.text?.substring(0, 50)}...`)
      );
    }

    // Use raw OpenAI Responses API for proper file handling
    const response = await openai.responses.create({
      model: isDemo ? 'gpt-5-mini' : 'gpt-5',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: SYSTEM_PROMPT
            }
          ]
        },
        {
          role: 'user',
          content: content
        }
      ]
    });

    emitter.emit({
      type: 'status',
      message: 'Processing response...',
      progress: 80
    });

    // Parse the JSON response
    let parsedResponse: IntelleaResponse;
    try {
      parsedResponse = JSON.parse(response.output_text);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', response.output_text);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate required fields
    if (!parsedResponse.visualizationData?.nodes || !parsedResponse.sessionTitle) {
      throw new Error('Missing required fields in OpenAI response');
    }

    if (process.env.APP_DEBUG === 'true') {
      console.log(`Generated graph with ${parsedResponse.visualizationData.nodes.length} nodes and ${parsedResponse.visualizationData.links?.length || 0} links`);
    }

    return parsedResponse;

  } catch (error) {
    console.error('Error in generateInitialGraphWithRawOpenAI:', error);
    emitter.emit({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error during graph generation',
      stage: 'graph-generation'
    });
    throw error;
  }
}
