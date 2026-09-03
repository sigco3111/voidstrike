import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar';

// basePath-aware icons — needed for Next.js metadata + manual <link> tags.
// On GitHub Pages subpath (e.g. /voidstrike/), absolute '/icon-...' URLs
// would 404 because the PWA Service Worker is disabled on subpath
// deployments and our app assets live under /voidstrike/.
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/voidstrike' : '';
const icon = (size: string) => `${BASE_PATH}/icon-${size}.png`;

export const metadata: Metadata = {
  title: 'VOIDSTRIKE - 브라우저 RTS',
  description:
    '브라우저에서 동작하는 경쟁 실시간 전략 게임. 군대를 지휘하고 자원을 채굴하며 전장을 지배하세요.',
  keywords: ['RTS', '전략', '게임', '브라우저', '멀티플레이어', '경쟁'],
  icons: {
    icon: [
      { url: icon('192x192'), sizes: '192x192', type: 'image/png' },
      { url: icon('512x512'), sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: icon('192x192'), sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VOIDSTRIKE',
  },
  applicationName: 'VOIDSTRIKE',
};

export const viewport: Viewport = {
  themeColor: '#0a0015',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* Prevent browser HTTP cache from serving stale chunks after
            every deploy. Service workers are already disabled on subpath
            deployments, but plain HTTP cache still holds onto chunks for
            up to 10 minutes — this forces a re-fetch on every page load. */}
        <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
        {/* basePath-aware base href so client-side fetch helpers can derive
            the deployment subpath even when __NEXT_DATA__.basePath is missing. */}
        <base href={BASE_PATH + '/'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href={icon('192x192')} />
      </head>
      <body className="font-sans bg-black text-white antialiased">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
