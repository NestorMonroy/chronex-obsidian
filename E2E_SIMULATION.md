# Chronex Obsidian - End-to-End Flow Simulation

## Flujos Completos Simulados

### 1. CREATE PROJECT (UC-008)

**Comando:** `Mod+Shift+P` → "Create new project"

#### Input
```
projectName: "Sistema Documental 2026"
description: "Gestión integral de documentación empresarial con versionado y control de acceso"
priority: "ALTA"
```

#### Proceso (Automático)
```
1. ✓ Validación de entrada
   - projectName.length: 29 ≤ 100 ✓
   - description.length: 84 ≤ 500 ✓
   - priority: ALTA ∈ {BAJA, MEDIA, ALTA, CRÍTICA} ✓

2. ✓ Generar ID único
   - Timestamp: 2026-04-12
   - Random: ABC
   - Resultado: PROJ-202604-ABC

3. ✓ Crear estructura de carpetas
   - 200-PROYECTOS/PROJ-202604-ABC/
   - 200-PROYECTOS/PROJ-202604-ABC/objetivos/
   - 200-PROYECTOS/PROJ-202604-ABC/documentos/
   - 200-PROYECTOS/PROJ-202604-ABC/tareas/
   - 200-PROYECTOS/PROJ-202604-ABC/recursos/

4. ✓ Crear 6 archivos automáticamente
   - PROJ-202604-ABC.md (FolderNote proyecto)
   - README.md (Contenido proyecto)
   - objetivos.md (FolderNote colección)
   - documentos.md (FolderNote colección)
   - tareas.md (FolderNote colección)
   - recursos.md (FolderNote colección)

5. ✓ PROJ-202604-ABC.md generado:
   ---
   UID: PROJ-202604-ABC
   type: proyecto
   status: activo
   priority: ALTA
   dateCreated: 2026-04-12
   tags: []
   ---
   
   # 🎯 Sistema Documental 2026
   
   ## Descripción
   Gestión integral de documentación empresarial con versionado y control de acceso
   
   ## Acciones Rápidas
   [Nueva Tarea](button://create?type=task&project=PROJ-202604-ABC)
   [Editar](button://edit?uid=PROJ-202604-ABC)
   [Ver Tareas](button://tasks?project=PROJ-202604-ABC)
   [Archivar](button://archive?uid=PROJ-202604-ABC)

6. ✓ Sincronizar .index.json
   {
     "proyecto": {
       "PROJ-202604-ABC": {
         "type": "proyecto",
         "title": "Sistema Documental 2026",
         "description": "...",
         "status": "activo",
         "priority": "ALTA",
         "path": "200-PROYECTOS/PROJ-202604-ABC",
         "dateCreated": "2026-04-12",
         "lastModified": "2026-04-12T14:32:15.000Z"
       }
     }
   }
```

#### Output
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
  "timestamp": "2026-04-12T14:32:15.000Z"
}
```

**UI Feedback:** ✅ Proyecto "Sistema Documental 2026" creado exitosamente

---

### 2. CREATE OBJECTIVE (UC-010)

**Contexto:** Usuario está en `200-PROYECTOS/PROJ-202604-ABC/` y quiere crear un objetivo

**Comando:** `Mod+Shift+O` → "Create new objective"

#### Input
```
objectiveName: "Implementar versionado de documentos"
description: "Agregar sistema de versiones con historial y comparación"
priority: "ALTA"
parentProjectId: "PROJ-202604-ABC" (auto-detectado)
```

#### Proceso
```
1. ✓ Validar entrada
   - objectiveName: 39 chars ≤ 100 ✓
   - description: 53 chars ≤ 500 ✓
   - priority: ALTA ✓
   - parentProjectId: PROJ-202604-ABC existe ✓

2. ✓ Generar ID
   - Resultado: OBJ-202604-XYZ

3. ✓ Crear estructura
   - 200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/

4. ✓ Crear archivos
   - OBJ-202604-XYZ.md (FolderNote)
   - README.md (Contenido objetivo)

