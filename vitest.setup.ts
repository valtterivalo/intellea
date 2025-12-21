import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { createClient as _createRedisClient } from '@/lib/redis';
import { afterAll } from 'vitest';

const originalEmitWarning = process.emitWarning.bind(process);
type EmitWarningArgs = Parameters<typeof process.emitWarning>;
process.emitWarning = ((...args: EmitWarningArgs) => {
  const [warning] = args;
  if (typeof warning === 'string' && warning.includes('--localstorage-file')) {
    return;
  }
  return originalEmitWarning(...args);
}) as typeof process.emitWarning;

// Add polyfill for ResizeObserver used by components relying on it in browser environments.
// jsdom doesn't implement this API, so we stub minimal methods for tests.

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserver {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {/* noop */}
    unobserve() {/* noop */}
    disconnect() {/* noop */}
  }
  // @ts-ignore
  window.ResizeObserver = ResizeObserver;
  // @ts-ignore
  global.ResizeObserver = ResizeObserver;
}

// jsdom lacks canvas implementation; provide minimal stub to satisfy three.js during tests.
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  (HTMLCanvasElement.prototype as any).getContext = () => null;
}

// Provide stub for three-spritetext that avoids WebGL / canvas usage
// This must be defined before components import it.
vi.mock('three-spritetext', async () => {
  const THREE = await import('three');
  class FakeSprite extends THREE.Object3D {
    material: { depthWrite: boolean };
    textHeight: number;

    constructor() {
      super();
      // minimal stubbed properties used in code
      this.material = { depthWrite: false };
      this.textHeight = 0;
    }
  }
  return { __esModule: true, default: FakeSprite };
});

// ensure Redis mock does not keep the event loop alive
afterAll(async () => {
  try {
    const r = _createRedisClient();
    if (typeof (r as any).disconnect === 'function') (r as any).disconnect();
    if (typeof (r as any).quit === 'function') await (r as any).quit();
  } catch {}
});
