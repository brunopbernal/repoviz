# Data Model: Interactive Graph Visualizer

**Feature**: `002-graph-visualizer`
**Date**: 2026-04-26
**Spec**: [spec.md](spec.md)

---

## Entities

### 1. GraphNode

A visual representation of a `KitFile` node in the force simulation.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `string` | KitFile.id | Unique identifier; stable across renders |
| `path` | `string` | KitFile.path | Relative path in repo |
| `category` | `KitFileCategory` | KitFile.category | Determines color + icon |
| `native_type` | `string` | KitFile.native_type | Shown in tooltip and sidebar |
| `harness` | `string` | KitFile.harness | Used for harness filter |
| `display_name` | `string` | KitFile.display_name | Node label (truncated to ~30 chars on canvas) |
| `description` | `string \| null` | KitFile.description | Shown in tooltip and sidebar |
| `metadata` | `object` | KitFile.metadata | Frontmatter fields; displayed in sidebar |
| `x` | `number` | D3 force | X position in SVG coordinate space; initialized randomly |
| `y` | `number` | D3 force | Y position in SVG coordinate space; initialized randomly |
| `vx` | `number` | D3 force | X velocity; managed by simulation |
| `vy` | `number` | D3 force | Y velocity; managed by simulation |
| `fx` | `number \| null` | User drag | Fixed X position when dragged; null = free |
| `fy` | `number \| null` | User drag | Fixed Y position when dragged; null = free |

**Visual state** (derived, not stored — computed from FilterState and SelectionState):
- `default`: full opacity, standard fill + icon
- `hovered`: slightly enlarged radius, highlight ring
- `selected`: enlarged radius, prominent highlight ring, sidebar open
- `faded`: opacity 0.15 (node does not match active filters/search)

---

### 2. GraphEdge

A visual representation of a `Relationship` edge between two GraphNodes.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `string` | Relationship.id | Unique identifier |
| `source` | `GraphNode` | Relationship.source → resolved | D3 replaces string ID with node reference |
| `target` | `GraphNode \| UnresolvedTarget` | Relationship.target → resolved | String if unresolved (target not in nodes) |
| `type` | `RelationshipType` | Relationship.type | Determines color, dash pattern, arrow marker |
| `evidence` | `string` | Relationship.evidence | Shown in edge tooltip |
| `isUnresolved` | `boolean` | derived | true when Relationship.type === 'unresolved' |
| `isCurved` | `boolean` | derived | true when multiple edges exist between same source/target pair |
| `curveOffset` | `number` | derived | Bezier control point offset for curved multi-edges |

**Visual state** (derived from FilterState):
- `visible`: full opacity + active pulse animation
- `faded`: opacity 0.15 + animation paused (both endpoints are faded, or one is faded with no match on the other)

---

### 3. UnresolvedTarget

Represents a relationship target that does not correspond to any node in the KitGraph — the file path was found in analysis but the file does not exist in the repo's classified kit files.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Raw path string from Relationship.target |
| `path` | `string` | Same as id |
| `isGhost` | `true` | Marker to distinguish from real GraphNode |

Ghost nodes are NOT rendered in the force graph. Unresolved edges terminate at the source node with a visual indicator (dashed line + tooltip explaining "target not found in repo").

---

### 4. FilterState

The active set of filters applied to the graph. Empty arrays mean "no filter active" (all visible).

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `activeHarnesses` | `string[]` | `[]` | Harness IDs to highlight; empty = show all |
| `activeCategories` | `KitFileCategory[]` | `[]` | Category values to highlight; empty = show all |
| `searchQuery` | `string` | `""` | Substring match on `display_name`; empty = no text filter |

**Derived computation**:
```
visibleNodeIds = nodes
  .filter(n => activeHarnesses.length === 0 || activeHarnesses.includes(n.harness))
  .filter(n => activeCategories.length === 0 || activeCategories.includes(n.category))
  .filter(n => searchQuery === "" || n.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  .map(n => n.id)
```

An edge is visible when at least one of its endpoints is in `visibleNodeIds`.

---

### 5. SelectionState

Tracks which node is currently hovered or clicked.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `hoveredNodeId` | `string \| null` | `null` | Node under cursor |
| `selectedNodeId` | `string \| null` | `null` | Clicked node (sidebar open) |
| `hoveredEdgeId` | `string \| null` | `null` | Edge under cursor (tooltip) |
| `tooltipPosition` | `{ x, y } \| null` | `null` | SVG coordinates for tooltip anchor |

**Transitions**:
- `mouseenter` on node → set `hoveredNodeId`
- `mouseleave` on node → clear `hoveredNodeId`
- `click` on node → set `selectedNodeId`; if same node, toggle off
- `mouseenter` on edge → set `hoveredEdgeId`
- `click` on canvas background → clear `selectedNodeId`

---

### 6. CategoryVisual

Defines the visual identity for a node category. Shared constant — not stored per node.

| Field | Type | Notes |
|-------|------|-------|
| `category` | `KitFileCategory` | Key |
| `color` | `string` | Hex fill color for the node circle |
| `iconPath` | `string` | SVG path `d` attribute for the icon drawn inside the circle |
| `label` | `string` | Human-readable label shown in the legend |

---

### 7. EdgeVisual

Defines the visual identity for an edge relationship type. Shared constant — not stored per edge.

| Field | Type | Notes |
|-------|------|-------|
| `type` | `RelationshipType` | Key |
| `color` | `string` | Hex stroke color |
| `dashArray` | `string` | SVG `stroke-dasharray` value (e.g., `"6 3"`) |
| `markerType` | `"arrow" \| "diamond" \| "bidirectional"` | Arrow head shape |
| `animationDuration` | `number` | Pulse cycle duration in ms |
| `label` | `string` | Human-readable label shown in the legend |

---

### 8. AppState

Top-level application state combining all sub-states.

| Field | Type | Notes |
|-------|------|-------|
| `graph` | `{ nodes: GraphNode[], edges: GraphEdge[] }` | Full graph data, loaded once from KitGraph |
| `filter` | `FilterState` | Mutable; updated by user interactions |
| `selection` | `SelectionState` | Mutable; updated by user interactions |
| `availableHarnesses` | `string[]` | Derived from graph; drives filter panel options |
| `availableCategories` | `KitFileCategory[]` | Derived from graph; drives filter panel options |
| `summary` | `AnalysisSummary` | From KitGraph.summary; shown in summary bar |

---

## State Transitions

```
KitGraph JSON (window.__REPOVIZ_DATA__)
  ↓ parse + validate
AppState.graph (GraphNode[], GraphEdge[])
  ↓ d3-force simulation
  → positions settle (~3 seconds, alpha decay)
  → simulation continues (reactivates on drag)

User interactions:
  harness filter change  → update FilterState.activeHarnesses  → recompute visibleNodeIds → update opacity
  category filter change → update FilterState.activeCategories → recompute visibleNodeIds → update opacity
  search input           → update FilterState.searchQuery      → recompute visibleNodeIds → update opacity
  node hover             → update SelectionState.hoveredNodeId → show tooltip
  node click             → update SelectionState.selectedNodeId → open/close sidebar
  edge hover             → update SelectionState.hoveredEdgeId → show edge tooltip
  canvas click           → clear SelectionState.selectedNodeId → close sidebar
  node drag start        → set GraphNode.fx, GraphNode.fy → pin node → reheat simulation
  node drag end          → clear GraphNode.fx, GraphNode.fy → release node → simulation damps
  "Reset Layout" click   → clear all fx/fy → restart simulation with new alpha
  sidebar: click related node → scroll graph + highlight target node
```
