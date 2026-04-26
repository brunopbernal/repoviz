import * as d3 from "d3";
import type { KitGraph } from "../output/types.js";
import type { GraphNode, GraphEdge, NodeSelection, EdgeSelection } from "./graph.js";
import { CATEGORY_VISUALS } from "./theme.js";

export interface FilterState {
  activeHarnesses: string[];
  activeCategories: string[];
  searchQuery: string;
}

let _filterState: FilterState = {
  activeHarnesses: [],
  activeCategories: [],
  searchQuery: "",
};

let _graphNodes: GraphNode[] = [];
let _nodeSelection: NodeSelection | null = null;
let _edgeSelection: EdgeSelection | null = null;

export function computeVisibleNodeIds(
  nodes: GraphNode[],
  state: FilterState
): Set<string> {
  return new Set(
    nodes
      .filter(
        (n) =>
          state.activeHarnesses.length === 0 ||
          state.activeHarnesses.includes(n.harness)
      )
      .filter(
        (n) =>
          state.activeCategories.length === 0 ||
          state.activeCategories.includes(n.category)
      )
      .filter(
        (n) =>
          state.searchQuery === "" ||
          n.display_name.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
      .map((n) => n.id)
  );
}

export function computeEdgeVisible(
  edge: GraphEdge,
  visibleIds: Set<string>
): boolean {
  const srcId =
    typeof edge.source === "string"
      ? edge.source
      : (edge.source as GraphNode).id;
  const tgtId =
    typeof edge.target === "string"
      ? edge.target
      : (edge.target as GraphNode).id;
  return visibleIds.has(srcId) || visibleIds.has(tgtId);
}

export function applyVisibility(
  nodeSelection: NodeSelection,
  edgeSelection: EdgeSelection,
  visibleIds: Set<string>
): void {
  nodeSelection
    .transition()
    .duration(150)
    .style("opacity", (d) => (visibleIds.has(d.id) ? "1" : "0.15"));

  edgeSelection
    .transition()
    .duration(150)
    .style("opacity", (d) =>
      computeEdgeVisible(d as unknown as GraphEdge, visibleIds) ? "0.75" : "0.1"
    )
    .style("animation-play-state", (d) =>
      computeEdgeVisible(d as unknown as GraphEdge, visibleIds)
        ? "running"
        : "paused"
    );
}

export function updateFilters(
  nodes: GraphNode[],
  nodeSelection: NodeSelection,
  edgeSelection: EdgeSelection
): void {
  const visibleIds = computeVisibleNodeIds(nodes, _filterState);
  applyVisibility(nodeSelection, edgeSelection, visibleIds);
}

export function getFilterState(): FilterState {
  return _filterState;
}

export function resetFilterState(): void {
  _filterState = { activeHarnesses: [], activeCategories: [], searchQuery: "" };
}

export function initFilters(
  data: KitGraph,
  graphNodes: GraphNode[],
  edgeSelection: EdgeSelection,
  nodeSelection: NodeSelection
): void {
  _graphNodes = graphNodes;
  _nodeSelection = nodeSelection;
  _edgeSelection = edgeSelection;

  const harnessContainer = document.getElementById("harness-checkboxes");
  const categoryContainer = document.getElementById("category-checkboxes");

  // Harness checkboxes
  if (harnessContainer) {
    const harnesses = Object.keys(data.harnesses);
    if (harnesses.length <= 1) {
      // Hide harness filter panel if only one harness
      const card = document.getElementById("harness-filter-card");
      if (card) card.style.display = "none";
    } else {
      for (const h of harnesses) {
        const label = document.createElement("label");
        label.className = "filter-option";
        label.innerHTML = `<input type="checkbox" value="${esc(h)}" /> ${esc(h)}`;
        label
          .querySelector("input")!
          .addEventListener("change", (e) => {
            const cb = e.target as HTMLInputElement;
            if (cb.checked) {
              _filterState.activeHarnesses.push(cb.value);
            } else {
              _filterState.activeHarnesses = _filterState.activeHarnesses.filter(
                (x) => x !== cb.value
              );
            }
            runUpdate();
          });
        harnessContainer.appendChild(label);
      }
    }
  }

  // Category checkboxes
  if (categoryContainer) {
    const presentCategories = [
      ...new Set(graphNodes.map((n) => n.category)),
    ];
    const orderedCats = CATEGORY_VISUALS.filter((v) =>
      presentCategories.includes(v.category)
    );

    for (const cv of orderedCats) {
      const label = document.createElement("label");
      label.className = "filter-option";
      label.innerHTML = `
        <input type="checkbox" value="${esc(cv.category)}" />
        <span class="filter-swatch" style="background:${cv.color}"></span>
        ${esc(cv.label)}
      `;
      label
        .querySelector("input")!
        .addEventListener("change", (e) => {
          const cb = e.target as HTMLInputElement;
          if (cb.checked) {
            _filterState.activeCategories.push(cb.value);
          } else {
            _filterState.activeCategories = _filterState.activeCategories.filter(
              (x) => x !== cb.value
            );
          }
          runUpdate();
        });
      categoryContainer.appendChild(label);
    }
  }

  function runUpdate(): void {
    if (_nodeSelection && _edgeSelection) {
      updateFilters(_graphNodes, _nodeSelection, _edgeSelection);
    }
  }
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// d3 transitions are called via selections at runtime
export const _d3ref = d3;
