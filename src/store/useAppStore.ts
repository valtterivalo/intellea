import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the structure for nodes and links (reuse from API)
interface GraphNode {
  id: string;
  label: string;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  [key: string]: any;
}

interface GraphExpansionData {
    nodes: GraphNode[];
    links: GraphLink[];
    knowledgeCards?: KnowledgeCard[]; // Added optional field
}

// Define structure for Knowledge Cards (matches API route)
interface KnowledgeCard {
  id: string; // Corresponds to a node ID
  title: string;
  description: string;
}

// Define the structure for the output we expect from the API
// Mirroring the interface in the API route
export interface CognitionResponse {
  explanationMarkdown: string;
  knowledgeCards?: KnowledgeCard[]; // Updated field
  visualizationData?: GraphExpansionData;
  quiz?: { question: string; options: string[]; correctAnswerLetter: string };
}

// Define the overall application state
interface AppState {
  prompt: string;
  setPrompt: (prompt: string) => void;
  activePrompt: string | null; // Add state for the prompt that generated the output
  setActivePrompt: (prompt: string | null) => void; // Add setter
  // Output can be the structured response, null (initial/cleared), or a string (for errors)
  output: CognitionResponse | null | string;
  setOutput: (output: CognitionResponse | null | string) => void;
  addGraphExpansion: (expansionData: GraphExpansionData) => void; // New action
  updateNodePositions: (nodesWithPositions: GraphNode[]) => void; // New action
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  focusedNodeId: string | null; // Add state for focused node
  setFocusedNodeId: (id: string | null) => void; // Add action for focusing
  expandingNodeId: string | null; // Add state for node currently being expanded
  setExpandingNodeId: (id: string | null) => void; // Add action for expansion state
}

