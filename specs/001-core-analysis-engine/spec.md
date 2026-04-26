# Feature Specification: Core Analysis Engine

**Feature Branch**: `001-core-analysis-engine`
**Created**: 2026-04-26
**Status**: Draft
**Input**: User description: "Core Analysis Engine — analisar estaticamente um repositório de kit (Claude Code workspace, spec-kit project, ou repo genérico de agentes) e extrair o grafo de relacionamentos entre arquivos: identificar agentes, skills, hooks, context files e templates; mapear o que cada um executa, referencia, lê, edita ou cria; produzir uma estrutura de dados (JSON/graph) que sirva de fonte para a visualização interativa no browser. A análise roda 100% local, via parsing estático (sem executar código do repo analisado), e deve completar em menos de 5 segundos para repos de até 500 arquivos."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Analyze a Kit Repo (Priority: P1)

A developer discovers a Claude Code workspace or spec-kit project on GitHub. Before using it, they want to understand how it's structured — what agents exist, what skills they invoke, what context files they read. They point repoviz at the cloned repo path and receive a structured output describing all kit files and how they relate to each other.

**Why this priority**: This is the core value proposition of the entire product. Without this, nothing else works.

**Independent Test**: Can be fully tested by running the engine against a known Claude Code workspace and verifying that the output lists all agents, skills, and their relationships correctly.

**Acceptance Scenarios**:

1. **Given** a local path to a valid Claude Code workspace, **When** the engine runs against it, **Then** it produces a structured output listing all agents, skills, hooks, and context files found.
2. **Given** a local path to a spec-kit project, **When** the engine runs, **Then** it correctly classifies the kit type and lists spec files, commands, and templates.
3. **Given** a repo with 500 files, **When** the engine completes, **Then** the total analysis time is under 5 seconds.
4. **Given** a file the engine cannot classify, **When** encountered, **Then** it is included in the output as "unclassified" without causing an error.

---

### User Story 2 — Relationship Mapping (Priority: P2)

A developer wants to know not just what files exist, but how they connect. They want to see that Agent X reads Context File Y, that Skill A invokes Script B, and that Hook C triggers when File D is edited. The engine maps these directed relationships between kit files.

**Why this priority**: The relationship graph is what differentiates repoviz from a simple file tree. It enables the interactive visualization.

**Independent Test**: Can be tested by running the engine against a reference repo with known relationships and verifying that each expected relationship appears in the output graph.

**Acceptance Scenarios**:

1. **Given** an agent file that references a context file by path, **When** the engine analyzes it, **Then** a "reads" relationship from the agent to the context file appears in the output.
2. **Given** a skill file that invokes a script, **When** analyzed, **Then** an "executes" relationship is captured.
3. **Given** a file pair with no detectable relationship, **When** analyzed, **Then** no relationship is invented — the output only contains relationships with evidence.
4. **Given** an ambiguous reference that the engine cannot resolve, **When** encountered, **Then** it is marked as "unresolved" in the output, not silently dropped.

---

### User Story 3 — Kit Type Auto-Detection (Priority: P3)

A developer points the engine at a repo without telling it what kind of kit it is. The engine inspects the repo structure and automatically determines which of the six supported harnesses it belongs to — Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Cursor, or Windsurf — applying precise classification rules for each. Repos that match none of the six are classified as generic.

**Why this priority**: Auto-detection removes friction and makes the tool work out of the box for the most common harnesses in the market.

**Independent Test**: Can be tested by running the engine against each of the six harness types and verifying correct identification without any manual configuration.

**Acceptance Scenarios**:

1. **Given** a repo containing `.claude/` directory and `CLAUDE.md`, **When** analyzed, **Then** kit type is identified as "Claude Code workspace".
2. **Given** a repo containing `.specify/` directory and spec files, **When** analyzed, **Then** kit type is identified as "spec-kit project".
3. **Given** a repo containing `.github/copilot-instructions.md` or `.github/copilot/`, **When** analyzed, **Then** kit type is identified as "GitHub Copilot".
4. **Given** a repo containing `AGENTS.md` or `.codex/` directory, **When** analyzed, **Then** kit type is identified as "Codex CLI".
5. **Given** a repo containing `.gemini/` directory or `GEMINI.md`, **When** analyzed, **Then** kit type is identified as "Gemini CLI".
6. **Given** a repo containing `.cursor/` directory or `cursor.rules`, **When** analyzed, **Then** kit type is identified as "Cursor".
7. **Given** a repo containing `.windsurf/` directory or `.windsurfrules`, **When** analyzed, **Then** kit type is identified as "Windsurf".
8. **Given** a repo that matches none of the six known patterns, **When** analyzed, **Then** kit type is reported as "generic" and basic file classification still runs.

---

### Edge Cases

