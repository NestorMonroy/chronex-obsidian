```yaml
type: Documento Técnico
title: PASO 1 V4 - ROADMAP DE REFACTORIZACIÓN
version: 4.0.0
scope: ACTIVIDAD 1 - Plan de acción para mejorar código
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
framework: Agile - Phased Refactoring
timeline: 10-12 semanas (50-60 horas)
```

# PASO 1 V4: ROADMAP DE REFACTORIZACIÓN
## Plan Priorizado de Mejora de Código con Timeline y Effort

---

## INTRODUCCIÓN

Este documento define un plan ejecutable para refactorizar el código AS-IS hacia el estado target. El plan está dividido en 5 fases, cada una con:

- Qué cambiar (operaciones específicas)
- Por qué cambiar (violación que soluciona)
- Cuándo (semana/fase)
- Cuánto esfuerzo (horas)
- Riesgo (bajo/medio/alto)
- Beneficio esperado

El objetivo es mejorar mantenibilidad sin cambiar funcionalidad.

---

## PRINCIPIOS DEL ROADMAP

1. **No romper funcionalidad existente** - Refactorización es segura
2. **Cambios incrementales** - Fase por fase, pequeños pasos
3. **Tests después de cambios** - Validar que todo sigue funcionando
4. **Reutilización máxima** - Extraer código común a módulos
5. **Documentación constante** - Actualizar mientras se refactoriza

---

## TIMELINE GENERAL

```
Semana 1-2:   FASE 1 - Convenciones de Código (7 horas)
Semana 3-4:   FASE 2 - Módulos Reutilizables (12 horas)
Semana 5-6:   FASE 3 - Refactorización SRP (18 horas)
Semana 7-8:   FASE 4 - Estructura Escalable (15 horas)
Semana 9-10:  FASE 5 - Testing y Documentación (8 horas)

TOTAL: 10 semanas, 60 horas (1.5 horas/día)
```

---

## FASE 1: CONVENCIONES DE CÓDIGO
**Duración: 1-2 semanas | Esfuerzo: 7 horas | Severidad: BAJA**

### Objetivo
Aplicar prefijos _contexto_ y estándares de naming a todo el código existente.

### Cambios Específicos

