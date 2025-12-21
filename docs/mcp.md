# mcp graph response tool

## intent
expose GraphResponseV0 output as a lightweight mcp tool so other apps can request graph payloads.

## run
```bash
pnpm mcp:graph-response
```

## tool
`graph_response_from_markdown`

input:
- `markdown`: string (required)
- `mode`: map | decision | plan | argument
- `maxNodes`: number (10..2000)

output:
- json string containing GraphResponseV0
