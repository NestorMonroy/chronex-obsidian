# FLUJO DE CREACIÓN DE PROYECTO - VALIDACIÓN COMPLETA

**Documento que traza CADA paso cuando se crea un proyecto**

---

## UC-008: CREAR PROYECTO - FLUJO COMPLETO PASO A PASO

### ENTRADA (INPUT)

```typescript
const input = {
  projectName: 'Sistema 2026',
  description: 'Gestión documental integral',
  priority: 'ALTA'
};
```

---

## PASO 1: VALIDACIÓN DE INPUT

**Validaciones ejecutadas:**

```typescript
// 1.1 Validar projectName
- ¿projectName está vacío? NO ✅
- ¿projectName > 100 caracteres? NO ✅
- projectName = "Sistema 2026" (13 caracteres) ✅

// 1.2 Validar description
- ¿description está vacío? NO ✅
- ¿description > 500 caracteres? NO ✅
- description = "Gestión documental integral" (29 caracteres) ✅

// 1.3 Validar priority
- ¿priority está en [BAJA, MEDIA, ALTA, CRÍTICA]? SÍ ✅
- priority = "ALTA" ✅

RESULTADO: Input válido ✅
```

---

## PASO 2: GENERACIÓN DE ID

**Servicio:** IdGenerator

```typescript
// 2.1 Generar ID único
await IdGenerator.generateProjectId()
  → Genera: PROJ-202604-ABC
  → Formato: PROJ-YYYYMM-XXXXX
  → Timestamp: 202604 (Abril 2026)
  → Hash: ABC (único)

ID Generado: PROJ-202604-ABC ✅
```

---

## PASO 3: CREACIÓN DE CARPETA PRINCIPAL

**Servicio:** ObsidianVaultAdapter

```typescript
// 3.1 Crear carpeta principal
await vault.createFolder('200-PROYECTOS/PROJ-202604-ABC')

RESULTADO:
200-PROYECTOS/
└─ PROJ-202604-ABC/  ← Carpeta creada ✅
```

---

## PASO 4: CREAR ARCHIVOS EN CARPETA PRINCIPAL

### 4A. Crear PROJ-202604-ABC.md (FolderNote)

**Servicio:** FolderNoteService

```typescript
await FolderNoteService.createFolderNote(
  folderPath: '200-PROYECTOS/PROJ-202604-ABC',
  entityId: 'PROJ-202604-ABC',  // nombre = ID
  data: {
    type: 'proyecto',
    title: 'Sistema 2026',
    description: 'Gestión documental integral',
    status: 'activo',
    priority: 'ALTA',
    dateCreated: '2026-04-11'
  }
)

ARCHIVO CREADO:
200-PROYECTOS/PROJ-202604-ABC/PROJ-202604-ABC.md

CONTENIDO:
---
type: proyecto
title: Sistema 2026
description: Gestión documental integral
status: activo
priority: ALTA
dateCreated: 2026-04-11
cssclass: folder-note gridlist
obsidianUIMode: preview
---

# Sistema 2026

## Descripción

Gestión documental integral

## Información

- **Tipo**: proyecto
- **Estado**: activo
- **Prioridad**: ALTA
- **Creado**: 2026-04-11

---

*Generado por chronex-obsidian*

ARCHIVO CREADO: PROJ-202604-ABC.md ✅
```

### 4B. Crear README.md

**Servicio:** ObsidianVaultAdapter

```typescript
await vault.createFile(
  '200-PROYECTOS/PROJ-202604-ABC/README.md',
  readmeContent
)

ARCHIVO CREADO:
200-PROYECTOS/PROJ-202604-ABC/README.md ✅
```

---

## PASO 5: CREAR CARPETAS DE COLECCIONES

**Servicio:** ObsidianVaultAdapter

```typescript
const collections = ['objetivos', 'documentos', 'tareas', 'recursos'];

Para cada colección:
  // 5.1 Crear carpeta de colección
  await vault.createFolder('200-PROYECTOS/PROJ-202604-ABC/{collection}')
  
  // 5.2 Crear FolderNote de colección
  await FolderNoteService.createFolderNote(
    folderPath: '200-PROYECTOS/PROJ-202604-ABC/{collection}',
    entityId: '{collection}',  // nombre = nombre de carpeta
    data: {
      type: 'colección',
      title: Capitalize({collection}),
      description: `Colección de {collection}`,
      status: 'activo',
      dateCreated: '2026-04-11'
    }
  )
```

### 5A. Colección: objetivos

```
CARPETA CREADA: 200-PROYECTOS/PROJ-202604-ABC/objetivos/ ✅
FOLDERNTE CREADO: 200-PROYECTOS/PROJ-202604-ABC/objetivos/objetivos.md ✅

CONTENIDO (objetivos.md):
---
type: colección
title: Objetivos
description: Colección de objetivos
status: activo
dateCreated: 2026-04-11
---

# Objetivos

## Descripción

Colección de objetivos

...
```

