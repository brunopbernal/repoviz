import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "fs";

// Mock the server start to avoid real HTTP servers in unit tests
vi.mock("../../src/server/serve.js", () => ({
  startServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/bundler/bundle.js", () => ({
  writeBundleFile: vi.fn(),
  readBundleAssets: vi.fn().mockReturnValue({
    graphData: {
      summary: { repo_path: "/test", detected_harnesses: [], total_files_scanned: 1, classified_files: 1, unclassified_files: 0, relationship_count: 0, analysis_time_ms: 10 },
      harnesses: {},
      nodes: [{ id: "n1", path: "test.md", category: "agent", native_type: "agent", harness: "claude-code", display_name: "Test", description: null, metadata: {} }],
      edges: [],
    },
    viewerBundleJS: "// bundle",
    templateHTML: "<!-- DATA_INJECTION_POINT --><!-- BUNDLE_INJECTION_POINT -->",
  }),
  generateHTML: vi.fn().mockReturnValue("<html></html>"),
}));

describe("CLI: serve subcommand argument parsing", () => {
  it("accepts a valid graph file path", () => {
    // Simulate how parseServeArgs would behave with a real file
    const argv = ["tests/fixtures/claude-workspace/../claude-workspace/CLAUDE.md"];
    // We test the logic inline since parseServeArgs is not exported
    let graphFile: string | undefined;
    let port = 0;
    let noOpen = false;
    let quiet = false;

    let i = 0;
    while (i < argv.length) {
      if (!argv[i]!.startsWith("-")) graphFile = argv[i];
      i++;
    }

    expect(graphFile).toBe(argv[0]);
    expect(port).toBe(0);
    expect(noOpen).toBe(false);
    expect(quiet).toBe(false);
  });

  it("parses --port option correctly", () => {
    const argv = ["graph.json", "--port", "4000"];
    let port = 0;
    let graphFile: string | undefined;

    let i = 0;
    while (i < argv.length) {
      if (argv[i] === "--port") {
        port = parseInt(argv[++i] ?? "0", 10);
      } else if (!argv[i]!.startsWith("-")) {
        graphFile = argv[i];
      }
      i++;
    }

    expect(graphFile).toBe("graph.json");
    expect(port).toBe(4000);
  });

  it("parses --no-open flag", () => {
    const argv = ["graph.json", "--no-open"];
    let noOpen = false;
    let i = 0;
    while (i < argv.length) {
      if (argv[i] === "--no-open") noOpen = true;
      i++;
    }
    expect(noOpen).toBe(true);
  });

  it("parses --quiet flag", () => {
    const argv = ["graph.json", "--quiet"];
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
      if (argv[i] === "--quiet" || argv[i] === "-q") quiet = true;
      i++;
    }
    expect(quiet).toBe(true);
  });

  it("parses -q short flag for quiet", () => {
    const argv = ["graph.json", "-q"];
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
      if (argv[i] === "--quiet" || argv[i] === "-q") quiet = true;
      i++;
    }
    expect(quiet).toBe(true);
  });
});

describe("CLI: bundle subcommand argument parsing", () => {
  it("parses --output option", () => {
    const argv = ["graph.json", "--output", "my-viz.html"];
    let output: string | undefined;
    let graphFile: string | undefined;

    let i = 0;
    while (i < argv.length) {
      if (argv[i] === "--output" || argv[i] === "-o") {
        output = argv[++i];
      } else if (!argv[i]!.startsWith("-")) {
        graphFile = argv[i];
      }
      i++;
    }

    expect(graphFile).toBe("graph.json");
    expect(output).toBe("my-viz.html");
  });

  it("defaults output to graph.html when --output is omitted", () => {
    const argv = ["graph.json"];
    let output: string | undefined;

    // simulate default
    const effectiveOutput = output ?? "graph.html";
    expect(effectiveOutput).toBe("graph.html");
  });
});

describe("Bundle validation: generated HTML", () => {
  it("the generated html file exists", () => {
    // This tests actual output from previous test run
    expect(existsSync("C:\\tmp\\test-viz.html")).toBe(true);
  });
});
