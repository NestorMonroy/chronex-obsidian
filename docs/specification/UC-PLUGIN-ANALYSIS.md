# Obsidian Repository Manager - Use Cases Analysis

## Overview

Complete use case specification for the Obsidian Repository Manager plugin, derived from the plugin architecture and implementation.

**Total Use Cases**: 15
**Coverage**: 100% of modules
**Levels**: 4 (Setup, Operational, Integration, System)

## Actors

### Primary Actor
- **Final User (Obsidian)**: Installs, configures, and uses the plugin

### Secondary Actors
- **Obsidian System**: Loads plugin, provides API, manages vault
- **QuickAdd Plugin**: Executes scripts, processes macros
- **Templater Plugin**: Processes templates, executes code

## Use Case Hierarchy

```
UC-P01: Install Plugin
    ↓
UC-P02: Configure Settings
    ↓
├─ UC-001: Create Repository
├─ UC-002: Create Task
├─ UC-003: Create Project
├─ UC-004: Create Pillar
├─ UC-005: Create Fleeting Note
├─ UC-005b: Create Repository Note
    ↓
├─ UC-INT01: QuickAdd Integration
├─ UC-INT02: Templater Processing
├─ UC-INT03: Cross-Plugin Data Flow
    ↓
├─ UC-SYS01: Validate Input
├─ UC-SYS02: Generate ID
├─ UC-SYS03: Show Notification
└─ UC-SYS04: Update Version
```

## Level 1: Setup Use Cases

### UC-P01: Install Plugin

**Actor**: User + Obsidian System

**Precondition**: Obsidian is running

**Main Flow**:
1. User opens Settings → Community Plugins → Browse
2. User searches "Obsidian Repository Manager"
3. User clicks Install
4. System downloads plugin (main.js)
5. System loads and initializes plugin
6. System registers 5 commands in Command Palette
7. System adds settings tab

**Postcondition**: Plugin installed, enabled, and ready

**Alternative**: Manual installation (copy files to .obsidian/plugins/)

---

### UC-P02: Configure Plugin Settings

**Actor**: User

**Precondition**: Plugin installed and enabled

**Main Flow**:
1. User opens Settings → Community Plugins → Options (obsidian-repo)
2. Settings tab displays configuration options:
   - **Author Name** (text input, default: "Nestor")
   - **Templates Folder** (path, default: "990-UTILIDADES/991-template")
   - **Scripts Folder** (path, default: "990-UTILIDADES/992-script")
   - **Enable Notifications** (toggle, default: true)
   - **Enable Auto-Capture** (toggle, default: true)
3. User modifies values
4. System auto-saves settings to plugin data

**Postcondition**: Plugin configured per user preferences

**Exception**: 
- Invalid folder path → Show error notification

---

## Level 2: Operational Use Cases (5 Commands)

### UC-001: Create Repository

**Actor**: User

**Precondition**: Plugin installed and configured

**Trigger**: User executes "Create Repository" command via Command Palette

**Main Flow**:
1. Plugin calls `createRepository.js` script
2. Script prompts: "Repository Name?" (required)
3. Script validates name (3-50 characters)
4. Script prompts: "Description?" (optional)
5. Script calls `generateUniqueId()` → `repo-{timestamp}-{randomHex}`
6. Script calls `getCurrentDateTime()` → ISO 8601 timestamp
7. Script calls `getAuthorName()` → reads from settings
8. Plugin loads template: `repository.md`
9. Plugin substitutes `{{VALUE:*}}` placeholders
10. Plugin passes to Templater plugin
11. Templater processes `<% %>` and `<%= %>` blocks
12. Obsidian API creates new file
13. File opens in editor
14. System shows success notification

**Postcondition**: New repository file created with metadata and structure

**Exception**:
- Name too short → "Repository name must be 3-50 characters"
- Invalid characters → "Repository name contains invalid characters"
- User cancels → Operation cancelled

**Related**: 
- UC-SYS01 (Input validation)
- UC-SYS02 (ID generation)
- UC-INT02 (Templater processing)

---

### UC-002: Create Task

**Actor**: User

**Precondition**: Plugin installed and configured

**Main Flow**:
1. Plugin calls `createTask.js` script
2. Script prompts: "Task Name?" (required)
3. Script prompts: "Description?" (optional)
4. Script prompts: "Priority (1-5)?" (required)
5. Script prompts: "Due Date (YYYY-MM-DD)?" (optional)
6. Script validates inputs
7. Script generates `taskId: task-{timestamp}-{randomHex}`
8. Plugin loads `task.md` template
9. Plugin substitutes variables
10. Templater processes template
11. New file created with checklist section

