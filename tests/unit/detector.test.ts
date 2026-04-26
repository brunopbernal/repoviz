import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { detectFiles } from '../../src/engine/detector.js';
import { loadHarnessDefinitions } from '../../src/harnesses/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, '../fixtures/claude-workspace');
const DEFINITIONS_DIR = resolve(__dirname, '../../definitions');

describe('detectFiles — Claude Code workspace', () => {
  it('detects CLAUDE.md as context file', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const claudeMd = kitFiles.find((f) => f.path === 'CLAUDE.md');
    expect(claudeMd).toBeDefined();
    expect(claudeMd?.category).toBe('context');
    expect(claudeMd?.native_type).toBe('context');
    expect(claudeMd?.harness).toBe('claude-code');
  });

  it('detects agent files with correct category', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const agents = kitFiles.filter((f) => f.category === 'agent');
    expect(agents.length).toBeGreaterThanOrEqual(2);
    for (const agent of agents) {
      expect(agent.harness).toBe('claude-code');
      expect(agent.native_type).toBe('agent');
    }
  });

  it('detects skill files with category=command', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const skills = kitFiles.filter((f) => f.native_type === 'skill');
    expect(skills.length).toBeGreaterThanOrEqual(2);
    for (const skill of skills) {
      expect(skill.category).toBe('command');
      expect(skill.harness).toBe('claude-code');
    }
  });

  it('detects hook files with category=hook', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const hooks = kitFiles.filter((f) => f.category === 'hook');
    expect(hooks.length).toBeGreaterThanOrEqual(1);
    for (const hook of hooks) {
      expect(hook.harness).toBe('claude-code');
    }
  });

  it('detects config files (.claude/settings.json)', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    const config = kitFiles.find((f) => f.path.includes('settings.json'));
    expect(config).toBeDefined();
    expect(config?.category).toBe('config');
    expect(config?.harness).toBe('claude-code');
  });

  it('each classified file has a non-empty id', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { kitFiles } = await detectFiles(FIXTURE_DIR, definitions);
    for (const f of kitFiles) {
      expect(f.id).toBeTruthy();
    }
  });

  it('returns correct totalScanned count', async () => {
    const definitions = await loadHarnessDefinitions(DEFINITIONS_DIR);
    const { totalScanned } = await detectFiles(FIXTURE_DIR, definitions);
    expect(totalScanned).toBeGreaterThan(0);
  });
});
