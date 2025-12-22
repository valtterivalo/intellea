# react renderer

```tsx
import React from 'react';
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import payload from '../payloads/graph-response-v0.json';

const graphResponse = payload as GraphResponseV0;

export default function GraphPanel() {
  return <GraphResponseRenderer graphResponse={graphResponse} />;
}
```
