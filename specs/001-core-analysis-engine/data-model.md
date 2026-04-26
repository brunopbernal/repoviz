# Data Model: Core Analysis Engine

**Phase 1 output** | Feature: `001-core-analysis-engine` | Date: 2026-04-26

---

## Entities

### Repository

The root input to the engine. Represents a local directory submitted for analysis.

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Absolute filesystem path to the repo root |
| `detected_harnesses` | string[] | List of harness IDs found in this repo |
| `total_files` | number | Total files scanned (excluding binaries, symlinks, >1MB) |
| `analysis_time_ms` | number | Wall-clock time for full analysis |

**Validation rules**:
- `path` must be an existing, readable directory
- `path` must not be a symlink target outside the local filesystem
- `detected_harnesses` may be empty (generic repo) or contain multiple entries

---

### KitFile (Graph Node)

A single file within the repository that plays a role in a kit. Becomes a node in the Kit Graph.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable unique ID for this node (e.g., hash of relative path) |
| `path` | string | Path relative to repo root |
| `category` | enum | Canonical category (see vocabulary below) |
| `native_type` | string | Harness-specific term (e.g., "skill", "rule", "instruction") |
| `harness` | string | Harness ID this file belongs to (e.g., `"claude-code"`) |
| `display_name` | string | Human-readable name extracted from file (fallback: filename) |
| `description` | string \| null | Purpose extracted from frontmatter or first heading |
| `metadata` | object | Harness-specific extra fields (e.g., `argument-hint` for Claude skills) |

**Canonical category vocabulary**:

| Category | Meaning |
|----------|---------|
| `agent` | An autonomous AI agent definition |
| `command` | A skill, workflow, instruction, or command the AI can invoke |
| `hook` | An automatic trigger that fires on events |
| `context` | A file that provides persistent context/instructions to the AI |
| `template` | A reusable template for generating specs, plans, or outputs |
| `config` | A settings or configuration file for the harness |
| `unclassified` | File detected in the repo but not matching any known pattern |

**Validation rules**:
- `id` is immutable once assigned for a given path
- `category` must be one of the 7 canonical values
- `native_type` may equal `category` when harness uses the same term
- `harness` must reference a known harness ID or `"generic"`

---

### Relationship (Graph Edge)

A directed connection between two KitFiles, capturing how one file references or affects another.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable unique ID for this edge |
| `source` | string | ID of the source KitFile |
| `target` | string | ID of the target KitFile |
| `type` | enum | Relationship type (see vocabulary below) |
| `evidence` | string | Human-readable description of what triggered this relationship (e.g., "path reference at line 12") |

**Relationship type vocabulary**:

| Type | Meaning |
|------|---------|
| `reads` | Source file reads or loads target at runtime |
| `executes` | Source file invokes or runs target |
| `creates` | Source file generates or writes target |
| `edits` | Source file modifies target |
| `references` | Source file mentions target by path or name (weak link) |
| `unresolved` | Reference detected but target file not found in repo |

**Validation rules**:
- `source` and `target` must reference existing KitFile IDs (or `unresolved` when target is outside repo)
- Self-loops (`source === target`) are not valid
- Duplicate edges (same source, target, type) are collapsed into one

---

### HarnessDefinition

A declarative configuration file (YAML) that teaches the engine how to detect and classify a specific harness.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique harness identifier (e.g., `"claude-code"`) |
| `name` | string | Display name (e.g., `"Claude Code"`) |
| `detection_signals` | object | Glob patterns and/or required paths that indicate this harness |
| `primitive_mappings` | object | Maps harness-native terms to canonical categories |
| `relationship_patterns` | object | Regex/glob patterns for detecting cross-file references |
| `version` | string | Definition schema version |

---

### KitGraph (Engine Output)

The complete output produced by a single analysis run.

```
{
  "summary": {
    "repo_path": string,
    "detected_harnesses": string[],
    "total_files_scanned": number,
    "classified_files": number,
    "unclassified_files": number,
    "relationship_count": number,
    "analysis_time_ms": number
  },
  "harnesses": {
    "<harness-id>": string[]   // node IDs belonging to this harness
  },
  "nodes": KitFile[],
  "edges": Relationship[]
}
```

**Validation rules**:
- All node IDs in `harnesses{}` must exist in `nodes[]`
- All edge `source` and `target` IDs must exist in `nodes[]`
- `summary.classified_files + summary.unclassified_files === summary.total_files_scanned`

---

## State Transitions

Analysis runs as a single synchronous pipeline with no persistent state between runs. There are no lifecycle states for KitFiles or Relationships — they are produced once per run and are immutable after output.

```
repo path input
  → [Detection Pass]    → classified file list per harness
  → [Metadata Pass]     → KitFile nodes with display_name + description
  → [Relationship Pass] → Relationship edges
  → [Serialization]     → KitGraph JSON output
```
