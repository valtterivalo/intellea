/**
 * @fileoverview Resize observer hook for graph container dimensions.
 * Exports: useGraphDimensions
 */

import { useEffect, useState, type RefObject } from 'react';

export type GraphDimensions = {
  width: number;
  height: number;
};

const roundDimension = (value: number): number => Math.max(0, Math.round(value));

export const useGraphDimensions = (
  containerRef: RefObject<HTMLDivElement | null>
): GraphDimensions => {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const [dimensions, setDimensions] = useState<GraphDimensions>(() => {
    if (isTestEnv) {
      return { width: 800, height: 600 };
    }
    return { width: 0, height: 0 };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = roundDimension(rect.width);
      const newHeight = roundDimension(rect.height);
      if (newWidth === 0 || newHeight === 0) return;
      setDimensions((current) => {
        if (current.width === newWidth && current.height === newHeight) {
          return current;
        }
        return { width: newWidth, height: newHeight };
      });
    };

    const initialTimeout = isTestEnv ? undefined : setTimeout(updateDimensions, 100);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!entry.contentRect) continue;
        const newWidth = roundDimension(entry.contentRect.width);
        const newHeight = roundDimension(entry.contentRect.height);
        if (newWidth === 0 || newHeight === 0) continue;
        setDimensions((current) => {
          if (current.width === newWidth && current.height === newHeight) {
            return current;
          }
          return { width: newWidth, height: newHeight };
        });
      }
    });

    resizeObserver.observe(container);

    const fallbackTimeout = isTestEnv
      ? undefined
      : setTimeout(() => {
          setDimensions((current) => {
            if (current.width > 0 && current.height > 0) return current;
            const rect = container.getBoundingClientRect();
            const fallbackWidth = roundDimension(rect.width) || 800;
            const fallbackHeight = roundDimension(rect.height) || 600;
            return { width: fallbackWidth, height: fallbackHeight };
          });
        }, 2000);

    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      resizeObserver.disconnect();
    };
  }, [containerRef, isTestEnv]);

  return dimensions;
};
