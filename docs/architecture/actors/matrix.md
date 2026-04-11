```yaml
type: Documento T茅cnico
title: PASO 3 - ACTORES Y MATRIZ
version: 1.0.0
scope: ACTIVIDAD 1 - Organizaci贸n por Actor
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
status: An谩lisis de responsabilidades por actor
```

# PASO 3: ACTORES Y MATRIZ
## Agrupaci贸n de UCs por Actor y Responsabilidades

---

## INTRODUCCI肹SPEC]N

Este artefacto organiza los 5 UCs por **ACTOR** (no por secci贸n). Cada actor tiene responsabilidades espec铆ficas en cada UC. Esta vista permite identificar puntos cr铆ticos de integraci贸n y dependencias.

**5 Actores identificados:**
1. Usuario (Nestor)
2. QuickAdd Plugin
3. Obsidian Core
4. M贸dulos Utils/
5. Template Engine

---

## ACTOR 1: USUARIO (Nestor)

### Rol
**Actor Primario - Iniciador de todas las acciones**

### Participaci贸n en UCs
- UC-001: [DONE][DONE][SPEC] (Crear Repositorio)
- UC-002: [DONE][DONE][SPEC] (Crear Tarea)
- UC-003: [DONE][DONE][SPEC] (Crear Proyecto)
- UC-004: [DONE][DONE][SPEC] (Crear Pilar)
- UC-005: [DONE][DONE][SPEC] (Crear Nota en Repositorio)

**Participaci贸n: 5/5 (100%)**

---

### Responsabilidades por UC

#### UC-001: Crear Repositorio
| Paso | Responsabilidad | Acci贸n | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre repositorio | "Mi Proyecto XYZ" |
| 4 | Seleccionar tipo | Elige tipo (Personal, Work, Research) | "Work" |

**Puntos cr铆ticos**: Validaci贸n de nombre (E-001 a E-004)

---

#### UC-002: Crear Tarea
| Paso | Responsabilidad | Acci贸n | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 4 | Proporcionar t铆tulo | Ingresa t铆tulo tarea | "Revisar documento" |
| 4 | Seleccionar prioridad | Elige prioridad (High, Normal, Low) | "High" |
| 5 | Proporcionar descripci贸n | Ingresa descripci贸n (opcional) | [Texto] |
| 6 | Proporcionar fecha vencimiento | Ingresa fecha (YYYY-MM-DD, opcional) | "2026-04-15" |

**Puntos cr铆ticos**: Validaci贸n de fecha (E-005)

---

#### UC-003: Crear Proyecto
| Paso | Responsabilidad | Acci贸n | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre proyecto | "Implementar autenticaci贸n" |
| 4 | Seleccionar estado | Elige estado (Active, Paused, Planning) | "Active" |
| 5 | Proporcionar descripci贸n | Ingresa descripci贸n | [Texto] |

**Puntos cr铆ticos**: Validaci贸n de estado (E-005)

---

#### UC-004: Crear Pilar
| Paso | Responsabilidad | Acci贸n | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Proporcionar nombre | Ingresa nombre pilar | "Arquitectura Software" |
| 4 | Seleccionar estado | Elige estado (Active, Inactive) | "Active" |

**Puntos cr铆ticos**: Validaci贸n de nombre (E-001 a E-004)

---

#### UC-005: Crear Nota en Repositorio
| Paso | Responsabilidad | Acci贸n | Input |
|------|---|---|---|
| 1 | Invocar macro | Abre command palette | Ctrl+P / Cmd+P |
| 3 | Seleccionar repositorio | Elige repositorio de lista | "Mi Proyecto XYZ" |
| 4 | Proporcionar t铆tulo | Ingresa t铆tulo nota | "An谩lisis requisitos" |
| 5 | Proporcionar descripci贸n | Ingresa descripci贸n (opcional) | [Texto] |

**Puntos cr铆ticos**: 
- E-001: No hay repositorios (precondici贸n UC-001)
- E-004: Caracteres inv谩lidos en t铆tulo

---

### Matriz: Usuario en Todos los UCs

