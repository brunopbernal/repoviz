import { describe, it, expect } from 'vitest';
import { buildKitGraph } from '../../src/output/serializer.js';
import type { KitFile, Relationship } from '../../src/output/types.js';

const mockNodes: KitFile[] = [
  {
    id: 'CLAUDE_md',
    path: 'CLAUDE.md',
    category: 'context',
    native_type: 'context',
    harness: 'claude-code',
    display_name: 'CLAUDE',
    description: 'Root context',
    metadata: {},
  },
  {
    id: '.claude_agents_researcher_md',
    path: '.claude/agents/researcher.md',
    category: 'agent',
    native_type: 'agent',
    harness: 'claude-code',
    display_name: 'Researcher',
    description: null,
    metadata: {},
  },
];

const mockEdges: Relationship[] = [
  {
    id: 'rel_000001',
    source: '.claude_agents_researcher_md',
    target: 'CLAUDE_md',
    type: 'references',
    evidence: 'See CLAUDE.md for workspace conventions',
  },
];

describe('buildKitGraph', () => {
  it('produces the correct top-level shape', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: mockNodes,
      relationships: mockEdges,
      totalScanned: 10,
      analysisTimeMs: 42,
    });

    expect(graph).toHaveProperty('summary');
    expect(graph).toHaveProperty('harnesses');
    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('edges');
  });

  it('nodes array matches input kitFiles', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: mockNodes,
      relationships: mockEdges,
      totalScanned: 10,
      analysisTimeMs: 42,
    });
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0].id).toBe('CLAUDE_md');
  });

  it('edges array matches input relationships', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: mockNodes,
      relationships: mockEdges,
      totalScanned: 10,
      analysisTimeMs: 42,
    });
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].type).toBe('references');
  });

  it('harnesses index groups nodes by harness', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: mockNodes,
      relationships: mockEdges,
      totalScanned: 10,
      analysisTimeMs: 42,
    });
    expect(graph.harnesses['claude-code']).toContain('CLAUDE_md');
    expect(graph.harnesses['claude-code']).toContain('.claude_agents_researcher_md');
  });

  it('summary has correct counts', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: mockNodes,
      relationships: mockEdges,
      totalScanned: 10,
      analysisTimeMs: 42,
    });
    expect(graph.summary.total_files_scanned).toBe(10);
    expect(graph.summary.classified_files).toBe(2);
    expect(graph.summary.unclassified_files).toBe(8);
    expect(graph.summary.relationship_count).toBe(1);
    expect(graph.summary.analysis_time_ms).toBe(42);
    expect(graph.summary.detected_harnesses).toContain('claude-code');
  });

  it('handles empty input gracefully', () => {
    const graph = buildKitGraph({
      repoPath: '/test/repo',
      kitFiles: [],
      relationships: [],
      totalScanned: 5,
      analysisTimeMs: 10,
    });
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.summary.classified_files).toBe(0);
    expect(graph.summary.unclassified_files).toBe(5);
    expect(graph.summary.detected_harnesses).toHaveLength(0);
  });
});