- What happens when the target path does not exist or is not a directory?
- What happens when a referenced file path inside a kit file points outside the repo boundary?
- How does the engine handle circular references (Agent A reads Context B, Context B referenced by Agent A)?
- What happens when a kit file is empty or malformed (e.g., invalid YAML frontmatter)?
- How does the engine handle symbolic links inside the repo?
- What happens when two files claim the same identity (e.g., two `CLAUDE.md` files in different subdirectories)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Engine MUST accept a local filesystem path as input and analyze the repository at that path.
- **FR-002**: Engine MUST identify and classify kit files into categories: agent, skill, hook, context file, template, config, and unclassified.
- **FR-003**: Engine MUST automatically detect and classify artifacts from 6 first-class harnesses in v1: Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Cursor, and Windsurf — each with harness-specific classification rules. All other repos receive "generic" classification with best-effort file categorization.
- **FR-004**: Engine MUST map directed relationships between kit files, capturing the relationship type: reads, edits, executes, creates, or references.
- **FR-005**: Engine MUST produce a structured, machine-readable output (graph format) that captures all classified files, their metadata, and all detected relationships. Each kit file node MUST include both a canonical category (from the normalized vocabulary) and a `native_type` field with the harness-specific term.
- **FR-006**: Engine MUST complete analysis of repositories with up to 500 files in under 5 seconds on standard developer hardware.
- **FR-007**: Engine MUST run entirely on the local machine with zero network requests, at any point during analysis.
- **FR-008**: Engine MUST analyze via static inspection only — it MUST NOT execute any code, script, or binary from the analyzed repository.
- **FR-009**: Engine MUST handle unresolvable references gracefully: mark them as "unresolved" in the output rather than failing or omitting them.
- **FR-010**: Engine MUST skip binary files and symlinks during analysis without failing.
- **FR-011**: Engine MUST report the kit type, total file count, classified file count, and relationship count as summary metadata in the output.
- **FR-012**: Engine MUST load harness definitions from declarative configuration files (one per harness), each specifying detection signals and primitive mappings. Adding a new harness MUST NOT require changes to the engine core — only a new definition file.
- **FR-013**: Engine MUST detect all harnesses present in a repository and report them as a list in the output metadata. Each kit file node MUST carry a `harness` attribute identifying which harness it belongs to, enabling the visualization layer to filter the graph by harness and reduce visual pollution in multi-harness repos.

### Key Entities

- **Repository**: A local directory path submitted for analysis. Has a detected kit type and contains kit files.
- **Kit File**: Any file within the repository that plays a role in the kit. Has a canonical category (`agent`, `command`, `hook`, `context`, `template`, `config`, `unclassified`), a `native_type` field with the harness-specific term (e.g., "skill" for Claude Code, "rule" for Cursor), a path, a display name, and extracted metadata (description, purpose if detectable).
- **Relationship**: A directed edge between two kit files. Has a type (reads, edits, executes, creates, references, unresolved) and an evidence description (e.g., "path found in line 12 of agent.md").
- **Kit Graph**: The complete output of the engine. Structure: a flat `nodes[]` array (each node is a Kit File), a flat `edges[]` array (each edge is a Relationship), a `harnesses{}` index mapping each detected harness name to the list of node IDs belonging to it, and a `summary` metadata object. This format is compatible with standard graph visualization libraries and enables fast harness-based filtering without reprocessing the full graph.
- **Harness**: An AI coding assistant platform with its own file conventions and primitives (e.g., Claude Code, GitHub Copilot). A repository may contain artifacts from multiple harnesses simultaneously.
- **Kit Type**: The classification of the repository's overall structure. A repo may have one or more detected harnesses. When no known harness is detected, kit type is "generic".

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Analysis of a repository with 500 files completes in under 5 seconds on a standard developer laptop (as of 2026).
- **SC-002**: The engine correctly classifies at least 90% of kit files in a reference repo for each of the 6 first-class harnesses (Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Cursor, Windsurf) when compared to a manually-verified ground truth.
- **SC-003**: The engine correctly identifies at least 80% of known relationships in a reference repository with documented file dependencies.
- **SC-004**: The engine produces zero false-positive "executes" relationships — it never reports that it executed code from the analyzed repo.
- **SC-005**: The engine produces a valid, parseable output graph for 100% of valid repository inputs, including repos with unrecognized or partially malformed kit files.
- **SC-006**: The engine runs successfully in a completely offline environment (no network required at any stage).

---

## Clarifications

### Session 2026-04-26

- Q: Quais harnesses devem ser suportados como primeira classe no v1? → A: Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Cursor e Windsurf. Todos os outros recebem classificação genérica.
- Q: Como novos harnesses devem ser adicionados à engine? → A: Arquivos de definição declarativos — cada harness descrito em um arquivo de config (YAML/JSON) com sinais de detecção e mapeamento de primitivas, carregado pelo core dinamicamente.
- Q: Qual vocabulário o output do grafo deve usar para nomear primitivas entre harnesses? → A: Vocabulário canônico normalizado (ex: `agent`, `command`, `hook`, `context`, `template`) com campo `native_type` preservando o nome original do harness (ex: "skill" para Claude, "rule" para Cursor).
- Q: Como tratar repos com múltiplos harnesses? → A: Detectar e reportar todos os harnesses presentes — cada arquivo é associado ao seu harness de origem. O output deve incluir atributo `harness` em cada nó para permitir filtragem na camada de visualização, dando ao usuário controle sobre a poluição visual gerada por repos multi-harness.
- Q: Qual a estrutura do output graph para consumo pela camada de visualização? → A: Flat `nodes[]` + `edges[]` + `harnesses{}` index — formato padrão de grafo compatível com bibliotecas de visualização (D3, Cytoscape, etc.) com índice que agrupa IDs de nós por harness para filtragem rápida sem reprocessamento.

---

## Assumptions

- The analyzed repository is already available on the local filesystem (cloned or otherwise accessible). repoviz does not fetch or clone repos.
- v1 targets 6 first-class harnesses: Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Cursor, and Windsurf. All other repos receive best-effort generic classification.
- Repositories with more than 500 files are out of scope for v1 performance targets but should not cause failures — they may simply take longer.
- The output graph format will be defined jointly with the visualization layer to ensure compatibility. For v1, a flat JSON structure with nodes and edges arrays is the working assumption.
- Files larger than 1 MB are skipped during analysis to avoid performance degradation on unusually large files.
- The engine does not need to understand every possible kit file format on day one — unknown formats are classified as "unclassified" and included in the output.
- Analysis is always run fresh against the current state of the filesystem. Caching and incremental analysis are out of scope for v1.
