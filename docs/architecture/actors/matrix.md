```yaml
type: Documento Técnico
title: PASO 3 - ACTORES Y MATRIZ
version: 1.0.0
scope: ACTIVIDAD 1 - Organización por Actor
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Análisis de responsabilidades por actor
```

# PASO 3: ACTORES Y MATRIZ
## Agrupación de UCs por Actor y Responsabilidades

---

## INTRODUCCIÓN

Este artefacto organiza los 5 UCs por **ACTOR** (no por sección). Cada actor tiene responsabilidades específicas en cada UC. Esta vista permite identificar puntos críticos de integración y dependencias.

**5 Actores identificados:**
1. Usuario (Nestor)
2. QuickAdd Plugin
3. Obsidian Core
4. Módulos Utils/
5. Template Engine

---

## ACTOR 1: USUARIO (Nestor)

### Rol
**Actor Primario - Iniciador de todas las acciones**

### Participación en UCs
- UC-001: ✓ (Crear Repositorio)
- UC-002: ✓ (Crear Tarea)
- UC-003: ✓ (Crear Proyecto)
- UC-004: ✓ (Crear Pilar)
- UC-005: ✓ (Crear Nota en Repositorio)

**Participación: 5/5 (100%)**

---

### Responsabilidades por UC

#### UC-001: Crear Repositorio
| Paso | Responsabilidad | Acción | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre repositorio | "Mi Proyecto XYZ" |
| 4 | Seleccionar tipo | Elige tipo (Personal, Work, Research) | "Work" |

**Puntos críticos**: Validación de nombre (E-001 a E-004)

---

#### UC-002: Crear Tarea
| Paso | Responsabilidad | Acción | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 4 | Proporcionar título | Ingresa título tarea | "Revisar documento" |
| 4 | Seleccionar prioridad | Elige prioridad (High, Normal, Low) | "High" |
| 5 | Proporcionar descripción | Ingresa descripción (opcional) | [Texto] |
| 6 | Proporcionar fecha vencimiento | Ingresa fecha (YYYY-MM-DD, opcional) | "2026-04-15" |

**Puntos críticos**: Validación de fecha (E-005)

---

#### UC-003: Crear Proyecto
| Paso | Responsabilidad | Acción | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre proyecto | "Implementar autenticación" |
| 4 | Seleccionar estado | Elige estado (Active, Paused, Planning) | "Active" |
| 5 | Proporcionar descripción | Ingresa descripción | [Texto] |

**Puntos críticos**: Validación de estado (E-005)

---

#### UC-004: Crear Pilar
| Paso | Responsabilidad | Acción | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre pilar | "Arquitectura Software" |
| 4 | Seleccionar estado | Elige estado (Active, Inactive) | "Active" |

**Puntos críticos**: Validación de nombre (E-001 a E-004)

---

#### UC-005: Crear Nota en Repositorio
| Paso | Responsabilidad | Acción | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Seleccionar repositorio | Elige repositorio de lista | "Mi Proyecto XYZ" |
| 4 | Proporcionar título | Ingresa título nota | "Análisis requisitos" |
| 5 | Proporcionar descripción | Ingresa descripción (opcional) | [Texto] |

**Puntos críticos**: 
- E-001: No hay repositorios (precondición UC-001)
- E-004: Caracteres inválidos en título

---

### Matriz: Usuario en Todos los UCs

```
USUARIO (Nestor) - Actor Primario
├─ UC-001: Crear Repositorio
│   └─ Input: nombre, tipo
│   └─ Acciones: 3 prompts
│
├─ UC-002: Crear Tarea
│   └─ Input: título, prioridad, descripción, fecha
│   └─ Acciones: 4 prompts
│
├─ UC-003: Crear Proyecto
│   └─ Input: nombre, estado, descripción
│   └─ Acciones: 3 prompts
│
├─ UC-004: Crear Pilar
│   └─ Input: nombre, estado
│   └─ Acciones: 2 prompts
│
└─ UC-005: Crear Nota en Repositorio
    └─ Input: repositorio, título, descripción
    └─ Acciones: 3 prompts (+ selección repo)
    └─ Precondición: UC-001 completado
```

---

### Puntos Críticos del Usuario

**PC-U1: Validación de Entrada**
- Ubicación: Todos los UCs
- Riesgo: Usuario ingresa datos inválidos
- Mitigación: Validación clara en PASO 2 de cada UC

