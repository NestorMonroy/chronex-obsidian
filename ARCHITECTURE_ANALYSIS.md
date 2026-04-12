# Chronex Obsidian - Architecture and Logic Error Analysis

## 1. WHAT THE PLUGIN IS SUPPOSED TO DO

### Core Purpose
A visual automation system for Obsidian that:
1. **Creates structured projects** with auto-generated folders and files
2. **Manages temporal workflows** with tasks, objectives, and documents
3. **Provides dashboard views** (Projects, Calendar, Kanban)
4. **Integrates with plugins** (Templater for templates, QuickAdd for macros)
5. **Enables quick actions** via interactive button syntax in files

### Target Use Case
Users want to:
- Create projects with one command
- Have automatic folder structure created
- See interactive buttons in generated files
- Click buttons to auto-create tasks/documents
- View all tasks in calendar/kanban interface

---

## 2. CONFIGURATION STRUCTURE

### Folder Organization (DEFAULT_SETTINGS)
```
100-INBOX/                    # Quick capture folder
200-PROYECTOS/                # Main projects folder
  ├── PROJ-YYYYMM-XXXXX.md    # FolderNote (auto-generated)
  ├── README.md               # Project info
  ├── objetivos/              # Objectives subfolder
  ├── documentos/             # Documents subfolder
  ├── tareas/                 # Tasks subfolder
  └── recursos/               # Resources subfolder
500-REPOSITORIOS/             # Repositories folder (unused)
990-UTILIDADES/               # Utilities folder
  ├── 991-templates/          # Template files location
  └── 992-scripts/            # Scripts location
```

### User Settings Available
```typescript
interface ObsidianRepoSettings {
  inboxFolder: '100-INBOX'              // Customizable
  projectsFolder: '200-PROYECTOS'       // Customizable
  repositoriesFolder: '500-REPOSITORIOS'// Customizable (unused)
  utilitiesFolder: '990-UTILIDADES'     // Customizable
  enableLogging: boolean                // Console debug logs
  enableNotifications: boolean          // Show Obsidian notices
  enableAutoBackup: boolean             // Backup feature (NOT IMPLEMENTED)
  language: 'es' | 'en'                // UI language (NOT IMPLEMENTED)
}
```

---

## 3. TEMPLATES THAT EXIST

### Template Files Available
```
templates/
├── template-project.md           ✅ Exists - Project with buttons
├── template-task.md              ✅ Exists - Task with actions
├── template-objective.md         ✅ Exists - Objective template
├── template-nota.md              ✅ Exists - Note template
└── common/
    ├── templateMetadata.md       ✅ Exists - Shared metadata
    ├── templateNotes.md          ✅ Exists - Shared notes section
    └── templateTags.md           ✅ Exists - Shared tags section
```

### Template Format Details

**Frontmatter Variables** (meant to be replaced):
```markdown
UID: {{VALUE:uniqueId}}          # Should be: PROJ-202604-ABC
type: project                    # From template type
status: ACTIVE
dateCreated: {{VALUE:currentDate}} # Should be: 2026-04-12
```

**Button Syntax** (custom, unsupported):
```markdown
[Nueva Tarea](button://create?type=task&project={{VALUE:uniqueId}})
[Editar](button://edit?uid={{VALUE:uniqueId}})
[Completar](button://complete?uid={{VALUE:uniqueId}})
```

**Templater Integration** (file includes):
```markdown
<% tp.file.include('[[common/templateMetadata]]') %>
```

---

## 4. EXPECTED USER FLOW

### Scenario A: Create a Project

**Expected behavior:**
```
1. User runs command: "Create new project"
2. System shows dialog: "Enter project name"
   User types: "My Awesome Project"
3. System shows dialog: "Enter description"
   User types: "This is my project"
4. System shows selector: "Choose priority: [BAJA | MEDIA | ALTA | CRÍTICA]"
   User clicks: "ALTA"
5. System generates:
   - Generates ID: PROJ-202604-ABCDE
   - Creates folder: 200-PROYECTOS/PROJ-202604-ABCDE/
   - Creates PROJ-202604-ABCDE.md using template-project.md
   - Replaces {{VALUE:uniqueId}} with PROJ-202604-ABCDE
   - Replaces {{VALUE:currentDate}} with 2026-04-12
   - Creates README.md
   - Creates 4 subfolders: objetivos/, documentos/, tareas/, recursos/
   - Each subfolder gets its own folderNote
   - Updates .index.json with new project
6. System shows: "✅ Project created!"
7. User opens file and sees:
   - Interactive buttons: [Nueva Tarea], [Editar], [Completar], [Archivar]
   - Clicking buttons triggers automation
```

### Scenario B: Create a Task

