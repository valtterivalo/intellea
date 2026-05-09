/**
 * @fileoverview WebGPU device management with feature detection and fallback.
 * Exports: WebGPUDevice, getWebGPUDevice
 */

import type {
  Gpu,
  GpuAdapter,
  GpuDevice,
  GpuFeatureName,
  GpuTextureFormat,
  NavigatorWithGpu,
} from './types';

export interface WebGPUDevice {
  device: GpuDevice;
  adapter: GpuAdapter;
  format: GpuTextureFormat;
  isSupported: boolean;
  fallbackReason: string | null;
}

let cachedDevice: WebGPUDevice | null = null;

const getNavigatorGpu = (): Gpu | null => {
  if (typeof navigator === 'undefined') return null;
  return (navigator as NavigatorWithGpu).gpu ?? null;
};

/**
 * Check if WebGPU is supported in the current browser.
 */
export function isWebGPUSupported(): boolean {
  return getNavigatorGpu() !== null;
}

/**
 * Get or create a WebGPU device with feature detection.
 * Returns null if WebGPU is not supported or fails to initialize.
 */
export async function getWebGPUDevice(): Promise<WebGPUDevice | null> {
  if (cachedDevice) {
    return cachedDevice;
  }

  if (!isWebGPUSupported()) {
    return null;
  }

  try {
    const gpu = getNavigatorGpu();
    if (!gpu) return null;

    const adapter = await gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      return null;
    }

    const requiredFeatures: GpuFeatureName[] = [];

    // Check for timestamp query support for performance profiling
    if (adapter.features.has('timestamp-query')) {
      requiredFeatures.push('timestamp-query');
    }

    const device = await adapter.requestDevice({
      requiredFeatures,
      requiredLimits: {
        maxBufferSize: adapter.limits.maxBufferSize,
        maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
        maxComputeWorkgroupsPerDimension: adapter.limits.maxComputeWorkgroupsPerDimension,
      },
    });

    const preferredFormat = gpu.getPreferredCanvasFormat();

    cachedDevice = {
      device,
      adapter,
      format: preferredFormat,
      isSupported: true,
      fallbackReason: null,
    };

    return cachedDevice;
  } catch {
    return null;
  }
}

/**
 * Reset the cached device (useful for testing or context loss).
 */
export function resetWebGPUDevice(): void {
  cachedDevice = null;
}

/**
 * Get detailed information about WebGPU support for debugging.
 */
export async function getWebGPUSupportInfo(): Promise<{
  isSupported: boolean;
  fallbackReason: string | null;
  adapterInfo: string | null;
}> {
  if (!isWebGPUSupported()) {
    return {
      isSupported: false,
      fallbackReason: 'WebGPU is not supported in this browser',
      adapterInfo: null,
    };
  }

  try {
    const gpu = getNavigatorGpu();
    if (!gpu) {
      return {
        isSupported: false,
        fallbackReason: 'WebGPU is not supported in this browser',
        adapterInfo: null,
      };
    }

    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        isSupported: false,
        fallbackReason: 'No GPU adapter found',
        adapterInfo: null,
      };
    }

    // requestAdapterInfo is not yet widely supported, use fallback
    return {
      isSupported: true,
      fallbackReason: null,
      adapterInfo: 'WebGPU adapter available',
    };
  } catch (error) {
    return {
      isSupported: false,
      fallbackReason: error instanceof Error ? error.message : 'Unknown error',
      adapterInfo: null,
    };
  }
}
