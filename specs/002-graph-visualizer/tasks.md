# Tasks: Interactive Graph Visualizer

**Feature**: `002-graph-visualizer` | **Date**: 2026-04-26
**Input**: `specs/002-graph-visualizer/plan.md`, `spec.md`, `data-model.md`, `contracts/cli.md`, `research.md`
**Branch**: `002-graph-visualizer`

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies within the same phase)
- **[Story]**: Which user story this task belongs to ([US1] through [US4])
- Exact file paths are included in every description

---

## Phase 1: Setup

**Purpose**: Add esbuild tooling and create directory scaffolding for the viewer, server, and bundler modules.

- [x] T001 Add `esbuild` to devDependencies in `package.json` and run `npm install`
- [x] T002 Create `scripts/build-viewer.ts` — esbuild Node.js API script that bundles `src/viewer/index.ts` to `dist/viewer.bundle.js` as IIFE format, minified, with `d3` bundled in (no external imports); exit non-zero on build error
- [x] T003 [P] Add `"build:viewer": "tsx scripts/build-viewer.ts"` and `"build:all": "npm run build:viewer && tsc"` scripts to `package.json`; install `tsx` as devDependency if not already present
- [x] T004 [P] Create empty placeholder files to establish directory structure: `src/server/serve.ts`, `src/bundler/bundle.ts`, `src/viewer/graph.ts`, `src/viewer/nodes.ts`, `src/viewer/edges.ts`, `src/viewer/filters.ts`, `src/viewer/sidebar.ts`, `src/viewer/tooltip.ts`, `src/viewer/legend.ts`, `src/viewer/search.ts`, `src/viewer/theme.ts`, `src/viewer/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared artifacts required by ALL user stories — HTML shell, theme constants, data entry point, and HTML generation logic.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Create `viewer/template.html` — dark canvas HTML shell: `<html>` with `lang="en"`, `<head>` with charset + viewport + title "repoviz", CSS block with `body { margin:0; background:#0f1117; color:#e2e8f0; font-family:sans-serif }` and CSS custom properties for theme colors, `<body>` with `<svg id="graph-canvas" width="100%" height="100vh"></svg>`, comment `<!-- DATA_INJECTION_POINT -->` where graph data will be injected, comment `<!-- BUNDLE_INJECTION_POINT -->` where viewer JS will be inlined; no external script or stylesheet links
- [x] T006 [P] Implement `src/viewer/theme.ts` — export `CATEGORY_VISUALS: CategoryVisual[]` with 7 entries (agent: `#60a5fa`/robot icon/`d="M12 12c2.7..."`, command: `#34d399`/terminal `>_`/`d="M4 17l6-6..."`, hook: `#fbbf24`/lightning bolt/`d="M13 2L3 14..."`, context: `#a78bfa`/document page/`d="M9 12h6m-6..."`, config: `#f87171`/gear/`d="M12 15a3..."`, template: `#38bdf8`/layout grid/`d="M4 5a1..."`, unclassified: `#6b7280`/question mark/`d="M9.09 9a3..."`); export `EDGE_VISUALS: EdgeVisual[]` with 6 entries (reads: `#60a5fa`/`"6 3"`/arrow/800ms, executes: `#34d399`/`"none"`/filledArrow/600ms, creates: `#fbbf24`/`"2 3"`/diamond/1000ms, edits: `#f87171`/`"none"`/bidirectional/700ms, references: `#a78bfa`/`"12 4"`/arrow/1200ms, unresolved: `#6b7280`/`"4 4"`/arrow/1500ms); both types defined per `data-model.md`
- [x] T007 [P] Implement `src/viewer/index.ts` — entry point: read `window.__REPOVIZ_DATA__` cast as `KitGraph`; validate it has `.nodes` array and `.edges` array and `.summary` object; if missing/invalid render `<div id="error-overlay">` with message "Invalid graph data — run repoviz analyze &lt;path&gt; to regenerate" and stop; if valid call `initGraph(data)`, `initSummaryBar(data)`, `initFilters(data)`, `initLegend()`
- [x] T008 Implement `src/bundler/bundle.ts` — export `generateHTML(graphData: KitGraph, viewerBundleJS: string, templateHTML: string): string` that: (1) replaces `<!-- DATA_INJECTION_POINT -->` with `<script>window.__REPOVIZ_DATA__ = ${JSON.stringify(graphData)};</script>`, (2) replaces `<!-- BUNDLE_INJECTION_POINT -->` with `<script>${viewerBundleJS}</script>`; export `readBundleAssets(graphPath: string): Promise<{graphData, viewerBundleJS, templateHTML}>` that reads and returns all three inputs; these exports will be used by both `serve.ts` and the bundle CLI command
- [x] T009 Run `npm run build:viewer` and verify `dist/viewer.bundle.js` is produced and is under 500KB; fix any TypeScript errors in placeholder files that prevent compilation

**Checkpoint**: Template, theme, entry point, and HTML generator are ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Open and Explore the Graph (Priority: P1) 🎯 MVP

**Goal**: `repoviz serve graph.json` opens a browser showing a live force-directed graph with all nodes draggable, edges animated, zoom/pan, and a visible legend.

**Independent Test**: Run `repoviz serve tests/fixtures/claude-workspace/graph.json` → browser opens in < 2 seconds showing 7 nodes (CLAUDE.md, 2 agents, 2 skills, 1 hook, 1 config) with distinct colors + icons; nodes are draggable; graph zooms on mouse wheel; pans on drag; Reset Layout button re-animates layout; summary bar shows total counts.

- [x] T010 [P] [US1] Implement `src/viewer/graph.ts` — export `initGraph(data: KitGraph): void` that: creates SVG `<defs>` with 6 arrow marker elements (one per edge type, colored per `EDGE_VISUALS`); creates inner `<g id="graph-root">` inside `#graph-canvas`; initializes `d3.forceSimulation` with `forceCenter(width/2, height/2)`, `forceManyBody().strength(-300)`, `forceLink(edges).id(d => d.id).distance(120)`, `forceCollide().radius(30)`; sets `alphaDecay(0.0228)` and `velocityDecay(0.4)` so simulation settles in ~3 seconds; exports `getSimulation()` and `restartSimulation()` for Reset Layout
- [x] T011 [P] [US1] Implement `src/viewer/nodes.ts` — export `renderNodes(nodeGroup: d3.Selection, nodes: GraphNode[]): void` that: creates SVG `<g class="node">` per node; appends `<circle r="20">` with `fill` from `CATEGORY_VISUALS[node.category].color`; appends `<path>` inside circle using `CATEGORY_VISUALS[node.category].iconPath` scaled to fit radius 14, `fill="white"`, `pointer-events="none"`; appends `<text>` below circle with `display_name` truncated to 30 chars, `fill="#cbd5e1"`, `font-size="11px"`, `text-anchor="middle"`, `dy="32"`; updates positions on simulation tick via `selection.attr("transform", d => \`translate(\${d.x},\${d.y})\`)`
- [x] T012 [US1] Implement `src/viewer/edges.ts` — export `renderEdges(edgeGroup: d3.Selection, edges: GraphEdge[], nodes: GraphNode[]): void` that: creates SVG `<line class="edge">` per edge (or `<path>` for curved multi-edges); applies `stroke` from `EDGE_VISUALS[edge.type].color`, `stroke-width: 2`, `stroke-dasharray` from `EDGE_VISUALS[edge.type].dashArray`, `marker-end` referencing the correct arrow marker in `<defs>`; adds CSS animation `stroke-dashoffset` with duration from `EDGE_VISUALS[edge.type].animationDuration`; for multi-edges between same node pair sets `curveOffset` to separate paths visually; updates edge positions on simulation tick
- [x] T013 [US1] Add D3 zoom and pan to `src/viewer/graph.ts` — call `d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => graphRoot.attr("transform", event.transform))` on `#graph-canvas`; apply zoom via `svg.call(zoom)`; pan on background drag is included in D3 zoom behavior automatically; double-click on background resets zoom to identity (optional but desirable)
- [x] T014 [US1] Add D3 drag behavior to `src/viewer/nodes.ts` — `d3.drag().on("start", (event, d) => { d.fx=d.x; d.fy=d.y; simulation.alphaTarget(0.3).restart(); }).on("drag", (event, d) => { d.fx=event.x; d.fy=event.y; }).on("end", (event, d) => { d.fx=null; d.fy=null; simulation.alphaTarget(0); })`; apply drag to node `<g>` elements; ensure dragged node cursor becomes "grabbing"
- [x] T015 [P] [US1] Add "Reset Layout" button to `viewer/template.html` (floating button `<button id="reset-layout">↺ Reset Layout</button>` styled in bottom-right corner) and wire in `src/viewer/graph.ts` — click handler: clears all `node.fx` and `node.fy`, calls `simulation.alpha(0.3).restart()`, resets zoom transform to identity
- [x] T016 [P] [US1] Add summary bar to `viewer/template.html` — fixed `<div id="summary-bar">` at top with: `<span id="summary-repo">` (repo path), `<span id="summary-nodes">` (N nodes), `<span id="summary-edges">` (N edges), `<span id="summary-harnesses">` (harness names comma-separated); populate these spans from `window.__REPOVIZ_DATA__.summary` and `Object.keys(window.__REPOVIZ_DATA__.harnesses)` in `src/viewer/index.ts` after validation
- [x] T017 [US1] Implement `src/server/serve.ts` — export `startServer(graphPath: string, port: number, noOpen: boolean, quiet: boolean): Promise<void>` that: reads graph JSON from `graphPath`, parses it, calls `readBundleAssets` + `generateHTML` from `bundle.ts`, creates `http.createServer` that responds with generated HTML on any GET request, binds to port (0 for random), on `listening` event prints `repoviz visualizer running at http://localhost:<port>` to stderr and calls `open(url)` unless `noOpen`, blocks until SIGINT received
- [x] T018 [US1] Extend `src/cli/index.ts` — add `serve` subcommand: positional arg `<graph-file>`; options `--port <n>` (number, default auto), `--no-open` (boolean, default false), `--quiet` (boolean, default false); validate graph-file exists (print error + `process.exit(1)` if not); validate it parses as JSON (print error + `process.exit(2)` if not); call `startServer(graphPath, port, noOpen, quiet)`; handle server errors with `process.exit(3)`
- [x] T019 [P] [US1] Write unit tests for CLI serve argument parsing in `tests/unit/serve.test.ts` — test: valid graph-file accepted, missing file produces exit code 1, invalid JSON produces exit code 2, `--port 4000` parsed correctly, `--no-open` flag parsed, `--quiet` flag parsed; mock `startServer` to avoid actual HTTP server in unit tests
- [x] T020 [US1] Validate US1 end-to-end: run `npm run build:viewer && npm run build` then `node dist/cli/index.js serve tests/fixtures/claude-workspace/graph.json`; confirm browser opens with 7 nodes rendered in correct colors; drag a node and confirm it follows cursor; scroll to zoom; drag background to pan; click Reset Layout and confirm simulation re-runs

**Checkpoint**: User Story 1 fully functional — `repoviz serve` delivers an interactive force-directed graph.

---

## Phase 4: User Story 2 — Inspect Nodes and Relationships (Priority: P2)

**Goal**: Hovering a node shows a tooltip with file metadata; clicking opens a sidebar with full details and relationship list; clicking a related node name navigates the graph to that node.

**Independent Test**: Click the `researcher.md` agent node in the fixture graph — sidebar slides in showing "Researcher" as title, description, harness "claude-code", category "agent", and relationships grouped by type; hover the `reads` edge → tooltip shows source, target, and evidence text.

- [x] T021 [P] [US2] Implement `src/viewer/tooltip.ts` — create `<div id="tooltip">` appended to `<body>` with CSS: `position:fixed; pointer-events:none; background:#1e293b; border:1px solid #334155; border-radius:6px; padding:8px 12px; font-size:12px; max-width:280px; opacity:0; transition:opacity 0.1s`; export `showNodeTooltip(node: GraphNode, x: number, y: number): void` renders `display_name` in bold, description (max 80 chars + "…"), `native_type`, `harness`, `category`; export `showEdgeTooltip(edge: GraphEdge, sourceName: string, targetName: string, x: number, y: number): void` renders type, source → target arrow, evidence; export `hideTooltip(): void`; position tooltip so it stays within viewport bounds
- [x] T022 [US2] Implement `src/viewer/sidebar.ts` — create `<div id="sidebar">` with CSS: `position:fixed; right:0; top:0; width:320px; height:100vh; background:#0d1117; border-left:1px solid #21262d; transform:translateX(100%); transition:transform 0.25s; overflow-y:auto; padding:16px`; export `showNode(node: GraphNode, allEdges: GraphEdge[], allNodes: GraphNode[]): void` that: populates `<h2>` with `display_name`; renders key-value pairs for all `metadata` fields + `category` + `harness` + `native_type`; renders `description` in `<p>`; separates outgoing and incoming edges, groups each by `type`, renders each as `<li>` with type badge + connected node name as `<button class="navigate-btn" data-node-id="...">` + evidence in muted text; slides panel in; export `closeSidebar(): void`
- [x] T023 [US2] Wire hover and click events in `src/viewer/index.ts` — after `renderNodes` and `renderEdges`: `nodeSelection.on("mouseenter", (event, d) => showNodeTooltip(d, event.clientX, event.clientY)).on("mouseleave", () => hideTooltip()).on("click", (event, d) => { event.stopPropagation(); showNode(d, data.edges, data.nodes); })` ; `edgeSelection.on("mouseenter", (event, d) => showEdgeTooltip(d, sourceName, targetName, event.clientX, event.clientY)).on("mouseleave", () => hideTooltip())`; `d3.select("#graph-canvas").on("click", () => closeSidebar())`
- [x] T024 [US2] Implement "navigate to related node" in `src/viewer/index.ts` — add delegated click handler on `#sidebar` for `.navigate-btn` buttons: on click get `data-node-id`, find node in `data.nodes`, compute target screen position from node.x/node.y and current zoom transform, animate SVG zoom transform to center on target using `svg.transition().duration(600).call(zoom.transform, newTransform)`; apply temporary highlight ring on target node (`<circle r="26" stroke="#f8fafc" stroke-width="3" fill="none" class="highlight-ring">`) that fades after 2 seconds
- [x] T025 [P] [US2] Write unit tests for sidebar data assembly in `tests/unit/sidebar.test.ts` — test: outgoing vs incoming relationship separation, grouping by relationship type, unresolved edge shows raw target path not node name, node with no description renders gracefully (no empty `<p>`), node with long display_name truncated to 30 chars in label but full name in sidebar header
- [ ] T026 [US2] Validate US2 end-to-end: serve fixture graph, click `researcher.md` → sidebar shows "Researcher", metadata fields, edge list; hover an edge → edge tooltip appears; click related node name in sidebar → graph pans and highlights target node; click canvas background → sidebar closes

**Checkpoint**: User Stories 1 + 2 both functional independently.

---

## Phase 5: User Story 3 — Filter by Harness and Category (Priority: P3)

**Goal**: Harness filter panel, category filter panel, and text search input all independently and combinably fade non-matching nodes to low opacity without changing the graph layout.

**Independent Test**: Use multi-harness fixture; select "github-copilot" harness filter → claude-code nodes fade to 15% opacity; select "agent" category filter additionally → only github-copilot agent nodes remain fully visible; type "researcher" in search → all but researcher node faded; clear all → full graph restores; all transitions < 200ms.

- [x] T027 [US3] Implement `src/viewer/filters.ts` — export mutable `filterState: FilterState = {activeHarnesses:[], activeCategories:[], searchQuery:""}` singleton; export `computeVisibleNodeIds(nodes: GraphNode[], state: FilterState): Set<string>` implementing the three-step filter intersection from `data-model.md`; export `computeEdgeVisible(edge: GraphEdge, visibleIds: Set<string>): boolean` (true when at least one endpoint id is in visibleIds); export `applyVisibility(nodeSelection, edgeSelection, visibleIds: Set<string>): void` that sets `opacity` to `1` or `0.15` using `d3.transition().duration(150)`; export `updateFilters(nodes, nodeSelection, edgeSelection): void` that recomputes and applies in one call
- [x] T028 [P] [US3] Add harness filter panel to `viewer/template.html` — `<div id="harness-filter"><h4>Harnesses</h4><div id="harness-checkboxes"></div></div>`; populate `#harness-checkboxes` in `src/viewer/index.ts` by iterating `Object.keys(data.harnesses)` and creating `<label><input type="checkbox" value="<harness>"> <harness></label>` for each; wire `change` event on each checkbox to update `filterState.activeHarnesses` (add if checked, remove if unchecked) and call `updateFilters()`
- [x] T029 [P] [US3] Add category filter panel to `viewer/template.html` — `<div id="category-filter"><h4>Categories</h4><div id="category-checkboxes"></div></div>`; populate `#category-checkboxes` in `src/viewer/index.ts` from unique `node.category` values across all nodes using `CATEGORY_VISUALS` for color swatch display; wire `change` events to update `filterState.activeCategories` and call `updateFilters()`
- [x] T030 [US3] Implement `src/viewer/search.ts` — export `initSearch(nodes: GraphNode[], nodeSelection, edgeSelection): void` that: selects `<input id="search-input">` (add to `viewer/template.html` if not present: `<div id="search-bar"><input id="search-input" type="text" placeholder="Search nodes…"></div>`); on `input` event updates `filterState.searchQuery = input.value` and calls `updateFilters()`; adds clear button `<button id="search-clear">✕</button>` that resets `searchQuery` to `""`, clears input value, and calls `updateFilters()`
- [x] T031 [US3] Verify filter opacity wiring in `src/viewer/filters.ts` — `applyVisibility` must: select all `.node` elements with D3, transition opacity based on `visibleIds.has(d.id)`; select all `.edge` elements, transition opacity based on `computeEdgeVisible`; pulse animation on faded edges must pause via `animation-play-state: paused` CSS property (set via `selection.style("animation-play-state", isVisible ? "running" : "paused")`); validate transition duration is 150ms meeting SC-005
- [x] T032 [P] [US3] Implement `src/viewer/legend.ts` — export `initLegend(): void` that: creates `<div id="legend">` with CSS `position:fixed; bottom:16px; left:16px; background:#161b22; border:1px solid #21262d; border-radius:8px; padding:12px; font-size:11px`; renders "Node Types" section: for each `CategoryVisual` a row with colored circle SVG (12px) + icon + label; renders "Relationships" section: for each `EdgeVisual` a row with colored line SVG (dash pattern) + label; call `initLegend()` in `src/viewer/index.ts`
- [x] T033 [US3] Add "Clear Filters" button to `viewer/template.html` — `<button id="clear-filters">Clear Filters</button>` in filter panel area; wire in `src/viewer/index.ts`: click resets `filterState = {activeHarnesses:[], activeCategories:[], searchQuery:""}`, unchecks all harness and category checkboxes, clears `#search-input` value, calls `updateFilters()`
- [x] T034 [US3] Write unit tests for FilterState computation in `tests/unit/filters.test.ts` — test: harness filter with matching nodes returns those node ids, category filter with matching nodes returns those node ids, search filter is case-insensitive substring match on display_name, combined harness+category+search returns intersection only, empty FilterState returns all node ids, edge visible when source in visibleIds even if target not, edge visible when target in visibleIds even if source not, edge faded when both endpoints absent from visibleIds

**Checkpoint**: All three user stories functional and combinable independently.

---

## Phase 6: User Story 4 — Generate Standalone HTML Bundle (Priority: P4)

**Goal**: `repoviz bundle graph.json --output viz.html` produces a single self-contained HTML file that renders the full interactive graph offline with no server or internet.

**Independent Test**: Run `repoviz bundle tests/fixtures/claude-workspace/graph.json --output /tmp/test-viz.html` → file written; open file with `file://` URL in Chrome with no internet → full graph renders with 7 nodes; all interactions (tooltip, sidebar, filters, search) work identically to serve mode.

- [x] T035 [US4] Finalize `src/bundler/bundle.ts` — add `writeBundleFile(graphPath: string, outputPath: string): Promise<void>` that: validates `graphPath` exists (throw with "File not found" for exit code 1 handling); parses JSON (throw with "Invalid KitGraph JSON" for exit code 2); reads `dist/viewer.bundle.js` and `viewer/template.html`; calls `generateHTML(graphData, viewerBundleJS, templateHTML)`; writes result to `outputPath` (throw on write error for exit code 3); verify no `src=`, `href=`, or `fetch(` references remain in generated HTML
- [x] T036 [US4] Extend `src/cli/index.ts` — add `bundle` subcommand: positional arg `<graph-file>`; options `--output <file>` (string, default "graph.html"), `--quiet` (boolean, default false); validate graph-file exists (`process.exit(1)`) and is valid JSON (`process.exit(2)`); call `writeBundleFile(graphPath, outputPath)`; on success print `Bundle written to <outputPath>` to stderr unless `--quiet`; catch write errors and `process.exit(3)`
- [x] T037 [P] [US4] Write unit tests for bundler in `tests/unit/bundler.test.ts` — test: `generateHTML` inlines graph data as `window.__REPOVIZ_DATA__ = {...}`, `generateHTML` inlines viewer JS in a `<script>` block, generated HTML contains no `src=` or external `href=` attributes, `--output viz.html` results in file at correct path, omitting `--output` defaults to `graph.html` in cwd
- [x] T038 [US4] Implement edge case rendering in `src/viewer/index.ts` — after parsing `window.__REPOVIZ_DATA__`: if `data.nodes.length === 0` render `<div id="empty-state" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#6b7280">No kit files found — run repoviz analyze &lt;path&gt; to generate a graph</div>` and stop; single-node case: set `forceCenter` to viewport center with higher strength so node settles centered; in `src/viewer/edges.ts` for edges with `isUnresolved:true` apply `stroke-dasharray:"4 4"`, `stroke:#6b7280`, `opacity:0.5`, and edge tooltip text "unresolved reference — target not found in repo"
- [x] T039 [US4] Write integration test in `tests/integration/visualizer.test.ts` — spawn `node dist/cli/index.js bundle tests/fixtures/claude-workspace/graph.json --output /tmp/repoviz-test.html` as child process; assert exit code 0; assert file `/tmp/repoviz-test.html` exists; read file content; assert it contains `window.__REPOVIZ_DATA__`; parse the embedded JSON and assert `nodes.length === 7`; assert HTML contains no `<script src=` or `<link href=` to external resources
- [ ] T040 [US4] Validate `file://` protocol compatibility — open the bundle generated in T039 in Chrome and Firefox using `file://` URL; confirm graph renders with 7 nodes in correct colors; confirm tooltip, sidebar, harness filter, category filter, search, and Reset Layout all work; confirm no browser console errors
- [ ] T041 [US4] Performance validation — generate synthetic 500-node `graph.json` with 200 edges (script or fixture); run `repoviz bundle` then open bundle in browser; measure time to interactive (draggable, zoomable); assert < 3 seconds; confirm CPU usage drops after simulation settles

**Checkpoint**: All 4 user stories complete and independently validated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all stories — simulation tuning, visual refinement, documentation, and full regression.

- [x] T042 [P] Tune force simulation in `src/viewer/graph.ts` — verify `alphaDecay(0.0228)` and `velocityDecay(0.4)` produce settling in < 3 seconds for 50-node graph (SC-001); if not, adjust `forceManyBody().strength()` and `forceCollide().radius()` until stable; add `simulation.on("end", () => console.debug("simulation settled"))` for diagnostics
- [x] T043 [P] Update `README.md` at repository root — add "Graph Visualizer" section with: `repoviz serve graph.json` usage + options table, `repoviz bundle graph.json --output viz.html` usage + options table, feature list (force-directed graph, drag/zoom/pan, tooltips, sidebar, filters, search, standalone bundle), link to spec
- [x] T044 [P] Visual polish pass — review `viewer/template.html` and all `src/viewer/` CSS: sidebar panel background `#0d1117` with header `#161b22`; legend border radius, padding, line-height; summary bar height and separator; tooltip max-width and line-height; node label contrast on dark background; ensure all text is legible at 1080p and 1440p
- [x] T045 Full regression — run `npm test` and confirm all tests pass (50 existing engine tests + new visualizer tests); run `repoviz serve tests/fixtures/multi-harness-repo/graph.json` and manually verify: harness filter fades correct nodes, category filter works, text search works, sidebar + tooltip work, legend is visible, Reset Layout works; run `repoviz bundle` on the same fixture and verify offline bundle is identical

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 complete — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 complete
- **US2 (Phase 4)**: Depends on Phase 3 complete (needs rendered nodes/edges to attach events)
- **US3 (Phase 5)**: Depends on Phase 3 complete (needs node/edge selections); can overlap US2
- **US4 (Phase 6)**: Depends on Phase 3 complete (bundle.ts needs viewer bundle); can overlap US2 and US3
- **Polish (Phase 7)**: Depends on all user story phases complete

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (P1) | Phase 2 | Core graph rendering — MVP |
| US2 (P2) | US1 complete | Requires rendered node/edge elements to attach hover/click events |
| US3 (P3) | US1 complete | Requires node/edge D3 selections; can start in parallel with US2 |
| US4 (P4) | US1 complete | Bundle logic exists from Phase 2; CLI command and edge cases are the new work |

### Within Each Phase

- Tasks marked `[P]` in the same phase can run in parallel (different files, no blocking deps)
- Tasks without `[P]` depend on preceding tasks in the same phase completing first
- Commit after each task or logical group for granular rollback

---

## Parallel Example: Phase 3 (US1)

```bash
# These [P] tasks can run simultaneously:
Task T010: Implement src/viewer/graph.ts (force simulation)
Task T011: Implement src/viewer/nodes.ts (SVG node rendering)
Task T015: Add Reset Layout button to viewer/template.html
Task T016: Add summary bar to viewer/template.html

# Then sequentially (depends on T010 + T011):
Task T012: Implement src/viewer/edges.ts (needs graph.ts simulation ref + nodes.ts data structure)
Task T013: Add zoom/pan to graph.ts (extends T010)
Task T014: Add drag to nodes.ts (extends T011)
Task T017: Implement serve.ts (needs bundle.ts from Phase 2 + compiled viewer bundle)
Task T018: Extend CLI with serve command (needs serve.ts)
```

## Parallel Example: Phase 5 (US3)

```bash
# These [P] tasks can run simultaneously:
Task T028: Add harness filter panel to template.html + wiring
Task T029: Add category filter panel to template.html + wiring
Task T032: Implement legend.ts

# Then:
Task T030: Implement search.ts (depends on filter panel structure in template)
Task T031: Verify opacity wiring (depends on T027 + filters wired)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T009) ← CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 (T010–T020)
4. **STOP and VALIDATE**: `repoviz serve tests/fixtures/claude-workspace/graph.json` → interactive graph in browser
5. Demo or share at this point

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 (T010–T020) → Force-directed graph in browser (MVP!)
3. US2 (T021–T026) → Tooltip + sidebar inspection
4. US3 (T027–T034) → Harness/category filters + search
5. US4 (T035–T041) → Standalone bundle command
6. Polish (T042–T045) → Tuning + docs + regression

### Notes

- `[P]` marks tasks safe to run in parallel within the same phase (different files, no blocking deps)
- Every user story ends with an end-to-end validation task (`T020`, `T026`, `T040`)
- Tests (`tests/unit/`) are included per plan.md specification
- `npm run build:viewer` must be run before `repoviz serve/bundle` to update `dist/viewer.bundle.js`
- The `open` npm package (already common in Node tooling, ~1KB) handles cross-platform browser launch
