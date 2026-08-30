# Wave: SLICE Examples

## Goal

Show how consumers can apply SLICE selectors to Mdport-shaped document and
section rows without changing `mdport.v1`.

## Pulse table

| Pulse | Title | Status | Outcome |
|------:|-------|--------|---------|
| 01 | Metadata selector examples | done | Added dev-only SLICE tests for document and section metadata selectors. |

## Success criteria

- Mdport remains the schema owner.
- SLICE is only a dev/example dependency.
- Examples cover document metadata and section metadata.
- `cargo test` passes.

## Supersession

This wave is historical evidence, not current validation surface. The later
`2026-07-26-mdport-rename` wave removed the optional SLICE integration so
MDPORT could stay schema-focused and dependency-light. Current validation is the
`mdport.v1` conformance proof in `docs/conformance.md`; consumers may still
query decoded records with SLICE or another selector outside the wire standard.