**Expected behavior:**
```
1. User in "200-PROYECTOS/PROJ-202604-ABCDE/tareas/" folder
2. Runs command: "Create new task"
3. System shows dialogs:
   - "Enter task name" → "Implement feature X"
   - "Enter description" → "Backend implementation"
   - "Choose priority" → "ALTA"
   - "Enter due date" → "2026-04-30"
4. System generates:
   - Generates ID: TSK-202604-XYZAB
   - Creates TSK-202604-XYZAB.md using template-task.md
   - Replaces template variables
   - Creates metadata in frontmatter
5. File appears with interactive buttons
```

---

## 5. CRITICAL LOGIC ERRORS FOUND

### 🔴 ERROR #1: promptSelect() is Non-Functional

**Current Code:**
```typescript
private async promptSelect(
  message: string,
  options: string[],
  defaultValue: string
): Promise<string> {
  new Notice(`${message} ${options.join(', ')}`);  // Just shows notification
  return defaultValue;                              // Always returns default
}
```

**Problem:**
- Displays options in a notice but doesn't provide UI to select
- Always returns the `defaultValue` parameter
- User has zero control over selection

**Real Impact:**
- When creating project: user prompted for priority but selection ignored
- All projects created with hardcoded "MEDIA" priority
- Same issue for task priority selection
- Priority setting in projects/tasks is always wrong

**What Should Happen:**
```typescript
// Should either:
// A) Use Obsidian's built-in SuggestModal for selection
// B) Create a proper <select> dropdown UI
// C) Use console modal/popup
// Result: User can actually choose and selection is returned
```

---

### 🔴 ERROR #2: promptInput() Dialog Never Appears

**Current Code:**
```typescript
private async promptInput(
  message: string,
  defaultValue: string = ''
): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    const dialog = document.createElement('div');
    dialog.innerHTML = `
      <div>
        <label>${message}</label>
        <input type="text" id="promptInput" />
        <button id="promptOk">OK</button>
      </div>
    `;
    
    // BUG: Event listeners attached, but dialog NEVER added to DOM!
    document.querySelector('#promptOk')?.addEventListener('click', () => {
      resolve(promptEl.value);
      dialog.remove();  // Try to remove something not in DOM
    });
  });
}
```

**Problems:**
1. `dialog` created but never added to `document.body`
2. Event listeners attached before DOM insertion
3. Race condition: click handlers won't fire for invisible element
4. `dialog.remove()` tries to remove element never inserted

**Real Impact:**
- User sees nothing when prompted for project name/description
- Dialog box never appears on screen
- Plugin waits for click that never comes (hangs)

**What Should Happen:**
```typescript
document.body.appendChild(dialog);  // Add to DOM FIRST
// Or better: use Obsidian's Modal class
```

---

### 🔴 ERROR #3: Templates Never Used in File Generation

**Current Code:**
```typescript
// In projectServiceWithVault.ts
await FolderNoteService.createFolderNote(
  folderPath,
  projectId,
  {
    type: 'proyecto',
    title: input.projectName,
    description: input.description,
    status: 'activo',
    priority: input.priority,
    dateCreated: dateCreated
  } as any  // Direct object, no template!
);
```

**Problem:**
- Code creates data object and passes to FolderNoteService
- FolderNoteService probably generates markdown from data
- But templates in `templates/template-project.md` are NEVER copied or processed
- Template files sit unused in filesystem

**Real Impact:**
- Generated PROJ-XXXXX.md file has wrong format
- Missing interactive buttons
- Missing template structure
- {{VALUE:uniqueId}} variables never replaced with actual IDs
- Files don't have the professional layout from templates

**What Should Happen:**
```typescript
// Should:
// 1. Read template-project.md
// 2. Replace all {{VALUE:*}} with actual values
// 3. Process Templater directives if needed
// 4. Create file with processed template content
```

---

### 🔴 ERROR #4: button:// Syntax Not Implemented

**In Templates:**
```markdown
[Nueva Tarea](button://create?type=task&project={{VALUE:uniqueId}})
[Editar](button://edit?uid={{VALUE:uniqueId}})
[Completar](button://complete?uid={{VALUE:uniqueId}})
[Archivar](button://archive?uid={{VALUE:uniqueId}})
```

**Problems:**
1. `button://` is NOT standard Obsidian URL scheme
2. Obsidian recognizes: `obsidian://`, `file://`, `http://`, etc.
3. No handler/processor for `button://` links exists in code
4. When user clicks, it's just a normal markdown link (does nothing)

**Real Impact:**
- All the action buttons in templates are useless
- Clicking them does nothing
- Users can't use quick actions
- Complete feature breakdown

**What Should Happen:**
```typescript
// Either:
// A) Register custom URI handler for button://
// B) Use Obsidian's button plugin integration
// C) Post-process markdown to convert button:// to working elements
// D) Use MarkdownRenderChild to intercept and handle clicks
```

