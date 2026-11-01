//! Inspector policy, not a new mdport schema or parser.
use mdport::{MdportDocument, MdportReadError};
use serde_json::{json, Value};

pub const MAX_BYTES: usize = 1024 * 1024;

fn failure(kind: &str, message: &str) -> Value {
    json!({"ok":false,"diagnostic":{"kind":kind,"message":message}})
}

fn bounded_tree(value: &Value, nodes: &mut usize) -> bool {
    *nodes += 1;
    if *nodes > 50_000 {
        return false;
    }
    match value {
        Value::Array(items) => items.iter().all(|v| bounded_tree(v, nodes)),
        Value::Object(items) => items.values().all(|v| bounded_tree(v, nodes)),
        _ => true,
    }
}

fn response(input: &str) -> Value {
    if input.len() > MAX_BYTES {
        return failure("limit", "Record exceeds the inspector's 1 MiB UTF-8 limit.");
    }
    // Count containers outside strings before recursive JSON decoding.
    let (mut depth, mut quoted, mut escaped) = (0usize, false, false);
    for byte in input.bytes() {
        if quoted {
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                quoted = false;
            }
        } else {
            match byte {
                b'"' => quoted = true,
                b'[' | b'{' => {
                    depth += 1;
                    if depth > 32 {
                        return failure("limit", "JSON nesting exceeds 32 containers.");
                    }
                }
                b']' | b'}' => depth = depth.saturating_sub(1),
                _ => (),
            }
        }
    }
    // This preflight is only resource/portability policy. The core below owns
    // JSON field types, required fields, duplicate known fields and schema errors.
    let raw: Value = match serde_json::from_str(input) {
        Ok(value) => value,
        Err(error) => {
            return json!({"ok":false,"diagnostic":{"kind":"invalid-record","message":error.to_string(),"line":error.line(),"column":error.column()}})
        }
    };
    if !bounded_tree(&raw, &mut 0) {
        return failure("limit", "JSON exceeds 50,000 nodes.");
    }
    if let Some(sections) = raw.get("sections").and_then(Value::as_array) {
        if sections.len() > 256 {
            return failure("limit", "Inspector accepts at most 256 sections.");
        }
        for section in sections {
            for key in ["line", "level"] {
                if section
                    .get(key)
                    .and_then(Value::as_u64)
                    .is_some_and(|n| n > u32::MAX.into())
                {
                    return failure(
                        "limit",
                        "Section line/level exceeds the inspector's portable u32 range.",
                    );
                }
            }
            if section
                .get("path")
                .and_then(Value::as_array)
                .is_some_and(|v| v.len() > 64)
            {
                return failure(
                    "limit",
                    "Inspector accepts at most 64 path components per section.",
                );
            }
            if section
                .get("metadata")
                .and_then(Value::as_object)
                .is_some_and(|v| v.len() > 256)
            {
                return failure(
                    "limit",
                    "Inspector accepts at most 256 metadata entries per section.",
                );
            }
        }
    }
    if raw
        .get("refs")
        .and_then(Value::as_array)
        .is_some_and(|v| v.len() > 256)
        || raw
            .get("metadata")
            .and_then(Value::as_object)
            .is_some_and(|v| v.len() > 256)
    {
        return failure(
            "limit",
            "Inspector accepts at most 256 references/document metadata entries.",
        );
    }
    let document = match MdportDocument::from_json_checked(input) {
        Ok(doc) => doc,
        Err(MdportReadError::UnsupportedSchema { expected, found }) => {
            return json!({"ok":false,"diagnostic":{"kind":"unsupported-schema","message":format!("Unsupported schema {found}; expected {expected}."),"expected":expected,"found":found}})
        }
        Err(MdportReadError::InvalidRecord {
            message,
            line,
            column,
        }) => {
            return json!({"ok":false,"diagnostic":{"kind":"invalid-record","message":message,"line":line,"column":column}})
        }
        Err(other) => return failure("invalid-record", &other.to_string()),
    };
    let mut unknown = Vec::new();
    if let Some(object) = raw.as_object() {
        for key in object.keys() {
            if ![
                "schema", "kind", "title", "source", "format", "metadata", "sections", "refs",
            ]
            .contains(&key.as_str())
            {
                unknown.push(format!("/{}", key.replace('~', "~0").replace('/', "~1")));
            }
        }
    }
    if let Some(sections) = raw.get("sections").and_then(Value::as_array) {
        for (i, section) in sections.iter().enumerate() {
            if let Some(object) = section.as_object() {
                for key in object.keys() {
                    if !["id", "path", "level", "line", "metadata", "text"].contains(&key.as_str())
                    {
                        unknown.push(format!(
                            "/sections/{i}/{}",
                            key.replace('~', "~0").replace('/', "~1")
                        ));
                    }
                }
            }
        }
    }
    let compact = match document.to_json() {
        Ok(s) => s,
        Err(e) => return failure("serialization", &e.to_string()),
    };
    if MdportDocument::from_json_checked(&compact).as_ref() != Ok(&document) {
        return failure(
            "serialization",
            "Native roundtrip did not preserve the decoded record.",
        );
    }
    json!({"ok":true,"input_bytes":input.len(),"canonical_bytes":compact.len(),
        "canonical":if unknown.is_empty(){Some(compact)}else{None},
        "unknown_fields":unknown,"document":document})
}

