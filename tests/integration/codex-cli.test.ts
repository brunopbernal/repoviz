import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/codex-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Codex CLI integration', () => {
  it('detects codex-cli harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('codex-cli');
  });

  it('classifies AGENTS.md as agent', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const agentsMd = graph.nodes.find((n) => n.path === 'AGENTS.md');
    expect(agentsMd).toBeDefined();
    expect(agentsMd?.category).toBe('agent');
    expect(agentsMd?.native_type).toBe('agent');
    expect(agentsMd?.harness).toBe('codex-cli');
  });

  it('harnesses index contains codex-cli', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['codex-cli']).toBeDefined();
    expect(graph.harnesses['codex-cli'].length).toBeGreaterThan(0);
  });
});