**PC-U2: Precondición UC-005**
- Ubicación: UC-005
- Riesgo: Usuario intenta crear nota sin repositorio
- Mitigación: Error claro (E-001) indicando que debe crear repositorio primero

---

## ACTOR 2: QUICKADD PLUGIN

### Rol
**Actor Secundario - Orquestador de macros**

### Participación en UCs
- UC-001: ✓
- UC-002: ✓
- UC-003: ✓
- UC-004: ✓
- UC-005: ✓

**Participación: 5/5 (100%)**

---

### Responsabilidades por UC

#### Responsabilidades Comunes en Todos los UCs
| Paso | Responsabilidad | Acción |
|------|---|---|
| 2 | Cargar script | Carga createRepository.js (u otro) |
| 13-14 | Ejecutar template | Reemplaza {{VARIABLE:...}} con valores |
| 14 | Crear archivo | Llama app.vault.create() |
| 15 | Mostrar notificación | Muestra feedback al usuario |

---

#### UC-001 Específicamente
- Cargar: createRepository.js
- Prompts: 2 (nombre + tipo selector)
- Variables: 8 (repositoryId, repositoryName, etc.)
- Template: repository.md

---

#### UC-002 Específicamente
- Cargar: createTask.js
- Prompts: 4 (título, prioridad, descripción, fecha)
- Variables: 9 (taskId, taskTitle, etc.)
- Template: task.md

---

#### UC-003 Específicamente
- Cargar: createProject.js
- Prompts: 3 (nombre, estado, descripción)
- Variables: 8 (projectId, projectName, etc.)
- Template: project.md

---

#### UC-004 Específicamente
- Cargar: createPillar.js
- Prompts: 2 (nombre, estado)
- Variables: 7 (pillarId, pillarName, etc.)
- Template: pillar.md

---

#### UC-005 Específicamente
- Cargar: createRepositoryNote.js
- Prompts: 3 (selector repo, título, descripción)
- Variables: 8 (noteId, noteTitle, repositoryContext, etc.)
- Template: repositoryNote.md
- Acceso a MetadataCache: Obtener metadata del repositorio

---

### Matriz: QuickAdd Responsabilidades

```
QUICKADD - Actor Orquestador
├─ Carga de Scripts: 5 scripts (createRepository.js, createTask.js, etc.)
├─ Gestión de Prompts: 
│   ├─ inputPrompt(): UC-001, UC-002, UC-003, UC-004, UC-005 (múltiples)
│   ├─ suggester(): UC-001, UC-002, UC-003, UC-004, UC-005
│   └─ wideInputPrompt(): UC-002, UC-003, UC-005
├─ Reemplazo de Variables: {{VALUE:...}} en templates
├─ Creación de Archivos: Llamadas a app.vault.create()
└─ Notificaciones: Feedback al usuario (éxito o error)

TOTAL: 50+ operaciones en 5 UCs
```

---

### Puntos Críticos de QuickAdd

**PC-Q1: Reemplazo de Variables en Template**
- Ubicación: Paso 13-14 de cada UC
- Riesgo: Si placeholder no se reemplaza, archivo contiene {{VARIABLE:...}} literal
- Mitigación: Validar que variable.nombre coincide exactamente con template

**PC-Q2: Manejo de Cancellations**
- Ubicación: Todos los prompts
- Riesgo: Si usuario cancela prompt, script puede fallar
- Mitigación: Try-catch en script, validar que valor no es null/undefined

**PC-Q3: Acceso a MetadataCache (UC-005)**
- Ubicación: UC-005 Paso 3
- Riesgo: Si metadataCache no está disponible, no puedo listar repositorios
- Mitigación: Acceso a app.metadataCache.getCache()

---

## ACTOR 3: OBSIDIAN CORE

### Rol
**Actor Secundario - Infraestructura de almacenamiento**

### Participación en UCs
- UC-001: ✓
- UC-002: ✓
- UC-003: ✓
- UC-004: ✓
- UC-005: ✓

**Participación: 5/5 (100%)**

---

### Responsabilidades por UC

#### Responsabilidades Comunes en Todos los UCs
| Responsabilidad | Operación | Ubicación UC |
|---|---|---|
| Crear carpeta | app.vault.createFolder() | Paso 14 de cada UC |
| Crear archivo | app.vault.create() | Paso 14 de cada UC |
| Persistir a disco | File System | Automático post-create |

---

#### UC-001: Crear estructura repositories/
- Crear carpeta: repositories/
- Crear carpeta: repositories/work/
- Crear carpeta: repositories/work/id-naq5a4.../
- Crear archivo: mi-proyecto.md
- Estructura total: 3 niveles