**Cambio 1.1: Prefijos en módulos utils/**

| Módulo | ANTES | DESPUÉS | Effort |
|---|---|---|---|
| generateUniqueId.js | array, random, hex | _crypto_array, _format_hex | 0.5h |
| generateCustomId.js | p1-p5, id | typeSegment-timestampSegment, _custom_id | 1h |
| getCurrentDateTime.js | (cumple) | - | 0h |
| getFileName.js | clean, truncated, normalized | _filename_clean, _filename_limited, _filename_normalized | 1h |
| showNotification.js | (parámetro type ignorado) | Usar type, validar, mostrar en título | 1.5h |
| getMetadataByFrontmatter.js | file, cache, metadata | _file_abstract, _cache_file, _metadata_frontmatter | 1h |
| getGrandParentFolder.js | path, parent | _path_split, _path_parent | 1h |

**Subtotal Cambio 1.1: 6 horas**

**Cambio 1.2: Constantes sin números acoplados**

| Ubicación | ANTES | DESPUÉS | Effort |
|---|---|---|---|
| getFileName.js | 200 (substring) | MAX_FILENAME_LENGTH = 200 | 0.5h |
| showNotification.js | 5000 (duration) | NOTIFICATION_DURATION_MS = 5000 | 0.5h |

**Subtotal Cambio 1.2: 1 hora**

### Checklist FASE 1

- [ ] generateUniqueId.js refactorizado con prefijos
- [ ] generateCustomId.js con parámetros descriptivos
- [ ] getFileName.js con _filename_ prefijo
- [ ] showNotification.js utiliza parámetro type
- [ ] showNotification.js valida tipos
- [ ] Constantes MAX_FILENAME_LENGTH y NOTIFICATION_DURATION_MS extraídas
- [ ] Módulos validados manualmente
- [ ] Imports en orquestadores aún funcionan

### Risk Assessment FASE 1

**Riesgo: BAJO**
- Cambios son cosméticos (naming, prefijos)
- No afectan funcionalidad
- Si algo falla, fácil de revertir

### Beneficio FASE 1

- Código más legible
- Variables tienen propósito claro
- Establece estándares para FASES 2-5
- Documentación constante

---

## FASE 2: MÓDULOS REUTILIZABLES
**Duración: 2 semanas | Esfuerzo: 12 horas | Severidad: MODERADA**

### Objetivo
Extraer operaciones comunes a módulos reutilizables, solucionar DRY.

### Operaciones a Extraer

**Operación 2.1: getCommonInput (OP-001 reutilizable)**

```javascript
// Nuevo archivo: utils/inputOperations.js
async function getCommonInput(quickAddApi, entityType) {
  const _input_label = `Nombre del ${entityType}:`;
  const _input_name = await quickAddApi.inputPrompt(_input_label);
  
  const _input_type = await askEntityType(entityType);
  
  const _input_desc_label = "Descripción (opcional):";
  const _input_description = await quickAddApi.wideInputPrompt(_input_desc_label);
  
  return {
    name: _input_name,
    type: _input_type,
    description: _input_description
  };
}

module.exports = { getCommonInput };
```

**Uso antes (duplicado):**
```javascript
// En createRepository.js
const _input_name = await quickAddApi.inputPrompt("Nombre del repositorio:");
const _input_type = await askRepositoryType();
const _input_description = await quickAddApi.wideInputPrompt("Descripción...");

// En createTask.js
const _input_name = await quickAddApi.inputPrompt("Nombre de la tarea:");
const _input_type = await askTaskType();
const _input_description = await quickAddApi.wideInputPrompt("Descripción...");

// [Repetido 5 veces]
```

**Uso después (reutilizado):**
```javascript
// En createRepository.js
const _input_data = await getCommonInput(quickAddApi, "repository");

// En createTask.js
const _input_data = await getCommonInput(quickAddApi, "task");

// [1 línea en lugar de 3, reutilizada]
```

**Effort: 2 horas**

---

**Operación 2.2: validateCommonInput (OP-002 reutilizable)**

```javascript
// Nuevo archivo: utils/validationOperations.js
function validateCommonInput(input) {
  const _check_name_exists = input.name && input.name.trim().length > 0;
  const _check_name_length_min = input.name.length >= 3;
  const _check_name_length_max = input.name.length <= 255;
  const _check_valid_chars = /^[a-zA-Z0-9\-_\s]+$/.test(input.name);
  
  const _is_valid = _check_name_exists && _check_name_length_min && 
                    _check_name_length_max && _check_valid_chars;
  
  if (!_is_valid) {
    throw new Error("Nombre inválido: mínimo 3, máximo 255 caracteres, sin caracteres especiales");
  }
  
  return true;
}

module.exports = { validateCommonInput };
```

**Effort: 1.5 horas**

---

**Operación 2.3: getCommonMetadata (OP-005, OP-007 reutilizable)**

```javascript
// Nuevo archivo: utils/metadataOperations.js
async function getCommonMetadata(app, entityType) {
  const _meta_created = getCurrentDateTime();
  
  const _meta_author = await getAuthorName();
  
  const _meta_tags = [entityType.toLowerCase(), "active"];
  
  return {
    created: _meta_created,
    author: _meta_author,
    tags: _meta_tags
  };
}

module.exports = { getCommonMetadata };
```

**Effort: 1.5 horas**

---

**Operación 2.4: assignCommonVariables (OP-012 reutilizable)**

```javascript
// Nuevo archivo: utils/variableOperations.js
function assignCommonVariables(variables, entity) {
  variables.entityId = entity.id;
  variables.entityName = entity.name;
  variables.entityType = entity.type;
  variables.folderPath = entity.folderPath;
  variables.fileName = entity.fileName;
  variables.metadata = entity.metadata;
  
  return variables;
}

module.exports = { assignCommonVariables };
```

**Effort: 1 hora**

---

**Operación 2.5: handleError (Error handling reutilizable)**

```javascript
// Nuevo archivo: utils/errorHandling.js
async function handleError(error, quickAddApi) {
  const _error_message = error.message || "Error desconocido";
  const _error_log = `[ERROR] ${new Date().toISOString()} - ${_error_message}`;
  
  console.error(_error_log);
  
  await showNotification(`Error: ${_error_message}`, "error");
  
  return { success: false, error: _error_message };
}

module.exports = { handleError };
```

**Effort: 1 hora**

---

**Operación 2.6: Crear estructura utils/ (Opción 2 - Plana)**

```
scripts/
├── createRepository.js
├── createTask.js
├── createProject.js
├── createPillar.js
├── createPilarNote.js
├── utils/
│   ├── generateUniqueId.js
│   ├── generateCustomId.js
│   ├── getCurrentDateTime.js
│   ├── getFileName.js
│   ├── getMetadataByFrontmatter.js
│   ├── showNotification.js
│   ├── inputOperations.js        [NUEVO]
│   ├── validationOperations.js   [NUEVO]
│   ├── metadataOperations.js     [NUEVO]
│   ├── variableOperations.js     [NUEVO]
│   └── errorHandling.js          [NUEVO]
└── README.md
```

**Effort: 1 hora (organización)**

---

### Checklist FASE 2

- [ ] inputOperations.js creado y probado
- [ ] validationOperations.js creado y probado
- [ ] metadataOperations.js creado y probado
- [ ] variableOperations.js creado y probado
- [ ] errorHandling.js creado y probado
- [ ] Estructura utils/ reorganizada (Opción 2 - plana)
- [ ] Imports en orquestadores actualizados
- [ ] Duplicación de código reducida (500 líneas → 100)
- [ ] Todos los orquestadores aún funcionan

### Risk Assessment FASE 2

**Riesgo: MEDIO**
- Se crea código nuevo
- Imports deben actualizarse
- Posible que algo no se actualice bien
- Mitigation: Tests manuales después de cada cambio

### Beneficio FASE 2

- Duplicación eliminada (DRY mejorado)
- Operaciones comunes centralizadas
- Más fácil cambiar validación en un lugar
- Base para FASE 3

---

## FASE 3: REFACTORIZACIÓN SRP
**Duración: 2 semanas | Esfuerzo: 18 horas | Severidad: SEVERA**

### Objetivo
Dividir cada orquestador en funciones con responsabilidad única.

### Patrón de Refactorización

**Ejemplo: createRepository.js (ANTES)**
```javascript
module.exports = async (params) => {
  // 100+ líneas con 8 responsabilidades
  const { app, quickAddApi, variables } = params;
  
  // 1. Obtener entrada
  const _input_name = await quickAddApi.inputPrompt("...");
  
  // 2. Validar entrada
  if (!_input_name) throw new Error("...");
  
  // 3. Generar ID
  const _repo_id = await generateUniqueId();
  
  // ... resto
};
```

**Ejemplo: createRepository.js (DESPUÉS)**
```javascript
// Función 1: Obtener entrada (SRP)
async function getRepositoryInput(quickAddApi) {
  return await getCommonInput(quickAddApi, "repository");
}

// Función 2: Validar entrada (SRP)
function validateRepositoryInput(input) {
  validateCommonInput(input);
  // Validaciones específicas de repositorio si es necesario
  return true;
}

// Función 3: Generar datos (SRP)
async function generateRepositoryData(input) {
  const _repo_id = await generateUniqueId();
  const _repo_type = input.type.toLowerCase();
  
  return { id: _repo_id, type: _repo_type };
}

// Función 4: Obtener metadata (SRP)
async function getRepositoryMetadata(app) {
  return await getCommonMetadata(app, "repository");
}

// Función 5: Construir estructura (SRP)
function buildRepositoryStructure(repositoryData, input, metadata) {
  const _file_name = getFileName(input.name);
  const _folder_structure = `repositories/${repositoryData.type}/${repositoryData.id}`;
  
  return {
    id: repositoryData.id,
    name: input.name,
    type: repositoryData.type,
    folderPath: _folder_structure,
    fileName: _file_name,
    metadata: metadata
  };
}

// Función 6: Orquestar (SRP - solo coordina)
module.exports = async (params) => {
  try {
    const _input = await getRepositoryInput(params.quickAddApi);
    validateRepositoryInput(_input);
    const _repoData = await generateRepositoryData(_input);
    const _metadata = await getRepositoryMetadata(params.app);
    const _repository = buildRepositoryStructure(_repoData, _input, _metadata);
    
    assignCommonVariables(params.variables, _repository);
    await showNotification("Repositorio creado exitosamente", "success");
    
  } catch (error) {
    await handleError(error, params.quickAddApi);
  }
};
```

**Cambio clave:** De 100 líneas → 6 funciones × 10-15 líneas cada una

### Aplicación por Orquestador

| Orquestador | Funciones a crear | Esfuerzo |
|---|---|---|
| createRepository.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createTask.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createProject.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createPillar.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createPilarNote.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |

**Total FASE 3: 15 horas refactorización + 3 horas testing = 18 horas**

### Checklist FASE 3

- [ ] createRepository.js refactorizado con 6 funciones SRP
- [ ] createTask.js refactorizado con 6 funciones SRP
- [ ] createProject.js refactorizado con 6 funciones SRP
- [ ] createPillar.js refactorizado con 6 funciones SRP
- [ ] createPilarNote.js refactorizado con 6 funciones SRP
- [ ] Cada función tiene propósito claro (SRP)
- [ ] Error handling en función principal (orchestrate)
- [ ] Tests manuales de todos los 5 orquestadores
- [ ] Funcionalidad no cambió (refactorización segura)

### Risk Assessment FASE 3

**Riesgo: SEVERA**
- Cambios estructurales importantes
- Posibilidad de romper funcionalidad
- Requiere tests exhaustivos
- Mitigation: Tests manuales paso-a-paso, mantener versión backup

### Beneficio FASE 3

- SRP respetado (cada función hace UNA cosa)
- Testing futuro será posible
- Código legible y mantenible
- Base para OCP (FASE 4)

---

## FASE 4: ESTRUCTURA ESCALABLE (OCP)
**Duración: 2 semanas | Esfuerzo: 15 horas | Severidad: MODERADA**

### Objetivo
Hacer sistema escalable: agregar nueva entidad sin copiar código.

### Patrón de Escalabilidad

**Crear abstracciones de configuración:**

```javascript
// Nuevo archivo: configs/entityConfigs.js
const repositoryConfig = {
  type: "repository",
  inputLabels: {
    name: "Nombre del repositorio",
    description: "Descripción"
  },
  folderTemplate: (id, type) => `repositories/${type}/${id}`,
  fileTemplate: (name) => getFileName(name),
  specificValidations: (input) => {
    // Validaciones específicas si las hay
    return true;
  }
};

const taskConfig = {
  type: "task",
  inputLabels: {
    name: "Nombre de la tarea",
    description: "Descripción"
  },
  folderTemplate: (id, type) => `tasks/${type}/${id}`,
  fileTemplate: (name) => getFileName(name),
  specificValidations: (input) => {
    return true;
  }
};

const projectConfig = {
  type: "project",
  inputLabels: {
    name: "Nombre del proyecto",
    description: "Descripción"
  },
  folderTemplate: (id, type) => `projects/${type}/${id}`,
  fileTemplate: (name) => getFileName(name),
  specificValidations: (input) => {
    return true;
  }
};

// ... pillarConfig, pilarNoteConfig

module.exports = {
  repositoryConfig,
  taskConfig,
  projectConfig,
  // ...
};
```

**Crear orquestador genérico:**

```javascript
// Nuevo archivo: orchestrators/createEntity.js
async function createEntity(params, entityConfig) {
  try {
    const _input = await getCommonInput(params.quickAddApi, entityConfig.type);
    validateCommonInput(_input);
    entityConfig.specificValidations(_input);
    
    const _entityData = await generateEntityData(_input);
    const _metadata = await getCommonMetadata(params.app, entityConfig.type);
    const _entity = buildEntityStructure(_entityData, _input, _metadata, entityConfig);
    
    assignCommonVariables(params.variables, _entity);
    await showNotification(`${entityConfig.type} creado exitosamente`, "success");
    
  } catch (error) {
    await handleError(error, params.quickAddApi);
  }
}

module.exports = { createEntity };
```

**Usar configuración en orquestadores:**

```javascript
// createRepository.js (DESPUÉS refactorización)
const { createEntity } = require("./orchestrators/createEntity");
const { repositoryConfig } = require("./configs/entityConfigs");

module.exports = async (params) => {
  return createEntity(params, repositoryConfig);
};
```

**Total en createRepository.js: 5 líneas**

**Agregar nueva entidad (createArticle.js):**

```javascript
// createArticle.js (NUEVO - escalabilidad!)
const { createEntity } = require("./orchestrators/createEntity");
const { articleConfig } = require("./configs/entityConfigs");

module.exports = async (params) => {
  return createEntity(params, articleConfig);
};
```

**Total en createArticle.js: 5 líneas**
**Sin copiar/pegar código existente**

### Checklist FASE 4

- [ ] entityConfigs.js creado con 5 configuraciones
- [ ] createEntity.js (orquestador genérico) creado
- [ ] createRepository.js refactorizado a 5 líneas
- [ ] createTask.js refactorizado a 5 líneas
- [ ] createProject.js refactorizado a 5 líneas
- [ ] createPillar.js refactorizado a 5 líneas
- [ ] createPilarNote.js refactorizado a 5 líneas
- [ ] Test: Crear nueva entidad (createArticle) sin duplicación
- [ ] Todos los 5 orquestadores aún funcionan
- [ ] OCP mejorado (sistema abierto a extensión)

### Effort Breakdown

| Tarea | Horas |
|---|---|
| Crear entityConfigs.js | 3h |
| Crear createEntity.js (orquestador genérico) | 4h |
| Refactorizar 5 orquestadores | 5h |
| Testing y validación | 3h |
| **Total** | **15h** |

### Risk Assessment FASE 4

**Riesgo: MEDIO**
- Cambios arquitectónicos
- Requiere rediseño de estructura
- Mitigation: Tests exhaustivos, mantener backup FASE 3

### Beneficio FASE 4

- OCP respetado (abierto a extensión)
- Agregar entidad nueva = 5 líneas + configuración
- Código muy escalable
- Mantenimiento futuro simple

---

## FASE 5: TESTING Y DOCUMENTACIÓN
**Duración: 2 semanas | Esfuerzo: 8 horas | Severidad: BAJA**

### Objetivo
Validar que todo funciona y documentar cambios.

### Testing Manual

| Orquestador | Test Cases | Effort |
|---|---|---|
| createRepository | Crear repo, validar entrada, error handling | 1h |
| createTask | Crear task, prioridades, fechas | 1h |
| createProject | Crear proyecto, estructura carpetas | 1h |
| createPillar | Crear pilar, metadatos | 1h |
| createPilarNote | Crear nota, referencias | 1h |

**Total Testing: 5 horas**

### Documentación

| Documento | Contenido | Effort |
|---|---|---|
| README.md (utils/) | Qué hace cada módulo | 1h |
| README.md (orchestrators/) | Cómo crear nueva entidad | 1h |
| configs/README.md | Estructura de configuración | 1h |

**Total Documentación: 3 horas**

### Checklist FASE 5

- [ ] Todos los 5 orquestadores testeados manualmente
- [ ] Casos de error testeados
- [ ] Utils documentado
- [ ] Orchestrators documentado
- [ ] Configs documentado
- [ ] README actualizado con instrucciones post-refactor
- [ ] Versión documentada en PASO 1 V4 completado

### Risk Assessment FASE 5

**Riesgo: BAJO**
- Solo validación y documentación
- No hay cambios de código

### Beneficio FASE 5

- Confianza que código funciona
- Documentación para futuros cambios
- Base para PASO 2 (Use Cases)

---

## MATRIZ DE ESFUERZO POR FASE

| Fase | Descripción | Horas | Severidad | Risk | Cumum |
|---|---|---|---|---|---|
| 1 | Convenciones código | 7 | BAJA | BAJO | 7h |
| 2 | Módulos reutilizables | 12 | MODERADA | MEDIO | 19h |
| 3 | Refactorización SRP | 18 | SEVERA | SEVERA | 37h |
| 4 | Estructura escalable | 15 | MODERADA | MEDIO | 52h |
| 5 | Testing + Docs | 8 | BAJA | BAJO | 60h |

**Total: 60 horas (1.5h/día durante 10 semanas)**

---

## TIMELINE VISUAL

```
Semana 1-2:  FASE 1 ████░░░░░░░░░░░░░░░░  7h
Semana 3-4:  FASE 2 ██████████░░░░░░░░░░  12h
Semana 5-6:  FASE 3 ████████████████░░░░  18h
Semana 7-8:  FASE 4 ██████████████░░░░░░  15h
Semana 9-10: FASE 5 ████████░░░░░░░░░░░░  8h

TOTAL: ████████████████████████████████████████  60h
```

---

## PRIORIZACIÓN

**Must do (Fases 1-3):**
- Aplicar convenciones
- Eliminar duplicación
- Implementar SRP

**Should do (Fase 4):**
- Estructura escalable
- OCP mejorado

**Nice to have (Fase 5):**
- Testing exhaustivo
- Documentación completa

---

## CRITERIOS DE ÉXITO

Después de completar 5 fases:

- SRP implementado en todos orquestadores
- DRY eliminado (500 líneas → 100)
- OCP mejorado (escalable a nuevas entidades)
- Error handling completo
- Documentación clara
- Todos los tests pasan
- Funcionalidad no cambió

---

## PRÓXIMOS PASOS DESPUÉS DE ROADMAP

```
PASO 1 V4 (COMPLETADO)
├── ARTEFACTO 1: INDEX
├── ARTEFACTO 2: STAKEHOLDERS
├── ARTEFACTO 3: OPERACIONES
├── ARTEFACTO 4: AS-IS
├── ARTEFACTO 5: VIOLACIONES
└── ARTEFACTO 6: ROADMAP ← Eres aquí

Ejecución del Roadmap (Fases 1-5)
    ↓
PASO 2: Formal Use Cases
    ↓
PASO 3: Detailed Flows
    ↓
PASO 4: Implementation (Refactorización)
    ↓
PASO 5: Testing + Release
```

---

## CONCLUSIÓN

Este roadmap proporciona un plan claro y ejecutable para refactorizar el código en 60 horas (10 semanas). Cada fase tiene objetivos específicos, esfuerzo estimado y risk assessment.

El progreso es incremental: cada fase construye sobre la anterior, manteniendo funcionalidad mientras mejora calidad.

---

**ARTEFACTO 6 COMPLETADO**

Próximo: PASO1-V4-ESTRUCTURA-TARGET

¿Confirmás para continuar?
