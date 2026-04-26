import { resolve } from 'path';
import { loadHarnessDefinitions } from '../harnesses/loader.js';
import { detectFiles } from './detector.js';
import { enrichMetadata } from './metadata.js';
import { extractRelationships } from './relationships.js';
import { buildKitGraph, validateKitGraph } from '../output/serializer.js';
import type { KitGraph } from '../output/types.js';
import type { HarnessDefinition } from '../harnesses/types.js';

export interface AnalyzeOptions {
  definitionsDir?: string;
  harness?: string;
}

export async function analyze(repoPath: string, options: AnalyzeOptions = {}): Promise<KitGraph> {
  const startTime = Date.now();
  const absoluteRepoPath = resolve(repoPath);

  const allDefinitions = await loadHarnessDefinitions(options.definitionsDir);
  const definitions: HarnessDefinition[] = options.harness
    ? allDefinitions.filter((d) => d.id === options.harness)
    : allDefinitions;

  const { kitFiles, totalScanned } = await detectFiles(absoluteRepoPath, definitions);

  const enriched = await enrichMetadata(kitFiles, absoluteRepoPath);

  const relationships = await extractRelationships(enriched, absoluteRepoPath, definitions);

  const analysisTimeMs = Date.now() - startTime;

  const graph = buildKitGraph({
    repoPath: absoluteRepoPath,
    kitFiles: enriched,
    relationships,
    totalScanned,
    analysisTimeMs,
  });

  await validateKitGraph(graph);

  return graph;
}
