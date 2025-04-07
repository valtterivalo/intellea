'use client';

import React, { useCallback } from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import KnowledgeCard from './KnowledgeCard';
import { CollapsedKnowledgeCard } from './CollapsedKnowledgeCard';
import type { KnowledgeCardData } from '@/store/useAppStore';
import type { GraphData } from '@/store/useAppStore';
import type { NodeObject } from 'react-force-graph-3d';

// Helper type guard
function isCognitionResponse(output: any): output is CognitionResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'explanationMarkdown' in output &&
        'knowledgeCards' in output && Array.isArray(output.knowledgeCards) &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null && 'nodes' in output.visualizationData &&
        'quiz' in output
    );
}

const KnowledgeCardsSection: React.FC = () => {
    // Select necessary state and actions using useShallow
    const {
        knowledgeCards,
        visualizationNodes,
        activeFocusPathIds,
        setActiveFocusPath,
        output,
    } = useAppStore(
        useShallow((state) => ({
            knowledgeCards: isCognitionResponse(state.output) ? state.output.knowledgeCards : [],
            visualizationNodes: isCognitionResponse(state.output) ? state.output.visualizationData.nodes : [],
            activeFocusPathIds: state.activeFocusPathIds,
            setActiveFocusPath: state.setActiveFocusPath,
            output: state.output,
        }))
    );

    // Memoized focus handler
    const handleFocus = useCallback((nodeId: string) => {
        if (isCognitionResponse(output)) {
            setActiveFocusPath(nodeId, output.visualizationData);
        }
    }, [setActiveFocusPath, output]);

    // Filter out cards without a valid nodeId BEFORE processing
    const validKnowledgeCards = knowledgeCards?.filter(
        (card): card is KnowledgeCardData =>
            card && typeof card.nodeId === 'string' && card.nodeId.trim() !== '' && typeof card.title === 'string'
    ) || [];

    // Find the root node ID
    const rootNode = visualizationNodes.find((node: NodeObject) => node.isRoot);
    const rootNodeId = rootNode?.id;

    // Separate root card and child cards
    let rootCard: KnowledgeCardData | undefined;
    let childCards: KnowledgeCardData[] = [];

    if (rootNodeId) {
        rootCard = validKnowledgeCards.find(card => card.nodeId === rootNodeId);
        childCards = validKnowledgeCards.filter(card => card.nodeId !== rootNodeId);
    } else {
        childCards = validKnowledgeCards;
    }

    // Determine if any focus is active
    const isFocusActive = activeFocusPathIds !== null;

    // Only render if there are *any* valid cards (root or children)
    if (!rootCard && childCards.length === 0) {
        if (knowledgeCards && knowledgeCards.length > 0) {
            console.warn("KnowledgeCardsSection: Cards present but none valid or no root found.");
        }
        return null;
    }

    return (
        <>
            <Separator />
            <section className="mt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Knowledge Cards</h2>
                
                {rootCard && (
                    <motion.div
                        key={`root-${rootCard.nodeId}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                        className="w-full mb-6 flex justify-center px-4"
                    >
                        <div className="w-full max-w-2xl">
                            {isFocusActive && !activeFocusPathIds.has(rootCard.nodeId) ? (
                                <CollapsedKnowledgeCard
                                    nodeId={rootCard.nodeId}
                                    title={rootCard.title}
                                    onFocus={handleFocus}
                                />
                            ) : (
                                <KnowledgeCard card={rootCard} />
                            )}
                        </div>
                    </motion.div>
                )}

                {childCards.length > 0 && (
                     <>
                         {rootCard && <Separator className="mb-6"/>}
                         <h3 className="text-xl font-medium mb-4 text-center text-muted-foreground">Related Concepts</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
                            {childCards.map((card: KnowledgeCardData, index: number) => {
                                const isChildInFocusPath = !isFocusActive || activeFocusPathIds.has(card.nodeId);

                                return (
                                    <motion.div
                                        key={card.nodeId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { delay: index * 0.03, duration: 0.2 }
                                        }}
                                    >
                                        {isChildInFocusPath ? (
                                            <KnowledgeCard card={card} />
                                        ) : (
                                            <CollapsedKnowledgeCard
                                                nodeId={card.nodeId}
                                                title={card.title}
                                                onFocus={handleFocus}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                     </>
                )}
            </section>
        </>
    );
};

export default React.memo(KnowledgeCardsSection); 