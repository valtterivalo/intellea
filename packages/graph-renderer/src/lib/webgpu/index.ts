/**
 * @fileoverview WebGPU rendering utilities.
 * Exports: device management, spatial indexing, frustum culling, LOD
 */

export {
  isWebGPUSupported,
  getWebGPUDevice,
  resetWebGPUDevice,
  getWebGPUSupportInfo,
  type WebGPUDevice,
} from './device';

export {
  buildSpatialIndex,
  querySpatialIndexCPU,
  calculateOptimalGridResolution,
  type SpatialIndex,
  type SpatialIndexConfig,
} from './spatial-index';

export {
  extractFrustumPlanes,
  performFrustumCulling,
  performFrustumCullingCPU,
  type FrustumPlanes,
  type FrustumCullResult,
} from './frustum-cull';

export {
  calculateLOD,
  calculateLODCPU,
  getLODScaleFactor,
  calculateOptimalLODConfig,
  DEFAULT_LOD_CONFIG,
  type LODConfig,
  type LODResult,
} from './lod';

export {
  SPATIAL_INDEX_SHADER,
  FRUSTUM_CULL_SHADER,
  LOD_SHADER,
  NODE_VERTEX_SHADER,
  NODE_FRAGMENT_SHADER,
  LINK_VERTEX_SHADER,
  LINK_FRAGMENT_SHADER,
} from './shaders';

export { WebGPUCamera } from './camera';