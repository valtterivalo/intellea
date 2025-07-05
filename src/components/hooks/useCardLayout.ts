// File Overview: React hook computing layout data for KnowledgeCardsSection.
// Determines root, ancestor, focused, child, and other card groups based on
// the current focus state of the visualization.

import { useMemo } from 'react';
import type { KnowledgeCard as KnowledgeCardType, NodeObject, LinkObject } from '@/store/useAppStore';
import type { GraphData } from '@/types/intellea';

export interface CardLayout {
  rootCard: KnowledgeCardType | undefined;
  ancestorLevels: KnowledgeCardType[][];
  focusedCard: KnowledgeCardType | undefined;
  childCards: KnowledgeCardType[];
  otherCards: KnowledgeCardType[];
  isFocusActive: boolean;
}

export function useCardLayout(
  knowledgeCards: KnowledgeCardType[] | null | undefined,
  visualizationData: GraphData | null,
  activeClickedNodeId: string | null
): CardLayout {
  return useMemo(() => {
    const validCards =
      knowledgeCards?.filter(
        (card): card is KnowledgeCardType =>
          !!card && typeof card.nodeId === 'string' && card.nodeId.trim() !== '' && typeof card.title === 'string'
      ) || [];

    const cardsMap = new Map(validCards.map((card) => [card.nodeId, card]));
    const rootNode = visualizationData?.nodes.find((node: NodeObject) => node.isRoot);
    const rootCardData = rootNode?.id ? cardsMap.get(rootNode.id) : undefined;

    const currentFocusActive =
      activeClickedNodeId !== null && visualizationData !== null && cardsMap.has(activeClickedNodeId);

    const levels: KnowledgeCardType[][] = [];
    let focused: KnowledgeCardType | undefined;
    const children: KnowledgeCardType[] = [];
    const others: KnowledgeCardType[] = [];
    const allFocusPathIds = new Set<string>();

    if (currentFocusActive) {
      focused = cardsMap.get(activeClickedNodeId)!;
      allFocusPathIds.add(activeClickedNodeId);

      const parentMap = new Map<string, Set<string>>();
      const childMap = new Map<string, Set<string>>();

      visualizationData!.links.forEach((link: LinkObject) => {
        const sourceId =
          typeof link.source === 'object' && link.source !== null
            ? (link.source as NodeObject).id
            : (link.source as string);
        const targetId =
          typeof link.target === 'object' && link.target !== null
            ? (link.target as NodeObject).id
            : (link.target as string);

        if (sourceId && targetId) {
          if (!parentMap.has(targetId)) parentMap.set(targetId, new Set());
          parentMap.get(targetId)!.add(sourceId);

          if (!childMap.has(sourceId)) childMap.set(sourceId, new Set());
          childMap.get(sourceId)!.add(targetId);
        }
      });

      const directChildIds = childMap.get(activeClickedNodeId) || new Set<string>();
      directChildIds.forEach((childId) => {
        const card = cardsMap.get(childId);
        if (card) {
          children.push(card);
          allFocusPathIds.add(childId);
        }
      });

      const rootNodeId = rootNode?.id || '';
      const isRootNode = (id: string) => id === rootNodeId;

      let currentLevelIds = new Set<string>([activeClickedNodeId]);
      const visited = new Set<string>([activeClickedNodeId]);

      while (currentLevelIds.size > 0) {
        const parentLevelIds = new Set<string>();
        const parentLevelCards: KnowledgeCardType[] = [];

        currentLevelIds.forEach((childId) => {
          const parents = parentMap.get(childId) || new Set<string>();
          parents.forEach((parentId) => {
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
        currentLevelIds = parentLevelIds;
      }

      if (rootNodeId && rootNodeId !== activeClickedNodeId && !visited.has(rootNodeId)) {
        const rootCard = cardsMap.get(rootNodeId);
        if (rootCard) {
          levels.push([rootCard]);
          allFocusPathIds.add(rootNodeId);
        }
      }

      validCards.forEach((card) => {
        if (!allFocusPathIds.has(card.nodeId)) {
          others.push(card);
        }
      });
    } else {
      validCards.forEach((card) => {
        if (card.nodeId !== rootNode?.id) {
          children.push(card);
        }
      });
    }

    return {
      rootCard: rootCardData,
      ancestorLevels: levels.reverse(),
      focusedCard: focused,
      childCards: children,
      otherCards: others,
      isFocusActive: currentFocusActive,
    };
  }, [knowledgeCards, visualizationData, activeClickedNodeId]);
}

export default useCardLayout;
