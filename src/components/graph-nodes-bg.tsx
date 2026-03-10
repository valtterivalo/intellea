/**
 * @fileoverview Decorative animated graph background — CSS-only, server-renderable.
 * Mirrors the product's graph output aesthetic: floating nodes connected by pulsing edges.
 * Exports: GraphNodesBg
 */

/** Graph node with fixed SVG coordinates. */
type GraphNode = { id: number; cx: number; cy: number };

/** Edge as an index pair into NODES. */
type GraphEdge = [number, number];

const NODES: GraphNode[] = [
  { id: 0, cx: 280, cy: 55  },
  { id: 1, cx: 385, cy: 90  },
  { id: 2, cx: 345, cy: 160 },
  { id: 3, cx: 448, cy: 135 },
  { id: 4, cx: 262, cy: 148 },
  { id: 5, cx: 318, cy: 238 },
  { id: 6, cx: 428, cy: 208 },
  { id: 7, cx: 218, cy: 212 },
  { id: 8, cx: 172, cy: 82  },
  { id: 9, cx: 368, cy: 308 },
];

const EDGES: GraphEdge[] = [
  [0, 1], [0, 4], [0, 8],
  [1, 2], [1, 3],
  [2, 4], [2, 5],
  [3, 6],
  [5, 6], [5, 7], [5, 9],
  [7, 8],
  [6, 9],
];

/** Accent color for graph elements. */
const ACCENT = '#0AFFD9';

export function GraphNodesBg() {
  return (
    <svg
      viewBox="0 0 500 360"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* edges — rendered before nodes so nodes sit on top */}
      {EDGES.map(([a, b], i) => (
        <line
          key={`edge-${a}-${b}`}
          x1={NODES[a].cx}
          y1={NODES[a].cy}
          x2={NODES[b].cx}
          y2={NODES[b].cy}
          stroke={ACCENT}
          strokeWidth="0.6"
          className={`graph-edge-${i}`}
        />
      ))}

      {/* nodes — each in a <g> that floats via CSS animation */}
      {NODES.map(({ id, cx, cy }) => (
        <g key={`node-${id}`} className={`graph-node-${id}`}>
          {/* outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={9}
            fill="none"
            stroke={ACCENT}
            strokeWidth="0.5"
            opacity={0.12}
          />
          {/* inner dot — opacity animated separately */}
          <circle
            cx={cx}
            cy={cy}
            r={2.8}
            fill={ACCENT}
            className={`graph-dot-${id}`}
          />
        </g>
      ))}
    </svg>
  );
}