---

### 🔴 ERROR #5: Views Are Empty/Stubbed

**Files that exist:**
- `src/views/projectsView.ts`
- `src/views/tasksCalendarView.ts`
- `src/views/kanbanView.ts`

**Problems:**
- Views probably created as empty stubs
- No implementation of `onOpen()` or data loading
- No rendering logic
- No connection to actual project data

**Real Impact:**
- User opens "Projects Dashboard" → sees blank panel
- Opens "Tasks Calendar" → blank
- Opens "Kanban" → blank
- Completely non-functional

---

### 🟡 ERROR #6: Missing Implementation Details

| Feature | Status | Impact |
|---------|--------|--------|
| Settings UI Tab | Stub | Can't change settings |
| QuickAdd Integration | Stub | No macro automation |
| Index Synchronization | Missing | No project registry |
| Edit Operations | Stub | Can't edit projects |
| Delete Operations | Stub | Can't delete projects |
| Archive Operations | Stub | Can't archive projects |
| Templater Integration | Stub | No template processing |
| CrossPlugin Communication | Not implemented | Plugins don't talk |

---

## 6. EXPECTED vs ACTUAL BEHAVIOR COMPARISON

### Expected (What README/Comments Promise)
```
User runs "Create Project"
  ↓ Sees working dialog for name, description, priority
  ↓ System validates input
  ↓ System generates PROJ-YYYYMM-XXXXX ID
  ↓ System creates full folder structure
  ↓ System creates project file from template
  ↓ Template variables replaced with real values
  ↓ File has interactive buttons for actions
  ↓ Dashboard shows project in "Projects View"
  ↓ Click button → QuickAdd macro runs
  ↓ Click "New Task" → task created automatically
  ↓ Tasks appear in Calendar and Kanban views
```

### Actual (What Really Happens)
```
User runs "Create Project"
  ↓ Dialog doesn't appear (never added to DOM)
  ✗ User can't enter name
  ✗ Can't enter description
  ✗ Can't select priority (always "MEDIA")
  ✓ System generates ID (this works)
  ✓ Creates folder structure (this works)
  ✗ Creates file WITHOUT template
  ✗ No template variables replaced
  ✗ No action buttons in file
  ✗ Dashboard shows nothing (empty view)
  ✗ Buttons don't work (unsupported syntax)
  ✗ No automation happens
  ✗ Calendar/Kanban views empty
```

---

## 7. SUMMARY TABLE

| Issue | Severity | Location | Expected | Actual | Impact |
|-------|----------|----------|----------|--------|--------|
| promptSelect() | 🔴 CRITICAL | main.ts:503 | Modal/dropdown selector | Notification only, returns default | Users forced to MEDIA priority |
| promptInput() | 🔴 CRITICAL | main.ts:469 | Text input dialog | Dialog never appears on screen | No text input possible |
| Templates unused | 🔴 CRITICAL | *Service.ts | Templates copied & processed | Templates ignored | Wrong file format, no buttons |
| button:// unsupported | 🔴 CRITICAL | templates/*.md | Interactive buttons | Plain markdown links | Action buttons don't work |
| Empty views | 🔴 CRITICAL | views/*.ts | Show project list & tasks | Blank panels | No data visualization |
| Settings UI | 🟡 HIGH | main.ts:527 | Settings dialog | Stub only | Settings can't be changed |
| QuickAdd integration | 🟡 HIGH | main.ts:418 | Macro automation | Stub only | No automation |
| Index sync | 🟡 HIGH | main.ts | Project registry | Not implemented | No project tracking |

---

## 8. RECOMMENDATIONS

**Priority 1 (Blocker):**
1. Fix `promptInput()` - add dialog to DOM
2. Fix `promptSelect()` - implement real selector
3. Integrate templates - use Templater plugin properly
4. Implement button handlers - register custom URI or use Obsidian buttons

**Priority 2 (High):**
5. Implement views - load and display actual data
6. Complete Settings UI
7. Finish QuickAdd integration

**Priority 3 (Should-Have):**
8. Implement index synchronization
9. Complete Edit/Delete/Archive operations
10. Add multi-language support

---

## 9. CONCLUSION

The plugin has a solid architecture and well-organized code structure, but critical UI/integration features are either stubbed or broken. The most important issues are:

1. **User input dialogs don't work** - Can't get project name/description
2. **Template system not integrated** - Generated files lack structure and buttons
3. **Views are empty** - Dashboard/calendar/kanban don't show data
4. **Button actions unsupported** - Custom `button://` syntax not recognized

Without fixing these issues, the plugin is non-functional. Users who install it will find it broken immediately.
