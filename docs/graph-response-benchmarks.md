# graph response benchmarks

## intent
track adapter performance against large graph targets.

## run
```bash
pnpm benchmark:graph-response
```

## output
- `intellea adapter`: time to map `IntelleaResponse` into `GraphResponseV0`
- `markdown adapter`: time to build a graph from 5k list items
- memory snapshot after each adapter run

## notes
- baseline target is 5k nodes
- update the script when layout or adapter logic changes

## graph perf helper benchmark

run:
```bash
pnpm benchmark:graph-perf
```

notes:
- measures core-node selection, label allow list, and stable expansion layout
- defaults to 5k nodes / 20k links
- optional args: `pnpm benchmark:graph-perf -- 8000 32000`
