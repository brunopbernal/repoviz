# Tasks: Core Analysis Engine

**Input**: Design documents from `specs/001-core-analysis-engine/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript/Node.js project and establish the full directory structure.

- [x] T001 Initialize Node.js project: create `package.json` with name `repoviz`, type `module`, bin entry `src/cli/index.ts`
- [x] T002 Configure TypeScript: create `tsconfig.json` targeting Node 20, `strict: true`, `moduleResolution: bundler`
- [x] T003 [P] Install and configure Vitest: create `vitest.config.ts` with unit + integration test suites
- [x] T004 [P] Install and configure ESLint + Prettier: create `.eslintrc.json` and `.prettierrc`
- [x] T005 Create full directory skeleton: `src/engine/`, `src/harnesses/`, `src/output/`, `src/cli/`, `definitions/`, `tests/unit/`, `tests/integration/`, `tests/fixtures/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type system, harness loader, and shared infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Define all shared TypeScript types in `src/output/types.ts`: `KitFileCategory`, `RelationshipType`, `KitFile`, `Relationship`, `KitGraph`, `AnalysisSummary`
- [x] T007 Define `HarnessDefinition` TypeScript interface in `src/harnesses/types.ts`: `id`, `name`, `detection_signals`, `primitive_mappings`, `relationship_patterns`, `version`
- [x] T008 Implement harness definition YAML loader in `src/harnesses/loader.ts`: reads all `.yml` files from `definitions/` directory, validates schema, returns `HarnessDefinition[]`
- [x] T009 Create Claude Code harness definition in `definitions/claude-code.yml`: detection signals (`.claude/`, `CLAUDE.md`), primitive mappings (skill→command, agent→agent, hook→hook, context→context), relationship patterns
- [x] T010 Implement engine orchestrator in `src/engine/analyzer.ts`: accepts repo path + options, runs three-pass pipeline, returns `KitGraph`

**Checkpoint**: Loader returns valid `HarnessDefinition[]` from `definitions/`; types compile without errors.

---

## Phase 3: User Story 1 — Analyze a Kit Repo (Priority: P1) 🎯 MVP

**Goal**: Given a local repo path, produce a valid `KitGraph` JSON listing all classified kit files with metadata, using Claude Code as the first supported harness.

**Independent Test**: Run `npx ts-node src/cli/index.ts tests/fixtures/claude-workspace` and verify output is valid JSON with `nodes[]` containing all agents, skills, hooks and context files from the fixture.

- [x] T011 [P] [US1] Create Claude Code fixture repo in `tests/fixtures/claude-workspace/`: minimal but complete workspace with CLAUDE.md, `.claude/agents/`, `.claude/skills/`, `.claude/settings.json`
- [x] T012 [P] [US1] Implement Detection Pass in `src/engine/detector.ts`: receives file tree + `HarnessDefinition[]`, returns classified `KitFile[]` with `category`, `native_type`, `harness`, `id`, `path`
- [x] T013 [P] [US1] Implement Metadata Pass in `src/engine/metadata.ts`: parses YAML frontmatter (`gray-matter`) and first Markdown heading from each `KitFile` to populate `display_name` and `description`
- [x] T014 [US1] Implement `KitGraph` serializer in `src/output/serializer.ts`: assembles `nodes[]`, empty `edges[]`, `harnesses{}` index, and `summary` metadata from pipeline results
- [x] T015 [US1] Implement CLI entry point in `src/cli/index.ts`: parses `repoviz analyze <path>` args, invokes `analyzer.ts`, writes JSON to stdout; exits with correct codes
- [x] T016 [P] [US1] Write unit test for detector in `tests/unit/detector.test.ts`: verify correct `category` and `native_type` for each Claude Code file type
- [x] T017 [P] [US1] Write unit test for serializer in `tests/unit/serializer.test.ts`: verify output structure matches `kit-graph.schema.json`
- [x] T018 [US1] Write integration test for Claude Code in `tests/integration/claude-code.test.ts`: run full pipeline against fixture, assert all expected nodes present with correct fields
- [x] T019 [US1] Validate CLI end-to-end: `node dist/cli/index.js tests/fixtures/claude-workspace` produces JSON parseable by `kit-graph.schema.json`

**Checkpoint**: US1 fully functional — engine classifies a Claude Code workspace and outputs a valid KitGraph with all kit file nodes.

---

## Phase 4: User Story 2 — Relationship Mapping (Priority: P2)

