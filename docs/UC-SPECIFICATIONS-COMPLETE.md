# USE CASES SPECIFICATION - Complete CRUD with FolderNote

## Estructura de Carpetas (Actualizada)

```
200-PROYECTOS/
├─ PROJ-202604-ABC/
│  ├─ PROJ-202604-ABC.md ← FolderNote (nombre = ID)
│  ├─ README.md
│  ├─ objetivos/
│  │  ├─ OBJ-202604-XYZ.md ← FolderNote (nombre = ID)
│  │  ├─ OBJ-202604-XYZ/
│  │  │  ├─ OBJ-202604-XYZ.md ← FolderNote espejo
│  │  │  └─ README.md
│  │  └─ tareas/
│  │     ├─ TSK-202604-LMN.md ← FolderNote (nombre = ID)
│  │     └─ TSK-202604-LMN/
│  │        ├─ TSK-202604-LMN.md ← FolderNote espejo
│  │        └─ README.md
│  ├─ documentos/
│  │  ├─ DOC-202604-RST.md ← FolderNote (nombre = ID)
│  │  └─ DOC-202604-RST/
│  │     ├─ DOC-202604-RST.md ← FolderNote espejo
│  │     └─ README.md
│  └─ recursos/
│     └─ ...

.index.json ← Índice global sincronizado automáticamente
```

## UC-008: Crear Proyecto (CREATE)

**Descripción:** Usuario crea un nuevo proyecto

**Entradas:**
- `projectName: string` (ej: "Sistema 2026")
- `description: string` (ej: "Gestión documental integral")
- `priority: enum` (BAJA | MEDIA | ALTA | CRÍTICA)

**Proceso:**
1. Validar entrada (Validator)
2. Generar ID: `PROJ-YYYYMM-XXXXX`
3. Crear carpeta: `200-PROYECTOS/PROJ-ID/`
4. Crear `README.md` con frontmatter YAML
5. **Crear `PROJ-ID.md` (FolderNote)** ← AUTO
   - Nombre = ID
   - Contenido: metadata + descripción visual
   - Oculto según config
6. Crear subcarpetas: `objetivos/`, `documentos/`, `recursos/`
7. **Crear folderNotes para subcarpetas:**
   - `carpeta.md` (nombre genérico para subcarpetas)
8. **Sincronizar .index.json** ← AUTO
   - Agregar entrada en `projects[]`
   - Timestamp: now()

**Salida:**
```json
{
  "success": true,
  "projectId": "PROJ-202604-ABC",
  "folderPath": "200-PROYECTOS/PROJ-202604-ABC",
  "notePath": "200-PROYECTOS/PROJ-202604-ABC/PROJ-202604-ABC.md"
}
```

**Archivos Creados:**
- ✅ `README.md`
- ✅ `PROJ-202604-ABC.md` (FolderNote)
- ✅ `objetivos/carpeta.md`
- ✅ `documentos/carpeta.md`
- ✅ `recursos/carpeta.md`
- ✅ `.index.json` (sincronizado)

---

## UC-010: Crear Objetivo (CREATE)

**Descripción:** Usuario crea objetivo dentro de proyecto

**Entradas:**
- `objectiveName: string`
- `description: string`
- `priority: enum`
- `parentProjectId: string`

**Proceso:**
1. Validar entrada
2. Generar ID: `OBJ-YYYYMM-XXXXX`
3. Crear carpeta: `200-PROYECTOS/{parentId}/objetivos/OBJ-ID/`
4. Crear `README.md` con frontmatter
5. **Crear `OBJ-ID.md` (FolderNote)** ← AUTO
   - Nombre = ID (OBJ-202604-XYZ)
6. **Sincronizar .index.json** ← AUTO

**Archivos Creados:**
- ✅ `README.md`
- ✅ `OBJ-202604-XYZ.md` (FolderNote)
- ✅ `.index.json` (sincronizado)

---

## UC-012: Crear Tarea (CREATE)

**Descripción:** Usuario crea tarea dentro de objetivo

**Entradas:**
- `taskName: string`
- `description: string`
- `dueDate: string` (YYYY-MM-DD)
- `priority: enum`
- `parentObjectiveId: string`

**Proceso:**
1. Validar entrada
2. Generar ID: `TSK-YYYYMM-XXXXX`
3. Crear carpeta: `200-PROYECTOS/{projectId}/objetivos/{objId}/tareas/TSK-ID/`
4. Crear `README.md` con frontmatter
5. **Crear `TSK-ID.md` (FolderNote)** ← AUTO
   - Nombre = ID (TSK-202604-LMN)
6. **Sincronizar .index.json** ← AUTO

