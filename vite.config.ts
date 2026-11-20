/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [react()],
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
            'e2e/**',
            'node_modules/**',
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
          exclude: ['node_modules/**', 'e2e/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.integration.test.ts'],
          exclude: ['node_modules/**', 'e2e/**'],
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
