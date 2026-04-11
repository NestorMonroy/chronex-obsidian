```yaml
type: Documento T茅cnico
title: PASO 1 V4 - ROADMAP DE REFACTORIZACI肹SPEC]N
version: 4.0.0
scope: ACTIVIDAD 1 - Plan de acci贸n para mejorar c贸digo
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
framework: Agile - Phased Refactoring
timeline: 10-12 semanas (50-60 horas)
```

# PASO 1 V4: ROADMAP DE REFACTORIZACI肹SPEC]N
## Plan Priorizado de Mejora de C贸digo con Timeline y Effort

---

## INTRODUCCI肹SPEC]N

Este documento define un plan ejecutable para refactorizar el c贸digo AS-IS hacia el estado target. El plan est谩 dividido en 5 fases, cada una con:

- Qu茅 cambiar (operaciones espec铆ficas)
- Por qu茅 cambiar (violaci贸n que soluciona)
- Cu谩ndo (semana/fase)
- Cu谩nto esfuerzo (horas)
- Riesgo (bajo/medio/alto)
- Beneficio esperado

El objetivo es mejorar mantenibilidad sin cambiar funcionalidad.

---

## PRINCIPIOS DEL ROADMAP

1. **No romper funcionalidad existente** - Refactorizaci贸n es segura
2. **Cambios incrementales** - Fase por fase, peque帽os pasos
3. **Tests despu茅s de cambios** - Validar que todo sigue funcionando
4. **Reutilizaci贸n m谩xima** - Extraer c贸digo com煤n a m贸dulos
5. **Documentaci贸n constante** - Actualizar mientras se refactoriza

---

## TIMELINE GENERAL

```
Semana 1-2:   FASE 1 - Convenciones de C贸digo (7 horas)
Semana 3-4:   FASE 2 - M贸dulos Reutilizables (12 horas)
Semana 5-6:   FASE 3 - Refactorizaci贸n SRP (18 horas)
Semana 7-8:   FASE 4 - Estructura Escalable (15 horas)
Semana 9-10:  FASE 5 - Testing y Documentaci贸n (8 horas)

TOTAL: 10 semanas, 60 horas (1.5 horas/d铆a)
```

---

## FASE 1: CONVENCIONES DE C肹SPEC]DIGO
**Duraci贸n: 1-2 semanas | Esfuerzo: 7 horas | Severidad: BAJA**

### Objetivo
Aplicar prefijos _contexto_ y est谩ndares de naming a todo el c贸digo existente.

### Cambios Espec铆ficos

