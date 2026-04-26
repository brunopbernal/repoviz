import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';
import type { HarnessDefinition } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DEFINITIONS_DIR = join(__dirname, '../../definitions');

function validate(def: unknown, filePath: string): HarnessDefinition {
  const d = def as Record<string, unknown>;

  if (!d.id || typeof d.id !== 'string') {
    throw new Error(`[${filePath}] Missing or invalid 'id' field`);
  }
  if (!d.name || typeof d.name !== 'string') {
    throw new Error(`[${filePath}] Missing or invalid 'name' field`);
  }
  if (!d.version || typeof d.version !== 'string') {
    throw new Error(`[${filePath}] Missing or invalid 'version' field`);
  }
  if (!Array.isArray(d.detection_signals)) {
    throw new Error(`[${filePath}] 'detection_signals' must be an array`);
  }
  if (!Array.isArray(d.primitive_mappings)) {
    throw new Error(`[${filePath}] 'primitive_mappings' must be an array`);
  }
  if (!Array.isArray(d.relationship_patterns)) {
    throw new Error(`[${filePath}] 'relationship_patterns' must be an array`);
  }

  return d as unknown as HarnessDefinition;
}

export async function loadHarnessDefinitions(
  definitionsDir: string = DEFAULT_DEFINITIONS_DIR
): Promise<HarnessDefinition[]> {
  let entries: string[];
  try {
    entries = await readdir(definitionsDir);
  } catch {
    return [];
  }

  const ymlFiles = entries.filter((f) => extname(f) === '.yml' || extname(f) === '.yaml');

  const definitions = await Promise.all(
    ymlFiles.map(async (file) => {
      const filePath = join(definitionsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const parsed = yaml.load(content);
      return validate(parsed, filePath);
    })
  );

  return definitions;
}
