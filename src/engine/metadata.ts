import { readFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import matter from 'gray-matter';
import type { KitFile } from '../output/types.js';

function firstMarkdownHeading(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)/);
    if (match) return match[1].trim();
  }
  return null;
}

function fileBaseName(filePath: string): string {
  const base = basename(filePath, extname(filePath));
  return base
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function enrichMetadata(kitFiles: KitFile[], repoRoot?: string): Promise<KitFile[]> {
  return Promise.all(
    kitFiles.map(async (file) => {
      const absPath = repoRoot ? join(repoRoot, file.path) : file.path;

      const ext = extname(file.path).toLowerCase();
      if (!['.md', '.mdx'].includes(ext)) {
        return {
          ...file,
          display_name: file.display_name || fileBaseName(file.path),
        };
      }

      let content: string;
      try {
        content = await readFile(absPath, 'utf-8');
      } catch {
        return {
          ...file,
          display_name: file.display_name || fileBaseName(file.path),
        };
      }

      let parsed: matter.GrayMatterFile<string>;
      try {
        parsed = matter(content);
      } catch {
        return {
          ...file,
          display_name: file.display_name || fileBaseName(file.path),
        };
      }

      const frontmatter = parsed.data as Record<string, unknown>;
      const heading = firstMarkdownHeading(parsed.content);

      const display_name =
        (frontmatter.name as string) ||
        (frontmatter.title as string) ||
        heading ||
        fileBaseName(file.path);

      const description =
        (frontmatter.description as string) ||
        (frontmatter.summary as string) ||
        null;

      return {
        ...file,
        display_name,
        description,
        metadata: { ...frontmatter },
      };
    })
  );
}
