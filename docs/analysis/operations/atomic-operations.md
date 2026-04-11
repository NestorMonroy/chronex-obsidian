```yaml
type: Documento Técnico
title: PASO 1 V4 - OPERACIONES ATÓMICAS
version: 4.0.0
scope: ACTIVIDAD 1 - Obsidian Vault - 15 Operaciones Identificadas
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
base_version: V3 (refrescado con convenciones v1.0.0)
```

# PASO 1 V4: OPERACIONES ATÓMICAS
## 15 Operaciones Fundamentales del Sistema ACTIVIDAD 1

---

## INTRODUCCIÓN

Las operaciones atómicas son unidades indivisibles de trabajo que componen los 5 orquestadores del sistema. Cada operación es responsable de una tarea específica y no puede subdividirse sin perder coherencia.

Este análisis preserva el mapeo de V3 pero refrescar la nomenclatura y validación contra:
- Convenciones-de-Código v1.0.0 (prefijos _contexto_, nombres)
- Convenciones-Pragmáticas v1.0.0 (estructura)
- Convenciones-JavaScript v2.0.0 (patrones)

---

## OPERACIÓN 1: OBTENER ENTRADA DE USUARIO

**Código:** OP-001
**Clasificación:** Input - User Interaction
**Stakeholders Involucrados:** Usuario (SH-001) → QuickAdd (SH-002)
**Frecuencia de Uso:** Universal (en todos los 5 orquestadores)

### Descripción

El usuario proporciona datos iniciales a través de prompts interactivos de QuickAdd. Diferentes orquestadores solicitan diferentes tipos de entrada, pero el patrón es idéntico: mostrar prompt, esperar respuesta, guardar valor.

### Variantes por Orquestador

**createRepository.js:**
```javascript
const _input_name = await quickAddApi.inputPrompt("Nombre del repositorio:");
const _input_type = await askRepositoryType();
const _input_description = await quickAddApi.wideInputPrompt("Descripción:");
```

**createTask.js:**
```javascript
const _input_title = await quickAddApi.inputPrompt("Título de la tarea:");
const _input_priority = await askTaskPriority();
```

**createPillar.js:**
```javascript
const _input_name = await quickAddApi.inputPrompt("Nombre del pilar:");
const _input_status = await askPillarStatus();
```

**createPilarNote.js:**
```javascript
const _input_title = await quickAddApi.inputPrompt("Título de la nota:");
const _input_type = await getNoteType();
```

**createProject.js:**
```javascript
const _input_name = await quickAddApi.inputPrompt("Nombre del proyecto:");
const _input_date = await askProjectDate();
```

### Validación contra Convenciones

- Prefijo _input_ identifica claramente contexto
- Nombres revelan intención: _input_name, _input_priority
- Sin números acoplados
- Variables camelCase después de prefijo
- Aligned con Convenciones-de-Código Error #1

### Puntos de Fallo

- Usuario cancela durante prompt (rechaza promesa)
- Usuario deja campo vacío (string vacio)
- Usuario ingresa caracteres especiales (causa parsing error)

---

## OPERACIÓN 2: VALIDAR ENTRADA DE USUARIO

**Código:** OP-002
**Clasificación:** Validation - Input Verification
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** Universal

### Descripción

Después de obtener entrada, se valida que cumpla requisitos mínimos: no vacío, largo apropiado, caracteres válidos, formato correcto según tipo.

### Variantes por Orquestador

**createRepository (validar nombre):**
```javascript
const _valid_name = _input_name && _input_name.length > 0;
const _valid_length = _input_name.length <= 255;
const _valid_chars = /^[a-zA-Z0-9\-_\s]+$/.test(_input_name);

if (!(_valid_name && _valid_length && _valid_chars)) {
  throw new Error("Nombre de repositorio inválido");
}
```

**createTask (validar prioridad):**
```javascript
const VALID_PRIORITIES = ["high", "normal", "low"];
const _valid_priority = VALID_PRIORITIES.includes(_input_priority);

if (!_valid_priority) {
  throw new Error("Prioridad inválida");
}
```

