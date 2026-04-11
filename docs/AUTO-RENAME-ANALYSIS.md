# Auto-Rename Analysis: Qué en chronex-obsidian puede beneficiarse

## 🎯 CONTEXTO

El sistema de chronex-obsidian crea TRES archivos principales:
1. **README.md** - Contenido técnico + frontmatter
2. **_index_.md** (folderNote) - Metadata + descripción visual
3. **.index.json** - Índice del vault (root level)

Pregunta: **¿CUÁL debería auto-renombrarse cuando la entidad cambia?**

---

## 1. README.md - AUTO-RENAME ✅ CANDIDATO PRINCIPAL

### Situación Actual:
```
200-PROYECTOS/PROJ-202604-ABC/README.md
Contenido:
---
uid: PROJ-202604-ABC
type: proyecto
title: Mi Proyecto
description: Descripción
---
```

### Con Auto-Rename:
Cuando usuario edita `title: "Mi Proyecto" → "Nuevo Proyecto"`:

**ANTES:**
- Archivo sigue siendo README.md
- El frontmatter se actualiza
- El contenido se actualiza
- Todo bien

**DESPUÉS (Con Auto-Rename):**
- El frontmatter se actualiza automáticamente
- El contenido se actualiza automáticamente
- **PERO**: ¿El nombre del archivo cambia?

### Análisis:
- README.md es un nombre ESTÁNDAR (no debería cambiar)
- Pero el CONTENIDO sí debería auto-actualizarse
- **VEREDICTO**: AUTO-UPDATE del contenido, NO del nombre

---

## 2. _index_.md (FolderNote) - AUTO-RENAME ✅ VERDADERO CANDIDATO

### Situación:
```
200-PROYECTOS/PROJ-202604-ABC/_index_.md
---
type: proyecto
title: Mi Proyecto
---
📁 # Mi Proyecto
```

### Con Auto-Rename:
Cuando editas README.md con nuevo título:

**AUTOMÁTICAMENTE:**
```
_index_.md actualiza:
---
title: Nuevo Proyecto
lastModified: 2026-04-11T14:30:00Z
---

📁 # Nuevo Proyecto
## Descripción
...
```

**VEREDICTO**: AUTO-RENAME del contenido ✅ PERFECTO PARA ESTO

---

## 3. .index.json - AUTO-SYNC ✅ ÍNDICE GLOBAL

### Situación:
```json
.index.json
{
  "projects": [
    {
      "id": "PROJ-202604-ABC",
      "title": "Mi Proyecto",
      "path": "200-PROYECTOS/PROJ-202604-ABC",
      "lastModified": "2026-04-11T10:00:00Z"
    }
  ]
}
```

### Con Auto-Sync:
Cuando editas título del proyecto:

**AUTOMÁTICAMENTE:**
```json
.index.json actualiza:
{
  "projects": [
    {
      "id": "PROJ-202604-ABC",
      "title": "Nuevo Proyecto",  ← ACTUALIZADO
      "path": "...",
      "lastModified": "2026-04-11T14:30:00Z"  ← ACTUALIZADO
    }
  ]
}
```

**VEREDICTO**: AUTO-SYNC del índice ✅ EXCELENTE

---

## 4. TEMPLATES - AUTO-PLACEHOLDER ✅ CANDIDATO

### Situación Actual:
```
991-templates/project-template.md
---
title: <%= tp.frontmatter.title %>
type: <%= tp.frontmatter.type %>
---
```

### Con Auto-Rename:
Cuando creas proyecto, template sabe:
- El nombre del archivo: `<%= tp.file.name %>`
- La carpeta: `<%= tp.file.folder %>`

### POSIBILIDAD:
```markdown
---
title: <%= tp.frontmatter.title %>
uid: <%= tp.frontmatter.uid %>
folder: <%= tp.file.folder %>
indexFile: _index_.md
---

# <%= tp.frontmatter.title %>

Ruta: <%= tp.file.folder %>/
Meta: <%= tp.file.folder %>/_index_.md
```

**VEREDICTO**: POTENCIAL pero no crítico

---

## 🔄 FLUJO DE AUTO-RENAME COMPLETO

### Escenario: Usuario edita título

```
1. Usuario abre README.md
   ├─ Edita: title: "Proyecto A" → "Proyecto B"
   └─ Presiona Ctrl+S (salvar)

2. EditServiceWithVault.updateEntity()
   ├─ Valida cambios
   ├─ Actualiza README.md
   └─ Dispara: onMetadataChanged()

3. FolderNoteService.updateFolderNoteOnMetadataChange()
   ├─ Detecta que title cambió
   ├─ Lee _index_.md
   ├─ Actualiza frontmatter
   ├─ Regenera contenido
   └─ Escribe _index_.md

4. IndexSyncService.updateIndexJson()
   ├─ Busca proyecto en .index.json
   ├─ Actualiza título
   ├─ Actualiza lastModified
   └─ Escribe .index.json

5. Usuario ve:
   ├─ README.md → actualizado
   ├─ _index_.md → actualizado automáticamente
   └─ .index.json → actualizado automáticamente

CERO PASOS MANUALES. TODO AUTOMÁTICO.
```

---

## 📋 CANDIDATOS PARA AUTO-RENAME

| Archivo | Auto-Update | Auto-Delete | Prioridad |
|---------|-------------|-------------|-----------|
| README.md | ✅ Contenido | ✅ Con carpeta | ALTA |
| _index_.md | ✅ Contenido | ✅ Con carpeta | ALTA |
| .index.json | ✅ Sync | N/A | MEDIA |
| Templates | ⚠️ Parcial | N/A | BAJA |

---

## 🎯 IMPLEMENTACIÓN RECOMENDADA

### FASE 1 (Inmediato):
- ✅ Auto-update de _index_.md cuando README.md cambia
- ✅ Auto-delete de _index_.md cuando carpeta se borra
- ✅ FolderNoteService con folderNoteAutoRename

### FASE 2 (Próximo):
- ✅ Auto-sync de .index.json
- ✅ OnMetadataChanged hook en EditServiceWithVault
- ✅ Sincronización bidireccional

### FASE 3 (Futuro):
- ✅ Template variables mejoradas
- ✅ Stats en _index_.md dinámicas
- ✅ Dataviewjs integraciones

---

## 💡 LO IMPORTANTE

**Auto-Rename en chronex-obsidian NO significa cambiar nombres de archivos.**

Significa: **CUANDO CAMBIAS METADATOS, TODO SE ACTUALIZA AUTOMÁTICAMENTE**

- Editas título → _index_.md + .index.json se actualizan
- Editas estado → _index_.md + .index.json se actualizan
- Borras entidad → README.md + _index_.md + .index.json se eliminan

SINCRONIZACIÓN PERFECTA. CERO INCONSISTENCIAS.

