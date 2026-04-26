import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import type { KitFile, Relationship, KitGraph } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _ajv: Ajv | null = null;
let _validate: ReturnType<Ajv['compile']> | null = null;

async function getValidator() {
  if (_validate) return _validate;
  const schemaPath = join(__dirname, '../../specs/001-core-analysis-engine/contracts/kit-graph.schema.json');
  const schemaContent = await readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent) as object;
  _ajv = new Ajv();
  _validate = _ajv.compile(schema);
  return _validate;
}

export interface BuildKitGraphInput {
  repoPath: string;
  kitFiles: KitFile[];
  relationships: Relationship[];
  totalScanned: number;
  analysisTimeMs: number;
}

export async function validateKitGraph(graph: KitGraph): Promise<void> {
  const validate = await getValidator();
  const valid = validate(graph);
  if (!valid) {
    const errors = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ');
    throw new Error(`KitGraph validation failed: ${errors}`);
  }
}

export function buildKitGraph({
  repoPath,
  kitFiles,
  relationships,
  totalScanned,
  analysisTimeMs,
}: BuildKitGraphInput): KitGraph {
  const harnesses: Record<string, string[]> = {};
  for (const file of kitFiles) {
    if (!harnesses[file.harness]) harnesses[file.harness] = [];
    harnesses[file.harness].push(file.id);
  }

  const detectedHarnesses = Object.keys(harnesses);
  const classifiedFiles = kitFiles.length;
  const unclassifiedFiles = totalScanned - classifiedFiles;

  return {
    summary: {
      repo_path: repoPath,
      detected_harnesses: detectedHarnesses,
      total_files_scanned: totalScanned,
      classified_files: classifiedFiles,
      unclassified_files: unclassifiedFiles < 0 ? 0 : unclassifiedFiles,
      relationship_count: relationships.length,
      analysis_time_ms: analysisTimeMs,
    },
    harnesses,
    nodes: kitFiles,
    edges: relationships,
  };
}
