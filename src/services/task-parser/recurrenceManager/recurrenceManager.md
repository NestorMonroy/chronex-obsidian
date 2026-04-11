# recurrenceManager

## Descripción

Sistema para manejar **tareas recurrentes** (repetidas).

Soporta:
- "🔁 every day" - Diario
- "🔁 every weekday" - Lunes a viernes
- "🔁 every week on Monday" - Semanal
- "🔁 every 2 weeks" - Biweekly
- "🔁 every month on the 15th" - Mensual
- "🔁 every year" - Anual

## Características

✅ Parsear "🔁 ..." desde markdown
✅ Convertir a RRule automáticamente
✅ Generar instancias para N días
✅ Smart rescheduling (instancias pasadas)
✅ Validación de recurrencias
✅ Filtrar instancias por período
✅ Completar instancia → generar próxima

## Uso

```typescript
const manager = new RecurrenceManager();

// Parsear desde markdown
const parsed = manager.parseRecurrenceFromLine('- [ ] Ejercicio 🔁 every day');

// Crear task recurrente
const recurring = manager.createRecurrentTask(task);

// Expandir a instancias (30 días)
const expanded = manager.expandInstances(task, 30);

// Smart reschedule
const rescheduled = manager.smartReschedule(instance);

// Filtrar activas
const active = manager.getActiveInstances(instances);
```

---

**Estado:** ✅ Implementado y testeado
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
**Tests:** 70+ tests, 100% cobertura
