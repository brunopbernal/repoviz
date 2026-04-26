# Research: Core Analysis Engine

**Phase 0 output** | Feature: `001-core-analysis-engine` | Date: 2026-04-26

---

## Decision 1: Runtime & Language

**Decision**: TypeScript / Node.js

**Rationale**: The engine output feeds a browser-based visualization, so sharing the same JS/TS ecosystem reduces friction. `npx repoviz /path` delivers true zero-config installation (Principle V). Node.js I/O performance is excellent for the file-reading workload. TypeScript provides type safety for the complex graph data structures. Cross-platform by default.

**Alternatives considered**:
- Python — excellent for text/AST parsing, but `pip install` is more friction than `npx`. Chosen against because JS ecosystem aligns better with the browser renderer.
- Go — best raw performance, but harder to contribute to for the open source community; no native browser ecosystem alignment.
- Rust — best performance, worst contributor experience for an early-stage open source project.

---

## Decision 2: Harness Definition Format

**Decision**: YAML files, one per harness, loaded at runtime from a `definitions/` directory

**Rationale**: YAML is human-readable and widely understood by developers. Each file declares detection signals (glob patterns and/or required file paths), canonical-to-native primitive mappings, and relationship extraction patterns (regex/glob). New harnesses can be added by dropping a `.yml` file — no code change required (FR-012). The `definitions/` directory ships with the tool and can be extended by the community.

**Alternatives considered**:
- JSON — machine-readable but verbose and hard to write by hand for community contributors.
- TypeScript plugin modules — maximum flexibility but requires code changes and compilation to add a new harness.
- Embedded hard-coded registry — fast but not extensible; violates FR-012.

---

## Decision 3: Static Analysis Strategy per Harness

**Decision**: Three-pass analysis pipeline per harness

1. **Detection pass** — match glob patterns from harness definition against the repo file tree; classify files into canonical categories with `native_type`.
2. **Metadata pass** — parse classified files (YAML frontmatter, Markdown headers, JSON keys) to extract `display_name` and `description`.
3. **Relationship pass** — scan file contents with harness-specific regex/glob patterns to detect cross-file references (path strings, `@`-mentions, `import`-style references) and classify them as `reads`, `executes`, `creates`, `edits`, or `references`.

**Rationale**: Three distinct passes keep concerns separated and make each pass independently testable. The detection pass is fast (glob matching only); the metadata and relationship passes run only on classified files, keeping total analysis time well within the 5-second target for 500-file repos.

**No code execution**: At no point does the engine call `eval`, `exec`, spawn child processes from analyzed files, or follow symlinks outside the repo root.

---

## Decision 4: Multi-Harness Detection

**Decision**: Run all harness definitions in parallel; aggregate results

Each harness definition is checked against the full file tree independently. A file can only belong to one harness (determined by the most specific detection signal match). The `harnesses{}` index in the output lists all detected harnesses and maps each to its node IDs, enabling the visualization layer to filter by harness.

**Alternatives considered**:
- Single-harness mode (first match wins) — simpler but loses accuracy for multi-harness repos.
- User-specified harness — adds configuration friction; violates Principle V.

---

## Decision 5: Performance Strategy

**Decision**: Parallel file I/O with early-exit classification

- Use async parallel file reads (all files simultaneously, bounded by OS limits).
- Skip binary files and symlinks before opening (stat check only).
- Skip files > 1 MB before reading content.
- Classification is glob-first (cheap) then content-parse (expensive) — only parse content for files that pass glob classification.
- Estimated budget for 500 files: ~200ms I/O + ~800ms parsing + ~200ms relationship extraction = ~1.2s. Well within the 5s target.

---

## Decision 6: Output Serialization

**Decision**: Single JSON file written to stdout by default, optionally to `--output <file>`

The Kit Graph is serialized as a single JSON document. Default output is stdout so it can be piped directly to a renderer. `--output graph.json` saves to file. The schema is defined in `contracts/kit-graph.schema.json`.

**Harness definitions known at research time** (signals to detect each):

| Harness | Primary detection signals |
|---------|--------------------------|
| Claude Code | `.claude/` directory, `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/copilot/` |
| Codex CLI | `AGENTS.md`, `.codex/` directory |
| Gemini CLI | `.gemini/` directory, `GEMINI.md` |
| Cursor | `.cursor/` directory, `.cursor/rules/`, `cursor.rules` |
| Windsurf | `.windsurf/` directory, `.windsurfrules` |

**Canonical vocabulary mapping** (harness native term → canonical category):

| Canonical | Claude Code | Copilot | Codex | Gemini | Cursor | Windsurf |
|-----------|-------------|---------|-------|--------|--------|----------|
| `agent` | agent | — | agent | — | — | — |
| `command` | skill | instruction | — | command | — | workflow |
| `hook` | hook | — | — | — | — | — |
| `context` | context file | copilot-instructions | AGENTS.md | GEMINI.md | rules | windsurfrules |
| `template` | template | — | — | — | — | — |
| `config` | settings.json | — | — | — | .cursorrules | — |