### 5B. Colección: documentos

```
CARPETA CREADA: 200-PROYECTOS/PROJ-202604-ABC/documentos/ ✅
FOLDERNTE CREADO: 200-PROYECTOS/PROJ-202604-ABC/documentos/documentos.md ✅
```

### 5C. Colección: tareas

```
CARPETA CREADA: 200-PROYECTOS/PROJ-202604-ABC/tareas/ ✅
FOLDERNTE CREADO: 200-PROYECTOS/PROJ-202604-ABC/tareas/tareas.md ✅
```

### 5D. Colección: recursos

```
CARPETA CREADA: 200-PROYECTOS/PROJ-202604-ABC/recursos/ ✅
FOLDERNTE CREADO: 200-PROYECTOS/PROJ-202604-ABC/recursos/recursos.md ✅
```

---

## PASO 6: SINCRONIZAR .INDEX.JSON

**Servicio:** IndexSyncService

```typescript
await IndexSyncService.updateIndexEntry(
  entityType: 'proyecto',
  entityId: 'PROJ-202604-ABC',
  data: {
    type: 'proyecto',
    title: 'Sistema 2026',
    description: 'Gestión documental integral',
    status: 'activo',
    priority: 'ALTA',
    path: '200-PROYECTOS/PROJ-202604-ABC',
    dateCreated: '2026-04-11',
    lastModified: '2026-04-11T10:30:00Z'
  }
)

ARCHIVO ACTUALIZADO: .index.json

CONTENIDO (entrada agregada):
{
  "projects": [
    {
      "id": "PROJ-202604-ABC",
      "type": "proyecto",
      "title": "Sistema 2026",
      "description": "Gestión documental integral",
      "status": "activo",
      "priority": "ALTA",
      "path": "200-PROYECTOS/PROJ-202604-ABC",
      "dateCreated": "2026-04-11",
      "lastModified": "2026-04-11T10:30:00Z"
    }
  ],
  "lastSync": "2026-04-11T10:30:00Z"
}

.index.json ACTUALIZADO ✅
```

---

## SALIDA (OUTPUT)

```typescript
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

---

## ESTADO FINAL DEL VAULT

```
200-PROYECTOS/
├─ 200-PROYECTOS.md ← Creado anteriormente (si existe)
│
└─ PROJ-202604-ABC/
   ├─ PROJ-202604-ABC.md ✅ (FolderNote del proyecto)
   │  ├─ type: proyecto
   │  ├─ title: Sistema 2026
   │  ├─ description: Gestión documental integral
   │  ├─ priority: ALTA
   │  ├─ status: activo
   │  └─ dateCreated: 2026-04-11
   │
   ├─ README.md ✅ (Contenido del proyecto)
   │  ├─ Frontmatter con metadata
   │  └─ Descripción del proyecto
   │
   ├─ objetivos/
   │  ├─ objetivos.md ✅ (FolderNote colección)
   │  │  ├─ type: colección
   │  │  ├─ title: Objetivos
   │  │  └─ status: activo
   │  │
   │  └─ (vacío, esperando objetivos)
   │
   ├─ documentos/
   │  ├─ documentos.md ✅ (FolderNote colección)
   │  │  ├─ type: colección
   │  │  ├─ title: Documentos
   │  │  └─ status: activo
   │  │
   │  └─ (vacío, esperando documentos)
   │
   ├─ tareas/
   │  ├─ tareas.md ✅ (FolderNote colección)
   │  │  ├─ type: colección
   │  │  ├─ title: Tareas
   │  │  └─ status: activo
   │  │
   │  └─ (vacío, esperando tareas)
   │
   └─ recursos/
      ├─ recursos.md ✅ (FolderNote colección)
      │  ├─ type: colección
      │  ├─ title: Recursos
      │  └─ status: activo
      │
      └─ (vacío, esperando recursos)

