/**
 * Deployment basePath helpers — derive the GitHub Pages subpath
 * (e.g. '/voidstrike') so absolute-path fetch() calls inside the client
 * code can be prefixed correctly.
 *
 * Build-time baked constant: BASE_PATH_HARDCODED below must match the
 * basePath in next.config.js. Plain string literal (no runtime detection)
 * so the bundler inlines it directly into every fetch call.
 *
 * For root deployments, leave as empty string.
 */

const BASE_PATH_HARDCODED = '/voidstrike';

/** Get the deployment basePath (e.g. '/voidstrike' or ''). */
export function getBasePath(): string {
  return BASE_PATH_HARDCODED;
}

/** Convenience: prefix a path with the deployment basePath. */
export function withBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH_HARDCODED}${path}`;
}
