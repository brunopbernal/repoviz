---
name: Test Workspace
description: Fixture workspace for repoviz integration tests
---

# Test Claude Code Workspace

This is a minimal Claude Code workspace used as a fixture for repoviz tests.

## Skills

Use `/summarize` to summarize files.
Use `/analyze` to analyze code quality.

## Agents

- `@researcher` — reads context files and produces summaries
- `@coder` — writes and edits code files

## Context

Read `context/profile.md` for user profile information.