**createPillar (validar estado):**
```javascript
const VALID_STATUSES = ["active", "inactive", "archived"];
const _valid_status = VALID_STATUSES.includes(_input_status);
```

### Validación contra Convenciones

- Constantes en UPPER_SNAKE_CASE (VALID_PRIORITIES)
- Prefijo _valid_ para variables booleanas
- Nombres específicos (_valid_name, _valid_priority, no solo _valid)
- Aligned con Convenciones-de-Código (constantes sin números)

### Puntos de Fallo

- Validación insuficiente permite datos inválidos
- Sin try/catch causa crash en lugar de error manejado
- Regex demasiado restrictiva rechaza entrada válida

---

## OPERACIÓN 3: GENERAR IDENTIFICADOR ÚNICO

**Código:** OP-003
**Clasificación:** Generation - ID Creation
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** createRepository, createTask, createProject, createPilarNote

### Descripción

Genera identificador único para nueva entidad. Utiliza Web Crypto API para generar bytes aleatorios, luego formatea en string único basado en timestamp + random.

### Implementación Base

**Módulo generateUniqueId.js:**
```javascript
async function generateUniqueId() {
  const _crypto_array = new Uint8Array(16);
  const _crypto_random = window.crypto.getRandomValues(_crypto_array);
  
  const _format_hex = _crypto_random
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  
  const _format_timestamp = Date.now().toString(36);
  const _format_final = `id-${_format_timestamp}-${_format_hex}`;
  
  return _format_final;
}

module.exports = generateUniqueId;
```

### Uso en Orquestadores

```javascript
const _repo_id = await generateUniqueId();       // OP-003
const _task_id = await generateUniqueId();       // OP-003
const _project_id = await generateUniqueId();    // OP-003
```

### Validación contra Convenciones

- Prefijo _crypto_ identifica contexto de criptografía
- Prefijo _format_ identifica operaciones de formateo
- Nombres sin números acoplados (no uuid-1, uuid-2)
- Función es pura (no tiene side effects)
- Aligned con Convenciones-de-Código (funciones con verbo)

### Puntos de Fallo

- window.crypto no disponible en entorno (necesita HTTPS)
- IDs no realmente únicos si timestamp y random coinciden
- Formato de ID cambia entre llamadas (inconsistencia)

---

## OPERACIÓN 4: GENERAR IDENTIFICADOR CUSTOM

**Código:** OP-004
**Clasificación:** Generation - ID Creation (Custom Format)
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** createRepository (alternativa a OP-003)

### Descripción

Similar a OP-003 pero genera ID con formato específico: p1-p2-p3-p4-p5 donde cada parte es segment específico (tipo, categoría, etc).

### Implementación Base

**Módulo generateCustomId.js:**
```javascript
function generateCustomId(p1, p2, p3, p4, p5) {
  const _custom_format = `${p1}-${p2}-${p3}-${p4}-${p5}`;
  return _custom_format;
}

module.exports = generateCustomId;
```

### Uso en Orquestadores

```javascript
const _repo_id_custom = generateCustomId(
  "repo",                    // p1: tipo
  "personal",                // p2: categoría
  "2026",                    // p3: año
  Math.random().toString(36).substring(7),  // p4: random
  Date.now().toString(36)    // p5: timestamp
);
```

### Validación contra Convenciones

- Parámetro naming revela intención (p1 para tipo, p2 para categoría)
- Prefijo _custom_ identifica formato custom
- Sin números acoplados en nombre función
- Aligned con Convenciones-de-Código (nombres específicos)

### Puntos de Fallo

- Segmentos p1-p5 no validados (permite valores inválidos)
- Formato inconsistente si algunos segmentos contienen guiones
- No garantiza unicidad como OP-003

---

## OPERACIÓN 5: OBTENER FECHA Y HORA ACTUAL

