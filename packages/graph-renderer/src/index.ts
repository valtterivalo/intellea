/**
 * @fileoverview Package exports for the intellea graph renderer.
 */

export { default as GraphResponseRenderer } from './components/GraphResponseRenderer';
export { default as VisualizationComponent } from './components/VisualizationComponent';
export { default as GraphCanvasRenderer } from './components/graph/GraphCanvasRenderer';
export { default as WebGPURenderer } from './components/graph/WebGPURenderer';
export type { GraphRendererHandle, GraphRendererCoords } from './components/graph/GraphRendererHandle';
export type { GraphController } from './hooks/graphController';
export { useLocalGraphController } from './hooks/graphController';
export { computeClusters } from './lib/graphCluster';
export { calculateFocusPath } from './lib/focusPath';
export { graphResponseToGraphData } from './lib/adapters/graphResponseToGraphData';
export { getGraphPerfProfile, selectCoreNodeIds } from './lib/graphPerf';
export { GraphResponseElement, defineGraphResponseElement } from './web-component/GraphResponseElement';

export {
  isWebGPUSupported,
  getWebGPUDevice,
  getWebGPUSupportInfo,
  type WebGPUDevice,
} from './lib/webgpu/index';
