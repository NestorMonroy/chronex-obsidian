```yaml
type: Guía de Convenciones
title: CONVENCIONES DE CÓDIGO - obsidian-repo
version: 1.0.0
scope: FASE 1 - Convenciones y Base
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Convenciones definidas
```

# CONVENCIONES DE CÓDIGO - obsidian-repo

## FASE 1: Convenciones y Base (7 horas)

---

## INTRODUCCIÓN

Este documento define las convenciones de código para el proyecto obsidian-repo. Aplican a:
- Scripts orquestadores (5 archivos en `src/scripts/`)
- Módulos utils (8+ archivos en `src/utils/`)
- Tests (60+ casos en `tests/`)

**Objetivo**: Código consistente, legible, mantenible

---

## 1. ESTRUCTURA DE ARCHIVOS

### Nombres de Archivos

```javascript
// Scripts orquestadores (camelCase)
createRepository.js
createTask.js
createProject.js
createPillar.js
createRepositoryNote.js

// Módulos utils (camelCase)
validateCommonInput.js
generateUniqueId.js
getCurrentDateTime.js
getFileName.js
getAuthorName.js
getGrandParentFolder.js
getMetadataByFrontmatter.js
showNotification.js

// Tests (camelCase + .test.js)
validateCommonInput.test.js
generateUniqueId.test.js
createRepository.test.js
```

### Estructura Interna

```javascript
// Encabezado
/**
 * Módulo: Descripción breve
 * @module src/utils/validateCommonInput
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

// Imports (ordenados)
import { app } from 'obsidian';
import { QuickAddApi } from 'quickadd';
import { helperFunction } from './helper.js';

// Constantes
const CONSTANTS = {};

// Función principal (exportada por defecto o nombrada)
export default function mainFunction() {
  // Implementación
}

// Funciones auxiliares (no exportadas)
function helperFunction() {
  // Implementación
}
```

---

## 2. NAMING CONVENTIONS

### Variables

```javascript
// camelCase para variables comunes
const userName = 'Nestor';
const isValid = true;
const repositoryId = 'id-xxx';

// UPPERCASE para constantes
const MAX_LENGTH = 255;
const DEFAULT_PRIORITY = 'normal';
const VALID_CHARACTERS = /^[a-zA-Z0-9\-_\s]+$/;

// Prefijos para booleans
const isActive = true;
const hasMetadata = false;
const canCreate = true;
```

### Funciones

```javascript
// camelCase, verbo al inicio
function validateInput(input) { }
function generateId() { }
function fetchMetadata(path) { }
function createRepository(name) { }

// Getters (get + sustantivo)
function getFileName(title) { }
function getAuthorName() { }
function getCurrentDateTime() { }

// Setters (set + sustantivo)
function setMetadata(key, value) { }

// Predicados (is/has + adjetivo)
function isValid(input) { }
function hasError(result) { }
function canExecute(context) { }
```

### Clases (si aplica)

```javascript
// PascalCase
class RepositoryValidator { }
class IdGenerator { }
class DateTimeHelper { }
```

---

## 3. COMENTARIOS Y DOCUMENTACIÓN

### JSDoc (obligatorio para funciones exportadas)

```javascript
/**
 * Valida entrada común según reglas PASO 2.
 * 
 * @param {string} input - Valor a validar
 * @param {Object} options - Opciones de validación
 * @param {number} options.minLength - Longitud mínima (default: 3)
 * @param {number} options.maxLength - Longitud máxima (default: 255)
 * @param {RegExp} options.pattern - Patrón regex personalizado
 * 
 * @returns {Object} { isValid: boolean, errors: string[] }
 * 
 * @throws {TypeError} Si input no es string
 * @throws {RangeError} Si opciones tienen valores inválidos
 * 
 * @example
 * const result = validateCommonInput('Mi Proyecto');
 * if (result.isValid) {
 *   console.log('Válido');
 * } else {
 *   console.log('Errores:', result.errors);
 * }
 * 
 * @see https://docs.obsidian.md/
 * @see PASO2-UC-001-REPOSITORY.md#Paso-6-Validar-Entrada
 */
export function validateCommonInput(input, options = {}) {
  // Implementación
}
```

