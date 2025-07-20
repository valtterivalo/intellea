/**
 * @fileoverview Router agent with Kimi K2 support via Groq
 * Exports: RouterAgent
 */
import { Agent } from '@openai/agents';
import { ConceptExpanderAgent } from './conceptExpand';
import { GraphInitAgent } from './graphInit';
import { GraphExpansionAgent } from './graphExpansion';
import { DocumentAnalyzerAgent } from './documentAnalyzer';
import { getModel } from '../models/config';

const ROUTER_PROMPT = `You are Intellea's routing agent. You help users with knowledge graph creation, concept expansion, graph expansion, and document analysis tasks.

Based on the user's request, you should:
1. If they want to create a new knowledge graph on a topic, handoff to the Graph Initializer Agent
2. If they want to expand an existing concept in detail, handoff to the Concept Expander Agent  
3. If they want to add new nodes/expand a knowledge graph, handoff to the Graph Expansion Agent
4. If they have processed document content and want to create a knowledge graph from it, handoff to the Document Analyzer Agent
5. For general questions about how the system works or other queries, respond directly

The Document Analyzer Agent specializes in breaking down complex documents into first principles and creating knowledge graphs that reveal core concepts and their relationships.

Choose the appropriate agent based on the user's intent. If you're unsure, ask clarifying questions to better understand what they want to accomplish.`;

/**
 * Router agent that delegates requests to specialized agents based on user intent
 */
export const RouterAgent = new Agent({
    name: "router",
    instructions: ROUTER_PROMPT,
    handoffs: [GraphInitAgent, ConceptExpanderAgent, GraphExpansionAgent, DocumentAnalyzerAgent],
    model: getModel('kimi-k2'), // Use Kimi K2 via Groq with OpenAI fallback
}); 