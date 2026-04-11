# UC IMPLEMENTATION GUIDE

**Documentación técnica de cómo usar cada servicio implementado**

Basado en UC-MASTER.md + Implementación actual (GREEN state)

---

## UC-008: Crear Proyecto (ProjectServiceWithVault)

### Cómo Usar

```typescript
import { ProjectServiceWithVault } from './services/projectServiceWithVault';

const input = {
  projectName: 'Sistema 2026',
  description: 'Gestión documental integral',
  priority: 'ALTA'
};

const output = await ProjectServiceWithVault.createProjectWithVault(input);
```

### Input Validación

```typescript
interface CreateProjectInput {
  projectName: string;      // Requerido, ≤100 caracteres, no vacío
  description: string;      // Requerido, ≤500 caracteres, no vacío
  priority: enum;           // BAJA | MEDIA | ALTA | CRÍTICA
}
```

### Output

```typescript
interface CreateProjectOutput {
  success: boolean;
  projectId?: string;        // PROJ-202604-ABC
  folderPath?: string;       // 200-PROYECTOS/PROJ-202604-ABC
  filesCreated?: string[];   // 6 archivos
  timestamp?: string;        // ISO format
  error?: string;            // Si hay error
}
```

### Respuesta Exitosa

```json
{
  "success": true,
  "projectId": "PROJ-202604-ABC",
  "folderPath": "200-PROYECTOS/PROJ-202604-ABC",
  "filesCreated": [
    "PROJ-202604-ABC.md",
    "README.md",
    "objetivos.md",
    "documentos.md",
    "tareas.md",
    "recursos.md"
  ],
  "timestamp": "2026-04-11T10:30:00Z"
}
```

### Estructura Creada

```
200-PROYECTOS/PROJ-202604-ABC/
├─ PROJ-202604-ABC.md ← FolderNote (AUTO)
│  ├─ type: proyecto
│  ├─ title: Sistema 2026
│  ├─ description: Gestión documental integral
│  ├─ priority: ALTA
│  ├─ status: activo
│  └─ dateCreated: 2026-04-11
│
├─ README.md
│  ├─ Frontmatter con metadata
│  └─ Contenido del proyecto
│
├─ objetivos/
│  └─ objetivos.md ← FolderNote (AUTO)
│
├─ documentos/
│  └─ documentos.md ← FolderNote (AUTO)
│
├─ tareas/
│  └─ tareas.md ← FolderNote (AUTO)
│
└─ recursos/
   └─ recursos.md ← FolderNote (AUTO)
```

### Errores Posibles

```typescript
// Input vacío
{ success: false, error: 'projectName is required' }

// Nombre muy largo
{ success: false, error: 'projectName must be ≤ 100 characters' }

// Priority inválido
{ success: false, error: 'priority must be one of: BAJA, MEDIA, ALTA, CRÍTICA' }

// Error de filesystem
{ success: false, error: 'Error creating folder: ...' }
```

### Auto-Sync Garantizado

- ✅ PROJ-202604-ABC.md creado automáticamente
- ✅ 4 colecciones.md creadas automáticamente
- ✅ .index.json actualizado automáticamente
- ✅ README.md + FolderNote + Index siempre en SYNC

---

## UC-010: Crear Objetivo (ObjectiveServiceWithVault)

### Cómo Usar

```typescript
import { ObjectiveServiceWithVault } from './services/objectiveServiceWithVault';

const input = {
  objectiveName: 'Objetivo Q1',
  description: 'Lograr X en Q1',
  priority: 'ALTA',
  parentProjectId: 'PROJ-202604-ABC'
};

const output = await ObjectiveServiceWithVault.createObjectiveWithVault(input);
```

### Input Validación

```typescript
interface CreateObjectiveInput {
  objectiveName: string;       // Requerido
  description: string;         // Requerido
  priority: enum;              // BAJA | MEDIA | ALTA | CRÍTICA
  parentProjectId: string;     // PROJ-YYYYMM-XXXXX
}
```

