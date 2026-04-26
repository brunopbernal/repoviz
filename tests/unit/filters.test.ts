import { describe, it, expect } from "vitest";

// Pure filter logic — imported directly (no DOM dependency)
type KitFileCategory = "agent" | "command" | "hook" | "context" | "config" | "template" | "unclassified";

interface MockNode {
  id: string;
  harness: string;
  category: KitFileCategory;
  display_name: string;
}

interface MockEdge {
  source: string | MockNode;
  target: string | MockNode;
}

interface FilterState {
  activeHarnesses: string[];
  activeCategories: string[];
  searchQuery: string;
}

function computeVisibleNodeIds(nodes: MockNode[], state: FilterState): Set<string> {
  return new Set(
    nodes
      .filter(n => state.activeHarnesses.length === 0 || state.activeHarnesses.includes(n.harness))
      .filter(n => state.activeCategories.length === 0 || state.activeCategories.includes(n.category))
      .filter(n => state.searchQuery === "" || n.display_name.toLowerCase().includes(state.searchQuery.toLowerCase()))
      .map(n => n.id)
  );
}

function computeEdgeVisible(edge: MockEdge, visibleIds: Set<string>): boolean {
  const srcId = typeof edge.source === "string" ? edge.source : edge.source.id;
  const tgtId = typeof edge.target === "string" ? edge.target : edge.target.id;
  return visibleIds.has(srcId) || visibleIds.has(tgtId);
}

const nodes: MockNode[] = [
  { id: "n1", harness: "claude-code", category: "agent", display_name: "Researcher" },
  { id: "n2", harness: "claude-code", category: "command", display_name: "Summarize" },
  { id: "n3", harness: "github-copilot", category: "agent", display_name: "Coder Agent" },
  { id: "n4", harness: "github-copilot", category: "config", display_name: "Copilot Config" },
  { id: "n5", harness: "claude-code", category: "hook", display_name: "Pre-commit Hook" },
];

const emptyFilter: FilterState = { activeHarnesses: [], activeCategories: [], searchQuery: "" };

describe("computeVisibleNodeIds", () => {
  it("returns all node ids when filter is empty", () => {
    const ids = computeVisibleNodeIds(nodes, emptyFilter);
    expect(ids.size).toBe(5);
    expect(ids).toContain("n1");
    expect(ids).toContain("n5");
  });

  it("filters by single harness", () => {
    const ids = computeVisibleNodeIds(nodes, { ...emptyFilter, activeHarnesses: ["claude-code"] });
    expect(ids.size).toBe(3);
    expect(ids).toContain("n1");
    expect(ids).toContain("n2");
    expect(ids).toContain("n5");
    expect(ids).not.toContain("n3");
    expect(ids).not.toContain("n4");
  });

  it("filters by single category", () => {
    const ids = computeVisibleNodeIds(nodes, { ...emptyFilter, activeCategories: ["agent"] });
    expect(ids.size).toBe(2);
    expect(ids).toContain("n1");
    expect(ids).toContain("n3");
  });

  it("applies case-insensitive substring search on display_name", () => {
    const ids = computeVisibleNodeIds(nodes, { ...emptyFilter, searchQuery: "RESEARCHER" });
    expect(ids.size).toBe(1);
    expect(ids).toContain("n1");
  });

  it("search matches partial display_name", () => {
    const ids = computeVisibleNodeIds(nodes, { ...emptyFilter, searchQuery: "commit" });
    expect(ids.size).toBe(1);
    expect(ids).toContain("n5");
  });

  it("returns empty set when no nodes match harness filter", () => {
    const ids = computeVisibleNodeIds(nodes, { ...emptyFilter, activeHarnesses: ["cursor"] });
    expect(ids.size).toBe(0);
  });

  it("applies combined harness + category intersection", () => {
    const ids = computeVisibleNodeIds(nodes, {
      activeHarnesses: ["github-copilot"],
      activeCategories: ["agent"],
      searchQuery: "",
    });
    expect(ids.size).toBe(1);
    expect(ids).toContain("n3");
  });

  it("applies combined harness + category + search intersection", () => {
    const ids = computeVisibleNodeIds(nodes, {
      activeHarnesses: ["claude-code"],
      activeCategories: ["agent"],
      searchQuery: "res",
    });
    expect(ids.size).toBe(1);
    expect(ids).toContain("n1");
  });

  it("returns empty set when combined filters produce no intersection", () => {
    const ids = computeVisibleNodeIds(nodes, {
      activeHarnesses: ["claude-code"],
      activeCategories: ["config"],
      searchQuery: "",
    });
    expect(ids.size).toBe(0);
  });
});

describe("computeEdgeVisible", () => {
  it("visible when source is in visibleIds", () => {
    const visible = new Set(["n1"]);
    expect(computeEdgeVisible({ source: "n1", target: "n3" }, visible)).toBe(true);
  });

  it("visible when target is in visibleIds", () => {
    const visible = new Set(["n3"]);
    expect(computeEdgeVisible({ source: "n1", target: "n3" }, visible)).toBe(true);
  });

  it("faded when both endpoints are absent from visibleIds", () => {
    const visible = new Set(["n5"]);
    expect(computeEdgeVisible({ source: "n1", target: "n3" }, visible)).toBe(false);
  });

  it("works with node object references (D3 resolved)", () => {
    const visible = new Set(["n1"]);
    const sourceNode: MockNode = { id: "n1", harness: "claude-code", category: "agent", display_name: "Researcher" };
    expect(computeEdgeVisible({ source: sourceNode, target: "n3" }, visible)).toBe(true);
  });

  it("faded when visibleIds is empty", () => {
    const visible = new Set<string>();
    expect(computeEdgeVisible({ source: "n1", target: "n2" }, visible)).toBe(false);
  });
});
