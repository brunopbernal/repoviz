import * as d3 from "d3";
import type { KitGraph, KitFile, Relationship } from "../output/types.js";

export interface GraphNode extends KitFile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  index?: number;
}

export interface GraphEdge {
  id: string;
  source: GraphNode | string;
  target: GraphNode | string;
  type: string;
  evidence: string;
  isUnresolved: boolean;
  isCurved: boolean;
  curveOffset: number;
}

export type NodeSelection = d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;
export type EdgeSelection = d3.Selection<SVGLineElement | SVGPathElement, GraphEdge, SVGGElement, unknown>;

let simulation: d3.Simulation<GraphNode, GraphEdge> | null = null;

export function getSimulation(): d3.Simulation<GraphNode, GraphEdge> | null {
  return simulation;
}

export function restartSimulation(alpha = 0.3): void {
  if (simulation) {
    simulation.alpha(alpha).restart();
  }
}

function buildGraphEdges(
  edges: Relationship[],
  nodeIds: Set<string>
): GraphEdge[] {
  const pairCounts = new Map<string, number>();
  const pairIndex = new Map<string, number>();

  for (const e of edges) {
    const key = [e.source, e.target].sort().join("|");
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  return edges.map((e) => {
    const key = [e.source, e.target].sort().join("|");
    const count = pairCounts.get(key) ?? 1;
    const idx = pairIndex.get(key) ?? 0;
    pairIndex.set(key, idx + 1);

    const isCurved = count > 1;
    const offset = isCurved ? (idx - (count - 1) / 2) * 30 : 0;

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      evidence: e.evidence,
      isUnresolved: e.type === "unresolved" || !nodeIds.has(e.target),
      isCurved,
      curveOffset: offset,
    };
  });
}

interface InitGraphResult {
  nodeSelection: NodeSelection;
  edgeSelection: EdgeSelection;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
}

export function initGraph(data: KitGraph): InitGraphResult {
  const svg = d3.select<SVGSVGElement, unknown>("#graph-canvas");
  const width = (svg.node()?.clientWidth ?? window.innerWidth);
  const height = (svg.node()?.clientHeight ?? window.innerHeight) - 36;

  const graphNodes: GraphNode[] = data.nodes.map((n) => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * 300,
    y: height / 2 + (Math.random() - 0.5) * 300,
    vx: 0,
    vy: 0,
    fx: null,
    fy: null,
  }));

  const nodeIds = new Set(graphNodes.map((n) => n.id));
  const graphEdges = buildGraphEdges(data.edges, nodeIds);

  // Filter edges whose source exists in graph (target may be unresolved)
  const validEdges = graphEdges.filter((e) =>
    nodeIds.has(typeof e.source === "string" ? e.source : (e.source as GraphNode).id)
  );

  // Setup arrow marker defs
  setupArrowDefs(svg);

  const nodeGroup = svg.select<SVGGElement>("#node-layer");
  const edgeGroup = svg.select<SVGGElement>("#edge-layer");

  // D3 force simulation
  simulation = d3
    .forceSimulation<GraphNode, GraphEdge>(graphNodes)
    .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
    .force(
      "charge",
      d3.forceManyBody<GraphNode>().strength(-350).distanceMax(500)
    )
    .force(
      "link",
      d3
        .forceLink<GraphNode, GraphEdge>(validEdges)
        .id((d) => d.id)
        .distance(140)
        .strength(0.4)
    )
    .force("collide", d3.forceCollide<GraphNode>().radius(36).strength(0.7))
    .alphaDecay(0.0228)
    .velocityDecay(0.4);

  // Setup zoom
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      d3.select("#graph-root").attr("transform", event.transform.toString());
    });

  svg.call(zoom);

  svg.on("dblclick.zoom", () => {
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
  });

  // Reset Layout button integration
  document.getElementById("reset-layout")?.addEventListener("click", () => {
    graphNodes.forEach((n) => {
      n.fx = null;
      n.fy = null;
    });
    if (simulation) simulation.alpha(0.4).restart();
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
  });

  // Edge selection (rendered as lines or paths)
  const edgeSelection = edgeGroup
    .selectAll<SVGLineElement, GraphEdge>("line.edge")
    .data(validEdges)
    .enter()
    .append("line")
    .attr("class", "edge")
    .style("cursor", "pointer");

  // Node selection
  const nodeSelection = nodeGroup
    .selectAll<SVGGElement, GraphNode>("g.node")
    .data(graphNodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .style("cursor", "pointer");

  // Drag behavior
  const drag = d3
    .drag<SVGGElement, GraphNode>()
    .on("start", (event, d) => {
      if (!event.active) simulation?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });

  nodeSelection.call(drag);

  // Tick handler
  simulation.on("tick", () => {
    edgeSelection
      .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
      .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
      .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
      .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

    nodeSelection.attr(
      "transform",
      (d) => `translate(${d.x ?? 0},${d.y ?? 0})`
    );
  });

  return {
    nodeSelection: nodeSelection as unknown as NodeSelection,
    edgeSelection: edgeSelection as unknown as EdgeSelection,
    graphNodes,
    graphEdges: validEdges,
  };
}

function setupArrowDefs(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>): void {
  const defs = svg.select<SVGDefsElement>("#arrow-defs");

  const markers: Array<{ id: string; color: string; refX: number }> = [
    { id: "arrow-reads", color: "#60a5fa", refX: 28 },
    { id: "arrow-executes", color: "#34d399", refX: 28 },
    { id: "arrow-creates", color: "#fbbf24", refX: 28 },
    { id: "arrow-edits", color: "#f87171", refX: 28 },
    { id: "arrow-references", color: "#a78bfa", refX: 28 },
    { id: "arrow-unresolved", color: "#6b7280", refX: 28 },
  ];

  for (const m of markers) {
    defs
      .append("marker")
      .attr("id", m.id)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", m.refX)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", m.color);
  }
}
