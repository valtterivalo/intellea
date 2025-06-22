import { Agent } from '@openai/agents';
import { ConceptExpanderAgent } from './conceptExpand';
import { GraphInitAgent } from './graphInit';
import { GraphExpansionAgent } from './graphExpansion';

const ROUTER_PROMPT = `You are Intellea's routing agent. You help users with knowledge graph creation, concept expansion, and graph expansion tasks.

Based on the user's request, you should:
1. If they want to create a new knowledge graph on a topic, handoff to the Graph Initializer Agent
2. If they want to expand an existing concept in detail, handoff to the Concept Expander Agent  
3. If they want to add new nodes/expand a knowledge graph, handoff to the Graph Expansion Agent
4. For general questions about how the system works or other queries, respond directly

Choose the appropriate agent based on the user's intent. If you're unsure, ask clarifying questions to better understand what they want to accomplish.`;

/**
 * Router agent that delegates requests to specialized agents based on user intent
 */
export const RouterAgent = new Agent({
    name: "router",
    instructions: ROUTER_PROMPT,
    handoffs: [GraphInitAgent, ConceptExpanderAgent, GraphExpansionAgent],
    model: "gpt-4o",
}); 