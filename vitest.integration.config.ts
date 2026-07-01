/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/test/auth.integration.test.ts',
      'src/test/lists.integration.test.ts',
    ],
    // Both suites spin up a RulesTestEnvironment against the same emulator
    // projectId and call clearFirestore()/cleanup() in their own
    // beforeEach/afterAll hooks. Running the files in parallel workers lets
    // one file's clearFirestore() race the other file's in-flight fixture
    // writes (observed as spurious "evaluation error" PERMISSION_DENIED
    // failures from isMember()'s exists() check), so force sequential
    // file execution for this project.
    fileParallelism: false,
  },
})
