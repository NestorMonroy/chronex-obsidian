# taskCollector

## Descripción

Sistema integrado para **coleccionar tasks** del Vault y **procesar templates mejorados**.

Dos componentes en uno:

1. **TaskCollector** - Recopilar y filtrar tasks
2. **TemplateEngine** - Resolver variables dinámicas e includes

## Características

### TaskCollector

✅ Coleccionar tasks de múltiples archivos
✅ Filtrar por fecha (hoy, semana, mes, vencidas)
✅ Filtrar por status (TODO, DONE, IN_PROGRESS)
✅ Filtrar por prioridad (ALTA, MEDIA, BAJA)
✅ Filtrar por tags
✅ Filtrar por carpeta
✅ Agrupar (por carpeta, status, prioridad)
✅ Estadísticas y análisis

### TemplateEngine

✅ Resolver {{VALUE:uniqueId}}, {{VALUE:currentDate}}, etc
✅ Procesar includes <% tp.file.include(...) %>
✅ Validar UIDs únicos
✅ Validar frontmatter completo
✅ Validar alias y tags
✅ Mezclar QuickAdd {{VALUE:...}} + Templater <% %>
✅ Procesamiento seguro de templates

## Uso

```typescript
const collector = new TaskCollector();
const engine = new TemplateEngine();

// Coleccionar tasks
const tasks = await collector.collectAllTasks('./vault');

// Filtrar
const todayTasks = collector.filterByDate(tasks, { type: 'today' });
const urgentTasks = collector.filterByPriority(tasks, 'ALTA');

// Agrupar
const grouped = collector.groupByStatus(tasks);

// Estadísticas
const stats = collector.getStatistics(tasks);

// Procesar template
const template = `---
UID: {{VALUE:uniqueId}}
date: {{VALUE:currentDate}}
---
# {{VALUE:fileName}}`;

const context = {
  variables: { uniqueId: 'task-123', currentDate: '2026-04-11', fileName: 'Mi Tarea' },
  folderPath: 'inbox',
  fileName: 'Mi Tarea.md'
};

const processed = engine.processMixins(template, context);

// Validar
const validation = engine.validateTemplate(template);
```

---

**Estado:** ✅ Implementado y testeado
**Tests:** 75+ tests, 100% cobertura
**Componentes:** TaskCollector + TemplateEngine
**Funcionalidad:** Colección, filtrado, agrupación, templates profesionales
