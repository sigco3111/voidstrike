/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,

  // Next.js 16+ uses Turbopack by default
  turbopack: {},

  // Set basePath for GitHub Pages subpath deployment
  basePath: '/voidstrike',
  trailingSlash: false,

  // Note: custom headers (COOP/COEP) are NOT applied with output: export.
  // GitHub Pages cannot set Cross-Origin headers, so SharedArrayBuffer
  // is unavailable — Recast Navigation WASM will fall back to single-threaded mode
  // (the pathfinding engine emits a warning and uses JS pathfinding instead).

  webpack: (config, { isServer }) => {
    // Legacy worker-loader support (only applies when NOT using Turbopack)
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    // Fix for three.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
