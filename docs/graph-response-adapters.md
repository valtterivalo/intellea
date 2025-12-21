# graph response adapters

## intent
adapters convert arbitrary input into the `GraphResponseV0` schema. they let us keep the renderer stable while supporting many upstream sources.

## available adapters
- `intelleaToGraphResponse` maps current `IntelleaResponse` payloads into schema
- `markdownToGraphResponse` converts markdown or plain text into a graph using simple heuristics

## usage (typescript)
```ts
import type { GraphResponseV0 } from '@intellea/graph-schema';
import { intelleaToGraphResponse } from '@/lib/adapters/intelleaToGraphResponse';
import { markdownToGraphResponse } from '@/lib/adapters/markdownToGraphResponse';

const graph: GraphResponseV0 = intelleaToGraphResponse(intelleaOutput);
const graphFromText = markdownToGraphResponse(markdown, { maxNodes: 200, mode: 'map' });
```

## notes
- adapters are intentionally opinionated and minimal
- large inputs should pass `maxNodes` explicitly to avoid accidental overload
- use `pnpm benchmark:graph-response` to profile adapter performance