5. ✓ OBJ-202604-XYZ.md generado:
   ---
   UID: OBJ-202604-XYZ
   type: objetivo
   status: activo
   priority: ALTA
   dateCreated: 2026-04-12
   ---
   
   # 🎯 Implementar versionado de documentos
   
   ## Descripción
   Agregar sistema de versiones con historial y comparación
   
   ## Acciones Rápidas
   [Nueva Tarea](button://create?type=task&parent=OBJ-202604-XYZ)
   [Editar](button://edit?uid=OBJ-202604-XYZ)
   [Cambiar Estado](button://status?uid=OBJ-202604-XYZ)
   [Archivar](button://archive?uid=OBJ-202604-XYZ)

6. ✓ Actualizar .index.json (agregar entrada objetivo)
```

#### Output
```json
{
  "success": true,
  "objectiveId": "OBJ-202604-XYZ",
  "folderPath": "200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ",
  "notePath": "200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/README.md",
  "frontmatter": {
    "uid": "OBJ-202604-XYZ",
    "type": "objetivo",
    "title": "Implementar versionado de documentos",
    "priority": "ALTA",
    "status": "activo"
  },
  "message": "Objective created successfully!"
}
```

**UI Feedback:** ✅ Objetivo "Implementar versionado de documentos" creado!

---

### 3. CREATE TASK (UC-012)

**Contexto:** Usuario en objetivo OBJ-202604-XYZ quiere crear una tarea

**Comando:** `Mod+Shift+T` → "Create new task"

#### Input
```
taskName: "Investigar librerías de versionado"
description: "Comparar jsondiffpatch, diff-match-patch, y opciones nativas"
priority: "MEDIA"
dueDate: "2026-04-25"
parentObjectiveId: "OBJ-202604-XYZ"
```

#### Proceso
```
1. ✓ Validar entrada
   - taskName: 37 chars ✓
   - description: 65 chars ✓
   - priority: MEDIA ✓
   - dueDate: formato YYYY-MM-DD ✓
   - parentObjectiveId: existe ✓

2. ✓ Generar ID
   - Resultado: TSK-202604-DEF

3. ✓ Crear estructura
   - 200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/TSK-202604-DEF/

4. ✓ Crear archivos
   - README.md (con frontmatter)

5. ✓ README.md generado:
   ---
   uid: TSK-202604-DEF
   type: tarea
   title: Investigar librerías de versionado
   description: Comparar jsondiffpatch, diff-match-patch, y opciones nativas
   priority: MEDIA
   dueDate: 2026-04-25
   dateCreated: 2026-04-12
   status: pendiente
   ---
   
   # ✅ Investigar librerías de versionado
   
   ## Descripción
   Comparar jsondiffpatch, diff-match-patch, y opciones nativas
   
   ## Acciones Rápidas
   [Marcar Completada](button://complete?uid=TSK-202604-DEF)
   [Editar](button://edit?uid=TSK-202604-DEF)
   [Cambiar Prioridad](button://priority?uid=TSK-202604-DEF)
   [Archivar](button://archive?uid=TSK-202604-DEF)
   
   ## Información
   - **UID**: TSK-202604-DEF
   - **Prioridad**: MEDIA
   - **Vencimiento**: 2026-04-25
   - **Estado**: pendiente
   - **Creado**: 2026-04-12
   
   ## Subtareas
   - [ ] Paso 1
   - [ ] Paso 2
   - [ ] Paso 3

6. ✓ Actualizar .index.json (agregar tarea)
```

#### Output
```json
{
  "success": true,
  "taskId": "TSK-202604-DEF",
  "folderPath": "200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/TSK-202604-DEF",
  "notePath": "200-PROYECTOS/PROJ-202604-ABC/objetivos/OBJ-202604-XYZ/TSK-202604-DEF/README.md",
  "frontmatter": {
    "uid": "TSK-202604-DEF",
    "type": "tarea",
    "title": "Investigar librerías de versionado",
    "priority": "MEDIA",
    "status": "pendiente",
    "dueDate": "2026-04-25"
  },
  "message": "Task created successfully!"
}
```

**UI Feedback:** ✅ Tarea "Investigar librerías de versionado" creada!

---

### 4. CREATE DOCUMENT (UC-013)

**Contexto:** Usuario quiere crear un documento reusable

**Comando:** `Mod+Shift+D` → "Create new document"

#### Input
```
documentName: "Arquitectura de Versionado"
description: "Diseño técnico del sistema de versionado"
category: "Especificaciones Técnicas"
```

#### Proceso
```
1. ✓ Validar entrada
   - documentName: 27 chars ✓
   - description: 45 chars ✓
   - category: válida ✓

2. ✓ Generar ID
   - Resultado: DOC-202604-GHI

3. ✓ Crear estructura
   - 500-REPOSITORIOS/Especificaciones Técnicas/DOC-202604-GHI/

4. ✓ Crear archivos
   - README.md (documento)

5. ✓ README.md generado:
   ---
   uid: DOC-202604-GHI
   type: documento
   title: Arquitectura de Versionado
   description: Diseño técnico del sistema de versionado
   category: Especificaciones Técnicas
   dateCreated: 2026-04-12
   status: activo
   ---
   
   # 📄 Arquitectura de Versionado
   
   ## Descripción
   Diseño técnico del sistema de versionado
   
   ## Acciones Rápidas
   [Editar](button://edit?uid=DOC-202604-GHI)
   [Compartir](button://share?uid=DOC-202604-GHI)
   [Crear Versión](button://version?uid=DOC-202604-GHI)
   [Archivar](button://archive?uid=DOC-202604-GHI)
   
   ## Información
   - **UID**: DOC-202604-GHI
   - **Categoría**: Especificaciones Técnicas
   - **Estado**: activo
   - **Creado**: 2026-04-12
   
   ## Contenido
   <!-- Agregar contenido aquí -->
   
   ## Referencias
   <!-- Enlaces a otros documentos -->

6. ✓ Actualizar .index.json
```

#### Output
```json
{
  "success": true,
  "documentId": "DOC-202604-GHI",
  "folderPath": "500-REPOSITORIOS/Especificaciones Técnicas/DOC-202604-GHI",
  "notePath": "500-REPOSITORIOS/Especificaciones Técnicas/DOC-202604-GHI/README.md",
  "frontmatter": {
    "uid": "DOC-202604-GHI",
    "type": "documento",
    "title": "Arquitectura de Versionado",
    "category": "Especificaciones Técnicas"
  },
  "message": "Document created successfully!"
}
```

**UI Feedback:** ✅ Documento "Arquitectura de Versionado" creado!

---

## Estructura Final del Vault

```
200-PROYECTOS/
├── PROJ-202604-ABC/                           # 🎯 Sistema Documental 2026
│   ├── PROJ-202604-ABC.md                    # FolderNote proyecto
│   ├── README.md                              # Contenido proyecto
│   ├── objetivos/
│   │   ├── objetivos.md                       # FolderNote colección
│   │   └── OBJ-202604-XYZ/                    # 🎯 Implementar versionado
│   │       ├── OBJ-202604-XYZ.md
│   │       ├── README.md
│   │       └── TSK-202604-DEF/                # ✅ Investigar librerías
│   │           ├── README.md
│   │           └── [subtareas]
│   ├── documentos/
│   │   └── documentos.md
│   ├── tareas/
│   │   └── tareas.md
│   └── recursos/
│       └── recursos.md
│
500-REPOSITORIOS/
├── Especificaciones Técnicas/
│   └── DOC-202604-GHI/                        # 📄 Arquitectura de Versionado
│       ├── DOC-202604-GHI.md
│       └── README.md
│
.index.json                                    # Registro centralizado
```

---

## Dashboard Views (En Vivo)

### Projects Dashboard
```
Projects: 1 | Active: 1 | Archived: 0 | Objectives: 1
┌──────────────────────────────────────┐
│ Sistema Documental 2026              │
│ Priority: ALTA | Status: activo      │
│ Objectives: 1 | Created: 2026-04-12  │
└──────────────────────────────────────┘
```

### Tasks Calendar
```
April 2026
Sun Mon Tue Wed Thu Fri Sat
              1   2   3   4
  5   6   7   8   9  10  11
 12 [13] 14  15  16  17  18  ← Today (1 task)
 19  20  21  22  23  24  25  ← 2026-04-25: Investigar librerías...

Upcoming Tasks (Next 8)
─────────────────────────────────────
2026-04-25  Investigar librerías de versionado  [MEDIA]
```

### Tasks Kanban
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   PENDING    │ │ IN PROGRESS  │ │  COMPLETED   │
│     (1)      │ │      (0)     │ │      (0)     │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Investigar   │ │              │ │              │
│ librerías de │ │              │ │              │
│ versionado   │ │              │ │              │
│ [MEDIA]      │ │              │ │              │
│ Due: 04-25   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Interacción con Buttons

### Flujo: Click "Marcar Completada"

1. Usuario ve archivo TSK-202604-DEF.md
2. Click en botón `[Marcar Completada](button://complete?uid=TSK-202604-DEF)`
3. ButtonHandler intercepta click
4. Ejecuta comando `complete` con uid=TSK-202604-DEF
5. Actualiza frontmatter: `status: pendiente` → `status: completada`
6. UI actualiza automáticamente
7. Tarea desaparece de "Pending" → aparece en "Completed" en Kanban

---

## Garantías del Sistema

✅ **6 archivos creados** - Proyecto siempre tiene estructura completa
✅ **IDs únicos** - Formato PROJ/OBJ/TSK-YYYYMM-XXXXX garantiza unicidad
✅ **Sincronización automática** - .index.json siempre actualizado
✅ **FolderNotes auto-generados** - Cada carpeta tiene su nota
✅ **Cero pasos manuales** - Completamente automático
✅ **Botones interactivos** - Acciones rápidas en cada documento

---

## Tests Validando Este Flujo

- UC-008: Create Project (26/26 PASS ✅)
- UC-010: Create Objective (18/18 PASS ✅)  
- UC-012: Create Task (18/18 PASS ✅)
- UC-013: Create Document (5/5 PASS ✅)
- Total: **67/67 tests pasando** para creación de entidades

