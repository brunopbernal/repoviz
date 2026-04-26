#!/usr/bin/env node
import { writeFile, access } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import { analyze } from "../engine/analyzer.js";
import { startServer } from "../server/serve.js";
import { writeBundleFile } from "../bundler/bundle.js";

// ── Subcommand detection ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const subcommand = args[0];

if (subcommand === "serve") {
  runServe(args.slice(1)).catch((err: Error & { exitCode?: number }) => {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode ?? 3);
  });
} else if (subcommand === "bundle") {
  runBundle(args.slice(1)).catch((err: Error & { exitCode?: number }) => {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode ?? 3);
  });
} else {
  runAnalyze(args).catch((err: Error) => {
    console.error(`Fatal: ${err.message}`);
    process.exit(3);
  });
}

// ── repoviz serve ────────────────────────────────────────────────────────────

async function runServe(argv: string[]): Promise<void> {
  const opts = parseServeArgs(argv);

  if (opts.help) {
    console.error(`
repoviz serve <graph-file> [options]

Options:
  --port <n>    Bind to a specific port (default: random available port)
  --no-open     Start server but do not open browser
  --quiet       Suppress startup messages; only print URL
  --help        Show this help

Exit codes:
  0  Server stopped normally (Ctrl+C)
  1  <graph-file> not found or not readable
  2  <graph-file> is not valid KitGraph JSON
  3  Internal server error
`.trim());
    process.exit(0);
  }

  if (!opts.graphFile) {
    console.error("Error: <graph-file> is required\nUsage: repoviz serve <graph-file>");
    process.exit(1);
  }

  const graphPath = resolve(opts.graphFile);

  if (!existsSync(graphPath)) {
    console.error(`Error: File not found: ${graphPath}`);
    process.exit(1);
  }

  await startServer(graphPath, opts.port, opts.noOpen, opts.quiet);
}

interface ServeOpts {
  graphFile?: string;
  port: number;
  noOpen: boolean;
  quiet: boolean;
  help: boolean;
}

function parseServeArgs(argv: string[]): ServeOpts {
  const opts: ServeOpts = { port: 0, noOpen: false, quiet: false, help: false };
  let i = 0;
  while (i < argv.length) {
    switch (argv[i]) {
      case "--port":
        opts.port = parseInt(argv[++i] ?? "0", 10);
        break;
      case "--no-open":
        opts.noOpen = true;
        break;
      case "--quiet":
      case "-q":
        opts.quiet = true;
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
      default:
        if (!argv[i]!.startsWith("-")) opts.graphFile = argv[i];
    }
    i++;
  }
  return opts;
}

// ── repoviz bundle ───────────────────────────────────────────────────────────

async function runBundle(argv: string[]): Promise<void> {
  const opts = parseBundleArgs(argv);

  if (opts.help) {
    console.error(`
repoviz bundle <graph-file> [options]

Options:
  --output <file>   Output path for HTML file (default: graph.html)
  --quiet           Suppress output; only errors go to stderr
  --help            Show this help

Exit codes:
  0  Bundle written successfully
  1  <graph-file> not found or not readable
  2  <graph-file> is not valid KitGraph JSON
  3  Cannot write to --output path
`.trim());
    process.exit(0);
  }

  if (!opts.graphFile) {
    console.error("Error: <graph-file> is required\nUsage: repoviz bundle <graph-file> [--output <file>]");
    process.exit(1);
  }

  const graphPath = resolve(opts.graphFile);
  const outputPath = resolve(opts.output ?? "graph.html");

  try {
    writeBundleFile(graphPath, outputPath);
    if (!opts.quiet) {
      process.stderr.write(`Bundle written to ${outputPath}\n`);
    }
    process.exit(0);
  } catch (err) {
    const e = err as Error & { exitCode?: number };
    console.error(`Error: ${e.message}`);
    process.exit(e.exitCode ?? 3);
  }
}

interface BundleOpts {
  graphFile?: string;
  output?: string;
  quiet: boolean;
  help: boolean;
}

function parseBundleArgs(argv: string[]): BundleOpts {
  const opts: BundleOpts = { quiet: false, help: false };
  let i = 0;
  while (i < argv.length) {
    switch (argv[i]) {
      case "--output":
      case "-o":
        opts.output = argv[++i];
        break;
      case "--quiet":
      case "-q":
        opts.quiet = true;
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
      default:
        if (!argv[i]!.startsWith("-")) opts.graphFile = argv[i];
    }
    i++;
  }
  return opts;
}

// ── repoviz analyze ──────────────────────────────────────────────────────────

interface AnalyzeOpts {
  repoPath?: string;
  output?: string;
  harness?: string;
  definitionsDir?: string;
  quiet: boolean;
  help: boolean;
}

function parseAnalyzeArgs(argv: string[]): AnalyzeOpts {
  // Support legacy invocation: repoviz [analyze] <path> [opts]
  const normalised = argv[0] === "analyze" ? argv.slice(1) : argv;
  const opts: AnalyzeOpts = { quiet: false, help: false };
  let i = 0;
  while (i < normalised.length) {
    switch (normalised[i]) {
      case "--output":
      case "-o":
        opts.output = normalised[++i];
        break;
      case "--harness":
        opts.harness = normalised[++i];
        break;
      case "--definitions":
        opts.definitionsDir = normalised[++i];
        break;
      case "--quiet":
      case "-q":
        opts.quiet = true;
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
      default:
        if (!normalised[i]!.startsWith("-")) opts.repoPath = normalised[i];
    }
    i++;
  }
  return opts;
}

function printAnalyzeUsage(): void {
  console.error(`
repoviz <subcommand> [options]

Subcommands:
  analyze <repo-path>    Analyze a kit repository and emit graph.json
  serve   <graph-file>   Serve the graph visualization in the browser
  bundle  <graph-file>   Generate a standalone HTML file

Run repoviz <subcommand> --help for details.
`.trim());
}

async function runAnalyze(argv: string[]): Promise<void> {
  const opts = parseAnalyzeArgs(argv);

  if (opts.help || (!opts.repoPath && argv[0] !== "analyze")) {
    printAnalyzeUsage();
    process.exit(opts.help ? 0 : 1);
  }

  if (!opts.repoPath) {
    console.error("Error: <repo-path> is required");
    printAnalyzeUsage();
    process.exit(1);
  }

  try {
    await access(opts.repoPath);
  } catch {
    console.error(`Error: Path not found or not readable: ${opts.repoPath}`);
    process.exit(1);
  }

  if (!opts.quiet) {
    process.stderr.write(`Analyzing ${opts.repoPath}...\n`);
  }

  let graph;
  try {
    graph = await analyze(opts.repoPath, {
      harness: opts.harness,
      definitionsDir: opts.definitionsDir,
    });
  } catch (err) {
    console.error(`Error: Analysis failed — ${(err as Error).message}`);
    process.exit(3);
  }

  if (graph.summary.total_files_scanned === 0) {
    console.error("Error: No files found to analyze");
    process.exit(2);
  }

  const json = JSON.stringify(graph, null, 2);

  if (opts.output) {
    await writeFile(opts.output, json, "utf-8");
    if (!opts.quiet) {
      process.stderr.write(`Output written to ${opts.output}\n`);
    }
  } else {
    process.stdout.write(json + "\n");
  }

  process.exit(0);
}
