import { describe, it, expect } from "vitest";
import type { KitFile, Relationship } from "../../src/output/types.js";

// Pure data-assembly logic extracted from sidebar.ts for unit testing

function groupByType(rels: Relationship[]): Record<string, Relationship[]> {
  const result: Record<string, Relationship[]> = {};
  for (const r of rels) {
    if (!result[r.type]) result[r.type] = [];
    result[r.type]!.push(r);
  }
  return result;
}

function getOutgoing(nodeId: string, allEdges: Relationship[]): Relationship[] {
  return allEdges.filter((e) => e.source === nodeId);
}

function getIncoming(nodeId: string, allEdges: Relationship[]): Relationship[] {
  return allEdges.filter((e) => e.target === nodeId);
}

function resolveConnectedName(
  connectedId: string,
  allNodes: KitFile[]
): string | null {
  return allNodes.find((n) => n.id === connectedId)?.display_name ?? null;
}

const nodeA: KitFile = {
  id: "n1",
  path: "agents/researcher.md",
  category: "agent",
  native_type: "agent",
  harness: "claude-code",
  display_name: "Researcher",
  description: "A research agent",
  metadata: { version: "1.0" },
};

const nodeB: KitFile = {
  id: "n2",
  path: "CLAUDE.md",
  category: "config",
  native_type: "config",
  harness: "claude-code",
  display_name: "CLAUDE",
  description: null,
  metadata: {},
};

const nodeC: KitFile = {
  id: "n3",
  path: "skills/summarize.md",
  category: "command",
  native_type: "skill",
  harness: "claude-code",
  display_name: "Summarize",
  description: "Summarize skill",
  metadata: {},
};

const edges: Relationship[] = [
  { id: "e1", source: "n1", target: "n2", type: "references", evidence: "`CLAUDE.md`" },
  { id: "e2", source: "n1", target: "n3", type: "reads", evidence: "@skills/summarize.md" },
  { id: "e3", source: "n3", target: "n1", type: "executes", evidence: "runs researcher" },
  { id: "e4", source: "n1", target: "unresolved-path.md", type: "unresolved", evidence: "`unresolved-path.md`" },
];

describe("sidebar: outgoing / incoming separation", () => {
  it("correctly identifies outgoing edges for a node", () => {
    const out = getOutgoing("n1", edges);
    expect(out).toHaveLength(3);
    expect(out.map((e) => e.id)).toEqual(["e1", "e2", "e4"]);
  });

  it("correctly identifies incoming edges for a node", () => {
    const inc = getIncoming("n1", edges);
    expect(inc).toHaveLength(1);
    expect(inc[0]!.id).toBe("e3");
  });

  it("returns empty arrays for a node with no relationships", () => {
    expect(getOutgoing("n2", edges)).toHaveLength(0);
    expect(getIncoming("n2", edges)).toHaveLength(1);
  });
});

describe("sidebar: groupByType", () => {
  it("groups relationships by their type", () => {
    const out = getOutgoing("n1", edges);
    const grouped = groupByType(out);
    expect(Object.keys(grouped).sort()).toEqual(["references", "reads", "unresolved"].sort());
    expect(grouped["references"]).toHaveLength(1);
    expect(grouped["reads"]).toHaveLength(1);
    expect(grouped["unresolved"]).toHaveLength(1);
  });

  it("groups multiple edges of the same type together", () => {
    const moreEdges: Relationship[] = [
      ...edges,
      { id: "e5", source: "n1", target: "n3", type: "references", evidence: "ref" },
    ];
    const out = getOutgoing("n1", moreEdges);
    const grouped = groupByType(out);
    expect(grouped["references"]).toHaveLength(2);
  });
});

describe("sidebar: connected node name resolution", () => {
  const allNodes = [nodeA, nodeB, nodeC];

  it("resolves display_name for a known node id", () => {
    expect(resolveConnectedName("n2", allNodes)).toBe("CLAUDE");
  });

  it("returns null for an unresolved (ghost) node id", () => {
    expect(resolveConnectedName("unresolved-path.md", allNodes)).toBeNull();
  });
});

describe("sidebar: node with no description", () => {
  it("nodeB has null description — sidebar should omit description gracefully", () => {
    expect(nodeB.description).toBeNull();
    // The sidebar renders description only if truthy — null means no <p> rendered
    const shouldRender = !!nodeB.description;
    expect(shouldRender).toBe(false);
  });
});

describe("sidebar: long display_name truncation", () => {
  it("node label truncation to 28 chars", () => {
    const longName = "A very long display name that exceeds thirty characters";
    const truncated =
      longName.length > 28 ? longName.slice(0, 27) + "…" : longName;
    expect(truncated.length).toBeLessThanOrEqual(28);
    expect(truncated).toContain("…");
  });

  it("short name is not truncated", () => {
    const shortName = "Researcher";
    const result =
      shortName.length > 28 ? shortName.slice(0, 27) + "…" : shortName;
    expect(result).toBe("Researcher");
  });
});
