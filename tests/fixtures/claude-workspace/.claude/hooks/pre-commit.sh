#!/bin/bash
# Pre-commit hook: runs linting before commits
echo "Running pre-commit checks..."
npx eslint src --ext .ts
