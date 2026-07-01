/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/test/firestore.rules.test.ts'],
  },
})
