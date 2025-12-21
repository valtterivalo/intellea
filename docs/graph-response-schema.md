# graph response schema (v0)

## intent
this schema defines a renderer-friendly, use-case agnostic graph response. it is the core contract between any llm output adapter and the visual graph renderer. the source of truth lives in `@intellea/graph-schema`.

## versioning
- `version` is required and currently set to `v0`
- schema changes should be additive within v0 when possible
- breaking changes should increment the version and introduce a migration adapter

## structure
```
GraphResponseV0
  - version: 'v0'
  - mode: 'map' | 'decision' | 'plan' | 'argument'
  - nodes: GraphNodeV0[]
  - edges: GraphEdgeV0[]
  - layout?: GraphLayoutHintV0
  - view?: GraphViewHintV0
  - meta?: Record<string, unknown>
```

## nodes
```
GraphNodeV0
  - id: string
  - label: string
  - type: 'entity' | 'claim' | 'action' | 'option' | 'constraint' | 'evidence' | 'risk' | 'question'
  - summary?: string
  - confidence?: number (0..1)
  - timeRange?: { start?: string; end?: string }
  - sourceIds?: string[]
  - tags?: string[]
  - position?: { x: number; y: number; z?: number; isFixed?: boolean }
  - meta?: Record<string, unknown>
```

## edges
```
GraphEdgeV0
  - source: string
  - target: string
  - type: 'supports' | 'contradicts' | 'depends_on' | 'causes' | 'risks' | 'mitigates' | 'relates_to'
  - label?: string
  - weight?: number (0..1)
  - meta?: Record<string, unknown>
```

## view + layout hints
```
GraphLayoutHintV0
  - algorithm: 'umap' | 'force' | 'radial' | 'grid'
  - dimensions: 2 | 3
  - nodeSpacing?: number
  - isDeterministic?: boolean

GraphViewHintV0
  - labelDensity?: 'low' | 'medium' | 'high'
  - defaultFocusNodeId?: string
  - emphasisNodeIds?: string[]
  - emphasisEdgeTypes?: edge type[]
  - showLegend?: boolean
```

## notes
- positions are optional; when present, the renderer should respect them and skip expensive layout work when possible.
- `meta` fields allow host apps to carry extra data without schema churn.