```
USUARIO (Nestor) - Actor Primario
[DONE]擺DONE][DONE]擺READY] UC-001: Crear Repositorio
[DONE]攤   [DONE]敂[DONE]擺READY] Input: nombre, tipo
[DONE]攤   [DONE]敂[DONE]擺READY] Acciones: 3 prompts
[DONE]攤
[DONE]擺DONE][DONE]擺READY] UC-002: Crear Tarea
[DONE]攤   [DONE]敂[DONE]擺READY] Input: t铆tulo, prioridad, descripci贸n, fecha
[DONE]攤   [DONE]敂[DONE]擺READY] Acciones: 4 prompts
[DONE]攤
[DONE]擺DONE][DONE]擺READY] UC-003: Crear Proyecto
[DONE]攤   [DONE]敂[DONE]擺READY] Input: nombre, estado, descripci贸n
[DONE]攤   [DONE]敂[DONE]擺READY] Acciones: 3 prompts
[DONE]攤
[DONE]擺DONE][DONE]擺READY] UC-004: Crear Pilar
[DONE]攤   [DONE]敂[DONE]擺READY] Input: nombre, estado
[DONE]攤   [DONE]敂[DONE]擺READY] Acciones: 2 prompts
[DONE]攤
[DONE]敂[DONE]擺READY] UC-005: Crear Nota en Repositorio
    [DONE]敂[DONE]擺READY] Input: repositorio, t铆tulo, descripci贸n
    [DONE]敂[DONE]擺READY] Acciones: 3 prompts (+ selecci贸n repo)
    [DONE]敂[DONE]擺READY] Precondici贸n: UC-001 completado
```

---

### Puntos Cr铆ticos del Usuario

**PC-U1: Validaci贸n de Entrada**
- Ubicaci贸n: Todos los UCs
- Riesgo: Usuario ingresa datos inv谩lidos
- Mitigaci贸n: Validaci贸n clara en PASO 2 de cada UC

**PC-U2: Precondici贸n UC-005**
- Ubicaci贸n: UC-005
- Riesgo: Usuario intenta crear nota sin repositorio
- Mitigaci贸n: Error claro (E-001) indicando que debe crear repositorio primero

---

## ACTOR 2: QUICKADD PLUGIN

### Rol
**Actor Secundario - Orquestador de macros**

### Participaci贸n en UCs
- UC-001: [DONE][DONE][SPEC]
- UC-002: [DONE][DONE][SPEC]
- UC-003: [DONE][DONE][SPEC]
- UC-004: [DONE][DONE][SPEC]
- UC-005: [DONE][DONE][SPEC]

**Participaci贸n: 5/5 (100%)**

---

### Responsabilidades por UC

#### Responsabilidades Comunes en Todos los UCs
| Paso | Responsabilidad | Acci贸n |
|------|---|---|
| 2 | Cargar script | Carga createRepository.js (u otro) |
| 13-14 | Ejecutar template | Reemplaza {{VARIABLE:...}} con valores |
| 14 | Crear archivo | Llama app.vault.create() |
| 15 | Mostrar notificaci贸n | Muestra feedback al usuario |

---

#### UC-001 Espec铆ficamente
- Cargar: createRepository.js
- Prompts: 2 (nombre + tipo selector)
- Variables: 8 (repositoryId, repositoryName, etc.)
- Template: repository.md

---

#### UC-002 Espec铆ficamente
- Cargar: createTask.js
- Prompts: 4 (t铆tulo, prioridad, descripci贸n, fecha)
- Variables: 9 (taskId, taskTitle, etc.)
- Template: task.md

---

#### UC-003 Espec铆ficamente
- Cargar: createProject.js
- Prompts: 3 (nombre, estado, descripci贸n)
- Variables: 8 (projectId, projectName, etc.)
- Template: project.md

---

#### UC-004 Espec铆ficamente
- Cargar: createPillar.js
- Prompts: 2 (nombre, estado)
- Variables: 7 (pillarId, pillarName, etc.)
- Template: pillar.md

---

#### UC-005 Espec铆ficamente
- Cargar: createRepositoryNote.js
- Prompts: 3 (selector repo, t铆tulo, descripci贸n)
- Variables: 8 (noteId, noteTitle, repositoryContext, etc.)
- Template: repositoryNote.md
- Acceso a MetadataCache: Obtener metadata del repositorio

---

### Matriz: QuickAdd Responsabilidades

