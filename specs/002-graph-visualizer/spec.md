# Feature Specification: Interactive Graph Visualizer

**Feature Branch**: `002-graph-visualizer`
**Created**: 2026-04-26
**Status**: Draft
**Input**: User description: "Interactive Graph Visualizer — renderizar o KitGraph JSON como grafo interativo no browser com D3 v7"

---

## Clarifications

### Session 2026-04-26

- Q: Como os nós devem ser visualmente diferenciados por categoria — só cor, ou cor + forma diferente, ou cor + ícone interno? → A: Cor + ícone interno — todos os nós são círculos, cada categoria tem cor distinta e um símbolo/ícone desenhado dentro do círculo.
- Q: O canvas deve ter fundo escuro ou claro? → A: Fundo escuro (~`#0f1117`) com nós coloridos brilhantes e pulsos luminosos — efeito "rede neural" dramático.
- Q: Deve haver busca textual por nome de nó, ou filtros por tipo/harness são suficientes para descoberta? → A: Barra de busca textual — digitar destaca nós cujo `display_name` contém o texto; os demais fadeiam; busca combinável com os filtros existentes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open and Explore the Graph (Priority: P1)

A developer runs the Core Analysis Engine against their kit repository, gets a `graph.json` file, and wants to visually understand the structure of their workspace. They run `repoviz serve graph.json` and their browser opens showing a live, interactive force-directed graph of all agents, skills, hooks, context files, and config files — connected by arrows that represent how each file relates to the others. Nodes repel and attract each other naturally, settling into a readable layout. The developer can drag any node to reposition it and explore the graph freely.

**Why this priority**: This is the core value proposition of the entire feature. Without a visible, navigable graph, no other capability matters. Everything else builds on top of this.

**Independent Test**: Run `repoviz serve tests/fixtures/claude-workspace/graph.json` — browser opens and displays a force-directed graph with all 7 fixture nodes (CLAUDE.md, 2 agents, 2 skills, 1 hook, 1 config) connected by typed arrows. Nodes are draggable. Graph can be zoomed and panned.

**Acceptance Scenarios**:

1. **Given** a valid `graph.json` file, **When** the user runs `repoviz serve graph.json`, **Then** the default browser opens within 2 seconds displaying the interactive graph.
2. **Given** the graph is rendered, **When** the user drags a node, **Then** the node follows the cursor and the connected edges update in real-time.
3. **Given** the graph is rendered, **When** the user scrolls the mouse wheel, **Then** the graph zooms in/out smoothly centered on the cursor position.
4. **Given** the graph is rendered, **When** the user clicks and drags the background, **Then** the entire graph pans accordingly.
5. **Given** nodes with different categories (agent, command, hook, context, config), **When** the graph renders, **Then** each category is visually distinct (unique color + unique icon inside the circle) and a visible legend explains each category icon.
6. **Given** edges with different relationship types (reads, executes, creates, edits, references, unresolved), **When** the graph renders, **Then** each relationship type has its own visual identity (color, line style, arrow marker) and the legend includes edge types.

---

### User Story 2 — Inspect Nodes and Relationships (Priority: P2)

The developer wants to understand what a specific agent does, what files it references, and how it connects to other kit files. They hover over a node and see a tooltip with the file's name, objective, and type. They click the node and a side panel opens showing all available metadata about that file — its description, frontmatter fields, harness, category — plus a structured list of every relationship it participates in (what it reads, what references it, etc.) with the name and category of each connected file.

**Why this priority**: Viewing the graph is only useful if the user can understand individual elements. Node inspection is the primary exploratory interaction and directly enables the learning/discovery use case.

**Independent Test**: Click on the `researcher.md` agent node in the fixture graph — sidebar opens showing name "Researcher", description, harness "claude-code", category "agent", and a list of edges: one `references` edge to `CLAUDE.md` and one `references` edge to `context/summary.md` (unresolved). Hovering the `reads` edge shows tooltip with evidence text.

**Acceptance Scenarios**:

