# intellea graph platform

schema-first 3d graph rendering for llm outputs. turns structured payloads into interactive graphs.

live site: [intellea.app](https://www.intellea.app)

## quick start

```bash
git clone https://github.com/valtterivalo/intellea.git
cd intellea
pnpm install
pnpm dev
```

docs at `localhost:3000/docs`, embed shell at `localhost:3000/embed/graph`.

## packages

| package | what it does |
|---|---|
| `@intellea/graph-schema` | GraphResponseV0 types + helpers |
| `@intellea/graph-renderer` | react renderer + web component |
| `@intellea/graph-adapters` | markdown → GraphResponseV0 |

all packages resolve via pnpm `workspace:*` — no npm install needed.

## integration surfaces

```tsx
// react
<GraphResponseRenderer graphResponse={payload} />

// web component
<intellea-graph></intellea-graph>
element.graphResponse = payload;

// iframe
iframe.contentWindow.postMessage({ type: 'intellea:graph-response', payload }, '*');

// mcp
pnpm mcp:graph-response
```

## scripts

```bash
pnpm dev                        # dev server
pnpm build                      # production build
pnpm lint                       # eslint
pnpm test                       # vitest
pnpm benchmark:graph-response   # adapter benchmarks
pnpm benchmark:graph-perf       # renderer benchmarks
pnpm mcp:graph-response         # mcp server
```

## license

MIT
