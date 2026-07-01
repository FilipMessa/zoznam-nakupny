/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/auth.integration.test.ts'],
  },
})
