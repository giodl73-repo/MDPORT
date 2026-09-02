# Mdport performance research

## Research question

How should `mdport.v1` improve transfer size, MDCROP runtime, and context quality
before broader adoption by repos beyond PROOF and MDCROP?

Decision supported: keep `mdport.v1` stable as compact JSON for first adoption,
then prototype bundle and section-link improvements behind explicit compatibility
boundaries.

## Local evidence

**MDPORT-01 — Canonical form is compact JSON.**

- Source: `README.md`, "Mdport v1 standards".
- Behavior: canonical wire/artifact/cache form is UTF-8 compact JSON without BOM;
  pretty JSON is only for examples, review, and debugging.
- Implication: all size benchmarks and generated fixtures should use compact JSON.
- Confidence: high.

**MDPORT-02 — Current document shape repeats metadata per file.**

- Source: `src/lib.rs`, `MdportDocument` and `MdportSection`.
- Behavior: every file repeats `schema`, `kind`, `format`, source metadata, and
  section object keys.
- Implication: single-document Mdports are simple and portable, but many-file
  corpora pay repeated key overhead. A future bundle form can hoist common values
  and keep `document` unchanged.
- Confidence: high.

**MDPORT-03 — MDCROP runs faster over Mdport because the graph is smaller.**

- Source command:
  `.\examples\bench-fixtures\generate.ps1 -Size all -Force; .\examples\bench-fixtures\run.ps1 -Size all -Runs 3`
  in `C:\src\mdcrop`.
- Result snapshot after applying AI-oriented context/provenance sections in the
  MDCROP benchmark fixtures:

| Size | Mode | Bytes | Units | Edges | Selected tokens | Quality | Avg total |
|---|---:|---:|---:|---:|---:|---:|---:|
| small | md | 5,752 | 72 | 252 | 792 | 0.540741 | 12.333ms |
| small | mdport | 7,928 | 16 | 42 | 632 | 0.933333 | 2.667ms |
| medium | md | 45,056 | 576 | 2,132 | 1,679 | 0.526125 | 74.000ms |
| medium | mdport | 62,656 | 128 | 368 | 1,339 | 0.913321 | 16.333ms |
| large | md | 179,552 | 2,304 | 8,528 | 1,679 | 0.526125 | 146.000ms |
| large | mdport | 249,952 | 512 | 1,472 | 1,339 | 0.913321 | 61.667ms |

- Implication: Mdport improves runtime and benchmark quality by giving MDCROP fewer,
  cleaner section units, even while current JSON bytes are larger than Markdown.
- Confidence: medium. The generated fixture is useful for regression, but real
  MAXIM-scale corpora should be measured before broad claims.

**MDPORT-04 — Quality gains come from section boundaries, not compression.**

- Source: `src/lib.rs`, `markdown_sections()` and MDCROP benchmark fixture output.
- Behavior: Mdport sections preserve heading paths and stable IDs; MDCROP does not
  need to rediscover paragraphs/frontmatter from raw Markdown.
- Implication: quality improvements should focus on section granularity, per
  section provenance, and graph edges before changing serialization format.
- Confidence: high.

## External format notes

**MDPORT-05 — JSON Lines is attractive for multi-document streaming, not for a
single canonical document.**

- Source: <https://jsonlines.org/>.
- Behavior: JSON Lines requires UTF-8, one valid JSON value per line, and `\n`
  terminators; it is convenient for processing records one at a time.
- Implication: a future `mdport.bundle.v1` could use JSONL for many documents or
  sections, while `mdport.v1` remains one compact JSON document.
- Confidence: medium; JSON Lines is practical but not an IETF-standardized media
  type according to the source.

**MDPORT-06 — CBOR and MessagePack can reduce wire size, but would raise adoption
cost.**

- Sources: RFC 8949 CBOR abstract; <https://msgpack.org/>.
- Behavior: CBOR targets small code size, small messages, and extensibility;
  MessagePack advertises JSON-like cross-language exchange that is faster and
  smaller.
- Implication: binary encodings are good candidates for a later transport profile,
  not the first public standard. Compact JSON keeps the schema inspectable and
  easy to adopt.
- Confidence: medium.

**MDPORT-07 — Compression belongs at transport/package boundaries.**

- Sources: <https://facebook.github.io/zstd/> and <https://jsonlines.org/>.
- Behavior: Zstandard is a fast compression algorithm with high compression
  ratios; JSON Lines recommends stream compressors such as gzip or bzip2 for
  saved space.
- Implication: support `.mdport.json.zst` or similar as a packaging convention,
  but keep canonical `mdport.v1` bytes uncompressed compact JSON for hashing,
  tests, and simple readers.
- Confidence: medium.

## Recommendations

### Claim boundary

Synthetic MDCROP fixtures and retained conformance fixtures are regression
evidence, not broad adoption evidence. Before MDPORT claims faster, smaller,
higher-quality, or replacement-ready behavior for portfolio hot paths, cite the
claim gate in [`performance-claim-boundary.md`](performance-claim-boundary.md):
corpus identity and size, fixture or generation command, benchmark command, run
count, environment boundary, Markdown and Mdport bytes, timing, selected-context
quality, and downstream owner acceptance.

### Adopt now

1. Keep canonical `mdport.v1` as compact UTF-8 JSON without BOM.
2. Measure compact Mdports only; do not use pretty JSON for fixture or transfer
   benchmarks.
3. Keep section IDs, heading paths, source lines, and refs mandatory/first-class
   because they explain the current quality improvement.

### Prototype behind a compatibility boundary

1. Add a bundle experiment, likely `mdport.bundle.v1`, that hoists `schema`,
   `kind`, `format`, and repeated key names across many documents.
2. Add section-level refs or links so MDCROP can connect the exact section that
   references another source instead of treating all document refs as equally
   attached to every section.
3. Add a fixture profile that varies chunk granularity: heading-level, paragraph
   level, and hybrid. This should optimize quality without changing the wire
   format first.
4. Compare compact JSON, JSONL bundle, CBOR, MessagePack, gzip, and zstd on
   generated and real corpora, reporting bytes, parse time, MDCROP ingest time, and
   selected-context quality.

### Defer or reject for now

1. Do not replace `mdport.v1` with binary-only encoding before PROOF/MDCROP/MAXIM
   adoption. It would make debugging and third-party adoption harder.
2. Do not alias field names in `mdport.v1`; short keys reduce bytes but weaken
   the public contract. Test bundle/key-table approaches first.
3. Do not bake MDCROP relevance scores into Mdport. Scores are task-specific and
   belong in MDCROP outputs, not the portable source/context schema.

## Next validation

1. Generate compact fixtures in MDCROP and record output:
   `.\examples\bench-fixtures\run.ps1 -Size all -Runs 10`.
2. Maintain the synthetic MDCROP fixture quality target: Mdport should beat
   Markdown by at least `+0.10` quality at medium and large sizes and run in no
   more than 70% of the Markdown total time.
3. Keep the retained MAXIM-shaped admission fixture green:
   `cargo test --test conformance retained_real_corpus_slice_has_admission_evidence_without_performance_claim`.
4. Add full real MAXIM corpus benchmark output once the MAXIM backfill path emits
   Mdports.
5. Prototype bundle output in the Mdport crate without changing
   `MdportDocument::to_json()`.
