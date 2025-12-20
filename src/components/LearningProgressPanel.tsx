'use client';
/**
 * @fileoverview Learning progress summary panel with next-step suggestion.
 * Exports: LearningProgressPanel
 */

import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import { computeProgress, suggestNextNode } from '@/lib/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const LearningProgressPanel: React.FC = () => {
  const {
    output,
    completedNodeIds,
    setFocusedNodeId,
    setActiveFocusPath,
    scrollToGraph,
  } = useAppStore(
    useShallow((state) => ({
      output: state.output,
      completedNodeIds: state.completedNodeIds,
      setFocusedNodeId: state.setFocusedNodeId,
      setActiveFocusPath: state.setActiveFocusPath,
      scrollToGraph: state.scrollToGraph,
    }))
  );

  const metrics = useMemo(() => {
    if (!isIntelleaResponse(output)) return null;
    const totalNodes = output.visualizationData.nodes.length;
    const completedCount = completedNodeIds.size;
    const progress = computeProgress(totalNodes, completedNodeIds);
    const nextNode = suggestNextNode(output.visualizationData, completedNodeIds);

    return {
      totalNodes,
      completedCount,
      progress,
      nextNode,
    };
  }, [completedNodeIds, output]);

  if (!metrics || metrics.totalNodes === 0) return null;

  const handleFocusNext = () => {
    if (!metrics.nextNode || !isIntelleaResponse(output)) return;
    setFocusedNodeId(metrics.nextNode.id);
    setActiveFocusPath(metrics.nextNode.id, output.visualizationData);
    scrollToGraph();
  };

  return (
    <Card className="bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Learning progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>
            {metrics.completedCount} of {metrics.totalNodes} nodes learned
          </span>
          <span className="text-muted-foreground">
            {Math.round(metrics.progress)}%
          </span>
        </div>
        <Progress value={metrics.progress} className="h-2" />
        {metrics.nextNode && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground truncate">
              Next up: {metrics.nextNode.label || metrics.nextNode.id}
            </span>
            <Button variant="outline" size="sm" onClick={handleFocusNext}>
              Focus
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningProgressPanel;
