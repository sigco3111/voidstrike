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

  // Inline basePath into the client bundle at build time so that
  // src/utils/basePath.ts can read it as process.env.NEXT_PUBLIC_BASE_PATH.
  // Next.js's `env` option only works for the Pages Router; App Router
  // needs the explicit define below.
  env: {
    NEXT_PUBLIC_BASE_PATH: '/voidstrike',
  },
  webpack: (config, { isServer }) => {
    // Force NEXT_PUBLIC_BASE_PATH into the client bundle regardless of
    // whether Next.js's automatic inlining kicks in.
    config.plugins.push({
      apply() {
        return !isServer;
      },
      plugin(compiler) {
        compiler.hooks.beforeCompile.tap('BasePathPlugin', () => {
          compiler.options.resolve.alias = {
            ...(compiler.options.resolve.alias || {}),
            '~basepath': JSON.stringify('/voidstrike'),
          };
        });
      },
    });
    if (!isServer) {
      const original = config.plugins.find(
        (p) => p && p.constructor && p.constructor.name === 'DefinePlugin'
      );
      // Define NEXT_PUBLIC_BASE_PATH so it gets inlined as a string literal.
      const DefinePlugin = require('webpack').DefinePlugin;
      config.plugins.push(
        new DefinePlugin({
          'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify('/voidstrike'),
        })
      );
    }
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

  // Note: custom headers (COOP/COEP) are NOT applied with output: export.
  // GitHub Pages cannot set Cross-Origin headers, so SharedArrayBuffer
  // is unavailable — Recast Navigation WASM will fall back to single-threaded mode
  // (the pathfinding engine emits a warning and uses JS pathfinding instead).
};

module.exports = nextConfig;
