import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Layering (see docs/conventions.md): component -> useX hook -> xService
  // (pure logic) / xApi (Firestore & Firebase I/O). Components render only and
  // services stay pure, so neither may reach the I/O layer directly.
  {
    files: ['**/*.tsx', '**/components/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase', 'firebase/*', '@/lib/firebase'],
              allowTypeImports: true,
              message:
                'Components render only: reach Firebase through a useX hook that calls an *Api module.',
            },
            {
              group: ['**/*Api'],
              message:
                'Components render only: call *Api modules from a useX hook, not from the component.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*Service.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message:
                '*Service modules hold pure logic and may not use React.',
            },
            {
              group: ['firebase', 'firebase/*', '@/lib/firebase'],
              allowTypeImports: true,
              message:
                '*Service modules are pure: Firebase may only be imported as a type. Put I/O in an *Api module.',
            },
            {
              group: ['**/*Api'],
              message:
                '*Service modules are pure and may not depend on *Api (I/O) modules.',
            },
          ],
        },
      ],
    },
  },
  // Feature dependency direction: allLists -> lists, items, auth, never back.
  {
    files: ['src/features/lists/**', 'src/features/items/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/allLists',
                '@/features/allLists/*',
                '**/allLists/**',
              ],
              message:
                'lists and items must not depend on allLists (dependency direction is allLists -> lists, items).',
            },
          ],
        },
      ],
    },
  },
  // Must stay last so it can switch off stylistic rules that conflict with Prettier.
  prettier,
  // After prettier: eslint-config-prettier turns `curly` off, we want it on.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      curly: ['error', 'all'],
    },
  },
])