### Comentarios Inline

```javascript
// Explicar POR QUÉ, no QUÉ
// ✗ MALO:
let id = generateRandomString(16); // Generar ID aleatorio

// ✓ BUENO:
// Usar Web Crypto API en lugar de Math.random() para evitar colisiones
// (RFC 4122 UUID format con timestamp para garantizar unicidad)
let id = generateUniqueId();

// Comentarios TODO (con contexto)
// TODO: Refactorizar para usar cache de metadata (Nestor, 2026-04-15)
// Actualmente relectura desde disco en cada llamada - impacto perf: ~200ms
```

---

## 4. FUNCIONES: TAMAÑO Y COMPLEJIDAD

### Tamaño Máximo

```javascript
// Ideal: 20-30 líneas
// Máximo: 50 líneas
// Si excede → refactorizar en funciones menores

// ✓ BUENO: Función pequeña y enfocada
export function getCurrentDateTime() {
  return new Date().toISOString();
}

// ✓ BUENO: Función clara con pasos explícitos
export function validateCommonInput(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, errors: ['Input debe ser string no-vacío'] };
  }
  
  if (input.length < 3) {
    return { isValid: false, errors: ['Mínimo 3 caracteres'] };
  }
  
  if (input.length > 255) {
    return { isValid: false, errors: ['Máximo 255 caracteres'] };
  }
  
  if (!VALID_CHARACTERS.test(input)) {
    return { isValid: false, errors: ['Solo letras, números, guiones, espacios'] };
  }
  
  return { isValid: true, errors: [] };
}

// ✗ MALO: Función gigante (>100 líneas)
export function doEverything() {
  // 100+ líneas de lógica mixta
}
```

### Complejidad Ciclomática

```javascript
// Máximo: 5 branches
// Si excede → refactorizar

// ✓ BUENO: Complejidad baja
export function getStatus(priority) {
  const statuses = {
    'high': 'Urgente',
    'normal': 'Normal',
    'low': 'Baja'
  };
  return statuses[priority] || 'Desconocido';
}

// ✗ MALO: Complejidad alta (6+ if statements)
function getStatus(priority) {
  if (priority === 'high') return 'Urgente';
  if (priority === 'medium-high') return 'Importante';
  if (priority === 'normal') return 'Normal';
  if (priority === 'medium-low') return 'Baja';
  if (priority === 'low') return 'Muy baja';
  if (priority === 'zero') return 'Ignorar';
  return 'Desconocido';
}
// Refactorizar: usar map o switch
```

---

## 5. ERROR HANDLING

### Try-Catch

```javascript
// Siempre capturar con tipo específico
export async function createRepository(name) {
  try {
    const id = generateUniqueId();
    const path = `repositories/work/${id}/`;
    
    // Crear carpeta
    await app.vault.createFolder(path);
    
    return { success: true, id, path };
    
  } catch (error) {
    // Loguear detalle completo
    console.error('Error en createRepository:', {
      message: error.message,
      stack: error.stack,
      input: { name }
    });
    
    // Re-lanzar con contexto
    throw new Error(`No se pudo crear repositorio "${name}": ${error.message}`);
  }
}
```

### Excepciones Custom

```javascript
/**
 * Excepciones mapeadas de PASO 2
 */

export class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ValidationError';
    this.code = code; // E-001, E-002, etc.
  }
}

export class NotFoundError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'NotFoundError';
    this.code = code; // E-006, E-007, etc.
  }
}

// Uso
if (!input) {
  throw new ValidationError('Entrada no puede estar vacía', 'E-003');
}

if (!repository) {
  throw new NotFoundError('Repositorio no encontrado', 'E-006');
}
```

---

## 6. TESTING CONVENTIONS

### Estructura de Tests

