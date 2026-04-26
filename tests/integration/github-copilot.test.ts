import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/copilot-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('GitHub Copilot integration', () => {
  it('detects github-copilot harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('github-copilot');
  });

  it('classifies copilot-instructions.md as context', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const instructions = graph.nodes.find((n) =>
      n.path.includes('copilot-instructions.md')
    );
    expect(instructions).toBeDefined();
    expect(instructions?.category).toBe('context');
    expect(instructions?.native_type).toBe('instructions');
    expect(instructions?.harness).toBe('github-copilot');
  });

  it('harnesses index contains github-copilot', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['github-copilot']).toBeDefined();
    expect(graph.harnesses['github-copilot'].length).toBeGreaterThan(0);
  });
});
