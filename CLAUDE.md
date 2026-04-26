# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

**repoviz** — static analysis engine and interactive visualizer for AI kit repositories.
Built with [GitHub Spec Kit](https://github.com/github/spec-kit) using Spec-Driven Development.

## Architecture Map

The codebase has five main subsystems:

| Subsystem | Files | Role |
|---|---|---|
| `src/engine/` | analyzer, detector, metadata, relationships | Core static analysis — entry point is `analyzer.ts` |
| `src/harnesses/` | loader, types | Multi-harness support (Claude Code, Copilot, Cursor, Gemini…) |
| `src/viewer/` | 10 files (graph, nodes, edges, filters, sidebar, tooltip, search, legend, theme, index) | D3 browser visualization — entry point is `index.ts` |
| `src/bundler/` + `src/server/` | bundle, serve | HTML generation and local HTTP server |
| `src/cli/` | index | CLI entry point: `analyze`, `serve`, `bundle` subcommands |

**Central type contract**: `src/output/types.ts` — defines `KitGraph`, `KitFile`, `Relationship`. Referenced by almost every module.

**God nodes to be aware of**:
- `src/output/types.ts` — touched by engine, viewer, bundler, server, tests
- `src/viewer/index.ts` — imports all 9 other viewer modules
- `src/engine/analyzer.ts` — orchestrates detection, harness loading, relationships, metadata, serialization

## Navigation — Graphify + Playwright

Before implementing features that touch multiple subsystems:
1. Read `.graphify/GRAPH_REPORT.md` for current god nodes and communities
2. Run `npm run graphify` to refresh after significant code changes
3. For viewer changes: locate the correct file in `src/viewer/` **before** editing
4. After any viewer change: run `npm run test:visual` and inspect screenshots

**Rule**: A frontend task is NOT complete until `npm run test:visual` passes.

## Spec-Driven Development Workflow

This project follows Spec-Driven Development (SDD). The general flow is:

1. `/speckit-specify` — write a spec for a feature
2. `/speckit-plan` — generate a technical plan from the spec
3. `/speckit-tasks` — break the plan into tasks
4. `/speckit-implement` — implement the tasks
5. `/speckit-analyze` — review and analyze results

Specs, plans and tasks live under `specs/` after being created.
Constitution lives at `.specify/memory/constitution.md`.

## Skills

All Spec Kit slash commands are available as skills under `.claude/skills/`. Use them to drive development.

<!-- SPECKIT START -->
Active feature context: specs/002-graph-visualizer/ (completed — use as reference for viewer architecture)
<!-- SPECKIT END -->

## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:
- Before answering architecture or codebase questions, read .graphify/GRAPH_REPORT.md for god nodes and community structure
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- Before proposing or committing .graphify artifacts, run `graphify portable-check .graphify`; commit-safe graph artifacts must use repo-relative paths, and never commit .graphify/branch.json, .graphify/worktree.json, or .graphify/needs_update
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` instead of generic traversal
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current
