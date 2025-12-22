# next.js app router

`app/page.tsx`

```tsx
import { GraphResponseRenderer } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import payload from '../payloads/graph-response-v0.json';

const graphResponse = payload as GraphResponseV0;

export default function Page() {
  return (
    <main style={{ height: '100vh', padding: 24 }}>
      <GraphResponseRenderer graphResponse={graphResponse} />
    </main>
  );
}
```
