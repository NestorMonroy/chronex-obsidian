/**
 * ESLint Configuration
 * Configuración de linter para obsidian-repo
 * 
 * Aplica convenciones de FASE 1
 * 
 * @file config/eslint.config.js
 * @version 1.0.0
 * @date 2026-04-11
 */

export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Obsidian globals
        app: 'readonly',
        obsidian: 'readonly',
        
        // QuickAdd globals
        quickAddApi: 'readonly',
        
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    
    rules: {
      // Errores (deben arreglarse)
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      'no-debugger': 'error',
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'no-use-before-define': ['error', { functions: false }],
      'no-redeclare': 'error',
      'no-duplicate-imports': 'error',
      'no-const-assign': 'error',
      'no-class-assign': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'no-this-before-super': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-import-assign': 'error',
      'no-setter-return': 'error',
      
      // Warnings (avisos, revisar)
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'always'],
      'no-implicit-coercion': 'warn',
      'no-shadow': ['warn', { builtinGlobals: false, allow: [] }],
      'no-nested-ternary': 'warn',
      'complexity': ['warn', { max: 5 }],
      'max-depth': ['warn', { max: 3 }],
      'max-nested-callbacks': ['warn', { max: 3 }],
      
      // Estilo (lowercase importante pero no bloqueante)
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2],
      'comma-dangle': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'eol-last': ['warn', 'always'],
      'space-before-function-paren': ['warn', 'never'],
      'keyword-spacing': 'warn',
      'space-infix-ops': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'computed-property-spacing': ['warn', 'never'],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }]
    }
  },
  
  // Overrides para tests
  {
    files: ['tests/**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { args: 'all', argsIgnorePattern: '^_' }]
    }
  }
];
