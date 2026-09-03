#!/usr/bin/env node
/**
 * Post-build script: rewrites absolute-path references in the static export
 * output to include the GitHub Pages subpath (/voidstrike).
 *
 * Why this is needed:
 *  - Next.js `output: 'export'` + `basePath: '/voidstrike'` rewrites the
 *    asset paths emitted by Next.js itself (chunks, styles, manifests,
 *    icons referenced from Next.js metadata). But it does NOT rewrite:
 *      - static JSON files in public/ (e.g. /data/game.json)
 *      - absolute-path fetch() calls inside the source code (those only
 *        get rewritten if the source explicitly uses BASE_URL or similar)
 *      - URLs hardcoded in data files (music-manifest.json is generated
 *        from filenames by a prebuild script and embeds "/audio/...")
 *  - vite/vite-style bundlers handle this differently; Next.js's static
 *    export leaves these references untouched.
 *
 * What this script does:
 *  - Walks every file in out/ (excluding .png/.jpg/.webm/.wasm/.glb)
 *  - Finds `/<segment>/` style absolute paths used by the game (audio,
 *    data, config, icon, wasm, draco, models, textures, sw.js)
 *  - Prefixes them with /voidstrike if not already prefixed.
 *
 * Idempotent: re-running is safe.
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', 'out');
const BASE = '/voidstrike';

// Paths the game uses that Next.js does NOT auto-prefix.
// Listed as `/<prefix>` and matched case-sensitively at the leading slash.
const PROTECTED_PREFIXES = [
  '/audio/',
  '/config/',
  '/data/',
  '/wasm/',
  '/draco/',
  '/models/',
  '/textures/',
  '/fonts/',
  '/sw.js',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.webmanifest',
];

// File extensions we skip (binary content).
const SKIP_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.mp3', '.ogg', '.wav', '.m4a',
  '.wasm', '.glb', '.gltf', '.bin',
  '.zip', '.tar', '.gz',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTS.has(ext)) continue;
      rewrite(full);
    }
  }
}

function rewrite(file) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;
  for (const prefix of PROTECTED_PREFIXES) {
    // Replace /audio/... with /voidstrike/audio/...
    // But NOT if it's already /voidstrike/audio/... (idempotent).
    const re = new RegExp(`(?<!${BASE})\\${prefix}`, 'g');
    src = src.replace(re, `${BASE}${prefix}`);
  }
  if (src !== original) {
    fs.writeFileSync(file, src, 'utf8');
    console.log(`  rewrote ${path.relative(OUT_DIR, file)}`);
  }
}

if (!fs.existsSync(OUT_DIR)) {
  console.error(`out/ directory not found at ${OUT_DIR} — run \`next build\` first.`);
  process.exit(1);
}

console.log(`Rewriting absolute paths in ${OUT_DIR} to include ${BASE}/...`);
let count = 0;
const before = walk;
walk(OUT_DIR);
console.log('Done.');
