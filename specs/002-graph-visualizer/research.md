# Research: Interactive Graph Visualizer

**Feature**: `002-graph-visualizer`
**Date**: 2026-04-26
**Spec**: [spec.md](spec.md)

---

## Decision 1: Rendering Technology — SVG via D3 v7

**Decision**: Use D3 v7 with SVG for the graph canvas and HTML/CSS for the UI chrome (sidebar, legend, filter panel, search bar).

**Rationale**:
- D3 force simulation (`d3-force`) is the standard for interactive force-directed graphs with draggable nodes and configurable physics
- SVG allows per-element event handlers (hover, click on individual nodes and edges) — not possible with Canvas without manual hit-testing
- CSS transitions on SVG attributes enable smooth fading (opacity) for filter/search
- CSS `stroke-dashoffset` animation on SVG `<path>` elements gives the directional pulse effect efficiently on the GPU
- The user explicitly requested D3-level professional dataviz with the "gravity apparent" feel — D3 force simulation delivers this natively

**Alternatives considered**:
- **Canvas API + manual hit detection**: More performant at 1000+ nodes, but no per-element CSS transitions; implementing hover/click correctly is significantly more complex. Overkill for v1 scale (≤500 nodes).
- **Three.js / WebGL**: Maximum performance and visual effects, but extreme complexity; no native SVG DOM for UI elements; overkill for this use case.
- **Cytoscape.js**: Higher-level graph library, good defaults, but less control over visual style and animations; force layout less configurable than raw D3.

---

## Decision 2: HTML Bundle Strategy — Single-File Inline

**Decision**: Both `repoviz serve` and `repoviz bundle` produce/serve a single HTML file with all assets inlined: D3 minified JS, application JS, CSS, and graph data as a JavaScript global variable (`window.__REPOVIZ_DATA__`).

**Rationale**:
- `file://` protocol does not allow `fetch()` to local relative paths in Chrome (CORS restrictions) — inlining the data is the only way the bundle works offline without a server
- Single-file output is trivially shareable (email, Slack, GitHub comment attachment)
- D3 v7 minified + application code targets < 500KB total bundle — acceptable for a local tool
- The graph data is injected as `window.__REPOVIZ_DATA__ = { ...KitGraph... }` in a `<script>` tag before the app bundle — clean separation between data and code

**Alternatives considered**:
- **Separate JS/CSS files**: Simpler build, but breaks `file://` offline use; not truly "self-contained"
- **Base64 data URI**: Equivalent to inlining but adds ~33% size overhead; unnecessary
- **Fetch from local server**: Only works in `serve` mode; breaks the bundle use case

---

## Decision 3: Build Tool — esbuild

**Decision**: Use `esbuild` to bundle the browser-side TypeScript (`src/viewer/`) into a single minified JS file that gets inlined in the HTML template.

**Rationale**:
- Fastest available TypeScript/JS bundler (10–100× faster than webpack/rollup for this bundle size)
- Zero-config for simple TypeScript → single-file output
- Already a dev-time tool — not shipped to users
- Produces clean ESM or IIFE output suitable for inline `<script>` injection
- The whole viewer bundle (D3 + app code) should compile in < 2 seconds

**Alternatives considered**:
- **Rollup**: More configurable, good tree-shaking, but slower and more config boilerplate
- **Webpack**: Overkill; significantly more complex config for a single-output bundle
- **Vite**: Better DX for development, but adds complexity for the custom "inline everything" output requirement

---

## Decision 4: Local Server for `repoviz serve` — Node.js `http` built-in

**Decision**: `repoviz serve <graph.json>` uses Node.js built-in `http` module to start a minimal local server that serves the HTML template with graph data injected. Uses the `open` npm package (already common in Node.js tooling) to launch the default browser. Binds to a random available port to avoid conflicts.

**Rationale**:
- Zero additional production dependencies beyond `open` (which is tiny, ~1KB)
- Node.js `http` is sufficient for serving a single static HTML file
- Random port (`0` binding, OS picks) avoids port conflicts automatically
- Server stays running (Ctrl+C to exit) — standard pattern for dev tool servers; no need to implement browser-close detection

