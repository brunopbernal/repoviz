import * as esbuild from "esbuild";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

console.log(`Building viewer bundle (repoviz v${pkg.version})...`);

const result = await esbuild.build({
  entryPoints: [resolve(root, "src/viewer/index.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "__repovizViewer",
  platform: "browser",
  target: ["chrome90", "firefox88", "safari14"],
  outfile: resolve(root, "dist/viewer.bundle.js"),
  metafile: true,
  logLevel: "info",
});

const outputSize = result.metafile
  ? Object.values(result.metafile.outputs).reduce(
      (sum, o) => sum + o.bytes,
      0
    )
  : 0;

const kb = (outputSize / 1024).toFixed(1);
console.log(`Bundle written to dist/viewer.bundle.js (${kb} KB)`);

if (outputSize > 500 * 1024) {
  console.warn(`Warning: bundle size ${kb} KB exceeds 500 KB target`);
  process.exit(1);
}
