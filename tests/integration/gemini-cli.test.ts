import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/gemini-repo');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('Gemini CLI integration', () => {
  it('detects gemini-cli harness', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.summary.detected_harnesses).toContain('gemini-cli');
  });

  it('classifies GEMINI.md as context', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const geminiMd = graph.nodes.find((n) => n.path === 'GEMINI.md');
    expect(geminiMd).toBeDefined();
    expect(geminiMd?.category).toBe('context');
    expect(geminiMd?.harness).toBe('gemini-cli');
  });

  it('classifies command files correctly', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    const commands = graph.nodes.filter((n) => n.category === 'command');
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0].native_type).toBe('command');
  });

  it('harnesses index contains gemini-cli', async () => {
    const graph = await analyze(FIXTURE_DIR, { definitionsDir: DEFINITIONS_DIR });
    expect(graph.harnesses['gemini-cli']).toBeDefined();
  });
});
