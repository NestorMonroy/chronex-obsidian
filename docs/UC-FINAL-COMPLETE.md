# USE CASES SPECIFICATION - FINAL (Patrón Correcto)

## REGLA UNIVERSAL: CADA CARPETA = SU FOLDERNTE

No hay excepciones. Toda carpeta tiene su folderNote con el ID o nombre de la carpeta.

## Estructura Definitiva

```
200-PROYECTOS/
├─ 200-PROYECTOS.md ✨ ← FolderNote de la colección
│
├─ PROJ-202604-ABC/
│  ├─ PROJ-202604-ABC.md ✨ ← FolderNote del proyecto
│  ├─ README.md
│  │
│  ├─ objetivos/
│  │  ├─ objetivos.md ✨ ← FolderNote de la colección
│  │  │
│  │  ├─ OBJ-202604-XYZ/
│  │  │  ├─ OBJ-202604-XYZ.md ✨ ← FolderNote del objetivo
│  │  │  └─ README.md
│  │  │
│  │  ├─ OBJ-202604-UVW/
│  │  │  ├─ OBJ-202604-UVW.md ✨ ← FolderNote del objetivo
│  │  │  └─ README.md
│  │  │
│  │  └─ tareas/
│  │     ├─ tareas.md ✨ ← FolderNote de la colección
│  │     │
│  │     ├─ TSK-202604-LMN/
│  │     │  ├─ TSK-202604-LMN.md ✨ ← FolderNote de la tarea
│  │     │  └─ README.md
│  │     │
│  │     └─ TSK-202604-OPQ/
│  │        ├─ TSK-202604-OPQ.md ✨ ← FolderNote de la tarea
│  │        └─ README.md
│  │
│  ├─ documentos/
│  │  ├─ documentos.md ✨ ← FolderNote de la colección
│  │  │
│  │  ├─ DOC-202604-RST/
│  │  │  ├─ DOC-202604-RST.md ✨ ← FolderNote del documento
│  │  │  └─ README.md
│  │  │
│  │  └─ DOC-202604-UVW/
│  │     ├─ DOC-202604-UVW.md ✨ ← FolderNote del documento
│  │     └─ README.md
│  │
│  └─ recursos/
│     ├─ recursos.md ✨ ← FolderNote de la colección
│     └─ (archivos de recursos)
│
├─ PROJ-202604-DEF/
│  ├─ PROJ-202604-DEF.md ✨
│  ├─ README.md
│  └─ ... (igual estructura)
│
└─ PROJ-202604-GHI/
   ├─ PROJ-202604-GHI.md ✨
   ├─ README.md
   └─ ... (igual estructura)

500-REPOSITORIOS/
├─ 500-REPOSITORIOS.md ✨ ← FolderNote de la colección
│
├─ General/
│  ├─ General.md ✨ ← FolderNote de la categoría
│  │
│  ├─ DOC-202604-XYZ/
│  │  ├─ DOC-202604-XYZ.md ✨ ← FolderNote del documento
│  │  └─ README.md
│  │
│  └─ DOC-202604-ABC/
│     ├─ DOC-202604-ABC.md ✨ ← FolderNote del documento
│     └─ README.md
│
├─ Técnico/
│  ├─ Técnico.md ✨ ← FolderNote de la categoría
│  └─ ...
│
└─ Legal/
   ├─ Legal.md ✨ ← FolderNote de la categoría
   └─ ...

.index.json ← Sincronizado automáticamente
```

## UC-008: CREAR PROYECTO

**Input:**
- projectName: "Sistema 2026"
- description: "Gestión documental"
- priority: "ALTA"

**Proceso:**
1. Validar input
2. Generar ID: PROJ-202604-ABC
3. Crear estructura:
   - PROJ-202604-ABC/ (carpeta)
   - PROJ-202604-ABC.md ← FolderNote (AUTO)
   - README.md
   - objetivos/ (carpeta)
   - objetivos.md ← FolderNote (AUTO)
   - documentos/ (carpeta)
   - documentos.md ← FolderNote (AUTO)
   - tareas/ (carpeta)
   - tareas.md ← FolderNote (AUTO)
   - recursos/ (carpeta)
   - recursos.md ← FolderNote (AUTO)
4. Sincronizar .index.json (AUTO)

