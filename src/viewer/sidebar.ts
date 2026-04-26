import type { KitFile, Relationship, RelationshipType } from "../output/types.js";
import { getEdgeVisual } from "./theme.js";

let sidebarEl: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;

function getEls(): { sidebar: HTMLElement; content: HTMLElement } {
  if (!sidebarEl) sidebarEl = document.getElementById("sidebar");
  if (!contentEl) contentEl = document.getElementById("sidebar-content");
  return { sidebar: sidebarEl!, content: contentEl! };
}

export function showNode(
  node: KitFile,
  allEdges: Relationship[],
  allNodes: KitFile[]
): void {
  const { sidebar, content } = getEls();

  const outgoing = allEdges.filter((e) => e.source === node.id);
  const incoming = allEdges.filter((e) => e.target === node.id);

  content.innerHTML = `
    <h2>${esc(node.display_name)}</h2>
    <table class="meta-table">
      <tr><td>Category</td><td><span class="meta-badge">${esc(node.category)}</span></td></tr>
      <tr><td>Type</td><td>${esc(node.native_type)}</td></tr>
      <tr><td>Harness</td><td>${esc(node.harness)}</td></tr>
      <tr><td>Path</td><td style="word-break:break-all;font-size:11px">${esc(node.path)}</td></tr>
      ${Object.entries(node.metadata ?? {})
        .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(String(v))}</td></tr>`)
        .join("")}
    </table>
    ${node.description ? `<p id="sidebar-description">${esc(node.description)}</p>` : ""}
    <hr class="divider" />
    ${renderRelSection("Outgoing", outgoing, allNodes, true)}
    ${incoming.length > 0 ? renderRelSection("Incoming", incoming, allNodes, false) : ""}
  `;

  sidebar.classList.add("open");
}

export function closeSidebar(): void {
  const { sidebar } = getEls();
  sidebar.classList.remove("open");
}

function renderRelSection(
  title: string,
  rels: Relationship[],
  allNodes: KitFile[],
  isOutgoing: boolean
): string {
  if (rels.length === 0) return "";

  const byType = groupByType(rels);
  const rows = Object.entries(byType)
    .map(([type, group]) => {
      const visual = getEdgeVisual(type);
      const items = group
        .map((r) => {
          const connectedId = isOutgoing ? r.target : r.source;
          const connectedNode = allNodes.find((n) => n.id === connectedId);
          const name = connectedNode?.display_name ?? connectedId;
          const isResolved = !!connectedNode;

          return `
          <div class="rel-item">
            ${
              isResolved
                ? `<button class="navigate-btn" data-node-id="${esc(connectedId)}">${esc(name)}</button>`
                : `<span style="color:var(--text-muted)">${esc(name)}</span>`
            }
            <span class="rel-evidence" title="${esc(r.evidence)}">${esc(r.evidence.slice(0, 40))}${r.evidence.length > 40 ? "…" : ""}</span>
          </div>
        `;
        })
        .join("");

      return `
        <div class="rel-type-group">
          <span class="rel-type-label" style="background:${visual.color}20;color:${visual.color}">${esc(type)}</span>
          ${items}
        </div>
      `;
    })
    .join("");

  return `
    <div class="rel-section">
      <h4>${title}</h4>
      ${rows}
    </div>
  `;
}

function groupByType(rels: Relationship[]): Record<string, Relationship[]> {
  const result: Record<string, Relationship[]> = {};
  for (const r of rels) {
    if (!result[r.type]) result[r.type] = [];
    result[r.type]!.push(r);
  }
  return result;
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Silence unused import
const _: RelationshipType = "reads";
void _;
