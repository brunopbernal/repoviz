import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import type { KitGraph } from "../../src/output/types.js";

const FIXTURE = resolve("tests/fixtures/claude-workspace");
const OUTPUT = resolve("tests/fixtures/test-bundle-output.html");
const GRAPH_JSON = resolve("tests/fixtures/test-graph.json");

function cleanup(): void {
  if (existsSync(OUTPUT)) unlinkSync(OUTPUT);
  if (existsSync(GRAPH_JSON)) unlinkSync(GRAPH_JSON);
}

describe("repoviz bundle: end-to-end integration", () => {
  it("generates a valid graph.json from fixture, then bundles to HTML", () => {
    cleanup();

    // Step 1: analyze
    execSync(`node dist/cli/index.js analyze "${FIXTURE}" --output "${GRAPH_JSON}" --quiet`, {
      stdio: "pipe",
    });

    expect(existsSync(GRAPH_JSON)).toBe(true);

    const graph = JSON.parse(readFileSync(GRAPH_JSON, "utf8")) as KitGraph;
    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
    expect(graph.nodes.length).toBeLessThanOrEqual(10);

    // Step 2: bundle
    const result = execSync(
      `node dist/cli/index.js bundle "${GRAPH_JSON}" --output "${OUTPUT}"`,
      { stdio: "pipe" }
    );
    void result;

    expect(existsSync(OUTPUT)).toBe(true);

    const html = readFileSync(OUTPUT, "utf8");

    // Must contain inlined data
    expect(html).toContain("window.__REPOVIZ_DATA__");

    // Must contain the node count matching the fixture
    const match = html.match(/window\.__REPOVIZ_DATA__ = ({[\s\S]*?});\s*<\/script>/);
    expect(match).toBeTruthy();
    const embedded = JSON.parse(match![1]!) as KitGraph;
    expect(embedded.nodes.length).toBe(graph.nodes.length);

    // Must be self-contained — no external script src or cdn link
    expect(html).not.toMatch(/<script\s+src=/i);
    expect(html).not.toMatch(/<link[^>]+href="https?:/i);

    cleanup();
  });

  it("exits with code 1 when graph file not found", () => {
    let exitCode = 0;
    try {
      execSync(`node dist/cli/index.js bundle nonexistent-file.json --output /tmp/x.html`, {
        stdio: "pipe",
      });
    } catch (err) {
      exitCode = (err as { status: number }).status;
    }
    expect(exitCode).toBe(1);
  });

  it("exits with code 2 when graph file is not valid KitGraph JSON", () => {
    const badPath = resolve("tests/fixtures/bad-graph.json");
    try {
      require("fs").writeFileSync(badPath, '{"invalid": true}');
      let exitCode = 0;
      try {
        execSync(`node dist/cli/index.js bundle "${badPath}" --output /tmp/x.html`, {
          stdio: "pipe",
        });
      } catch (err) {
        exitCode = (err as { status: number }).status;
      }
      expect(exitCode).toBe(2);
    } finally {
      if (existsSync(badPath)) unlinkSync(badPath);
    }
  });
});
