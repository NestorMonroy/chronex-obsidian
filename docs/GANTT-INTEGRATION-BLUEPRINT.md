# BLUEPRINT: INTEGRACIÓN COMPLETA DE GANTT-CALENDAR

**Plan detallado para clonar TODAS las funcionalidades de obsidian-gantt-calendar en obsidian-repo**

---

## 📋 TABLA DE CONTENIDOS

1. [Flujo de Datos](#flujo-de-datos)
2. [Módulos a Implementar](#módulos-a-implementar)
3. [Paso a Paso](#paso-a-paso)
4. [Estructuras de Datos](#estructuras-de-datos)
5. [Implementación](#implementación)

---

## 🔄 FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────┐
│ CREAR PROYECTO (UC-008)                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─ Crea carpetas
               ├─ Crea FolderNotes
               └─ Crea estructura Gantt-ready
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ CREAR TAREAS EN PROYECTO                                │
│ /200-PROYECTOS/PROJ-ID/tareas/TSK-ID/README.md         │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ TASK PARSER (NUESTRO - BASADO EN gantt-calendar)       │
│                                                         │
│ PASO 1: Detectar líneas de tarea                       │
│   └─ - [ ] content  ← Checkbox pattern                 │
│                                                         │
│ PASO 2: Aplicar filtro global                          │
│   └─ Si: prefix- [ ] ...  → remover prefix             │
│                                                         │
│ PASO 3: Detectar formato                               │
│   └─ Tasks: 🔺 ⏫ 🔼 🔽 ⏬ + emojis de fecha          │
│   └─ Dataview: [field::value]                          │
│                                                         │
│ PASO 4: Parsear propiedades                            │
│   └─ status, priority, dates, tags, etc.              │
│                                                         │
│ OUTPUT: Task[] {                                        │
│   id, title, status, priority,                         │
│   startDate, endDate, dueDate,                         │
│   progress, dependencies, tags, ...                    │
│ }                                                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ DATA MANAGER (CACHE + SYNC)                             │
│                                                         │
│ - Cache de tareas en memoria                           │
│ - Invalidación automática                              │
│ - Eventos de cambio                                    │
│ - Sincronización .index.json                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─────────────┬──────────────┬──────────────┐
               │             │              │              │
               ▼             ▼              ▼              ▼
    ┌──────────────┐  ┌────────────┐  ┌─────────────┐  ┌────────────┐
    │ GANTT        │  │ CALENDAR   │  │ TASK        │  │ TIMELINE   │
    │ RENDERER     │  │ RENDERER   │  │ LIST VIEW   │  │ VIEW       │
    │              │  │            │  │             │  │            │
    │ Timeline     │  │ Month/Week │  │ Kanban-like │  │ Progress   │
    │ Visual       │  │ Day view   │  │ Grid        │  │ Tracker    │
    │ Drag & Drop  │  │ Heat map   │  │ Sorting     │  │ Milestones │
    └──────────────┘  └────────────┘  └─────────────┘  └────────────┘
               │             │              │              │
               └─────────────┴──────────────┴──────────────┘
                              │
                              ▼
                    USER VE E INTERACTÚA
                    (Arrastra fechas, cambia status, etc.)
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ TASK UPDATER (SERIALIZER)                               │
│                                                         │
│ Convierte Task[] → Markdown                            │
│ Mantiene formato original (Tasks o Dataview)           │
│ Actualiza README.md + FolderNote                       │
│ Sincroniza .index.json                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
        README.md ACTUALIZADO
```

---

## 🔑 MÓDULOS A IMPLEMENTAR

### 1. **TaskParser** (4 PASOS)
**Ubicación:** `src/utils/taskParser/`

```
src/utils/taskParser/
├─ index.ts              ← Exporta todo
├─ types.ts              ← Tipos para parser
├─ step1.ts              ← Detectar líneas de tarea
├─ step2.ts              ← Aplicar filtro global
├─ step3.ts              ← Detectar formato (Tasks/Dataview)
├─ step4.ts              ← Parsear propiedades
├─ utils.ts              ← Utilities
└─ regexPatterns.ts      ← Patrones regex
```

**Función principal:**
```typescript
parseTasksFromMarkdown(content: string, filePath: string): Task[]
```

### 2. **TaskSerializer** (Actualizar markdown)
**Ubicación:** `src/utils/taskSerializer/`

```
src/utils/taskSerializer/
├─ index.ts
├─ TaskSerializer.ts     ← Convierte Task → markdown
└─ utils.ts
```

**Función principal:**
```typescript
serializeTask(task: Task, originalFormat: 'tasks' | 'dataview'): string
```

### 3. **DataManager** (Cache + Sincronización)
**Ubicación:** `src/services/dataManager/`

```
src/services/dataManager/
├─ DataManager.ts        ← Gestor central
├─ TaskCache.ts          ← Cache en memoria
├─ SyncManager.ts        ← Sincronización de cambios
├─ EventEmitter.ts       ← Sistema de eventos
└─ types.ts
```

**Funciones principales:**
```typescript
DataManager.getTasks(projectId: string): Task[]
DataManager.updateTask(id: string, updates: Partial<Task>): void
DataManager.onTasksChanged(callback: (tasks: Task[]) => void): void
```

### 4. **Renderers** (Visualización)
**Ubicación:** `src/components/`

```
src/components/
├─ gantt/
│  ├─ GanttRenderer.ts       ← Renderizador Gantt
│  ├─ GanttTask.ts           ← Envoltura de tarea
│  ├─ GanttChart.ts          ← Contenedor
│  ├─ handlers.ts            ← Event handlers
│  └─ styles.css
│
├─ calendar/
│  ├─ CalendarRenderer.ts    ← Renderizador calendario
│  ├─ MonthView.ts           ← Vista mensual
│  ├─ WeekView.ts            ← Vista semanal
│  ├─ DayView.ts             ← Vista diaria
│  └─ styles.css
│
└─ timeline/
   ├─ TimelineRenderer.ts    ← Timeline visual
   └─ styles.css
```

---

## 📝 PASO A PASO

### FASE 1: TaskParser (CRÍTICA)

#### 1.1 Step 1: Detectar líneas de tarea
```typescript
// src/utils/taskParser/step1.ts

// Regex para detectar: - [ ] content o - [x] content
const TASK_LINE_REGEX = /^\s*-\s+\[([ xX])\]\s+(.*)/;

interface TaskLineMatch {
  checkboxStatus: string;  // ' ' | 'x' | 'X'
  content: string;         // El resto de la línea
}

export function isTaskLine(line: string): boolean {
  return TASK_LINE_REGEX.test(line);
}

export function parseTaskLine(line: string): TaskLineMatch | null {
  const match = line.match(TASK_LINE_REGEX);
  if (!match) return null;
  
  return {
    checkboxStatus: match[1],
    content: match[2].trim()
  };
}
```

#### 1.2 Step 2: Aplicar filtro global
```typescript
// src/utils/taskParser/step2.ts

// Si hay filtro: "🎯 - [ ] Hacer algo"
// Remover "🎯 " para obtener "- [ ] Hacer algo"

export function passesGlobalFilter(
  content: string, 
  globalFilter?: string
): boolean {
  if (!globalFilter) return true;
  return content.startsWith(globalFilter);
}

export function removeGlobalFilter(
  content: string,
  globalFilter?: string
): string {
  if (!globalFilter) return content;
  if (content.startsWith(globalFilter)) {
    return content.substring(globalFilter.length).trim();
  }
  return content;
}
```

#### 1.3 Step 3: Detectar formato
```typescript
// src/utils/taskParser/step3.ts

type Format = 'tasks' | 'dataview' | 'mixed' | 'unknown';

export function detectFormat(content: string): Format {
  const hasTasksFormat = /[🔺⏫🔼🔽⏬]/.test(content);
  const hasDataviewFormat = /\[.*?::.+?\]/g.test(content);
  
  if (hasTasksFormat && hasDataviewFormat) return 'mixed';
  if (hasTasksFormat) return 'tasks';
  if (hasDataviewFormat) return 'dataview';
  return 'unknown';
}
```

#### 1.4 Step 4: Parsear propiedades
```typescript
// src/utils/taskParser/step4.ts

export function parseTaskAttributes(content: string, format: Format) {
  const task: Partial<Task> = {};
  
  // Parsear priority
  // Parsear dates
  // Parsear tags
  // Parsear description
  // etc.
  
  return task;
}
```

### FASE 2: DataManager (CRÍTICA)

```typescript
// src/services/dataManager/DataManager.ts

export class DataManager {
  private cache: Map<string, Task[]> = new Map();
  private eventEmitter = new EventEmitter();
  
  // Cargar tareas de proyecto
  async loadProjectTasks(projectId: string): Promise<Task[]> {
    // Leer archivos de carpeta tareas/
    // Parsear cada tarea
    // Cachear resultado
    // Retornar tareas
  }
  
  // Obtener tareas cacheadas
  getTasks(projectId: string): Task[] {
    return this.cache.get(projectId) || [];
  }
  
  // Actualizar tarea
  async updateTask(id: string, updates: Partial<Task>) {
    // Actualizar en cache
    // Serializar a markdown
    // Escribir archivo
    // Sincronizar .index.json
    // Emitir evento
  }
  
  // Escuchar cambios
  onTasksChanged(callback: (tasks: Task[]) => void) {
    this.eventEmitter.on('tasks-changed', callback);
  }
}
```

### FASE 3: Renderers (VISUALIZACIÓN)

#### 3.1 GanttRenderer
```typescript
// src/components/gantt/GanttRenderer.ts

export class GanttRenderer {
  render(tasks: Task[], container: HTMLElement): void {
    // Preparar datos para Frappe Gantt
    const ganttTasks = tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: task.startDate,
      end: task.endDate,
      progress: task.progress,
      dependencies: task.dependencies?.join(','),
      custom_class: this.getTaskClass(task)
    }));
    
    // Renderizar gráfico
    const gantt = new GanttChart(container, ganttTasks, {
      on_change: (task) => this.handleTaskChange(task),
      on_click: (task) => this.handleTaskClick(task),
      on_date_change: (task, start, end) => this.handleDateChange(task, start, end)
    });
  }
}
```

#### 3.2 CalendarRenderer
```typescript
// src/components/calendar/CalendarRenderer.ts

export class CalendarRenderer {
  render(tasks: Task[], date: Date, container: HTMLElement): void {
    // Filtrar tareas por fecha
    // Renderizar calendario
    // Marcar tareas en cada día
  }
}
```

---

## 📦 ESTRUCTURAS DE DATOS

### Task Object (COMPLETO)
```typescript
interface Task {
  // IDs
  id: string;                    // TSK-202604-ABC
  projectId: string;             // PROJ-202604-ABC
  
  // Propiedades básicas
  title: string;
  description: string;
  
  // Fechas (TODOS opcionales)
  createdDate?: Date;
  startDate?: Date;              // Fecha de inicio
  scheduledDate?: Date;          // Fecha planificada
  dueDate?: Date;                // Fecha de vencimiento
  completionDate?: Date;
  cancelledDate?: Date;
  
  // Status & Progress
  status: 'todo' | 'doing' | 'done' | 'cancelled' | 'blocked';
  completed: boolean;
  cancelled: boolean;
  progress: number;              // 0-100
  
  // Prioridad & Importancia
  priority: 'lowest' | 'low' | 'normal' | 'high' | 'highest';
  
  // Relaciones
  dependencies: string[];        // IDs de tareas predecesoras
  subtasks: string[];            // IDs de subtareas
  
  // Meta
  tags: string[];
  assignees: string[];
  createdBy: string;
  
  // Metadata para parsing/serialización
  filePath: string;              // Ruta del archivo
  lineNumber: number;            // Línea en el archivo
  content: string;               // Contenido original
  format: 'tasks' | 'dataview';  // Formato original
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 IMPLEMENTACIÓN

### SEMANA 1: TaskParser
```
[ ] Crear src/utils/taskParser/
[ ] Implementar step1.ts (detectar líneas)
[ ] Implementar step2.ts (aplicar filtro)
[ ] Implementar step3.ts (detectar formato)
[ ] Implementar step4.ts (parsear propiedades)
[ ] Tests para cada step
[ ] Test de integración
```

### SEMANA 2: DataManager
```
[ ] Crear src/services/dataManager/
[ ] Implementar TaskCache
[ ] Implementar DataManager
[ ] Implementar SyncManager
[ ] Integrar con ProjectServiceWithVault
[ ] Tests
```

### SEMANA 3: Renderers
```
[ ] Implementar GanttRenderer
[ ] Implementar CalendarRenderer
[ ] Crear vistas
[ ] Integrar con DataManager
[ ] Tests
```

### SEMANA 4: Integración
```
[ ] Integrar todo en UC-008
[ ] End-to-end testing
[ ] Performance optimization
[ ] Documentación
```

---

## 🎯 RESULTADO FINAL

Cuando esté COMPLETO:

1. **Crear Proyecto** → Se crea estructura Gantt-ready
2. **Crear Tareas** → Se parsean automáticamente
3. **Usuario VE**:
   - Gantt chart interactivo
   - Calendario con tareas
   - Timeline visual
   - Progress tracking
4. **Editar Tareas** → Se actualizan en markdown
5. **TODO** sincronizado:
   - README.md + FolderNote.md + .index.json

**SIN dependencias externas** (todo clonado de gantt-calendar)