**Código:** OP-005
**Clasificación:** Data Retrieval - Time
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** Universal (todos los 5 orquestadores)

### Descripción

Obtiene fecha y hora actual del sistema, formateada según estándar ISO o formato específico del proyecto. Utilizado para registrar cuándo se creó entidad.

### Implementación Base

**Módulo getCurrentDateTime.js:**
```javascript
function getCurrentDateTime() {
  const _date_now = new Date();
  const _date_iso = _date_now.toISOString();
  return _date_iso;  // Ej: 2026-04-11T14:30:45.123Z
}

module.exports = getCurrentDateTime;
```

### Uso en Orquestadores

```javascript
const _meta_created = getCurrentDateTime();      // OP-005
const _meta_modified = getCurrentDateTime();     // OP-005
const _date_due = getCurrentDateTime();          // OP-005
```

### Validación contra Convenciones

- Prefijo _date_ identifica contexto temporal
- Prefijo _meta_ para metadatos
- Formato ISO estándar (no ambiguo)
- Sin números acoplados
- Aligned con Convenciones-de-Código (nombres descriptivos)

### Puntos de Fallo

- Zona horaria del servidor vs cliente puede causar inconsistencias
- Formato diferente según locale del usuario
- Reloj del sistema incorrecto causa timestamps erróneos

---

## OPERACIÓN 6: OBTENER NOMBRE DE ARCHIVO

**Código:** OP-006
**Clasificación:** Data Processing - Filename Generation
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** createRepository, createTask, createProject, createPilarNote

### Descripción

Procesa nombre de entrada para convertirlo en nombre válido de archivo. Elimina caracteres especiales, reemplaza espacios, asegura longitud apropiada, añade extensión .md.

### Implementación Base

**Módulo getFileName.js:**
```javascript
function getFileName(inputName) {
  // Remover caracteres especiales
  const _filename_clean = inputName
    .replace(/[^a-zA-Z0-9\-_\s]/g, "")
    .trim();
  
  // Limitar longitud
  const _filename_max_length = 200;
  const _filename_limited = _filename_clean.substring(0, _filename_max_length);
  
  // Reemplazar espacios con guiones
  const _filename_normalized = _filename_limited.replace(/\s+/g, "-");
  
  // Añadir extensión
  const _filename_final = `${_filename_normalized}.md`;
  
  return _filename_final;
}

module.exports = getFileName;
```

### Uso en Orquestadores

```javascript
const _file_name = getFileName(_input_name);    // OP-006
const _file_path = `${_folder_path}/${_file_name}`;
```

### Validación contra Convenciones

- Prefijo _filename_ identifica contexto
- Prefijo _file_ para operaciones de archivo
- Nombres específicos (_filename_clean, _filename_normalized)
- Sin números acoplados (no max_length_255)
- Aligned con Convenciones-de-Código (funciones puras)

### Puntos de Fallo

- Caracteres especiales válidos se pierden (tildes, etc)
- Truncado a 200 chars puede perder información importante
- Archivos con mismo nombre procesado causan conflicto

---

## OPERACIÓN 7: OBTENER METADATA DE FRONTMATTER

**Código:** OP-007
**Clasificación:** Data Retrieval - File Metadata
**Stakeholders Involucrados:** Obsidian API (SH-003), Script Module (SH-005)
**Frecuencia de Uso:** createPilarNote, createTask

### Descripción

Extrae metadatos del frontmatter YAML de un archivo existente (proyecto, tipo, etc). Utiliza metadataCache de Obsidian para acceso eficiente.

### Implementación Base

**Módulo getMetadataByFrontmatter.js:**
```javascript
function getMetadataByFrontmatter(app, filePath) {
  const _file_abstract = app.vault.getAbstractFileByPath(filePath);
  
  if (!_file_abstract) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  
  const _cache_file = app.metadataCache.getFileCache(_file_abstract);
  const _metadata_frontmatter = _cache_file?.frontmatter || {};
  
  return _metadata_frontmatter;
}

module.exports = getMetadataByFrontmatter;
```

