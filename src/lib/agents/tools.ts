import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import { createClient } from '@/lib/supabase/client';

export const selectNodeTool = tool({
  name: 'select_node',
  description: 'Selects a node in the knowledge graph by its ID or label. This will highlight the node and focus the camera on it.',
  parameters: z.object({
    nodeId: z.string().optional().nullable().describe("The ID of the node to select."),
    nodeLabel: z.string().optional().nullable().describe("The label of the node to select. Use this if you don't know the ID."),
  }),
  execute: async ({ nodeId, nodeLabel }) => {
    const { isVoiceSessionActive, setSelectedNodeId, setActiveFocusPath, output } = useAppStore.getState();
    if (!isVoiceSessionActive) return "Cannot execute tool: voice session is not active.";
    const vizData = isIntelleaResponse(output) ? output.visualizationData : null;

    if (!vizData) {
      return "The knowledge graph is not visible, so I can't select a node.";
    }

    let targetNodeId = nodeId;
    if (!targetNodeId && nodeLabel) {
      const foundNode = vizData.nodes.find(n => n.label?.toLowerCase() === nodeLabel.toLowerCase());
      if (foundNode) {
        targetNodeId = foundNode.id;
      }
    }

    if (targetNodeId) {
      setSelectedNodeId(targetNodeId);
      setActiveFocusPath(targetNodeId, vizData);
      return `Node with ID ${targetNodeId} has been selected and focused.`;
    }

    return `I could not find a node with ID "${nodeId}" or label "${nodeLabel}". Please try again with a valid ID or label.`;
  },
});

export const expandNodeTool = tool({
  name: 'expand_node',
  description: 'Expands a node to show more details about a concept. This will open a detailed view of the concept.',
  parameters: z.object({
    nodeId: z.string().optional().nullable().describe("The ID of the node to expand. If not provided, the currently selected node will be used."),
    nodeLabel: z.string().optional().nullable().describe("The label of the node to expand. Use this if you don't know the ID."),
  }),
  execute: async ({ nodeId, nodeLabel }) => {
    const { isVoiceSessionActive, expandConcept, selectedNodeId, output } = useAppStore.getState();
    if (!isVoiceSessionActive) return "Cannot execute tool: voice session is not active.";
    
    if (!isIntelleaResponse(output)) {
      return "Cannot expand a node, the graph is not visible.";
    }

    let targetNodeId = nodeId || selectedNodeId;
    let targetNodeLabel = nodeLabel;

    if (!targetNodeId && targetNodeLabel) {
        const foundNode = output.visualizationData.nodes.find(n => n.label?.toLowerCase() === targetNodeLabel?.toLowerCase());
        if(foundNode) {
            targetNodeId = foundNode.id;
        }
    }

    if (!targetNodeId) {
      return "I need a node to expand. Please select a node first or specify which node to expand.";
    }
    
    if(!targetNodeLabel) {
        const foundNode = output.visualizationData.nodes.find(n => n.id === targetNodeId);
        if(foundNode) {
            targetNodeLabel = foundNode.label;
        }
    }
    
    if(!targetNodeLabel){
        return `Could not find a label for node ${targetNodeId}.`;
    }

    try {
      const supabase = createClient();
      await expandConcept(targetNodeId, targetNodeLabel, supabase);
      return `Expanding concept: ${targetNodeLabel}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return `Failed to expand concept: ${message}`;
    }
  }
});

export const zoomToFitGraphTool = tool({
  name: 'zoom_to_fit_graph',
  description: 'Zooms and pans the graph so that all nodes fit within view.',
  parameters: z.object({}),
  execute: async () => {
    const { isVoiceSessionActive, zoomGraphToFit } = useAppStore.getState();
    if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
    zoomGraphToFit();
    return 'Graph view adjusted to fit all nodes.';
  }
});

export const toggleGraphFullscreenTool = tool({
    name: 'toggle_graph_fullscreen',
    description: 'Toggles the graph view between fullscreen and normal view.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, toggleGraphFullscreen } = useAppStore.getState();
        if (!isVoiceSessionActive) return "Cannot execute tool: voice session is not active.";
        toggleGraphFullscreen();
        const fullscreen = useAppStore.getState().isGraphFullscreen;
        return `Graph fullscreen mode is now ${fullscreen ? 'on' : 'off'}.`;
    }
});

export const getCurrentViewContextTool = tool({
    name: 'get_current_view_context',
    description: "Gets a summary of what is currently visible on the user's screen, including the main topic, visible nodes in the graph, and any open panels.",
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, output, activePrompt, selectedNodeId, expandedConceptData, isGraphFullscreen } = useAppStore.getState();
        if (!isVoiceSessionActive) return "Cannot execute tool: voice session is not active.";

        if (!isIntelleaResponse(output)) {
            return "The main topic has not been generated yet. The user sees a search bar.";
        }

        const { visualizationData, knowledgeCards } = output;
        const nodes = visualizationData.nodes;
        const links = visualizationData.links;

        let summary = `The main topic is "${activePrompt}".\n`;

        if (expandedConceptData) {
            summary += `The user is currently viewing a detailed explanation of "${expandedConceptData.title}".\n`;
        } else if (isGraphFullscreen) {
            summary += "The knowledge graph is in fullscreen view.\n";
        } else {
             summary += "The main view with the knowledge graph and knowledge cards is visible.\n";
        }

        summary += `The graph has ${nodes.length} nodes and ${links.length} links visible.\n`;

        if (selectedNodeId) {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            if (selectedNode) {
                summary += `The currently selected node is "${selectedNode.label}".\n`;
            }
        } else {
            summary += "No node is currently selected.\n";
        }

        if (knowledgeCards && knowledgeCards.length > 0) {
            summary += `There are ${knowledgeCards.length} knowledge cards displayed, including topics like: ${knowledgeCards.slice(0, 3).map(c => `"${c.title}"`).join(', ')}.\n`;
        }

        return summary;
    }
}); 