---

#### UC-002: Crear estructura tasks/
- Crear carpeta: tasks/
- Crear carpeta: tasks/high/
- Crear carpeta: tasks/high/id-naq5a5.../
- Crear archivo: revisar-documento.md
- Estructura total: 3 niveles

---

#### UC-003: Crear estructura projects/
- Crear carpeta: projects/
- Crear carpeta: projects/active/
- Crear carpeta: projects/active/id-naq5a6.../
- Crear archivo: implementar-sistema.md
- Estructura total: 3 niveles

---

#### UC-004: Crear estructura pillars/
- Crear carpeta: pillars/
- Crear carpeta: pillars/active/
- Crear carpeta: pillars/active/id-naq5a7.../
- Crear archivo: arquitectura.md
- Estructura total: 3 niveles

---

#### UC-005: Crear estructura dentro de repositorio
- Crear carpeta: repositories/work/id-naq5a4.../notes/
- Crear carpeta: repositories/work/id-naq5a4.../notes/id-naq5b8.../
- Crear archivo: analisis-requisitos.md
- Estructura total: Dentro estructura existente

---

### Matriz: Obsidian Operaciones Filesystem

```
OBSIDIAN - Actor Infraestructura
├─ Creación de Carpetas (recursiva):
│   ├─ UC-001: repositories/{type}/{id}/ → 3 niveles
│   ├─ UC-002: tasks/{priority}/{id}/ → 3 niveles
│   ├─ UC-003: projects/{status}/{id}/ → 3 niveles
│   ├─ UC-004: pillars/{status}/{id}/ → 3 niveles
│   └─ UC-005: repositories/{type}/{repo-id}/notes/{note-id}/ → dentro existente
├─ Creación de Archivos:
│   ├─ UC-001: repository.md en carpeta específica
│   ├─ UC-002: task.md en carpeta específica
│   ├─ UC-003: project.md en carpeta específica
│   ├─ UC-004: pillar.md en carpeta específica
│   └─ UC-005: repositoryNote.md dentro del repositorio
├─ Acceso a Metadata:
│   └─ UC-005: Leer metadata de repositorio existente
└─ Persistencia:
    └─ Automática en todos los casos
```

---

### Puntos Críticos de Obsidian

**PC-O1: Creación de Carpetas Recursiva**
- Ubicación: Paso 14 de cada UC
- Riesgo: Si carpeta padre no existe, createFolder() falla
- Mitigación: Crear carpetas recursivamente (carpeta → subcarpeta → id)

**PC-O2: Permisos de Lectura/Escritura**
- Ubicación: Paso 14 de cada UC
- Riesgo: Permisos insuficientes → Excepción E-007 o E-008
- Mitigación: Validar permisos antes de intentar crear

**PC-O3: Espacio en Disco**
- Ubicación: Paso 14 de cada UC
- Riesgo: Espacio insuficiente → Excepción E-009 o E-012
- Mitigación: Manejo de error graceful

**PC-O4: Acceso a MetadataCache (UC-005)**
- Ubicación: UC-005 Paso 3 y 9
- Riesgo: Cache desactualizado o no disponible
- Mitigación: Acceso a app.metadataCache.getFileCache(path)

---

## ACTOR 4: MÓDULOS UTILS/

### Rol
**Actor Secundario - Utilidades reutilizables**

### Participación en UCs
- UC-001: ✓ (6 módulos)
- UC-002: ✓ (5 módulos)
- UC-003: ✓ (6 módulos)
- UC-004: ✓ (5 módulos)
- UC-005: ✓ (5 módulos)

**Participación: 5/5 (100%)**

---

### Módulos Utilizados por UC

#### UC-001: Crear Repositorio
| Módulo | Operación | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 5 |
| generateUniqueId() | OP-003 | 6 |
| getCurrentDateTime() | OP-005 | 7 |
| getFileName() | OP-006 | 8 |
| getGrandParentFolder() | OP-008 | 9 |
| showNotification() | OP-015 | 15 |

**Módulos: 6**

---

#### UC-002: Crear Tarea
| Módulo | Operación | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 7 |
| generateUniqueId() | OP-003 | 8 |
| getCurrentDateTime() | OP-005 | 9 |
| getFileName() | OP-006 | 10 |
| getAuthorName() | OP-007 | 11 |
| showNotification() | OP-015 | 16 |

**Módulos: 6** (nota: getMetadataByFrontmatter implícito)

