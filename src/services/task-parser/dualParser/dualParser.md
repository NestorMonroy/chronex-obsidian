# dualParser

## Descripción

Parser dual que permite usar obsidian-tasks y nuestro sistema en paralelo.

Migración gradual sin romper tareas existentes.

## Características

✅ parseWithFallback() - parsear con fallback automático
✅ parseMultipleWithFallback() - batch con fallback
✅ Configuración dinámica
✅ Validación opcional
✅ Logging de eventos
✅ Compatibilidad bidireccional

## Uso

```typescript
import { DualParser } from './services/obsidian-tasks/dualParser';

const parser = new DualParser();

// Configurar
parser.setConfig({
  preferObsidianTasks: true,
  fallbackOnError: true,
  validateResults: true,
  logSource: true
});

// Parsear con fallback
const result = parser.parseWithFallback(
  '- [ ] Mi tarea',
  { path: 'inbox.md', lineNumber: 1 }
);

// Batch
const results = parser.parseMultipleWithFallback(
  ['- [ ] Tarea 1', '- [x] Tarea 2'],
  { path: 'inbox.md', lineNumber: 1 }
);

// Eventos
const events = parser.getEvents();
parser.clearEvents();
```

## Configuración

| Opción | Default | Descripción |
|--------|---------|-------------|
| preferObsidianTasks | false | ¿Preferir obsidian-tasks? |
| fallbackOnError | true | ¿Usar fallback si error? |
| validateResults | true | ¿Validar resultado? |
| logSource | false | ¿Log de fuente? |

## Estructura

```
dualParser/
├─ dualParser.md      (este archivo)
├─ types.ts           (interfaces)
├─ dualParser.ts      (implementación)
└─ index.ts           (exports)
```

## Tests

Ver `tests/unit/dualParser.test.ts` para 32+ tests.

---

**Estado:** ✅ Implementado y testeado
**Cobertura:** 32+ tests, 100% cobertura
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
