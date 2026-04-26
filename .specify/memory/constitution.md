<!-- SYNC IMPACT REPORT
Version change: 0.0.0 (template) → 1.0.0 (initial)
Added sections: Core Principles (5), Open Source Standards, Development Workflow, Governance
Removed sections: none (first edition)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (principles referenced; no breaking changes)
  - .specify/templates/spec-template.md ✅ (scope aligned with local-first principle)
  - .specify/templates/tasks-template.md ✅ (task types aligned with principles)
Deferred items:
  - TODO(RATIFICATION_DATE): confirm exact adoption date; marked as 2026-04-26 (today)
-->

# repoviz Constitution

## Core Principles

### I. Local-First, Browser-Rendered

repoviz MUST run entirely on the user's local machine with zero cloud dependencies.
Visualization is rendered in the local browser. No data leaves the machine.
The analyzed repository is never executed — only read and parsed.

**Rationale**: Users must be able to analyze private or proprietary repos safely.
Trust is earned by guaranteeing that nothing is sent externally.

### II. Static Analysis Only

repoviz MUST infer all file relationships through static analysis exclusively:
AST parsing, regex pattern matching, manifest inspection, and heuristics.
It MUST NOT execute any code from the analyzed repository.

**Rationale**: Executing unknown repos creates security risks and environment
dependencies. Static analysis is safe, fast, and portable.

### III. Kit-Aware by Default

repoviz MUST recognize and classify files that belong to common kit patterns:
agents, skills, hooks, context files, configuration manifests, templates.
Supported kit types include Claude Code workspaces, spec-kit projects, and
generic agent repositories. New kit types are added via adapters.

**Rationale**: Generic file trees are not useful. The value is in understanding
*what role* each file plays in the kit — not just that it exists.

### IV. Clarity Over Completeness

The visual output MUST be understandable at a glance for a first-time visitor.
Show the most important relationships prominently. Hide noise behind progressive
disclosure (click to expand, filter by type, zoom in/out). Never overwhelm.

**Rationale**: The goal is comprehension, not exhaustiveness. A cluttered graph
teaches nothing. An opinionated, focused view teaches fast.

### V. Zero-Config Start

Running repoviz against a repo MUST work with a single command and no prior
configuration. Sensible defaults cover the common case. Advanced configuration
is available but never required.

**Rationale**: If setup is complex, people won't try it. The value is in
immediate, friction-free insight.

## Open Source Standards

repoviz is an open source project. All public APIs, CLI commands, and output
formats MUST be documented. Contributors MUST be able to add new kit adapters
without modifying core code. The project follows semantic versioning (semver).

Contributions require:
- A clear description of the kit type or feature being added
- Static analysis approach documented (no runtime execution)
- Visual output tested against at least one real-world repo example

## Development Workflow

Features follow the Spec-Driven Development flow:
`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`

Every feature that adds a new kit adapter or visualization type MUST include:
- A spec describing the expected visual output
- At least one example repo used for validation
- A static analysis strategy for the new file type

Performance target: Full analysis and render of a 500-file repo in under 5s.

## Governance

This constitution supersedes all other development guidelines.
Amendments require: documenting the change, rationale, and version bump.
Version bump rules:
- MAJOR: removal or redefinition of a core principle
- MINOR: new principle or section added
- PATCH: clarification, wording, or non-semantic fix

All specs and plans MUST reference the applicable principle(s) they implement.
The constitution is reviewed whenever a new kit adapter type is introduced.

**Version**: 1.0.0 | **Ratified**: 2026-04-26 | **Last Amended**: 2026-04-26
