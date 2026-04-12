# Chronex Obsidian - Templates Structure

## 📁 Templates Location

All templates are located in `/templates/` directory at the root of the vault:

```
templates/
├── common/
│   ├── templateMetadata.md       # Shared metadata fragment
│   ├── templateNotes.md          # Shared notes section
│   └── templateTags.md           # Shared tags section
├── template-project.md           # Project template with buttons
├── template-task.md              # Task template with actions
├── template-objective.md         # Objective template (OKRs)
└── template-nota.md              # Note/Document template
```

---

## 🎯 Template: Project

**File:** `/templates/template-project.md`

### Variables
```
{{VALUE:uniqueId}}     → PROJ-202604-ABC
{{VALUE:alias}}        → Alias para el proyecto
{{VALUE:currentDate}}  → 2026-04-12
{{VALUE:fileName}}     → Sistema Documental 2026
```

### Frontmatter
```yaml
UID: PROJ-202604-ABC
type: project
status: ACTIVE
dateCreated: 2026-04-12
tags: []
```

### Features
✅ **Interactive Buttons:**
- 🆕 [Nueva Tarea](button://create?type=task&project=...)
- ✏️ [Editar](button://edit?uid=...)
- 📅 [Ver Tareas](button://tasks?project=...)
- 📦 [Archivar](button://archive?uid=...)

✅ **Sections:**
- Acciones Rápidas (Quick Actions)
- Descripción (Description)
- Objetivos (Objectives)
- Tasks
- Hitos (Milestones)

✅ **Includes:**
- `common/templateMetadata` → Shared metadata
- `common/templateNotes` → Shared notes section

### Generated Structure
```
200-PROYECTOS/
└── PROJ-202604-ABC/
    ├── PROJ-202604-ABC.md (from template-project.md)
    ├── README.md
    ├── objetivos/
    ├── documentos/
    ├── tareas/
    └── recursos/
```

---

## ✅ Template: Task

**File:** `/templates/template-task.md`

### Variables
```
{{VALUE:uniqueId}}     → TSK-202604-XYZ
{{VALUE:alias}}        → Task alias
{{VALUE:priority}}     → ALTA, MEDIA, BAJA, CRÍTICA
{{VALUE:dueDate}}      → 2026-04-25
{{VALUE:currentDate}}  → 2026-04-12
{{VALUE:fileName}}     → Investigar librerías
```

### Frontmatter
```yaml
UID: TSK-202604-XYZ
type: task
status: TODO
priority: MEDIA
dueDate: 2026-04-25
dateCreated: 2026-04-12
tags: []
```

### Features
✅ **Interactive Buttons:**
- ✏️ [Editar](button://edit?uid=...)
- ✔️ [Completar](button://complete?uid=...)
- 🎯 [Prioridad](button://priority?uid=...)
- 🗑️ [Eliminar](button://delete?uid=...)

✅ **Sections:**
- Acciones Rápidas
- Descripción
- Detalles (Priority, Due Date, Status)
- Checklist (Subtasks)

### Generated Structure
```
200-PROYECTOS/PROJ-ABC/objetivos/OBJ-XYZ/
└── TSK-202604-XYZ/
    └── README.md (from template-task.md)
```

---

## 🚀 Template: Objective

**File:** `/templates/template-objective.md`

### Variables
```
{{VALUE:uniqueId}}     → OBJ-202604-DEF
{{VALUE:alias}}        → Objective alias
{{VALUE:currentDate}}  → 2026-04-12
{{VALUE:fileName}}     → Implementar versionado
```

### Frontmatter
```yaml
UID: OBJ-202604-DEF
type: objective
status: ACTIVE
dateCreated: 2026-04-12
tags: []
```

### Features
✅ **Interactive Buttons:**
- ✏️ [Editar](button://edit?uid=...)
- ➕ [Agregar KR](button://create?type=kr&objective=...)
- ✔️ [Completar](button://complete?uid=...)

✅ **Sections:**
- Acciones Rápidas
- Descripción
- Key Results (OKR pattern)
- Acciones
- Progreso

### Generated Structure
```
200-PROYECTOS/PROJ-ABC/objetivos/
└── OBJ-202604-DEF/
    └── README.md (from template-objective.md)
```

---

## 📝 Template: Note/Document

**File:** `/templates/template-nota.md`

### Frontmatter
```yaml
UID: {{VALUE:uniqueId}}
type: document
status: ACTIVE
dateCreated: {{VALUE:currentDate}}
tags: []
```

### Features
✅ **Sections:**
- Título
- Descripción
- Contenido
- Referencias
- Historial

### Generated Structure
```
500-REPOSITORIOS/[category]/
└── DOC-202604-GHI/
    └── README.md (from template-nota.md)
```

---

## 🔗 Common Templates (Includes)

### templateMetadata.md
```yaml
# Shared metadata fragment
# Included via: <% tp.file.include('[[common/templateMetadata]]') %>
```

### templateNotes.md
```markdown
# Shared notes section template
# Provides consistent notes formatting across all templates
```

### templateTags.md
```yaml
# Shared tags section
# Auto-includes standard tags
```

---

## 🔄 Template Variable Replacement

### Variables Replaced Automatically

| Variable | Value | Example |
|----------|-------|---------|
| `{{VALUE:uniqueId}}` | Generated ID | `PROJ-202604-ABC` |
| `{{VALUE:currentDate}}` | Today's date | `2026-04-12` |
| `{{VALUE:fileName}}` | Entity name | `Sistema Documental 2026` |
| `{{VALUE:priority}}` | Input priority | `ALTA` |
| `{{VALUE:dueDate}}` | Input due date | `2026-04-25` |
| `{{VALUE:alias}}` | Optional alias | `Sistema 2026` |

### How It Works

1. **User inputs data** → name, description, priority
2. **System generates ID** → PROJ-202604-ABC
3. **TemplateProcessor reads** → `/templates/template-project.md`
4. **Replaces variables** → `{{VALUE:*}}` → actual values
5. **File created** → PROJ-202604-ABC.md with processed content
6. **Unreplaced vars removed** → Any missing vars deleted

---

## 🎨 Button Syntax in Templates

Templates include interactive buttons using custom `button://` URI scheme:

```markdown
[Icon + Label](button://action?param1=value1&param2=value2)
```

### Examples

```markdown
# Create Task Button
[Nueva Tarea](button://create?type=task&project=PROJ-202604-ABC)

# Edit Button
[Editar](button://edit?uid=PROJ-202604-ABC)

# Complete Button
[Completar](button://complete?uid=TSK-202604-XYZ)

# Archive Button
[Archivar](button://archive?uid=PROJ-202604-ABC)

# Delete Button
[Eliminar](button://delete?uid=TSK-202604-XYZ)
```

### Supported Actions
- `create` - Create new entity (type=task|objective|document)
- `edit` - Edit entity
- `complete` - Mark as complete
- `delete` - Delete entity
- `archive` - Archive entity
- `priority` - Change priority
- `status` - Change status
- `share` - Share entity
- `version` - Create version

---

## 📊 Template Processing Flow

```
User Input
    ↓
[Create Project Dialog]
    ↓
Validation (name, desc, priority)
    ↓
ID Generation (PROJ-YYYYMM-XXXXX)
    ↓
Read Template
    ↓
[template-project.md loaded]
    ↓
Variable Replacement
    ↓
{{VALUE:uniqueId}} → PROJ-202604-ABC
{{VALUE:currentDate}} → 2026-04-12
    ↓
Include Processing
    ↓
<% tp.file.include('[[common/templateMetadata]]') %>
    ↓
Create File
    ↓
[PROJ-202604-ABC.md created with final content]
    ↓
Sync .index.json
    ↓
✅ Complete
```

---

## 🔧 Using Templates in Code

### TemplateProcessor Class

```typescript
import { TemplateProcessor } from './services/templateProcessor';

// In ProjectServiceWithVault
const processor = new TemplateProcessor(app);

// Get available templates
const templates = await processor.getAvailableTemplates('templates');

// Process a template
const content = await processor.processTemplate(
  'template-project.md',
  'templates',
  {
    uniqueId: 'PROJ-202604-ABC',
    currentDate: '2026-04-12',
    fileName: 'Mi Proyecto'
  }
);

// Create file from template
const file = await processor.createFileFromTemplate(
  '200-PROYECTOS/PROJ-202604-ABC/PROJ-202604-ABC.md',
  'template-project.md',
  'templates',
  variables
);
```

---

## ✨ Integration with Templater Plugin

Templates use **Templater** plugin syntax for includes:

```markdown
<% tp.file.include('[[common/templateMetadata]]') %>
```

This allows:
- ✅ Modular template design
- ✅ DRY principle (Don't Repeat Yourself)
- ✅ Consistent metadata across all templates
- ✅ Easy updates to shared sections

---

## 📋 Template Checklist

- ✅ `template-project.md` - 6 quick action buttons
- ✅ `template-task.md` - 4 task action buttons
- ✅ `template-objective.md` - 3 objective action buttons
- ✅ `template-nota.md` - Document template
- ✅ `common/templateMetadata.md` - Shared metadata
- ✅ `common/templateNotes.md` - Shared notes
- ✅ `common/templateTags.md` - Shared tags

---

## 🎯 Future Enhancements

- [ ] Template customization UI
- [ ] Custom template creation
- [ ] Template versioning
- [ ] Template inheritance
- [ ] Conditional sections in templates
- [ ] Template preview before creation