```
QUICKADD - Actor Orquestador
[DONE]擺DONE][DONE]擺READY] Carga de Scripts: 5 scripts (createRepository.js, createTask.js, etc.)
[DONE]擺DONE][DONE]擺READY] Gesti贸n de Prompts: 
[DONE]攤   [DONE]擺DONE][DONE]擺READY] inputPrompt(): UC-001, UC-002, UC-003, UC-004, UC-005 (m煤ltiples)
[DONE]攤   [DONE]擺DONE][DONE]擺READY] suggester(): UC-001, UC-002, UC-003, UC-004, UC-005
[DONE]攤   [DONE]敂[DONE]擺READY] wideInputPrompt(): UC-002, UC-003, UC-005
[DONE]擺DONE][DONE]擺READY] Reemplazo de Variables: {{VALUE:...}} en templates
[DONE]擺DONE][DONE]擺READY] Creaci贸n de Archivos: Llamadas a app.vault.create()
[DONE]敂[DONE]擺READY] Notificaciones: Feedback al usuario (茅xito o error)

TOTAL: 50+ operaciones en 5 UCs
```

---

### Puntos Cr铆ticos de QuickAdd

**PC-Q1: Reemplazo de Variables en Template**
- Ubicaci贸n: Paso 13-14 de cada UC
- Riesgo: Si placeholder no se reemplaza, archivo contiene {{VARIABLE:...}} literal
- Mitigaci贸n: Validar que variable.nombre coincide exactamente con template

**PC-Q2: Manejo de Cancellations**
- Ubicaci贸n: Todos los prompts
- Riesgo: Si usuario cancela prompt, script puede fallar
- Mitigaci贸n: Try-catch en script, validar que valor no es null/undefined

**PC-Q3: Acceso a MetadataCache (UC-005)**
- Ubicaci贸n: UC-005 Paso 3
- Riesgo: Si metadataCache no est谩 disponible, no puedo listar repositorios
- Mitigaci贸n: Acceso a app.metadataCache.getCache()

---

## ACTOR 3: OBSIDIAN CORE

### Rol
**Actor Secundario - Infraestructura de almacenamiento**

### Participaci贸n en UCs
- UC-001: [DONE][DONE][SPEC]
- UC-002: [DONE][DONE][SPEC]
- UC-003: [DONE][DONE][SPEC]
- UC-004: [DONE][DONE][SPEC]
- UC-005: [DONE][DONE][SPEC]

**Participaci贸n: 5/5 (100%)**

---

### Responsabilidades por UC

#### Responsabilidades Comunes en Todos los UCs
| Responsabilidad | Operaci贸n | Ubicaci贸n UC |
|---|---|---|
| Crear carpeta | app.vault.createFolder() | Paso 14 de cada UC |
| Crear archivo | app.vault.create() | Paso 14 de cada UC |
| Persistir a disco | File System | Autom谩tico post-create |

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
[DONE]擺DONE][DONE]擺READY] Creaci贸n de Carpetas (recursiva):
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: repositories/{type}/{id}/ 3 niveles
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: tasks/{priority}/{id}/ 3 niveles
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: projects/{status}/{id}/ 3 niveles
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: pillars/{status}/{id}/ 3 niveles
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: repositories/{type}/{repo-id}/notes/{note-id}/ dentro existente
[DONE]擺DONE][DONE]擺READY] Creaci贸n de Archivos:
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: repository.md en carpeta espec铆fica
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: task.md en carpeta espec铆fica
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: project.md en carpeta espec铆fica
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: pillar.md en carpeta espec铆fica
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: repositoryNote.md dentro del repositorio
[DONE]擺DONE][DONE]擺READY] Acceso a Metadata:
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Leer metadata de repositorio existente
[DONE]敂[DONE]擺READY] Persistencia:
    [DONE]敂[DONE]擺READY] Autom谩tica en todos los casos
