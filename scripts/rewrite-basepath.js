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

// JavaScript chunks must NOT be rewritten — their filenames are content
// hashes, so any modification would break the HTML→chunk reference and
// cause Pages to serve stale chunks. The withBasePath() helper already
// inlines /voidstrike into the chunk source directly at compile time,
// so post-build rewriting of chunks is unnecessary AND harmful.
const SKIP_PATHS = new Set([
  '_next/static/chunks/',
  '_next/static/media/',
  '_next/static/css/',
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
      // Skip Next.js chunk/media/css paths — they have content hashes
      // in their filenames that break if we modify file contents.
      const rel = path.relative(OUT_DIR, full);
      if ([...SKIP_PATHS].some((p) => rel.startsWith(p))) continue;
      rewrite(full);
    }
  }
}

function rewrite(file) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;
  // Use a per-run cache buster so user HTTP caches are forced to re-fetch.
  const buster = process.env.BUILD_ID || Date.now().toString(36);
  for (const prefix of PROTECTED_PREFIXES) {
    // Pattern: replace /prefix/... with /voidstrike/prefix/...?v=<buster>
    // Skip if already preceded by /voidstrike (no double-prefix).
    // The lookbehind ensures we don't touch /voidstrike/voidstrike/ or
    // /voidstrike/anything/voidstrike/.../foo (already prefixed).
    const re = new RegExp(`(?<![a-zA-Z0-9_/-])${escapeRegExp(prefix)}([^"'\\s\\)]*)`, 'g');
    src = src.replace(re, (match, suffix) => `${BASE}${prefix}${suffix}${suffix.includes('?') ? '&' : '?'}v=${buster}`);
  }
  if (src !== original) {
    fs.writeFileSync(file, src, 'utf8');
    console.log(`  rewrote ${path.relative(OUT_DIR, file)}`);
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
