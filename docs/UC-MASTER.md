# USE CASES MASTER SPECIFICATION

## SINGLE SOURCE OF TRUTH para obsidian-repo

**Última actualización:** 2026-04-11  
**Patrón:** CADA CARPETA = SU FOLDERNTE  
**Estado:** DEFINITIVO ✅

---

## ÍNDICE

1. [Regla Universal](#regla-universal)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [UC-008: Crear Proyecto](#uc-008-crear-proyecto)
4. [UC-010: Crear Objetivo](#uc-010-crear-objetivo)
5. [UC-012: Crear Tarea](#uc-012-crear-tarea)
6. [UC-013: Crear Documento](#uc-013-crear-documento)
7. [UC-019: Editar Entidad](#uc-019-editar-entidad)
8. [UC-020: Eliminar Entidad](#uc-020-eliminar-entidad)
9. [UC-021: Archivar Entidad](#uc-021-archivar-entidad)
10. [UC-015: Listar Proyectos](#uc-015-listar-proyectos)
11. [Flujo Automático](#flujo-automático-completo)

---

## REGLA UNIVERSAL

**CADA CARPETA = SU FOLDERNTE**

No hay excepciones. Toda carpeta tiene un folderNote.

- **FolderNote de entidad:** Nombre = ID (ej: PROJ-202604-ABC.md)
- **FolderNote de colección:** Nombre = nombre de carpeta (ej: objetivos.md)
- **FolderNote de categoría:** Nombre = nombre de carpeta (ej: General.md)

---

## ESTRUCTURA DE CARPETAS

```
200-PROYECTOS/
├─ 200-PROYECTOS.md ✨ FOLDERNTE
│
├─ PROJ-202604-ABC/
│  ├─ PROJ-202604-ABC.md ✨ FOLDERNTE
│  ├─ README.md
│  │
│  ├─ objetivos/
│  │  ├─ objetivos.md ✨ FOLDERNTE
│  │  │
│  │  ├─ OBJ-202604-XYZ/
│  │  │  ├─ OBJ-202604-XYZ.md ✨ FOLDERNTE
│  │  │  └─ README.md
│  │  │
│  │  └─ tareas/
│  │     ├─ tareas.md ✨ FOLDERNTE
│  │     │
│  │     ├─ TSK-202604-LMN/
│  │     │  ├─ TSK-202604-LMN.md ✨ FOLDERNTE
│  │     │  └─ README.md
│  │
│  ├─ documentos/
│  │  ├─ documentos.md ✨ FOLDERNTE
│  │  │
│  │  ├─ DOC-202604-RST/
│  │  │  ├─ DOC-202604-RST.md ✨ FOLDERNTE
│  │  │  └─ README.md
│  │
│  └─ recursos/
│     ├─ recursos.md ✨ FOLDERNTE
│     └─ ...

500-REPOSITORIOS/
├─ 500-REPOSITORIOS.md ✨ FOLDERNTE
│
├─ General/
│  ├─ General.md ✨ FOLDERNTE
│  │
│  ├─ DOC-202604-XYZ/
│  │  ├─ DOC-202604-XYZ.md ✨ FOLDERNTE
│  │  └─ README.md
│
├─ Técnico/
│  ├─ Técnico.md ✨ FOLDERNTE
│  └─ ...
│
└─ Legal/
   ├─ Legal.md ✨ FOLDERNTE
   └─ ...

.index.json ← Sincronizado automáticamente
```

---

## UC-008: CREAR PROYECTO

**ID del caso:** UC-008  
**Actor:** Usuario  
**Descripción:** El usuario crea un nuevo proyecto

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| projectName | string | "Sistema 2026" | ✅ |
| description | string | "Gestión documental" | ✅ |
| priority | enum | BAJA \| MEDIA \| ALTA \| CRÍTICA | ✅ |

### Proceso Paso a Paso

1. **Validar input** (Validator)
   - projectName: no vacío, ≤100 caracteres
   - description: no vacío, ≤500 caracteres
   - priority: valor en enum

2. **Generar ID:** `PROJ-YYYYMM-XXXXX`
   - Ejemplo: PROJ-202604-ABC

3. **Crear carpeta principal:** `200-PROYECTOS/PROJ-ID/`

4. **Crear files en carpeta principal:**
   - ✅ `PROJ-ID.md` ← FolderNote (AUTO por FolderNoteService)
   - ✅ `README.md` ← Contenido técnico

5. **Crear carpetas de colecciones:**
   - ✅ `objetivos/` → `objetivos.md` ← FolderNote (AUTO)
   - ✅ `documentos/` → `documentos.md` ← FolderNote (AUTO)
   - ✅ `tareas/` → `tareas.md` ← FolderNote (AUTO)
   - ✅ `recursos/` → `recursos.md` ← FolderNote (AUTO)

6. **Sincronizar .index.json** (AUTO por IndexSyncService)
   - Agregar entrada en projects[]
   - Actualizar lastSync

### Output

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

### Garantías

- ✅ 6 archivos creados (1 proyecto + 4 colecciones + 1 README)
- ✅ Estructura jerárquica completa
- ✅ .index.json sincronizado
- ✅ Todos los folderNotes creados automáticamente
- ✅ CERO pasos manuales

### Archivos Finales

```
200-PROYECTOS/PROJ-202604-ABC/
├─ PROJ-202604-ABC.md ← FolderNote (AUTO)
├─ README.md
├─ objetivos/
│  └─ objetivos.md ← FolderNote (AUTO)
├─ documentos/
│  └─ documentos.md ← FolderNote (AUTO)
├─ tareas/
│  └─ tareas.md ← FolderNote (AUTO)
└─ recursos/
   └─ recursos.md ← FolderNote (AUTO)
```

---

## UC-010: CREAR OBJETIVO

**ID del caso:** UC-010  
**Actor:** Usuario  
**Descripción:** El usuario crea objetivo dentro de proyecto

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| objectiveName | string | "Objetivo Q1" | ✅ |
| description | string | "Lograr X" | ✅ |
| priority | enum | BAJA \| MEDIA \| ALTA \| CRÍTICA | ✅ |
| parentProjectId | string | "PROJ-202604-ABC" | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Generar ID:** `OBJ-YYYYMM-XXXXX`
3. **Crear carpeta:** `objetivos/OBJ-ID/`
4. **Crear files:**
   - ✅ `OBJ-ID.md` ← FolderNote (AUTO)
   - ✅ `README.md`
5. **Sincronizar .index.json** (AUTO)

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

### Archivos Finales

```
objetivos/OBJ-202604-XYZ/
├─ OBJ-202604-XYZ.md ← FolderNote (AUTO)
└─ README.md
```

---

## UC-012: CREAR TAREA

**ID del caso:** UC-012  
**Actor:** Usuario  
**Descripción:** El usuario crea tarea dentro de objetivo

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| taskName | string | "Tarea 1" | ✅ |
| description | string | "Hacer X" | ✅ |
| dueDate | string (YYYY-MM-DD) | "2026-04-20" | ✅ |
| parentObjectiveId | string | "OBJ-202604-XYZ" | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Generar ID:** `TSK-YYYYMM-XXXXX`
3. **Crear carpeta:** `tareas/TSK-ID/`
4. **Crear files:**
   - ✅ `TSK-ID.md` ← FolderNote (AUTO)
   - ✅ `README.md`
5. **Sincronizar .index.json** (AUTO)

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

### Archivos Finales

```
tareas/TSK-202604-LMN/
├─ TSK-202604-LMN.md ← FolderNote (AUTO)
└─ README.md
```

---

## UC-013: CREAR DOCUMENTO

**ID del caso:** UC-013  
**Actor:** Usuario  
**Descripción:** El usuario crea documento en repositorio

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| documentName | string | "Documento 1" | ✅ |
| description | string | "Descripción" | ✅ |
| category | string | "General" \| "Técnico" \| "Legal" | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Verificar categoría:**
   - Si no existe: Crear `{Category}/` → `{Category}.md` ← FolderNote (AUTO)
3. **Generar ID:** `DOC-YYYYMM-XXXXX`
4. **Crear carpeta:** `{Category}/DOC-ID/`
5. **Crear files:**
   - ✅ `DOC-ID.md` ← FolderNote (AUTO)
   - ✅ `README.md`
6. **Sincronizar .index.json** (AUTO)

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

### Archivos Finales

```
500-REPOSITORIOS/General/DOC-202604-RST/
├─ DOC-202604-RST.md ← FolderNote (AUTO)
└─ README.md
```

---

## UC-019: EDITAR ENTIDAD

**ID del caso:** UC-019  
**Actor:** Usuario  
**Descripción:** El usuario edita metadatos de entidad

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| entityId | string | "PROJ-202604-ABC" | ✅ |
| entityType | enum | proyecto \| objetivo \| tarea \| documento | ✅ |
| updates | object | { title, description, status, priority } | ✅ |
| folderPath | string | "200-PROYECTOS/PROJ-202604-ABC" | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Leer README.md** actual
3. **Actualizar README.md** con nuevos valores
4. **Auto-actualizar FolderNote** (FolderNoteService)
   - Detecta cambios en: title, description, status, priority
   - Regenera contenido completo
5. **Auto-sincronizar .index.json** (IndexSyncService)
   - Actualiza entry con nuevos valores
   - Actualiza lastModified

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "updated": {
    "title": "Nuevo Título",
    "description": "Nueva descripción"
  }
}
```

### Garantías

- ✅ README.md actualizado
- ✅ FolderNote auto-actualizado
- ✅ .index.json auto-sincronizado
- ✅ TODO EN SYNC

---

## UC-020: ELIMINAR ENTIDAD

**ID del caso:** UC-020  
**Actor:** Usuario  
**Descripción:** El usuario elimina entidad completamente

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| entityId | string | "PROJ-202604-ABC" | ✅ |
| entityType | enum | proyecto \| objetivo \| tarea \| documento | ✅ |
| folderPath | string | "200-PROYECTOS/PROJ-202604-ABC" | ✅ |
| permanent | boolean | true | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Auto-eliminar FolderNote** (FolderNoteService)
3. **Eliminar carpeta completa** y contenido
4. **Auto-eliminar del .index.json** (IndexSyncService)

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "deleted": true
}
```

### Garantías

- ✅ Carpeta eliminada
- ✅ FolderNote auto-eliminado
- ✅ .index.json auto-actualizado
- ✅ CERO HUÉRFANOS
- ✅ CERO INCONSISTENCIAS

---

## UC-021: ARCHIVAR ENTIDAD

**ID del caso:** UC-021  
**Actor:** Usuario  
**Descripción:** El usuario archiva entidad (desactiva pero no elimina)

### Input

| Campo | Tipo | Ejemplo | Requerido |
|-------|------|---------|-----------|
| entityId | string | "PROJ-202604-ABC" | ✅ |
| entityType | enum | proyecto \| objetivo \| tarea \| documento | ✅ |
| folderPath | string | "200-PROYECTOS/PROJ-202604-ABC" | ✅ |
| archive | boolean | true (archivar) \| false (restaurar) | ✅ |

### Proceso Paso a Paso

1. **Validar input**
2. **Leer README.md**
3. **Cambiar status:**
   - Si archive=true: status = "archivado"
   - Si archive=false: status = "activo"
4. **Escribir README.md**
5. **Auto-actualizar FolderNote** (FolderNoteService)
6. **Auto-sincronizar .index.json** (IndexSyncService)

### Output

```json
{
  "success": true,
  "entityId": "PROJ-202604-ABC",
  "newStatus": "archivado"
}
```

### Garantías

- ✅ README.md actualizado
- ✅ FolderNote auto-actualizado
- ✅ .index.json auto-sincronizado
- ✅ Carpeta NO se elimina
- ✅ TODO EN SYNC

---

## UC-015: LISTAR PROYECTOS

**ID del caso:** UC-015  
**Actor:** Sistema  
**Descripción:** Sistema obtiene lista de proyectos

### Proceso

1. **Leer .index.json**
2. **Retornar projects[]**
3. **Ordenar por** lastModified (DESC)

### Output

```json
{
  "success": true,
  "projects": [
    {
      "id": "PROJ-202604-ABC",
      "title": "Sistema 2026",
      "description": "Gestión documental",
      "status": "activo",
      "priority": "ALTA",
      "dateCreated": "2026-04-11",
      "lastModified": "2026-04-11T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## FLUJO AUTOMÁTICO COMPLETO

```
╔═════════════════════════════════════════════════════════════════╗
║                      CREATE (UC-008)                            ║
╠═════════════════════════════════════════════════════════════════╣
║ 1. Validar input                                                ║
║ 2. Generar ID (PROJ-YYYYMM-XXXXX)                              ║
║ 3. Crear carpeta: 200-PROYECTOS/PROJ-ID/                       ║
║ 4. Crear README.md                                              ║
║ 5. AUTO-CREAR: PROJ-ID.md (FolderNoteService)                  ║
║ 6. Crear carpetas: objetivos/, documentos/, tareas/, recursos/ ║
║ 7. AUTO-CREAR: objetivos.md, documentos.md, tareas.md, etc.    ║
║ 8. AUTO-SYNC: .index.json (IndexSyncService)                   ║
║                                                                 ║
║ RESULTADO: 6 archivos creados, TODO EN SYNC                    ║
╚═════════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════════╗
║                      UPDATE (UC-019)                            ║
╠═════════════════════════════════════════════════════════════════╣
║ 1. User edita README.md (cambiar title)                         ║
║ 2. Actualizar README.md                                         ║
║ 3. AUTO-ACTUALIZAR: PROJ-ID.md (FolderNoteService)             ║
║ 4. AUTO-SYNC: .index.json (IndexSyncService)                   ║
║                                                                 ║
║ RESULTADO: README + FolderNote + Index EN SYNC                 ║
╚═════════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════════╗
║                      DELETE (UC-020)                            ║
╠═════════════════════════════════════════════════════════════════╣
║ 1. Validar input                                                ║
║ 2. AUTO-ELIMINAR: PROJ-ID.md (FolderNoteService)               ║
║ 3. Eliminar carpeta completa                                    ║
║ 4. AUTO-ELIMINAR: entrada en .index.json (IndexSyncService)    ║
║                                                                 ║
║ RESULTADO: CERO HUÉRFANOS, CERO INCONSISTENCIAS                ║
╚═════════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════════╗
║                      ARCHIVE (UC-021)                           ║
╠═════════════════════════════════════════════════════════════════╣
║ 1. Cambiar status a "archivado" en README.md                    ║
║ 2. AUTO-ACTUALIZAR: PROJ-ID.md (FolderNoteService)             ║
║ 3. AUTO-SYNC: .index.json (IndexSyncService)                   ║
║                                                                 ║
║ RESULTADO: TODO EN SYNC, status actualizado                    ║
╚═════════════════════════════════════════════════════════════════╝
```

---

## GARANTÍAS FINALES

✅ **AUTOMATIZACIÓN TOTAL**
- Cada operación es 100% automática
- CERO pasos manuales
- CERO inconsistencias

✅ **SINCRONIZACIÓN PERFECTA**
- README.md + FolderNote + .index.json siempre en sync
- Cada cambio se refleja automáticamente en los 3 archivos
- Timestamps actualizados en tiempo real

✅ **DATOS LIMPIOS**
- CERO archivos huérfanos
- CERO entradas duplicadas
- CERO inconsistencias de estado

✅ **ESCALABILIDAD**
- Fácil agregar nuevas colecciones
- Fácil agregar nuevas categorías
- Patrón escalable sin límites

---

**Fin del Documento Maestro**

