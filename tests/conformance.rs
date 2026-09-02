use mdport::{MdportDocument, MdportReadError, SCHEMA};

const ACCEPTED_DOCUMENT: &str = include_str!("fixtures/accepted-document.json");
const UNSUPPORTED_SCHEMA: &str = include_str!("fixtures/unsupported-schema.json");
const INVALID_RECORD: &str = include_str!("fixtures/invalid-record.json");
const MAXIM_REAL_CORPUS_SLICE: &str = include_str!("fixtures/maxim-real-corpus-slice.md");

#[test]
fn retained_document_round_trips_through_canonical_json() {
    let accepted = MdportDocument::from_json_checked(ACCEPTED_DOCUMENT)
        .expect("accepted fixture should satisfy mdport.v1");
    let canonical = accepted
        .to_json()
        .expect("accepted fixture should serialize");
    let reparsed = MdportDocument::from_json_checked(&canonical)
        .expect("canonical JSON should satisfy mdport.v1");

    assert_eq!(reparsed, accepted);
    assert_eq!(reparsed.schema, SCHEMA);
    assert_eq!(reparsed.sections[0].id, "conformance-guide");
    assert_eq!(
        reparsed.metadata.get("source_custody").map(String::as_str),
        Some("reviewed")
    );
    assert!(canonical.len() < ACCEPTED_DOCUMENT.len());
}

#[test]
fn unsupported_schema_has_typed_failure() {
    let error = MdportDocument::from_json_checked(UNSUPPORTED_SCHEMA)
        .expect_err("mdport.v2 must not enter an mdport.v1 consumer");

    assert_eq!(
        error,
        MdportReadError::UnsupportedSchema {
            expected: SCHEMA,
            found: "mdport.v2".to_string(),
        }
    );
}

#[test]
fn invalid_record_has_location_and_message() {
    let error = MdportDocument::from_json_checked(INVALID_RECORD)
        .expect_err("a document without source must be rejected");

    match error {
        MdportReadError::InvalidRecord {
            message,
            line,
            column,
        } => {
            assert!(message.contains("missing field `source`"));
            assert!(line > 0);
            assert!(column > 0);
        }
        other => panic!("expected invalid-record failure, got {other:?}"),
    }
}

#[test]
fn retained_real_corpus_slice_has_admission_evidence_without_performance_claim() {
    let mdport = MdportDocument::from_markdown(
        MAXIM_REAL_CORPUS_SLICE,
        "MAXIM real-corpus slice",
        "tests/fixtures/maxim-real-corpus-slice.md",
        ["docs/research/performance-claim-boundary.md"],
    );

    assert_eq!(mdport.schema, SCHEMA);
    assert_eq!(mdport.source, "tests/fixtures/maxim-real-corpus-slice.md");
    assert_eq!(
        mdport.refs,
        vec!["docs/research/performance-claim-boundary.md"]
    );
    assert!(mdport.sections.iter().any(|section| {
        section.path == vec!["Distributed Systems Context Slice", "Consistency Boundary"]
            && section.text.contains("Linearizability")
    }));
    assert!(mdport.sections.iter().any(|section| {
        section.path == vec!["Distributed Systems Context Slice", "Operational Caveats"]
            && section
                .text
                .contains("Public performance claims need corpus name")
    }));

    let canonical = mdport
        .to_json()
        .expect("real-corpus slice should serialize");
    let reparsed = MdportDocument::from_json_checked(&canonical)
        .expect("real-corpus slice should read through checked admission");

    assert_eq!(reparsed, mdport);
    assert!(canonical.len() > MAXIM_REAL_CORPUS_SLICE.len());
}
