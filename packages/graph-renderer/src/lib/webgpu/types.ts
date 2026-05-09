/**
 * @fileoverview Minimal WebGPU types used by the renderer.
 */

export type GpuBufferUsageFlags = number;
export type GpuMapModeFlags = number;
export type GpuTextureUsageFlags = number;
export type GpuTextureFormat = string;
export type GpuFeatureName = 'timestamp-query';

export interface GpuBuffer {
  readonly size: number;
  getMappedRange(): ArrayBuffer;
  mapAsync(mode: GpuMapModeFlags): Promise<void>;
  unmap(): void;
}

export interface GpuTexture {
  createView(): GpuTextureView;
  destroy(): void;
}

export interface GpuTextureView {}

export interface GpuCommandBuffer {}

export interface GpuBindGroup {}

export interface GpuBindGroupLayout {}

export interface GpuShaderCompilationMessage {
  readonly message: string;
  readonly type: 'error' | 'warning' | 'info';
}

export interface GpuShaderCompilationInfo {
  readonly messages: readonly GpuShaderCompilationMessage[];
}

export interface GpuShaderModule {
  getCompilationInfo(): Promise<GpuShaderCompilationInfo>;
}

export interface GpuQueue {
  submit(commandBuffers: GpuCommandBuffer[]): void;
  writeBuffer(buffer: GpuBuffer, bufferOffset: number, data: BufferSource): void;
}

export interface GpuBufferDescriptor {
  size: number;
  usage: GpuBufferUsageFlags;
  mappedAtCreation?: boolean;
}

export interface GpuTextureDescriptor {
  size: [number, number] | [number, number, number];
  format: GpuTextureFormat;
  usage: GpuTextureUsageFlags;
}

export interface GpuShaderModuleDescriptor {
  code: string;
}

export interface GpuBufferBinding {
  buffer: GpuBuffer;
}

export interface GpuBindGroupEntry {
  binding: number;
  resource: GpuBufferBinding;
}

export interface GpuBindGroupDescriptor {
  layout: GpuBindGroupLayout;
  entries: GpuBindGroupEntry[];
}

export interface GpuColorTargetState {
  format: GpuTextureFormat;
  blend?: {
    color: {
      srcFactor: string;
      dstFactor: string;
      operation: string;
    };
    alpha: {
      srcFactor: string;
      dstFactor: string;
      operation: string;
    };
  };
}

export interface GpuRenderPipelineDescriptor {
  layout: 'auto';
  vertex: {
    module: GpuShaderModule;
    entryPoint: string;
  };
  fragment?: {
    module: GpuShaderModule;
    entryPoint: string;
    targets: GpuColorTargetState[];
  };
  primitive?: {
    topology: 'point-list' | 'triangle-strip' | 'triangle-list';
  };
  depthStencil?: {
    depthWriteEnabled: boolean;
    depthCompare: 'less';
    format: GpuTextureFormat;
  };
}

export interface GpuComputePipelineDescriptor {
  layout: 'auto';
  compute: {
    module: GpuShaderModule;
    entryPoint: string;
  };
}

export interface GpuRenderPipeline {
  getBindGroupLayout(index: number): GpuBindGroupLayout;
}

export interface GpuComputePipeline {
  getBindGroupLayout(index: number): GpuBindGroupLayout;
}

export interface GpuRenderPassColorAttachment {
  view: GpuTextureView;
  clearValue: { r: number; g: number; b: number; a: number };
  loadOp: 'clear' | 'load';
  storeOp: 'store' | 'discard';
}

export interface GpuRenderPassDepthStencilAttachment {
  view: GpuTextureView;
  depthClearValue: number;
  depthLoadOp: 'clear' | 'load';
  depthStoreOp: 'store' | 'discard';
}

export interface GpuRenderPassDescriptor {
  colorAttachments: GpuRenderPassColorAttachment[];
  depthStencilAttachment?: GpuRenderPassDepthStencilAttachment;
}

export interface GpuRenderPassEncoder {
  setPipeline(pipeline: GpuRenderPipeline): void;
  setBindGroup(index: number, bindGroup: GpuBindGroup): void;
  draw(vertexCount: number, instanceCount?: number): void;
  end(): void;
}

export interface GpuComputePassEncoder {
  setPipeline(pipeline: GpuComputePipeline): void;
  setBindGroup(index: number, bindGroup: GpuBindGroup): void;
  dispatchWorkgroups(workgroupCountX: number): void;
  end(): void;
}

export interface GpuCommandEncoder {
  beginRenderPass(descriptor: GpuRenderPassDescriptor): GpuRenderPassEncoder;
  beginComputePass(): GpuComputePassEncoder;
  copyBufferToBuffer(
    source: GpuBuffer,
    sourceOffset: number,
    destination: GpuBuffer,
    destinationOffset: number,
    size: number
  ): void;
  finish(): GpuCommandBuffer;
}

export interface GpuDevice {
  readonly queue: GpuQueue;
  createBindGroup(descriptor: GpuBindGroupDescriptor): GpuBindGroup;
  createBuffer(descriptor: GpuBufferDescriptor): GpuBuffer;
  createCommandEncoder(): GpuCommandEncoder;
  createComputePipeline(descriptor: GpuComputePipelineDescriptor): GpuComputePipeline;
  createRenderPipeline(descriptor: GpuRenderPipelineDescriptor): GpuRenderPipeline;
  createShaderModule(descriptor: GpuShaderModuleDescriptor): GpuShaderModule;
  createTexture(descriptor: GpuTextureDescriptor): GpuTexture;
}

export interface GpuAdapterLimits {
  maxBufferSize: number;
  maxStorageBufferBindingSize: number;
  maxComputeWorkgroupsPerDimension: number;
}

export interface GpuAdapter {
  readonly features: ReadonlySet<string>;
  readonly limits: GpuAdapterLimits;
  requestDevice(descriptor?: GpuDeviceDescriptor): Promise<GpuDevice>;
}

export interface GpuDeviceDescriptor {
  requiredFeatures?: GpuFeatureName[];
  requiredLimits?: Partial<GpuAdapterLimits>;
}

export interface GpuRequestAdapterOptions {
  powerPreference?: 'high-performance' | 'low-power';
}

export interface Gpu {
  getPreferredCanvasFormat(): GpuTextureFormat;
  requestAdapter(options?: GpuRequestAdapterOptions): Promise<GpuAdapter | null>;
}

export interface GpuCanvasContext {
  configure(descriptor: {
    device: GpuDevice;
    format: GpuTextureFormat;
    alphaMode: 'premultiplied' | 'opaque';
  }): void;
  getCurrentTexture(): GpuTexture;
}

export type NavigatorWithGpu = Navigator & {
  gpu?: Gpu;
};
