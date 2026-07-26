---
wave: mdport-rename
date_open: 2026-07-26
status: done
source_request: "Rename PEBBLE and pebble.v1 to MDPORT and mdport.v1."
---

# Wave: MDPORT rename

## Mission

Establish MDPORT as the portable Markdown document/context record in the MD
family and prepare the crate for independent crates.io publication.

## Decisions

- Product, repository, and crate name: MDPORT / `mdport`.
- Wire schema: `mdport.v1`.
- Rust types: `MdportDocument` and `MdportSection`.
- MDPORT stays schema-focused and has no direct SLICE dependency.

## Evidence

- Legacy-name audit across tracked files.
- `cargo fmt --check`
- `cargo test`
- `cargo clippy -- -D warnings`
- `cargo package --allow-dirty --no-verify`
- `git diff --check`

## Non-goals

- Do not add retrieval, ranking, transport, caching, or query execution.
- Do not make MDPORT responsible for human publication output.
