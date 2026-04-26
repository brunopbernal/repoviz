# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

**repoviz** — built with [GitHub Spec Kit](https://github.com/github/spec-kit) using Spec-Driven Development.

## Spec-Driven Development Workflow

This project follows Spec-Driven Development (SDD). The general flow is:

1. `/speckit-specify` — write a spec for a feature
2. `/speckit-plan` — generate a technical plan from the spec
3. `/speckit-tasks` — break the plan into tasks
4. `/speckit-implement` — implement the tasks
5. `/speckit-analyze` — review and analyze results

Specs, plans and tasks live under `specs/` after being created.

## Skills

All Spec Kit slash commands are available as skills under `.claude/skills/`. Use them to drive development.

## Directory Structure

```
specs/          # Feature specs, plans and tasks (created by specify CLI)
templates/      # Spec Kit command templates
src/            # Source code (specify CLI — part of the spec-kit repo)
.claude/
  skills/       # Spec Kit skills for Claude Code
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/001-core-analysis-engine/plan.md
<!-- SPECKIT END -->