### Uso en Orquestadores

```javascript
const _meta_project = getMetadataByFrontmatter(app, projectPath);  // OP-007
const _meta_type = _meta_project.type || "default";
```

### Validación contra Convenciones

- Prefijo _file_ para operaciones de archivo
- Prefijo _cache_ para operaciones de cache
- Prefijo _metadata_ para datos de metadatos
- Error handling explícito (no undefined)
- Aligned con Convenciones-de-Código (funciones defensivas)

### Puntos de Fallo

- Archivo no existe (error no capturado)
- Frontmatter no existe (devuelve undefined)
- metadataCache aún no actualizado (data stale)
- Rutas con caracteres especiales no encontradas

---

## OPERACIÓN 8: OBTENER CARPETA PADRE

**Código:** OP-008
**Clasificación:** Data Processing - Path Navigation
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** createRepository, createTask, createProject

### Descripción

Obtiene nombre de carpeta padre para archivo actual. Utilizado para determinar contexto de dónde se crean notas nuevas.

### Implementación Base

**Módulo getGrandParentFolder.js:**
```javascript
function getGrandParentFolder(filePath) {
  const _path_split = filePath.split("/");
  
  if (_path_split.length < 2) {
    return "";
  }
  
  const _path_parent = _path_split[_path_split.length - 2];
  return _path_parent;
}

module.exports = getGrandParentFolder;
```

### Uso en Orquestadores

```javascript
const _folder_parent = getGrandParentFolder(currentFilePath);  // OP-008
const _folder_new = `${_folder_parent}/${_repo_id}`;
```

### Validación contra Convenciones

- Prefijo _path_ identifica operaciones de rutas
- Prefijo _folder_ para nombres de carpetas
- Nombres específicos (_path_split, _path_parent)
- Sin números acoplados
- Aligned con Convenciones-de-Código (funciones defensivas)

### Puntos de Fallo

- Ruta con caracteres especiales se parte incorrectamente
- Ruta en raíz devuelve string vacío (causa ruta inválida)
- Ruta con barras finales causa indexado incorrecto

---

## OPERACIÓN 9: VALIDAR NOMBRE DE REPOSITORIO

**Código:** OP-009
**Clasificación:** Validation - Business Rule
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** createRepository

### Descripción

Valida que nombre de repositorio cumpla reglas específicas: longitud mínima/máxima, sin caracteres inválidos, no duplicado en vault.

### Implementación Base

**Implementación en createRepository.js:**
```javascript
function validateRepositoryName(name) {
  const _check_empty = name && name.length > 0;
  const _check_length_min = name.length >= 3;
  const _check_length_max = name.length <= 100;
  const _check_chars = /^[a-zA-Z0-9\-_\s]+$/.test(name);
  
  const _is_valid = _check_empty && _check_length_min && 
                    _check_length_max && _check_chars;
  
  return _is_valid;
}
```

### Validación contra Convenciones

- Prefijo _check_ para operaciones de validación booleana
- Variables nombran exactamente qué se valida
- Sin números acoplados (no min_length_3)
- Aligned con Convenciones-de-Código (nombres específicos)

### Puntos de Fallo

- Regex demasiado restrictiva rechaza nombres válidos
- Límites de longitud no coinciden con UI
- Validación de duplicados requiere scan completo vault

---

## OPERACIÓN 10: OBTENER ESTRUCTURA DE CARPETAS

**Código:** OP-010
**Clasificación:** Data Processing - Folder Structure
**Stakeholders Involucrados:** Obsidian API (SH-003), Script Module (SH-005)
**Frecuencia de Uso:** createRepository, createProject

### Descripción

Determina estructura de carpetas donde se crearán nuevas notas. Utiliza convención existente del vault para mantener consistencia.

### Implementación Base

