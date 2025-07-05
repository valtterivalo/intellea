/**
 * @fileoverview OpenAI agent definition.
 * Exports: readExpandedConceptTool, readKnowledgeCardTool, scrollToKnowledgeCardsTool, showKnowledgeCardTool, updateKnowledgeCardTool
 */
import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';

export const showKnowledgeCardTool = tool({
  name: 'show_knowledge_card',
  description: 'Selects a node by its ID or label and scrolls the view to its corresponding knowledge card.',
  parameters: z.object({
    nodeId: z.string().optional().nullable().describe("The ID of the node to show."),
    nodeLabel: z.string().optional().nullable().describe("The label of the node to show. Use this if you don't know the ID."),
  }),
  execute: async ({ nodeId, nodeLabel }) => {
    const { isVoiceSessionActive, setSelectedNodeId, setActiveFocusPath, setScrollToNodeId, output } = useAppStore.getState();
    if (!isVoiceSessionActive) return "Cannot execute tool: voice session is not active.";
    const vizData = isIntelleaResponse(output) ? output.visualizationData : null;

    if (!vizData) {
      return "The knowledge graph is not visible, so I can't show a card.";
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
      setScrollToNodeId(targetNodeId);
      return `Showing the knowledge card for node ${targetNodeId}.`;
    }

    return `I could not find a node with ID "${nodeId}" or label "${nodeLabel}".`;
  },
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

export const updateKnowledgeCardTool = tool({
    name: 'update_knowledge_card',
    description: 'Updates the description of a knowledge card.',
    parameters: z.object({
        nodeId: z.string().optional().nullable().describe('ID of the node whose card should be updated'),
        nodeLabel: z.string().optional().nullable().describe('Label/title of the node if the ID is unknown'),
        newText: z.string().describe('The new description text')
    }),
    execute: async ({ nodeId, nodeLabel, newText }) => {
        const { isVoiceSessionActive, updateKnowledgeCard, output } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        if (!isIntelleaResponse(output) || !output.knowledgeCards) {
            return 'No knowledge cards are available to update.';
        }

        let targetNodeId = nodeId;
        if (!targetNodeId && nodeLabel) {
            const card = output.knowledgeCards.find(c => c.title.toLowerCase() === nodeLabel.toLowerCase());
            if (card) targetNodeId = card.nodeId;
            else {
                const node = output.visualizationData.nodes.find(n => n.label?.toLowerCase() === nodeLabel.toLowerCase());
                if (node) targetNodeId = node.id;
            }
        }

        if (!targetNodeId) {
            return `I could not find a node with ID "${nodeId}" or label "${nodeLabel}".`;
        }

        const exists = output.knowledgeCards.some(c => c.nodeId === targetNodeId);
        if (!exists) {
            return `No knowledge card found for node ${targetNodeId}.`;
        }

        updateKnowledgeCard(targetNodeId, newText);
        return `Updated knowledge card for node ${targetNodeId}.`;
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
