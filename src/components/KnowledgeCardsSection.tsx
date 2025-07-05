'use client';
/**
 * @fileoverview Scrollable list of knowledge cards.
 * Exports KnowledgeCardsSection.
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppStore, KnowledgeCard as KnowledgeCardType } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import KnowledgeCard from './KnowledgeCard';
import { CollapsedKnowledgeCard } from './CollapsedKnowledgeCard';
import type { NodeObject, LinkObject } from '@/store/useAppStore';


const KnowledgeCardsSection: React.FC = () => {
    const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    // Get raw output first to debug
    const rawOutput = useAppStore(state => state.output);
    
    // Add debug log to show what data we have in the store
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("DEBUG KnowledgeCardsSection - Store output:",
        typeof rawOutput === 'object' ? {
            type: 'object',
            hasCards: rawOutput?.knowledgeCards ? true : false,
            hasViz: rawOutput?.visualizationData ? true : false
        } : typeof rawOutput);

    // FIXED: Properly check the state structure
    const knowledgeCards = useAppStore(state => {
        const output = state.output;
        return (output && typeof output === 'object' && 'knowledgeCards' in output && Array.isArray(output.knowledgeCards)) 
            ? output.knowledgeCards 
            : [];
    });
    
    const visualizationData = useAppStore(state => {
        const output = state.output;
        return (output && typeof output === 'object' && 'visualizationData' in output && 
               typeof output.visualizationData === 'object' && output.visualizationData !== null)
            ? output.visualizationData
            : null;
    });
    
    const activeClickedNodeId = useAppStore(state => state.activeClickedNodeId);
    const setActiveFocusPath = useAppStore(state => state.setActiveFocusPath);
    const scrollToNodeId = useAppStore(state => state.scrollToNodeId);
    const setScrollToNodeId = useAppStore(state => state.setScrollToNodeId);

    // Debug the actual values we're getting from selectors
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("DEBUG KnowledgeCardsSection - After selectors:", {
        cardsLength: knowledgeCards?.length || 0,
        hasVizData: !!visualizationData,
        activeClickedNodeId
    });

    const handleFocus = useCallback((nodeId: string) => {
        setActiveFocusPath(nodeId, visualizationData);
    }, [setActiveFocusPath, visualizationData]);

    useEffect(() => {
        if (scrollToNodeId) {
            const element = cardRefs.current.get(scrollToNodeId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Reset the trigger after scrolling
            setScrollToNodeId(null);
        }
    }, [scrollToNodeId, setScrollToNodeId]);

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
            (card): card is KnowledgeCardType =>
                card && typeof card.nodeId === 'string' && card.nodeId.trim() !== '' && typeof card.title === 'string'
        ) || [];
        
        const cardsMap = new Map(validCards.map(card => [card.nodeId, card]));
        const rootNode = visualizationData?.nodes.find((node: NodeObject) => node.isRoot);
        const rootCardData = rootNode?.id ? cardsMap.get(rootNode.id) : undefined;

        const currentFocusActive = activeClickedNodeId !== null && visualizationData !== null && cardsMap.has(activeClickedNodeId);
        
        const levels: KnowledgeCardType[][] = [];
        let focused: KnowledgeCardType | undefined;
        const children: KnowledgeCardType[] = [];
        const others: KnowledgeCardType[] = [];
        const allFocusPathIds = new Set<string>(); // IDs in focus path (ancestors, focused, children)

        if (currentFocusActive) {
            focused = cardsMap.get(activeClickedNodeId)!; // We know it exists from currentFocusActive check
            allFocusPathIds.add(activeClickedNodeId);

            // --- FIXED: Build parent/child relationships from links ---
            // We need two separate maps: one for parents and one for children
            const parentMap = new Map<string, Set<string>>(); // Map: childId -> Set(parentId1, parentId2, ...)
            const childMap = new Map<string, Set<string>>(); // Map: parentId -> Set(childId1, childId2, ...)
            
            // Process links to populate both maps correctly
            visualizationData.links.forEach((link: LinkObject) => {
                const sourceId = typeof link.source === 'object' && link.source !== null ? (link.source as NodeObject).id : link.source as string;
                const targetId = typeof link.target === 'object' && link.target !== null ? (link.target as NodeObject).id : link.target as string;
                
                if (sourceId && targetId) {
                    // Add to parent map (target's parent is source)
                    if (!parentMap.has(targetId)) parentMap.set(targetId, new Set());
                    parentMap.get(targetId)!.add(sourceId);
                    
                    // Add to child map (source's child is target)
                    if (!childMap.has(sourceId)) childMap.set(sourceId, new Set());
                    childMap.get(sourceId)!.add(targetId);
                }
            });

            // --- Find direct children using childMap ---
            const directChildIds = childMap.get(activeClickedNodeId) || new Set();
            directChildIds.forEach(childId => {
                const card = cardsMap.get(childId);
                if (card) {
                    children.push(card);
                    allFocusPathIds.add(childId);
                }
            });

            // --- BFS Upwards for Ancestors using parentMap, ensuring only the actual root is at the top level ---
            // Identify the true root node once and ensure it's the only one recognized as root
            const rootNodeId = rootNode?.id || '';
            const isRootNode = (id: string) => id === rootNodeId;
            
            let currentLevelIds = new Set<string>([activeClickedNodeId]);
            const visited = new Set<string>([activeClickedNodeId]);

            while (currentLevelIds.size > 0) {
                const parentLevelIds = new Set<string>();
                const parentLevelCards: KnowledgeCardType[] = [];

                // For each node in current level, find its parents
                currentLevelIds.forEach(childId => {
                    const parents = parentMap.get(childId) || new Set();
                    parents.forEach(parentId => {
                        // Skip if we've already visited this node or if it's the root
                        // Root will be handled separately to ensure it's always at the top level
                        if (!visited.has(parentId) && !isRootNode(parentId)) {
                            visited.add(parentId);
                            parentLevelIds.add(parentId);
                            allFocusPathIds.add(parentId);
                            const card = cardsMap.get(parentId);
                            if (card) parentLevelCards.push(card);
                        }
                    });
                });

                if (parentLevelCards.length > 0) {
                    levels.push(parentLevelCards);
                }
                currentLevelIds = parentLevelIds; // Move to the next level up
            }
            
            // Add the root node as the final (but will become first after reverse) level
            // But only if it's not already the focused node and it exists
            if (rootNodeId && rootNodeId !== activeClickedNodeId && !visited.has(rootNodeId)) {
                const rootCard = cardsMap.get(rootNodeId);
                if (rootCard) {
                    levels.push([rootCard]);
                    allFocusPathIds.add(rootNodeId);
                }
            }

            // --- Find Others (cards not in focus path) ---
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
    if (process.env.NEXT_PUBLIC_DEBUG === "true") console.log("Knowledge Section Render - Focus Active:", isFocusActive, "Focused:", focusedCard?.nodeId, "Ancestors:", ancestorLevels, "Children:", childCards);

    // Only render if there's something to show
    if (!rootCard && ancestorLevels.length === 0 && !focusedCard && childCards.length === 0 && otherCards.length === 0) {
        if (knowledgeCards && knowledgeCards.length > 0) {
             console.warn("KnowledgeCardsSection: Cards present but none were mapped correctly.");
        }
        return null;
    }
    
    // --- Updated renderCardList Helper ---
    const renderCardList = (
        cards: KnowledgeCardType[],
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

            const setRef = (el: HTMLDivElement | null) => {
                cardRefs.current.set(card.nodeId, el);
            };

            if (useMotionDiv) {
                 return (
                    <motion.div
                        key={card.nodeId}
                        layout
                        initial={{ opacity: 0, y: layoutDirection === 'vertical' ? 10 : 0, x: layoutDirection === 'horizontal' ? 10 : 0 }}
                        animate={{ opacity: 1, y: 0, x: 0, transition: { delay: index * 0.03, duration: 0.2 } }}
                        className={baseClass}
                        ref={setRef}
                    >
                         {cardElement}
                    </motion.div>
                );
            } else {
                return (
                    <div
                        key={card.nodeId}
                        className={baseClass}
                        ref={setRef}
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
                                {childCards.length > 0 && <Separator className="w-1/2 my-4"/>}
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
                            <div key="others" className="w-full flex flex-col items-center gap-4 mt-8">
                                <p className="text-sm text-muted-foreground mb-2">Other Concepts</p>
                                <ScrollArea className="w-full max-w-5xl rounded-md border whitespace-nowrap">
                                    <div className="flex w-max space-x-3 p-3">
                                        {otherCards.map((card) => (
                                            <div key={card.nodeId} className="shrink-0 w-52">
                                                <CollapsedKnowledgeCard
                                                    nodeId={card.nodeId}
                                                    title={card.title}
                                                    onFocus={handleFocus}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
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
