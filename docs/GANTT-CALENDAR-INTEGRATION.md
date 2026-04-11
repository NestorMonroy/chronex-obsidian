# INTEGRACIÓN GANTT-CALENDAR EN OBSIDIAN-REPO

**Plan para integrar funcionalidades de obsidian-gantt-calendar sin dependencia externa**

---

## 🎯 OBJETIVO

Integrar las funcionalidades clave de Gantt-Calendar en nuestro sistema:
- Gantt charts para proyectos
- Calendar views
- Task management
- Data visualization
- Timeline tracking

---

## 📊 ARQUITECTURA ACTUAL DE GANTT-CALENDAR

```
gantt-calendar/
├─ src/tasks/
│  ├─ taskParser.ts       → Parsea markdown a tareas
│  ├─ taskSerializer.ts   → Convierte tareas a markdown
│  ├─ taskStatus.ts       → Gestión de status
│  ├─ taskUpdater.ts      → Actualiza tareas
│  └─ taskParser/         → Parsers específicos
│
├─ src/gantt/
│  ├─ GanttRenderer.ts    → Renderiza Gantt chart
│  ├─ adapters/           → Adaptadores para Frappe Gantt
│  ├─ handlers/           → Event handlers
│  └─ wrappers/           → Wrappers para tareas
│
├─ src/views/
│  ├─ GanttView.ts        → Vista Gantt
│  ├─ CalendarView.ts     → Vista calendario
│  └─ TaskView.ts         → Vista de tareas
│
├─ src/data-layer/
│  ├─ DataManager.ts      → Gestión de datos
│  ├─ cache/              → Sistema de cache
│  └─ sync/               → Sincronización
│
└─ src/utils/
   ├─ dateUtils/          → Utilidades de fechas
   └─ parsing/            → Parseo y regex
```

---

## 🔄 FLUJO DE DATOS EN GANTT-CALENDAR

```
Markdown File
  ↓
TaskParser (extrae propiedades)
  ↓
Task Object {
  id, title, status, priority,
  startDate, endDate, progress,
  dependencies, etc.
}
  ↓
DataManager (cache + sync)
  ↓
Views:
  - GanttView (renderiza chart)
  - CalendarView (renderiza calendario)
  - TaskView (lista de tareas)
  ↓
UI Components
  ↓
User Interaction (drag, click, etc.)
  ↓
taskUpdater (modifica markdown)
  ↓
Markdown File (actualizado)
```

---

## 🔑 COMPONENTES CLAVE A INTEGRAR

### 1. **Task Parser**
**Qué hace:** Extrae tareas de archivos markdown

```typescript
// Parseará frontmatter + contenido para extraer:
- title
- status (⏳ todo, ✅ done, 🔄 doing, etc.)
- startDate
- endDate
- priority
- tags
- assignees
- dependencies
```

**Ubicación en gantt-calendar:**
- `src/tasks/taskParser.ts`
- `src/tasks/taskParser/` (parsers específicos)

**Cómo integrarlo en obsidian-repo:**
```
src/utils/taskParser/
├─ TaskParser.ts         (clase principal)
├─ DateParser.ts         (extrae fechas)
├─ StatusParser.ts       (extrae status)
├─ PriorityParser.ts     (extrae prioridad)
└─ DependencyParser.ts   (extrae dependencias)
```

### 2. **Task Serializer**
**Qué hace:** Convierte tareas de vuelta a markdown

**Ubicación en gantt-calendar:**
- `src/tasks/taskSerializer.ts`
- `src/tasks/taskSerializerSymbols.ts`

**Cómo integrarlo:**
```
src/utils/taskSerializer/
├─ TaskSerializer.ts      (clase principal)
├─ FrontmatterSerializer.ts
└─ ContentSerializer.ts
```

### 3. **Gantt Renderer**
**Qué hace:** Renderiza gráficos Gantt usando Frappe Gantt

**Ubicación en gantt-calendar:**
- `src/gantt/`

**Cómo integrarlo:**
```
src/components/gantt/
├─ GanttRenderer.ts       (renderizador)
├─ GanttTask.ts          (envoltorio de tarea)
├─ GanttChart.ts         (contenedor)
└─ styles/
   └─ gantt.css
```

