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
      'src/test/firestore.rules.test.ts',
      'src/test/auth.integration.test.ts',
      'src/test/lists.integration.test.ts',
    ],
  },
})
