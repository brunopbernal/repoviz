import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { analyze } from '../../src/engine/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYNTHETIC_FIXTURE = resolve(__dirname, '../fixtures/synthetic-500');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

async function generateSyntheticRepo(dir: string, fileCount: number): Promise<void> {
  await mkdir(join(dir, '.claude', 'agents'), { recursive: true });
  await mkdir(join(dir, '.claude', 'skills'), { recursive: true });

  await writeFile(join(dir, 'CLAUDE.md'), `---\nname: Synthetic Workspace\n---\n# Synthetic\n`);

  const agentCount = Math.floor(fileCount * 0.1);
  const skillCount = Math.floor(fileCount * 0.1);
  const contextCount = fileCount - agentCount - skillCount - 1;

  for (let i = 0; i < agentCount; i++) {
    await writeFile(
      join(dir, '.claude', 'agents', `agent-${i}.md`),
      `---\nname: Agent ${i}\ndescription: Synthetic agent ${i}\n---\n# Agent ${i}\n`
    );
  }

  for (let i = 0; i < skillCount; i++) {
    await writeFile(
      join(dir, '.claude', 'skills', `skill-${i}.md`),
      `---\nname: Skill ${i}\ndescription: Synthetic skill ${i}\n---\n# Skill ${i}\n`
    );
  }

  for (let i = 0; i < contextCount; i++) {
    await writeFile(
      join(dir, `context-${i}.md`),
      `# Context ${i}\nSynthetic context file ${i}.\n`
    );
  }
}

describe('Performance benchmark', () => {
  beforeAll(async () => {
    await generateSyntheticRepo(SYNTHETIC_FIXTURE, 500);
  });

  afterAll(async () => {
    await rm(SYNTHETIC_FIXTURE, { recursive: true, force: true });
  });

  it('analyzes a 500-file repo in under 5000ms', async () => {
    const start = Date.now();
    const graph = await analyze(SYNTHETIC_FIXTURE, { definitionsDir: DEFINITIONS_DIR });
    const elapsed = Date.now() - start;

    expect(graph.summary.total_files_scanned).toBeGreaterThanOrEqual(490);
    expect(elapsed).toBeLessThan(5000);
  });
});
