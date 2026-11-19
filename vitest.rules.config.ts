/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.rules.test.ts'],
    exclude: ['node_modules/**', 'e2e/**'],
  },
})
