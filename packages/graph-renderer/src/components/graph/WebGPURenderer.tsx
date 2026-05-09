'use client';
/**
 * @fileoverview WebGPU-accelerated graph renderer with fallback to Three.js.
 *
 * WebGPU is disabled by default until the implementation is complete with:
 * - Proper camera controls and interaction
 * - GPU-based raycasting for node selection
 * - Full feature parity with Three.js renderer
 *
 * To enable WebGPU, pass useWebGPU={true} to GraphResponseRenderer and ensure
 * the browser supports WebGPU (Chrome 113+, Edge 113+).
 *
 * Exports: WebGPURenderer
 */

import React, { useEffect, useRef, useState, useCallback, type Ref } from 'react';
import type SpriteText from 'three-spritetext';
import type { GraphData, NodeObject, LinkObject } from '@intellea/graph-schema';
import {
  getWebGPUDevice,
  getWebGPUSupportInfo,
  type WebGPUDevice,
} from '../../lib/webgpu/device';
import { WebGPUCamera } from '../../lib/webgpu/camera';
import { NODE_VERTEX_SHADER, NODE_FRAGMENT_SHADER, LINK_VERTEX_SHADER, LINK_FRAGMENT_SHADER } from '../../lib/webgpu/shaders';
import { GPUBufferUsage, GPUTextureUsage } from '../../lib/webgpu/constants';
import type {
  GpuBindGroup,
  GpuBuffer,
  GpuCanvasContext,
  GpuRenderPipeline,
} from '../../lib/webgpu/types';
import GraphCanvasRenderer from './GraphCanvasRenderer';
import type { GraphRendererHandle } from './GraphRendererHandle';

