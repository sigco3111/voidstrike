/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,

  // Next.js 16+ uses Turbopack by default
  turbopack: {},

  // No basePath — deployed on Vercel root (voidstrike-blue.vercel.app)
  // where Pages-style subpath isn't needed. If you need to deploy on
  // GitHub Pages later, set basePath: '/<repo>' and rebuild.
  basePath: '',
  trailingSlash: false,

  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const DefinePlugin = require('webpack').DefinePlugin;
      config.plugins.push(
        new DefinePlugin({
          'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(''),
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
  // For SharedArrayBuffer support on Vercel, deploy via vercel.json with
  // headers config (not needed for root-domain deploy).
};

module.exports = nextConfig;
