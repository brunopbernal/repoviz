import type { KitGraph, KitFile, Relationship } from "../output/types.js";
import { initGraph, getSimulation, type GraphNode, type GraphEdge } from "./graph.js";
import { renderNodes } from "./nodes.js";
import { renderEdges } from "./edges.js";
import {
  initFilters,
  updateFilters,
  resetFilterState,
} from "./filters.js";
import { initLegend } from "./legend.js";
import { initSearch } from "./search.js";
import { showNodeTooltip, showEdgeTooltip, hideTooltip } from "./tooltip.js";
import { showNode, closeSidebar } from "./sidebar.js";

declare global {
  interface Window {
    __REPOVIZ_DATA__: KitGraph;
  }
}

function renderErrorOverlay(message: string): void {
  const el = document.createElement("div");
  el.id = "error-overlay";
  el.innerHTML = `<h2>⚠ Graph Error</h2><p>${message}</p>`;
  document.body.appendChild(el);
}

function renderEmptyState(): void {
  const el = document.createElement("div");
  el.id = "empty-state";
  el.innerHTML = `
    <h2>No kit files found</h2>
    <p>Run <code>repoviz analyze &lt;path&gt;</code> to generate a graph, then open this visualization.</p>
  `;
  document.body.appendChild(el);
}

function initSummaryBar(data: KitGraph): void {
  const repoEl = document.getElementById("summary-repo");
  const nodesEl = document.getElementById("summary-nodes");
  const edgesEl = document.getElementById("summary-edges");
  const harnessesEl = document.getElementById("summary-harnesses");

  if (repoEl) repoEl.textContent = data.summary.repo_path;
  if (nodesEl) nodesEl.textContent = String(data.nodes.length);
  if (edgesEl) edgesEl.textContent = String(data.edges.length);
  if (harnessesEl) {
    const names = Object.keys(data.harnesses);
    harnessesEl.textContent =
      names.length > 0 ? names.join(", ") : "no harnesses";
  }
}

function navigateToNode(target: GraphNode): void {
  if (target.x == null || target.y == null) return;

  const svg = document.getElementById("graph-canvas") as SVGSVGElement | null;
  if (!svg) return;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  const scale = 1.5;
  const tx = w / 2 - target.x * scale;
  const ty = h / 2 - target.y * scale;

  const root = document.getElementById("graph-root");
  if (root) {
    root.style.transition = "transform 0.6s ease";
    root.setAttribute("transform", `translate(${tx},${ty}) scale(${scale})`);
    setTimeout(() => {
      if (root) root.style.transition = "";
    }, 700);
  }

  // Temporary highlight ring
  const existing = document.querySelector(".highlight-ring");
  if (existing) existing.remove();

  const nodeLayer = document.getElementById("node-layer");
  if (nodeLayer) {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("class", "highlight-ring");
    ring.setAttribute("cx", String(target.x));
    ring.setAttribute("cy", String(target.y));
    ring.setAttribute("r", "26");
    nodeLayer.appendChild(ring);
    setTimeout(() => ring.remove(), 2000);
  }
}

function main(): void {
  const raw = window.__REPOVIZ_DATA__;

  if (
    !raw ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.edges) ||
    !raw.summary
  ) {
    renderErrorOverlay(
      "Invalid graph data — run <code>repoviz analyze &lt;path&gt;</code> to regenerate."
    );
    return;
  }

  if (raw.nodes.length === 0) {
    renderEmptyState();
    return;
  }

  initSummaryBar(raw);

  const { nodeSelection, edgeSelection, graphNodes, graphEdges } = initGraph(raw);

  renderNodes(nodeSelection, graphNodes);
  renderEdges(edgeSelection, graphEdges, graphNodes);

  // Node hover / click events
  nodeSelection
    .on("mouseenter", function (_event: MouseEvent, d: GraphNode) {
      const event = _event as MouseEvent;
      showNodeTooltip(d as unknown as KitFile, event.clientX, event.clientY);
    })
    .on("mouseleave", () => hideTooltip())
    .on("click", function (event: Event, d: GraphNode) {
      event.stopPropagation();
      showNode(
        d as unknown as KitFile,
        raw.edges as Relationship[],
        raw.nodes as KitFile[]
      );
    });

  // Edge hover events
  edgeSelection.on("mouseenter", function (event: MouseEvent, d: GraphEdge) {
    const srcId =
      typeof d.source === "string" ? d.source : (d.source as GraphNode).id;
    const tgtId =
      typeof d.target === "string" ? d.target : (d.target as GraphNode).id;
    const srcNode = graphNodes.find((n) => n.id === srcId);
    const tgtNode = graphNodes.find((n) => n.id === tgtId);
    showEdgeTooltip(
      d,
      srcNode?.display_name ?? srcId,
      tgtNode?.display_name ?? tgtId,
      event.clientX,
      event.clientY
    );
  });
  edgeSelection.on("mouseleave", () => hideTooltip());

  // Canvas click to close sidebar
  document.getElementById("graph-canvas")?.addEventListener("click", (e) => {
    const target = e.target as Element;
    if (target.id === "graph-canvas" || target.tagName.toLowerCase() === "svg") {
      closeSidebar();
    }
  });

  // Navigate to related node from sidebar
  document.getElementById("sidebar")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLElement>(".navigate-btn");
    if (!btn) return;
    const nodeId = btn.dataset["nodeId"];
    if (!nodeId) return;
    const found = graphNodes.find((n) => n.id === nodeId);
    if (found) navigateToNode(found);
  });

  // Sidebar close button
  document.getElementById("sidebar-close")?.addEventListener("click", closeSidebar);

  // Clear all filters button
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    document
      .querySelectorAll<HTMLInputElement>(
        "#harness-checkboxes input, #category-checkboxes input"
      )
      .forEach((cb) => (cb.checked = false));
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement | null;
    if (searchInput) searchInput.value = "";

    resetFilterState();
    updateFilters(graphNodes, nodeSelection, edgeSelection);
  });

  initFilters(raw, graphNodes, edgeSelection, nodeSelection);
  initSearch(graphNodes, nodeSelection, edgeSelection);
  initLegend();

  // Simulation reference consumed by Reset Layout listener in graph.ts
  void getSimulation;
}

main();
