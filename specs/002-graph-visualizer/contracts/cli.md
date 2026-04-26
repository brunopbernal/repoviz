# CLI Contract: repoviz serve / bundle

**Contract type**: Command-line interface extension
**Feature**: `002-graph-visualizer`
**Extends**: `specs/001-core-analysis-engine/contracts/cli.md`

---

## Commands

### repoviz serve

```
repoviz serve <graph-file> [options]
```

Opens the interactive graph visualization in the default browser by starting a minimal local HTTP server.

| Argument | Required | Description |
|----------|----------|-------------|
| `<graph-file>` | Yes | Path to a `KitGraph` JSON file (output of `repoviz analyze`) |

| Option | Default | Description |
|--------|---------|-------------|
| `--port <n>` | random | Bind to a specific port instead of a random available port |
| `--no-open` | false | Start server but do not auto-open browser |
| `--quiet` | false | Suppress startup messages; only print the server URL |

**Behavior**:
1. Validates `<graph-file>` exists and is valid KitGraph JSON (exits code 1 if not)
2. Starts a local HTTP server on `localhost:<port>` (random port if `--port` not specified)
3. Injects graph data as `window.__REPOVIZ_DATA__` into the HTML template
4. Prints server URL to stderr: `repoviz visualizer running at http://localhost:<port>`
5. Opens default browser to the URL (unless `--no-open`)
6. Keeps server running until user presses Ctrl+C

**Exit codes**:
| Code | Meaning |
|------|---------|
| `0` | Server stopped normally (Ctrl+C) |
| `1` | `<graph-file>` not found or not readable |
| `2` | `<graph-file>` is not valid KitGraph JSON |
| `3` | Internal server error |

---

### repoviz bundle

```
repoviz bundle <graph-file> [options]
```

Generates a single self-contained HTML file that can be opened in any modern browser without a server or internet connection.

| Argument | Required | Description |
|----------|----------|-------------|
| `<graph-file>` | Yes | Path to a `KitGraph` JSON file (output of `repoviz analyze`) |

| Option | Default | Description |
|--------|---------|-------------|
| `--output <file>` | `graph.html` | Output path for the generated HTML file |
| `--quiet` | false | Suppress output; only errors go to stderr |

**Behavior**:
1. Validates `<graph-file>` exists and is valid KitGraph JSON (exits code 1 if not)
2. Generates HTML file with all assets inlined: D3 JS, app JS, CSS, graph data
3. Writes HTML to `--output` path (default: `graph.html` in current directory)
4. Prints success message to stderr: `Bundle written to <output-path>` (unless `--quiet`)

**Exit codes**:
| Code | Meaning |
|------|---------|
| `0` | Bundle written successfully |
| `1` | `<graph-file>` not found or not readable |
| `2` | `<graph-file>` is not valid KitGraph JSON |
| `3` | Cannot write to `--output` path (permissions, disk full, etc.) |

---

## Stdin / Stdout / Stderr

- **stdout**: Not used by either command
- **stderr**: Progress messages, server URL, errors
- **stdin**: Not used

---

## Examples

```bash
# Open a previously generated graph in the browser
repoviz serve graph.json

# Serve on a specific port without opening browser
repoviz serve graph.json --port 4000 --no-open

# Generate an all-in-one HTML file for sharing
repoviz bundle graph.json --output my-workspace-viz.html

# Full pipeline: analyze then visualize
repoviz analyze ./my-workspace --output graph.json
repoviz serve graph.json
```

---

## Browser Data Contract

The visualizer HTML receives graph data via a JavaScript global variable injected before the app bundle script:

```html
<script>
  window.__REPOVIZ_DATA__ = { /* KitGraph JSON contents */ };
</script>
<script>/* app bundle */</script>
```

The app reads `window.__REPOVIZ_DATA__` on startup. The shape is identical to the `KitGraph` JSON schema defined in `specs/001-core-analysis-engine/contracts/kit-graph.schema.json`.

If `window.__REPOVIZ_DATA__` is missing or invalid, the visualizer renders an error overlay explaining the problem and suggesting `repoviz analyze` to regenerate the file.
