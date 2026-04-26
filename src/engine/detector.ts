import { stat } from 'fs/promises';
import { join, relative } from 'path';
import fg from 'fast-glob';
import type { KitFile } from '../output/types.js';
import type { HarnessDefinition } from '../harnesses/types.js';

const MAX_FILE_SIZE_BYTES = 1_048_576; // 1 MB

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.wasm',
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav',
  '.ttf', '.woff', '.woff2', '.eot',
  '.db', '.sqlite', '.sqlite3',
]);

function isBinaryExtension(filePath: string): boolean {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return false;
  return BINARY_EXTENSIONS.has(filePath.slice(lastDot).toLowerCase());
}

async function isSymlinkOutsideRoot(filePath: string, repoRoot: string): Promise<boolean> {
  try {
    const { realpath } = await import('fs/promises');
    const resolved = await realpath(filePath);
    return !resolved.startsWith(repoRoot);
  } catch {
    return true;
  }
}

async function isHarnessPresent(
  repoPath: string,
  harness: HarnessDefinition
): Promise<boolean> {
  const requiredSignals = harness.detection_signals.filter((s) => s.required !== false);
  if (requiredSignals.length === 0) return true;

  for (const signal of requiredSignals) {
    if (signal.path) {
      try {
        await stat(join(repoPath, signal.path));
        return true;
      } catch {
        // not found
      }
    }
    if (signal.glob) {
      const matches = await fg(signal.glob, { cwd: repoPath, onlyFiles: false, dot: true });
      if (matches.length > 0) return true;
    }
  }
  return false;
}

function generateId(repoPath: string, filePath: string): string {
  const rel = relative(repoPath, filePath).replace(/\\/g, '/');
  return rel.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface DetectionResult {
  kitFiles: KitFile[];
  totalScanned: number;
}

export async function detectFiles(
  repoPath: string,
  definitions: HarnessDefinition[]
): Promise<DetectionResult> {
  const allFiles = await fg('**/*', {
    cwd: repoPath,
    onlyFiles: true,
    dot: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
    followSymbolicLinks: false,
  });

  const totalScanned = allFiles.length;

  const activeDefinitions = await Promise.all(
    definitions.map(async (def) => ({
      def,
      active: await isHarnessPresent(repoPath, def),
    }))
  );
  const presentDefinitions = activeDefinitions.filter((d) => d.active).map((d) => d.def);

  const classifiedPaths = new Map<string, KitFile>();

  await Promise.all(
    presentDefinitions.map(async (def) => {
      await Promise.all(
        def.primitive_mappings.map(async (mapping) => {
          const matches = await fg(mapping.glob, {
            cwd: repoPath,
            onlyFiles: true,
            dot: true,
            followSymbolicLinks: false,
          });

          await Promise.all(
            matches.map(async (relPath) => {
              const absPath = join(repoPath, relPath);

              if (isBinaryExtension(absPath)) return;

              if (await isSymlinkOutsideRoot(absPath, repoPath)) return;

              try {
                const stats = await stat(absPath);
                if (stats.size > MAX_FILE_SIZE_BYTES) return;
              } catch {
                return;
              }

              const normPath = relPath.replace(/\\/g, '/');
              if (!classifiedPaths.has(normPath)) {
                classifiedPaths.set(normPath, {
                  id: generateId(repoPath, absPath),
                  path: normPath,
                  category: mapping.category,
                  native_type: mapping.native_type,
                  harness: def.id,
                  display_name: '',
                  description: null,
                  metadata: {},
                });
              }
            })
          );
        })
      );
    })
  );

  return { kitFiles: Array.from(classifiedPaths.values()), totalScanned };
}