### Output

```json
{
  "success": true,
  "objectiveId": "OBJ-202604-XYZ",
  "filesCreated": [
    "OBJ-202604-XYZ.md",
    "README.md"
  ]
}
```

### Estructura Creada

```
200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/
├─ OBJ-202604-XYZ.md ← FolderNote (AUTO)
│  ├─ type: objetivo
│  ├─ title: Objetivo Q1
│  ├─ priority: ALTA
│  └─ status: activo
│
└─ README.md
   └─ Contenido del objetivo
```

---

## UC-012: Crear Tarea (TaskServiceWithVault)

### Cómo Usar

```typescript
import { TaskServiceWithVault } from './services/taskServiceWithVault';

const input = {
  taskName: 'Tarea 1',
  description: 'Hacer X',
  dueDate: '2026-04-20',        // YYYY-MM-DD obligatorio
  parentObjectiveId: 'OBJ-202604-XYZ'
};

const output = await TaskServiceWithVault.createTaskWithVault(input);
```

### Input Validación

```typescript
interface CreateTaskInput {
  taskName: string;              // Requerido
  description: string;           // Requerido
  dueDate: string;               // YYYY-MM-DD (validado)
  parentObjectiveId: string;     // OBJ-YYYYMM-XXXXX
}
```

### Output

```json
{
  "success": true,
  "taskId": "TSK-202604-LMN",
  "filesCreated": [
    "TSK-202604-LMN.md",
    "README.md"
  ]
}
```

### Validación de Fecha

```typescript
// Válido
dueDate: "2026-04-20"  ✅

// Inválido
dueDate: "04-20-2026"  ❌
dueDate: "2026/04/20"  ❌
dueDate: "20-04-2026"  ❌
```

---

## UC-013: Crear Documento (DocumentServiceWithVault)

### Cómo Usar

```typescript
import { DocumentServiceWithVault } from './services/documentServiceWithVault';

const input = {
  documentName: 'Documento 1',
  description: 'Descripción del documento',
  category: 'General'  // General | Técnico | Legal
};

const output = await DocumentServiceWithVault.createDocumentWithVault(input);
```

### Input Validación

```typescript
interface CreateDocumentInput {
  documentName: string;     // Requerido
  description: string;      // Requerido
  category: string;         // General | Técnico | Legal (o nueva)
}
```

### Output

```json
{
  "success": true,
  "documentId": "DOC-202604-RST",
  "filesCreated": [
    "DOC-202604-RST.md",
    "README.md"
  ]
}
```

### Estructura Creada

```
500-REPOSITORIOS/General/DOC-202604-RST/
├─ DOC-202604-RST.md ← FolderNote (AUTO)
│  ├─ type: documento
│  ├─ title: Documento 1
│  ├─ category: General
│  └─ status: activo
│
└─ README.md
   └─ Contenido del documento
```

### Categorías Soportadas

```typescript
// Existentes
category: 'General'    ✅
category: 'Técnico'    ✅
category: 'Legal'      ✅

// Nuevas (se crean automáticamente)
category: 'Custom'     ✅ (crea 500-REPOSITORIOS/Custom/ + Custom.md)
```

---

## UC-019: Editar Entidad (EditServiceWithVault)

### Cómo Usar

```typescript
import { EditServiceWithVault } from './services/editServiceWithVault';

const input = {
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  updates: {
    title: 'Nuevo Título',
    description: 'Nueva descripción',
    priority: 'CRÍTICA'
  },
  folderPath: '200-PROYECTOS/PROJ-202604-ABC'
};

const output = await EditServiceWithVault.editEntityWithVault(input);
```

### Input Validación

