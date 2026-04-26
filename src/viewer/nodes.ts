import * as d3 from "d3";
import { getCategoryVisual } from "./theme.js";
import type { GraphNode, NodeSelection } from "./graph.js";

const NODE_RADIUS = 20;
const ICON_SCALE = 14 / 10;

export function renderNodes(
  nodeSelection: NodeSelection,
  _graphNodes: GraphNode[]
): void {
  // Circle
  nodeSelection
    .append("circle")
    .attr("r", NODE_RADIUS)
    .attr("fill", (d) => getCategoryVisual(d.category).color)
    .attr("stroke", (d) => {
      const c = getCategoryVisual(d.category).color;
      return c;
    })
    .attr("stroke-width", 0)
    .style("filter", (d) => `drop-shadow(0 0 4px ${getCategoryVisual(d.category).color}60)`);

  // Icon path inside circle
  nodeSelection
    .append("path")
    .attr("d", (d) => getCategoryVisual(d.category).iconPath)
    .attr("fill", "rgba(255,255,255,0.85)")
    .attr("stroke", "none")
    .attr("transform", `scale(${ICON_SCALE})`)
    .attr("pointer-events", "none");

  // Label below circle
  nodeSelection
    .append("text")
    .attr("class", "node-label")
    .attr("dy", NODE_RADIUS + 14)
    .text((d) => truncate(d.display_name, 28));

  // Hover highlight: enlarge circle on mouseover
  nodeSelection
    .on("mouseover.highlight", function () {
      d3.select(this).select("circle").attr("stroke-width", 2).attr("stroke", "white");
    })
    .on("mouseout.highlight", function () {
      d3.select(this).select("circle").attr("stroke-width", 0);
    });
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