**Cambio 1.1: Prefijos en m贸dulos utils/**

| M贸dulo | ANTES | DESPU脡S | Effort |
|---|---|---|---|
| generateUniqueId.js | array, random, hex | _crypto_array, _format_hex | 0.5h |
| generateCustomId.js | p1-p5, id | typeSegment-timestampSegment, _custom_id | 1h |
| getCurrentDateTime.js | (cumple) | - | 0h |
| getFileName.js | clean, truncated, normalized | _filename_clean, _filename_limited, _filename_normalized | 1h |
| showNotification.js | (par谩metro type ignorado) | Usar type, validar, mostrar en t铆tulo | 1.5h |
| getMetadataByFrontmatter.js | file, cache, metadata | _file_abstract, _cache_file, _metadata_frontmatter | 1h |
| getGrandParentFolder.js | path, parent | _path_split, _path_parent | 1h |

**Subtotal Cambio 1.1: 6 horas**

**Cambio 1.2: Constantes sin n煤meros acoplados**

| Ubicaci贸n | ANTES | DESPU脡S | Effort |
|---|---|---|---|
| getFileName.js | 200 (substring) | MAX_FILENAME_LENGTH = 200 | 0.5h |
| showNotification.js | 5000 (duration) | NOTIFICATION_DURATION_MS = 5000 | 0.5h |

**Subtotal Cambio 1.2: 1 hora**

### Checklist FASE 1

- [ ] generateUniqueId.js refactorizado con prefijos
- [ ] generateCustomId.js con par谩metros descriptivos
- [ ] getFileName.js con _filename_ prefijo
- [ ] showNotification.js utiliza par谩metro type
- [ ] showNotification.js valida tipos
- [ ] Constantes MAX_FILENAME_LENGTH y NOTIFICATION_DURATION_MS extra铆das
- [ ] M贸dulos validados manualmente
- [ ] Imports en orquestadores a煤n funcionan

### Risk Assessment FASE 1

**Riesgo: BAJO**
- Cambios son cosm茅ticos (naming, prefijos)
- No afectan funcionalidad
- Si algo falla, f谩cil de revertir

### Beneficio FASE 1

- C贸digo m谩s legible
- Variables tienen prop贸sito claro
- Establece est谩ndares para FASES 2-5
- Documentaci贸n constante

---

## FASE 2: M肹SPEC]DULOS REUTILIZABLES
**Duraci贸n: 2 semanas | Esfuerzo: 12 horas | Severidad: MODERADA**

### Objetivo
Extraer operaciones comunes a m贸dulos reutilizables, solucionar DRY.

### Operaciones a Extraer

**Operaci贸n 2.1: getCommonInput (OP-001 reutilizable)**

```javascript
// Nuevo archivo: utils/inputOperations.js
async function getCommonInput(quickAddApi, entityType) {
  const _input_label = `Nombre del ${entityType}:`;
  const _input_name = await quickAddApi.inputPrompt(_input_label);
  
  const _input_type = await askEntityType(entityType);
  
  const _input_desc_label = "Descripci贸n (opcional):";
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
const _input_description = await quickAddApi.wideInputPrompt("Descripci贸n...");

// En createTask.js
const _input_name = await quickAddApi.inputPrompt("Nombre de la tarea:");
const _input_type = await askTaskType();
const _input_description = await quickAddApi.wideInputPrompt("Descripci贸n...");

// [Repetido 5 veces]
```

**Uso despu茅s (reutilizado):**
```javascript
// En createRepository.js
const _input_data = await getCommonInput(quickAddApi, "repository");

// En createTask.js
const _input_data = await getCommonInput(quickAddApi, "task");

// [1 l铆nea en lugar de 3, reutilizada]
```

**Effort: 2 horas**

---

**Operaci贸n 2.2: validateCommonInput (OP-002 reutilizable)**

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
    throw new Error("Nombre inv谩lido: m铆nimo 3, m谩ximo 255 caracteres, sin caracteres especiales");
  }
  
  return true;
}

module.exports = { validateCommonInput };
```

**Effort: 1.5 horas**

---

**Operaci贸n 2.3: getCommonMetadata (OP-005, OP-007 reutilizable)**

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

**Operaci贸n 2.4: assignCommonVariables (OP-012 reutilizable)**

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

**Operaci贸n 2.5: handleError (Error handling reutilizable)**

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

**Operaci贸n 2.6: Crear estructura utils/ (Opci贸n 2 - Plana)**

```
scripts/
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] createRepository.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] createTask.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] createProject.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] createPillar.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] createPilarNote.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] utils/
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] generateUniqueId.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] generateCustomId.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] getCurrentDateTime.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] getFileName.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] getMetadataByFrontmatter.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] showNotification.js
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] inputOperations.js        [NUEVO]
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] validationOperations.js   [NUEVO]
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] metadataOperations.js     [NUEVO]
[DONE]攤   [DONE]擺DONE][DONE]擺READY][DONE]擺READY] variableOperations.js     [NUEVO]
[DONE]攤   [DONE]敂[DONE]擺READY][DONE]擺READY] errorHandling.js          [NUEVO]
[DONE]敂[DONE]擺READY][DONE]擺READY] README.md
```

**Effort: 1 hora (organizaci贸n)**

---

### Checklist FASE 2

- [ ] inputOperations.js creado y probado
- [ ] validationOperations.js creado y probado
- [ ] metadataOperations.js creado y probado
- [ ] variableOperations.js creado y probado
- [ ] errorHandling.js creado y probado
- [ ] Estructura utils/ reorganizada (Opci贸n 2 - plana)
- [ ] Imports en orquestadores actualizados
- [ ] Duplicaci贸n de c贸digo reducida (500 l铆neas 100)
- [ ] Todos los orquestadores a煤n funcionan

### Risk Assessment FASE 2

**Riesgo: MEDIO**
- Se crea c贸digo nuevo
- Imports deben actualizarse
- Posible que algo no se actualice bien
- Mitigation: Tests manuales despu茅s de cada cambio

### Beneficio FASE 2

- Duplicaci贸n eliminada (DRY mejorado)
- Operaciones comunes centralizadas
- M谩s f谩cil cambiar validaci贸n en un lugar
- Base para FASE 3

---

## FASE 3: REFACTORIZACI肹SPEC]N SRP
**Duraci贸n: 2 semanas | Esfuerzo: 18 horas | Severidad: SEVERA**

### Objetivo
Dividir cada orquestador en funciones con responsabilidad 煤nica.

### Patr贸n de Refactorizaci贸n

**Ejemplo: createRepository.js (ANTES)**
```javascript
module.exports = async (params) => {
  // 100+ l铆neas con 8 responsabilidades
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

**Ejemplo: createRepository.js (DESPU脡S)**
```javascript
// Funci贸n 1: Obtener entrada (SRP)
async function getRepositoryInput(quickAddApi) {
  return await getCommonInput(quickAddApi, "repository");
}

// Funci贸n 2: Validar entrada (SRP)
function validateRepositoryInput(input) {
  validateCommonInput(input);
  // Validaciones espec铆ficas de repositorio si es necesario
  return true;
}

// Funci贸n 3: Generar datos (SRP)
async function generateRepositoryData(input) {
  const _repo_id = await generateUniqueId();
  const _repo_type = input.type.toLowerCase();
  
  return { id: _repo_id, type: _repo_type };
}

// Funci贸n 4: Obtener metadata (SRP)
async function getRepositoryMetadata(app) {
  return await getCommonMetadata(app, "repository");
}

// Funci贸n 5: Construir estructura (SRP)
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

// Funci贸n 6: Orquestar (SRP - solo coordina)
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

**Cambio clave:** De 100 l铆neas 6 funciones 肹ARCH] 10-15 l铆neas cada una

### Aplicaci贸n por Orquestador

| Orquestador | Funciones a crear | Esfuerzo |
|---|---|---|
| createRepository.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createTask.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createProject.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createPillar.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |
| createPilarNote.js | getInput, validate, generateData, getMetadata, buildStructure, orchestrate | 3h |

**Total FASE 3: 15 horas refactorizaci贸n + 3 horas testing = 18 horas**

### Checklist FASE 3

- [ ] createRepository.js refactorizado con 6 funciones SRP
- [ ] createTask.js refactorizado con 6 funciones SRP
- [ ] createProject.js refactorizado con 6 funciones SRP
- [ ] createPillar.js refactorizado con 6 funciones SRP
- [ ] createPilarNote.js refactorizado con 6 funciones SRP
- [ ] Cada funci贸n tiene prop贸sito claro (SRP)
- [ ] Error handling en funci贸n principal (orchestrate)
- [ ] Tests manuales de todos los 5 orquestadores
- [ ] Funcionalidad no cambi贸 (refactorizaci贸n segura)

### Risk Assessment FASE 3

**Riesgo: SEVERA**
- Cambios estructurales importantes
- Posibilidad de romper funcionalidad
- Requiere tests exhaustivos
- Mitigation: Tests manuales paso-a-paso, mantener versi贸n backup

### Beneficio FASE 3

- SRP respetado (cada funci贸n hace UNA cosa)
- Testing futuro ser谩 posible
- C贸digo legible y mantenible
- Base para OCP (FASE 4)

---

## FASE 4: ESTRUCTURA ESCALABLE (OCP)
**Duraci贸n: 2 semanas | Esfuerzo: 15 horas | Severidad: MODERADA**

### Objetivo
Hacer sistema escalable: agregar nueva entidad sin copiar c贸digo.

### Patr贸n de Escalabilidad

**Crear abstracciones de configuraci贸n:**

```javascript
// Nuevo archivo: configs/entityConfigs.js
const repositoryConfig = {
  type: "repository",
  inputLabels: {
    name: "Nombre del repositorio",
    description: "Descripci贸n"
  },
  folderTemplate: (id, type) => `repositories/${type}/${id}`,
  fileTemplate: (name) => getFileName(name),
  specificValidations: (input) => {
    // Validaciones espec铆ficas si las hay
    return true;
  }
};

const taskConfig = {
  type: "task",
  inputLabels: {
    name: "Nombre de la tarea",
    description: "Descripci贸n"
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
    description: "Descripci贸n"
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

**Crear orquestador gen茅rico:**

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

**Usar configuraci贸n en orquestadores:**

```javascript
// createRepository.js (DESPU脡S refactorizaci贸n)
const { createEntity } = require("./orchestrators/createEntity");
const { repositoryConfig } = require("./configs/entityConfigs");

module.exports = async (params) => {
  return createEntity(params, repositoryConfig);
};
```

**Total en createRepository.js: 5 l铆neas**

**Agregar nueva entidad (createArticle.js):**

```javascript
// createArticle.js (NUEVO - escalabilidad!)
const { createEntity } = require("./orchestrators/createEntity");
const { articleConfig } = require("./configs/entityConfigs");

module.exports = async (params) => {
  return createEntity(params, articleConfig);
};
```

**Total en createArticle.js: 5 l铆neas**
**Sin copiar/pegar c贸digo existente**

### Checklist FASE 4

- [ ] entityConfigs.js creado con 5 configuraciones
- [ ] createEntity.js (orquestador gen茅rico) creado
- [ ] createRepository.js refactorizado a 5 l铆neas
- [ ] createTask.js refactorizado a 5 l铆neas
- [ ] createProject.js refactorizado a 5 l铆neas
- [ ] createPillar.js refactorizado a 5 l铆neas
- [ ] createPilarNote.js refactorizado a 5 l铆neas
- [ ] Test: Crear nueva entidad (createArticle) sin duplicaci贸n
- [ ] Todos los 5 orquestadores a煤n funcionan
- [ ] OCP mejorado (sistema abierto a extensi贸n)

### Effort Breakdown

| Tarea | Horas |
|---|---|
| Crear entityConfigs.js | 3h |
| Crear createEntity.js (orquestador gen茅rico) | 4h |
| Refactorizar 5 orquestadores | 5h |
| Testing y validaci贸n | 3h |
| **Total** | **15h** |

### Risk Assessment FASE 4

**Riesgo: MEDIO**
- Cambios arquitect贸nicos
- Requiere redise帽o de estructura
- Mitigation: Tests exhaustivos, mantener backup FASE 3

### Beneficio FASE 4

- OCP respetado (abierto a extensi贸n)
- Agregar entidad nueva = 5 l铆neas + configuraci贸n
- C贸digo muy escalable
- Mantenimiento futuro simple

---

## FASE 5: TESTING Y DOCUMENTACI肹SPEC]N
**Duraci贸n: 2 semanas | Esfuerzo: 8 horas | Severidad: BAJA**

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

### Documentaci贸n

| Documento | Contenido | Effort |
|---|---|---|
| README.md (utils/) | Qu茅 hace cada m贸dulo | 1h |
| README.md (orchestrators/) | C贸mo crear nueva entidad | 1h |
| configs/README.md | Estructura de configuraci贸n | 1h |

**Total Documentaci贸n: 3 horas**

### Checklist FASE 5

- [ ] Todos los 5 orquestadores testeados manualmente
- [ ] Casos de error testeados
- [ ] Utils documentado
- [ ] Orchestrators documentado
- [ ] Configs documentado
- [ ] README actualizado con instrucciones post-refactor
- [ ] Versi贸n documentada en PASO 1 V4 completado

### Risk Assessment FASE 5

**Riesgo: BAJO**
- Solo validaci贸n y documentaci贸n
- No hay cambios de c贸digo

### Beneficio FASE 5

- Confianza que c贸digo funciona
- Documentaci贸n para futuros cambios
- Base para PASO 2 (Use Cases)

---

## MATRIZ DE ESFUERZO POR FASE

| Fase | Descripci贸n | Horas | Severidad | Risk | Cumum |
|---|---|---|---|---|---|
| 1 | Convenciones c贸digo | 7 | BAJA | BAJO | 7h |
| 2 | M贸dulos reutilizables | 12 | MODERADA | MEDIO | 19h |
| 3 | Refactorizaci贸n SRP | 18 | SEVERA | SEVERA | 37h |
| 4 | Estructura escalable | 15 | MODERADA | MEDIO | 52h |
| 5 | Testing + Docs | 8 | BAJA | BAJO | 60h |

**Total: 60 horas (1.5h/d铆a durante 10 semanas)**

---

## TIMELINE VISUAL

```
Semana 1-2:  FASE 1 [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒  7h
Semana 3-4:  FASE 2 [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒  12h
Semana 5-6:  FASE 3 [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枒[DONE]枒[DONE]枒[DONE]枒  18h
Semana 7-8:  FASE 4 [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒  15h
Semana 9-10: FASE 5 [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒[DONE]枒  8h

TOTAL: [DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅[DONE]枅  60h
```

---

## PRIORIZACI肹SPEC]N

**Must do (Fases 1-3):**
- Aplicar convenciones
- Eliminar duplicaci贸n
- Implementar SRP

**Should do (Fase 4):**
- Estructura escalable
- OCP mejorado

**Nice to have (Fase 5):**
- Testing exhaustivo
- Documentaci贸n completa

---

## CRITERIOS DE 脡XITO

Despu茅s de completar 5 fases:

- SRP implementado en todos orquestadores
- DRY eliminado (500 l铆neas 100)
- OCP mejorado (escalable a nuevas entidades)
- Error handling completo
- Documentaci贸n clara
- Todos los tests pasan
- Funcionalidad no cambi贸

---

## PR肹SPEC]XIMOS PASOS DESPU脡S DE ROADMAP

```
PASO 1 V4 (COMPLETADO)
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] ARTEFACTO 1: INDEX
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] ARTEFACTO 2: STAKEHOLDERS
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] ARTEFACTO 3: OPERACIONES
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] ARTEFACTO 4: AS-IS
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] ARTEFACTO 5: VIOLACIONES
[DONE]敂[DONE]擺READY][DONE]擺READY] ARTEFACTO 6: ROADMAP  Eres aqu铆

Ejecuci贸n del Roadmap (Fases 1-5)
    
PASO 2: Formal Use Cases
    
PASO 3: Detailed Flows
    
PASO 4: Implementation (Refactorizaci贸n)
    
PASO 5: Testing + Release
```

---

## CONCLUSI肹SPEC]N

Este roadmap proporciona un plan claro y ejecutable para refactorizar el c贸digo en 60 horas (10 semanas). Cada fase tiene objetivos espec铆ficos, esfuerzo estimado y risk assessment.

El progreso es incremental: cada fase construye sobre la anterior, manteniendo funcionalidad mientras mejora calidad.

---

**ARTEFACTO 6 COMPLETADO**

Pr贸ximo: PASO1-V4-ESTRUCTURA-TARGET

驴Confirm谩s para continuar?
