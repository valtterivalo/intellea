---
name: intellea-graph-response
description: Generate GraphResponseV0 payloads and render them with the intellea graph renderer
---

# intellea graph response skill

## intent
produce GraphResponseV0 payloads or adapt text into the schema so the graph renderer can render consistent visualizations.

## inputs
- markdown or plain text
- optional mode hint: map, decision, plan, argument
- optional max node budget

## outputs
- a valid GraphResponseV0 payload (json)

## tooling
- mcp: run `pnpm mcp:graph-response` and call `graph_response_from_markdown`

## notes
- keep node and edge ids stable across updates
- use `view` hints to emphasize nodes or edges when needed
- prefer short labels with clear nouns or verbs
