import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/claude-workspace');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Claude Code integration', () => {
  it('produces a valid KitGraph from the fixture', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph).toHaveProperty('summary');
    expect(graph).toHaveProperty('harnesses');
    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('edges');
  });

  it('detects claude-code harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('claude-code');
  });

  it('contains nodes for all expected file types', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const categories = graph.nodes.map((n) => n.category);
    expect(categories).toContain('context');
    expect(categories).toContain('agent');
    expect(categories).toContain('command');
    expect(categories).toContain('hook');
    expect(categories).toContain('config');
  });

  it('all nodes have required fields', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    for (const node of graph.nodes) {
      expect(node.id).toBeTruthy();
      expect(node.path).toBeTruthy();
      expect(node.category).toBeTruthy();
      expect(node.native_type).toBeTruthy();
      expect(node.harness).toBe('claude-code');
      expect(node.display_name).toBeTruthy();
    }
  });

  it('CLAUDE.md has its display_name populated from frontmatter or heading', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const claudeMd = graph.nodes.find((n) => n.path === 'CLAUDE.md');
    expect(claudeMd).toBeDefined();
    expect(claudeMd?.display_name).toBeTruthy();
    expect(claudeMd?.display_name).not.toBe('');
  });

  it('harnesses index maps claude-code to node ids', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['claude-code']).toBeDefined();
    expect(graph.harnesses['claude-code'].length).toBeGreaterThan(0);
    for (const nodeId of graph.harnesses['claude-code']) {
      expect(graph.nodes.find((n) => n.id === nodeId)).toBeDefined();
    }
  });

  it('summary counts are consistent', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.classified_files).toBe(graph.nodes.length);
    expect(graph.summary.total_files_scanned).toBeGreaterThanOrEqual(graph.summary.classified_files);
    expect(graph.summary.relationship_count).toBe(graph.edges.length);
    expect(graph.summary.analysis_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('analysis completes in under 5 seconds', async () => {
    const start = Date.now();
    await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
