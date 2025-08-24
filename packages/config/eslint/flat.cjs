// Shared flat ESLint config for the monorepo (ESLint v9)
/* eslint-disable @typescript-eslint/no-var-requires */
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const importPlugin = require('eslint-plugin-import')
const reactPlugin = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')

const ignores = {
  ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**', '**/build/**']
}

const base = {
  files: ['**/*.{ts,tsx,js,jsx}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: tsParser
  },
  plugins: {
    '@typescript-eslint': tsPlugin,
    import: importPlugin,
    react: reactPlugin,
    'react-hooks': reactHooks
  },
  settings: { react: { version: 'detect' } },
  rules: {
    // TypeScript recommended
    ...tsPlugin.configs.recommended.rules,
    // React recommended
    ...reactPlugin.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    // Import order
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow unused args prefixed with _ (common in stubs)
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // TypeScript projects don't need prop-types
    'react/prop-types': 'off',
    // React 17+ new JSX transform: no need to import React
    'react/react-in-jsx-scope': 'off'
  }
}

module.exports = [ignores, base]
