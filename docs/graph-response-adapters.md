# graph response adapters

## intent
adapters convert arbitrary input into the `GraphResponseV0` schema. they let us keep the renderer stable while supporting many upstream sources.

## available adapters
- `markdownToGraphResponse` converts markdown or plain text into a graph using simple heuristics

available via `workspace:*` after cloning the repo.

## usage (typescript)
```ts
import { markdownToGraphResponse } from '@intellea/graph-adapters';

const graphFromText = markdownToGraphResponse(markdown, { maxNodes: 200, mode: 'map' });
```

## notes
- adapters are intentionally opinionated and minimal
- large inputs should pass `maxNodes` explicitly to avoid accidental overload
- use `pnpm benchmark:graph-response` to profile adapter performance
