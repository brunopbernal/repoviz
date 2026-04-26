import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/multi-harness-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Multi-harness integration', () => {
  it('detects both claude-code and github-copilot', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('claude-code');
    expect(graph.summary.detected_harnesses).toContain('github-copilot');
  });

  it('harnesses index contains both harnesses', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['claude-code']).toBeDefined();
    expect(graph.harnesses['github-copilot']).toBeDefined();
    expect(graph.harnesses['claude-code'].length).toBeGreaterThan(0);
    expect(graph.harnesses['github-copilot'].length).toBeGreaterThan(0);
  });

  it('each node has the correct harness attribute', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    for (const node of graph.nodes) {
      expect(['claude-code', 'github-copilot']).toContain(node.harness);
    }
  });

  it('claude-code nodes reference their harness correctly in the index', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const ccNodeIds = new Set(graph.harnesses['claude-code']);
    const ccNodes = graph.nodes.filter((n) => n.harness === 'claude-code');
    for (const node of ccNodes) {
      expect(ccNodeIds.has(node.id)).toBe(true);
    }
  });

  it('github-copilot nodes reference their harness correctly in the index', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const cpNodeIds = new Set(graph.harnesses['github-copilot']);
    const cpNodes = graph.nodes.filter((n) => n.harness === 'github-copilot');
    for (const node of cpNodes) {
      expect(cpNodeIds.has(node.id)).toBe(true);
    }
  });

  it('--harness filter restricts to single harness', async () => {
    const graph = await analyze(FIXTURE_DIR, {
      definitionsDir: DEFINITIONS_DIR,
      harness: 'claude-code',
    });
    expect(graph.summary.detected_harnesses).toContain('claude-code');
    expect(graph.summary.detected_harnesses).not.toContain('github-copilot');
    for (const node of graph.nodes) {
      expect(node.harness).toBe('claude-code');
    }
  });
});
