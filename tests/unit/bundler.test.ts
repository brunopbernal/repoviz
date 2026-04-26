import { describe, it, expect } from "vitest";
import { generateHTML } from "../../src/bundler/bundle.js";
import type { KitGraph } from "../../src/output/types.js";

const minimalGraph: KitGraph = {
  summary: {
    repo_path: "/test/repo",
    detected_harnesses: ["claude-code"],
    total_files_scanned: 1,
    classified_files: 1,
    unclassified_files: 0,
    relationship_count: 0,
    analysis_time_ms: 10,
  },
  harnesses: { "claude-code": ["n1"] },
  nodes: [
    {
      id: "n1",
      path: "CLAUDE.md",
      category: "config",
      native_type: "config",
      harness: "claude-code",
      display_name: "CLAUDE",
      description: "Main config",
      metadata: {},
    },
  ],
  edges: [],
};

const TEMPLATE = `<!DOCTYPE html>
<html>
<head><title>repoviz</title></head>
<body>
<!-- DATA_INJECTION_POINT -->
<!-- BUNDLE_INJECTION_POINT -->
</body>
</html>`;

const VIEWER_JS = `(function(){console.log("viewer loaded")})();`;

describe("generateHTML", () => {
  it("inlines graph data as window.__REPOVIZ_DATA__", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).toContain("window.__REPOVIZ_DATA__");
    expect(html).toContain('"repo_path":"/test/repo"');
  });

  it("inlines viewer JS in a <script> block", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).toContain(VIEWER_JS);
    expect(html).toContain("<script>");
  });

  it("produces no external <script src=> references", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).not.toMatch(/<script\s+src=/i);
  });

  it("produces no external <link href=> references", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).not.toMatch(/<link[^>]+href="https?:/i);
  });

  it("replaces both injection points", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).not.toContain("<!-- DATA_INJECTION_POINT -->");
    expect(html).not.toContain("<!-- BUNDLE_INJECTION_POINT -->");
  });

  it("embeds all node data", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    expect(html).toContain('"display_name":"CLAUDE"');
    expect(html).toContain('"category":"config"');
  });

  it("the graph data is valid JSON when extracted", () => {
    const html = generateHTML(minimalGraph, VIEWER_JS, TEMPLATE);
    const match = html.match(/window\.__REPOVIZ_DATA__ = ({.*?});/s);
    expect(match).toBeTruthy();
    const parsed = JSON.parse(match![1]!) as KitGraph;
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0]!.display_name).toBe("CLAUDE");
  });
});