**Postcondition**: Task file created with metadata

**Exception**:
- Invalid priority → "Priority must be 1-5"
- Invalid date format → "Use YYYY-MM-DD format"

---

### UC-003: Create Project

**Actor**: User

**Main Flow**:
1. Script prompts: Project Name, Objective, Description, Start Date, End Date
2. Validates date range (start ≤ end)
3. Generates `projectId: proj-{timestamp}-{randomHex}`
4. Loads `project.md` template
5. Creates file with phases section

**Postcondition**: Project file created with structure

---

### UC-004: Create Pillar

**Actor**: User

**Main Flow**:
1. Script prompts: Pillar Name, Purpose, Description
2. Generates `pillarId: pillar-{timestamp}-{randomHex}`
3. Loads `pillar.md` template
4. Creates file with values and principles sections

**Postcondition**: Pillar file created

---

### UC-005: Create Fleeting Note

**Actor**: User

**Main Flow**:
1. Script prompts: Note content
2. Generates `noteId: note-{timestamp}-{randomHex}`
3. Loads `nota-fugaz.md` template
4. Creates file in `100-INBOX/notas-fugaz/`
5. Timestamps file automatically

**Postcondition**: Fleeting note created and timestamped

---

### UC-005b: Create Repository Note

**Actor**: User

**Main Flow**:
1. Script prompts: Note Name, Content, Repository ID (optional)
2. Validates inputs
3. Generates `noteId: note-{timestamp}-{randomHex}`
4. Loads `repositoryNote.md` template
5. Creates file with link to parent repository

**Postcondition**: Repository note created and linked

**Related**: UC-001 (parent repository reference)

---

## Level 3: Integration Use Cases

### UC-INT01: QuickAdd Integration

**Actors**: User + QuickAdd Plugin

**Precondition**: QuickAdd plugin installed and configured with macros

**Trigger**: User clicks QuickAdd macro button (e.g., mAdd500Repo)

**Main Flow**:
1. QuickAdd loads macro configuration
2. QuickAdd executes UserScript (createRepository.js, etc.)
3. Script runs and returns object with variables
4. QuickAdd loads template file
5. QuickAdd passes variables to Templater
6. Templater processes template
7. QuickAdd captures result to active file
8. File created and linked

**Postcondition**: Entity created via QuickAdd macro

**Note**: Alternative flow to UC-001/002/003/004/005 using macros

---

### UC-INT02: Templater Dynamic Processing

**Actors**: Plugin + Templater

**Precondition**: Templater plugin installed

**Trigger**: Plugin loads template containing Templater syntax

**Main Flow**:
1. Plugin loads template file
2. Template contains:
   - `{{VALUE:*}}` placeholders (QuickAdd variables)
   - `<% %>` code blocks (Templater execution)
   - `<%= %>` expressions (Templater evaluation)
3. QuickAdd replaces `{{VALUE:*}}` with actual values
4. Templater engine processes `<% %>` code
5. Templater evaluates `<%= %>` expressions
6. Final rendered content generated

**Postcondition**: Template fully processed and rendered

**Example**:
```markdown
lastModified: <% tp.date.now("YYYY-MM-DD HH:mm") %>
vault: <% tp.file.folder(true) %>
```

---

### UC-INT03: Cross-Plugin Data Flow

**Actors**: obsidian-repo + QuickAdd + Templater

**Data Flow**:
```
User Input
    ↓
obsidian-repo script (validation + metadata)
    ↓
QuickAdd macro (variable substitution)
    ↓
Templater plugin (dynamic processing)
    ↓
Obsidian vault (file creation)
```

---

## Level 4: System Use Cases

### UC-SYS01: Validate Input

**Actor**: Plugin utility modules

**Used by**: UC-001 through UC-005

**Module**: `validateCommonInput()`

**Validation Rules**:
- Name length: 3-255 characters
- No special characters (path safe)
- No path traversal (`../`)
- No XSS patterns (`<script>`)
- Date format: YYYY-MM-DD or ISO 8601
- Priority: 1-5 range
- Email format: standard regex

---

### UC-SYS02: Generate Unique ID

**Actor**: Plugin utility modules

**Used by**: UC-001 through UC-005

**Module**: `generateUniqueId()`

**ID Format**: `{prefix}-{timestamp}-{randomHex}`

