import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VOIDSTRIKE',
    short_name: 'VOIDSTRIKE',
    description:
      '브라우저에서 동작하는 경쟁 실시간 전략 게임. 군대를 지휘하고 자원을 채굴하며 전장을 지배하세요.',
    start_url: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#000000',
    theme_color: '#0a0015',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
