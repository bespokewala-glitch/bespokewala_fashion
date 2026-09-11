import type { Config } from 'jest';

// jose is ESM-only — we need to allow ts-jest to transform it
const ESM_MODULES = ['jose', '@panva', 'oidc-token-hash'].join('|');

const config: Config = {
  projects: [
    // ── Node environment: pure unit tests (no DB, no network) ─────────────────
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|mjs)$': ['ts-jest', {
          tsconfig: {
            moduleResolution: 'node',
            esModuleInterop: true,
            allowJs: true,
          },
          useESM: false,
        }],
      },
      // Allow jest to transform ESM packages from node_modules
      transformIgnorePatterns: [
        `/node_modules/(?!${ESM_MODULES})`,
      ],
    },
    // ── Node environment: API integration tests (uses mongodb-memory-server) ───
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/api/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|mjs)$': ['ts-jest', {
          tsconfig: {
            moduleResolution: 'node',
            esModuleInterop: true,
            allowJs: true,
          },
        }],
      },
      transformIgnorePatterns: [
        `/node_modules/(?!${ESM_MODULES})`,
      ],
      setupFiles: ['<rootDir>/tests/__helpers__/setEnv.ts'],
      globalSetup: '<rootDir>/tests/__helpers__/globalSetup.ts',
      globalTeardown: '<rootDir>/tests/__helpers__/globalTeardown.ts',
      testTimeout: 30000,
    },
    // ── jsdom environment: React component tests ──────────────────────────────
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/components/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.css$': '<rootDir>/tests/__helpers__/styleMock.ts',
      },
      transform: {
        '^.+\\.(ts|tsx|js|mjs)$': ['ts-jest', {
          tsconfig: {
            moduleResolution: 'node',
            esModuleInterop: true,
            jsx: 'react-jsx',
          },
        }],
      },
      transformIgnorePatterns: [
        `/node_modules/(?!${ESM_MODULES})`,
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/__helpers__/jestSetup.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    'src/context/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};

export default config;
