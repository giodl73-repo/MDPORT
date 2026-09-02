# Mdport Role Index

Mdport defines the `mdport.v1` compact context-transfer schema and Rust crate.
Use these roles when changing schema fields, sectioning behavior, serialization,
or PROOF/MDCROP integration examples.

## Parliament

| File | Role | Primary tension |
|---|---|---|
| `parliament/schema-steward.md` | Schema Steward | Stable interchange contract vs. useful evolution |
| `parliament/compactness-reviewer.md` | Compactness Reviewer | Transfer size vs. sufficient provenance |
| `parliament/integration-reviewer.md` | Integration Reviewer | Standalone standard vs. PROOF/MDCROP assumptions |

## PITFALL gates

| Gate | Roles | Blocks |
|---|---|---|
| `MDP-PF-05` performance-claim boundary | Compactness Reviewer; Integration Reviewer; Schema Steward | Faster, smaller, higher-quality, broad-adoption, or hot-path replacement claims unless real-corpus evidence names corpus size, fixture/generation command, benchmark command, run count, environment, bytes, timing, quality, and downstream owner acceptance. |

## Review order

1. Use Schema Steward for field names, versioning, and compatibility.
2. Use Compactness Reviewer for payload shape, duplication, and token footprint.
3. Use Integration Reviewer for README examples and cross-tool behavior.
