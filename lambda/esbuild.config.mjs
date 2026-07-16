// ─────────────────────────────────────────────────────────────────────────────
// esbuild — bundles each domain handler into its own minified ESM Lambda bundle.
// Output: dist/<domain>/index.mjs  (one zip-ready folder per Lambda)
// AWS SDK v3 is provided by the Node.js 22 Lambda runtime, so it's marked external.
// ─────────────────────────────────────────────────────────────────────────────
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const handlersDir = join(__dirname, 'src', 'handlers');

const entryPoints = readdirSync(handlersDir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => join(handlersDir, f));

await build({
  entryPoints,
  outdir: 'dist',
  outbase: 'src/handlers',
  entryNames: '[name]/index',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  minify: true,
  sourcemap: false,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  // AWS SDK v3 ships with the Lambda Node 22 runtime — don't bundle it.
  external: ['@aws-sdk/*'],
  banner: {
    // Shim for any CJS deps that reference require/createRequire under ESM.
    js: "import { createRequire as topLevelCreateRequire } from 'module'; const require = topLevelCreateRequire(import.meta.url); import { fileURLToPath as topLevelFileURLToPath } from 'url'; import { dirname as topLevelDirname } from 'path'; const __filename = topLevelFileURLToPath(import.meta.url); const __dirname = topLevelDirname(__filename);",
  },
  logLevel: 'info',
});

console.log('✓ Lambda bundles built →', entryPoints.length, 'handlers');
