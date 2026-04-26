import { CATEGORY_VISUALS, EDGE_VISUALS } from "./theme.js";

export function initLegend(): void {
  const container = document.getElementById("legend");
  if (!container) return;

  const nodeSection = document.createElement("div");
  nodeSection.innerHTML = "<div style='font-weight:600;color:var(--text-muted);margin-bottom:4px;font-size:10px;text-transform:uppercase'>Nodes</div>";

  for (const cv of CATEGORY_VISUALS) {
    const row = document.createElement("div");
    row.className = "legend-row";
    row.innerHTML = `
      <svg width="14" height="14" style="flex-shrink:0">
        <circle cx="7" cy="7" r="7" fill="${cv.color}" />
      </svg>
      <span>${esc(cv.label)}</span>
    `;
    nodeSection.appendChild(row);
  }

  const edgeSection = document.createElement("div");
  edgeSection.style.marginTop = "10px";
  edgeSection.innerHTML = "<div style='font-weight:600;color:var(--text-muted);margin-bottom:4px;font-size:10px;text-transform:uppercase'>Edges</div>";

  for (const ev of EDGE_VISUALS) {
    const row = document.createElement("div");
    row.className = "legend-row";

    const dash = ev.dashArray === "none" ? "" : `stroke-dasharray="${ev.dashArray}"`;
    row.innerHTML = `
      <svg width="24" height="4" style="flex-shrink:0;overflow:visible">
        <line x1="0" y1="2" x2="24" y2="2"
          stroke="${ev.color}" stroke-width="2"
          ${dash}
        />
      </svg>
      <span>${esc(ev.label)}</span>
    `;
    edgeSection.appendChild(row);
  }

  container.appendChild(nodeSection);
  container.appendChild(edgeSection);
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
