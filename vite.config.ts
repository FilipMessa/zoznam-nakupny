/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      'e2e/**',
      'node_modules/**',
      // Emulator-backed suites run via their own configs (npm run test:rules /
      // test:integration); a new suite only needs the right filename suffix.
      '**/*.integration.test.ts',
      '**/*.rules.test.ts',
    ],
  },
})
