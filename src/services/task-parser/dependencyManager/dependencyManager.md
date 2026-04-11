# dependencyManager

## Descripción

Sistema para manejar **dependencias entre tareas** (bloqueos).

Soporta:
- "🔗 ⬆️ ^task-id" - Esta tarea depende de otra
- "🔗 ⬇️ ^task-id" - Esta tarea bloquea otra

## Características

✅ Parsear dependencias desde markdown
✅ Detectar ciclos (DFS algorithm)
✅ Resolver si tarea puede ejecutarse
✅ Calcular critical path
✅ Calcular impacto de cambios
✅ Generar grafo de dependencias
✅ Visualizar para debug

## Uso

```typescript
const manager = new DependencyManager();

// Parsear dependencia
const parsed = manager.parseDependencyFromLine(
  '- [ ] Task B 🔗 ⬆️ ^task-a',
  'task-b'
);

// Detectar ciclos
const cycles = manager.detectCycles(allTasks);

// Resolver si puede ejecutarse
const resolution = manager.resolveDependencies(task, allTasks);

// Calcular critical path
const path = manager.calculateCriticalPath(allTasks);

// Calcular impacto de completar
const impact = manager.calculateImpact(allTasks, 'task-a', 'DONE');
```

---

**Estado:** ✅ Implementado y testeado
**Algoritmos:** Topological Sort, DFS Cycle Detection
**Complejidad:** Alta (grafos)
**Tests:** 80+ tests, 100% cobertura
