/**
 * @fileoverview GPU-accelerated frustum culling for view-dependent rendering.
 * Exports: FrustumCuller, performFrustumCulling
 */

import { GPUBufferUsage, GPUMapMode } from './constants';
import { FRUSTUM_CULL_SHADER } from './shaders';
import type { GpuBuffer, GpuDevice } from './types';

export interface FrustumPlanes {
  left: [number, number, number, number];
  right: [number, number, number, number];
  top: [number, number, number, number];
  bottom: [number, number, number, number];
  near: [number, number, number, number];
  far: [number, number, number, number];
}

export interface FrustumCullResult {
  visibleBuffer: GpuBuffer;
  visibleCount: number;
}

/**
 * Extract frustum planes from a view-projection matrix.
 */
export function extractFrustumPlanes(viewProj: Float32Array): FrustumPlanes {
  const planes: FrustumPlanes = {
    left: [0, 0, 0, 0],
    right: [0, 0, 0, 0],
    top: [0, 0, 0, 0],
    bottom: [0, 0, 0, 0],
    near: [0, 0, 0, 0],
    far: [0, 0, 0, 0],
  };

  // Extract planes from combined view-projection matrix
  // Left plane: column 4 + column 1
  planes.left[0] = viewProj[3] + viewProj[0];
  planes.left[1] = viewProj[7] + viewProj[4];
  planes.left[2] = viewProj[11] + viewProj[8];
  planes.left[3] = viewProj[15] + viewProj[12];

  // Right plane: column 4 - column 1
  planes.right[0] = viewProj[3] - viewProj[0];
  planes.right[1] = viewProj[7] - viewProj[4];
  planes.right[2] = viewProj[11] - viewProj[8];
  planes.right[3] = viewProj[15] - viewProj[12];

  // Top plane: column 4 - column 2
  planes.top[0] = viewProj[3] - viewProj[1];
  planes.top[1] = viewProj[7] - viewProj[5];
  planes.top[2] = viewProj[11] - viewProj[9];
  planes.top[3] = viewProj[15] - viewProj[13];

  // Bottom plane: column 4 + column 2
  planes.bottom[0] = viewProj[3] + viewProj[1];
  planes.bottom[1] = viewProj[7] + viewProj[5];
  planes.bottom[2] = viewProj[11] + viewProj[9];
  planes.bottom[3] = viewProj[15] + viewProj[13];

  // Near plane: column 4 + column 3
  planes.near[0] = viewProj[3] + viewProj[2];
  planes.near[1] = viewProj[7] + viewProj[6];
  planes.near[2] = viewProj[11] + viewProj[10];
  planes.near[3] = viewProj[15] + viewProj[14];

  // Far plane: column 4 - column 3
  planes.far[0] = viewProj[3] - viewProj[2];
  planes.far[1] = viewProj[7] - viewProj[6];
  planes.far[2] = viewProj[11] - viewProj[10];
  planes.far[3] = viewProj[15] - viewProj[14];

  // Normalize planes
  for (const plane of Object.values(planes)) {
    const length = Math.sqrt(plane[0] ** 2 + plane[1] ** 2 + plane[2] ** 2);
    if (length > 0) {
      plane[0] /= length;
      plane[1] /= length;
      plane[2] /= length;
      plane[3] /= length;
    }
  }

  return planes;
}

/**
 * Perform GPU-accelerated frustum culling.
 */
export async function performFrustumCulling(
  device: GpuDevice,
  nodePositions: Float32Array,
  nodeRadii: Float32Array,
  viewProj: Float32Array
): Promise<FrustumCullResult> {
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

  // Create visible buffer
  const visibleBuffer = device.createBuffer({
    size: nodeCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  // Create frustum uniform buffer
  const planes = extractFrustumPlanes(viewProj);
  const frustumBuffer = device.createBuffer({
    size: 6 * 16, // 6 planes * 4 floats * 4 bytes
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const frustumData = new Float32Array(frustumBuffer.getMappedRange());
  let offset = 0;
  for (const plane of Object.values(planes)) {
    frustumData.set(plane, offset);
    offset += 4;
  }
  frustumBuffer.unmap();

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
    code: FRUSTUM_CULL_SHADER,
  });

  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'frustum_cull',
    },
  });

  // Create bind group
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: nodeBuffer } },
      { binding: 1, resource: { buffer: visibleBuffer } },
      { binding: 2, resource: { buffer: frustumBuffer } },
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

  // Read back visible count
  const readBuffer = device.createBuffer({
    size: visibleBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const copyEncoder = device.createCommandEncoder();
  copyEncoder.copyBufferToBuffer(visibleBuffer, 0, readBuffer, 0, visibleBuffer.size);
  device.queue.submit([copyEncoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const visibleData = new Uint32Array(readBuffer.getMappedRange());
  const visibleCount = visibleData.filter(v => v !== 0).length;
  readBuffer.unmap();

  return {
    visibleBuffer,
    visibleCount,
  };
}

/**
 * CPU fallback for frustum culling (useful for debugging or small graphs).
 */
export function performFrustumCullingCPU(
  nodePositions: Float32Array,
  nodeRadii: Float32Array,
  viewProj: Float32Array
): Uint32Array {
  const nodeCount = nodePositions.length / 3;
  const visible = new Uint32Array(nodeCount);
  const planes = extractFrustumPlanes(viewProj);

  const planeDistance = (plane: [number, number, number, number], point: [number, number, number]) => {
    return plane[0] * point[0] + plane[1] * point[1] + plane[2] * point[2] + plane[3];
  };

  for (let i = 0; i < nodeCount; i++) {
    const pos: [number, number, number] = [
      nodePositions[i * 3],
      nodePositions[i * 3 + 1],
      nodePositions[i * 3 + 2],
    ];
    const radius = nodeRadii[i];
    let isVisible = true;

    for (const plane of Object.values(planes)) {
      if (planeDistance(plane, pos) < -radius) {
        isVisible = false;
        break;
      }
    }

    visible[i] = isVisible ? 1 : 0;
  }

  return visible;
}