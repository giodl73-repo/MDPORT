# MDPORT Pitfalls

## MDP-PF-01: Schema Drift Enters As Convenience

**Status:** MITIGATED

**Pattern:** A producer or consumer adds, removes, renames, or reinterprets
`mdport.v1` fields without a successor schema or migration evidence.

**Domain:** `MdportDocument`, `MdportSection`, JSON fixtures, README examples,
and downstream producer/consumer contracts.

**Detection difficulty:** Small field changes can round-trip locally while
breaking independent readers that treat `mdport.v1` as a stable contract.

**Structural solution:** Keep schema steward review, retained conformance
fixtures, checked parsing, and explicit lifecycle rules for successor schemas.

**Evidence:** `docs/conformance.md`, `.roles/parliament/schema-steward.md`, and
`tests/conformance.rs`.

## MDP-PF-02: Compactness Removes Needed Provenance

**Status:** MITIGATED

**Pattern:** Transfer-size pressure drops source, line, section path, metadata,
or refs until Mdports are smaller but no longer traceable or reconstructable.

**Domain:** compact JSON, metadata projection, section records, refs, benchmark
fixtures, and future bundle/key-table experiments.

**Detection difficulty:** Byte counts improve immediately, while provenance loss
appears later when a consumer needs to audit or rebuild context.

**Structural solution:** Treat provenance fields as first-class and require
compactness review plus representative fixture measurements before changing
wire shape.

**Evidence:** `README.md`, `docs/research/performance.md`, and
`.roles/parliament/compactness-reviewer.md`.

## MDP-PF-03: Consumer Policy Leaks Into The Wire Standard

**Status:** MITIGATED

**Pattern:** PROOF validation state, MDCROP relevance scores, SLICE selector
semantics, MAXIM source policy, or third-party storage rules become core
`mdport.v1` fields.

**Domain:** integrations, examples, metadata, refs, future bundle formats, and
consumer adapters.

**Detection difficulty:** First-party integration fields can look broadly useful
until another consumer cannot interpret or should not inherit them.

**Structural solution:** Keep MDPORT schema-focused, remove runtime selector
dependencies, and make consumers query decoded records outside the wire
standard.

**Evidence:** `README.md`, `.roles/parliament/integration-reviewer.md`,
`context/waves/2026-07-26-mdport-rename/CLOSE.md`, and `Cargo.toml`.

## MDP-PF-04: Stale Historical Integration Evidence Becomes Current Guidance

**Status:** MITIGATED

**Pattern:** The old SLICE example wave is read as a current dependency,
validation command, or docs surface after the MDPORT rename removed optional
SLICE integration.

**Domain:** `context/waves/2026-05-16-slice-examples/`, `Cargo.toml`,
README integration guidance, and adoption scoring.

**Detection difficulty:** Historical wave files remain accurate for what
happened at the time, but their command lists can mislead agents after later
architecture decisions.

**Structural solution:** Mark superseded wave evidence explicitly and point
current validation to `docs/conformance.md` plus the dependency-light rename
closeout.

**Evidence:** PITFALL adoption added supersession notes to the SLICE example
wave and pulse after comparing them with `Cargo.toml` and the MDPORT rename
closeout.

## MDP-PF-05: Performance Claims Outrun Real-Corpus Evidence

**Status:** MITIGATED

**Pattern:** MDPORT is promoted as faster, smaller, or higher-quality for broad
portfolio adoption based only on synthetic MDCROP fixtures or medium-confidence
research notes.

**Domain:** `docs/research/performance.md`, MDCROP benchmark fixtures, MAXIM
backfill plans, bundle experiments, and public adoption claims.

**Detection difficulty:** Synthetic fixtures show useful runtime and quality
improvements while current JSON bytes are larger than Markdown and real
MAXIM-scale corpora have not been measured.

**Structural solution:** Add repeatable real-corpus admission fixtures and
benchmark-command gates before making broad performance claims or replacing
downstream hot paths. MDPORT now has a retained MAXIM-shaped corpus fixture and
conformance test for schema admission, plus a claim boundary that requires named
corpus size, fixture/generation command, benchmark command, run count,
environment, bytes, timing, quality, and downstream owner acceptance before
faster/smaller/higher-quality/replacement-ready claims.

**Evidence:** `docs/research/performance.md`, especially `MDPORT-03` and
`Next validation`, `docs/research/performance-claim-boundary.md`,
`tests/fixtures/maxim-real-corpus-slice.md`, and `tests/conformance.rs`.