### 4. **Calendar View**
**Qué hace:** Renderiza vista de calendario con tareas

**Ubicación en gantt-calendar:**
- `src/views/CalendarView.ts`
- `src/calendar/`

**Cómo integrarlo:**
```
src/components/calendar/
├─ CalendarRenderer.ts
├─ MonthView.ts
├─ WeekView.ts
├─ DayView.ts
└─ styles/
   └─ calendar.css
```

### 5. **Data Layer**
**Qué hace:** Gestión de datos, cache y sincronización

**Ubicación en gantt-calendar:**
- `src/data-layer/`

**Cómo integrarlo:**
```
src/data-layer/
├─ DataManager.ts        (gestor de datos)
├─ TaskCache.ts          (cache de tareas)
├─ SyncManager.ts        (sincronización)
└─ IndexSync.ts          (sincronización con .index.json)
```

---

## 📋 TAREAS PARA INTEGRACIÓN

### FASE 1: Task Parser & Serializer (CRÍTICO)

```
[ ] 1.1 Crear TaskParser base
    └─ Extraer propiedades de README.md (frontmatter)
    └─ Extraer fechas (startDate, endDate)
    └─ Extraer status (⏳, ✅, 🔄, etc.)
    └─ Extraer prioridad (ALTA, MEDIA, BAJA)

[ ] 1.2 Crear TaskSerializer
    └─ Convertir Task object a markdown
    └─ Actualizar frontmatter
    └─ Mantener coherencia README.md + FolderNote.md

[ ] 1.3 Integrar con ProjectServiceWithVault
    └─ Al crear proyecto, generar front matter optimizado
    └─ Para poder parsear después

[ ] 1.4 Tests para Parser & Serializer
    └─ Parse: markdown → Task object
    └─ Serialize: Task object → markdown
    └─ Round-trip: markdown → object → markdown
```

### FASE 2: Gantt Renderer (IMPORTANTE)

```
[ ] 2.1 Implementar GanttRenderer
    └─ Usar Frappe Gantt o alternativa
    └─ Renderizar tareas en timeline
    └─ Drag & drop para cambiar fechas

[ ] 2.2 Integrar con tareas de proyecto
    └─ Extraer tareas de carpeta del proyecto
    └─ Mostrar en Gantt chart
    └─ Permitir modificación de fechas

[ ] 2.3 Crear vista Gantt para proyecto
    └─ ProjectGanttView
    └─ Mostrar todas las tareas del proyecto
```

### FASE 3: Calendar Views (IMPORTANTE)

```
[ ] 3.1 Implementar CalendarRenderer
    └─ Vista mensual
    └─ Vista semanal
    └─ Vista diaria

[ ] 3.2 Marcar tareas por fecha
    └─ Mostrar tareas en cada fecha
    └─ Colores según status/prioridad

[ ] 3.3 Crear vistas de calendario
    └─ ProjectCalendarView
    └─ GlobalCalendarView
```

### FASE 4: Data Layer (CRÍTICO)

```
[ ] 4.1 Crear TaskCache
    └─ Cache de tareas en memoria
    └─ Invalidación automática

[ ] 4.2 Crear SyncManager
    └─ Sincronizar cambios README.md ↔ FolderNote.md
    └─ Sincronizar con .index.json
    └─ Detectar cambios en filesystem

[ ] 4.3 Integrar DataManager
    └─ Gestión centralizada de datos
    └─ Eventos de cambio
```

---

## 📐 INTERFAZ DE INTEGRACIÓN

### Task Object (nuestro modelo)

```typescript
interface Task {
  // IDs
  id: string;              // TSK-202604-ABC
  projectId: string;       // PROJ-202604-ABC
  parentObjectiveId?: string;

  // Propiedades básicas
  title: string;
  description: string;
  
  // Fechas
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  
  // Status & Progress
  status: 'todo' | 'doing' | 'done' | 'blocked' | 'archived';
  progress: number;        // 0-100
  
  // Prioridad
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  
  // Relaciones
  dependencies: string[];  // IDs de tareas predecesoras
  subtasks: string[];      // IDs de subtareas
  
  // Meta
  assignees: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata
  filepath: string;        // Ruta del archivo
  parentPath: string;      // Ruta de carpeta padre
}
```