---

#### UC-003: Crear Proyecto
| Módulo | Operación | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 6 |
| generateUniqueId() | OP-003 | 7 |
| getCurrentDateTime() | OP-005 | 8 |
| getFileName() | OP-006 | 9 |
| getAuthorName() | OP-007 | 10 |
| getGrandParentFolder() | OP-008 | 11 |
| showNotification() | OP-015 | 17 |

**Módulos: 7**

---

#### UC-004: Crear Pilar
| Módulo | Operación | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 5 |
| generateUniqueId() | OP-003 | 6 |
| getCurrentDateTime() | OP-005 | 7 |
| getFileName() | OP-006 | 8 |
| getGrandParentFolder() | OP-008 | 9 |
| showNotification() | OP-015 | 15 |

**Módulos: 6**

---

#### UC-005: Crear Nota en Repositorio
| Módulo | Operación | Paso UC |
|---|---|---|
| getMetadataByFrontmatter() | OP-007 | 3, 9 |
| validateCommonInput() | OP-002 | 6 |
| generateUniqueId() | OP-003 | 7 |
| getCurrentDateTime() | OP-005 | 8 |
| getFileName() | OP-006 | 10 |
| getAuthorName() | OP-007 | 12 |
| showNotification() | OP-015 | 16 |

**Módulos: 7** (getMetadataByFrontmatter usado 2 veces)

---

### Matriz: Utils Reutilización

```
MÓDULOS UTILS/ - Actor Utilidades
├─ validateCommonInput()
│   ├─ UC-001: Paso 5 ✓
│   ├─ UC-002: Paso 7 ✓
│   ├─ UC-003: Paso 6 ✓
│   ├─ UC-004: Paso 5 ✓
│   └─ UC-005: Paso 6 ✓
│   REUTILIZADO: 5/5 (100%)
│
├─ generateUniqueId()
│   ├─ UC-001: Paso 6 ✓
│   ├─ UC-002: Paso 8 ✓
│   ├─ UC-003: Paso 7 ✓
│   ├─ UC-004: Paso 6 ✓
│   └─ UC-005: Paso 7 ✓
│   REUTILIZADO: 5/5 (100%)
│
├─ getCurrentDateTime()
│   ├─ UC-001: Paso 7 ✓
│   ├─ UC-002: Paso 9 ✓
│   ├─ UC-003: Paso 8 ✓
│   ├─ UC-004: Paso 7 ✓
│   └─ UC-005: Paso 8 ✓
│   REUTILIZADO: 5/5 (100%)
│
├─ getFileName()
│   ├─ UC-001: Paso 8 ✓
│   ├─ UC-002: Paso 10 ✓
│   ├─ UC-003: Paso 9 ✓
│   ├─ UC-004: Paso 8 ✓
│   └─ UC-005: Paso 10 ✓
│   REUTILIZADO: 5/5 (100%)
│
├─ getMetadataByFrontmatter()
│   ├─ UC-001: No
│   ├─ UC-002: Implícito
│   ├─ UC-003: Implícito
│   ├─ UC-004: No
│   └─ UC-005: Paso 3, 9 (2 veces) ✓
│   REUTILIZADO: 1/5 (UC-005 específicamente)
│
├─ getGrandParentFolder()
│   ├─ UC-001: Paso 9 ✓
│   ├─ UC-002: No
│   ├─ UC-003: Paso 11 ✓
│   ├─ UC-004: Paso 9 ✓
│   └─ UC-005: No
│   REUTILIZADO: 3/5
│
├─ getAuthorName()
│   ├─ UC-001: Implícito
│   ├─ UC-002: Paso 11 ✓
│   ├─ UC-003: Paso 10 ✓
│   ├─ UC-004: Paso 10 ✓
│   └─ UC-005: Paso 12 ✓
│   REUTILIZADO: 4/5
│
└─ showNotification()
    ├─ UC-001: Paso 15 ✓
    ├─ UC-002: Paso 16 ✓
    ├─ UC-003: Paso 17 ✓
    ├─ UC-004: Paso 15 ✓
    └─ UC-005: Paso 16 ✓
    REUTILIZADO: 5/5 (100%)
```

---

### Puntos Críticos de Utils

**PC-U1: Unicidad de IDs**
- Módulo: generateUniqueId()
- Riesgo: Colisión de IDs → archivos se sobrescriben
- Mitigación: Web Crypto API + timestamp combinados