**Goal**: For each classified kit file, detect cross-file relationships (reads, executes, creates, edits, references) and populate `edges[]` in the KitGraph output.

**Independent Test**: Run engine against Claude Code fixture and verify `edges[]` contains at least one correct relationship with valid `source`, `target`, `type`, and `evidence` — all relationships in the fixture are accounted for.

- [x] T020 [P] [US2] Add relationship extraction patterns to `definitions/claude-code.yml`: regex patterns for path references, `@`-mentions, `Read`/`Write`/`Edit` tool invocations in Markdown bodies
- [x] T021 [US2] Implement Relationship Pass in `src/engine/relationships.ts`: scans content of each `KitFile` using harness-specific patterns, emits `Relationship[]` with `source`, `target`, `type`, `evidence`
- [x] T022 [US2] Extend serializer in `src/output/serializer.ts` to include `edges[]` in KitGraph output; deduplicate edges with same source/target/type
- [x] T023 [US2] Implement unresolved reference handling in `src/engine/relationships.ts`: when target path not found in repo, emit edge with `type: "unresolved"` instead of dropping
- [x] T024 [P] [US2] Add relationship fixtures to `tests/fixtures/claude-workspace/`: files with known cross-references to serve as ground truth
- [x] T025 [P] [US2] Write unit test for relationship extractor in `tests/unit/relationships.test.ts`: verify correct type/evidence for each relationship pattern
- [x] T026 [US2] Extend integration test in `tests/integration/claude-code.test.ts`: assert `edges[]` matches expected relationships from fixture ground truth
- [x] T027 [US2] Validate: no false-positive `executes` edges produced — engine never reports executing code from analyzed files

**Checkpoint**: US2 fully functional — KitGraph `edges[]` correctly maps cross-file relationships for a Claude Code workspace.

---

## Phase 5: User Story 3 — Kit Type Auto-Detection (Priority: P3)

**Goal**: Engine detects all 6 first-class harnesses in any repo (including multi-harness repos) and applies harness-specific classification. Each file node carries a `harness` attribute enabling visualization filtering.

**Independent Test**: Run engine against each of the 6 fixture repos and the multi-harness fixture; verify correct harness detection in all cases and correct population of `harnesses{}` index.

- [x] T028 [P] [US3] Create GitHub Copilot harness definition in `definitions/github-copilot.yml`: detection (`.github/copilot-instructions.md`, `.github/copilot/`), primitive mappings (instructions→context)
- [x] T029 [P] [US3] Create Codex CLI harness definition in `definitions/codex-cli.yml`: detection (`AGENTS.md`, `.codex/`), primitive mappings (agent→agent)
- [x] T030 [P] [US3] Create Gemini CLI harness definition in `definitions/gemini-cli.yml`: detection (`.gemini/`, `GEMINI.md`), primitive mappings (command→command, context→context)
- [x] T031 [P] [US3] Create Cursor harness definition in `definitions/cursor.yml`: detection (`.cursor/`, `.cursor/rules/`, `cursor.rules`), primitive mappings (rule→context)
- [x] T032 [P] [US3] Create Windsurf harness definition in `definitions/windsurf.yml`: detection (`.windsurf/`, `.windsurfrules`), primitive mappings (workflow→command, rule→context)
- [x] T033 [P] [US3] Create fixture repo for GitHub Copilot in `tests/fixtures/copilot-repo/`
- [x] T034 [P] [US3] Create fixture repo for Codex CLI in `tests/fixtures/codex-repo/`
- [x] T035 [P] [US3] Create fixture repo for Gemini CLI in `tests/fixtures/gemini-repo/`
- [x] T036 [P] [US3] Create fixture repo for Cursor in `tests/fixtures/cursor-repo/`
- [x] T037 [P] [US3] Create fixture repo for Windsurf in `tests/fixtures/windsurf-repo/`
- [x] T038 [P] [US3] Create multi-harness fixture in `tests/fixtures/multi-harness-repo/`: contains Claude Code + Copilot artifacts simultaneously
- [x] T039 [US3] Extend `src/engine/analyzer.ts` to run all loaded harness definitions in parallel and aggregate results; build `harnesses{}` index mapping harness ID to node ID list
- [x] T040 [P] [US3] Write integration test for GitHub Copilot in `tests/integration/github-copilot.test.ts`
- [x] T041 [P] [US3] Write integration test for Codex CLI in `tests/integration/codex-cli.test.ts`
- [x] T042 [P] [US3] Write integration test for Gemini CLI in `tests/integration/gemini-cli.test.ts`
- [x] T043 [P] [US3] Write integration test for Cursor in `tests/integration/cursor.test.ts`
- [x] T044 [P] [US3] Write integration test for Windsurf in `tests/integration/windsurf.test.ts`
- [x] T045 [US3] Write multi-harness integration test in `tests/integration/multi-harness.test.ts`: verify `harnesses{}` index contains both harnesses; each node has correct `harness` attribute
- [x] T046 [US3] Add `--harness <id>` filter option to CLI in `src/cli/index.ts`: restricts analysis to single harness