```typescript
interface EditEntityInput {
  entityId: string;                    // PROJ-*, OBJ-*, TSK-*, DOC-*
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
  folderPath: string;                  // Ruta completa de la carpeta
}
```

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "updated": {
    "title": "Nuevo Título",
    "description": "Nueva descripción",
    "priority": "CRÍTICA"
  }
}
```

### Auto-Sync

- ✅ README.md actualizado
- ✅ PROJ-202604-ABC.md auto-actualizado (FolderNoteService)
- ✅ .index.json auto-sincronizado (IndexSyncService)

---

## UC-020: Eliminar Entidad (DeleteServiceWithVault)

### Cómo Usar

```typescript
import { DeleteServiceWithVault } from './services/deleteServiceWithVault';

const input = {
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  permanent: true
};

const output = await DeleteServiceWithVault.deleteEntityWithVault(input);
```

### Input Validación

```typescript
interface DeleteEntityInput {
  entityId: string;                    // PROJ-*, OBJ-*, TSK-*, DOC-*
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;                  // Ruta completa
  permanent: boolean;                  // true = eliminar definitivamente
}
```

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "deleted": true
}
```

### Qué Se Elimina

- ✅ Carpeta completa (200-PROYECTOS/PROJ-202604-ABC/)
- ✅ Todos los archivos dentro
- ✅ FolderNote (PROJ-202604-ABC.md)
- ✅ Entrada en .index.json

### Garantías

- ✅ CERO archivos huérfanos
- ✅ CERO inconsistencias
- ✅ .index.json sincronizado

---

## UC-021: Archivar Entidad (ArchiveServiceWithVault)

### Cómo Usar

```typescript
import { ArchiveServiceWithVault } from './services/archiveServiceWithVault';

// Archivar
const input = {
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  archive: true  // true = archivar
};

const output = await ArchiveServiceWithVault.archiveEntityWithVault(input);

// Restaurar
const input2 = {
  ...input,
  archive: false  // false = restaurar
};

const output2 = await ArchiveServiceWithVault.archiveEntityWithVault(input2);
```

### Input Validación

```typescript
interface ArchiveEntityInput {
  entityId: string;                    // PROJ-*, OBJ-*, TSK-*, DOC-*
  entityType: 'proyecto' | 'objetivo' | 'tarea' | 'documento';
  folderPath: string;                  // Ruta completa
  archive: boolean;                    // true = archivar, false = restaurar
}
```

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "newStatus": "archivado"
}
```

### Cambios de Status

```typescript
archive: true   → status: 'archivado'
archive: false  → status: 'activo'
```

### Qué NO Se Hace

- ❌ No se elimina la carpeta
- ❌ No se eliminan los archivos
- ❌ No se oculta de la vista

### Qué SÍ Se Hace

- ✅ Cambiar status en README.md
- ✅ AUTO-actualizar FolderNote
- ✅ AUTO-sincronizar .index.json

---

## UC-015: Listar Proyectos (ListServiceWithVault)

### Cómo Usar

```typescript
import { ListServiceWithVault } from './services/listServiceWithVault';

const output = await ListServiceWithVault.listProjects();
```

### Output

```json
{
  "success": true,
  "projects": [
    {
      "id": "PROJ-202604-ABC",
      "title": "Sistema 2026",
      "description": "Gestión documental integral",
      "status": "activo",
      "priority": "ALTA",
      "path": "200-PROYECTOS/PROJ-202604-ABC",
      "dateCreated": "2026-04-11",
      "lastModified": "2026-04-11T10:30:00Z"
    },
    {
      "id": "PROJ-202604-DEF",
      "title": "Proyecto 2",
      "description": "...",
      "status": "archivado",
      "priority": "MEDIA",
      "path": "200-PROYECTOS/PROJ-202604-DEF",
      "dateCreated": "2026-04-10",
      "lastModified": "2026-04-10T15:00:00Z"
    }
  ],
  "total": 2
}
```

### Orden

```typescript
// Ordenado por lastModified (DESC)
// Proyectos más recientes primero
```

### Campos en Cada Proyecto

- `id` - PROJ-YYYYMM-XXXXX
- `title` - Nombre del proyecto
- `description` - Descripción
- `status` - activo | archivado
- `priority` - BAJA | MEDIA | ALTA | CRÍTICA
- `path` - Ruta en el vault
- `dateCreated` - YYYY-MM-DD
- `lastModified` - ISO timestamp

---

## INTEGRACIÓN COMPLETA

### FolderNoteService (Auto)

Se llama automáticamente en:

```typescript
// CREATE
ProjectServiceWithVault.createProjectWithVault()
  → FolderNoteService.createFolderNote()  // Auto-crear PROJ-ID.md

