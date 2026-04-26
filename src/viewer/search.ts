import { getFilterState, updateFilters } from "./filters.js";
import type { GraphNode, NodeSelection, EdgeSelection } from "./graph.js";

export function initSearch(
  graphNodes: GraphNode[],
  nodeSelection: NodeSelection,
  edgeSelection: EdgeSelection
): void {
  const input = document.getElementById("search-input") as HTMLInputElement | null;
  const clearBtn = document.getElementById("search-clear");

  if (!input) return;

  input.addEventListener("input", () => {
    getFilterState().searchQuery = input.value;
    updateFilters(graphNodes, nodeSelection, edgeSelection);
  });

  clearBtn?.addEventListener("click", () => {
    input.value = "";
    getFilterState().searchQuery = "";
    updateFilters(graphNodes, nodeSelection, edgeSelection);
  });
}
