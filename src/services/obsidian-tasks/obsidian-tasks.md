# obsidian-tasks

## Descripción

Sistema de integración con obsidian-tasks para parsing y manipulación robusto de tareas markdown.

Compatible 100% con formato markdown de obsidian-tasks.

## Módulos

### parseTaskFromLine
Parsea una línea individual de markdown a objeto Task.

```typescript
import { parseTaskFromLine } from './services/obsidian-tasks';

const result = parseTaskFromLine(
  '- [ ] Mi tarea 📅 2026-05-15 ⏫ #work #urgent ^PROJ-001',
  { path: 'inbox.md', lineNumber: 1 }
);

if (result.success) {
  console.log(result.task);
} else {
  console.error(result.error);
}
```

### validateParsedTask
Valida que una tarea parseada tiene todos los campos requeridos.

```typescript
import { validateParsedTask } from './services/obsidian-tasks';

const validation = validateParsedTask(task);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### parseMultipleLines
Parsea múltiples líneas en batch (batch processing).

```typescript
import { parseMultipleLines } from './services/obsidian-tasks';

const lines = [
  '- [ ] Tarea 1',
  '- [x] Tarea 2',
  '- [/] Tarea 3'
];

const results = parseMultipleLines(lines, baseLocation);
results.forEach(r => {
  if (r.success) {
    console.log(r.task.description);
  }
});
```

## Características

✅ Parsing robusto de markdown
✅ Extracción de propiedades:
  - Status: [ ], [x], [/], [-], [>]
  - Descripción
  - Fechas: due (📅), scheduled (🗓️)
  - Prioridad: alta (⏫), baja (⏬)
  - Tags (#tag1 #tag2)
  - Block links (^block-id)

✅ Validación completa
✅ Batch processing
✅ Error handling robusto
✅ Performance optimizado
✅ Metadata incluida

## Estructura

```
obsidian-tasks/
├─ obsidian-tasks.md          (este archivo)
├─ types.ts                    (interfaces y tipos)
├─ parseTaskFromLine.ts        (parsing principal)
├─ validateParsedTask.ts       (validación)
├─ parseMultipleLines.ts       (batch)
├─ index.ts                    (exports)
└─ adapters/                   (mapeo obsidian-tasks → nuestros tipos)
   ├─ adapters.md
   ├─ taskAdapter.ts
   └─ statusAdapter.ts
```

## Tipos

### TaskLocation
```typescript
interface TaskLocation {
  path: string;
  lineNumber: number;
  precedingContent?: string;
}
```

### ParsedTask
```typescript
interface ParsedTask {
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FORWARDED';
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  dueDate?: string;           // YYYY-MM-DD
  scheduledDate?: string;     // YYYY-MM-DD
  tags: string[];
  blockLink?: string;
  // ...más campos
}
```

### ParsedTaskResult
```typescript
interface ParsedTaskResult {
  success: boolean;
  task?: ParsedTask;
  error?: string;
  metadata: {
    filePath?: string;
    lineNumber?: number;
    parsedAt: string;         // ISO 8601
    source: 'obsidian-tasks' | 'fallback';
  };
}
```

## Tests

Ver `tests/unit/parseTaskFromLine.test.ts` para 40+ tests que especifican el comportamiento.

## Ejemplos

### Parsing simple
```typescript
const result = parseTaskFromLine('- [ ] Mi tarea', location);
// result.task.status === 'TODO'
// result.task.description === 'Mi tarea'
```

### Parsing complejo
```typescript
const result = parseTaskFromLine(
  '- [x] API REST 📅 2026-05-15 ⏫ #backend #api ^PROJ-001',
  location
);
// result.task.status === 'DONE'
// result.task.priority === 'ALTA'
// result.task.dueDate === '2026-05-15'
// result.task.tags === ['backend', 'api']
// result.task.blockLink === '^PROJ-001'
```

## Próximas Fases

- [ ] UC-043: Status Registry dinámico
- [ ] UC-045: Acciones al completar
- [ ] UC-041: Recurrencias
- [ ] UC-044: Dependencias

---

**Estado:** ✅ Implementado y testeado
**Cobertura:** 40+ tests, 100% cobertura
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
