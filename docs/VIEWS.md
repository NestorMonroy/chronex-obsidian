# Views Personalizadas - chronex-obsidian

## Descripción General

Las vistas personalizadas permiten visualizar los proyectos, objetivos y tareas de formas diferentes y útiles.

## 1. Projects Dashboard

**Tipo**: `chronex-obsidian-projects`
**Icono**: briefcase
**Comando**: "Open Projects Dashboard"

### Features

- **Estadísticas en tiempo real**
  - Total de proyectos
  - Proyectos activos
  - Total de objetivos
  - Proyectos archivados

- **Tabla de proyectos interactiva**
  - Nombre del proyecto (clickeable)
  - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA)
  - Estado (activo, archivado)
  - Número de objetivos
  - Fecha de creación

- **Operaciones**
  - Hacer click en nombre para abrir proyecto
  - Botón "Refresh" para actualizar
  - Botón "New Project" para crear proyecto
  - Auto-refresh cada 60 segundos

### Ejemplo

```
Projects Dashboard
┌────────────────────────────────────────┐
│ 5 Total Projects | 4 Active | 8 Objectives │ 1 Archived
├────────────────────────────────────────┤
│ Project Name          │ Priority │ Status   │ Objectives
├─────────────────────────────────────────┤
│ Sistema 2026          │ ALTA     │ activo   │ 4
│ Research Initiative   │ MEDIA    │ activo   │ 2
│ Documentation        │ MEDIA    │ activo   │ 1
└────────────────────────────────────────┘
```

## 2. Tasks Calendar

**Tipo**: `chronex-obsidian-tasks-calendar`
**Icono**: calendar
**Comando**: "Open Tasks Calendar"

### Features

- **Calendario interactivo del mes**
  - Grid 7 columnas (Dom-Sab)
  - Días con tareas marcados
  - Badge con número de tareas
  - Navegación de meses

- **Vista de tareas próximas (7 días)**
  - Tareas ordenadas por fecha
  - Prioridad codificada por color
  - Estado actual (pendiente, completa)
  - Fecha de vencimiento

- **Filtros**
  - Solo muestra tareas con dueDate
  - Próximas 7 días para sección de upcoming

### Ejemplo

```
Tasks Calendar

April 2026
┌─────────────────────────────────────────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────────────────────────────────────────┤
│  26 │ 27  │ 28  │ 29  │ 30  │  1  │  2  │
│  3  │  4  │  5  │  6  │  7  │  8  │  9  │
│  10 │ 11  │ 12  │ 13  │ 14  │ 15  │ 16  │
│     │  2  │  1  │     │  3  │     │  1  │ (task count badges)
└─────────────────────────────────────────┘

Upcoming Tasks (Next 7 Days)
─────────────────────────────
Configure API - Due: 2026-04-15 [Pending]
Write Documentation - Due: 2026-04-18 [In Progress]
Deploy v1.0 - Due: 2026-04-20 [Pending]
```

## 3. Tasks Kanban

**Tipo**: `chronex-obsidian-kanban`
**Icono**: trello
**Comando**: "Open Tasks Kanban"

### Features

- **4 columnas de estado**
  1. Pending (Pendiente)
  2. In Progress (En Progreso)
  3. Completed (Completada)
  4. Archived (Archivado)

- **Tarjetas de tarea**
  - Título
  - Prioridad (codificado por color)
  - Fecha de vencimiento (si existe)
  - Contador de tareas por columna

- **Efectos visuales**
  - Hover para elevar tarjeta
  - Colores de prioridad consistentes
  - Responsive layout con grid

### Ejemplo

```
Tasks Kanban Board

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Pending (4) │ In Prog (2) │ Completed(3)│ Archived(1) │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Task 1  │ │ │ Task 5  │ │ │ Task 7  │ │ │ Task 10 │ │
│ │ HIGH    │ │ │ MEDIA   │ │ │ LOW     │ │ │ MEDIA   │ │
│ │ Due:... │ │ │ Due:... │ │ │ Done    │ │ │ Archived│ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
│             │             │             │             │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │             │
│ │ Task 2  │ │ │ Task 6  │ │ │ Task 8  │ │             │
│ │ CRITICAL│ │ │ ALTA    │ │ │ MEDIA   │ │             │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Codificación de Colores (Prioridades)

```
BAJA      → Azul (#64b5f6)
MEDIA     → Verde (#81c784)
ALTA      → Naranja (#ffb74d)
CRÍTICA   → Rojo (#ef5350)
```

## Atajos de Teclado

No hay atajos predefinidos, pero puedes agregarlos en Obsidian Settings.

## Comandos

```
Ctrl/Cmd+P: "Open Projects Dashboard"
Ctrl/Cmd+P: "Open Tasks Calendar"
Ctrl/Cmd+P: "Open Tasks Kanban"
```

## Integración con Servicios

Todas las vistas conectan con:
- ProjectServiceWithVault
- ObjectiveServiceWithVault
- TaskServiceWithVault
- ObsidianVaultAdapter

Los datos se actualizan en tiempo real desde el vault.

## Personalización

### Cambiar panel de apertura

En `main.ts`, método `registerViews()`:

```typescript
// Cambiar de panel derecho a panel izquierdo
const leaf = this.app.workspace.getLeftLeaf(false);
// O cualquier otra combinación
```

### Modificar Auto-refresh

En `ProjectsView.ts`, método `onOpen()`:

```typescript
// Cambiar intervalo de 60 segundos a otro valor (en milisegundos)
this.registerInterval(window.setInterval(() => this.refresh(), 30000));
```

## Limitaciones Actuales

- No hay drag & drop en Kanban (próxima versión)
- No hay filtros avanzados (próxima versión)
- Las vistas son de lectura principalmente
- No se pueden editar tareas directamente desde Kanban

## Próximas Mejoras

- [ ] Drag & drop de tarjetas Kanban
- [ ] Filtros por prioridad, estado, proyecto
- [ ] Editar tareas directamente desde vistas
- [ ] Estadísticas gráficas
- [ ] Exportar datos
- [ ] Temas personalizables

