import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import { computeProgress } from '@/lib/progress';

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

export const showChatPanelTool = tool({
    name: 'show_chat_panel',
    description: 'Switches the view to the chat panel.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, setViewMode } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        setViewMode('chat');
        return 'Chat panel opened.';
    }
});

export const showGraphPanelTool = tool({
    name: 'show_graph_panel',
    description: 'Switches the view to the graph panel.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, setViewMode } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        setViewMode('graph');
        return 'Graph panel opened.';
    }
});

export const exitFullscreenTool = tool({
    name: 'exit_fullscreen',
    description: 'Exits fullscreen mode if active.',
    parameters: z.object({}),
    execute: async () => {
        const { isVoiceSessionActive, isGraphFullscreen, toggleGraphFullscreen } = useAppStore.getState();
        if (!isVoiceSessionActive) return 'Cannot execute tool: voice session is not active.';
        if (isGraphFullscreen) {
            toggleGraphFullscreen();
            return 'Exited fullscreen.';
        }
        return 'Fullscreen was not active.';
    }
});
