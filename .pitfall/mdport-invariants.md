# MDPORT Invariants

## MDP-I-01: Canonical Wire Form Is Compact JSON

**Status:** VERIFIED

**Invariant:** `MdportDocument::to_json()` emits compact UTF-8 JSON suitable for
canonical transfer and cache/artifact comparisons; pretty JSON is only for
review and examples.

**Why it matters:** Size measurements and generated artifacts must compare the
same canonical representation.

**Test:** `cargo test --test conformance`.

**Evidence:** `README.md`, `docs/conformance.md`, and
`tests/conformance.rs`.

## MDP-I-02: Unsupported Schemas Fail Before Admission

**Status:** VERIFIED

**Invariant:** `MdportDocument::from_json_checked()` rejects records whose
schema is not `mdport.v1` with an `UnsupportedSchema` error carrying expected
and observed identifiers.

**Why it matters:** Consumers must not silently admit future or foreign schemas
as if they were compatible `mdport.v1` records.

**Test:** `cargo test --test conformance`.

**Evidence:** `docs/conformance.md`, `tests/conformance.rs`, and
`tests/fixtures/unsupported-schema.json`.

## MDP-I-03: Invalid Records Return Typed Locations

**Status:** VERIFIED

**Invariant:** Invalid JSON or missing required fields return
`MdportReadError::InvalidRecord` with the serde message and source location
rather than partial documents.

**Why it matters:** Admission failures need actionable diagnostics for agents
and downstream tools.

**Test:** `cargo test --test conformance`.

**Evidence:** `docs/conformance.md`, `tests/conformance.rs`, and
`tests/fixtures/invalid-record.json`.

## MDP-I-04: Section Identity And Heading Paths Are Stable

**Status:** VERIFIED

**Invariant:** Markdown conversion preserves ordered sections with stable IDs,
heading paths, heading levels, source lines, metadata, and resolved text.

**Why it matters:** MDCROP, PROOF, and other consumers depend on stable section
boundaries for selection, provenance, and context reconstruction.

**Test:** `cargo test`.

**Evidence:** `README.md`, `src/lib.rs`, and `tests/conformance.rs`.

## MDP-I-05: MDPORT Has No Runtime Selector Dependency

**Status:** VERIFIED

**Invariant:** The crate remains dependency-light and does not depend on SLICE,
MDCROP, PROOF, or selector policy at runtime.

**Why it matters:** MDPORT can be adopted as an independent standard only if
first-party integrations do not become hidden wire-format requirements.

**Test:** `cargo test` and `cargo clippy --all-targets -- -D warnings`.

**Evidence:** `Cargo.toml`, `context/waves/2026-07-26-mdport-rename/WAVE.md`,
and `context/waves/2026-07-26-mdport-rename/CLOSE.md`.
