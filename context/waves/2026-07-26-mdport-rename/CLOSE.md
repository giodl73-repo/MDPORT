# MDPORT rename closeout

MDPORT now owns the compact `mdport.v1` JSON record for Markdown documents and
corpus slices. The crate is dependency-light, schema-focused, and ready to be
published independently before downstream consumers.

The former optional SLICE integration was removed. Consumers can query decoded
MDPORT records without making selector semantics part of the wire standard.
