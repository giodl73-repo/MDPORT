# Build the record inspector

Use Rust 1.95.0 (`rust-toolchain.toml`), Python 3.11+, Node 22 and
wasm-bindgen CLI 0.2.127 matching the pinned crate. Install
`wasm32-unknown-unknown`, rustfmt and Clippy for that toolchain.

```text
cargo fmt --all --check
cargo test --locked --workspace --all-features
cargo clippy --locked --workspace --all-features --all-targets -- -D warnings
cargo clippy --locked -p mdport-web --lib --features wasm --target wasm32-unknown-unknown -- -D warnings
npm ci
npx playwright install chromium
python -B tools/build-pages.py
npm run test:pages
```

The builder uses the committed lockfile, release WASM, native adapter references,
clean Git source archive and exact source checks. Generated `dist/MDPORT/`,
`.cache/`, browser dependencies and reports are ignored. A shared Cargo target
may be selected through `CARGO_TARGET_DIR`; it is not a source dependency.
Dirty local builds are labelled and use staged/tracked source for previews;
CI requires a clean checkout. `python -B tools/serve-pages.py` serves the project
prefix on loopback port 4177. Tests use fresh anonymous browser contexts, zero
retries and real WASM; explicit fault cases intercept worker/fetch delivery.

`cargo run --locked -p mdport-web --bin mdport-inspect -- RECORD.json` emits
the same canonical inspection report as the WASM adapter. Its file reader is
bounded. Compact record export uses `MdportDocument::to_json` and is checked by
native reparse. Unknown extension fields disable compact export rather than
silently dropping content. Original input download retains the opened UTF-8 file
text, including line endings, until the editor is changed or the example restored;
after edits it downloads the current editor's UTF-8 text.
No Markdown rendering, reference resolution or source trust verification occurs.

The workflow validates PRs, then builds/tests the exact `master` artifact and
deploys it with Pages-only deployment permissions. Set
`MDPORT_BASE_URL=https://giodl73-repo.github.io/MDPORT/` for fresh live replay.
The delivery budget is 5,000,000 total file bytes. Provenance and notice downloads
identify Rust, bindings, the source commit and resolved dependency licenses.
First-party MIT does not replace the retained third-party grants.