/**
 * Parse CSS color string to RGBA.
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { r: 1, g: 1, b: 1, a: 1 };
  ctx.fillStyle = color;
  const computed = ctx.fillStyle;
  const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (match) {
    return {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255,
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 1, g: 1, b: 1, a: 1 };
}

function getCanvasPixelSize(width: number, height: number): [number, number] {
  const ratio = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  return [
    Math.max(1, Math.floor(width * ratio)),
    Math.max(1, Math.floor(height * ratio)),
  ];
}

function syncCanvasPixelSize(canvas: HTMLCanvasElement, width: number, height: number): [number, number] {
  const [pixelWidth, pixelHeight] = getCanvasPixelSize(width, height);
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  return [pixelWidth, pixelHeight];
}

function getWebGPUCanvasContext(canvas: HTMLCanvasElement): GpuCanvasContext | null {
  return canvas.getContext('webgpu') as unknown as GpuCanvasContext | null;
}

interface WebGPURendererProps {
  data?: GraphData;
  width: number;
  height: number;
  backgroundColor: string;
  antialias?: boolean;
  useLighting?: boolean;
  getNodeColor: (node: NodeObject) => string;
  getNodeVal: (node: NodeObject) => number;
  getLinkColor: (link: LinkObject) => string;
  getNodeSprite?: (node: NodeObject) => SpriteText | null;
  enablePointerInteraction: boolean;
  onNodeHover?: (node: NodeObject | null, previousNode: NodeObject | null) => void;
  onNodeClick?: (node: NodeObject, event: MouseEvent) => void;
  onNodeRightClick?: (node: NodeObject, event: MouseEvent) => void;
  onBackgroundClick?: (event: MouseEvent) => void;
  onBackgroundRightClick?: (event: MouseEvent) => void;
  onRendererChange?: (renderer: 'webgpu' | 'threejs') => void;
  ref?: Ref<GraphRendererHandle>;
}

function WebGPURenderer(
  {
    data,
    width,
    height,
    backgroundColor,
    antialias = true,
    useLighting = false,
    getNodeColor,
    getNodeVal,
    getLinkColor,
    getNodeSprite,
    enablePointerInteraction,
    onNodeHover,
    onNodeClick,
    onNodeRightClick,
    onBackgroundClick,
    onBackgroundRightClick,
    onRendererChange,
    ref: forwardedRef,
  }: WebGPURendererProps
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [webgpuDevice, setWebgpuDevice] = useState<WebGPUDevice | null>(null);
    const [useWebGPU, setUseWebGPU] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [supportInfo, setSupportInfo] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');
    const threeRef = useRef<GraphRendererHandle>(null);

    // WebGPU rendering state
    const cameraRef = useRef<WebGPUCamera | null>(null);
    const nodePipelineRef = useRef<GpuRenderPipeline | null>(null);
    const linkPipelineRef = useRef<GpuRenderPipeline | null>(null);
    const nodeBufferRef = useRef<GpuBuffer | null>(null);
    const linkBufferRef = useRef<GpuBuffer | null>(null);
    const uniformBufferRef = useRef<GpuBuffer | null>(null);
    const nodeBindGroupRef = useRef<GpuBindGroup | null>(null);
    const linkBindGroupRef = useRef<GpuBindGroup | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isInitializedRef = useRef(false);
    const hasInitializedDeviceRef = useRef(false);

    // Initialize WebGPU device and context together
    useEffect(() => {
      if (hasInitializedDeviceRef.current) {
        return;
      }

      let mounted = true;

      const initWebGPU = async () => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('WebGPU canvas is not mounted');

        hasInitializedDeviceRef.current = true;

        setDebugInfo('Checking support...');
        const info = await getWebGPUSupportInfo();
        setSupportInfo(info.adapterInfo);

        if (!info.isSupported) {
          setDebugInfo('WebGPU not supported');
          if (mounted) {
            setUseWebGPU(false);
            setIsLoading(false);
            onRendererChange?.('threejs');
          }
          return;
        }

        setDebugInfo('Getting device...');
        const device = await getWebGPUDevice();

        if (!device) {
          setDebugInfo('Device acquisition failed');
          if (mounted) {
            setUseWebGPU(false);
            setIsLoading(false);
            onRendererChange?.('threejs');
          }
          return;
        }

        setDebugInfo('Configuring context...');

        const context = getWebGPUCanvasContext(canvas);

        if (!context) {
          setDebugInfo('WebGPU context not supported');
          if (mounted) {
            setUseWebGPU(false);
            setIsLoading(false);
            onRendererChange?.('threejs');
          }
          return;
        }

        syncCanvasPixelSize(canvas, width, height);
        context.configure({
          device: device.device,
          format: device.format,
          alphaMode: 'premultiplied',
        });

        setDebugInfo('Context configured');

        if (mounted) {
          setWebgpuDevice(device);
          setUseWebGPU(true);
          setDebugInfo('WebGPU ready');
          onRendererChange?.('webgpu');
          setIsLoading(false);
        }
      };

      initWebGPU();

      return () => {
        mounted = false;
        hasInitializedDeviceRef.current = false;
      };
    }, [height, onRendererChange, width]);

    // Render frame
    const renderFrame = useCallback(function renderWebGPUFrame() {
      if (!useWebGPU || !webgpuDevice || !canvasRef.current || !isInitializedRef.current) return;

      const canvas = canvasRef.current;
      const context = getWebGPUCanvasContext(canvas);
      if (!context) throw new Error('WebGPU context is not available');

      const device = webgpuDevice.device;
      const camera = cameraRef.current;
      const uniformBuffer = uniformBufferRef.current;
      const nodePipeline = nodePipelineRef.current;
      const linkPipeline = linkPipelineRef.current;
      const nodeBindGroup = nodeBindGroupRef.current;
      const linkBindGroup = linkBindGroupRef.current;

      if (!camera || !uniformBuffer || !nodePipeline || !linkPipeline || !nodeBindGroup || !linkBindGroup) return;

      camera.setAspect(width / height);
      const [pixelWidth, pixelHeight] = syncCanvasPixelSize(canvas, width, height);

      const viewProj = camera.getViewProjectionMatrix();
      const uniformData = new Float32Array(20);
      uniformData.set(viewProj, 0);
      uniformData[16] = pixelWidth;
      uniformData[17] = pixelHeight;

      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const depthTexture = device.createTexture({
        size: [pixelWidth, pixelHeight],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: textureView,
          clearValue: { r: 0.05, g: 0.07, b: 0.09, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      });

      if (data && data.links.length > 0) {
        renderPass.setPipeline(linkPipeline);
        renderPass.setBindGroup(0, linkBindGroup);
        renderPass.draw(4, data.links.length);
      }

      if (data && data.nodes.length > 0) {
        renderPass.setPipeline(nodePipeline);
        renderPass.setBindGroup(0, nodeBindGroup);
        renderPass.draw(4, data.nodes.length);
      }

      renderPass.end();
      device.queue.submit([commandEncoder.finish()]);
      depthTexture.destroy();

      animationFrameRef.current = requestAnimationFrame(renderWebGPUFrame);
    }, [useWebGPU, webgpuDevice, data, width, height]);

    // Initialize rendering after device is ready
    useEffect(() => {
      if (!useWebGPU || !webgpuDevice || !data) {
        return;
      }

      setDebugInfo('Initializing rendering...');

      const initWebGPURendering = async () => {
        const device = webgpuDevice.device;
        const format = webgpuDevice.format;

          // Initialize camera
          const camera = new WebGPUCamera();
          camera.setAspect(width / height);
          cameraRef.current = camera;
          setDebugInfo('Camera initialized');

          // Create uniform buffer (view_proj matrix)
          const uniformBufferSize = 80;
          const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
          uniformBufferRef.current = uniformBuffer;

          const nodes = data.nodes;
          const nodeData = new Float32Array(nodes.length * 8);
          nodes.forEach((node, i) => {
            const x = typeof node.fx === 'number' ? node.fx : node.x ?? 0;
            const y = typeof node.fy === 'number' ? node.fy : node.y ?? 0;
            const z = typeof node.fz === 'number' ? node.fz : node.z ?? 0;
            const color = parseColor(getNodeColor(node));
            const radius = getNodeVal(node);

            nodeData[i * 8 + 0] = x;
            nodeData[i * 8 + 1] = y;
            nodeData[i * 8 + 2] = z;
            nodeData[i * 8 + 3] = radius;
            nodeData[i * 8 + 4] = color.r;
            nodeData[i * 8 + 5] = color.g;
            nodeData[i * 8 + 6] = color.b;
            nodeData[i * 8 + 7] = color.a;
          });

          const nodeBuffer = device.createBuffer({
            size: nodeData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
          });
          new Float32Array(nodeBuffer.getMappedRange()).set(nodeData);
          nodeBuffer.unmap();
          nodeBufferRef.current = nodeBuffer;

          const links = data.links;
          const linkData = new Float32Array(links.length * 16);
          links.forEach((link, i) => {
            const source = typeof link.source === 'string' ? nodes.find(n => n.id === link.source) : link.source;
            const target = typeof link.target === 'string' ? nodes.find(n => n.id === link.target) : link.target;
            const color = parseColor(getLinkColor(link));
            const offset = i * 16;

            if (source && target) {
              linkData[offset + 0] = source.x ?? 0;
              linkData[offset + 1] = source.y ?? 0;
              linkData[offset + 2] = source.z ?? 0;
              linkData[offset + 3] = 0;
              linkData[offset + 4] = target.x ?? 0;
              linkData[offset + 5] = target.y ?? 0;
              linkData[offset + 6] = target.z ?? 0;
              linkData[offset + 7] = 0;
              linkData[offset + 8] = color.r;
              linkData[offset + 9] = color.g;
              linkData[offset + 10] = color.b;
              linkData[offset + 11] = color.a;
              linkData[offset + 12] = 2.0;
            }
          });

          const linkBuffer = device.createBuffer({
            size: linkData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
          });
          new Float32Array(linkBuffer.getMappedRange()).set(linkData);
          linkBuffer.unmap();
          linkBufferRef.current = linkBuffer;

          const nodeShaderModule = device.createShaderModule({ code: NODE_VERTEX_SHADER });
          const nodeFragmentShaderModule = device.createShaderModule({ code: NODE_FRAGMENT_SHADER });

          const nodeShaderCompilationInfo = await nodeShaderModule.getCompilationInfo();
          if (nodeShaderCompilationInfo.messages.length > 0) {
            throw new Error(nodeShaderCompilationInfo.messages.map((message) => message.message).join('\n'));
          }

          const nodeFragmentCompilationInfo = await nodeFragmentShaderModule.getCompilationInfo();
          if (nodeFragmentCompilationInfo.messages.length > 0) {
            throw new Error(nodeFragmentCompilationInfo.messages.map((message) => message.message).join('\n'));
          }

          const nodePipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
              module: nodeShaderModule,
              entryPoint: 'vertexMain',
            },
            fragment: {
              module: nodeFragmentShaderModule,
              entryPoint: 'fragmentMain',
              targets: [{ format }],
            },
            primitive: {
              topology: 'triangle-strip',
            },
            depthStencil: {
              depthWriteEnabled: true,
              depthCompare: 'less',
              format: 'depth24plus',
            },
          });
          nodePipelineRef.current = nodePipeline;

          const linkShaderModule = device.createShaderModule({
            code: LINK_VERTEX_SHADER,
          });
          const linkFragmentShaderModule = device.createShaderModule({
            code: LINK_FRAGMENT_SHADER,
          });

          const linkPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
              module: linkShaderModule,
              entryPoint: 'vertexMain',
            },
            fragment: {
              module: linkFragmentShaderModule,
              entryPoint: 'fragmentMain',
              targets: [
                {
                  format,
                  blend: {
                    color: {
                      srcFactor: 'src-alpha',
                      dstFactor: 'one-minus-src-alpha',
                      operation: 'add',
                    },
                    alpha: {
                      srcFactor: 'one',
                      dstFactor: 'one-minus-src-alpha',
                      operation: 'add',
                    },
                  },
                },
              ],
            },
            primitive: {
              topology: 'triangle-strip',
            },
            depthStencil: {
              depthWriteEnabled: false,
              depthCompare: 'less',
              format: 'depth24plus',
            },
          });
          linkPipelineRef.current = linkPipeline;

          const nodeBindGroup = device.createBindGroup({
            layout: nodePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: { buffer: nodeBuffer } },
            ],
          });
          nodeBindGroupRef.current = nodeBindGroup;

          const linkBindGroup = device.createBindGroup({
            layout: linkPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: { buffer: linkBuffer } },
            ],
          });
          linkBindGroupRef.current = linkBindGroup;

          isInitializedRef.current = true;
          setDebugInfo('Rendering initialized');

          renderFrame();
      };

      initWebGPURendering();

      return () => {
        isInitializedRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [useWebGPU, webgpuDevice, data, getNodeColor, getNodeVal, getLinkColor, width, height, renderFrame]);



    // Forward ref to provide handle methods
    React.useImperativeHandle(
      forwardedRef,
      () => {
        if (useWebGPU && cameraRef.current) {
          return {
            cameraPosition: (position, lookAt, transitionMs) => {
              if (position) {
                cameraRef.current!.setPosition({
                  x: position.x ?? cameraRef.current!.getPosition().x,
                  y: position.y ?? cameraRef.current!.getPosition().y,
                  z: position.z ?? cameraRef.current!.getPosition().z,
                });
              }
              if (lookAt) {
                cameraRef.current!.setTarget(lookAt);
              }
            },
            zoomToFit: (durationMs = 0, padding = 1.2) => {
              if (!data || data.nodes.length === 0) return;

              let minX = Infinity, minY = Infinity, minZ = Infinity;
              let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

              data.nodes.forEach((node) => {
                const x = typeof node.fx === 'number' ? node.fx : node.x ?? 0;
                const y = typeof node.fy === 'number' ? node.fy : node.y ?? 0;
                const z = typeof node.fz === 'number' ? node.fz : node.z ?? 0;

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                minZ = Math.min(minZ, z);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                maxZ = Math.max(maxZ, z);
              });

              cameraRef.current!.zoomToFit(
                { x: minX, y: minY, z: minZ },
                { x: maxX, y: maxY, z: maxZ },
                padding
              );
            },
            pauseAnimation: () => {
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
            },
            resumeAnimation: () => {
              if (!animationFrameRef.current) {
                renderFrame();
              }
            },
            renderOnce: () => {
              if (isInitializedRef.current) {
                renderFrame();
              }
            },
            controls: () => undefined,
            renderer: () => undefined,
          };
        }

        return threeRef.current || {
          cameraPosition: () => { throw new Error('Renderer not ready'); },
          zoomToFit: () => { throw new Error('Renderer not ready'); },
          pauseAnimation: () => {},
          resumeAnimation: () => {},
          renderOnce: () => {},
          controls: () => undefined,
          renderer: () => undefined,
        } as GraphRendererHandle;
      },
      [useWebGPU, threeRef, cameraRef, renderFrame, data]
    );

    if (!useWebGPU) {
      return (
        <GraphCanvasRenderer
          ref={threeRef}
          data={data}
          width={width}
          height={height}
          backgroundColor={backgroundColor}
          antialias={antialias}
          useLighting={useLighting}
          getNodeColor={getNodeColor}
          getNodeVal={getNodeVal}
          getLinkColor={getLinkColor}
          getNodeSprite={getNodeSprite}
          enablePointerInteraction={enablePointerInteraction}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          onNodeRightClick={onNodeRightClick}
          onBackgroundClick={onBackgroundClick}
          onBackgroundRightClick={onBackgroundRightClick}
        />
      );
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: backgroundColor,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B9DB5',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            Initializing renderer...
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#0AFFD9',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          WebGPU renderer • {supportInfo} • {debugInfo}
        </div>
      </div>
    );
}

export default WebGPURenderer;