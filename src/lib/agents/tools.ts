import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import { createClient } from '@/lib/supabase/client';
import { computeProgress } from '@/lib/progress';

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

export const searchAndSelectNodeTool = tool({
  name: 'search_and_select_node',
  description: 'Finds the first node whose label starts with the given text and selects it.',
  parameters: z.object({
    labelStartsWith: z.string().describe('Beginning of the node label to search for'),
  }),
  execute: async ({ labelStartsWith }) => {
    const { isVoiceSessionActive, output, setSelectedNodeId, setActiveFocusPath } = useAppStore.getState();
    if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
    const vizData = isIntelleaResponse(output) ? output.visualizationData : null;
    if (!vizData) {
      return "The knowledge graph is not visible, so I can't search for a node.";
    }
    const lower = labelStartsWith.toLowerCase();
    const found = vizData.nodes.find(n => (n.label || '').toLowerCase().startsWith(lower));
    if (found) {
      setSelectedNodeId(found.id);
      setActiveFocusPath(found.id, vizData);
      return `Node with label "${found.label}" has been selected.`;
    }
    return `I could not find any node starting with "${labelStartsWith}".`;
  }
});

export const focusNodeTool = tool({
  name: 'focus_node',
  description: 'Focuses the camera on a node by ID or label without selecting it.',
  parameters: z.object({
    nodeId: z.string().optional().nullable().describe('The ID of the node to focus.'),
    nodeLabel: z.string().optional().nullable().describe("The label of the node to focus. Use this if you don't know the ID."),
  }),
  execute: async ({ nodeId, nodeLabel }) => {
    const { isVoiceSessionActive, setFocusedNodeId, setActiveFocusPath, output } = useAppStore.getState();
    if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
    const vizData = isIntelleaResponse(output) ? output.visualizationData : null;
    if (!vizData) {
      return "The knowledge graph is not visible, so I can't focus a node.";
    }
    let targetNodeId = nodeId;
    if (!targetNodeId && nodeLabel) {
      const foundNode = vizData.nodes.find(n => n.label?.toLowerCase() === nodeLabel.toLowerCase());
      if (foundNode) {
        targetNodeId = foundNode.id;
      }
    }
    if (targetNodeId) {
      setFocusedNodeId(targetNodeId);
      setActiveFocusPath(targetNodeId, vizData);
      return `Focused on node ${targetNodeId}.`;
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
        const { isVoiceSessionActive, output, activePrompt, selectedNodeId, expandedConceptData, isGraphFullscreen, pinnedNodes, completedNodeIds } = useAppStore.getState();
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

        const pinnedCount = Object.keys(pinnedNodes).length;
        const progress = computeProgress(knowledgeCards?.length ?? 0, completedNodeIds);
        summary += `There are ${pinnedCount} pinned nodes.\n`;
        summary += `Completion progress is ${progress.toFixed(0)}%.\n`;

        return summary;
    }
});

export const scrollToKnowledgeCardsTool = tool({
    name: 'scroll_to_knowledge_cards',
    description: 'Smoothly scrolls the application view to the knowledge cards section.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, scrollToKnowledgeCards } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        scrollToKnowledgeCards();
        return 'Scrolled to the knowledge cards.';
    }
});

export const scrollToExplanationTool = tool({
    name: 'scroll_to_explanation',
    description: 'Smoothly scrolls the application view to the explanation section.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, scrollToExplanation } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        scrollToExplanation();
        return 'Scrolled to the explanation section.';
    }
});

export const readKnowledgeCardTool = tool({
    name: 'read_knowledge_card',
    description: 'Reads the description of a knowledge card, optionally including any personal note.',
    parameters: z.object({
        nodeId: z.string().optional().nullable().describe('ID of the node whose card should be read'),
        nodeLabel: z.string().optional().nullable().describe('Label/title of the node if the ID is unknown'),
    }),
    execute: async ({ nodeId, nodeLabel }) => {
        const { isVoiceSessionActive, output, nodeNotes } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        if (!isIntelleaResponse(output) || !output.knowledgeCards) {
            return 'No knowledge cards are available to read.';
        }

        let card = output.knowledgeCards.find(c => c.nodeId === nodeId);
        if (!card && nodeLabel) {
            card = output.knowledgeCards.find(c => c.title.toLowerCase() === nodeLabel.toLowerCase());
        }

        if (!card) {
            return `Could not find a knowledge card with ID "${nodeId}" or label "${nodeLabel}".`;
        }

        const note = nodeNotes[card.nodeId];
        return note ? `${card.description}\nNote: ${note}` : card.description;
    }
});

