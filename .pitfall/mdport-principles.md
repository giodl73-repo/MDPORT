# MDPORT Principles

## MDP-P-01: Transfer Schema, Not Publishing Target

**Status:** ACTIVE

**Statement:** MDPORT owns compact portable context records for Markdown
documents and corpus slices; it does not own human publication output,
retrieval, ranking, transport, caching, or query execution.

**Decision rule:** New fields or helpers must strengthen transfer,
provenance, sectioning, or admission without making MDPORT a renderer or
retrieval engine.

**Evidence:** `README.md`, `context/waves/2026-07-26-mdport-rename/WAVE.md`,
and `.roles/ROLE.md`.

## MDP-P-02: `mdport.v1` Is A Public Interchange Contract

**Status:** ACTIVE

**Statement:** Schema identifier, required fields, section ordering, section
identity, and field meanings are observable behavior for independent producers
and consumers.

**Decision rule:** Removing fields, changing required types or meanings, or
changing section identity semantics requires a successor schema and migration
evidence.

**Evidence:** `README.md`, `docs/conformance.md`, and
`.roles/parliament/schema-steward.md`.

## MDP-P-03: Compactness Must Preserve Provenance

**Status:** ACTIVE

**Statement:** Mdports are optimized for transfer and AI consumption, but size
reduction cannot discard source identity, section boundaries, stable IDs, line
numbers, metadata, or refs needed for traceability.

**Decision rule:** Compactness changes must compare byte/token impact against
the provenance and reconstruction value they remove or preserve.

**Evidence:** `README.md`, `docs/research/performance.md`, and
`.roles/parliament/compactness-reviewer.md`.

## MDP-P-04: Consumers Own Selection Policy

**Status:** ACTIVE

**Statement:** PROOF, MDCROP, SLICE, MAXIM, and third-party readers may produce,
admit, store, select, or query Mdports, but their ranking, validation, policy,
and selector semantics stay outside the MDPORT wire standard.

**Decision rule:** Integration examples may prove interoperability but must not
add consumer-specific policy fields to `mdport.v1`.

**Evidence:** `README.md`,
`context/waves/2026-07-26-mdport-rename/CLOSE.md`, and
`.roles/parliament/integration-reviewer.md`.

## MDP-P-05: Research Claims Stay Bounded

**Status:** ACTIVE

**Statement:** Performance and quality claims must name their fixture source,
confidence, and adoption boundary before they are used as publication or
downstream replacement evidence.

**Decision rule:** Medium-confidence benchmark claims remain research notes
until representative real-corpus fixtures and repeatable validation commands
support broader claims.

**Evidence:** `docs/research/performance.md`.