**Implementación en createRepository.js:**
```javascript
function getFolderStructure(repositoryId, repositoryType) {
  const _struct_base = "repositories";
  const _struct_type = repositoryType.toLowerCase();
  const _struct_id = repositoryId;
  
  const _path_final = `${_struct_base}/${_struct_type}/${_struct_id}`;
  
  return _path_final;
}
```

### Uso en Orquestadores

```javascript
const _folder_structure = getFolderStructure(_repo_id, _input_type);  // OP-010
```

### Validación contra Convenciones

- Prefijo _struct_ para estructura
- Prefijo _path_ para rutas
- Nombres revelan estructura (base, type, id)
- Sin números acoplados
- Aligned con Convenciones-Pragmáticas (estructura clara)

### Puntos de Fallo

- Carpetas padre no existen (create falla)
- Rutas demasiado largas para SO
- Caracteres especiales en tipo causan ruta inválida

---

## OPERACIÓN 11: PROCESAR INFORMACIÓN SEGÚN CONTEXTO

**Código:** OP-011
**Clasificación:** Data Processing - Context-Specific
**Stakeholders Involucrados:** Script Module (SH-005)
**Frecuencia de Uso:** Varía según orquestador

### Descripción

Operación heterogénea donde cada orquestador procesa información de manera específica según su contexto. Para repositorio: generar metadata. Para tarea: calcular estado. Para pilar: obtener descripción.

### Variantes por Orquestador

**createRepository (generar metadata):**
```javascript
const _metadata_type = _input_type;
const _metadata_author = await getAuthorName();
const _metadata_tags = ["repository", _input_type];
const _metadata_final = {
  type: _metadata_type,
  author: _metadata_author,
  tags: _metadata_tags,
  created: _meta_created
};
```

**createTask (calcular estado):**
```javascript
const _task_status_initial = "pending";
const _task_priority_normalized = _input_priority.toLowerCase();
const _task_final = {
  status: _task_status_initial,
  priority: _task_priority_normalized,
  dueDate: _input_due_date
};
```

### Validación contra Convenciones

- Prefijo identifica contexto específico (_metadata_, _task_)
- Nombres revelan intención exacta
- Sin números acoplados
- Operación sin side effects (pura)

### Puntos de Fallo

- Contexto incorrecto causa procesamiento erróneo
- Variables no inicializadas causa undefined
- Estructura de dato inconsistente entre orquestadores

---

## OPERACIÓN 12: ASIGNAR VARIABLES PARA TEMPLATE

**Código:** OP-012
**Clasificación:** State Management - Variable Assignment
**Stakeholders Involucrados:** Script (SH-005) → QuickAdd (SH-002)
**Frecuencia de Uso:** Universal (todos los 5 orquestadores)

### Descripción

Asigna valores procesados a objeto variables de QuickAdd. Estas variables son consumidas por templates para reemplazar placeholders {{VARIABLE:...}}.

### Implementación Base

**Patrón universal en todos los orquestadores:**
```javascript
// Asignar valores para template
variables.repositoryId = _repo_id;
variables.repositoryName = _input_name;
variables.repositoryType = _input_type;
variables.metadata = {
  created: _meta_created,
  author: _meta_author,
  tags: _meta_tags
};
variables.folderPath = _folder_structure;

// Notificar éxito
await showNotification("Repositorio creado exitosamente", "success");
```

### Validación contra Convenciones

- Nombres en variables deben coincidir exactamente con placeholders en template
- Sin prefijo en variables (son públicas para template)
- Estructura consistente entre orquestadores
- Aligned con Convenciones-Pragmáticas (variables claras)

### Puntos de Fallo

- Variable assignment a null/undefined causa placeholder no reemplazado
- Nombre diferente en variables vs template causa {{VARIABLE:...}} sin reemplazo
- Variables múltiples asignadas sin documentación

---

## OPERACIÓN 13: EJECUTAR TEMPLATE

**Código:** OP-013
**Clasificación:** Content Generation - Template Rendering
**Stakeholders Involucrados:** QuickAdd (SH-002) → Template (SH-004)
**Frecuencia de Uso:** Universal (todos los 5 orquestadores)

