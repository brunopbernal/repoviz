export type KitFileCategory =
  | "agent"
  | "command"
  | "hook"
  | "context"
  | "config"
  | "template"
  | "unclassified";

export type RelationshipType =
  | "reads"
  | "executes"
  | "creates"
  | "edits"
  | "references"
  | "unresolved";

export interface CategoryVisual {
  category: KitFileCategory;
  color: string;
  iconPath: string;
  label: string;
}

export interface EdgeVisual {
  type: RelationshipType;
  color: string;
  dashArray: string;
  markerType: "arrow" | "filledArrow" | "diamond" | "bidirectional";
  animationDuration: number;
  label: string;
}

export const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    category: "agent",
    color: "#60a5fa",
    iconPath:
      "M0,-8 C-4,-8 -7,-5 -7,-1 C-7,3 -4,6 0,6 C4,6 7,3 7,-1 C7,-5 4,-8 0,-8 Z M-9,10 C-9,6 -5,4 0,4 C5,4 9,6 9,10",
    label: "Agent",
  },
  {
    category: "command",
    color: "#34d399",
    iconPath: "M-8,-4 L-2,0 L-8,4 M-1,4 L7,4",
    label: "Command / Skill",
  },
  {
    category: "hook",
    color: "#fbbf24",
    iconPath: "M0,-9 L3,0 L-5,0 L-2,9 M-5,-3 L5,-3",
    label: "Hook",
  },
  {
    category: "context",
    color: "#a78bfa",
    iconPath:
      "M-7,-9 L7,-9 L7,9 L-7,9 Z M-4,-4 L4,-4 M-4,0 L4,0 M-4,4 L1,4",
    label: "Context",
  },
  {
    category: "config",
    color: "#f87171",
    iconPath:
      "M0,-9 C1,-9 2,-8 2,-7 L2,-5 C3,-4 4,-3 5,-2 L7,-2 C8,-2 9,-1 9,0 C9,1 8,2 7,2 L5,2 C4,3 3,4 2,5 L2,7 C2,8 1,9 0,9 C-1,9 -2,8 -2,7 L-2,5 C-3,4 -4,3 -5,2 L-7,2 C-8,2 -9,1 -9,0 C-9,-1 -8,-2 -7,-2 L-5,-2 C-4,-3 -3,-4 -2,-5 L-2,-7 C-2,-8 -1,-9 0,-9 Z M0,-3 C1.7,-3 3,-1.7 3,0 C3,1.7 1.7,3 0,3 C-1.7,3 -3,1.7 -3,0 C-3,-1.7 -1.7,-3 0,-3 Z",
    label: "Config",
  },
  {
    category: "template",
    color: "#38bdf8",
    iconPath:
      "M-8,-9 L8,-9 L8,9 L-8,9 Z M-8,-3 L8,-3 M-8,3 L8,3 M-2,-9 L-2,9",
    label: "Template",
  },
  {
    category: "unclassified",
    color: "#6b7280",
    iconPath:
      "M-3,-7 C-3,-9 -1,-10 0,-10 C2,-10 4,-9 4,-6 C4,-4 2,-3 0,-1 L0,1 M0,4 L0,6",
    label: "Unclassified",
  },
];

export const EDGE_VISUALS: EdgeVisual[] = [
  {
    type: "reads",
    color: "#60a5fa",
    dashArray: "6 3",
    markerType: "arrow",
    animationDuration: 800,
    label: "reads",
  },
  {
    type: "executes",
    color: "#34d399",
    dashArray: "none",
    markerType: "filledArrow",
    animationDuration: 600,
    label: "executes",
  },
  {
    type: "creates",
    color: "#fbbf24",
    dashArray: "2 3",
    markerType: "diamond",
    animationDuration: 1000,
    label: "creates",
  },
  {
    type: "edits",
    color: "#f87171",
    dashArray: "none",
    markerType: "bidirectional",
    animationDuration: 700,
    label: "edits",
  },
  {
    type: "references",
    color: "#a78bfa",
    dashArray: "12 4",
    markerType: "arrow",
    animationDuration: 1200,
    label: "references",
  },
  {
    type: "unresolved",
    color: "#6b7280",
    dashArray: "4 4",
    markerType: "arrow",
    animationDuration: 1500,
    label: "unresolved",
  },
];

export function getCategoryVisual(category: string): CategoryVisual {
  return (
    CATEGORY_VISUALS.find((v) => v.category === category) ??
    CATEGORY_VISUALS[CATEGORY_VISUALS.length - 1]
  );
}

export function getEdgeVisual(type: string): EdgeVisual {
  return (
    EDGE_VISUALS.find((v) => v.type === type) ??
    EDGE_VISUALS[EDGE_VISUALS.length - 1]
  );
}
