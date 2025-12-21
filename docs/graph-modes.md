# graph modes

## intent
modes are lightweight presets that shift emphasis without changing the underlying graph. they only affect labels, highlights, and the default focus.

## map
- best for broad overviews and discovery
- emphasizes `relates_to` edges
- medium label density

## decision
- designed for trade-offs and risk evaluation
- emphasizes `supports`, `risks`, `mitigates`
- higher label density to surface options and risks

## plan
- designed for step sequencing and dependencies
- emphasizes `depends_on`, `causes`
- medium label density

## argument
- designed for claims and evidence chains
- emphasizes `supports`, `contradicts`
- higher label density

## notes
- modes are defaults; view hints can override label density and emphasis rules.
- use `graphResponse.view` to pin a focus node or supply emphasis ids.
