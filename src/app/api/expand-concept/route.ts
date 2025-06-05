import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import * as apiCache from '@/lib/apiCache';
import type { KnowledgeCard, ExpandedConceptData } from '@/types/intellea';

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

// Response structure
type ExpandedConceptResponse = ExpandedConceptData;

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
  const supabase = createClient();

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

    // Generate a stable hash for the graph/request
    const sessionId = data.user.id;
    const graphHash = apiCache.getGraphHash({ nodeId, nodeLabel, visualizationData, knowledgeCards });

    // 1. Check cache
    const cached = await apiCache.getCachedExpandedConcept(sessionId, graphHash);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 2. Try to acquire lock (SETNX with 5 min TTL)
    const lockAcquired = await apiCache.acquireLock(sessionId, graphHash, 300);
    if (!lockAcquired) {
      // Lock exists, return 202 with Retry-After
      const ttl = await apiCache.getLockTTL(sessionId, graphHash);
      return NextResponse.json(
        { error: 'Request in progress. Please retry later.', retryAfter: ttl > 0 ? ttl : 60 },
        { status: 202, headers: { 'Retry-After': (ttl > 0 ? ttl : 60).toString() } }
      );
    }

    let expandedData: ExpandedConceptResponse | null = null;
    try {
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
      expandedData = JSON.parse(content);

      // Basic validation - ensure expandedData is not null and has required properties
      if (!expandedData || !expandedData.title || !expandedData.content || !Array.isArray(expandedData.relatedConcepts)) {
        console.error('Invalid or empty response structure from OpenAI after parsing.', expandedData);
        throw new Error('Invalid response structure from AI service.'); // This will be caught by the outer try-catch
      }

      // 3. Cache the response (24h TTL)
      await apiCache.setCachedExpandedConcept(sessionId, graphHash, expandedData, 60 * 60 * 24);
    } catch (error: unknown) {
      console.error('Error expanding concept during OpenAI call or caching:', error);
      const message = error instanceof Error ? error.message : 'Failed to process expansion request.';
      return NextResponse.json({ error: message }, { status: 500 });
    } finally {
      // 4. Release the lock
      await apiCache.releaseLock(sessionId, graphHash);
    }

    // At this point, expandedData should be valid if no error was thrown and returned from above catch.
    // The previous null check before this return is now redundant due to the earlier robust check.
    // However, to be absolutely safe for the linter if it can't infer through the try/catch/finally, 
    // we can keep a check, or rely on the fact that if it were null, an error path would have been taken.
    // For robustness, if expandedData somehow became null without an error above (highly unlikely):
    if (!expandedData) {
        console.error('Critical internal error: expandedData is null before final return despite earlier checks.');
        return NextResponse.json({ error: 'Internal server error processing expansion.' }, { status: 500 });
    }

    // Return the expanded concept data
    return NextResponse.json(expandedData);
  } catch (error: unknown) {
    console.error('Outer error handler for /api/expand-concept:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
