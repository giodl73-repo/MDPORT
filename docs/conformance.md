# MDPORT conformance and lifecycle

`mdport.v1` is the supported transfer contract. Producers own conversion from
their source model; consumers own admission, storage, and product policy.
MDPORT owns record decoding, schema identity, canonical compact serialization,
and the typed read failures exposed by `MdportDocument::from_json_checked`.

## Retained proof

Run:

```powershell
cargo test --test conformance
```

The integration proof retains three representative records:

| Fixture | Expected result |
|---|---|
| `accepted-document.json` | Decode, compact-serialize, and decode without semantic loss |
| `unsupported-schema.json` | `MdportReadError::UnsupportedSchema` with expected and observed identifiers |
| `invalid-record.json` | `MdportReadError::InvalidRecord` with a source location and missing-field diagnostic |

The accepted fixture covers provenance metadata, one stable section identity,
resolved Markdown text, and an `md://` reference. It does not certify the
content or transfer custody. The proof also verifies that canonical compact JSON
is smaller than the retained review-formatted fixture.

## Review findings

- **Schema Steward:** accepted. The legacy parser remains available, the checked
  parser rejects unknown schemas before admission, and required-field failures
  retain their source location.
- **Integration Reviewer:** accepted. The fixtures describe MDPORT-owned records
  without PROOF- or MDCROP-private fields; producer and consumer policy stays
  outside the transfer schema.
- **Compactness Reviewer:** accepted. The slice adds no wire fields and measures
  compact serialization against the representative accepted record.

## Compatibility

Within `mdport.v1`, existing field names and meanings remain stable. Optional
metadata and references may be added without changing the schema identifier.
Removing a field, changing a required field's type or meaning, or changing
section ordering and identity semantics requires a new schema identifier.

Unknown schema identifiers fail before consumer admission. Invalid JSON and
records missing required fields return typed failures rather than partial
documents or success-shaped defaults.

## Migration, deprecation, and rollback

A successor schema must document its field mapping, information loss, and
consumer validation command. `mdport.v1` may be deprecated only after each
recorded adopter has a tested migration or an explicit removal decision.

Consumers may remain on the last passing `mdport.v1` producer while migrating.
Rollback restores that producer and its accepted fixtures; it must not rewrite
an unknown schema label to `mdport.v1`, invent missing fields, or discard
provenance to force admission.
