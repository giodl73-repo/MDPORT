# Distributed Systems Context Slice

MAXIM-style guides usually combine overview prose, heading paths, comparison
tables, and operational caveats. This retained fixture represents that shape so
MDPORT can test a real-corpus admission path without depending on a sibling
checkout at test time.

## Consistency Boundary

| Term | Reader risk | MDPORT requirement |
|---|---|---|
| Linearizability | Treating all replicas as instant | Preserve the exact section path |
| Eventual consistency | Assuming no ordering guarantees | Preserve source lines and caveats |
| Consensus | Confusing protocol family with product readiness | Preserve refs outside prose |

## Operational Caveats

- A compact transfer record can reduce downstream parsing work without proving
  broad runtime superiority.
- A benchmark fixture can catch schema regressions without replacing real
  MAXIM-scale measurements.
- Public performance claims need corpus name, corpus size, command, run count,
  hardware or environment boundary, bytes, timing, and quality metrics.
