# web component

```html
<div style="height: 600px">
  <intellea-graph></intellea-graph>
</div>

<script type="module">
  import { defineGraphResponseElement } from '@intellea/graph-renderer';
  import payload from '../payloads/graph-response-v0.json' assert { type: 'json' };

  defineGraphResponseElement();

  const el = document.querySelector('intellea-graph');
  if (!el) throw new Error('missing graph element');

  el.graphResponse = payload;
</script>
```
