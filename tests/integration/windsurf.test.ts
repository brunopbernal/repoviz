import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/windsurf-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Windsurf integration', () => {
  it('detects windsurf harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('windsurf');
  });

  it('classifies .windsurfrules as context', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const rules = graph.nodes.filter((n) => n.native_type === 'rule');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].category).toBe('context');
    expect(rules[0].harness).toBe('windsurf');
  });

  it('classifies workflow files as command', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const workflows = graph.nodes.filter((n) => n.native_type === 'workflow');
    expect(workflows.length).toBeGreaterThan(0);
    expect(workflows[0].category).toBe('command');
  });

  it('harnesses index contains windsurf', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['windsurf']).toBeDefined();
  });
});
