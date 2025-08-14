/**
 * @fileoverview React component for displaying streaming generation progress.
 * Exports: StreamingProgress
 */
'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import type { StreamingState } from '@/hooks/useStreamingGeneration';

interface StreamingProgressProps {
  state: StreamingState;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const StreamingProgress: React.FC<StreamingProgressProps> = ({
  state,
  onCancel,
  showCancel = true,
}) => {
  if (!state.isLoading && !state.error) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with message and cancel button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium text-sm">
                {state.error ? '❌ Generation Failed' : state.message}
              </span>
            </div>
            {showCancel && onCancel && state.isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {state.isLoading && (
            <div className="space-y-2">
              <Progress value={state.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(state.progress)}%</span>
                <span>
                  {state.stage && (
                    <span className="capitalize">
                      {state.stage.replace('-', ' ')}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {state.error}
            </div>
          )}

          {/* Partial data preview */}
          {state.data && state.data.visualizationData && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                {state.data.visualizationData.nodes && (
                  <div>
                    <span className="font-medium">Nodes:</span>{' '}
                    {state.data.visualizationData.nodes.length}
                  </div>
                )}
                {state.data.visualizationData.links && (
                  <div>
                    <span className="font-medium">Connections:</span>{' '}
                    {state.data.visualizationData.links.length}
                  </div>
                )}
              </div>
              {state.data.sessionTitle && (
                <div className="mt-2">
                  <span className="font-medium">Topic:</span>{' '}
                  {state.data.sessionTitle}
                </div>
              )}
            </div>
          )}

          {/* Estimated time remaining (rough calculation) */}
          {state.isLoading && state.progress > 0 && state.progress < 100 && (
            <div className="text-xs text-muted-foreground text-center">
              {getEstimatedTimeRemaining(state.progress)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getEstimatedTimeRemaining(progress: number): string {
  if (progress >= 90) return 'Almost done...';
  if (progress >= 70) return 'Finalizing positions...';
  if (progress >= 50) return 'Processing embeddings...';
  if (progress >= 20) return 'Building knowledge graph...';
  return 'Analyzing your topic...';
}

export default StreamingProgress;