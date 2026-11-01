# Preserve original-file custody after a refused replacement

The first release was merged as 616c580956882f4a768218ea8e0ae349d5c3b3dc.
Final producer review found that choosing an invalid replacement file cleared
the original-file snapshot even though the editor retained its previous draft.
For a CRLF source this lost exact original line endings on a later download.

File selection now invalidates displayed results while preserving original text.
Only successful replacement, an editor change or Restore example replaces that
snapshot. The existing CRLF/Unicode/extension browser case now refuses an invalid
UTF-8 replacement and checks original download again before editing. Core Rust,
schema admission, worker protocol, deadlines and export policy are unchanged.
Run the full 29-case browser suite locally and in hosted CI before release;
TRACKER will retain the final exact archive and fresh live proof.
