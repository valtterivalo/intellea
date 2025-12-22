'use client';
/**
 * @fileoverview GraphResponseV0 renderer with mode presets.
 * Exports: GraphResponseRenderer
 */

import React, { useEffect, useMemo, useRef } from 'react';
import type { GraphRendererHandle } from './graph/GraphRendererHandle';
import type {
  GraphResponseV0,
  GraphModeV0,
  GraphEdgeTypeV0,
  GraphLabelDensityV0,
  GraphNodeTypeV0,
} from '@intellea/graph-schema';
import { graphResponseToGraphData } from '../lib/adapters/graphResponseToGraphData';
import VisualizationComponent from './VisualizationComponent';
import { useLocalGraphController } from '../hooks/graphController';
import type { GraphController } from '../hooks/graphController';

interface GraphResponseRendererProps {
  graphResponse: GraphResponseV0;
  onNodeExpand?: (nodeId: string, nodeLabel: string) => void;
  expandingNodeId?: string | null;
  controller?: GraphController;
  graphRef?: React.Ref<GraphRendererHandle>;
  showControls?: boolean;
  showPerfOverlay?: boolean;
  disableFocusEffects?: boolean;
}

const modeDefaults: Record<
  GraphModeV0,
  { labelDensity: GraphLabelDensityV0; emphasisEdgeTypes: GraphEdgeTypeV0[] }
> = {
  map: { labelDensity: 'medium', emphasisEdgeTypes: ['relates_to'] },
  decision: { labelDensity: 'high', emphasisEdgeTypes: ['supports', 'risks', 'mitigates'] },
  plan: { labelDensity: 'medium', emphasisEdgeTypes: ['depends_on', 'causes'] },
  argument: { labelDensity: 'high', emphasisEdgeTypes: ['supports', 'contradicts'] },
};

const modeEmphasisNodes: Record<GraphModeV0, GraphNodeTypeV0[]> = {
  map: ['entity'],
  decision: ['option', 'risk', 'constraint'],
  plan: ['action', 'constraint'],
  argument: ['claim', 'evidence'],
};

const mergeUnique = <T extends string>(a: T[], b: T[]): T[] => {
  const combined = new Set<T>();
  a.forEach((value) => combined.add(value));
  b.forEach((value) => combined.add(value));
  return Array.from(combined);
};

const GraphResponseRenderer: React.FC<GraphResponseRendererProps> = ({
  graphResponse,
  onNodeExpand,
  expandingNodeId,
  controller,
  graphRef,
  showControls = true,
  showPerfOverlay = true,
  disableFocusEffects = false,
}) => {
  const graphData = useMemo(
    () => graphResponseToGraphData(graphResponse),
    [graphResponse]
  );

  const localController = useLocalGraphController(controller ? undefined : graphData);
  const activeController = controller ?? localController;
  const {
    focusedNodeId,
    selectedNodeId,
    setFocusedNodeId,
    setActiveFocusPath,
  } = activeController;
  const hasAppliedDefaultFocusRef = useRef(false);
  const prevNodesRef = useRef<GraphResponseV0['nodes'] | null>(null);
  const prevEdgesRef = useRef<GraphResponseV0['edges'] | null>(null);

  const viewHints = graphResponse.view;
  const defaults = modeDefaults[graphResponse.mode];

  const emphasisFromMode = useMemo(() => {
    const emphasisTypes = modeEmphasisNodes[graphResponse.mode];
    return graphResponse.nodes
      .filter((node) => emphasisTypes.includes(node.type))
      .map((node) => node.id);
  }, [graphResponse]);

  const emphasisNodeIds = useMemo(() => {
    if (viewHints?.emphasisNodeIds && viewHints.emphasisNodeIds.length > 0) {
      return mergeUnique(viewHints.emphasisNodeIds, emphasisFromMode);
    }
    return emphasisFromMode;
  }, [viewHints, emphasisFromMode]);

  const emphasisEdgeTypes =
    viewHints?.emphasisEdgeTypes && viewHints.emphasisEdgeTypes.length > 0
      ? mergeUnique(viewHints.emphasisEdgeTypes, defaults.emphasisEdgeTypes)
      : defaults.emphasisEdgeTypes;

  const labelDensity = viewHints?.labelDensity ?? defaults.labelDensity;
  const defaultFocusNodeId = viewHints?.defaultFocusNodeId;

  useEffect(() => {
    const isNewGraph =
      prevNodesRef.current !== graphResponse.nodes ||
      prevEdgesRef.current !== graphResponse.edges;
    if (!isNewGraph) return;
    hasAppliedDefaultFocusRef.current = false;
    prevNodesRef.current = graphResponse.nodes;
    prevEdgesRef.current = graphResponse.edges;
  }, [graphResponse.nodes, graphResponse.edges]);

  useEffect(() => {
    if (disableFocusEffects) return;
    if (!defaultFocusNodeId) return;
    if (hasAppliedDefaultFocusRef.current) return;
    if (focusedNodeId || selectedNodeId) return;
    setFocusedNodeId(defaultFocusNodeId);
    setActiveFocusPath(defaultFocusNodeId, graphData);
    hasAppliedDefaultFocusRef.current = true;
  }, [
    disableFocusEffects,
    defaultFocusNodeId,
    focusedNodeId,
    selectedNodeId,
    graphData,
    setFocusedNodeId,
    setActiveFocusPath,
  ]);

  return (
    <VisualizationComponent
      ref={graphRef}
      visualizationData={graphData}
      onNodeExpand={onNodeExpand}
      expandingNodeId={expandingNodeId}
      labelDensity={labelDensity}
      emphasisNodeIds={emphasisNodeIds}
      emphasisEdgeTypes={emphasisEdgeTypes}
      controller={controller}
      showControls={showControls}
      showPerfOverlay={showPerfOverlay}
    />
  );
};

export default GraphResponseRenderer;