**PC-U2: Validación de Entrada**
- Módulo: validateCommonInput()
- Riesgo: Validación insuficiente → datos corrupta en archivo
- Mitigación: Regex explícito `/^[a-zA-Z0-9\-_\s]+$/`

**PC-U3: Integridad de Metadata**
- Módulo: getMetadataByFrontmatter()
- Riesgo: Frontmatter inválido → error (UC-005)
- Mitigación: Validar que YAML parse correctamente

---

## ACTOR 5: TEMPLATE ENGINE

### Rol
**Actor Consumidor - Generador de contenido**

### Participación en UCs
- UC-001: ✓ (repository.md)
- UC-002: ✓ (task.md)
- UC-003: ✓ (project.md)
- UC-004: ✓ (pillar.md)
- UC-005: ✓ (repositoryNote.md)

**Participación: 5/5 (100%)**

---

### Templates por UC

#### UC-001: repository.md
- **Variables**: 8 (repositoryId, repositoryName, repositoryType, createdDate, authorName, etc.)
- **Placeholders**: {{VALUE:repositoryId}}, {{VALUE:repositoryName}}, etc.
- **Secciones**: Descripción, Estructura, Información, Contenido, Notas
- **Frontmatter**: YAML con id, name, type, created, author, tags, status

---

#### UC-002: task.md
- **Variables**: 9 (taskId, taskTitle, taskPriority, taskDueDate, etc.)
- **Placeholders**: {{VALUE:taskId}}, {{VALUE:taskTitle}}, etc.
- **Secciones**: Descripción, Detalles, Checklist, Subtareas, Recursos, Timeline
- **Frontmatter**: YAML con id, title, priority, status: pending, created, dueDate, author, tags

---

#### UC-003: project.md
- **Variables**: 8 (projectId, projectName, projectStatus, projectDescription, etc.)
- **Placeholders**: {{VALUE:projectId}}, {{VALUE:projectName}}, etc.
- **Secciones**: Descripción, Tareas (Fase 1-4), Hitos, Equipo, Recursos, Métricas
- **Frontmatter**: YAML con id, name, status, created, author, tags

---

#### UC-004: pillar.md
- **Variables**: 7 (pillarId, pillarName, pillarStatus, createdDate, authorName, etc.)
- **Placeholders**: {{VALUE:pillarId}}, {{VALUE:pillarName}}, etc.
- **Secciones**: Descripción, Conceptos, Principios, Notas, Recursos, Mapeo
- **Frontmatter**: YAML con id, name, status, created, author, tags, relatedPillars

---

#### UC-005: repositoryNote.md
- **Variables**: 8 (noteId, noteTitle, repositoryContext.id/name/type/path, etc.)
- **Placeholders**: {{VALUE:noteId}}, {{VALUE:repositoryContext.name}}, etc.
- **Secciones**: Descripción, Contenido Principal, Análisis, Conclusiones, Recomendaciones
- **Frontmatter**: YAML con id, title, created, author, repositoryId, repositoryName, tags
- **Referencia Cruzada**: [[{{VALUE:repositoryContext.name}}]] (wikilink)

---

### Matriz: Templates Completitud

```
TEMPLATE ENGINE - Actor Consumidor
├─ repository.md
│   ├─ Frontmatter: 8 campos ✓
│   ├─ Secciones: 5 principales ✓
│   ├─ Placeholders: 8 variables ✓
│   └─ Wikilinks: Sí
│
├─ task.md
│   ├─ Frontmatter: 8 campos + status:pending ✓
│   ├─ Secciones: 6 principales ✓
│   ├─ Placeholders: 9 variables ✓
│   └─ Wikilinks: Sí
│
├─ project.md
│   ├─ Frontmatter: 8 campos ✓
│   ├─ Secciones: 7 principales (4 fases) ✓
│   ├─ Placeholders: 8 variables ✓
│   └─ Wikilinks: Sí
│
├─ pillar.md
│   ├─ Frontmatter: 8 campos ✓
│   ├─ Secciones: 7 principales ✓
│   ├─ Placeholders: 7 variables ✓
│   └─ Wikilinks: Sí
│
└─ repositoryNote.md
    ├─ Frontmatter: 9 campos ✓
    ├─ Secciones: 8 principales ✓
    ├─ Placeholders: 8 variables + contexto repo ✓
    └─ Wikilinks: Sí (referencia a repositorio padre)
```

---

### Puntos Críticos de Template