**Checkpoint**: US3 fully functional — engine detects all 6 harnesses, supports multi-harness repos, and `harnesses{}` index is correctly populated for filtering.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance, safety guards, schema validation, and distribution readiness.

- [x] T047 Implement parallel async file I/O in `src/engine/analyzer.ts`: batch all file reads with `Promise.all`, bounded by system limits (use `p-limit` or similar)
- [x] T048 [P] Add binary file skip in `src/engine/analyzer.ts`: detect binary via file extension list + magic bytes check before reading content
- [x] T049 [P] Add symlink guard in `src/engine/analyzer.ts`: resolve symlink target with `fs.realpath`, skip if outside repo root
- [x] T050 [P] Add >1 MB file skip in `src/engine/analyzer.ts`: check `stat.size` before reading content
- [x] T051 Add JSON schema validation of output in `src/output/serializer.ts`: validate assembled KitGraph against `specs/001-core-analysis-engine/contracts/kit-graph.schema.json` before emitting
- [x] T052 Write performance benchmark in `tests/integration/performance.test.ts`: generate synthetic 500-file repo, assert full analysis completes in < 5000ms
- [x] T053 Add `--output <file>` option to CLI in `src/cli/index.ts`: write JSON to file instead of stdout
- [x] T054 Update `README.md` with installation, usage examples (`npx repoviz analyze <path>`), and output format description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — first story to implement
- **Phase 4 (US2)**: Depends on Phase 3 (needs classified nodes to find relationships)
- **Phase 5 (US3)**: Depends on Phase 2; can overlap with Phase 4 (independent files)
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5 all complete

### User Story Dependencies

- **US1 (P1)**: Needs Phase 2 — no other story dependencies
- **US2 (P2)**: Needs US1 complete (extends classifier output with edges)
- **US3 (P3)**: Needs Phase 2 — can run alongside US2 (different files: new harness defs + fixtures)

### Parallel Opportunities Within Phases

**Phase 3 (US1)**: T011, T012, T013 are fully parallel (fixture creation + detector + metadata pass are independent).

**Phase 5 (US3)**: T028–T038 (all 5 harness definitions + 6 fixtures) are fully parallel — 11 tasks runnable simultaneously.

---

## Parallel Execution Examples

### Phase 3 — US1 parallel launch

```
Parallel: T011 (fixture) + T012 (detector) + T013 (metadata)
Then sequential: T014 (serializer) → T015 (CLI) → T018 (integration test) → T019 (validate)
```

### Phase 5 — US3 parallel launch

```
Parallel: T028 + T029 + T030 + T031 + T032 (5 harness definitions)
Parallel: T033 + T034 + T035 + T036 + T037 + T038 (6 fixtures)
Then: T039 (multi-harness aggregation in analyzer)
Parallel: T040 + T041 + T042 + T043 + T044 (5 integration tests)
Then sequential: T045 (multi-harness test) → T046 (CLI filter)
```

---

## Implementation Strategy

### MVP (US1 only — Phases 1–3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Claude Code analysis + KitGraph output)
4. **STOP and VALIDATE**: `npx repoviz analyze ./some-claude-workspace` produces valid JSON
5. Ship MVP — already useful for Claude Code workspace exploration

### Incremental Delivery

- MVP: Phases 1–3 → Claude Code workspace analysis working
- +Relationships: Phase 4 → edges[] populated for Claude Code
- +All Harnesses: Phase 5 → 6 harnesses + multi-harness support
- +Production-ready: Phase 6 → performance, safety, distribution

---

## Notes

- `[P]` tasks touch different files with no shared write conflicts — safe to parallelize
- Each user story checkpoint is a demo-able increment
- Fixture repos in `tests/fixtures/` are the ground truth for integration tests — invest in making them realistic
- Harness definitions in `definitions/` are the primary extension point for the open source community — keep the YAML schema simple and well-documented
- Total tasks: **54** across 6 phases
