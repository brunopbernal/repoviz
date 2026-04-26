# repoviz

> Static analysis engine for AI kit repositories.

**repoviz** analyzes "kit" repositories — Claude Code workspaces, GitHub Copilot projects, Cursor setups, and more — and extracts a structured `KitGraph` JSON document showing how all files relate to each other: agents, skills, hooks, context files, and their cross-file relationships.

## Supported Harnesses

| Harness | Detection | Primitives |
|---------|-----------|------------|
| Claude Code | `.claude/`, `CLAUDE.md` | agents, skills, hooks, context, config |
| GitHub Copilot | `.github/copilot-instructions.md` | instructions |
| Codex CLI | `AGENTS.md`, `.codex/` | agents, config |
| Gemini CLI | `.gemini/`, `GEMINI.md` | commands, context, config |
| Cursor | `.cursor/rules/`, `.cursorrules` | rules |
| Windsurf | `.windsurf/`, `.windsurfrules` | workflows, rules |

Multi-harness repos are supported — each node carries a `harness` attribute for filtering.

## Installation

```bash
npm install -g repoviz
```

Or use without installing:

```bash
npx repoviz analyze <repo-path>
```

## Usage

### Analyze

```bash
# Analyze a repo and print KitGraph JSON to stdout
repoviz analyze ./my-claude-workspace

# Save graph to a file
repoviz analyze ./my-repo --output graph.json

# Analyze only the Claude Code harness
repoviz analyze ./my-repo --harness claude-code

# Use a custom harness definitions directory
repoviz analyze ./my-repo --definitions ./my-definitions/

# Suppress progress messages
repoviz analyze ./my-repo --quiet
```

### Visualize

After generating a `graph.json`, open it in an interactive browser visualization:

```bash
# Open in the browser (starts a local server)
repoviz serve graph.json

# Serve on a specific port without auto-opening
repoviz serve graph.json --port 4000 --no-open

# Generate a standalone HTML file (no server required)
repoviz bundle graph.json --output my-workspace-viz.html

# Full pipeline: analyze then visualize
repoviz analyze ./my-workspace --output graph.json
repoviz serve graph.json
```

#### `repoviz serve` options

| Option | Default | Description |
|--------|---------|-------------|
| `--port <n>` | random | Bind to a specific port |
| `--no-open` | false | Start server without opening browser |
| `--quiet` | false | Only print the server URL, suppress other output |

**Exit codes**: `0` clean stop, `1` file not found, `2` invalid JSON, `3` server error

#### `repoviz bundle` options

| Option | Default | Description |
|--------|---------|-------------|
| `--output <file>` | `graph.html` | Output path for the HTML file |
| `--quiet` | false | Suppress output; only errors go to stderr |

**Exit codes**: `0` success, `1` file not found, `2` invalid JSON, `3` write error

The generated HTML file works offline — open it directly from your filesystem with `file://`. All assets (D3.js, app code, graph data) are inlined. The visualization includes:

- **Force-directed graph** — nodes attract and repel naturally; drag to reposition
- **Visual encoding** — each node category has a unique color + icon; each edge type has a unique color + line style
- **Tooltip** — hover any node or edge for quick details
- **Sidebar** — click a node for full metadata and relationship list
- **Filters** — filter by harness or category; text search by node name
- **Legend** — always-visible legend explaining all visual encodings

## Output Format

The output is a `KitGraph` JSON document:

```json
{
  "summary": {
    "repo_path": "/path/to/repo",
    "detected_harnesses": ["claude-code"],
    "total_files_scanned": 42,
    "classified_files": 10,
    "unclassified_files": 32,
    "relationship_count": 8,
    "analysis_time_ms": 145
  },
  "harnesses": {
    "claude-code": ["CLAUDE.md", ".claude_agents_researcher.md", "..."]
  },
  "nodes": [
    {
      "id": "CLAUDE.md",
      "path": "CLAUDE.md",
      "category": "context",
      "native_type": "context",
      "harness": "claude-code",
      "display_name": "My Workspace",
      "description": "Root context file",
      "metadata": {}
    }
  ],
  "edges": [
    {
      "id": "rel_000001",
      "source": ".claude_agents_researcher.md",
      "target": "CLAUDE.md",
      "type": "references",
      "evidence": "`CLAUDE.md`"
    }
  ]
}
```

### Node categories

| Category | Description |
|----------|-------------|
| `agent` | Autonomous subagent |
| `command` | Invokable skill or command |
| `hook` | Event-driven automation |
| `context` | Context/instruction document |
| `template` | Template for generation |
| `config` | Configuration file |
| `unclassified` | Not matched by any harness |

### Edge types

| Type | Description |
|------|-------------|
| `reads` | Source reads target file |
| `executes` | Source invokes target |
| `creates` | Source creates target |
| `edits` | Source edits target |
| `references` | Source mentions target |
| `unresolved` | Target path not found in repo |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Path not found or not readable |
| `2` | No files found to analyze |
| `3` | Internal error |

## Adding a Custom Harness

Create a YAML file in the `definitions/` directory (or pass `--definitions <dir>`):

```yaml
id: my-harness
name: My AI Tool
version: "1.0.0"

detection_signals:
  - path: .my-tool
    required: true

primitive_mappings:
  - native_type: rule
    category: context
    glob: ".my-tool/rules/**/*.md"
    description: My tool rule files

relationship_patterns:
  - type: references
    pattern: "`([\\w\\-./]+\\.md)`"
    description: Markdown inline code reference
```

No core code change required — the engine loads all `.yml` files from the definitions directory automatically.

## Development

```bash
npm install

# Build CLI + engine
npm run build

# Build browser viewer bundle (required for serve/bundle commands)
npm run build:viewer

# Build everything
npm run build:all

# Run tests
npm test
```

## Built with

- [GitHub Spec Kit](https://github.com/github/spec-kit) — Spec-Driven Development workflow
- [Claude Code](https://claude.ai/code) — AI coding assistant

## License

MIT
