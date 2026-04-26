import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/cursor-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Cursor integration', () => {
  it('detects cursor harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('cursor');
  });

  it('classifies rule files as context', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const rules = graph.nodes.filter((n) => n.native_type === 'rule');
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.category).toBe('context');
      expect(rule.harness).toBe('cursor');
    }
  });

  it('harnesses index contains cursor', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['cursor']).toBeDefined();
  });
});