```javascript
/**
 * Tests para validateCommonInput.js
 * @file validateCommonInput.test.js
 */

import { validateCommonInput } from '../src/utils/validateCommonInput.js';

describe('validateCommonInput', () => {
  
  // Grupo 1: Casos válidos
  describe('Entrada válida', () => {
    test('Debe aceptar cadena válida', () => {
      const result = validateCommonInput('Mi Proyecto');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('Debe aceptar longitud mínima (3 caracteres)', () => {
      const result = validateCommonInput('abc');
      expect(result.isValid).toBe(true);
    });
    
    test('Debe aceptar longitud máxima (255 caracteres)', () => {
      const input = 'a'.repeat(255);
      const result = validateCommonInput(input);
      expect(result.isValid).toBe(true);
    });
  });
  
  // Grupo 2: Casos inválidos
  describe('Entrada inválida', () => {
    test('Debe rechazar entrada vacía', () => {
      const result = validateCommonInput('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input debe ser string no-vacío');
    });
    
    test('Debe rechazar null', () => {
      const result = validateCommonInput(null);
      expect(result.isValid).toBe(false);
    });
    
    test('Debe rechazar caracteres especiales', () => {
      const result = validateCommonInput('Mi Proyecto @#$');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Solo letras, números, guiones, espacios');
    });
  });
  
  // Grupo 3: Edge cases
  describe('Edge cases', () => {
    test('Debe manejar caracteres acentuados', () => {
      const result = validateCommonInput('Análisis del Proyéctö');
      // Decidir: ¿aceptar o rechazar?
      expect(result.isValid).toBe(false); // En nuestro caso: rechazar
    });
    
    test('Debe manejar espacios múltiples', () => {
      const result = validateCommonInput('Mi   Proyecto   Grande');
      expect(result.isValid).toBe(true); // Espacio válido
    });
  });
});
```

### Cobertura Requerida

```javascript
// Coverage mínimo por tipo de módulo:

// Utils/validateCommonInput.js: 100%
// - Líneas: 100%
// - Branches: 100%
// - Functions: 100%

// Scripts/createRepository.js: 90%
// - Líneas: 90%
// - Branches: 85%
// - Functions: 90%

// Comando para verificar
npm run test -- --coverage --collectCoverageFrom='src/**/*.js'
```

---

## 7. IMPORTS Y EXPORTS

### Orden de Imports

```javascript
// 1. Built-in modules (node)
// (No aplica en Obsidian context)

// 2. Módulos externos
import { app } from 'obsidian';
import { QuickAddApi } from 'quickadd';

// 3. Módulos locales (utils)
import { validateCommonInput } from './validateCommonInput.js';
import { generateUniqueId } from './generateUniqueId.js';

// 4. Tipos/constantes
import { VALID_CHARACTERS, MAX_LENGTH } from '../constants.js';
```

### Exports

```javascript
// Prefiere named exports
export function validateInput(input) { }
export function getAuthorName() { }

// Default export solo si es la función principal del módulo
export default function createRepository(name) { }

// Re-exports (cuando lo usas como index)
// src/utils/index.js:
export { validateCommonInput } from './validateCommonInput.js';
export { generateUniqueId } from './generateUniqueId.js';
export { getCurrentDateTime } from './getCurrentDateTime.js';
```

---

## 8. ASYNC/AWAIT

### Patrones

```javascript
// ✓ BUENO: Async/await claro
export async function createRepository(name) {
  const id = generateUniqueId();
  const path = `repositories/work/${id}/`;
  
  try {
    await app.vault.createFolder(path);
    return { success: true, path };
  } catch (error) {
    throw new Error(`Falló crear carpeta: ${error.message}`);
  }
}

// ✓ BUENO: Promise.all para operaciones paralelas
export async function initializeVault() {
  const results = await Promise.all([
    createFolder('repositories'),
    createFolder('tasks'),
    createFolder('projects'),
    createFolder('pillars')
  ]);
  return results;
}

// ✗ MALO: Olvidar await
async function fetchData() {
  let data = app.vault.read(file); // ✗ Olvidó await
  return data;
}

// ✗ MALO: callback hell (No hacer)
app.vault.createFolder(path, (error) => {
  if (error) {
    // Evitar callbacks anidados
  }
});
```

