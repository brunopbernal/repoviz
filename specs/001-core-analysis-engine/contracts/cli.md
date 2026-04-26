# CLI Contract: repoviz analyze

**Contract type**: Command-line interface
**Feature**: `001-core-analysis-engine`

---

## Command

```
repoviz analyze <repo-path> [options]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `<repo-path>` | Yes | Path to the local repository to analyze |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output <file>` | stdout | Write Kit Graph JSON to a file instead of stdout |
| `--harness <id>` | all | Filter analysis to a single harness (e.g., `claude-code`) |
| `--format json` | json | Output format (json is the only format in v1) |
| `--definitions <dir>` | bundled | Path to a custom harness definitions directory |
| `--quiet` | false | Suppress progress output; only emit the graph JSON |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Analysis completed successfully |
| `1` | Input path does not exist or is not readable |
| `2` | No files found to analyze (empty or binary-only repo) |
| `3` | Internal analysis error (details in stderr) |

## Stdin / Stdout / Stderr

- **stdout**: Kit Graph JSON (or empty if `--output` used)
- **stderr**: Progress messages, warnings, errors
- **stdin**: Not used

## Examples

```bash
# Analyze a repo and print graph to stdout
repoviz analyze ./my-claude-workspace

# Save graph to file
repoviz analyze ./my-claude-workspace --output graph.json

# Analyze only the Claude Code harness in a multi-harness repo
repoviz analyze ./my-repo --harness claude-code

# Use a custom definitions directory
repoviz analyze ./my-repo --definitions ./my-definitions/
```
