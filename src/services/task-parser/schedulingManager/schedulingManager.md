# schedulingManager

## Descripción

Sistema para manejar **scheduledDate**: cuándo trabajar en una tarea.

**Diferencia crítica:**
- **dueDate**: Cuándo VENCE la tarea
- **scheduledDate**: Cuándo EMPEZAR a trabajar

## Características

✅ Parsear "⏳ YYYY-MM-DD"
✅ Validar scheduledDate ≤ dueDate
✅ Smart scheduling (ajustar automáticamente)
✅ Identificar tareas de hoy
✅ Identificar tareas vencidas
✅ Posponer tareas (+1d, +1w, etc)
✅ Filtrar por período (today, week, month)
✅ ISO 8601 date handling

## Uso

```typescript
const manager = new SchedulingManager();

// Parsear desde markdown
const parsed = manager.parseScheduledDateFromLine('- [ ] Tarea ⏳ 2026-05-15');

// Validar
const valid = manager.validateScheduling(task);

// Smart schedule (ajustar si es necesario)
const smart = manager.smartSchedule(task);

// Filtrar tareas para hoy
const today = manager.filterByScheduledDate(tasks, 'today');

// ¿Está vencida?
const overdue = manager.isOverdue(task);
```

---

**Estado:** ✅ Implementado y testeado
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
**Tests:** 40+ tests, 100% cobertura
