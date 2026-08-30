# MDPORT PITFALL index

MDPORT uses PITFALL as a compact index over the `mdport.v1` transfer standard:
schema identity, compact canonical JSON, provenance-bearing sections, typed
admission failures, dependency-light integration, and bounded performance
claims. The index cites README, conformance docs, performance research, roles,
wave records, tests, and fixtures without moving those sources of truth.

| Namespace | Kind | Path | Owner |
|---|---|---|---|
| `mdport` | `principles` | [mdport-principles.md](mdport-principles.md) | MDPORT maintainers |
| `mdport` | `invariants` | [mdport-invariants.md](mdport-invariants.md) | MDPORT maintainers |
| `mdport` | `pitfalls` | [mdport-pitfalls.md](mdport-pitfalls.md) | MDPORT maintainers |

## Integration

- ROLES: `.roles/ROLE.md` routes schema, compactness, and integration review to
  matching parliament reviewers.
- VTRACE: MDPORT does not yet carry repo-local `docs/vtrace/` rows; PITFALL
  cites conformance docs, role docs, wave records, fixtures, tests, and
  performance research until trace rows are added.
- Tests: unit tests, `tests/conformance.rs`, retained JSON fixtures, formatting,
  strict clippy, and PITFALL validators are the executable evidence hooks.
