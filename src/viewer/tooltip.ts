import type { KitFile } from "../output/types.js";
import type { GraphEdge } from "./graph.js";

let tooltipEl: HTMLElement | null = null;

function getTooltip(): HTMLElement {
  if (!tooltipEl) {
    tooltipEl = document.getElementById("tooltip");
  }
  return tooltipEl!;
}

function position(x: number, y: number): void {
  const el = getTooltip();
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x + margin;
  let top = y + margin;

  // Keep inside viewport
  if (left + 300 > vw) left = x - 300 - margin;
  if (top + 200 > vh) top = y - 200 - margin;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

export function showNodeTooltip(node: KitFile, x: number, y: number): void {
  const el = getTooltip();
  const desc = node.description
    ? node.description.length > 90
      ? node.description.slice(0, 87) + "…"
      : node.description
    : null;

  el.innerHTML = `
    <div class="tt-name">${esc(node.display_name)}</div>
    ${desc ? `<div class="tt-desc">${esc(desc)}</div>` : ""}
    <div class="tt-meta">
      <span>${esc(node.category)}</span> &middot;
      <span>${esc(node.native_type)}</span> &middot;
      <span>${esc(node.harness)}</span>
    </div>
  `;

  position(x, y);
  el.style.opacity = "1";
}

export function showEdgeTooltip(
  edge: GraphEdge,
  sourceName: string,
  targetName: string,
  x: number,
  y: number
): void {
  const el = getTooltip();
  const isUnresolved = edge.isUnresolved;

  el.innerHTML = `
    <div class="tt-name">${esc(edge.type)}</div>
    <div class="tt-meta">
      <span>${esc(sourceName)}</span> → <span>${esc(targetName)}</span>
    </div>
    ${isUnresolved ? `<div class="tt-desc" style="color:#f87171">unresolved reference — target not found in repo</div>` : ""}
    ${edge.evidence ? `<div class="tt-desc">${esc(edge.evidence.slice(0, 80))}</div>` : ""}
  `;

  position(x, y);
  el.style.opacity = "1";
}

export function hideTooltip(): void {
  const el = getTooltip();
  el.style.opacity = "0";
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
