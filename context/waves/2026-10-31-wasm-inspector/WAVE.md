# Bounded mdport.v1 record inspector

Entry: public `master` 9c53bf5c64fbaf2fcf13fc53904cc1bd53c8432d.
Reader task: open/paste a local record, inspect ordered sections, source identity,
metadata and references, understand checked-parser failures, and download a
compact record that roundtrips through the same native parser.

The core schema/parser stays unchanged. A separate unpublished portable adapter
owns browser limits and response envelopes. References and Markdown are inert
text, never fetched/rendered as HTML. Unknown extension fields are reported;
compact export is disabled when normalization would drop them. Original UTF-8
input remains downloadable. Optional metadata defaults remain native behavior.
Acceptance is structural/schema admission, not content/provenance certification.

Limits: 1 MiB input, JSON depth 32, 50,000 nodes, 256 sections/references,
64 heading path components, 256 metadata entries per document/section. Source
line/level integers must fit u32 so native and WASM use the same admission range.
Limits belong to this inspector, not mdport.v1. Post-parse counts are not heap
quotas. Worker startup/compute deadlines preserve drafts and fence stale events.

Validation: native conformance and adapter tests, strict host/WASM Clippy, real
WASM/native canonical fixtures, input/file/export/errors/recovery/stale events,
keyboard/mobile/no-JS/source/legal routes, bounded release size. Producer review
uses Schema Steward, Compactness Reviewer and Integration Reviewer in that order.
No broad performance, quality, consumer adoption or provenance trust claim.

Child implementation and Pages release precede the TRACKER pointer snapshot.
Status: implemented and locally qualified; hosted and live release checks follow
publication. See `local-qualification.json` for the precommit observation and
`docs/reviews/wasm-inspector-role-review.md` for producer-applied role checks.

Local evidence: 14 native tests (6 core, 3 conformance, 5 adapter), strict host
and WASM Clippy, and 29 browser cases with no retries/skips/flaky cases. Fifteen
canonical fixtures compare native output with real WASM in its worker. Desktop
and narrow screenshots were inspected; keyboard navigation and page overflow
checks pass. An initial 26/28 run exposed Windows fixture newline translation;
the native reference writer now preserves exact bytes. The parity assertions
were retained. A subsequent file-custody case covers exact CRLF/Unicode original
download until editing. Opened-file original text survives engine retries;
editor changes or Restore example replace that original snapshot.

Preview measurements are labelled dirty and are not the published artifact's
byte pins. Clean source ZIP/provenance and final deployed bytes are verified
separately after the child commit. Deployment does not imply provenance trust,
content certification, performance improvement or downstream replacement.