1. **Given** the graph is rendered, **When** the user hovers over a node, **Then** a tooltip appears within 150ms showing: `display_name`, `description` (truncated if long), `native_type`, `harness`, and `category`.
2. **Given** the graph is rendered, **When** the user clicks a node, **Then** a side panel slides in showing the full node details: all frontmatter metadata fields, full description, and a list of outgoing and incoming relationships grouped by type.
3. **Given** a node is selected in the sidebar, **When** the user looks at the relationship list, **Then** each relationship entry shows: relationship type, the name of the connected node (or raw path if unresolved), and the evidence text that generated the relationship.
4. **Given** a node is selected, **When** the user clicks a related node's name in the sidebar, **Then** the graph pans and highlights that node.
5. **Given** the user hovers over an edge (arrow), **Then** a tooltip shows: relationship type, source name, target name, and evidence text.
6. **Given** the user clicks elsewhere on the canvas, **Then** the sidebar closes and the selection is cleared.

---

### User Story 3 — Filter by Harness and Category (Priority: P3)

The developer is working on a multi-harness repository that contains both Claude Code and GitHub Copilot files, resulting in a dense graph. They want to focus on just Claude Code nodes. They use the filter panel to select only the `claude-code` harness — non-matching nodes fade out visually (they are not removed, preserving layout context) and edges connected exclusively to hidden nodes also fade. The developer can also filter by node category to see only agents, or only hooks.

**Why this priority**: Filtering is essential for usability with multi-harness repos or large workspaces. Without it, the graph becomes visually overwhelming — but this is a progressive enhancement; the basic graph already delivers value.

**Independent Test**: Use the multi-harness fixture graph (claude-code + github-copilot nodes). Select filter "harness: github-copilot" — all claude-code nodes fade to 20% opacity, github-copilot nodes remain fully visible, edges between faded nodes also fade. Deselect the filter — full graph restores instantly.

**Acceptance Scenarios**:

1. **Given** a graph with multiple harnesses, **When** the user selects a harness filter, **Then** nodes from non-selected harnesses fade to low opacity within 200ms (edges connected to faded nodes also fade).
2. **Given** one or more harness filters are active, **When** the user deselects all filters, **Then** all nodes and edges restore to full opacity instantly.
3. **Given** the filter panel, **When** the user selects a category filter (e.g., "agent"), **Then** only nodes of that category remain fully visible.
4. **Given** both harness and category filters are active simultaneously, **Then** only nodes matching both criteria are fully visible.
5. **Given** a filter is active, **When** the user opens a node sidebar, **Then** the sidebar works normally for any node regardless of its visibility state.
6. **Given** the search input is visible, **When** the user types a name (e.g., "researcher"), **Then** only nodes whose `display_name` contains that string remain fully visible within 200ms; clearing the input restores all nodes.
7. **Given** a harness filter AND a text search are both active, **Then** only nodes satisfying both criteria are fully visible.

---

### User Story 4 — Generate Standalone HTML Bundle (Priority: P4)

The developer wants to share the visualization with a colleague who does not have `repoviz` installed. They run `repoviz bundle graph.json --output viz.html`, receive a single self-contained HTML file, open it in any modern browser without a server, and see the full interactive graph — identical to the `serve` mode.

**Why this priority**: Sharing and offline use are important for collaboration, but the core visualization works without this. The bundle is a delivery mechanism, not the visualization itself.

**Independent Test**: Run `repoviz bundle tests/fixtures/claude-workspace/graph.json --output /tmp/test-viz.html`. Copy the file to a machine with no internet and open it — full interactive graph renders identically to `serve` mode.

**Acceptance Scenarios**:

1. **Given** a valid `graph.json`, **When** the user runs `repoviz bundle graph.json --output viz.html`, **Then** a single HTML file is written that contains all CSS, JS, and graph data inline.
2. **Given** the generated HTML file, **When** opened in Chrome, Firefox, or Safari with no internet connection, **Then** the full interactive graph renders correctly.
3. **Given** the bundle command, **When** `--output` is omitted, **Then** the HTML is written to `graph.html` in the current directory.

---

### Edge Cases

