# WebGPU Renderer

Experimental GPU rendering for graph previews. WebGPU is opt-in and falls back to Three.js when the browser cannot create a WebGPU device.

## Status

The renderer initializes and draws the sample graph in a WebGPU-enabled browser. The bug that looked like a React effect failure was a mount-order bug: the component returned a loading placeholder before mounting the canvas, so `canvasRef.current` stayed null during initialization.

Verified:

- `pnpm type-check`
- `pnpm lint`
- `dev-browser --connect` on `/examples/webgpu`
- WebGPU toggle shows `Rendering initialized` and renders nodes plus links

## Usage

```tsx
<GraphResponseRenderer
  graphResponse={graphResponse}
  useWebGPU={true}
/>
```

WebGPU is disabled by default. Keep Three.js as the production path until interaction and labels reach parity.

## Browser support

WebGPU support depends on browser and hardware:

- Chrome 113+
- Edge 113+
- Firefox Nightly with WebGPU enabled
- Safari Technology Preview with WebGPU enabled

Unsupported browsers fall back to Three.js.

## Exported utilities

```ts
import {
  getWebGPUDevice,
  getWebGPUSupportInfo,
  isWebGPUSupported,
} from '@intellea/graph-renderer';
```

`isWebGPUSupported()` checks for `navigator.gpu`.

`getWebGPUSupportInfo()` reports support and adapter availability.

`getWebGPUDevice()` returns a cached WebGPU device or `null` if initialization fails.

## Renderer pipeline

1. Mount a canvas immediately.
2. Request a WebGPU adapter and device.
3. Configure the canvas context with the preferred format.
4. Upload node and link data to storage buffers.
5. Upload camera and viewport data to a uniform buffer.
6. Draw links and nodes with instanced quads.
7. Continue rendering with `requestAnimationFrame`.

## Implemented

- WebGPU device detection and caching
- Canvas context configuration
- Camera projection and `zoomToFit`
- Node buffer upload
- Link buffer upload
- WGSL node and link shaders
- Instanced quad rendering for nodes and links
- Canvas pixel-size synchronization
- Three.js fallback path

## Current limits

- No pointer picking in WebGPU mode
- No label rendering in WebGPU mode
- No WebGPU orbit controls wired to pointer events
- No GPU timestamp profiling
- No buffer pool or partial buffer updates
- No force simulation on GPU

## Next work

1. Wire pointer controls to `WebGPUCamera`.
2. Add CPU picking first, then GPU picking when the interaction shape is stable.
3. Add label rendering with sprites or a texture atlas.
4. Add buffer reuse for dynamic graph updates.
5. Add browser-based WebGPU benchmark coverage.
