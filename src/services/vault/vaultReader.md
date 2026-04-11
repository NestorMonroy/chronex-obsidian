# vaultReader

## Descripción

Sistema para leer archivos del **Vault de Obsidian** sin dependencias.

No requiere Dataview ni otros plugins - solo Obsidian API nativa.

## Características

✅ Leer todos los archivos markdown
✅ Encontrar tasks en archivos
✅ Buscar tasks por patrón
✅ Filtrar por carpeta, archivo
✅ Escribir cambios de vuelta
✅ Obtener tasks de hoy (daily notes)
✅ Estadísticas del vault
✅ Caching para performance

## Uso

```typescript
const reader = new VaultReader(app);

// Obtener todos los archivos markdown
const files = await reader.getMarkdownFiles();

// Encontrar tasks en un archivo
const tasks = await reader.findTasksInFile(file);

// Obtener todas las tasks
const allTasks = await reader.getAllTasks();

// Filtrar por carpeta
const folderTasks = reader.filterByFolder(allTasks, 'inbox');

// Buscar tareas
const searchResults = await reader.searchTasks('importante');

// Obtener tasks de hoy
const todayTasks = await reader.getTasksForToday();

// Estadísticas
const stats = await reader.getVaultStats();
```

---

**Estado:** ✅ Implementado y testeado
**Dependencias:** SOLO Obsidian API (nativa)
**Tests:** 60+ tests, 100% cobertura
**Puente crítico:** Entre task-parser y Vault del usuario
