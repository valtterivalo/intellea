# intellea graph platform

intellea is a schema-first graph rendering platform for llm outputs. it turns GraphResponseV0 payloads into interactive 3d graphs that can be embedded anywhere.

## what it includes

- `@intellea/graph-schema` public schema + helpers
- `@intellea/graph-renderer` react renderer + web component
- `@intellea/graph-adapters` lightweight adapters (markdown → GraphResponseV0)
- iframe embed shell (`/embed/graph`)
- mcp tool for graph payload generation

## integration surfaces

- react renderer: `<GraphResponseRenderer graphResponse={payload} />`
- web component: `<intellea-graph>` + `element.graphResponse = payload`
- iframe: postMessage `{ type: 'intellea:graph-response', payload }`
- mcp: `graph_response_from_markdown`

## docs

- `docs/graph-response-schema.md`
- `docs/graph-response-adapters.md`
- `docs/graph-response-benchmarks.md`
- `docs/graph-embedding.md`
- `docs/graph-modes.md`
- `docs/mcp.md`
- `docs/versioning.md`
- `docs/release-checklist.md`
- `docs/compatibility.md`

## examples

- `examples/react` react renderer usage
- `examples/next-app-router` next.js app router usage
- `examples/web-component` vanilla web component usage
- `examples/iframe` iframe embed usage
- `examples/mcp` mcp client usage

## development

```bash
pnpm install
pnpm dev
```

- docs: `http://localhost:3000/docs`
- embed shell: `http://localhost:3000/embed/graph`

## scripts

```bash
pnpm lint
pnpm test
pnpm build
pnpm benchmark:graph-response
pnpm benchmark:graph-perf
pnpm mcp:graph-response
```

## debug

set `NEXT_PUBLIC_DEBUG=true` to show the graph perf overlay in the embed shell.
