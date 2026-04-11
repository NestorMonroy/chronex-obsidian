# adapters

## Descripción

Adaptadores que mapean tipos de obsidian-tasks a nuestros tipos internos.

Aislan cambios externos y mantienen independencia de obsidian-tasks.

## Módulos

### taskAdapter
Mapea Task de obsidian-tasks a ParsedTask interno.

Próximo: Implementar cuando obsidian-tasks esté integrado.

### statusAdapter
Mapea Status de obsidian-tasks a nuestro tipo TaskStatus.

Próximo: Implementar cuando obsidian-tasks esté integrado.

## Estrategia de Adaptación

```
obsidian-tasks → Adapter → Nuestros tipos
   Task.ts   →  taskAdapter  →  ParsedTask
   Status.ts →  statusAdapter →  TaskStatus
```

## Beneficios

✅ Aislamiento de cambios externos
✅ No acoplamiento directo a obsidian-tasks
✅ Fácil cambiar si obsidian-tasks cambia
✅ Tipos propios independientes
✅ Mapeo centralizado

## Estado

⏳ Próximas UC (UC-043, UC-044, UC-045)

---

**Próximo:** Implementar adapters cuando sea necesario
