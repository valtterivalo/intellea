# versioning

## schema
- schema versions live in `GraphResponseV0.version`
- v0 is additive only
- breaking changes require v1 + adapter

## renderer
- renderer follows semver
- minor: new props, non-breaking behavior
- major: breaking interaction or rendering changes

## adapters
- adapters are versioned by schema target
- prefer new adapters over mutating existing mappings
