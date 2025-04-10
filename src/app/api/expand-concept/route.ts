import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

// Simplified interface for visualization data
interface SanitizedNode {
  id: string;
  label: string;
  isRoot?: boolean;
}

interface SanitizedLink {
  source: string;
  target: string;
}

interface SanitizedVisualizationData {
  nodes: SanitizedNode[];
  links: SanitizedLink[];
}

// Knowledge Card interface
interface KnowledgeCard {
  nodeId: string;
  title: string;
  description: string;
}

// Response structure
interface ExpandedConceptResponse {
  title: string;
  content: string;
  relatedConcepts: Array<{
    nodeId: string;
    title: string;
    relation: string;
  }>;
}

// Ensure API keys are available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for concept expansion
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

export async function POST(req: NextRequest) {
  // Create Supabase client
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Verify user subscription
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      console.error("Authentication error:", authError?.message || "No user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify subscription status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      return NextResponse.json({ error: 'Error fetching subscription status' }, { status: 500 });
    }

    if (!profileData || (profileData.subscription_status !== 'active' && profileData.subscription_status !== 'trialing')) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 });
    }

    // Parse the request body
    const requestData = await req.json();
    const { nodeId, nodeLabel, visualizationData, knowledgeCards } = requestData;

    if (!nodeId || !nodeLabel) {
      return NextResponse.json({ error: 'Missing required fields: nodeId, nodeLabel' }, { status: 400 });
    }

    // Prepare the prompt for OpenAI
    const messages = [
      { role: 'system', content: EXPAND_CONCEPT_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          nodeToExpand: { id: nodeId, label: nodeLabel },
          visualizationData,
          knowledgeCards
        })
      }
    ];

    // Call the OpenAI API with enforced JSON response format
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as any,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // Extract and parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate the response
    let expandedData: ExpandedConceptResponse;
    try {
      expandedData = JSON.parse(content);
      
      // Basic validation
      if (!expandedData.title || !expandedData.content || !Array.isArray(expandedData.relatedConcepts)) {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', content);
      return NextResponse.json({ error: 'Failed to parse expanded concept data' }, { status: 500 });
    }

    // Return the expanded concept data
    return NextResponse.json(expandedData);
  } catch (error: any) {
    console.error('Error expanding concept:', error);
    return NextResponse.json({ error: error.message || 'Error expanding concept' }, { status: 500 });
  }
} 