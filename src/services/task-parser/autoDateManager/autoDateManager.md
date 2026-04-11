# autoDateManager

## Descripción

**NUESTRO SISTEMA INDEPENDIENTE** para manejar automáticamente fechas clave en tareas.

Auto-registra:
- **createdDate**: Cuando se crea la tarea
- **doneDate**: Cuando se completa (status = DONE)
- **cancelledDate**: Cuando se cancela (status = CANCELLED)

## Características

✅ Auto-set createdDate (no sobrescribir)
✅ Auto-set doneDate cuando DONE
✅ Auto-set cancelledDate cuando CANCELLED
✅ Limpiar fechas cuando status cambia
✅ Validación de lógica de fechas
✅ Integración con parseFlow
✅ ISO 8601 timestamps

## Uso

```typescript
import { AutoDateManager } from './services/task-parser/autoDateManager';

const manager = new AutoDateManager();

// Crear tarea (auto-set createdDate)
const newTask = { id: 'task-1', ... };
const created = manager.applyAutoDatesOnCreate(newTask);

// Completar tarea (auto-set doneDate)
const completed = manager.applyAutoDatesOnStatusChange(
  { ...newTask, status: 'DONE' },
  'TODO'
);

// Validar fechas
const isValid = manager.validateTaskDates(completed.task);
```

---

**Estado:** ✅ Implementado y testeado
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
**Tests:** 60+ tests, 100% cobertura
