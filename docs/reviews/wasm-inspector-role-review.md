# WASM inspector producer review

Applied by the implementing agent, in the repository's declared review order.
These are producer checks, not independent review or human approval.

## Schema Steward

The core `src/lib.rs` remains byte-identical to entry master. Required fields,
optional defaults, arbitrary kind/format strings, section ordering, typed schema
failures and locations remain owned by `MdportDocument::from_json_checked`.
The unpublished adapter adds an inspection response, not wire fields. Browser
resource/u32 limits are labelled separately. Unknown root/section fields are
reported and disable compact export. Original input is retained for recovery.
Native compact output is reparsed and compared to the decoded record before
export; browser fixtures cover both retained conformance records and extensions.

## Compactness Reviewer

Export uses existing `to_json()` without pretty-printing or trailing newline.
Displayed decoded JSON is explicitly a review view. The inspector response is
not a new transfer format. Source/metadata/path/ref values remain intact and
section navigation uses ordinal indices so duplicate IDs do not alias sections.
Input/export byte counts describe one record, not generalized compression.
The full release has a 5 MB gate. Startup observations name environment and
two-section fixture and make no CPU, corpus-scale or adoption claim.

## Integration Reviewer

The core has no new runtime dependencies or selector/tool coupling. Browser
adapter and native CLI call the same response function; real WASM is compared
to native canonical reports. Source identity and references are displayed as
inert text, never resolved; Markdown is not rendered into HTML. Checked admission
does not certify custody or content. Files are bounded UTF-8, drafts survive
errors/retry, and worker generation/revision fences reject late events. Public
source/WASM/build/legal routes remain accessible without a running engine.

Status: implementation reviewed; final test and release evidence is recorded in
the wave closeout. No broad performance, producer/consumer hot-path replacement,
or downstream acceptance claim is made.
