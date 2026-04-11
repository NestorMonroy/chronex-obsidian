# taskCompletionHandler

## Descripción

**NUESTRO SISTEMA INDEPENDIENTE** para ejecutar acciones al completar tareas.

Permite registrar acciones y hooks que se ejecutan automáticamente cuando una tarea cambia de status.

## Características

✅ Registrar acciones (log, archive, notify, webhook, custom)
✅ Registrar hooks personalizados
✅ Ejecutar por prioridad
✅ Condiciones/filtros
✅ Historial de ejecuciones
✅ Error handling robusto
✅ 5 tipos de acciones

## Uso

```typescript
import { TaskCompletionHandler } from './services/task-parser/taskCompletionHandler';

const handler = new TaskCompletionHandler();

// Registrar acción
handler.registerAction({
  id: 'log-action',
  type: 'log',
  enabled: true,
  priority: 1
});

// Registrar hook
handler.registerHook('my-hook', (event) => {
  console.log('Task completed:', event.taskDescription);
});

// Ejecutar cuando tarea se completa
const results = handler.executeActionsOnCompletion({
  taskId: 'task-1',
  taskDescription: 'Mi tarea',
  previousStatus: 'TODO',
  newStatus: 'DONE',
  timestamp: new Date().toISOString()
});
```

## Tipos de Acciones

| Type | Descripción |
|------|-------------|
| log | Loguear a consola |
| archive | Archivar tarea |
| notify | Notificar |
| webhook | Llamar webhook |
| custom | Función personalizada |

---

**Estado:** ✅ Implementado y testeado
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