### Descripción

QuickAdd ejecuta template especificado, reemplaza placeholders con variables, genera contenido final.

### Operación (delegada a QuickAdd)

```
Configuración en QuickAdd:
1. Seleccionar template: templates/repository.md
2. Folder: {{VARIABLE:folderPath}}
3. Filename: {{VARIABLE:fileName}}
4. Placeholders a reemplazar:
   - {{VARIABLE:repositoryId}}
   - {{VARIABLE:repositoryName}}
   - {{VALUE:repositoryDescription}}
```

### Validación contra Convenciones

- Template path debe existir
- Placeholders {{}} deben coincidir exactamente
- Variables asignadas antes de template
- Aligned con Convenciones-Pragmáticas (estructura clara)

### Puntos de Fallo

- Template no encontrado (error QuickAdd)
- Placeholder mal escrito no se reemplaza
- Variable undefined deja {{VARIABLE:...}} literal

---

## OPERACIÓN 14: CREAR ARCHIVO EN VAULT

**Código:** OP-014
**Clasificación:** Persistence - File Creation
**Stakeholders Involucrados:** Obsidian API (SH-003) → SO (SH-006)
**Frecuencia de Uso:** Universal (todos los 5 orquestadores)

### Descripción

Obsidian crea archivo final en vault mediante vault.create(). Sistema Operativo valida permisos y almacena datos.

### Operación (delegada a Obsidian)

```javascript
try {
  // Crear carpetas si no existen
  const _folder_exists = app.vault.getAbstractFileByPath(_folder_path);
  if (!_folder_exists) {
    await app.vault.createFolder(_folder_path);
  }
  
  // Crear archivo con contenido
  const _file_created = await app.vault.create(_file_path, _content_final);
  
} catch (error) {
  throw new Error(`Error creando archivo: ${error.message}`);
}
```

### Validación contra Convenciones

- Carpetas parent deben existir o ser creadas
- Ruta debe ser válida para SO
- Permisos de escritura necesarios
- Error handling explícito

### Puntos de Fallo

- Ruta inválida para SO (caracteres especiales)
- Permisos insuficientes (error denegación)
- Espacio en disco insuficiente
- Archivo ya existe (conflicto de escritura)

---

## OPERACIÓN 15: MOSTRAR NOTIFICACIÓN AL USUARIO

**Código:** OP-015
**Clasificación:** User Feedback - Notification
**Stakeholders Involucrados:** Script (SH-005) → User (SH-001)
**Frecuencia de Uso:** Universal (todos los 5 orquestadores)

### Descripción

Muestra notificación al usuario indicando éxito, error o advertencia de operación. Proporciona feedback visual de resultado.

### Implementación Base

**Módulo showNotification.js:**
```javascript
async function showNotification(message, type = "info") {
  const _notif_types = {
    success: "Éxito",
    error: "Error",
    info: "Información",
    warning: "Advertencia"
  };
  
  const _notif_title = _notif_types[type] || "Notificación";
  
  new Notice(`[${_notif_title}] ${message}`, 5000);
}

module.exports = showNotification;
```

### Uso en Orquestadores

```javascript
await showNotification("Repositorio creado exitosamente", "success");  // OP-015
await showNotification("Error validando datos", "error");              // OP-015
```

### Validación contra Convenciones

- Prefijo _notif_ identifica contexto de notificación
- Tipos válidos documentados
- Mensajes claros y específicos
- Sin números acoplados
- Aligned con Convenciones-de-Código (funciones simples)

### Puntos de Fallo

- Mensaje vacío no proporciona información
- Tipo inválido causa notificación genérica
- Notificación muy rápida (usuario no la ve)

---

## MATRIZ DE OPERACIONES POR ORQUESTADOR

