'use client';
/**
 * @fileoverview Custom three.js renderer for graph data.
 * Exports: GraphCanvasRenderer
 */

import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import SpriteText from 'three-spritetext';
import type { GraphData, NodeObject, LinkObject } from '@intellea/graph-schema';
import type { GraphRendererHandle, GraphRendererCoords } from './GraphRendererHandle';
import { parseColorStyle } from '../../lib/graphColorStyle';

interface GraphCanvasRendererProps {
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
}

const getNodePosition = (node: NodeObject): GraphRendererCoords => {
  const x = typeof node.fx === 'number' ? node.fx : node.x;
  const y = typeof node.fy === 'number' ? node.fy : node.y;
  const z = typeof node.fz === 'number' ? node.fz : node.z;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    throw new Error(`node ${node.id} is missing a 3d position`);
  }
  return { x, y, z };
};

const GraphCanvasRenderer = React.forwardRef<GraphRendererHandle, GraphCanvasRendererProps>(
  function GraphCanvasRenderer(
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
    },
    forwardedRef
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
    const linkMeshRef = useRef<THREE.LineSegments | null>(null);
    const labelGroupRef = useRef<THREE.Group | null>(null);
    const nodeIndexToIdRef = useRef<string[]>([]);
    const nodeIdToIndexRef = useRef<Map<string, number>>(new Map());
    const nodeByIdRef = useRef<Map<string, NodeObject>>(new Map());
    const nodePositionsRef = useRef<Float32Array | null>(null);
    const nodeRadiiRef = useRef<Float32Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const hoverRafRef = useRef<number | null>(null);
    const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
    const isAnimatingRef = useRef(false);
    const lastDragAtRef = useRef<number | null>(null);
    const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
    const pointerMovedRef = useRef(false);
    const hoverStateRef = useRef<{ current: NodeObject | null; previous: NodeObject | null }>({
      current: null,
      previous: null,
    });
    const lastHoverHitRef = useRef<{
      node: NodeObject;
      x: number;
      y: number;
      time: number;
    } | null>(null);
    const dragSuppressMs = 240;
    const dragThresholdSq = 16;
    const pickPadding = 1.1;
    const hoverGraceMs = 120;
    const hoverStickPx = 6;

    const geometryKey = useMemo(() => {
      if (!data) return '0:0';
      return `${data.nodes.length}:${data.links.length}`;
    }, [data]);

    const renderOnce = useCallback(() => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return;
      renderer.render(scene, camera);
    }, []);

    const stopLoop = useCallback(() => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, []);

    const startLoop = useCallback(() => {
      if (animationFrameRef.current !== null) return;
      const step = () => {
        if (!isAnimatingRef.current) {
          animationFrameRef.current = null;
          return;
        }
        animationFrameRef.current = requestAnimationFrame(step);
        const controls = controlsRef.current;
        controls?.update();
        renderOnce();
      };
      animationFrameRef.current = requestAnimationFrame(step);
    }, [renderOnce]);

    const pauseAnimation = () => {
      isAnimatingRef.current = false;
      stopLoop();
    };

    const resumeAnimation = () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      startLoop();
    };

    const animateCamera = (
      from: GraphRendererCoords,
      to: GraphRendererCoords,
      lookAt: GraphRendererCoords,
      durationMs: number
    ) => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const next = {
          x: THREE.MathUtils.lerp(from.x, to.x, progress),
          y: THREE.MathUtils.lerp(from.y, to.y, progress),
          z: THREE.MathUtils.lerp(from.z, to.z, progress),
        };
        const camera = cameraRef.current;
        if (!camera) return;
        camera.position.set(next.x, next.y, next.z);
        controlsRef.current?.target.set(lookAt.x, lookAt.y, lookAt.z);
        controlsRef.current?.update();
        renderOnce();
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    useImperativeHandle(forwardedRef, () => ({
      cameraPosition: (position, lookAt, transitionMs) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;
        const next = {
          x: position.x ?? camera.position.x,
          y: position.y ?? camera.position.y,
          z: position.z ?? camera.position.z,
        };
        const target = lookAt ?? { x: controls.target.x, y: controls.target.y, z: controls.target.z };
        const duration = transitionMs ?? 0;
        if (duration > 0) {
          const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
          animateCamera(from, next, target, duration);
          return;
        }
        camera.position.set(next.x, next.y, next.z);
        controls.target.set(target.x, target.y, target.z);
        controls.update();
        renderOnce();
      },
      zoomToFit: (durationMs = 0, padding = 80) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const positions = nodePositionsRef.current;
        if (!camera || !controls || !positions || positions.length === 0) return;
        const box = new THREE.Box3();
        const temp = new THREE.Vector3();
        for (let index = 0; index < positions.length; index += 3) {
          temp.set(positions[index], positions[index + 1], positions[index + 2]);
          box.expandByPoint(temp);
        }
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera.fov * Math.PI) / 180;
        const distance = maxDim / (2 * Math.tan(fov / 2)) + padding;
        const next = {
          x: center.x,
          y: center.y,
          z: center.z + distance,
        };
        const target = { x: center.x, y: center.y, z: center.z };
        if (durationMs > 0) {
          const from = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
          animateCamera(from, next, target, durationMs);
          return;
        }
        camera.position.set(next.x, next.y, next.z);
        controls.target.set(target.x, target.y, target.z);
        controls.update();
        renderOnce();
      },
      renderOnce,
      pauseAnimation,
      resumeAnimation,
      controls: () => controlsRef.current ?? undefined,
      renderer: () => rendererRef.current ?? undefined,
    }));

    const antialiasRef = useRef(antialias);

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#000000');
      const camera = new THREE.PerspectiveCamera(60, 1, 1, 8000);
      camera.position.set(0, 0, 520);

      const renderer = new THREE.WebGLRenderer({
        antialias: antialiasRef.current,
        powerPreference: 'high-performance',
      });
      renderer.setSize(1, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 0.8;
      const handleControlsChange = () => {
        if (!isAnimatingRef.current) {
          renderOnce();
        }
      };
      controls.addEventListener('change', handleControlsChange);

      if (useLighting) {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(120, 160, 180);
        scene.add(ambient, directional);
      }

      const labelGroup = new THREE.Group();
      scene.add(labelGroup);

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      controlsRef.current = controls;
      labelGroupRef.current = labelGroup;

      return () => {
        stopLoop();
        controls.removeEventListener('change', handleControlsChange);
        controls.dispose();
        if (nodeMeshRef.current) {
          nodeMeshRef.current.geometry.dispose();
          (nodeMeshRef.current.material as THREE.Material).dispose();
        }
        if (linkMeshRef.current) {
          linkMeshRef.current.geometry.dispose();
          (linkMeshRef.current.material as THREE.Material).dispose();
        }
        renderer.dispose();
        container.removeChild(renderer.domElement);
        scene.clear();
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        controlsRef.current = null;
        labelGroupRef.current = null;
        nodeMeshRef.current = null;
        linkMeshRef.current = null;
      };
    }, [renderOnce, startLoop, stopLoop, useLighting]);

    useEffect(() => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!renderer || !camera) return;
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderOnce();
    }, [width, height, renderOnce]);

    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;
      scene.background = new THREE.Color(backgroundColor);
      renderOnce();
    }, [backgroundColor, renderOnce]);

    useEffect(() => {
      if (!data) return;
      const scene = sceneRef.current;
      if (!scene) return;

      const nodes = data.nodes;
      const links = data.links;

      const nodeIdToIndex = new Map<string, number>();
      const nodeIndexToId: string[] = [];
      const nodeById = new Map<string, NodeObject>();
      const nodePositions = new Float32Array(nodes.length * 3);
      const nodeRadii = new Float32Array(nodes.length);
      nodes.forEach((node, index) => {
        const pos = getNodePosition(node);
        nodeIdToIndex.set(node.id, index);
        nodeIndexToId[index] = node.id;
        nodeById.set(node.id, node);
        nodePositions[index * 3] = pos.x;
        nodePositions[index * 3 + 1] = pos.y;
        nodePositions[index * 3 + 2] = pos.z;
        nodeRadii[index] = 0;
      });
      nodeIdToIndexRef.current = nodeIdToIndex;
      nodeIndexToIdRef.current = nodeIndexToId;
      nodeByIdRef.current = nodeById;
      nodePositionsRef.current = nodePositions;
      nodeRadiiRef.current = nodeRadii;

      if (!nodeMeshRef.current || nodeMeshRef.current.count !== nodes.length) {
        if (nodeMeshRef.current) {
          scene.remove(nodeMeshRef.current);
          nodeMeshRef.current.geometry.dispose();
          (nodeMeshRef.current.material as THREE.Material).dispose();
        }
        const geometry = useLighting
          ? new THREE.IcosahedronGeometry(1, 0)
          : new THREE.OctahedronGeometry(1, 0);
        const material = useLighting
          ? new THREE.MeshLambertMaterial({ vertexColors: true })
          : new THREE.MeshBasicMaterial({ vertexColors: true });
        const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nodes.length * 3), 3);
        nodeMeshRef.current = mesh;
        scene.add(mesh);
      }

      if (!linkMeshRef.current || linkMeshRef.current.geometry.getAttribute('position').count !== links.length * 2) {
        if (linkMeshRef.current) {
          scene.remove(linkMeshRef.current);
          linkMeshRef.current.geometry.dispose();
          (linkMeshRef.current.material as THREE.Material).dispose();
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(links.length * 2 * 3), 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(links.length * 2 * 3), 3));
        const material = new THREE.LineBasicMaterial({ vertexColors: true });
        const lines = new THREE.LineSegments(geometry, material);
        linkMeshRef.current = lines;
        scene.add(lines);
      }

      renderOnce();
    }, [geometryKey, data, renderOnce, useLighting]);

    useEffect(() => {
      if (!data) return;
      const nodeMesh = nodeMeshRef.current;
      const linkMesh = linkMeshRef.current;
      if (!nodeMesh || !linkMesh) return;

      const nodes = data.nodes;
      const links = data.links;
      const nodeIdToIndex = nodeIdToIndexRef.current;
      const nodePositions = nodePositionsRef.current;
      const nodeRadii = nodeRadiiRef.current;
      if (!nodePositions) return;

      const tempObject = new THREE.Object3D();
      const tempColor = new THREE.Color();

      nodes.forEach((node, index) => {
        const pos = {
          x: nodePositions[index * 3],
          y: nodePositions[index * 3 + 1],
          z: nodePositions[index * 3 + 2],
        };
        const nodeScale = Math.max(getNodeVal(node) * 0.55, 0.6);
        tempObject.position.set(pos.x, pos.y, pos.z);
        tempObject.scale.set(nodeScale, nodeScale, nodeScale);
        tempObject.updateMatrix();
        nodeMesh.setMatrixAt(index, tempObject.matrix);
        const color = parseColorStyle(getNodeColor(node), tempColor);
        nodeMesh.setColorAt(index, color);
        if (nodeRadii) {
          nodeRadii[index] = nodeScale * pickPadding;
        }
      });
      nodeMesh.instanceMatrix.needsUpdate = true;
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;

      const positionAttribute = linkMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttribute = linkMesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      for (let index = 0; index < links.length; index += 1) {
        const link = links[index];
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const sourceIndex = nodeIdToIndex.get(sourceId);
        const targetIndex = nodeIdToIndex.get(targetId);
        if (sourceIndex === undefined || targetIndex === undefined) continue;
        const sourcePosIndex = sourceIndex * 3;
        const targetPosIndex = targetIndex * 3;
        const writeIndex = index * 6;
        positionAttribute.array[writeIndex] = nodePositions[sourcePosIndex];
        positionAttribute.array[writeIndex + 1] = nodePositions[sourcePosIndex + 1];
        positionAttribute.array[writeIndex + 2] = nodePositions[sourcePosIndex + 2];
        positionAttribute.array[writeIndex + 3] = nodePositions[targetPosIndex];
        positionAttribute.array[writeIndex + 4] = nodePositions[targetPosIndex + 1];
        positionAttribute.array[writeIndex + 5] = nodePositions[targetPosIndex + 2];

        const linkColor = parseColorStyle(getLinkColor(link), tempColor);
        colorAttribute.array[writeIndex] = linkColor.r;
        colorAttribute.array[writeIndex + 1] = linkColor.g;
        colorAttribute.array[writeIndex + 2] = linkColor.b;
        colorAttribute.array[writeIndex + 3] = linkColor.r;
        colorAttribute.array[writeIndex + 4] = linkColor.g;
        colorAttribute.array[writeIndex + 5] = linkColor.b;
      }
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;

      if (getNodeSprite) {
        const labelGroup = labelGroupRef.current;
        if (labelGroup) {
          labelGroup.clear();
          nodes.forEach((node, index) => {
            const sprite = getNodeSprite(node);
            if (!sprite) return;
            const yOffset = sprite.position.y;
            const posIndex = index * 3;
            sprite.position.set(
              nodePositions[posIndex],
              nodePositions[posIndex + 1] + yOffset,
              nodePositions[posIndex + 2]
            );
            sprite.userData.nodeId = node.id;
            labelGroup.add(sprite);
          });
        }
      }

      renderOnce();
    }, [data, getNodeColor, getNodeVal, getLinkColor, getNodeSprite, renderOnce]);

    useEffect(() => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const domElement = renderer.domElement;
      const tmpVec = new THREE.Vector3();
      const tmpProjected = new THREE.Vector3();
      const cameraPos = new THREE.Vector3();

      const pickNodeAt = (clientX: number, clientY: number): NodeObject | null => {
        const camera = cameraRef.current;
        const positions = nodePositionsRef.current;
        const radii = nodeRadiiRef.current;
        if (!camera || !positions || !radii) return null;
        const bounds = domElement.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return null;
        const pointerX = clientX - bounds.left;
        const pointerY = clientY - bounds.top;
        cameraPos.copy(camera.position);
        const fov = (camera.fov * Math.PI) / 180;
        const focal = (bounds.height / 2) / Math.tan(fov / 2);
        let closestIndex = -1;
        let closestDistSq = Number.POSITIVE_INFINITY;
        for (let index = 0; index < radii.length; index += 1) {
          const posIndex = index * 3;
          const nodeX = positions[posIndex];
          const nodeY = positions[posIndex + 1];
          const nodeZ = positions[posIndex + 2];
          tmpVec.set(nodeX, nodeY, nodeZ);
          tmpProjected.copy(tmpVec).project(camera);
          if (tmpProjected.z < -1 || tmpProjected.z > 1) continue;
          const screenX = (tmpProjected.x + 1) * 0.5 * bounds.width;
          const screenY = (1 - (tmpProjected.y + 1) * 0.5) * bounds.height;
          const dx = pointerX - screenX;
          const dy = pointerY - screenY;
          const distSq = dx * dx + dy * dy;
          const radius = radii[index];
          const distToCamera = cameraPos.distanceTo(tmpVec);
          const radiusPx = Math.max(2, (radius / Math.max(distToCamera, 1e-4)) * focal);
          if (distSq <= radiusPx * radiusPx && distSq < closestDistSq) {
            closestDistSq = distSq;
            closestIndex = index;
          }
        }
        if (closestIndex === -1) return null;
        const nodeId = nodeIndexToIdRef.current[closestIndex];
        return nodeByIdRef.current.get(nodeId) ?? null;
      };

      const handleMove = (event: MouseEvent) => {
        if (!enablePointerInteraction) return;
        pendingPointerRef.current = { x: event.clientX, y: event.clientY };
        if (hoverRafRef.current !== null) return;
        hoverRafRef.current = window.requestAnimationFrame(() => {
          hoverRafRef.current = null;
          const pending = pendingPointerRef.current;
          if (!pending) return;
          const previous = hoverStateRef.current.current;
          const node = pickNodeAt(pending.x, pending.y);
          if (node) {
            lastHoverHitRef.current = {
              node,
              x: pending.x,
              y: pending.y,
              time: performance.now(),
            };
            if (node !== previous) {
              hoverStateRef.current = { current: node, previous };
              onNodeHover?.(node, previous);
            }
            return;
          }
          if (previous) {
            const lastHit = lastHoverHitRef.current;
            if (lastHit && lastHit.node === previous) {
              const dt = performance.now() - lastHit.time;
              const dx = pending.x - lastHit.x;
              const dy = pending.y - lastHit.y;
              if (dt < hoverGraceMs && dx * dx + dy * dy < hoverStickPx * hoverStickPx) {
                return;
              }
            }
            hoverStateRef.current = { current: null, previous };
            onNodeHover?.(null, previous);
          }
        });
      };

      const handleClick = (event: MouseEvent) => {
        const lastDragAt = lastDragAtRef.current;
        if (lastDragAt !== null && performance.now() - lastDragAt < dragSuppressMs) return;
        if (!enablePointerInteraction) {
          onBackgroundClick?.(event);
          return;
        }
        const camera = cameraRef.current;
        if (!camera) {
          onBackgroundClick?.(event);
          return;
        }
        const node = pickNodeAt(event.clientX, event.clientY);
        if (node) {
          onNodeClick?.(node, event);
          return;
        }
        onBackgroundClick?.(event);
      };

      const handleContext = (event: MouseEvent) => {
        event.preventDefault();
        const lastDragAt = lastDragAtRef.current;
        if (lastDragAt !== null && performance.now() - lastDragAt < dragSuppressMs) return;
        if (!enablePointerInteraction) {
          onBackgroundRightClick?.(event);
          return;
        }
        const camera = cameraRef.current;
        if (!camera) {
          onBackgroundRightClick?.(event);
          return;
        }
        const node = pickNodeAt(event.clientX, event.clientY);
        if (node) {
          onNodeRightClick?.(node, event);
          return;
        }
        onBackgroundRightClick?.(event);
      };

      const handlePointerDown = (event: PointerEvent) => {
        pointerDownRef.current = { x: event.clientX, y: event.clientY };
        pointerMovedRef.current = false;
      };

      const handlePointerMove = (event: PointerEvent) => {
        const start = pointerDownRef.current;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (dx * dx + dy * dy > dragThresholdSq) {
          pointerMovedRef.current = true;
        }
      };

      const handlePointerUp = () => {
        if (pointerMovedRef.current) {
          lastDragAtRef.current = performance.now();
        }
        pointerDownRef.current = null;
        pointerMovedRef.current = false;
      };

      const handlePointerCancel = () => {
        pointerDownRef.current = null;
        pointerMovedRef.current = false;
      };

      domElement.addEventListener('pointerdown', handlePointerDown);
      domElement.addEventListener('pointermove', handlePointerMove);
      domElement.addEventListener('pointerup', handlePointerUp);
      domElement.addEventListener('pointerleave', handlePointerCancel);
      domElement.addEventListener('pointercancel', handlePointerCancel);

      if (enablePointerInteraction) {
        domElement.addEventListener('mousemove', handleMove);
        domElement.addEventListener('click', handleClick);
        domElement.addEventListener('contextmenu', handleContext);
      }

      return () => {
        domElement.removeEventListener('pointerdown', handlePointerDown);
        domElement.removeEventListener('pointermove', handlePointerMove);
        domElement.removeEventListener('pointerup', handlePointerUp);
        domElement.removeEventListener('pointerleave', handlePointerCancel);
        domElement.removeEventListener('pointercancel', handlePointerCancel);
        domElement.removeEventListener('mousemove', handleMove);
        domElement.removeEventListener('click', handleClick);
        domElement.removeEventListener('contextmenu', handleContext);
        if (hoverRafRef.current !== null) {
          cancelAnimationFrame(hoverRafRef.current);
          hoverRafRef.current = null;
        }
      };
    }, [
      data,
      enablePointerInteraction,
      onNodeHover,
      onNodeClick,
      onNodeRightClick,
      onBackgroundClick,
      onBackgroundRightClick,
    ]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

export default GraphCanvasRenderer;
