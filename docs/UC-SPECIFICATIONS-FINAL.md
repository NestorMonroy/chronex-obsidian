# USE CASES SPECIFICATION - FolderNote Pattern (CORRECTO)

## Estructura de Carpetas (PATTERN CORRECTO)

```
200-PROYECTOS/
├─ 200-PROYECTOS.md ← FolderNote de la colección
│
├─ PROJ-202604-ABC/
│  ├─ PROJ-202604-ABC.md ← FolderNote del proyecto
│  ├─ README.md
│  │
│  ├─ objetivos/
│  │  ├─ objetivos.md ← FolderNote de la colección "objetivos"
│  │  │
│  │  ├─ OBJ-202604-XYZ/
│  │  │  ├─ OBJ-202604-XYZ.md ← FolderNote del objetivo
│  │  │  └─ README.md
│  │  │
│  │  └─ tareas/
│  │     ├─ tareas.md ← FolderNote de la colección "tareas"
│  │     │
│  │     ├─ TSK-202604-LMN/
│  │     │  ├─ TSK-202604-LMN.md ← FolderNote de la tarea
│  │     │  └─ README.md
│  │     │
│  │     └─ TSK-202604-OPQ/
│  │        ├─ TSK-202604-OPQ.md ← FolderNote de la tarea
│  │        └─ README.md
│  │
│  ├─ documentos/
│  │  ├─ documentos.md ← FolderNote de la colección "documentos"
│  │  │
│  │  ├─ DOC-202604-RST/
│  │  │  ├─ DOC-202604-RST.md ← FolderNote del documento
│  │  │  └─ README.md
│  │  │
│  │  └─ DOC-202604-UVW/
│  │     ├─ DOC-202604-UVW.md ← FolderNote del documento
│  │     └─ README.md
│  │
│  └─ recursos/
│     ├─ recursos.md ← FolderNote de la colección "recursos"
│     └─ ... (archivos de recursos)
│
├─ PROJ-202604-DEF/
│  ├─ PROJ-202604-DEF.md ← FolderNote del proyecto
│  ├─ README.md
│  └─ ... (igual estructura)
│
└─ PROJ-202604-GHI/
   ├─ PROJ-202604-GHI.md ← FolderNote del proyecto
   ├─ README.md
   └─ ... (igual estructura)

500-REPOSITORIOS/
├─ 500-REPOSITORIOS.md ← FolderNote de la colección
│
├─ General/
│  ├─ General.md ← FolderNote de la categoría
│  │
│  ├─ DOC-202604-XYZ/
│  │  ├─ DOC-202604-XYZ.md ← FolderNote del documento
│  │  └─ README.md
│  │
│  └─ DOC-202604-ABC/
│     ├─ DOC-202604-ABC.md ← FolderNote del documento
│     └─ README.md
│
├─ Técnico/
│  ├─ Técnico.md ← FolderNote de la categoría
│  └─ ...
│
└─ Legal/
   ├─ Legal.md ← FolderNote de la categoría
   └─ ...

.index.json ← Índice global sincronizado automáticamente
├─ projects[]
├─ objectives[]
├─ tasks[]
├─ documents[]
└─ lastSync: timestamp
```

## PATRÓN: CADA CARPETA = SU FOLDERNTE

**Regla Universal:**
- Toda carpeta tiene un folderNote
- El nombre del folderNote es el ID o nombre de la carpeta
- Formato: `{carpeta}.md` o `{ID}.md`

**Ejemplos:**

| Carpeta | FolderNote |
|---------|-----------|
| 200-PROYECTOS/ | 200-PROYECTOS.md |
| PROJ-202604-ABC/ | PROJ-202604-ABC.md |
| objetivos/ | objetivos.md |
| OBJ-202604-XYZ/ | OBJ-202604-XYZ.md |
| tareas/ | tareas.md |
| TSK-202604-LMN/ | TSK-202604-LMN.md |
| documentos/ | documentos.md |
| DOC-202604-RST/ | DOC-202604-RST.md |
| recursos/ | recursos.md |
| 500-REPOSITORIOS/ | 500-REPOSITORIOS.md |
| General/ | General.md |
| Técnico/ | Técnico.md |

## VENTAJAS DE ESTE PATRÓN

