# Graph Report — repoviz (2026-04-26)

> Generated via `npm run graphify` (graphifyy v0.4.33 — structural inventory).
> Semantic edge extraction requires a full LLM pass; this report reflects
> the static file inventory and manual structural analysis.

## Corpus

- **66 files** tracked (41 code · 25 documents)
- **~27,944 words** total — fits in a single context window
- `needs_graph: false` — graphifyy confirms the codebase is small enough
  for direct file reading without graph-guided traversal

## Subsystems (Communities)

### 1. Core Engine — `src/engine/` (4 files)

Static analysis pipeline. Entry point: `analyzer.ts`.

| File | Role |
|---|---|
| `analyzer.ts` | Orchestrates the full pipeline: scan → detect → classify → relate → serialize |
| `detector.ts` | Classifies files against harness primitive_mappings using globs |
| `relationships.ts` | Extracts cross-file relationships via regex patterns from harness definitions |
| `metadata.ts` | Parses frontmatter and extracts display_name, description from file content |

### 2. Harness System — `src/harnesses/` (2 files)

Extension point for adding new AI platform support.

| File | Role |
|---|---|
| `loader.ts` | Reads YAML definition files from `definitions/` directory |
| `types.ts` | TypeScript types for harness definitions (detection_signals, primitive_mappings, relationship_patterns) |

New harnesses are added by creating a YAML file in `definitions/` — no core code changes needed.

### 3. Browser Visualizer — `src/viewer/` (10 files)

D3.js force-directed graph. Entry point: `index.ts`. Bundled by esbuild into `dist/viewer.bundle.js`.

| File | Role |
|---|---|
| `index.ts` | Wires all modules; reads `window.__REPOVIZ_DATA__`; drives main loop |
| `graph.ts` | D3 force simulation, zoom, pan, drag behavior |
| `nodes.ts` | SVG `<g>` elements per node: circle, icon, label |
| `edges.ts` | SVG `<line>` elements per edge: color, dash, arrow, animation |
| `filters.ts` | Harness/category checkboxes + text search; unified opacity fade |
| `sidebar.ts` | Slide-in metadata panel with outgoing/incoming relationship lists |
| `tooltip.ts` | Hover tooltip with node/edge details |
| `legend.ts` | Left-panel legend for node categories and edge types |
| `search.ts` | Text search input wiring |
| `theme.ts` | Visual constants: CATEGORY_VISUALS, EDGE_VISUALS (colors, icons, dash patterns) |

### 4. CLI Pipeline — `src/cli/`, `src/bundler/`, `src/server/` (3 files)

| File | Role |
|---|---|
| `cli/index.ts` | Entry point: `analyze`, `serve`, `bundle` subcommands |
| `bundler/bundle.ts` | Inlines graph JSON + viewer bundle into standalone HTML |
| `server/serve.ts` | Local HTTP server; generates HTML on startup |

### 5. Output Contract — `src/output/` (2 files)

| File | Role |
|---|---|
| `types.ts` | **Central type contract**: `KitGraph`, `KitFile`, `Relationship` — used by every other module |
| `serializer.ts` | Converts analysis result to `KitGraph` JSON |

### 6. Tests — `tests/` (17 files)

| Suite | Files | Scope |
|---|---|---|
| Unit | bundler, detector, filters, relationships, serializer, serve, sidebar | Pure logic, no I/O |
| Integration | claude-code, codex-cli, cursor, gemini-cli, github-copilot, multi-harness, performance, visualizer, windsurf | Real fixture repos |
| Visual | graph-viewer.spec.ts (Playwright) | Browser screenshot validation |

## God Nodes (most cross-referenced)

| Node | Why it matters |
|---|---|
| `src/output/types.ts` | Defines `KitGraph`, `KitFile`, `Relationship` — touched by engine, viewer, bundler, server, CLI, all tests. **The central data contract.** Changing this file has the widest blast radius. |
| `src/viewer/index.ts` | Imports all 9 other viewer modules. Any new viewer feature starts here. |
| `src/engine/analyzer.ts` | Imports detector, loader, relationships, metadata, serializer. Drives the full analysis pipeline. |

## Key Architectural Boundaries

```
definitions/ (YAML)
     ↓
src/harnesses/loader.ts
     ↓
src/engine/analyzer.ts ←→ src/output/types.ts ←→ src/viewer/index.ts
     ↓                                                    ↓
src/output/serializer.ts              src/viewer/{graph, nodes, edges, ...}
     ↓                                                    ↓
src/cli/index.ts ————→ src/bundler/bundle.ts ——→ viewer/template.html
         └——————→ src/server/serve.ts
```

## Guidance for Next Features

| Feature type | Where to look first |
|---|---|
| New harness (e.g. Windsurf rules) | `definitions/` YAML + `tests/fixtures/` + `tests/integration/` |
| New node visual / category | `src/viewer/theme.ts` → `src/viewer/nodes.ts` |
| New edge type | `src/viewer/theme.ts` → `src/viewer/edges.ts` |
| New sidebar section | `src/viewer/sidebar.ts` |
| New filter | `src/viewer/filters.ts` → `src/viewer/index.ts` |
| New CLI subcommand | `src/cli/index.ts` → new file in `src/` |
| Output format change | `src/output/types.ts` → all consumers (wide blast radius) |

## Update Commands

```bash
# Refresh graph after significant code changes
npm run graphify

# Auto-watch during active development session
npm run graphify:watch

# Git hooks update automatically on commit/checkout/merge
# (installed via: npx graphifyy hook install)
```

## Recommendation for this Project

Since repoviz fits in a single context window (`needs_graph: false`), Graphify
is most valuable here as a **navigation aid** (knowing which module to open
first) rather than as a graph traversal tool. The god nodes table above is
the highest-value output for day-to-day development.
