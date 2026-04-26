---
name: Analyze
description: Analyzes code quality and reports issues
---

# Analyze

Reads source files and reports quality issues.

## Usage

```
/analyze <path>
```

## Steps

1. Read all `.ts` or `.js` files in the target path
2. Check for common issues (unused variables, missing types)
3. Output a structured report

## References

See `CLAUDE.md` for workspace conventions before analyzing.