**Archivos Creados:**
- ✅ `README.md`
- ✅ `TSK-202604-LMN.md` (FolderNote)
- ✅ `.index.json` (sincronizado)

---

## UC-013: Crear Documento (CREATE)

**Descripción:** Usuario crea documento en repositorio

**Entradas:**
- `documentName: string`
- `description: string`
- `category: string` (General | Técnico | Legal)

**Proceso:**
1. Validar entrada
2. Generar ID: `DOC-YYYYMM-XXXXX`
3. Crear carpeta: `500-REPOSITORIOS/{category}/DOC-ID/`
4. Crear `README.md` con frontmatter
5. **Crear `DOC-ID.md` (FolderNote)** ← AUTO
   - Nombre = ID (DOC-202604-RST)
6. **Sincronizar .index.json** ← AUTO

**Archivos Creados:**
- ✅ `README.md`
- ✅ `DOC-202604-RST.md` (FolderNote)
- ✅ `.index.json` (sincronizado)

---

## UC-019: Editar Entidad (UPDATE)

**Descripción:** Usuario edita metadatos de entidad

**Entradas:**
- `entityId: string` (ej: "PROJ-202604-ABC")
- `entityType: enum` (proyecto | objetivo | tarea | documento)
- `updates: object` {
    - `title?: string`
    - `description?: string`
    - `status?: string`
    - `priority?: string`
  }
- `folderPath: string`

**Proceso:**
1. Validar entrada
2. Leer `README.md` actual
3. Actualizar `README.md` con nuevos valores
4. **Actualizar `ENTITY-ID.md` (FolderNote)** ← AUTO
   - FolderNoteService.updateFolderNoteOnMetadataChange()
   - Detecta cambios en title, description, status
   - Regenera contenido completo
5. **Sincronizar .index.json** ← AUTO
   - IndexSyncService.updateIndexEntry()
   - Actualiza lastModified

**Archivos Modificados:**
- ✅ `README.md` (modificado)
- ✅ `PROJ-202604-ABC.md` (actualizado automáticamente)
- ✅ `.index.json` (sincronizado automáticamente)

**Garantía:** TODO EN SYNC, CERO INCONSISTENCIAS

---

## UC-020: Eliminar Entidad (DELETE)

**Descripción:** Usuario elimina entidad completamente

**Entradas:**
- `entityId: string`
- `entityType: enum`
- `folderPath: string`
- `permanent: boolean` (true = eliminar todo)

**Proceso:**
1. Validar entrada
2. **Eliminar `ENTITY-ID.md` (FolderNote)** ← AUTO
   - FolderNoteService.deleteFolderNote()
3. Eliminar carpeta completa y contenido
4. **Sincronizar .index.json** ← AUTO
   - IndexSyncService.deleteIndexEntry()
   - Elimina entrada de colección

**Garantía:**
- ✅ CERO ARCHIVOS HUÉRFANOS
- ✅ CERO DATOS INCONSISTENTES
- ✅ .index.json actualizado

---

## UC-021: Archivar Entidad (ARCHIVE)

**Descripción:** Usuario archiva entidad (desactiva pero no elimina)

**Entradas:**
- `entityId: string`
- `entityType: enum`
- `folderPath: string`
- `archive: boolean` (true = archivar, false = restaurar)

**Proceso:**
1. Validar entrada
2. Leer `README.md`
3. Cambiar `status` a "archivado" (o "activo" si restaurar)
4. Escribir `README.md`
5. **Actualizar `ENTITY-ID.md` (FolderNote)** ← AUTO
   - FolderNoteService.updateFolderNoteOnMetadataChange()
   - Detecta cambio de status
   - Regenera contenido
6. **Sincronizar .index.json** ← AUTO

**Archivos Modificados:**
- ✅ `README.md` (status = archivado)
- ✅ `PROJ-202604-ABC.md` (actualizado automáticamente)
- ✅ `.index.json` (sincronizado automáticamente)

---

## UC-015: Listar Proyectos (READ)

**Descripción:** Sistema obtiene lista de proyectos

**Proceso:**
1. Leer `.index.json`
2. Filtrar `projects[]`
3. Retornar array ordenado

**Fuente:** `.index.json` (actualizado automáticamente en cada operación)

---

## FLUJO AUTOMÁTICO COMPLETO

```
CREATE → FolderNote (ID.md) + IndexSync (.index.json)
UPDATE → FolderNote (auto-rename) + IndexSync (auto-update)
DELETE → FolderNote (auto-delete) + IndexSync (auto-delete)
ARCHIVE → FolderNote (auto-update status) + IndexSync (auto-update)

TODO AUTOMÁTICO = CERO PASOS MANUALES = SINCRONIZACIÓN PERFECTA
```

