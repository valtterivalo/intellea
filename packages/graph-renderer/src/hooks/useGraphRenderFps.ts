/**
 * @fileoverview Track render FPS for the graph canvas.
 * Exports: useGraphRenderFps
 */

import { useEffect, useRef, useState } from 'react';

export const useGraphRenderFps = (enabled: boolean): number | null => {
  const [renderFps, setRenderFps] = useState<number | null>(null);
  const frameRef = useRef({ lastTime: 0, frameCount: 0, rafId: 0 });

  useEffect(() => {
    if (!enabled) return;
    const frameState = frameRef.current;
    frameState.lastTime = performance.now();
    frameState.frameCount = 0;
    const step = (now: number) => {
      frameState.frameCount += 1;
      const delta = now - frameState.lastTime;
      if (delta >= 1000) {
        const fps = Math.round((frameState.frameCount * 1000) / delta);
        frameState.lastTime = now;
        frameState.frameCount = 0;
        setRenderFps(fps);
      }
      frameState.rafId = window.requestAnimationFrame(step);
    };
    frameState.rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frameState.rafId);
    };
  }, [enabled]);

  return renderFps;
};
