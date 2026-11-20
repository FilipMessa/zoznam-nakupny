/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Excluded from every Vitest project. `.claude/**` holds agent git worktrees:
// full copies of this repo (with their own node_modules) that the test globs
// would otherwise collect alongside the real suites.
const WORKSPACE_EXCLUDE = ['e2e/**', '**/node_modules/**', '.claude/**']

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    // Installable PWA: web manifest + a Workbox service worker that precaches
    // the app shell, so the app opens offline (Firestore's own persistent
    // cache already serves the data). `prompt` + useServiceWorkerUpdate:
    // a new version waits until the user taps "Obnoviť". The icons in
    // public/ are generated from public/logo.svg (pwa-assets.config.ts).
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Zoznam nákupný',
        short_name: 'Nákupný zoznam',
        description: 'Spoločný nákupný zoznam pre celú rodinu.',
        lang: 'sk',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // bg (theme semantic token): status bar and splash blend into the app
        theme_color: '#fdfaf6',
        background_color: '#fdfaf6',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Manifest icons and the manifest itself are added automatically.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        // Nunito is self-hosted (@fontsource-variable/nunito); Slovak text only
        // ever needs its latin + latin-ext subsets, so skip precaching the rest.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,vietnamese}-*.woff2'],
        navigateFallback: 'index.html',
        // Firebase Hosting's reserved URLs: /__/auth/handler finishes the
        // Google redirect sign-in (authDomain is this same origin) and must
        // reach the network, never the cached app shell.
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    // Three Vitest projects sharing the alias/plugins above (`extends: true`);
    // each npm script runs one with `--project`. The emulator-backed ones
    // (rules, integration) are selected by filename suffix, so a new suite
    // only needs the right suffix -- unit excludes exactly those suffixes.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: './src/test/setup.ts',
          exclude: [
            ...WORKSPACE_EXCLUDE,
            '**/*.integration.test.ts',
            '**/*.rules.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'rules',
          environment: 'node',
          include: ['**/*.rules.test.ts'],
          exclude: WORKSPACE_EXCLUDE,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.integration.test.ts'],
          exclude: WORKSPACE_EXCLUDE,
          // All suites spin up a RulesTestEnvironment against the same
          // emulator projectId and call clearFirestore()/cleanup() in their
          // own beforeEach/afterAll hooks. Running the files in parallel
          // workers lets one file's clearFirestore() race the other file's
          // in-flight fixture writes (observed as spurious "evaluation
          // error" PERMISSION_DENIED failures from isMember()'s exists()
          // check), so force sequential file execution for this project.
          fileParallelism: false,
        },
      },
    ],
  },
})
