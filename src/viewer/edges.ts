import { getEdgeVisual } from "./theme.js";
import type { GraphEdge, EdgeSelection } from "./graph.js";
import type { GraphNode } from "./graph.js";

export function renderEdges(
  edgeSelection: EdgeSelection,
  _graphEdges: GraphEdge[],
  _graphNodes: GraphNode[]
): void {
  edgeSelection
    .attr("stroke", (d) =>
      d.isUnresolved ? "#6b7280" : getEdgeVisual(d.type).color
    )
    .attr("stroke-width", (d) => (d.type === "executes" ? 2.5 : 1.5))
    .attr("stroke-dasharray", (d) => {
      if (d.isUnresolved) return "4 4";
      const da = getEdgeVisual(d.type).dashArray;
      return da === "none" ? null : da;
    })
    .attr("stroke-opacity", (d) => (d.isUnresolved ? 0.45 : 0.75))
    .attr("marker-end", (d) => {
      const type = d.isUnresolved ? "unresolved" : d.type;
      return `url(#arrow-${type})`;
    })
    .attr("fill", "none")
    .style("animation-duration", (d) => {
      const visual = getEdgeVisual(d.isUnresolved ? "unresolved" : d.type);
      return `${visual.animationDuration}ms`;
    })
    .style("animation-play-state", "running");
}
