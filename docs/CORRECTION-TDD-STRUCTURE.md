# Corrección: Violación de Estructura y TDD

**Fecha:** Abril 11, 2026
**Problema:** Violamos estructura de vault y principios TDD
**Estado:** Analizado y corregido

## Qué Salió Mal

### 1. Violación de Estructura de Vault

**Convención Actual (CORRECTA):**
```
400-DIARIO/
└─ 410-🌄DAILY/
   └─ YYYY-MM-DD.md  ← FOLDERNOTE (archivo con mismo nombre de carpeta)

990-UTILIDADES/
└─ 992-script/
   └─ common/
      ├─ generateUniqueId.js
      └─ createFleetingNote.js
```

**Lo que hicimos (INCORRECTO):**
```
src/thirdparty/obsidian-tasks/
├─ Task/                    ❌ SIN Task.md (FOLDERNOTE)
├─ TaskSerializer/          ❌ SIN TaskSerializer.md
├─ Statuses/                ❌ SIN Statuses.md
└─ DateTime/                ❌ SIN DateTime.md
                            ❌ SIN obsidian-tasks.md (INDEX)
```

**Problema:** Cada carpeta DEBE tener un INDEX con el mismo nombre.

### 2. Violación de TDD

**TDD Correcto (RED → GREEN → REFACTOR):**
1. Escribir TESTS primero (especificación)
2. Tests fallan (RED)
3. Escribir código mínimo para pasar tests (GREEN)
4. Refactorizar (REFACTOR)
5. Iterar

**Lo que hicimos (ANTIPATRÓN):**
1. ❌ Copiar 30 archivos obsidian-tasks
2. ❌ Crear estructura sin plan
3. ❌ Escribir código (TaskParser.ts)
4. ❌ Escribir tests DESPUÉS (tests confirman, no especifican)

**Resultado:** Code-Driven, no Test-Driven

### 3. Acoplamiento Fuerte

- ❌ Dependencia directa de 30 archivos obsidian-tasks
- ❌ Imports complejos: `from '../../../thirdparty/obsidian-tasks/Task/Task'`
- ❌ Difícil de cambiar o actualizar obsidian-tasks
- ❌ No hay adapters para mapeo de tipos

## Solución: Cómo Hacerlo Correctamente

### FASE 1: TDD - TESTS PRIMERO

Escribir `tests/unit/UC-040.TaskParser.test.ts`:

```typescript
describe('UC-040: TaskParser - Parsear Task', () => {
  test('debe parsear línea simple', () => {
    const result = TaskParser.parseTaskFromLine(
      '- [ ] Mi tarea',
      { path: 'inbox.md', lineNumber: 1 }
    );
    
    expect(result.success).toBe(true);
    expect(result.task?.description).toBe('Mi tarea');
    expect(result.task?.status).toBe('TODO');
  });
  
  // Más tests que definen QUÉ queremos
  // - Extracción de fechas
  // - Extracción de prioridad
  // - Validación
  // - Batch parsing
  // - Edge cases
});
```

**Tests definen:**
- Interface de `TaskParser`
- Comportamiento esperado
- Validaciones
- Error handling

### FASE 2: ESTRUCTURA CORRECTA

```
src/
├─ services/
│  └─ obsidian-tasks/
│     ├─ obsidian-tasks.md         ← INDEX (FOLDERNOTE)
│     │  # obsidian-tasks
│     │  Sistema de integración con obsidian-tasks
│     │  - TaskParser: parsing robusto
│     │  - Adapters: mapeo de tipos
│     │
│     ├─ TaskParser.ts              ← Implementación
│     ├─ TaskParser.test.ts         ← Tests (ya escritos)
│     │
│     └─ adapters/
│        ├─ adapters.md             ← INDEX
│        │  # Adapters
│        │  Mapeo entre tipos obsidian-tasks y nuestros tipos
│        │
│        ├─ TaskAdapter.ts          ← obsidian-tasks Task → nuestro Task
│        ├─ TaskAdapter.test.ts
│        ├─ StatusAdapter.ts        ← obsidian-tasks Status → nuestro Status
│        └─ StatusAdapter.test.ts
│
└─ thirdparty/
   └─ thirdparty.md                 ← INDEX (documentación)
      # Third Party Libraries
      Documentación de integraciones externas
```

**Ventajas:**
- ✅ Estructura consistente con vault
- ✅ Cada carpeta tiene su INDEX
- ✅ Imports limpios: `from './services/obsidian-tasks'`
- ✅ Adapters aislan cambios externos
- ✅ Modular y escalable

### FASE 3: IMPLEMENTACIÓN (hace pasar tests)

Implementar `TaskParser.ts`:
```typescript
export class TaskParser {
  static parseTaskFromLine(line: string, location: TaskLocation) {
    // Código mínimo para pasar tests
    // Validación
    // Parsing de markdown
    // Extracción de propiedades
    // Retornar ParsedTaskResult
  }
}
```

**Principios:**
- ✅ Código simple
- ✅ Hace pasar tests
- ✅ No especulación
- ✅ Solo lo necesario

### FASE 4: REFACTOR (mejora, tests siguen pasando)

- Mejorar performance
- Optimizar validación
- Limpiar código
- **Tests siguen pasando siempre**

## Lecciones Aprendidas

| Aspecto | ❌ Incorrecto | ✅ Correcto |
|---------|--------------|-----------|
| **Orden** | Código → Tests | Tests → Código |
| **Estructura** | Sin índices | Con FolderNotes |
| **Acoplamiento** | Directo | Adapters |
| **Especificación** | Implícita en código | Explícita en tests |
| **Refactor** | Arriesgado | Seguro (tests guardan) |
| **Mantenibilidad** | Difícil | Fácil |

## Próximos Pasos (CORRECTOS)

### SEMANA 1: Fundamentos (TDD)

**Lunes-Martes:** UC-040 TaskParser
- [ ] Escribir 50+ tests primero
- [ ] Crear estructura correcta
- [ ] Implementar para pasar tests
- [ ] Refactor

**Miércoles-Jueves:** UC-043 Status Registry
- [ ] Tests primero
- [ ] Estructura correcta
- [ ] Implementación

**Viernes:** UC-049 Compatibilidad Dual
- [ ] Tests primero
- [ ] Implementación

### SEMANA 2-4: Características Core + Migración (TDD)

Mismo patrón:
1. Tests primero
2. Estructura correcta
3. Implementación
4. Refactor

## Referencias

- **TDD:** Red → Green → Refactor
- **Structure:** FolderNote = nombre carpeta
- **Modularity:** Adapters aislan cambios
- **Quality:** Tests definen especificación

---

**Conclusión:** Estructura + TDD = Código mantenible, escalable y de calidad.

