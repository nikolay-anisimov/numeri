import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Exclude Playwright E2E tests from unit test runner
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**',
      '.next/**'
    ],
    environment: 'node',
    passWithNoTests: true
  }
})
