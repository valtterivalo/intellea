/**
 * @fileoverview Level-of-detail system for adaptive rendering quality.
 * Exports: LODManager, calculateLOD
 */

import { GPUBufferUsage, GPUMapMode } from './constants';
import { LOD_SHADER } from './shaders';
import type { GpuBuffer, GpuDevice } from './types';

export interface LODConfig {
  levels: number;
  distanceThresholds: number[];
  scaleFactors: number[];
}

export interface LODResult {
  lodBuffer: GpuBuffer;
  lodLevels: Uint8Array;
}

/**
 * Default LOD configuration for graph rendering.
 */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  levels: 4,
  distanceThresholds: [100, 300, 600, Infinity],
  scaleFactors: [1.0, 0.7, 0.4, 0.2],
};

/**
 * Calculate LOD levels on the GPU based on distance from camera.
 */
export async function calculateLOD(
  device: GpuDevice,
  nodePositions: Float32Array,
  nodeRadii: Float32Array,
  cameraPosition: [number, number, number],
  config: LODConfig = DEFAULT_LOD_CONFIG
): Promise<LODResult> {
  const nodeCount = nodePositions.length / 3;

  // Create node buffer
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

  // Create LOD buffer
  const lodBuffer = device.createBuffer({
    size: nodeCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  // Create camera position uniform
  const cameraBuffer = device.createBuffer({
    size: 16, // vec3f (12) + padding (4)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const cameraData = new Float32Array(cameraBuffer.getMappedRange());
  cameraData.set(cameraPosition, 0);
  cameraData[3] = 0; // padding
  cameraBuffer.unmap();

  // Create node count uniform
  const countBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  new Uint32Array(countBuffer.getMappedRange())[0] = nodeCount;
  countBuffer.unmap();

  // Create compute pipeline
  const shaderModule = device.createShaderModule({
    code: LOD_SHADER,
  });

  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'calculate_lod',
    },
  });

  // Create bind group
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: nodeBuffer } },
      { binding: 1, resource: { buffer: lodBuffer } },
      { binding: 2, resource: { buffer: cameraBuffer } },
      { binding: 3, resource: { buffer: countBuffer } },
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

  // Read back LOD levels
  const readBuffer = device.createBuffer({
    size: lodBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const copyEncoder = device.createCommandEncoder();
  copyEncoder.copyBufferToBuffer(lodBuffer, 0, readBuffer, 0, lodBuffer.size);
  device.queue.submit([copyEncoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const lodData = new Uint32Array(readBuffer.getMappedRange());
  const lodLevels = new Uint8Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    lodLevels[i] = lodData[i] as unknown as number;
  }
  readBuffer.unmap();

  return {
    lodBuffer,
    lodLevels,
  };
}

/**
 * CPU fallback for LOD calculation.
 */
export function calculateLODCPU(
  nodePositions: Float32Array,
  nodeRadii: Float32Array,
  cameraPosition: [number, number, number],
  config: LODConfig = DEFAULT_LOD_CONFIG
): Uint8Array {
  const nodeCount = nodePositions.length / 3;
  const lodLevels = new Uint8Array(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const pos: [number, number, number] = [
      nodePositions[i * 3],
      nodePositions[i * 3 + 1],
      nodePositions[i * 3 + 2],
    ];

    const distance = Math.sqrt(
      (pos[0] - cameraPosition[0]) ** 2 +
      (pos[1] - cameraPosition[1]) ** 2 +
      (pos[2] - cameraPosition[2]) ** 2
    );

    let lodLevel = config.levels - 1;
    for (let j = 0; j < config.distanceThresholds.length; j++) {
      if (distance < config.distanceThresholds[j]) {
        lodLevel = j;
        break;
      }
    }

    lodLevels[i] = lodLevel;
  }

  return lodLevels;
}

/**
 * Get scale factor for a given LOD level.
 */
export function getLODScaleFactor(
  lodLevel: number,
  config: LODConfig = DEFAULT_LOD_CONFIG
): number {
  return config.scaleFactors[lodLevel] || config.scaleFactors[config.scaleFactors.length - 1];
}

/**
 * Calculate optimal LOD configuration based on node count and target performance.
 */
export function calculateOptimalLODConfig(
  nodeCount: number,
  targetFPS: number = 60
): LODConfig {
  // More aggressive LOD for larger graphs
  if (nodeCount > 10000) {
    return {
      levels: 5,
      distanceThresholds: [50, 150, 300, 500, Infinity],
      scaleFactors: [1.0, 0.6, 0.35, 0.2, 0.1],
    };
  }

  if (nodeCount > 5000) {
    return {
      levels: 4,
      distanceThresholds: [80, 250, 500, Infinity],
      scaleFactors: [1.0, 0.7, 0.4, 0.2],
    };
  }

  return DEFAULT_LOD_CONFIG;
}