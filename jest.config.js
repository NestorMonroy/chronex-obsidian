export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 10000,
  verbose: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2017',
        lib: ['ES2017'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node'
      }
    }]
  }
};