**PC-T1: Reemplazo Completo de Placeholders**
- Ubicación: Todos los templates
- Riesgo: Placeholder no reemplazado → {{VALUE:variableName}} literal en archivo
- Mitigación: Validar que cada placeholder tiene variable correspondiente

**PC-T2: Formato de Frontmatter YAML**
- Ubicación: Todos los templates
- Riesgo: YAML inválido → frontmatter parse error
- Mitigación: Validar sintaxis YAML en template

**PC-T3: Wikilinks en UC-005**
- Ubicación: repositoryNote.md
- Riesgo: [[repositoryName]] podría tener caracteres inválidos
- Mitigación: Usar repositoryContext.name ya validado

---

## MATRIZ COMPLETA: ACTORES × UCS

```
┌────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ ACTOR          │ UC-001  │ UC-002  │ UC-003  │ UC-004  │ UC-005  │
├────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Usuario        │ ✓ (3)   │ ✓ (4)   │ ✓ (3)   │ ✓ (2)   │ ✓ (3)   │
│ QuickAdd       │ ✓ (5)   │ ✓ (4)   │ ✓ (4)   │ ✓ (3)   │ ✓ (4)   │
│ Obsidian       │ ✓ (3)   │ ✓ (2)   │ ✓ (2)   │ ✓ (2)   │ ✓ (2)   │
│ Utils/         │ ✓ (6)   │ ✓ (6)   │ ✓ (7)   │ ✓ (6)   │ ✓ (7)   │
│ Template       │ ✓ (1)   │ ✓ (1)   │ ✓ (1)   │ ✓ (1)   │ ✓ (1)   │
│ MetadataCache  │ -       │ -       │ -       │ -       │ ✓ (1)   │
├────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ TOTAL          │ 5       │ 5       │ 5       │ 5       │ 6       │
└────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Números: cantidad de pasos/operaciones por actor en cada UC
Checkmarks: participación (✓ = participa)
```

---

## FLUJO DE DATOS ENTRE ACTORES (Ejemplo: UC-001)

```
Usuario
  │
  ├─ Invoca macro (Paso 1)
  │   ↓
  QuickAdd
  │
  ├─ Carga createRepository.js (Paso 2)
  │   ↓
  │ [Usuario ingresa nombre] (Paso 3)
  │   ↓
  │ [Usuario selecciona tipo] (Paso 4)
  │   ↓
  Utils/
  │
  ├─ validateCommonInput() (Paso 5: OP-002)
  │   ↓ [Válido]
  │ generateUniqueId() (Paso 6: OP-003)
  │   ↓
  │ getCurrentDateTime() (Paso 7: OP-005)
  │   ↓
  │ getFileName() (Paso 8: OP-006)
  │   ↓
  │ getGrandParentFolder() (Paso 9: OP-008)
  │   ↓
  QuickAdd (retorna control)
  │
  ├─ Asigna variables (Paso 12: OP-012)
  │   ↓
  Template
  │
  ├─ Reemplaza {{VALUE:...}} (Paso 13: OP-013)
  │   ↓
  QuickAdd (retorna control)
  │
  ├─ Llama app.vault.create() (Paso 14: OP-014)
  │   ↓
  Obsidian
  │
  ├─ createFolder() (Paso 14: recursivo)
  │   ↓ [Carpetas creadas]
  │ create() (Paso 14: crea archivo)
  │   ↓
  File System (persistencia)
  │   ↓
  QuickAdd (retorna control)
  │
  ├─ showNotification() (Paso 15: OP-015)
  │   ↓
  Utils/
  │
  ├─ Muestra notificación verde
  │   ↓
  Usuario
  │
  └─ Ve "Repositorio creado exitosamente"
```

---

## RESUMEN: ACTORES Y RESPONSABILIDADES

| Actor | Participación | Responsabilidades Clave | Puntos Críticos |
|-------|---|---|---|
| **Usuario** | 5/5 | Invocar, proporcionar datos | Validación entrada |
| **QuickAdd** | 5/5 | Orquestar, ejecutar template | Reemplazo variables |
| **Obsidian** | 5/5 | Crear estructura, persistir | Permisos, espacio |
| **Utils/** | 5/5 | Validar, generar, formatear | Unicidad IDs |
| **Template** | 5/5 | Generar contenido markdown | Completitud placeholders |
| **MetadataCache** | 1/5 | Leer metadata (UC-005 solo) | Integridad YAML |

---

**DOCUMENTO**: PASO3-ACTORES-MATRIZ.md
**VERSIÓN**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: MATRIZ COMPLETADA - ACTORES DOCUMENTADOS
