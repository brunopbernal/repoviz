import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { detectFiles } from '../../src/engine/detector.js';
import { enrichMetadata } from '../../src/engine/metadata.js';
import { extractRelationships } from '../../src/engine/relationships.js';
import { loadHarnessDefinitions } from '../../src/harnesses/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/claude-workspace');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('extractRelationships — Claude Code patterns', () => {
  it('detects references relationships (backtick file mentions)', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const enriched = await enrichMetadata(kitFiles, FIXTURE_DIR);
    const relationships = await extractRelationships(enriched, FIXTURE_DIR, definitions);

    const refs = relationships.filter((r) => r.type === 'references');
    expect(refs.length).toBeGreaterThan(0);
  });

  it('detects @-mention as unresolved when target not in kit', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const enriched = await enrichMetadata(kitFiles, FIXTURE_DIR);
    const relationships = await extractRelationships(enriched, FIXTURE_DIR, definitions);

    const unresolved = relationships.filter((r) => r.type === 'unresolved');
    expect(unresolved.length).toBeGreaterThan(0);
  });

  it('all edges have required fields', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const enriched = await enrichMetadata(kitFiles, FIXTURE_DIR);
    const relationships = await extractRelationships(enriched, FIXTURE_DIR, definitions);

    for (const rel of relationships) {
      expect(rel.id).toBeTruthy();
      expect(rel.source).toBeTruthy();
      expect(rel.target).toBeTruthy();
      expect(['reads', 'executes', 'creates', 'edits', 'references', 'unresolved']).toContain(
        rel.type
      );
      expect(rel.evidence).toBeTruthy();
    }
  });

  it('no duplicate source/target/type combinations', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const enriched = await enrichMetadata(kitFiles, FIXTURE_DIR);
    const relationships = await extractRelationships(enriched, FIXTURE_DIR, definitions);

    const seen = new Set<string>();
    for (const rel of relationships) {
      const key = `${rel.source}|${rel.target}|${rel.type}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('correctly resolved edge links to existing node id', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const enriched = await enrichMetadata(kitFiles, FIXTURE_DIR);
    const relationships = await extractRelationships(enriched, FIXTURE_DIR, definitions);

    const nodeIds = new Set(enriched.map((f) => f.id));
    const resolved = relationships.filter((r) => r.type !== 'unresolved');
    for (const rel of resolved) {
      expect(nodeIds.has(rel.target)).toBe(true);
    }
  });
});
