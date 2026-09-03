// basePath helpers — used by absolute-path fetch() calls that bypass
// Next.js's automatic basePath handling. Empty on Vercel root domain,
// '/<repo>' on GitHub Pages subpath deployments.

export const BASE_PATH = '';

export function getBasePath(): string {
  return BASE_PATH;
}

export function withBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}
