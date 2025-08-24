import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@packages/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@packages/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/src/$1'
  }
}

export default config