**Alternatives considered**:
- **`serve` npm package**: Adds a dependency for a problem easily solved with 20 lines of code
- **Fixed port (e.g., 3000)**: Conflicts with common dev servers; random port is safer
- **Auto-exit when browser closes**: Detecting browser close from a plain HTTP server is not reliable; Ctrl+C is the standard and expected UX for CLI server commands

---

## Decision 5: Icon System — Inline SVG Path Icons per Category

**Decision**: Each node category is represented by a small SVG path icon drawn inside the circle node. Icons are embedded as path data constants in the theme module — no icon font, no external sprite sheet.

**Rationale**:
- No network dependency (constitution principle: zero external calls)
- SVG paths scale perfectly with node radius
- Full control over icon design; can be tuned per category without a font dependency
- Total overhead is negligible (path strings are tiny)

**Category → Icon mapping** (to be refined during implementation):
| Category | Icon concept | Color |
|----------|-------------|-------|
| agent | person/robot silhouette | `#60a5fa` (blue) |
| command | terminal `>_` symbol | `#34d399` (emerald) |
| hook | chain link / lightning bolt | `#fbbf24` (amber) |
| context | document / page | `#a78bfa` (violet) |
| config | gear/settings | `#f87171` (red) |
| template | layout grid | `#38bdf8` (sky) |
| unclassified | question mark | `#6b7280` (gray) |

**Alternatives considered**:
- **Heroicons / Feather Icons font**: Requires embedding the full font (~50KB+) or fetching from CDN (violates local-first)
- **Emoji**: Not consistently rendered across OSes; not SVG-scalable
- **Shape-only (no icon)**: Less accessible; harder to distinguish without color

---

## Decision 6: Edge Pulse Animation — CSS stroke-dashoffset

**Decision**: Directional edge pulses are implemented via SVG `stroke-dasharray` + animated `stroke-dashoffset` CSS property. Each edge type gets a distinct color and dash pattern. The animation loop runs continuously on visible edges.

**Rationale**:
- `stroke-dashoffset` animation is GPU-accelerated (compositor thread) — does not block JS or force layout reflow
- Achieves the "electric pulse traveling along a wire" effect naturally
- Per-edge animation speed and color can vary by relationship type
- Faded edges (filtered out) have their animation paused via `animation-play-state: paused` — clean, no JS overhead

**Edge type → visual identity**:
| Type | Color | Dash pattern | Arrow |
|------|-------|-------------|-------|
| reads | `#60a5fa` (blue) | dashed + gap | → (open arrow) |
| executes | `#34d399` (emerald) | solid, thick | ► (filled arrow) |
| creates | `#fbbf24` (amber) | dotted | ◆ (diamond tip) |
| edits | `#f87171` (red) | solid | ↔ (bidirectional) |
| references | `#a78bfa` (violet) | long dash | → (thin arrow) |
| unresolved | `#6b7280` (gray) | short dash | → (muted arrow) |

---

## Decision 7: Filter + Search Architecture — Unified Opacity State

**Decision**: Harness filter, category filter, and text search all produce a single computed set of "visible node IDs". Any node not in this set gets opacity 0.15 (faded). Edges where BOTH endpoints are faded also get opacity 0.15. State updates are synchronous (no debounce needed for ≤500 nodes).

**Rationale**:
- Single state → single render pass for filter/search changes → guarantees <200ms SC-005
- Combining three filter dimensions (harness + category + text) is a simple set intersection
- Fading instead of removing preserves layout context (force simulation keeps all nodes positioned)
- Opacity 0.15 keeps the graph structure visible but clearly de-emphasizes non-matching elements

**Alternatives considered**:
- **Remove non-matching nodes**: Changes graph topology; force re-simulation triggers jarring layout change
- **Debounced search**: Unnecessary for ≤500 nodes; adds latency vs. instant feedback
