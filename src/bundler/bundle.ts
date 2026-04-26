import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { KitGraph } from "../output/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getProjectRoot(): string {
  return resolve(__dirname, "../../");
}

export function generateHTML(
  graphData: KitGraph,
  viewerBundleJS: string,
  templateHTML: string
): string {
  // Escape </script> inside the inlined JS so the HTML parser doesn't close
  // the <script> tag prematurely (common in minified D3 source).
  const safeBundle = viewerBundleJS.replace(/<\/script>/gi, "<\\/script>");
  const safeData = JSON.stringify(graphData).replace(/<\/script>/gi, "<\\/script>");

  const dataScript = `<script>window.__REPOVIZ_DATA__ = ${safeData};</script>`;
  const bundleScript = `<script>${safeBundle}</script>`;

  // Use function replacements to prevent special $ sequences in the bundle
  // (e.g. $' $& $`) from being interpreted as replacement patterns.
  return templateHTML
    .replace("<!-- DATA_INJECTION_POINT -->", () => dataScript)
    .replace("<!-- BUNDLE_INJECTION_POINT -->", () => bundleScript);
}

export interface BundleAssets {
  graphData: KitGraph;
  viewerBundleJS: string;
  templateHTML: string;
}

export function readBundleAssets(graphPath: string): BundleAssets {
  const root = getProjectRoot();
  const bundlePath = resolve(root, "dist/viewer.bundle.js");
  const templatePath = resolve(root, "viewer/template.html");

  if (!existsSync(graphPath)) {
    throw Object.assign(new Error(`Graph file not found: ${graphPath}`), {
      exitCode: 1,
    });
  }

  let graphData: KitGraph;
  try {
    graphData = JSON.parse(readFileSync(graphPath, "utf8")) as KitGraph;
  } catch {
    throw Object.assign(new Error(`Invalid JSON in graph file: ${graphPath}`), {
      exitCode: 2,
    });
  }

  if (
    !graphData ||
    !Array.isArray(graphData.nodes) ||
    !Array.isArray(graphData.edges) ||
    !graphData.summary
  ) {
    throw Object.assign(
      new Error(`File is not a valid KitGraph JSON: ${graphPath}`),
      { exitCode: 2 }
    );
  }

  if (!existsSync(bundlePath)) {
    throw Object.assign(
      new Error(
        `Viewer bundle not found at ${bundlePath}. Run "npm run build:viewer" first.`
      ),
      { exitCode: 3 }
    );
  }

  if (!existsSync(templatePath)) {
    throw Object.assign(
      new Error(`Template not found at ${templatePath}.`),
      { exitCode: 3 }
    );
  }

  const viewerBundleJS = readFileSync(bundlePath, "utf8");
  const templateHTML = readFileSync(templatePath, "utf8");

  return { graphData, viewerBundleJS, templateHTML };
}

export function writeBundleFile(
  graphPath: string,
  outputPath: string
): void {
  const { graphData, viewerBundleJS, templateHTML } = readBundleAssets(graphPath);
  const html = generateHTML(graphData, viewerBundleJS, templateHTML);

  try {
    writeFileSync(outputPath, html, "utf8");
  } catch (err) {
    throw Object.assign(
      new Error(`Cannot write to ${outputPath}: ${(err as Error).message}`),
      { exitCode: 3 }
    );
  }
}
