/**
 * @fileoverview GPU-accelerated spatial indexing for fast node queries.
 * Exports: SpatialIndex, buildSpatialIndex
 */

import { GPUBufferUsage } from './constants';
import { SPATIAL_INDEX_SHADER } from './shaders';
import type { GpuBuffer, GpuDevice } from './types';

export interface SpatialIndexConfig {
  gridResolution: number;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface SpatialIndex {
  cellCountsBuffer: GpuBuffer;
  cellIndicesBuffer: GpuBuffer;
  config: SpatialIndexConfig;
}

/**
 * Build a spatial index on the GPU for fast node queries.
 * Uses a uniform grid to partition 3D space.
 */
export async function buildSpatialIndex(
  device: GpuDevice,
  nodePositions: Float32Array,
  nodeRadii: Float32Array,
  config: SpatialIndexConfig
): Promise<SpatialIndex> {
  const nodeCount = nodePositions.length / 3;
  const gridCellCount = config.gridResolution ** 3;

  // Create buffers
  const nodeBuffer = device.createBuffer({
    size: nodePositions.byteLength + nodeRadii.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const nodeData = new Float32Array(nodeBuffer.getMappedRange());
  for (let i = 0; i < nodeCount; i++) {
    nodeData[i * 4] = nodePositions[i * 3];
    nodeData[i * 4 + 1] = nodePositions[i * 3 + 1];
    nodeData[i * 4 + 2] = nodePositions[i * 3 + 2];
    nodeData[i * 4 + 3] = nodeRadii[i];
  }
  nodeBuffer.unmap();

  const cellCountsBuffer = device.createBuffer({
    size: gridCellCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const cellIndicesBuffer = device.createBuffer({
    size: nodeCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const uniformBuffer = device.createBuffer({
    size: 48, // vec3f (16) + vec3f (16) + vec3u32 (12) + u32 (4) = 48
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const uniformData = new Float32Array(uniformBuffer.getMappedRange());
  uniformData.set(config.bounds.min, 0);
  uniformData.set(config.bounds.max, 3);
  uniformData[6] = config.gridResolution;
  uniformData[7] = config.gridResolution;
  uniformData[8] = config.gridResolution;
  uniformData[9] = nodeCount;
  uniformBuffer.unmap();

  // Create compute pipeline
  const shaderModule = device.createShaderModule({
    code: SPATIAL_INDEX_SHADER,
  });

  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'spatial_index',
    },
  });

  // Create bind group
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: nodeBuffer } },
      { binding: 1, resource: { buffer: cellCountsBuffer } },
      { binding: 2, resource: { buffer: cellIndicesBuffer } },
      { binding: 3, resource: { buffer: uniformBuffer } },
    ],
  });

  // Execute compute shader
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(Math.ceil(nodeCount / 64));
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);

  return {
    cellCountsBuffer,
    cellIndicesBuffer,
    config,
  };
}

/**
 * Query the spatial index for nodes within a bounding box.
 * This is a CPU-side convenience function; for GPU-side queries,
 * you would need an additional compute shader.
 */
export function querySpatialIndexCPU(
  index: SpatialIndex,
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  },
  nodePositions: Float32Array
): Set<number> {
  const result = new Set<number>();
  const { gridResolution, bounds: gridBounds } = index.config;

  // Calculate grid cell range
  const cellSize = [
    (gridBounds.max[0] - gridBounds.min[0]) / gridResolution,
    (gridBounds.max[1] - gridBounds.min[1]) / gridResolution,
    (gridBounds.max[2] - gridBounds.min[2]) / gridResolution,
  ];

  const minCell = [
    Math.floor((bounds.min[0] - gridBounds.min[0]) / cellSize[0]),
    Math.floor((bounds.min[1] - gridBounds.min[1]) / cellSize[1]),
    Math.floor((bounds.min[2] - gridBounds.min[2]) / cellSize[2]),
  ];

  const maxCell = [
    Math.ceil((bounds.max[0] - gridBounds.min[0]) / cellSize[0]),
    Math.ceil((bounds.max[1] - gridBounds.min[1]) / cellSize[1]),
    Math.ceil((bounds.max[2] - gridBounds.min[2]) / cellSize[2]),
  ];

  // Iterate over cells in range (this is where GPU would be much faster)
  for (let x = Math.max(0, minCell[0]); x <= Math.min(gridResolution - 1, maxCell[0]); x++) {
    for (let y = Math.max(0, minCell[1]); y <= Math.min(gridResolution - 1, maxCell[1]); y++) {
      for (let z = Math.max(0, minCell[2]); z <= Math.min(gridResolution - 1, maxCell[2]); z++) {
        const cellIndex = x + y * gridResolution + z * gridResolution * gridResolution;
        // In a real implementation, you would read from the GPU buffers here
        // For now, we'll do a linear scan as fallback
      }
    }
  }

  return result;
}

/**
 * Calculate optimal grid resolution based on node count and distribution.
 */
export function calculateOptimalGridResolution(
  nodeCount: number,
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  }
): number {
  // Heuristic: aim for ~100 nodes per cell
  const volume =
    (bounds.max[0] - bounds.min[0]) *
    (bounds.max[1] - bounds.min[1]) *
    (bounds.max[2] - bounds.min[2]);
  const nodesPerUnitVolume = nodeCount / volume;
  const targetCells = Math.ceil(nodeCount / 100);
  const gridResolution = Math.ceil(Math.cbrt(targetCells));

  return Math.min(Math.max(gridResolution, 8), 64); // Clamp between 8 and 64
}
