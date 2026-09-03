/**
 * Returns the deployment basePath (e.g. '/voidstrike' on GitHub Pages subpath
 * deployments, '' on root domains). Computed once and cached.
 *
 * Works in both server and client contexts:
 *  - Server: process.env.NEXT_PUBLIC_BASE_PATH or empty
 *  - Client (browser): reads window.__NEXT_DATA__.basePath when present,
 *    else falls back to <base href> in the document, else empty.
 *
 * Used by code that performs absolute-path fetch() calls at runtime
 * (audio configs, game data, networking config) — these bypass the
 * Next.js build-time public/ rewriting, so they need to be told
 * the deployment subpath explicitly.
 */
let cached: string | null = null;

export function getBasePath(): string {
  if (cached !== null) return cached;
  if (typeof window !== 'undefined') {
    // 1) Next.js runtime data
    const next = (window as unknown as { __NEXT_DATA__?: { basePath?: string } })
      .__NEXT_DATA__;
    if (next?.basePath) {
      cached = next.basePath;
      return cached;
    }
    // 2) <base href="..."> in the document head
    const baseEl = document.querySelector('base[href]') as HTMLBaseElement | null;
    if (baseEl?.href) {
      try {
        const u = new URL(baseEl.href);
        // pathname is like "/voidstrike/" — strip trailing slash for prefix usage
        cached = u.pathname.replace(/\/$/, '');
        return cached;
      } catch {
        // ignore malformed href
      }
    }
  }
  // Server / fallback
  cached = '';
  return cached;
}

/** Convenience: prefix a path with the deployment basePath. */
export function withBasePath(path: string): string {
  const bp = getBasePath();
  if (!path.startsWith('/')) return path; // already absolute URL or relative
  return `${bp}${path}`;
}