// UPDATE
EditServiceWithVault.editEntityWithVault()
  → FolderNoteService.updateFolderNoteOnMetadataChange()  // Auto-actualizar

// DELETE
DeleteServiceWithVault.deleteEntityWithVault()
  → FolderNoteService.deleteFolderNote()  // Auto-eliminar

// ARCHIVE
ArchiveServiceWithVault.archiveEntityWithVault()
  → FolderNoteService.updateFolderNoteOnMetadataChange()  // Auto-actualizar status
```

### IndexSyncService (Auto)

Se llama automáticamente en:

```typescript
// Todas las operaciones
→ IndexSyncService.updateIndexEntry()  // CREATE, UPDATE, ARCHIVE
→ IndexSyncService.deleteIndexEntry()  // DELETE
```

---

## EJEMPLOS COMPLETOS

### Crear Proyecto → Crear Objetivo → Crear Tarea

```typescript
// 1. Crear Proyecto
const project = await ProjectServiceWithVault.createProjectWithVault({
  projectName: 'Mi Proyecto',
  description: 'Descripción del proyecto',
  priority: 'ALTA'
});
// projectId: PROJ-202604-ABC

// 2. Crear Objetivo
const objective = await ObjectiveServiceWithVault.createObjectiveWithVault({
  objectiveName: 'Objetivo 1',
  description: 'Descripción del objetivo',
  priority: 'MEDIA',
  parentProjectId: project.projectId  // PROJ-202604-ABC
});
// objectiveId: OBJ-202604-XYZ

// 3. Crear Tarea
const task = await TaskServiceWithVault.createTaskWithVault({
  taskName: 'Tarea 1',
  description: 'Hacer algo',
  dueDate: '2026-04-30',
  parentObjectiveId: objective.objectiveId  // OBJ-202604-XYZ
});
// taskId: TSK-202604-LMN

// 4. Crear Documento
const document = await DocumentServiceWithVault.createDocumentWithVault({
  documentName: 'Especificación',
  description: 'Spec del proyecto',
  category: 'Técnico'
});
// documentId: DOC-202604-RST

// 5. Listar todo
const projects = await ListServiceWithVault.listProjects();
// Retorna array con PROJ-202604-ABC y más
```

### Editar → Archivar → Restaurar

```typescript
// 1. Editar
const edited = await EditServiceWithVault.editEntityWithVault({
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  updates: { title: 'Nuevo Nombre', priority: 'CRÍTICA' },
  folderPath: '200-PROYECTOS/PROJ-202604-ABC'
});

// 2. Archivar
const archived = await ArchiveServiceWithVault.archiveEntityWithVault({
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  archive: true
});

// 3. Restaurar
const restored = await ArchiveServiceWithVault.archiveEntityWithVault({
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  archive: false
});

// 4. Eliminar
const deleted = await DeleteServiceWithVault.deleteEntityWithVault({
  entityId: 'PROJ-202604-ABC',
  entityType: 'proyecto',
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  permanent: true
});
```

---

## GARANTÍAS FINALES

✅ **AUTOMATIZACIÓN TOTAL**
- CERO pasos manuales
- Cada operación es 100% automática

✅ **SINCRONIZACIÓN PERFECTA**
- README.md + FolderNote + .index.json siempre en sync
- Cambios se reflejan automáticamente en los 3 archivos

✅ **DATOS LIMPIOS**
- CERO archivos huérfanos
- CERO entradas duplicadas
- CERO inconsistencias de estado

✅ **ESCALABILIDAD**
- Fácil agregar nuevas colecciones
- Fácil agregar nuevas categorías
- Patrón escalable sin límites

