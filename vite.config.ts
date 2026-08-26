import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const DEFAULT_SITE_URL = 'https://tsudoi.yahaha.net';

function canonicalPlugin(siteUrl: string): Plugin {
  return {
    name: 'invite-maker-canonical',
    transformIndexHtml() {
      if (!siteUrl) return [];
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const rawSiteUrl = loadEnv(mode, process.cwd(), '').VITE_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const siteUrl = rawSiteUrl.replace(/\/+$/, '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        manifest: false,
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{html,js,css,ico,png,svg,webp,woff2,webmanifest}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
      canonicalPlugin(siteUrl),
    ],
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    test: {
      environment: 'jsdom',
    },
  };
});
