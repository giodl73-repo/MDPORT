# MDPORT performance-claim boundary

MDPORT can report retained fixture results, synthetic MDCROP benchmark results,
and real-corpus admission smoke results. It must not turn those into broad
portfolio performance claims until real corpus measurements exist.

This boundary closes `MDP-PF-05`.

## Current evidence

- `docs/research/performance.md` records synthetic MDCROP fixture results where
  mdport units are smaller and quality is higher than Markdown, while compact
  JSON bytes are larger than Markdown.
- `tests/fixtures/maxim-real-corpus-slice.md` is a retained MAXIM-shaped corpus
  fixture used by `tests/conformance.rs`.
- `tests/conformance.rs` verifies that the retained corpus fixture converts to
  `mdport.v1`, preserves source lines, heading paths, refs, and metadata, emits
  compact canonical JSON, and round-trips through checked admission.

## Claim gate

Before MDPORT claims faster, smaller, higher-quality, or replacement-ready
behavior for broad portfolio adoption, the evidence must name:

1. corpus identity and size;
2. source fixture or generation command;
3. benchmark command and run count;
4. hardware, operating system, and dependency boundary;
5. Markdown baseline bytes and Mdport canonical bytes;
6. parse time, ingest time, selected-context quality, and variance or repeated
   run summary; and
7. downstream owner acceptance for any hot-path replacement.

If any field is missing, MDPORT may claim only schema admission, conformance, or
bounded research status.

## Replacement boundary

Synthetic fixtures and retained admission fixtures are useful regression
evidence. They do not authorize replacing MDCROP, PROOF, MAXIM, or portfolio
hot paths by themselves. Replacement claims require the claim gate above plus
consumer-owned validation in the adopting repo.