✅ **CONSISTENCIA TOTAL**
   - Cada carpeta, sin excepciones, tiene su folderNote
   - Patrón predecible y fácil de entender

✅ **NAVEGACIÓN VISUAL**
   - Las colecciones (objetivos, documentos, tareas) son visibles como folderNotes
   - Cada colección tiene su propia descripción y metadata

✅ **SINCRONIZACIÓN PERFECTA**
   - Cada nivel de la jerarquía tiene su folderNote
   - Actualizar un folderNote actualiza automáticamente el índice global

✅ **ESCALABILIDAD**
   - Fácil agregar nuevas colecciones
   - Cada nueva carpeta crea automáticamente su folderNote

✅ **ORGANIZACIÓN JERÁRQUICA**
   - 200-PROYECTOS.md describe el conjunto
   - PROJ-ID.md describe el proyecto
   - objetivos.md describe la colección de objetivos
   - OBJ-ID.md describe el objetivo específico

## UC-008: CREAR PROYECTO (CREATE)

**Proceso:**
1. Usuario: "Create Project"
2. Sistema genera ID: PROJ-202604-ABC
3. Sistema crea estructura:
   ```
   PROJ-202604-ABC/
   ├─ PROJ-202604-ABC.md ← FolderNote del proyecto
   ├─ README.md
   ├─ objetivos/
   │  └─ objetivos.md ← FolderNote de la colección
   ├─ documentos/
   │  └─ documentos.md ← FolderNote de la colección
   ├─ tareas/
   │  └─ tareas.md ← FolderNote de la colección
   └─ recursos/
      └─ recursos.md ← FolderNote de la colección
   ```

**Archivos Creados Automáticamente:**
- ✅ PROJ-202604-ABC.md (FolderNote del proyecto)
- ✅ README.md (contenido del proyecto)
- ✅ objetivos.md (FolderNote de colección)
- ✅ documentos.md (FolderNote de colección)
- ✅ tareas.md (FolderNote de colección)
- ✅ recursos.md (FolderNote de colección)
- ✅ .index.json (sincronizado)

## UC-010: CREAR OBJETIVO (CREATE)

**Proceso:**
1. Usuario: "Create Objective" dentro de proyecto
2. Sistema genera ID: OBJ-202604-XYZ
3. Sistema crea estructura:
   ```
   objetivos/OBJ-202604-XYZ/
   ├─ OBJ-202604-XYZ.md ← FolderNote del objetivo
   └─ README.md
   ```

**Archivos Creados Automáticamente:**
- ✅ OBJ-202604-XYZ.md (FolderNote del objetivo)
- ✅ README.md (contenido del objetivo)
- ✅ .index.json (sincronizado)

## UC-012: CREAR TAREA (CREATE)

**Proceso:**
1. Usuario: "Create Task" dentro de objetivo
2. Sistema genera ID: TSK-202604-LMN
3. Sistema crea estructura:
   ```
   tareas/TSK-202604-LMN/
   ├─ TSK-202604-LMN.md ← FolderNote de la tarea
   └─ README.md
   ```

**Archivos Creados Automáticamente:**
- ✅ TSK-202604-LMN.md (FolderNote de la tarea)
- ✅ README.md (contenido de la tarea)
- ✅ .index.json (sincronizado)

## UC-013: CREAR DOCUMENTO (CREATE)

**Proceso:**
1. Usuario: "Create Document" en repositorio
2. Sistema genera ID: DOC-202604-RST
3. Sistema crea estructura:
   ```
   {Categoría}/DOC-202604-RST/
   ├─ DOC-202604-RST.md ← FolderNote del documento
   └─ README.md
   ```

**Archivos Creados Automáticamente:**
- ✅ DOC-202604-RST.md (FolderNote del documento)
- ✅ README.md (contenido del documento)
- ✅ .index.json (sincronizado)

## FLUJO AUTOMÁTICO COMPLETO

```
CREATE → Crea carpeta + folderNote (ID.md) + README.md + IndexSync
UPDATE → Auto-rename folderNote + auto-sync index
DELETE → Auto-delete folderNote + auto-delete index
ARCHIVE → Auto-update folderNote status + auto-sync index

PATRÓN: CADA CARPETA = SU FOLDERNTE = SINCRONIZADO AUTOMÁTICAMENTE
```

