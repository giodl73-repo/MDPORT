use mdport::{MdportDocument, MdportReadError, SCHEMA};

const ACCEPTED_DOCUMENT: &str = include_str!("fixtures/accepted-document.json");
const UNSUPPORTED_SCHEMA: &str = include_str!("fixtures/unsupported-schema.json");
const INVALID_RECORD: &str = include_str!("fixtures/invalid-record.json");

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