#[cfg_attr(feature = "wasm", wasm_bindgen::prelude::wasm_bindgen)]
pub fn inspect(input: &str) -> String {
    response(input).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    const SAMPLE: &str = include_str!("../../../tests/fixtures/accepted-document.json");
    fn run(input: &str) -> Value {
        serde_json::from_str(&inspect(input)).unwrap()
    }
    #[test]
    fn native_roundtrip_preserves_provenance_and_order() {
        let result = run(SAMPLE);
        assert_eq!(result["ok"], true);
        let original = MdportDocument::from_json_checked(SAMPLE).unwrap();
        assert_eq!(
            MdportDocument::from_json_checked(result["canonical"].as_str().unwrap()).unwrap(),
            original
        );
    }
    #[test]
    fn unknown_extensions_disable_lossy_export() {
        let mut input: Value = serde_json::from_str(SAMPLE).unwrap();
        input["extension"] = json!({"origin":"retain me"});
        input["sections"][0]["extra"] = json!(42);
        let output = run(&input.to_string());
        assert_eq!(output["ok"], true);
        assert!(output["canonical"].is_null());
        assert_eq!(
            output["unknown_fields"],
            json!(["/extension", "/sections/0/extra"])
        );
    }
    #[test]
    fn errors_keep_core_identity_and_location() {
        let input = SAMPLE.replace("mdport.v1", "mdport.v2");
        assert_eq!(run(&input)["diagnostic"]["kind"], "unsupported-schema");
        let input = SAMPLE.replace("\"source\":", "\"missing\":");
        assert!(run(&input)["diagnostic"]["line"].as_u64().unwrap() > 0);
    }
    #[test]
    fn limits_bound_bytes_nesting_counts_and_portable_numbers() {
        assert_eq!(
            run(&" ".repeat(MAX_BYTES + 1))["diagnostic"]["kind"],
            "limit"
        );
        assert_eq!(
            run(&format!("{}0{}", "[".repeat(33), "]".repeat(33)))["diagnostic"]["kind"],
            "limit"
        );
        let mut input: Value = serde_json::from_str(SAMPLE).unwrap();
        input["sections"][0]["line"] = json!(4294967296u64);
        assert_eq!(run(&input.to_string())["diagnostic"]["kind"], "limit");
        input["sections"] = json!(vec![input["sections"][0].clone(); 257]);
        assert_eq!(run(&input.to_string())["diagnostic"]["kind"], "limit");
    }

    #[test]
    fn nested_strings_and_browser_resource_limits_are_distinct_from_schema() {
        let base: Value = serde_json::from_str(SAMPLE).unwrap();
        let mut input = base.clone();
        input["sections"][0]["text"] = json!("[\\\"{}]".repeat(40));
        assert_eq!(run(&input.to_string())["ok"], true);
        for key in ["refs", "metadata", "path", "nodes"] {
            let mut input = base.clone();
            match key {
                "refs" => input["refs"] = json!(vec!["r"; 257]),
                "metadata" => {
                    input["metadata"] = json!((0..257)
                        .map(|i| (i.to_string(), "v"))
                        .collect::<std::collections::BTreeMap<_, _>>())
                }
                "path" => input["sections"][0]["path"] = json!(vec!["part"; 65]),
                _ => input["extension"] = json!(vec![0; 50_001]),
            }
            assert!(MdportDocument::from_json_checked(&input.to_string()).is_ok());
            assert_eq!(
                run(&input.to_string())["diagnostic"]["kind"],
                "limit",
                "{key}"
            );
        }
    }
}
