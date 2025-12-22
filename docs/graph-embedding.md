# graph embedding

## web component

```ts
import { defineGraphResponseElement } from '@intellea/graph-renderer';
import type { GraphResponseV0 } from '@intellea/graph-schema';

defineGraphResponseElement();

const element = document.querySelector('intellea-graph');
if (!element) throw new Error('missing graph element');

(element as HTMLElement & { graphResponse: GraphResponseV0 }).graphResponse = payload;
```

## iframe

```ts
const iframe = document.querySelector('iframe');
if (!iframe?.contentWindow) throw new Error('missing iframe');

iframe.contentWindow.postMessage(
  { type: 'intellea:graph-response', payload },
  '*'
);
```

## examples
- `examples/web-component`
- `examples/iframe`
