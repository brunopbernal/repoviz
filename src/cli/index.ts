#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import { access } from 'fs/promises';
import { analyze } from '../engine/analyzer.js';

function parseArgs(argv: string[]): {
  repoPath?: string;
  output?: string;
  harness?: string;
  definitionsDir?: string;
  quiet: boolean;
  help: boolean;
} {
  const args = argv.slice(2);
  const opts = { quiet: false, help: false } as ReturnType<typeof parseArgs>;

  if (args[0] === 'analyze') args.shift();

  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '--output':
      case '-o':
        opts.output = args[++i];
        break;
      case '--harness':
        opts.harness = args[++i];
        break;
      case '--definitions':
        opts.definitionsDir = args[++i];
        break;
      case '--quiet':
      case '-q':
        opts.quiet = true;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        if (!args[i].startsWith('-')) {
          opts.repoPath = args[i];
        }
    }
    i++;
  }

  return opts;
}

function printUsage(): void {
  console.error(`
repoviz analyze <repo-path> [options]

Options:
  --output <file>       Write JSON to file instead of stdout
  --harness <id>        Filter to a single harness (e.g. claude-code)
  --definitions <dir>   Custom harness definitions directory
  --quiet               Suppress progress messages
  --help                Show this help

Exit codes:
  0  Success
  1  Path not found or not readable
  2  No files found to analyze
  3  Internal error
`.trim());
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printUsage();
    process.exit(0);
  }

  if (!opts.repoPath) {
    console.error('Error: <repo-path> is required');
    printUsage();
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
    console.error('Error: No files found to analyze');
    process.exit(2);
  }

  const json = JSON.stringify(graph, null, 2);

  if (opts.output) {
    await writeFile(opts.output, json, 'utf-8');
    if (!opts.quiet) {
      process.stderr.write(`Output written to ${opts.output}\n`);
    }
  } else {
    process.stdout.write(json + '\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`Fatal: ${(err as Error).message}`);
  process.exit(3);
});