### Métodos principales

```typescript
// Parser
TaskParser.parse(content: string): Task[]

// Serializer
TaskSerializer.serialize(task: Task): string

// DataManager
DataManager.getTasks(): Task[]
DataManager.updateTask(id: string, updates: Partial<Task>): void
DataManager.onTasksChanged(callback: (tasks: Task[]) => void): void

// Renderers
GanttRenderer.render(tasks: Task[]): HTMLElement
CalendarRenderer.render(tasks: Task[], date: Date): HTMLElement
```

---

## 🔗 INTEGRACIÓN CON FLUJO ACTUAL

```
UC-008: Crear Proyecto
  ↓
ProjectServiceWithVault.createProjectWithVault()
  ↓
Crea: 200-PROYECTOS/PROJ-ID/
  ├─ PROJ-ID.md (FolderNote proyecto)
  ├─ README.md (Metadata proyecto)
  └─ Colecciones (objetivos/, tareas/, etc.)
     └─ tareas/
        ├─ tareas.md (FolderNote colección)
        └─ TSK-202604-ABC/
           ├─ TSK-202604-ABC.md (FolderNote tarea) ← PARSEAMOS AQUÍ
           └─ README.md (Metadata tarea) ← Y AQUÍ

════════════════════════════════════════════════════════════════════════════════

CON GANTT-CALENDAR INTEGRADO:

UC-008: Crear Proyecto (mejorado)
  ↓
ProjectServiceWithVault.createProjectWithVault()
  ↓
Crea estructura + FrontMatter optimizado para TaskParser
  ↓
TaskParser.parse() - EXTRAE TAREAS
  ↓
DataManager - CACHEA TAREAS
  ↓
GanttRenderer - RENDERIZA GANTT
CalendarRenderer - RENDERIZA CALENDARIO
  ↓
Usuario VE:
  - Gantt chart del proyecto
  - Calendario con tareas
  - Timeline interactivo
```

---

## 🎨 COMPONENTES UI A CREAR

```
src/components/
├─ gantt/
│  ├─ GanttRenderer.ts
│  ├─ GanttTask.ts
│  ├─ GanttChart.ts
│  ├─ GanttToolbar.ts
│  └─ styles.css
│
├─ calendar/
│  ├─ CalendarRenderer.ts
│  ├─ MonthView.ts
│  ├─ WeekView.ts
│  ├─ DayView.ts
│  ├─ TaskCard.ts
│  └─ styles.css
│
└─ timeline/
   ├─ TimelineRenderer.ts
   └─ styles.css
```

---

## 📦 DEPENDENCIAS A USAR

```json
{
  "dependencies": {
    "frappe-gantt": "^0.6.1",    // Para Gantt charts
    "day.js": "^1.11.0",          // Para fechas
    "rrule": "^2.7.0"             // Para recurrencias
  }
}
```

---

## ✅ PLAN DE ACCIÓN

### SEMANA 1: Foundation
- [ ] Analizar TaskParser de gantt-calendar
- [ ] Implementar TaskParser para nuestras tareas
- [ ] Implementar TaskSerializer
- [ ] Tests básicos

### SEMANA 2: Visualization
- [ ] Implementar GanttRenderer
- [ ] Implementar CalendarRenderer
- [ ] Crear vistas

### SEMANA 3: Integration
- [ ] Integrar con ProjectServiceWithVault
- [ ] Integrar DataManager
- [ ] Sincronización

### SEMANA 4: Polish
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation

---

## 🚀 RESULTADO FINAL

Un sistema integrado donde:

1. **Al crear un proyecto** → Se estructura optimizado para Gantt
2. **Al crear tareas** → Se parsean automáticamente
3. **Usuario ve**:
   - Gantt chart del proyecto
   - Calendario interactivo
   - Timeline visual
   - Progress tracking
4. **Sin dependencia externa** → Todo integrado en obsidian-repo

---