- **Empty graph** (0 nodes): Renders an informative empty-state message ("No kit files found — run `repoviz analyze <path>` to generate a graph") instead of a blank canvas.
- **Single node, no edges**: Renders a single centered node with no edges; graph is still interactive.
- **Graph with 500+ nodes**: Visual performance may degrade — simulation alpha decays faster to prevent continuous recalculation; user is not warned (graceful degradation).
- **Unresolved edges** (target path not found in nodes): Edge renders with distinct visual style (dashed line, muted color) and tooltip explicitly states "unresolved reference — target not found in repo".
- **Node with no description**: Tooltip and sidebar show the `display_name` only; description field is omitted gracefully.
- **Very long `display_name`**: Truncated to ~30 characters in tooltip and node label; full name visible in sidebar.
- **`graph.json` file not found**: `repoviz serve` exits with code 1 and prints an actionable error message.
- **Malformed `graph.json`**: Visualizer shows error overlay stating the file is invalid and suggests re-running the engine.
- **Multiple edges between same pair of nodes** (different types): All edges render, spaced as curved lines to remain individually visible.

---

## Requirements *(mandatory)*

### Functional Requirements

**Graph Rendering**
- **FR-000**: The visualizer MUST use a dark canvas background (approximately `#0f1117`) as the base visual theme. All color choices for nodes, edges, labels, and UI chrome must be designed for dark-background contrast. The HTML bundle must embed this theme without relying on system preferences.
- **FR-001**: The visualizer MUST render all nodes from the KitGraph as visual elements in a force-directed graph layout.
- **FR-002**: The visualizer MUST render all edges from the KitGraph as directed arrows between nodes, preserving source → target direction.
- **FR-003**: Each node MUST display its `display_name` as a label.
- **FR-004**: Each node MUST render as a circle with a distinct fill color AND a category-specific icon/symbol drawn inside the circle — agent, command, hook, context, config, template, and unclassified each have a unique color+icon combination, remaining distinguishable without color alone (accessible for color vision deficiencies).
- **FR-005**: Each edge MUST have a visually distinct appearance based on its `type` (reads, executes, creates, edits, references, unresolved) — distinguishable by color and/or line style.
- **FR-006**: A persistent legend MUST be visible explaining the visual encoding for both node categories and edge types.
- **FR-007**: A summary bar MUST display: total node count, total edge count, list of detected harnesses, and the analyzed repo path.

**Interaction — Graph Navigation**
- **FR-008**: Nodes MUST be draggable — users can click and drag any node to reposition it manually.
- **FR-009**: The graph MUST use a force simulation with apparent gravity (nodes attract toward center) and mutual repulsion between nodes, producing an organic, auto-settling layout.
- **FR-010**: The graph MUST support mouse wheel zoom centered on cursor position.
- **FR-011**: The graph MUST support click-drag pan on the canvas background.
- **FR-012**: A "Reset Layout" control MUST restart the force simulation and re-center the graph.

**Interaction — Node Inspection**
- **FR-013**: Hovering a node MUST display a tooltip with: `display_name`, `description` (truncated), `native_type`, `harness`, and `category`.
- **FR-014**: Clicking a node MUST open a detail sidebar showing: all metadata fields, full description, and a list of all outgoing and incoming relationships (grouped by type), each showing the connected node's name and the evidence text.
- **FR-015**: Clicking a connected node name in the sidebar relationship list MUST navigate the graph to highlight and center on that node.
- **FR-016**: Clicking the canvas background MUST close the sidebar and deselect the node.

**Interaction — Edge Inspection**
- **FR-017**: Hovering an edge MUST display a tooltip with: relationship type, source node name, target node name, and evidence text.
- **FR-018**: Edges MUST display an animated directional pulse effect that visually conveys the direction of the relationship (source → target).