// Revert to create<AppState>()(persist(...)) structure
// but keep the explicit Pick type for partialize
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      prompt: '',
      setPrompt: (prompt) => set({ prompt }),
      activePrompt: null, // Initialize activePrompt
      setActivePrompt: (activePrompt) => set({ activePrompt }), // Add setter logic
      output: null,
      setOutput: (output) => set({ output }),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      focusedNodeId: null, // Initialize focus state
      setFocusedNodeId: (id) => set({ focusedNodeId: id }), // Implement focus action
      expandingNodeId: null, // Initialize expanding node state
      setExpandingNodeId: (id) => set({ expandingNodeId: id }), // Implement expansion state action

      // Action to merge graph expansion data (nodes, links, and knowledge cards)
      addGraphExpansion: (expansionData) => {
        const currentOutput = get().output; // Get current state
        
        // Check if currentOutput is valid and contains visualizationData
        if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
          const existingNodes = currentOutput.visualizationData.nodes || [];
          const existingLinks = currentOutput.visualizationData.links || [];
          // Extract nodes, links, and potentially knowledge cards from expansion data
          const { nodes: newNodes, links: newLinks, knowledgeCards: newKnowledgeCards } = expansionData;

          // --- Deduplicate Nodes --- 
          const existingNodeIds = new Set(existingNodes.map(n => n.id));
          const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id));

          // --- Deduplicate Links --- 
          const existingLinkKeys = new Set(existingLinks.map(l => `${l.source}->${l.target}`));
          const uniqueNewLinks = newLinks.filter(l => {
              // Ensure source/target are properly resolved to string IDs
              const sourceId = (typeof l.source === 'object' && l.source !== null) ? (l.source as GraphNode).id : l.source;
              const targetId = (typeof l.target === 'object' && l.target !== null) ? (l.target as GraphNode).id : l.target;
              // Check if the string representation of the link exists
              return !existingLinkKeys.has(`${sourceId}->${targetId}`);
          });
          
          // --- Deduplicate Knowledge Cards --- 
          const existingKnowledgeCards = currentOutput.knowledgeCards || [];
          const existingCardIds = new Set(existingKnowledgeCards.map(c => c.id));
          const uniqueNewKnowledgeCards = (newKnowledgeCards || []).filter(c => !existingCardIds.has(c.id));

          // Check if there's anything new to add
          if (uniqueNewNodes.length === 0 && uniqueNewLinks.length === 0 && uniqueNewKnowledgeCards.length === 0) {
            console.log("addGraphExpansion: No new unique nodes, links, or knowledge cards to add.");
            return; // Nothing to update
          }

          // Create the new, merged visualization data
          const mergedVisualizationData: GraphExpansionData = {
            nodes: [...existingNodes, ...uniqueNewNodes],
            links: [...existingLinks, ...uniqueNewLinks],
            // knowledgeCards are handled separately in the main output object
          };
          
          // Create the new, merged knowledge cards array
          const mergedKnowledgeCards = [...existingKnowledgeCards, ...uniqueNewKnowledgeCards];

          // Create the updated output object immutably
          const updatedOutput: CognitionResponse = {
            ...currentOutput,
            visualizationData: mergedVisualizationData, // Updated graph data
            knowledgeCards: mergedKnowledgeCards, // Updated knowledge cards
          };

          console.log(`addGraphExpansion: Merged data. Total nodes: ${mergedVisualizationData.nodes.length}, Total links: ${mergedVisualizationData.links.length}, Total cards: ${mergedKnowledgeCards.length}`);
          
          // Update the state
          set({ output: updatedOutput });
        } else {
          console.error("addGraphExpansion: Cannot add expansion data because current output is not a valid object or lacks visualizationData.");
        }
      },
      
      // New action to update node positions
      updateNodePositions: (nodesWithPositions) => {
        const currentOutput = get().output;
        if (typeof currentOutput === 'object' && currentOutput !== null && currentOutput.visualizationData) {
            // Create a map for efficient lookup, including only necessary props + fx, fy, fz
            const positionMap = new Map(nodesWithPositions.map(node => [
                node.id,
                { 
                    x: node.x, y: node.y, z: node.z, 
                    fx: node.x, fy: node.y, fz: node.z // Set fixed positions
                }
            ]));
            
            // Create new nodes array with updated positions and fixed coordinates
            const updatedNodes = currentOutput.visualizationData.nodes.map(node => {
                const positionData = positionMap.get(node.id);
                if (positionData) {
                    // Create a *new* node object, merging original props with new positions
                    // Important: Exclude internal props like index, vx, vy, vz, __threeObj
                    const { index, vx, vy, vz, __threeObj, ...originalProps } = node;
                    return { 
                        ...originalProps, // Spread original properties (like id, label)
                        ...positionData  // Add x, y, z and fx, fy, fz
                    }; 
                }
                // If somehow a node doesn't have position data (shouldn't happen), return original
                console.warn(`updateNodePositions: Position data not found for node ${node.id}`);
                return node; 
            });

            // Create the updated output object immutably
            const updatedOutput: CognitionResponse = {
                ...currentOutput,
                visualizationData: {
                    ...currentOutput.visualizationData,
                    nodes: updatedNodes, // Use the nodes with updated fixed positions
                },
            };

            // Set the state, triggering persistence
            console.log("updateNodePositions: Updated store with fixed node positions (fx, fy, fz). First node:", updatedNodes[0]);
            set({ output: updatedOutput });
        } else {
             console.warn("updateNodePositions: Cannot update positions, current output is invalid or missing visualizationData.");
        }
      },
    }),
    {
      name: 'cognition-app-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage
      // Explicitly type the return value of partialize
      partialize: (state: AppState): Pick<AppState, 'prompt' | 'activePrompt' | 'output'> => ({ 
          prompt: state.prompt,
          activePrompt: state.activePrompt,
          output: state.output,
          // Note: focusedNodeId and expandingNodeId are intentionally NOT persisted
      }), // Only persist these parts of the state
    }
  )
); 