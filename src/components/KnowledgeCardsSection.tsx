'use client';

import React, { useCallback, useMemo } from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import KnowledgeCard from './KnowledgeCard';
import { CollapsedKnowledgeCard } from './CollapsedKnowledgeCard';
import type { KnowledgeCardData, GraphData, NodeObject, LinkObject } from '@/store/useAppStore';

// Helper type guard (ensure it's robust)
function isCognitionResponse(output: any): output is CognitionResponse {
    return (
        typeof output === 'object' &&
        output !== null &&
        'explanationMarkdown' in output &&
        'knowledgeCards' in output && Array.isArray(output.knowledgeCards) &&
        'visualizationData' in output && typeof output.visualizationData === 'object' && output.visualizationData !== null && 'nodes' in output.visualizationData && Array.isArray(output.visualizationData.nodes) && 'links' in output.visualizationData && Array.isArray(output.visualizationData.links) &&
        'quiz' in output
    );
}

const KnowledgeCardsSection: React.FC = () => {
    const {
        knowledgeCards,
        visualizationData,
        activeClickedNodeId,
        setActiveFocusPath,
    } = useAppStore(
        useShallow((state) => ({
            knowledgeCards: isCognitionResponse(state.output) ? state.output.knowledgeCards : [],
            visualizationData: isCognitionResponse(state.output) ? state.output.visualizationData : null,
            activeClickedNodeId: state.activeClickedNodeId,
            setActiveFocusPath: state.setActiveFocusPath,
        }))
    );

    const handleFocus = useCallback((nodeId: string) => {
        setActiveFocusPath(nodeId, visualizationData);
    }, [setActiveFocusPath, visualizationData]);

    // --- Refactored Memoization Logic ---
    const {
        rootCard,
        ancestorLevels, // Array of levels, each level is an array of cards
        focusedCard,
        childCards,
        otherCards,
        isFocusActive
    } = useMemo(() => {
        const validCards = knowledgeCards?.filter(
            (card): card is KnowledgeCardData =>
                card && typeof card.nodeId === 'string' && card.nodeId.trim() !== '' && typeof card.title === 'string'
        ) || [];
        
        const cardsMap = new Map(validCards.map(card => [card.nodeId, card]));
        const rootNode = visualizationData?.nodes.find((node: NodeObject) => node.isRoot);
        const rootCardData = rootNode?.id ? cardsMap.get(rootNode.id) : undefined;

        const currentFocusActive = activeClickedNodeId !== null && visualizationData !== null && cardsMap.has(activeClickedNodeId);
        
        let levels: KnowledgeCardData[][] = [];
        let focused: KnowledgeCardData | undefined;
        let children: KnowledgeCardData[] = [];
        let others: KnowledgeCardData[] = [];
        let allFocusPathIds = new Set<string>(); // IDs in focus path (ancestors, focused, children)

        if (currentFocusActive) {
            focused = cardsMap.get(activeClickedNodeId)!; // We know it exists from currentFocusActive check
            allFocusPathIds.add(activeClickedNodeId);

            // --- BFS Upwards for Ancestors ---
            const parentLinks = new Map<string, string[]>(); // Map: childId -> [parentId1, parentId2, ...]
            visualizationData.links.forEach((link: LinkObject) => {
                const sourceId = typeof link.source === 'object' && link.source !== null ? (link.source as NodeObject).id : link.source as string;
                const targetId = typeof link.target === 'object' && link.target !== null ? (link.target as NodeObject).id : link.target as string;
                if (sourceId && targetId) {
                    if (!parentLinks.has(targetId)) parentLinks.set(targetId, []);
                    parentLinks.get(targetId)!.push(sourceId);
                }
            });

            let currentLevelIds = new Set<string>([activeClickedNodeId]);
            const visited = new Set<string>([activeClickedNodeId]);

            while (currentLevelIds.size > 0) {
                const parentLevelIds = new Set<string>();
                const parentLevelCards: KnowledgeCardData[] = [];

                currentLevelIds.forEach(childId => {
                    parentLinks.get(childId)?.forEach(parentId => {
                        if (!visited.has(parentId)) {
                            visited.add(parentId);
                            parentLevelIds.add(parentId);
                            allFocusPathIds.add(parentId); // Add ancestor to focus path
                            const card = cardsMap.get(parentId);
                            if (card) parentLevelCards.push(card);
                        }
                    });
                });

                if (parentLevelCards.length > 0) {
                    levels.push(parentLevelCards);
                }
                currentLevelIds = parentLevelIds; // Move to the next level up
                 if (visited.has(rootNode?.id || '')) break; // Stop if root is reached (optional optimization)
            }
            // levels array now contains ancestors, level 0 = parents, level 1 = grandparents, etc.

            // --- Find Direct Children ---
            visualizationData.links.forEach((link: LinkObject) => {
                const sourceId = typeof link.source === 'object' && link.source !== null ? (link.source as NodeObject).id : link.source as string;
                const targetId = typeof link.target === 'object' && link.target !== null ? (link.target as NodeObject).id : link.target as string;
                if (sourceId === activeClickedNodeId && targetId) {
                     const card = cardsMap.get(targetId);
                     if (card) {
                        children.push(card);
                        allFocusPathIds.add(targetId); // Add child to focus path
                     }
                }
            });

             // --- Find Others ---
             validCards.forEach(card => {
                if (!allFocusPathIds.has(card.nodeId)) {
                    others.push(card);
                }
            });

        } else {
            // Inactive state: treat all non-root as 'children' for initial grid
            validCards.forEach(card => {
                if (card.nodeId !== rootNode?.id) {
                    children.push(card);
                }
            });
        }

        return {
            rootCard: rootCardData,
            ancestorLevels: levels.reverse(), // Reverse so root is first element
            focusedCard: focused,
            childCards: children,
            otherCards: others,
            isFocusActive: currentFocusActive
        };
    }, [knowledgeCards, visualizationData, activeClickedNodeId]);
    // --- End Refactored Memoization ---

    // Add console log to inspect calculated data
    console.log("Knowledge Section Render - Focus Active:", isFocusActive, "Focused:", focusedCard?.nodeId, "Ancestors:", ancestorLevels, "Children:", childCards);

    // Only render if there's something to show
    if (!rootCard && ancestorLevels.length === 0 && !focusedCard && childCards.length === 0 && otherCards.length === 0) {
        if (knowledgeCards && knowledgeCards.length > 0) {
             console.warn("KnowledgeCardsSection: Cards present but none were mapped correctly.");
        }
        return null;
    }
    
    // --- Updated renderCardList Helper ---
    const renderCardList = (
        cards: KnowledgeCardData[],
        alwaysExpand: boolean = false,
        layoutDirection: 'vertical' | 'horizontal' = 'vertical',
        maxWidthClass: string = 'max-w-none',
        variant: 'default' | 'focused' = 'default'
    ) => {
        return cards.map((card, index) => {
            let baseClass = '';
            let useMotionDiv = true;

            if (layoutDirection === 'horizontal') {
                baseClass = 'flex-shrink-0 w-48';
            } else { // layoutDirection is 'vertical'
                if (maxWidthClass !== 'max-w-none') {
                    baseClass = maxWidthClass;
                    useMotionDiv = false;
                } else {
                    baseClass = 'w-full'; // Focused card
                }
            }

            const cardElement = alwaysExpand ? (
                <KnowledgeCard card={card} variant={variant} />
            ) : (
                <CollapsedKnowledgeCard
                    nodeId={card.nodeId}
                    title={card.title}
                    onFocus={handleFocus}
                />
            );

            if (useMotionDiv) {
                 return (
                    <motion.div
                        key={card.nodeId}
                        layout
                        initial={{ opacity: 0, y: layoutDirection === 'vertical' ? 10 : 0, x: layoutDirection === 'horizontal' ? 10 : 0 }}
                        animate={{ opacity: 1, y: 0, x: 0, transition: { delay: index * 0.03, duration: 0.2 } }}
                        className={baseClass}
                    >
                         {cardElement}
                    </motion.div>
                );
            } else {
                return (
                    <div
                        key={card.nodeId}
                        className={baseClass}
                    >
                        {cardElement}
                    </div>
                );
            }
        });
    }
    // --- End Updated Helper ---

    // Function to get level name (Root, Parents, Grandparents...)
    const getLevelName = (levelIndex: number, totalLevels: number): string => {
        if (levelIndex === 0) return "Root";
        const depth = totalLevels - levelIndex;
        if (depth === 1) return "Parents";
        if (depth === 2) return "Grandparents";
        return `Level ${levelIndex + 1} Ancestors`;
    }

    return (
        <>
            <Separator />
            <section className="mt-6 px-4 overflow-hidden">
                <h2 className="text-2xl font-semibold mb-6 text-center">Knowledge Cards</h2>

                {isFocusActive ? (
                    <div className="flex flex-col items-center gap-8">

                        {/* --- Render Ancestor Levels --- */}
                        {ancestorLevels.map((levelCards, levelIndex) => (
                            <React.Fragment key={`level-${levelIndex}`}> 
                                <p className="w-full text-center text-sm font-medium text-muted-foreground">{getLevelName(levelIndex, ancestorLevels.length)}</p>
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(levelCards, true, 'vertical', 'max-w-xl')}
                                </div>
                                {levelIndex < ancestorLevels.length && <Separator className="w-1/2 my-4"/>}
                            </React.Fragment>
                        ))}

                        {/* --- Render Focused Card --- */}
                        {focusedCard && (
                            <div key="focused" className="w-full flex flex-col items-center gap-3">
                                <p className="text-sm font-medium text-muted-foreground">Focused Concept</p>
                                <div className="flex justify-center w-full">
                                    <div className="min-w-[320px] max-w-[480px] w-full">
                                        {renderCardList([focusedCard], true, 'vertical', 'max-w-none', 'focused')}
                                    </div>
                                </div>
                                {(childCards.length > 0 || (ancestorLevels.length > 0 && focusedCard)) && <Separator className="w-1/2 my-4"/>}
                            </div>
                        )}

                        {/* --- Render Children Grid --- */}
                        {childCards.length > 0 && (
                            <React.Fragment key="children"> 
                                <p className="w-full text-center text-sm font-medium text-muted-foreground">Direct Children</p>
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(childCards, true, 'vertical', 'max-w-xl')}
                                </div>
                            </React.Fragment>
                        )}

                        {/* --- Render Other Collapsed Cards (Horizontal Scroll) --- */}
                        {otherCards.length > 0 && (
                            <div key="others" className="w-full flex flex-col items-center gap-2 mt-6 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Other Concepts</p>
                                <div className="w-full overflow-x-auto pb-4">
                                    <div className="min-w-fit mx-auto w-max flex flex-row flex-nowrap gap-3 px-2">
                                        {renderCardList(otherCards, false, 'horizontal')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- Focus INACTIVE Layout (Root + Grid) ---
                    <div className="flex flex-col items-center gap-6">
                        {rootCard && (
                            <motion.div 
                                key={`root-${rootCard.nodeId}`}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                className="w-full flex justify-center"
                            > 
                                <KnowledgeCard card={rootCard} variant="focused" />
                            </motion.div>
                        )}
                        {childCards.length > 0 && (
                            <>
                                {rootCard && <Separator className="w-full max-w-4xl my-6"/>}
                                <h3 className="text-xl font-medium mb-4 text-center text-muted-foreground">Related Concepts</h3>
                                {/* Render initial children expanded in a grid */} 
                                <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mx-auto">
                                    {renderCardList(childCards, true, 'vertical', 'max-w-xl')}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </section>
        </>
    );
};

export default React.memo(KnowledgeCardsSection); 