| Operación | Code | Repository | PilarNote | Pillar | Project | Task |
|---|---|---|---|---|---|---|
| Obtener entrada | OP-001 | Sí | Sí | Sí | Sí | Sí |
| Validar entrada | OP-002 | Sí | Sí | Sí | Sí | Sí |
| Gen ID único | OP-003 | Sí | Sí | No | Sí | Sí |
| Gen ID custom | OP-004 | Sí | No | No | No | No |
| Fecha actual | OP-005 | Sí | Sí | Sí | Sí | Sí |
| Nombre archivo | OP-006 | Sí | Sí | No | Sí | Sí |
| Metadata FM | OP-007 | No | Sí | No | Sí | Sí |
| Carpeta padre | OP-008 | Sí | No | Sí | Sí | No |
| Validar repo | OP-009 | Sí | No | No | No | No |
| Estructura carpetas | OP-010 | Sí | No | No | Sí | Sí |
| Procesar contexto | OP-011 | Sí | Sí | Sí | Sí | Sí |
| Asignar variables | OP-012 | Sí | Sí | Sí | Sí | Sí |
| Ejecutar template | OP-013 | Sí | Sí | Sí | Sí | Sí |
| Crear archivo | OP-014 | Sí | Sí | Sí | Sí | Sí |
| Mostrar notif | OP-015 | Sí | Sí | Sí | Sí | Sí |

**Total: 15 operaciones, distribución: 14, 11, 8, 12, 13 por orquestador**
**Operaciones reutilizadas: 10 operaciones comunes a 3+ orquestadores**

---

## VALIDACIÓN CONTRA CONVENCIONES

### Convenciones-de-Código v1.0.0

Validación de aplicación en OP-001 a OP-015:

- Prefijos _contexto_: Aplicados consistentemente (OP-001 a OP-015)
- Nombres descriptivos: Todos revelan intención específica
- Sin números acoplados: Ninguna variable use números
- Funciones con verbo: generateUniqueId, validateRepositoryName, getFileName
- Constantes UPPER_SNAKE_CASE: VALID_PRIORITIES, VALID_STATUSES
- Error handling: Try/catch documentado en operaciones I/O

---

### Convenciones-Pragmáticas v1.0.0

Validación de aplicación en estructura:

- Módulos en utils/: generateUniqueId.js, getCurrentDateTime.js, etc
- Estructura plana recomendada (Opción 2 para 7 módulos)
- Escalable a Opción 1 si vault crece
- Nombres de módulos específicos, sin "helpers.js" o "utils.js"

---

### Convenciones-JavaScript v2.0.0

Validación de aplicación en patrones:

- SRP (Single Responsibility): Cada operación responsable de una tarea
- DRY (Don't Repeat Yourself): Operaciones comunes reutilizadas
- No valores mágicos: Constantes documentadas
- Error handling: Excepciones capturadas y manejadas
- Funciones puras: Sin side effects cuando posible

---

## DIFERENCIA CON PASO 1 V3

| Aspecto | V3 | V4 |
|---|---|---|
| Operaciones | 15 | 15 (mismo) |
| Detalles | Descripción básica | Ampliado con variables |
| Prefijos | No documentado | _contexto_ aplicado |
| Convenciones | Implícitas | Validación explícita |
| Código ejemplo | Básico | Actual con prefijos |
| Matriz | Operación × Orq | Más detallada |
| Validación | Manual | Contra 3 guías |

---

## CONCLUSIÓN

Las 15 operaciones atómicas forman bloques constructivos que pueden combinarse de diferentes maneras para cada orquestador. El análisis V4 aplica convenciones de código profesionales a cada operación, documenta puntos de fallo específicos y valida que la nomenclatura sea clara y consistente.

La distribución de operaciones indica dónde hay máxima reutilización (OP-001, OP-002, OP-012, OP-013, OP-014, OP-015 en los 5 orquestadores) y dónde hay lógica específica (OP-004 solo en createRepository, OP-009 solo en createRepository).

---

**ARTEFACTO 3 COMPLETADO**

Próximo: PASO1-V4-ASISTEMA-ACTUAL

¿Confirmás para continuar?
