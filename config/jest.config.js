/**
 * Jest Configuration
 * Configuración de testing para obsidian-repo
 * 
 * FASE 1: Setup de testing
 * 
 * @file config/jest.config.js
 * @version 1.0.0
 * @date 2026-04-11
 */

export default {
  // Environment: Node (sin DOM de jsdom)
  testEnvironment: 'node',
  
  // Transform: usar módulos ES6
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  
  // Patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/**/*.spec.js'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Threshold estricto para módulos utils (responsabilidad única)
    './src/utils/**/*.js': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],
  
  // Timeout (algunas operaciones pueden tardar)
  testTimeout: 10000,
  
  // Setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Module aliases (para imports más claros)
  moduleNameMapper: {
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/scripts/(.*)$': '<rootDir>/src/scripts/$1'
  },
  
  // Globals
  globals: {
    // Si necesitas variables globales de test
  },
  
  // Verbose output
  verbose: true,
  
  // Color output
  colors: true,
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml'
      }
    ]
  ]
};