```

---

### Puntos Cr铆ticos de Obsidian

**PC-O1: Creaci贸n de Carpetas Recursiva**
- Ubicaci贸n: Paso 14 de cada UC
- Riesgo: Si carpeta padre no existe, createFolder() falla
- Mitigaci贸n: Crear carpetas recursivamente (carpeta subcarpeta id)

**PC-O2: Permisos de Lectura/Escritura**
- Ubicaci贸n: Paso 14 de cada UC
- Riesgo: Permisos insuficientes Excepci贸n E-007 o E-008
- Mitigaci贸n: Validar permisos antes de intentar crear

**PC-O3: Espacio en Disco**
- Ubicaci贸n: Paso 14 de cada UC
- Riesgo: Espacio insuficiente Excepci贸n E-009 o E-012
- Mitigaci贸n: Manejo de error graceful

**PC-O4: Acceso a MetadataCache (UC-005)**
- Ubicaci贸n: UC-005 Paso 3 y 9
- Riesgo: Cache desactualizado o no disponible
- Mitigaci贸n: Acceso a app.metadataCache.getFileCache(path)

---

## ACTOR 4: M肹SPEC]DULOS UTILS/

### Rol
**Actor Secundario - Utilidades reutilizables**

### Participaci贸n en UCs
- UC-001: [DONE][DONE][SPEC] (6 m贸dulos)
- UC-002: [DONE][DONE][SPEC] (5 m贸dulos)
- UC-003: [DONE][DONE][SPEC] (6 m贸dulos)
- UC-004: [DONE][DONE][SPEC] (5 m贸dulos)
- UC-005: [DONE][DONE][SPEC] (5 m贸dulos)

**Participaci贸n: 5/5 (100%)**

---

### M贸dulos Utilizados por UC

#### UC-001: Crear Repositorio
| M贸dulo | Operaci贸n | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 5 |
| generateUniqueId() | OP-003 | 6 |
| getCurrentDateTime() | OP-005 | 7 |
| getFileName() | OP-006 | 8 |
| getGrandParentFolder() | OP-008 | 9 |
| showNotification() | OP-015 | 15 |

**M贸dulos: 6**

---

#### UC-002: Crear Tarea
| M贸dulo | Operaci贸n | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 7 |
| generateUniqueId() | OP-003 | 8 |
| getCurrentDateTime() | OP-005 | 9 |
| getFileName() | OP-006 | 10 |
| getAuthorName() | OP-007 | 11 |
| showNotification() | OP-015 | 16 |

**M贸dulos: 6** (nota: getMetadataByFrontmatter impl铆cito)

---

#### UC-003: Crear Proyecto
| M贸dulo | Operaci贸n | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 6 |
| generateUniqueId() | OP-003 | 7 |
| getCurrentDateTime() | OP-005 | 8 |
| getFileName() | OP-006 | 9 |
| getAuthorName() | OP-007 | 10 |
| getGrandParentFolder() | OP-008 | 11 |
| showNotification() | OP-015 | 17 |

**M贸dulos: 7**

---

#### UC-004: Crear Pilar
| M贸dulo | Operaci贸n | Paso UC |
|---|---|---|
| validateCommonInput() | OP-002 | 5 |
| generateUniqueId() | OP-003 | 6 |
| getCurrentDateTime() | OP-005 | 7 |
| getFileName() | OP-006 | 8 |
| getGrandParentFolder() | OP-008 | 9 |
| showNotification() | OP-015 | 15 |

**M贸dulos: 6**

---

#### UC-005: Crear Nota en Repositorio
| M贸dulo | Operaci贸n | Paso UC |
|---|---|---|
| getMetadataByFrontmatter() | OP-007 | 3, 9 |
| validateCommonInput() | OP-002 | 6 |
| generateUniqueId() | OP-003 | 7 |
| getCurrentDateTime() | OP-005 | 8 |
| getFileName() | OP-006 | 10 |
| getAuthorName() | OP-007 | 12 |
| showNotification() | OP-015 | 16 |

**M贸dulos: 7** (getMetadataByFrontmatter usado 2 veces)

---

### Matriz: Utils Reutilizaci贸n

```
M肹SPEC]DULOS UTILS/ - Actor Utilidades
[DONE]擺DONE][DONE]擺READY] validateCommonInput()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Paso 5 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Paso 7 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 6 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 5 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 6 [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 5/5 (100%)
[DONE]攤
[DONE]擺DONE][DONE]擺READY] generateUniqueId()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Paso 6 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Paso 8 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 7 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 6 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 7 [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 5/5 (100%)
[DONE]攤
[DONE]擺DONE][DONE]擺READY] getCurrentDateTime()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Paso 7 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Paso 9 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 8 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 7 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 8 [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 5/5 (100%)
[DONE]攤
[DONE]擺DONE][DONE]擺READY] getFileName()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Paso 8 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Paso 10 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 9 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 8 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 10 [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 5/5 (100%)
[DONE]攤
[DONE]擺DONE][DONE]擺READY] getMetadataByFrontmatter()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: No
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Impl铆cito
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Impl铆cito
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: No
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 3, 9 (2 veces) [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 1/5 (UC-005 espec铆ficamente)
[DONE]攤
[DONE]擺DONE][DONE]擺READY] getGrandParentFolder()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Paso 9 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: No
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 11 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 9 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: No
[DONE]攤   REUTILIZADO: 3/5
[DONE]攤
[DONE]擺DONE][DONE]擺READY] getAuthorName()
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-001: Impl铆cito
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-002: Paso 11 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-003: Paso 10 [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] UC-004: Paso 10 [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] UC-005: Paso 12 [DONE][DONE][SPEC]
[DONE]攤   REUTILIZADO: 4/5
[DONE]攤
[DONE]敂[DONE]擺READY] showNotification()
    [DONE]擺DONE][DONE]擺READY] UC-001: Paso 15 [DONE][DONE][SPEC]
    [DONE]擺DONE][DONE]擺READY] UC-002: Paso 16 [DONE][DONE][SPEC]
    [DONE]擺DONE][DONE]擺READY] UC-003: Paso 17 [DONE][DONE][SPEC]
    [DONE]擺DONE][DONE]擺READY] UC-004: Paso 15 [DONE][DONE][SPEC]
    [DONE]敂[DONE]擺READY] UC-005: Paso 16 [DONE][DONE][SPEC]
    REUTILIZADO: 5/5 (100%)