---

## 9. VARIABLES Y CONSTANTES

### Scope

```javascript
// ✓ BUENO: Variables con menor scope posible
export function processData(data) {
  // Solo visible en esta función
  const processed = data.map(item => item * 2);
  
  if (processed.length > 0) {
    // Solo visible en este bloque
    const first = processed[0];
    console.log(first);
  }
  
  return processed;
}

// ✗ MALO: Variables globales innecesarias
let globalData = null; // Evitar si es posible
let globalId = null;

export function process() {
  globalData = fetchData(); // Difícil de rastrear
}
```

### Mutability

```javascript
// ✓ BUENO: Preferir const
const usuario = { name: 'Nestor', role: 'admin' };
usuario.name = 'Juan'; // OK: mutar propiedades
// pero no reasignar: usuario = {...}

// ✓ BUENO: Spread operator para inmutabilidad
const usuarioModificado = { ...usuario, name: 'Juan' };

// ✗ MALO: let innecesario
let count = 0; // Si no cambia → const
count = 5;

// ✓ BUENO: let solo cuando necesario reasignación
let currentId = null;
if (isNew) {
  currentId = generateUniqueId();
} else {
  currentId = fetchExistingId();
}
```

---

## 10. MÓDULOS UTILS: RESPONSABILIDAD ÚNICA

Cada módulo hace **UNA COSA** bien:

```javascript
// ✓ BUENO: Responsabilidad única
// src/utils/validateCommonInput.js
export function validateCommonInput(input) {
  // Solo valida entrada común
  // No crea archivos, no genera IDs, etc.
}

// ✓ BUENO: Responsabilidad única
// src/utils/generateUniqueId.js
export function generateUniqueId() {
  // Solo genera IDs únicos
  // No valida entrada, no crea archivos, etc.
}

// ✗ MALO: Múltiples responsabilidades
export function createRepositoryAndValidate(name) {
  // Valida (responsabilidad 1)
  // Genera ID (responsabilidad 2)
  // Crea carpeta (responsabilidad 3)
  // Demasiadas responsabilidades
}

// Refactorizar:
export async function createRepository(name) {
  validateCommonInput(name); // Delegar a función de validación
  const id = generateUniqueId(); // Delegar a función de ID
  await createFolder(id); // Delegar a función de carpeta
}
```

---

## 11. LOGGING

### Niveles de Log

```javascript
// DEBUG: Información de debug (desarrollo)
console.debug('Valor de variable:', variable);

// INFO: Información general (ejecución normal)
console.log('Operación completada:', result);

// WARN: Advertencias (algo inesperado pero continuable)
console.warn('Archivo no encontrado, usando default');

// ERROR: Errores (algo salió mal)
console.error('Error al crear repositorio:', error);

// Estructura de log (siempre incluir contexto)
console.error('Error en createRepository', {
  message: error.message,
  code: error.code,
  input: { name },
  stack: error.stack
});
```

---

## 12. LINTING Y FORMATTING

### ESLint Config (viene en FASE 1)

```javascript
// .eslintrc.js
export default {
  env: {
    es2022: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': 'error',
    'curly': 'error'
  }
};
```

### Ejecutar Linter

```bash
# Validar código
npm run lint

# Fijar problemas automáticamente
npm run lint:fix
```

---

## CHECKLIST FASE 1

- [ ] Leer esta documentación completa
- [ ] Configurar ESLint (config/eslint.config.js)
- [ ] Configurar Jest (config/jest.config.js)
- [ ] Crear stubs de 8 módulos utils
- [ ] Crear tests stubs (al menos 1 test por módulo)
- [ ] Ejecutar linter sin errores
- [ ] Ejecutar tests (todos deberían fallar - TDD)
- [ ] Documentar convenciones en docs/CONVENTIONS.md

---

**DOCUMENTO**: CONVENCIONES-FASE1.md  
**VERSIÓN**: 1.0.0  
**FECHA**: 2026-04-11  
**STATUS**: CONVENCIONES DEFINIDAS - LISTO PARA IMPLEMENTACIÓN