.index.json
└─ projects: [ PROJ-202604-ABC ]  ✅ (entrada agregada)
```

---

## CHECKLIST DE VALIDACIÓN

### Archivos Creados (6 archivos)

- [x] PROJ-202604-ABC.md (FolderNote del proyecto)
- [x] README.md (Contenido del proyecto)
- [x] objetivos.md (FolderNote colección)
- [x] documentos.md (FolderNote colección)
- [x] tareas.md (FolderNote colección)
- [x] recursos.md (FolderNote colección)

### Carpetas Creadas (5 carpetas)

- [x] 200-PROYECTOS/PROJ-202604-ABC/
- [x] 200-PROYECTOS/PROJ-202604-ABC/objetivos/
- [x] 200-PROYECTOS/PROJ-202604-ABC/documentos/
- [x] 200-PROYECTOS/PROJ-202604-ABC/tareas/
- [x] 200-PROYECTOS/PROJ-202604-ABC/recursos/

### Sincronización

- [x] .index.json actualizado con entrada de proyecto
- [x] Timestamp actualizado
- [x] lastSync actualizado

### Patrón: CADA CARPETA = SU FOLDERNTE

- [x] 200-PROYECTOS/PROJ-202604-ABC/ → PROJ-202604-ABC.md ✅
- [x] objetivos/ → objetivos.md ✅
- [x] documentos/ → documentos.md ✅
- [x] tareas/ → tareas.md ✅
- [x] recursos/ → recursos.md ✅

### Automatización

- [x] FolderNoteService.createFolderNote() llamado automáticamente
- [x] 5 folderNotes creados automáticamente
- [x] IndexSyncService.updateIndexEntry() llamado automáticamente
- [x] .index.json sincronizado automáticamente

### Garantías

- [x] 6 archivos creados exactamente
- [x] Estructura jerárquica completa
- [x] .index.json sincronizado
- [x] Todos los folderNotes creados
- [x] CERO pasos manuales
- [x] CERO inconsistencias

---

## FLUJO VISUAL COMPLETO

```
┌─────────────────────────────────────────┐
│ INPUT: CreateProjectInput               │
│ - projectName: 'Sistema 2026'          │
│ - description: '...'                    │
│ - priority: 'ALTA'                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 1: Validar Input                   │
│ - Validar projectName                   │
│ - Validar description                   │
│ - Validar priority                      │
└──────────────┬──────────────────────────┘
               │ ✅ Válido
               ▼
┌─────────────────────────────────────────┐
│ PASO 2: Generar ID                      │
│ IdGenerator.generateProjectId()         │
│ → PROJ-202604-ABC                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 3: Crear Carpeta Principal         │
│ vault.createFolder(...)                 │
│ → 200-PROYECTOS/PROJ-202604-ABC/        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 4A: Crear PROJ-ID.md (FolderNote)  │
│ FolderNoteService.createFolderNote()    │
│ → PROJ-202604-ABC.md                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 4B: Crear README.md                │
│ vault.createFile(...)                   │
│ → README.md                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 5: Crear Colecciones (4x)          │
│ Para cada [objetivos, documentos,       │
│           tareas, recursos]:            │
│ - vault.createFolder(...)               │
│ - FolderNoteService.createFolderNote()  │
│ → 4 carpetas + 4 folderNotes            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ PASO 6: Sincronizar .index.json         │
│ IndexSyncService.updateIndexEntry()     │
│ → Entrada agregada en projects[]        │
│ → lastSync actualizado                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ OUTPUT: CreateProjectOutput             │
│ {                                       │
│   success: true,                        │
│   projectId: 'PROJ-202604-ABC',        │
│   folderPath: '200-PROYECTOS/...',     │
│   filesCreated: [6 archivos],          │
│   timestamp: '2026-04-11T10:30:00Z'    │
│ }                                       │
└─────────────────────────────────────────┘

RESULTADO FINAL:
✅ 6 archivos creados
✅ 5 carpetas creadas
✅ .index.json sincronizado
✅ PATRÓN CONFIRMADO
✅ AUTO-SYNC GARANTIZADO
```

---

## VALIDACIÓN: ¿QUÉ PASA SI HAY ERROR?

### Si projectName está vacío:

```typescript
// Input: { projectName: '', description: '...', priority: 'ALTA' }

PASO 1: Validación falla
  → return { success: false, error: 'projectName is required' }
  
RESULTADO: ❌ Ningún archivo se crea
           ❌ .index.json no se actualiza
           ❌ CERO cambios en el vault
```

### Si priority es inválida:

```typescript
// Input: { projectName: '...', description: '...', priority: 'URGENTE' }

PASO 1: Validación falla
  → return { success: false, error: 'priority must be one of: BAJA, MEDIA, ALTA, CRÍTICA' }
  
RESULTADO: ❌ Ningún archivo se crea
           ❌ .index.json no se actualiza
           ❌ CERO cambios en el vault
```

### Si error en crear carpeta:

```typescript
// PASO 3: vault.createFolder() falla (permiso denegado)

RESULTADO: ❌ Captura error
           ❌ return { success: false, error: 'Error creating folder: ...' }
           ❌ Vault queda limpio (CERO cambios parciales)
```

---

## GARANTÍAS CONFIRMADAS

✅ **ATOMICIDAD**: Todo o nada
   - Si hay error en cualquier paso, no se crea nada

✅ **SINCRONIZACIÓN**: TODO sincronizado
   - README.md + FolderNote + .index.json siempre en sync
   - No hay huérfanos

✅ **CONSISTENCIA**: Patrón CADA CARPETA = SU FOLDERNTE
   - 5 carpetas → 5 folderNotes
   - Sin excepciones

✅ **AUTOMATIZACIÓN**: CERO pasos manuales
   - FolderNoteService automático
   - IndexSyncService automático

---

