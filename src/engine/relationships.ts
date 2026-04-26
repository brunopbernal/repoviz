import { readFile } from 'fs/promises';
import { join } from 'path';
import type { KitFile, Relationship } from '../output/types.js';
import type { HarnessDefinition } from '../harnesses/types.js';

let _idCounter = 0;
function nextId(): string {
  return `rel_${(++_idCounter).toString().padStart(6, '0')}`;
}

function buildPathIndex(kitFiles: KitFile[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const f of kitFiles) {
    index.set(f.path, f.id);
  }
  return index;
}

export async function extractRelationships(
  kitFiles: KitFile[],
  repoRoot: string,
  definitions: HarnessDefinition[]
): Promise<Relationship[]> {
  _idCounter = 0;
  const pathIndex = buildPathIndex(kitFiles);

  const harnessPatterns = new Map<string, HarnessDefinition['relationship_patterns']>();
  for (const def of definitions) {
    harnessPatterns.set(def.id, def.relationship_patterns);
  }

  const allRelationships: Relationship[] = [];
  const seen = new Set<string>();

  await Promise.all(
    kitFiles.map(async (sourceFile) => {
      const patterns = harnessPatterns.get(sourceFile.harness);
      if (!patterns || patterns.length === 0) return;

      const absPath = join(repoRoot, sourceFile.path);
      let content: string;
      try {
        content = await readFile(absPath, 'utf-8');
      } catch {
        return;
      }

      for (const pattern of patterns) {
        let regex: RegExp;
        try {
          regex = new RegExp(pattern.pattern, 'gm');
        } catch {
          continue;
        }

        let match: RegExpExecArray | null;
        while ((match = regex.exec(content)) !== null) {
          const rawTarget = match[1]?.trim();
          if (!rawTarget) continue;

          const targetId = pathIndex.get(rawTarget);
          const relType = targetId ? pattern.type : 'unresolved';
          const finalTarget = targetId ?? rawTarget;

          const dedupeKey = `${sourceFile.id}|${finalTarget}|${relType}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          allRelationships.push({
            id: nextId(),
            source: sourceFile.id,
            target: finalTarget,
            type: relType,
            evidence: match[0].trim().slice(0, 200),
          });
        }
      }
    })
  );

  return allRelationships;
}
