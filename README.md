# MDPORT

MDPORT is a compact context transfer format for Markdown documents, corpora, and AI
agents. The current schema is `mdport.v1`.

**Series:** [Standards & Protocols](https://github.com/giodl73-repo/giodl73-repo/blob/main/series/standards-protocols.md).

**Review roles:** This repo uses
[ROLES](https://github.com/giodl73-repo/ROLES), the `.roles` convention for
repository-local review panels.

## MD family

MDPORT is the transfer layer in the MD family:

```text
Markdown → MDPATH → MDCROP → PROOF → MDPORT
             address    select     build      transfer
```

| Repo | Responsibility |
|------|----------------|
| [MDPATH](https://github.com/giodl73-repo/MDPATH) | Stable `md://` addresses for Markdown elements. |
| [MDCROP](https://github.com/giodl73-repo/MDCROP) | Corpus indexing, graph selection, and bounded context. |
| [PROOF](https://github.com/giodl73-repo/PROOF) | Validation, compilation, rendering, and publication. |
| **MDPORT** | Compact portable `mdport.v1` records. |

MDPORT records are not a human publishing target. They are small, provenance-bearing
records that preserve source identity, section boundaries, stable IDs, line
numbers, resolved text, and dependency references.

PROOF emits Mdports from compiled `.source.md` files. MDCROP can emit the same
schema for corpus views and slices, so both tools can exchange context without
inventing separate pack formats.

## mdport.v1 standard

- **Schema name:** `mdport.v1`.
- **Encoding:** UTF-8 JSON without a byte-order mark.
- **Canonical wire form:** compact JSON. Pretty JSON is allowed for examples,
  review, and debugging, but should not be used for cache keys, transfer-size
  measurements, or durable generated artifacts.
- **Kinds:** `document` for one source document; tools may use other kind strings
  such as `corpus-slice` when the sections come from a selected corpus view.
- **Format:** `markdown` means section text is Markdown content.
- **Metadata:** optional document and section key/value metadata. Markdown
  frontmatter is projected into document metadata and copied onto generated
  sections so downstream selectors can filter by fields such as `tags`,
  `status`, or `source_custody`.
- **Sections:** ordered document/corpus chunks with stable `id`, heading `path`,
  heading `level`, source `line`, optional `metadata`, and resolved `text`.
- **Refs:** optional dependency/source references used for provenance and graph
  construction.

```json
{
  "schema": "mdport.v1",
  "kind": "document",
  "title": "Guide",
  "source": "guide.source.md",
  "format": "markdown",
  "metadata": {"tags": "[proof, guide]", "status": "ready"},
  "sections": [
    {
      "id": "guide",
      "path": ["Guide"],
      "level": 1,
      "line": 1,
      "metadata": {"tags": "[proof, guide]", "status": "ready"},
      "text": "# Guide\n\nResolved Markdown text."
    }
  ],
  "refs": [".proof/side-info/links.json"]
}
```

## Rust

```rust
let mdport = mdport::MdportDocument::from_markdown(
    "# Guide\n\nBody",
    "fallback title",
    "guide.source.md",
    [".proof/side-info/links.json"],
);
let json = mdport.to_json()?;
```

## Schema validation proof

`MdportDocument::from_json` accepts `mdport.v1` records and rejects other schema
versions before they enter downstream tools. New consumers should use
`MdportDocument::from_json_checked` when they need typed unsupported-schema and
invalid-record failures without changing the legacy parser contract.

```powershell
cargo test --test conformance
```

The retained proof round-trips an accepted `mdport.v1` document through compact
JSON, rejects `mdport.v2` with expected and observed schema identifiers, and
rejects a record missing `source` with a location-bearing typed failure. See
[conformance and lifecycle](docs/conformance.md) for fixtures, compatibility,
migration, deprecation, and rollback rules.

## Research

- [Performance research](docs/research/performance.md) tracks size, speed, and
  quality options before broader adoption.

## License

[MIT](LICENSE) — © 2026 Gio Della-Libera.