```

---

### Puntos Cr铆ticos de Utils

**PC-U1: Unicidad de IDs**
- M贸dulo: generateUniqueId()
- Riesgo: Colisi贸n de IDs archivos se sobrescriben
- Mitigaci贸n: Web Crypto API + timestamp combinados

**PC-U2: Validaci贸n de Entrada**
- M贸dulo: validateCommonInput()
- Riesgo: Validaci贸n insuficiente datos corrupta en archivo
- Mitigaci贸n: Regex expl铆cito `/^[a-zA-Z0-9\-_\s]+$/`

**PC-U3: Integridad de Metadata**
- M贸dulo: getMetadataByFrontmatter()
- Riesgo: Frontmatter inv谩lido error (UC-005)
- Mitigaci贸n: Validar que YAML parse correctamente

---

## ACTOR 5: TEMPLATE ENGINE

### Rol
**Actor Consumidor - Generador de contenido**

### Participaci贸n en UCs
- UC-001: [DONE][DONE][SPEC] (repository.md)
- UC-002: [DONE][DONE][SPEC] (task.md)
- UC-003: [DONE][DONE][SPEC] (project.md)
- UC-004: [DONE][DONE][SPEC] (pillar.md)
- UC-005: [DONE][DONE][SPEC] (repositoryNote.md)

**Participaci贸n: 5/5 (100%)**

---

### Templates por UC

#### UC-001: repository.md
- **Variables**: 8 (repositoryId, repositoryName, repositoryType, createdDate, authorName, etc.)
- **Placeholders**: {{VALUE:repositoryId}}, {{VALUE:repositoryName}}, etc.
- **Secciones**: Descripci贸n, Estructura, Informaci贸n, Contenido, Notas
- **Frontmatter**: YAML con id, name, type, created, author, tags, status

---

#### UC-002: task.md
- **Variables**: 9 (taskId, taskTitle, taskPriority, taskDueDate, etc.)
- **Placeholders**: {{VALUE:taskId}}, {{VALUE:taskTitle}}, etc.
- **Secciones**: Descripci贸n, Detalles, Checklist, Subtareas, Recursos, Timeline
- **Frontmatter**: YAML con id, title, priority, status: pending, created, dueDate, author, tags

---

#### UC-003: project.md
- **Variables**: 8 (projectId, projectName, projectStatus, projectDescription, etc.)
- **Placeholders**: {{VALUE:projectId}}, {{VALUE:projectName}}, etc.
- **Secciones**: Descripci贸n, Tareas (Fase 1-4), Hitos, Equipo, Recursos, M茅tricas
- **Frontmatter**: YAML con id, name, status, created, author, tags

---

#### UC-004: pillar.md
- **Variables**: 7 (pillarId, pillarName, pillarStatus, createdDate, authorName, etc.)
- **Placeholders**: {{VALUE:pillarId}}, {{VALUE:pillarName}}, etc.
- **Secciones**: Descripci贸n, Conceptos, Principios, Notas, Recursos, Mapeo
- **Frontmatter**: YAML con id, name, status, created, author, tags, relatedPillars

---

#### UC-005: repositoryNote.md
- **Variables**: 8 (noteId, noteTitle, repositoryContext.id/name/type/path, etc.)
- **Placeholders**: {{VALUE:noteId}}, {{VALUE:repositoryContext.name}}, etc.
- **Secciones**: Descripci贸n, Contenido Principal, An谩lisis, Conclusiones, Recomendaciones
- **Frontmatter**: YAML con id, title, created, author, repositoryId, repositoryName, tags
- **Referencia Cruzada**: [[{{VALUE:repositoryContext.name}}]] (wikilink)

---

### Matriz: Templates Completitud

```
TEMPLATE ENGINE - Actor Consumidor
[DONE]擺DONE][DONE]擺READY] repository.md
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Frontmatter: 8 campos [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Secciones: 5 principales [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Placeholders: 8 variables [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] Wikilinks: S铆
[DONE]攤
[DONE]擺DONE][DONE]擺READY] task.md
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Frontmatter: 8 campos + status:pending [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Secciones: 6 principales [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Placeholders: 9 variables [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] Wikilinks: S铆
[DONE]攤
[DONE]擺DONE][DONE]擺READY] project.md
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Frontmatter: 8 campos [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Secciones: 7 principales (4 fases) [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Placeholders: 8 variables [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] Wikilinks: S铆
[DONE]攤
[DONE]擺DONE][DONE]擺READY] pillar.md
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Frontmatter: 8 campos [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Secciones: 7 principales [DONE][DONE][SPEC]
[DONE]攤   [DONE]擺DONE][DONE]擺READY] Placeholders: 7 variables [DONE][DONE][SPEC]
[DONE]攤   [DONE]敂[DONE]擺READY] Wikilinks: S铆
[DONE]攤
[DONE]敂[DONE]擺READY] repositoryNote.md
    [DONE]擺DONE][DONE]擺READY] Frontmatter: 9 campos [DONE][DONE][SPEC]
    [DONE]擺DONE][DONE]擺READY] Secciones: 8 principales [DONE][DONE][SPEC]
    [DONE]擺DONE][DONE]擺READY] Placeholders: 8 variables + contexto repo [DONE][DONE][SPEC]
    [DONE]敂[DONE]擺READY] Wikilinks: S铆 (referencia a repositorio padre)
