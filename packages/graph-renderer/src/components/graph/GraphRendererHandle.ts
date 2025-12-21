/**
 * @fileoverview Shared handle type for the custom graph renderer.
 * Exports: GraphRendererHandle, GraphRendererCoords
 */

import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { WebGLRenderer } from 'three';

export type GraphRendererCoords = {
  x: number;
  y: number;
  z: number;
};

export type GraphRendererHandle = {
  cameraPosition: (
    position: Partial<GraphRendererCoords>,
    lookAt?: GraphRendererCoords,
    transitionMs?: number
  ) => void;
  zoomToFit: (durationMs?: number, padding?: number) => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  controls: () => OrbitControls | undefined;
  renderer: () => WebGLRenderer | undefined;
};