**Output:**
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
  ]
}
```

**Archivos Creados Automáticamente:**
- ✅ PROJ-202604-ABC.md (FolderNote)
- ✅ README.md
- ✅ objetivos.md (FolderNote colección)
- ✅ documentos.md (FolderNote colección)
- ✅ tareas.md (FolderNote colección)
- ✅ recursos.md (FolderNote colección)
- ✅ .index.json (sincronizado)

---

## UC-010: CREAR OBJETIVO

**Input:**
- objectiveName: "Objetivo 1"
- description: "Descripción"
- priority: "MEDIA"
- parentProjectId: "PROJ-202604-ABC"

**Proceso:**
1. Validar input
2. Generar ID: OBJ-202604-XYZ
3. Crear estructura:
   - objetivos/OBJ-202604-XYZ/ (carpeta)
   - OBJ-202604-XYZ.md ← FolderNote (AUTO)
   - README.md
4. Sincronizar .index.json (AUTO)

**Output:**
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

---

## UC-012: CREAR TAREA

**Input:**
- taskName: "Tarea 1"
- description: "Descripción"
- dueDate: "2026-04-20"
- parentObjectiveId: "OBJ-202604-XYZ"

**Proceso:**
1. Validar input
2. Generar ID: TSK-202604-LMN
3. Crear estructura:
   - tareas/TSK-202604-LMN/ (carpeta)
   - TSK-202604-LMN.md ← FolderNote (AUTO)
   - README.md
4. Sincronizar .index.json (AUTO)

**Output:**
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

---

## UC-013: CREAR DOCUMENTO

**Input:**
- documentName: "Documento 1"
- description: "Descripción"
- category: "General"

**Proceso:**
1. Validar input
2. Generar ID: DOC-202604-RST
3. Si category no existe:
   - Crear {Category}/ (carpeta)
   - Crear {Category}.md ← FolderNote (AUTO)
4. Crear estructura:
   - {Category}/DOC-202604-RST/ (carpeta)
   - DOC-202604-RST.md ← FolderNote (AUTO)
   - README.md
5. Sincronizar .index.json (AUTO)

**Output:**
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

---

## UC-019: EDITAR ENTIDAD

**Input:**
- entityId: "PROJ-202604-ABC"
- entityType: "proyecto"
- updates: { title: "Nuevo Título", description: "..." }
- folderPath: "200-PROYECTOS/PROJ-202604-ABC"

**Proceso:**
1. Actualizar README.md
2. Auto-actualizar FolderNote (AUTO)
3. Auto-sincronizar .index.json (AUTO)

**Garantía:**
- ✅ README.md actualizado
- ✅ PROJ-202604-ABC.md auto-actualizado
- ✅ .index.json auto-sincronizado
- ✅ TODO EN SYNC

---

## UC-020: ELIMINAR ENTIDAD

**Input:**
- entityId: "PROJ-202604-ABC"
- entityType: "proyecto"
- folderPath: "200-PROYECTOS/PROJ-202604-ABC"

**Proceso:**
1. Auto-eliminar FolderNote (AUTO)
2. Eliminar carpeta completa
3. Auto-eliminar del .index.json (AUTO)

**Garantía:**
- ✅ Carpeta eliminada
- ✅ PROJ-202604-ABC.md auto-eliminado
- ✅ .index.json auto-actualizado
- ✅ CERO HUÉRFANOS

---

## UC-021: ARCHIVAR ENTIDAD

**Input:**
- entityId: "PROJ-202604-ABC"
- entityType: "proyecto"
- archive: true

**Proceso:**
1. Cambiar status a "archivado" en README.md
2. Auto-actualizar FolderNote (AUTO)
3. Auto-sincronizar .index.json (AUTO)

**Garantía:**
- ✅ README.md actualizado
- ✅ PROJ-202604-ABC.md auto-actualizado
- ✅ .index.json auto-sincronizado
- ✅ TODO EN SYNC

---

## UC-015: LISTAR PROYECTOS

**Proceso:**
1. Leer .index.json
2. Retornar projects[]

**Fuente:** .index.json (actualizado automáticamente)

---

## FLUJO AUTOMÁTICO COMPLETO

```
CREATE  → Crea carpeta + folderNote + README + subfolders + folderNotes + IndexSync
UPDATE  → Auto-rename folderNote + auto-sync index
DELETE  → Auto-delete folderNote + auto-delete index
ARCHIVE → Auto-update folderNote + auto-sync index

GARANTÍA: CADA CARPETA = SU FOLDERNTE = SINCRONIZADO AUTOMÁTICAMENTE
```

