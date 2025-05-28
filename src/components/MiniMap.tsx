'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ForceGraphMethods } from 'react-force-graph';
import { GraphData } from '@/store/useAppStore';

const ForceGraph2D = dynamic(() => import('react-force-graph').then(m => (m.ForceGraph2D || m.default)), { ssr: false });

interface CameraState {
  position: { x: number; y: number; z: number };
  zoom: number;
}

interface MiniMapProps {
  graphData: GraphData;
  cameraState: CameraState;
  mainGraphDims: { width: number; height: number };
  onCenter: (x: number, y: number) => void;
  visible: boolean;
}

const MiniMap: React.FC<MiniMapProps> = ({ graphData, cameraState, mainGraphDims, onCenter, visible }) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewRect, setViewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(0, 10);
    }
  }, [graphData]);

  useEffect(() => {
    if (!fgRef.current) return;
    const { position, zoom } = cameraState;
    const center = fgRef.current.graph2ScreenCoords(position.x, position.y);
    const rectW = mainGraphDims.width / zoom;
    const rectH = mainGraphDims.height / zoom;
    setViewRect({ x: center.x - rectW / 2, y: center.y - rectH / 2, w: rectW, h: rectH });
  }, [cameraState, mainGraphDims]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fgRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const coords = fgRef.current.screen2GraphCoords(x, y);
    onCenter(coords.x, coords.y);
  };

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-2 right-2 z-20 w-40 h-40 bg-card/70 border rounded-sm"
      onClick={handleClick}
      data-testid="mini-map"
    >
      <ForceGraph2D
        ref={fgRef}
        width={160}
        height={160}
        graphData={graphData}
        enableZoomPanInteraction={false}
      />
      {viewRect && (
        <div
          data-testid="mini-viewport"
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: viewRect.x,
            top: viewRect.y,
            width: viewRect.w,
            height: viewRect.h,
            border: '1px solid red',
          }}
        />
      )}
    </div>
  );
};

export default MiniMap;