```

---

### Puntos Cr铆ticos de Template

**PC-T1: Reemplazo Completo de Placeholders**
- Ubicaci贸n: Todos los templates
- Riesgo: Placeholder no reemplazado {{VALUE:variableName}} literal en archivo
- Mitigaci贸n: Validar que cada placeholder tiene variable correspondiente

**PC-T2: Formato de Frontmatter YAML**
- Ubicaci贸n: Todos los templates
- Riesgo: YAML inv谩lido frontmatter parse error
- Mitigaci贸n: Validar sintaxis YAML en template

**PC-T3: Wikilinks en UC-005**
- Ubicaci贸n: repositoryNote.md
- Riesgo: [[repositoryName]] podr铆a tener caracteres inv谩lidos
- Mitigaci贸n: Usar repositoryContext.name ya validado

---

## MATRIZ COMPLETA: ACTORES 肹ARCH] UCS

```
[DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敩[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敩[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敩[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敩[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敩[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼
[DONE]攤 ACTOR          [DONE]攤 UC-001  [DONE]攤 UC-002  [DONE]攤 UC-003  [DONE]攤 UC-004  [DONE]攤 UC-005  [DONE]攤
[DONE]擺DONE][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敜
[DONE]攤 Usuario        [DONE]攤 [DONE][DONE][SPEC] (3)   [DONE]攤 [DONE][DONE][SPEC] (4)   [DONE]攤 [DONE][DONE][SPEC] (3)   [DONE]攤 [DONE][DONE][SPEC] (2)   [DONE]攤 [DONE][DONE][SPEC] (3)   [DONE]攤
[DONE]攤 QuickAdd       [DONE]攤 [DONE][DONE][SPEC] (5)   [DONE]攤 [DONE][DONE][SPEC] (4)   [DONE]攤 [DONE][DONE][SPEC] (4)   [DONE]攤 [DONE][DONE][SPEC] (3)   [DONE]攤 [DONE][DONE][SPEC] (4)   [DONE]攤
[DONE]攤 Obsidian       [DONE]攤 [DONE][DONE][SPEC] (3)   [DONE]攤 [DONE][DONE][SPEC] (2)   [DONE]攤 [DONE][DONE][SPEC] (2)   [DONE]攤 [DONE][DONE][SPEC] (2)   [DONE]攤 [DONE][DONE][SPEC] (2)   [DONE]攤
[DONE]攤 Utils/         [DONE]攤 [DONE][DONE][SPEC] (6)   [DONE]攤 [DONE][DONE][SPEC] (6)   [DONE]攤 [DONE][DONE][SPEC] (7)   [DONE]攤 [DONE][DONE][SPEC] (6)   [DONE]攤 [DONE][DONE][SPEC] (7)   [DONE]攤
[DONE]攤 Template       [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤
[DONE]攤 MetadataCache  [DONE]攤 -       [DONE]攤 -       [DONE]攤 -       [DONE]攤 -       [DONE]攤 [DONE][DONE][SPEC] (1)   [DONE]攤
[DONE]擺DONE][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敿[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敜
[DONE]攤 TOTAL          [DONE]攤 5       [DONE]攤 5       [DONE]攤 5       [DONE]攤 5       [DONE]攤 6       [DONE]攤
[DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇

N煤meros: cantidad de pasos/operaciones por actor en cada UC
Checkmarks: participaci贸n ([DONE][DONE][SPEC] = participa)
```

---

## FLUJO DE DATOS ENTRE ACTORES (Ejemplo: UC-001)

```
Usuario
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Invoca macro (Paso 1)
  [DONE]攤   
  QuickAdd
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Carga createRepository.js (Paso 2)
  [DONE]攤   
  [DONE]攤 [Usuario ingresa nombre] (Paso 3)
  [DONE]攤   
  [DONE]攤 [Usuario selecciona tipo] (Paso 4)
  [DONE]攤   
  Utils/
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] validateCommonInput() (Paso 5: OP-002)
  [DONE]攤    [V谩lido]
  [DONE]攤 generateUniqueId() (Paso 6: OP-003)
  [DONE]攤   
  [DONE]攤 getCurrentDateTime() (Paso 7: OP-005)
  [DONE]攤   
  [DONE]攤 getFileName() (Paso 8: OP-006)
  [DONE]攤   
  [DONE]攤 getGrandParentFolder() (Paso 9: OP-008)
  [DONE]攤   
  QuickAdd (retorna control)
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Asigna variables (Paso 12: OP-012)
  [DONE]攤   
  Template
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Reemplaza {{VALUE:...}} (Paso 13: OP-013)
  [DONE]攤   
  QuickAdd (retorna control)
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Llama app.vault.create() (Paso 14: OP-014)
  [DONE]攤   
  Obsidian
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] createFolder() (Paso 14: recursivo)
  [DONE]攤    [Carpetas creadas]
  [DONE]攤 create() (Paso 14: crea archivo)
  [DONE]攤   
  File System (persistencia)
  [DONE]攤   
  QuickAdd (retorna control)
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] showNotification() (Paso 15: OP-015)
  [DONE]攤   
  Utils/
  [DONE]攤
  [DONE]擺DONE][DONE]擺READY] Muestra notificaci贸n verde
  [DONE]攤   
  Usuario
  [DONE]攤
  [DONE]敂[DONE]擺READY] Ve "Repositorio creado exitosamente"
```

---

## RESUMEN: ACTORES Y RESPONSABILIDADES

| Actor | Participaci贸n | Responsabilidades Clave | Puntos Cr铆ticos |
|-------|---|---|---|
| **Usuario** | 5/5 | Invocar, proporcionar datos | Validaci贸n entrada |
| **QuickAdd** | 5/5 | Orquestar, ejecutar template | Reemplazo variables |
| **Obsidian** | 5/5 | Crear estructura, persistir | Permisos, espacio |
| **Utils/** | 5/5 | Validar, generar, formatear | Unicidad IDs |
| **Template** | 5/5 | Generar contenido markdown | Completitud placeholders |
| **MetadataCache** | 1/5 | Leer metadata (UC-005 solo) | Integridad YAML |

---

**DOCUMENTO**: PASO3-ACTORES-MATRIZ.md
**VERSI肹SPEC]N**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: MATRIZ COMPLETADA - ACTORES DOCUMENTADOS
