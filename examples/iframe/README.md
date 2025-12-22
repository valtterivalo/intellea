# iframe embed

```html
<iframe id="graph" src="https://your-host.example.com/embed/graph" style="width:100%;height:600px;border:0"></iframe>

<script type="module">
  import payload from '../payloads/graph-response-v0.json' assert { type: 'json' };

  const frame = document.querySelector('#graph');
  if (!frame?.contentWindow) throw new Error('missing iframe');

  frame.contentWindow.postMessage(
    { type: 'intellea:graph-response', payload },
    '*'
  );
</script>
```