**Examples**:
- `repo-1712817000000-a1b2c3d4`
- `task-1712817000000-f5e6d7c8`
- `proj-1712817000000-b9a8c7d6`

**Guarantees**:
- Cryptographically unique
- No collisions
- Uses Web Crypto API

---

### UC-SYS03: Show Notification

**Actor**: Plugin via `notificationAdapter`

**Used by**: All operational UC

**Notification Types**:
- **Success**: "Repository created: My Repository"
- **Error**: "Invalid repository name"
- **Warning**: "Note content is empty"
- **Info**: "Checking templates folder..."

---

### UC-SYS04: Update Plugin Version

**Actor**: Developer / CI/CD

**Trigger**: `npm run version` command

**Actions**:
1. Bump version in `manifest.json`
2. Update `versions.json`
3. Git add (ready for commit)

**Postcondition**: Plugin ready for new release

---

## Requirement Traceability

### Functional Requirements (RF)

| ID | Requirement | UC |
|-----|------------|-----|
| RF-001 | Install plugin from Obsidian Community | UC-P01 |
| RF-002 | Configure plugin settings | UC-P02 |
| RF-003 | Create repository | UC-001 |
| RF-004 | Create task with priority | UC-002 |
| RF-005 | Create project with phases | UC-003 |
| RF-006 | Create pillar | UC-004 |
| RF-007 | Create fleeting notes | UC-005 |
| RF-008 | Create repository notes | UC-005b |
| RF-009 | Validate all input | UC-SYS01 |
| RF-010 | Generate unique IDs | UC-SYS02 |
| RF-011 | Show notifications | UC-SYS03 |
| RF-012 | QuickAdd integration | UC-INT01 |
| RF-013 | Templater integration | UC-INT02 |
| RF-014 | Dynamic template content | UC-INT02 |
| RF-015 | Save user preferences | UC-P02 |

### Non-Functional Requirements (RNF)

| ID | Requirement | UC | Metric |
|-----|------------|-----|---------|
| RNF-001 | Script execution time | UC-001-005 | <100ms |
| RNF-002 | Template processing | UC-INT02 | <50ms |
| RNF-003 | Total workflow | UC-001-005 | <200ms |
| RNF-004 | Plugin startup | UC-P01 | No errors |
| RNF-005 | Obsidian compatibility | All | 1.5.0+ |
| RNF-006 | Desktop/Mobile | All | Both supported |
| RNF-007 | XSS prevention | UC-SYS01 | 100% validation |
| RNF-008 | Cryptographic ID | UC-SYS02 | Web Crypto |
| RNF-009 | Path security | UC-INT01 | No traversal |
| RNF-010 | Documentation | All | 50+ files |
| RNF-011 | Test coverage | All | 99%+ |
| RNF-012 | Code style | All | JSDoc 100% |
| RNF-013 | Git history | All | 100% conventional |

---

## Module-UC Coverage Matrix

| Module | UC |
|--------|-----|
| validateCommonInput | UC-SYS01, UC-001-005 |
| generateUniqueId | UC-SYS02, UC-001-005 |
| getCurrentDateTime | UC-001-005 |
| getAuthorName | UC-001-005 |
| getFileName | UC-001-005 |
| showNotification | UC-SYS03, UC-001-005 |
| normalize | UC-001-005 |
| validators | UC-SYS01 |
| hexEncoder | UC-SYS02 |
| pathUtils | UC-INT01 |
| formatter | UC-SYS03 |
| notificationAdapter | UC-SYS03 |
| createRepository.js | UC-001, UC-INT01 |
| createTask.js | UC-002, UC-INT01 |
| createProject.js | UC-003, UC-INT01 |
| createPillar.js | UC-004, UC-INT01 |
| createRepositoryNote.js | UC-005b, UC-INT01 |
| repository.md | UC-001, UC-INT02 |
| task.md | UC-002, UC-INT02 |
| project.md | UC-003, UC-INT02 |
| pillar.md | UC-004, UC-INT02 |
| repositoryNote.md | UC-005b, UC-INT02 |
| src/main.ts | UC-P01, UC-P02, UC-001-005, UC-SYS04 |

**Coverage**: 100% of modules used in UC

---

## Summary

- **Total UC**: 15
- **Setup UC**: 2
- **Operational UC**: 6
- **Integration UC**: 3
- **System UC**: 4
- **Total FR**: 15
- **Total NF**: 13
- **Module Coverage**: 100%

All use cases are fully specified, traced to requirements, and covered by implementation modules and tests.
