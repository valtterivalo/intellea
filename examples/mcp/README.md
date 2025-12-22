# mcp tool

run the mcp server:

```bash
pnpm mcp:graph-response
```

call the tool from an mcp client with payload:

```json
{
  "tool": "graph_response_from_markdown",
  "input": {
    "markdown": "# launch plan\n- research\n- build\n- ship",
    "mode": "plan",
    "maxNodes": 200
  }
}
```

the response is a JSON string containing GraphResponseV0.