export const readExpandedConceptTool = tool({
    name: 'read_expanded_concept',
    description: 'Reads the explanation of the currently expanded concept including any personal note.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, expandedConceptData, nodeNotes, focusedNodeId } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        if (!expandedConceptData) {
            return 'No concept is currently expanded.';
        }
        const note = focusedNodeId ? nodeNotes[focusedNodeId] : undefined;
        return note ? `${expandedConceptData.content}\nNote: ${note}` : expandedConceptData.content;
    }
});

export const addNodeNoteTool = tool({
    name: 'add_node_note',
    description: 'Adds or updates a note for a node in the knowledge graph.',
    parameters: z.object({
        nodeId: z.string().optional().nullable().describe('The ID of the node to annotate.'),
        nodeLabel: z.string().optional().nullable().describe("The label of the node to annotate. Use this if you don't know the ID."),
        note: z.string().describe('The note to save for the node.')
    }),
    execute: async ({ nodeId, nodeLabel, note }) => {
        const { isVoiceSessionActive, setNodeNote, nodeNotes, output } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        let targetNodeId = nodeId;
        const vizData = isIntelleaResponse(output) ? output.visualizationData : null;
        if (!targetNodeId && nodeLabel && vizData) {
            const found = vizData.nodes.find(n => n.label?.toLowerCase() === nodeLabel.toLowerCase());
            if (found) targetNodeId = found.id;
        }
        if (!targetNodeId) {
            return `I could not find a node with ID "${nodeId}" or label "${nodeLabel}".`;
        }
        const existed = !!nodeNotes[targetNodeId];
        setNodeNote(targetNodeId, note);
        return existed
            ? `Updated note for node ${targetNodeId}.`
            : `Added note for node ${targetNodeId}.`;
    }
});

export const getNodeNoteTool = tool({
    name: 'get_node_note',
    description: 'Retrieves a previously saved note for a node.',
    parameters: z.object({
        nodeId: z.string().optional().nullable().describe('The ID of the node.'),
        nodeLabel: z.string().optional().nullable().describe("The label of the node. Use this if you don't know the ID.")
    }),
    execute: async ({ nodeId, nodeLabel }) => {
        const { isVoiceSessionActive, nodeNotes, output } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        let targetNodeId = nodeId;
        const vizData = isIntelleaResponse(output) ? output.visualizationData : null;
        if (!targetNodeId && nodeLabel && vizData) {
            const found = vizData.nodes.find(n => n.label?.toLowerCase() === nodeLabel.toLowerCase());
            if (found) targetNodeId = found.id;
        }
        if (!targetNodeId) {
            return `I could not find a node with ID "${nodeId}" or label "${nodeLabel}".`;
        }
        const note = nodeNotes[targetNodeId];
        return note ? note : `No note found for node ${targetNodeId}.`;
    }
});

export const markNodeLearnedTool = tool({
    name: 'mark_node_learned',
    description: 'Marks a node in the knowledge graph as learned.',
    parameters: z.object({
        nodeId: z.string().describe('The ID of the node that has been learned.')
    }),
    execute: async ({ nodeId }) => {
        const { isVoiceSessionActive, markCompleted } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        markCompleted(nodeId);
        return `Node ${nodeId} marked as learned.`;
    }
});

export const pinNodeTool = tool({
    name: 'pin_node',
    description: 'Pins a node in the knowledge graph so that it remains visible.',
    parameters: z.object({
        nodeId: z.string().describe('The ID of the node to pin.')
    }),
    execute: async ({ nodeId }) => {
        const { isVoiceSessionActive, pinNode } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        pinNode(nodeId);
        return `Node ${nodeId} pinned.`;
    }
});

export const unpinNodeTool = tool({
    name: 'unpin_node',
    description: 'Unpins a node in the knowledge graph.',
    parameters: z.object({
        nodeId: z.string().describe('The ID of the node to unpin.')
    }),
    execute: async ({ nodeId }) => {
        const { isVoiceSessionActive, unpinNode } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        unpinNode(nodeId);
        return `Node ${nodeId} unpinned.`;
    }
});