**Filtering**
- **FR-019**: A filter panel MUST allow selecting one or more harnesses to highlight; non-matching nodes fade to low opacity.
- **FR-020**: A filter panel MUST allow selecting one or more node categories to highlight; non-matching nodes fade to low opacity.
- **FR-021**: When filters are active, edges connected exclusively to faded nodes MUST also fade.
- **FR-022**: Filter changes MUST apply without page reload, within 200ms.
- **FR-023**: A "Clear Filters" control MUST restore all nodes and edges to full opacity instantly.
- **FR-023b**: A text search input MUST be available that highlights nodes whose `display_name` contains the typed string (case-insensitive); non-matching nodes fade to low opacity using the same mechanism as category/harness filters. Search, harness filter, and category filter MUST be combinable simultaneously — a node is highlighted only when it satisfies all active criteria.

**Delivery**
- **FR-024**: `repoviz serve <graph.json>` MUST start a local server and open the visualization in the user's default browser.
- **FR-025**: `repoviz bundle <graph.json> [--output <file>]` MUST generate a single self-contained HTML file with all assets (CSS, JS, graph data) inlined — requiring no internet connection or server to open.
- **FR-026**: The bundle MUST work correctly when opened directly from the filesystem (`file://` protocol) in Chrome, Firefox, and Safari.

### Key Entities

- **GraphNode**: A rendered visual element representing a `KitFile` — carries position, visual state (default/hovered/selected/faded), and a reference to the underlying KitFile data.
- **GraphEdge**: A rendered visual element representing a `Relationship` — carries path geometry, pulse animation state, and a reference to the underlying Relationship data.
- **FilterState**: The current set of active harness and category filters — determines which nodes are fully visible vs faded.
- **SelectionState**: The currently hovered or clicked node — drives tooltip display and sidebar content.
- **VisualLegend**: The mapping from category/relationship type to visual encoding (color + icon per category, color + line style per edge type) — must be consistent throughout the entire visualization. Node shape is always a circle; distinction comes from fill color and internal icon symbol.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A graph with 50 nodes and 30 edges renders and becomes fully interactive (draggable, zoomable) within 3 seconds of opening in a modern browser.
- **SC-002**: All nodes and edges present in the input `graph.json` appear in the rendered visualization — zero data loss.
- **SC-003**: A user unfamiliar with the tool can identify the category of any node within 5 seconds of viewing (distinct visual identity + legend).
- **SC-004**: A user unfamiliar with the tool can identify the type of any relationship within 5 seconds of viewing (distinct visual identity + legend).
- **SC-005**: Applying or clearing a filter takes effect within 200ms with no page reload.
- **SC-006**: The self-contained HTML bundle opens and renders correctly with no internet connection on Chrome, Firefox, and Safari.
- **SC-007**: `repoviz serve` opens the browser within 2 seconds of the command being run.
- **SC-008**: A user can locate any node by name using the text search input within 10 seconds, regardless of graph size.

---

## Assumptions

- The input format is exclusively the `KitGraph` JSON schema defined in `specs/001-core-analysis-engine/contracts/kit-graph.schema.json`. No other input format is supported.
- Target platform is desktop browser only (Chrome, Firefox, Safari, Edge — latest 2 major versions). Mobile is out of scope for v1.
- The visualization is read-only — the user cannot edit, add, or remove nodes or edges through the visualizer.
- No graph state is persisted between sessions — each open of the same `graph.json` starts with a fresh auto-layout.
- `repoviz serve` requires Node.js to be installed (same requirement as the engine). The local server runs on `localhost` on an available port.
- The graph data is embedded directly in the HTML bundle (not loaded via fetch) to ensure `file://` protocol compatibility.
- The visual theme is dark-first: dark canvas background (~`#0f1117`) with bright node colors and luminous edge pulses — creating the "neural network" aesthetic. All UI chrome (sidebar, legend, filter panel) uses dark surface colors. There is no light theme in v1.
- Node visual encoding uses color + internal icon (all nodes are circles; each category has a unique fill color and a symbolic icon drawn inside). This ensures accessibility without color alone.
- Text search highlights nodes by `display_name` substring match (case-insensitive) and is combinable with harness and category filters.
- Multi-edge pairs (multiple relationships between the same two nodes) are rendered as curved, offset lines to remain individually clickable.
- The force simulation alpha decay is tuned so the graph settles within ~3 seconds and stops consuming CPU after settling.
- No authentication, no telemetry, no network calls of any kind from the visualizer.
