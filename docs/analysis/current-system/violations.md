```yaml
type: Documento T茅cnico
title: PASO 1 V4 - VIOLACIONES SOLID Y DRY
version: 4.0.0
scope: ACTIVIDAD 1 - An谩lisis de principios de c贸digo limpio
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
analysis_framework: SOLID + DRY + Code Smell Detection
```

# PASO 1 V4: VIOLACIONES SOLID Y DRY
## Diagn贸stico de Problemas de Dise帽o y Mantenibilidad

---

## INTRODUCCI肹SPEC]N

Este documento profundiza en violaciones espec铆ficas de principios SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) y DRY (Don't Repeat Yourself) identificadas en el c贸digo AS-IS.

A diferencia del ARTEFACTO 4 (violaciones de convenciones superficiales), este documento analiza problemas de **dise帽o estructural** que afectan arquitectura del c贸digo.

---

## PRINCIPIOS EVALUADOS

**SOLID:**
- S: Single Responsibility Principle (SRP) - Una responsabilidad por clase/funci贸n
- O: Open/Closed Principle (OCP) - Abierto para extensi贸n, cerrado para modificaci贸n
- L: Liskov Substitution Principle (LSP) - Sustituci贸n de tipos sin quebrar contrato
- I: Interface Segregation Principle (ISP) - Interfaces espec铆ficas, no gen茅ricas
- D: Dependency Inversion Principle (DIP) - Depender de abstracciones, no concreciones

**DRY:**
- Don't Repeat Yourself - C贸digo duplicado debe ser extra铆do
- Reutilizaci贸n maximizada
- L贸gica centralizada

---

## VIOLACI肹SPEC]N 1: SRP - Single Responsibility Principle

**C贸digo:** SOLID-V1
**Severidad:** SEVERA
**Ubicaci贸n:** Todos los 5 orquestadores (createRepository.js, createTask.js, etc)
**L铆neas afectadas:** 5 archivos 肹ARCH] 350 l铆neas = 1750 l铆neas

### Descripci贸n del Problema

Los orquestadores actuales violan SRP porque cada uno es responsable de:

1. Obtener entrada del usuario
2. Validar entrada
3. Generar identificadores
4. Obtener metadatos
5. Procesar informaci贸n espec铆fica del contexto
6. Asignar variables
7. Mostrar notificaciones
8. Manejar errores

Una funci贸n NO debe ser responsable de 8 cosas.

### Manifestaci贸n en C贸digo

**Ejemplo: createRepository.js (violaci贸n SRP)**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  // Responsabilidad 1: Obtener entrada
  const repoName = await quickAddApi.inputPrompt("Nombre...");
  const repoType = await askRepositoryType();
  
  // Responsabilidad 2: Validar entrada
  if (!repoName || repoName.length === 0) {
    // error
  }
  
  // Responsabilidad 3: Generar ID
  const repoId = await generateUniqueId();
  
  // Responsabilidad 4: Obtener metadata
  const dateCreated = getCurrentDateTime();
  const author = await getAuthorName();
  const tags = [repoType, "active"];
  
  // Responsabilidad 5: Procesar info espec铆fica
  const folderPath = `repositories/${repoType}/${repoId}`;
  const fileName = getFileName(repoName);
  
  // Responsabilidad 6: Asignar variables
  variables.repositoryId = repoId;
  variables.repositoryName = repoName;
  variables.metadata = { dateCreated, author, tags };
  
  // Responsabilidad 7: Mostrar notificaci贸n
  showNotification("Repositorio creado");
  
  // Responsabilidad 8: Manejar errores (faltante)
  // No hay try/catch = responsabilidad ignorada
};
```

**Total: 8 responsabilidades en 100+ l铆neas**

### Impacto

- **Testing:** Imposible testear una responsabilidad sin las otras 7
- **Mantenimiento:** Cambiar c贸mo se obtiene metadata requiere tocar funci贸n entera
- **Reutilizaci贸n:** No se puede reutilizar obtenci贸n de input sin c贸digo de validaci贸n
- **Comprensi贸n:** Nuevo developer tarda horas en entender qu茅 hace esta funci贸n

### Diagn贸stico Ra铆z

Orquestador intenta hacer TODO:
```
Orquestador = Input + Validation + ID Gen + Metadata + Process + Variables + Notification + Error
              ^        ^           ^       ^         ^        ^         ^              ^
              1        2           3       4         5        6         7              8
```

### Soluci贸n (Aplicable en PASO 4)

Dividir orquestador en funciones con SRP 煤nica:

```javascript
// Cada funci贸n responsable de UNA cosa
async function getRepositoryInput(quickAddApi) {
  // SOLO obtiene entrada
  const name = await quickAddApi.inputPrompt("Nombre...");
  const type = await askRepositoryType();
  return { name, type };
}

function validateRepositoryInput(input) {
  // SOLO valida
  if (!input.name || input.name.length === 0) throw new Error("...");
  return true;
}

async function generateRepositoryData(input) {
  // SOLO genera datos espec铆ficos del repositorio
  const id = await generateUniqueId();
  const type = input.type.toLowerCase();
  return { id, type };
}

async function getRepositoryMetadata(repositoryData) {
  // SOLO obtiene metadata
  const created = getCurrentDateTime();
  const author = await getAuthorName();
  const tags = ["repository", repositoryData.type];
  return { created, author, tags };
}

function buildRepositoryStructure(repositoryData, metadata, input) {
  // SOLO construye estructura final
  return {
    id: repositoryData.id,
    name: input.name,
    type: repositoryData.type,
    folder: `repositories/${repositoryData.type}/${repositoryData.id}`,
    metadata
  };
}

async function createRepository(params) {
  // SOLO orquesta - llama funciones que tienen SRP
  try {
    const input = await getRepositoryInput(params.quickAddApi);
    validateRepositoryInput(input);
    const repoData = await generateRepositoryData(input);
    const metadata = await getRepositoryMetadata(repoData);
    const repository = buildRepositoryStructure(repoData, metadata, input);
    
    assignRepositoryVariables(params.variables, repository);
    await showNotification("Repositorio creado", "success");
    return repository;
  } catch (error) {
    await showNotification(`Error: ${error.message}`, "error");
    throw error;
  }
}
```

**Cambio clave:** De 1 funci贸n con 8 responsabilidades 6 funciones con 1 responsabilidad cada una

---

## VIOLACI肹SPEC]N 2: DRY - Don't Repeat Yourself

**C贸digo:** DRY-V1
**Severidad:** MODERADA
**Ubicaci贸n:** Todos los 5 orquestadores
**L铆neas duplicadas:** Aproximadamente 500+ l铆neas

### Descripci贸n del Problema

C贸digo duplicado entre orquestadores. Los 5 archivos repiten patrones casi id茅nticos:

**Operaci贸n duplicada:** Obtener entrada usuario
**C贸digo en createRepository.js:**
```javascript
const repoName = await quickAddApi.inputPrompt("Nombre del repositorio:");
const repoType = await askRepositoryType();
const repoDescription = await quickAddApi.wideInputPrompt("Descripci贸n...");
```

**C贸digo en createTask.js:**
```javascript
const taskName = await quickAddApi.inputPrompt("Nombre de la tarea:");
const taskType = await askTaskType();
const taskDescription = await quickAddApi.wideInputPrompt("Descripci贸n...");
```

**C贸digo en createProject.js:**
```javascript
const projectName = await quickAddApi.inputPrompt("Nombre del proyecto:");
const projectType = await askProjectType();
const projectDescription = await quickAddApi.wideInputPrompt("Descripci贸n...");
```

**Patr贸n id茅ntico, solo cambi贸: repository task project**

### Manifestaci贸n Completa

**Duplicaci贸n en Validaci贸n:**
```javascript
// createRepository.js
if (!repoName || repoName.length === 0) {
  throw new Error("Nombre inv谩lido");
}

// createTask.js
if (!taskName || taskName.length === 0) {
  throw new Error("Nombre inv谩lido");
}

// createProject.js
if (!projectName || projectName.length === 0) {
  throw new Error("Nombre inv谩lido");
}
```

**Duplicaci贸n en Generaci贸n de ID:**
```javascript
// createRepository.js
const repoId = await generateUniqueId();

// createTask.js
const taskId = await generateUniqueId();

// createProject.js
const projectId = await generateUniqueId();
```

**Duplicaci贸n en Obtenci贸n de Metadata:**
```javascript
// createRepository.js
const dateCreated = getCurrentDateTime();
const author = await getAuthorName();
const tags = [repoType, "active"];

// createTask.js
const dateCreated = getCurrentDateTime();
const author = await getAuthorName();
const tags = [taskType, "pending"];

// createProject.js
const dateCreated = getCurrentDateTime();
const author = await getAuthorName();
const tags = [projectType, "active"];
```

### Estad铆stica de Duplicaci贸n

| Operaci贸n | Repetida | Veces |
|---|---|---|
| Obtener fecha | OP-005 | 5 |
| Generar ID | OP-003 | 4 |
| Obtener metadata | OP-007 | 4 |
| Obtener entrada | OP-001 | 5 |
| Validar entrada | OP-002 | 5 |
| Mostrar notificaci贸n | OP-015 | 5 |

**Total: 27 repeticiones de operaciones (deber铆a ser 1)**

### Impacto

- **Mantenimiento:** Bug en validaci贸n requiere 5 cambios
- **Inconsistencia:** Una correcci贸n podr铆a olvidarse en un archivo
- **L铆neas innecesarias:** 500 l铆neas que podr铆an ser 50
- **Complejidad:** M谩s c贸digo = m谩s probabilidad de bugs

### Diagrama de Duplicaci贸n

```
createRepository.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Obtener entrada  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Validar entrada  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Generar ID  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Obtener metadata  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Procesar repo-espec铆fico
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Asignar variables  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Mostrar notificaci贸n  DUPLICADA
[DONE]敂[DONE]擺READY][DONE]擺READY] Error handling

createTask.js
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Obtener entrada  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Validar entrada  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Generar ID  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Obtener metadata  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Procesar task-espec铆fico
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Asignar variables  DUPLICADA
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Mostrar notificaci贸n  DUPLICADA
[DONE]敂[DONE]擺READY][DONE]擺READY] Error handling

[Patr贸n se repite 4 veces m谩s]
```

### Soluci贸n (Aplicable en PASO 4)

Extraer operaciones comunes a m贸dulos reutilizables:

```javascript
// utils/inputOperations.js
async function getCommonInput(quickAddApi, type) {
  // "tipo" es par谩metro: repository, task, project
  const name = await quickAddApi.inputPrompt(`Nombre del ${type}:`);
  const typeValue = await askType(type); // askRepositoryType, askTaskType, etc
  const description = await quickAddApi.wideInputPrompt("Descripci贸n...");
  
  return { name, type: typeValue, description };
}

// utils/validationOperations.js
function validateCommonInput(input) {
  if (!input.name || input.name.length === 0) {
    throw new Error("Nombre inv谩lido");
  }
  return true;
}

// utils/metadataOperations.js
async function getCommonMetadata(entityType) {
  const created = getCurrentDateTime();
  const author = await getAuthorName();
  const tags = [entityType, "active"];
  return { created, author, tags };
}

// createRepository.js (refactorizado)
module.exports = async (params) => {
  try {
    const input = await getCommonInput(params.quickAddApi, "repository");
    validateCommonInput(input);
    const id = await generateUniqueId();
    const metadata = await getCommonMetadata(input.type);
    
    // Solo l贸gica espec铆fica de repositorio
    const structure = buildRepositoryStructure(id, input, metadata);
    
    assignVariables(params.variables, structure);
    await showNotification("Repositorio creado", "success");
  } catch (error) {
    await showNotification(`Error: ${error.message}`, "error");
  }
};
```

**Cambio clave:** De 5 copias de getInput 1 m贸dulo reutilizado 5 veces

---

## VIOLACI肹SPEC]N 3: OCP - Open/Closed Principle

**C贸digo:** SOLID-V2
**Severidad:** MODERADA
**Ubicaci贸n:** Estructura de utils/ en common/ (no escalable)

### Descripci贸n del Problema

El sistema NO est谩 abierto a extensi贸n (agregar nuevo tipo de entidad).

Para agregar nuevo orquestador (createArticle.js), se requiere:
1. Copiar createRepository.js
2. Cambiar nombres: repo article
3. Modificar l贸gica espec铆fica
4. Crear/modificar template
5. Modificar configuraci贸n QuickAdd

**No est谩 dise帽ado para ser extendido sin modificaci贸n.**

### Ejemplo

**Quiero agregar createArticle.js**

Estado actual: Copiar/pegar createRepository.js (MALO)

```javascript
// Tiene que copiarse TODO
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  const articleName = await quickAddApi.inputPrompt("Nombre...");
  // ... copiar 90 l铆neas m谩s
  
  variables.articleId = articleId;
  // ... resto
};
```

Dise帽o mejorado: Usar configuraci贸n extensible (BUENO)

```javascript
// createEntity.js (gen茅rico)
async function createEntity(params, entityConfig) {
  const { inputLabels, processLogic, metadata } = entityConfig;
  
  const input = await getCommonInput(params.quickAddApi, entityConfig.type);
  validateCommonInput(input);
  const id = await generateUniqueId();
  const meta = await getCommonMetadata(entityConfig.type);
  
  const entity = processLogic(id, input, meta); // Delegar l贸gica espec铆fica
  
  assignVariables(params.variables, entity);
  await showNotification("Entidad creada", "success");
  
  return entity;
}

// configs/repositoryConfig.js
const repositoryConfig = {
  type: "repository",
  processLogic: (id, input, meta) => ({
    id, name: input.name, type: input.type,
    folder: `repositories/${input.type}/${id}`,
    metadata: meta
  })
};

// configs/articleConfig.js
const articleConfig = {
  type: "article",
  processLogic: (id, input, meta) => ({
    id, title: input.name, category: input.type,
    path: `articles/${input.type}/${id}`,
    metadata: meta
  })
};

// createRepository.js (refactorizado)
module.exports = async (params) => {
  return createEntity(params, repositoryConfig);
};

// createArticle.js (nuevo - solo 3 l铆neas!)
module.exports = async (params) => {
  return createEntity(params, articleConfig);
};
```

**Cambio clave:** De copiar 100 l铆neas definir configuraci贸n 20 l铆neas

### Impacto de Violaci贸n OCP

- Agregar nuevo tipo requiere duplicaci贸n de c贸digo
- Bugs en patr贸n com煤n requieren cambios en 5+ lugares
- Mantener 5 versiones del mismo patr贸n es error-prone

---

## VIOLACI肹SPEC]N 4: DIP - Dependency Inversion Principle

**C贸digo:** SOLID-V3
**Severidad:** BAJA
**Ubicaci贸n:** Todos los 5 orquestadores
**L铆neas afectadas:** Acoplamiento directo a APIs

### Descripci贸n del Problema

Los orquestadores est谩n acoplados directamente a:
- Obsidian API (app, vault)
- QuickAdd API (quickAddApi)
- M贸dulos espec铆ficos (generateUniqueId, getCurrentDateTime)

No hay inversi贸n de dependencias. Si Obsidian API cambia, todos los orquestadores deben cambiar.

### Manifestaci贸n en C贸digo

**Acoplamiento directo:**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  // Acoplado directamente a API de Obsidian
  const folder = app.vault.getAbstractFileByPath(path);
  
  // Acoplado directamente a API de QuickAdd
  const name = await quickAddApi.inputPrompt("...");
  
  // Acoplado directamente a m贸dulo
  const id = await generateUniqueId();
};
```

Si `generateUniqueId` cambia su interfaz, todos los orquestadores fallan.

### Soluci贸n (DIP)

Usar interfaces/abstracciones:

```javascript
// abstractions/idGenerator.ts
interface IdGenerator {
  generate(): Promise<string>;
}

// implementations/cryptoIdGenerator.ts
class CryptoIdGenerator implements IdGenerator {
  async generate() {
    // implementaci贸n
  }
}

// createRepository.js (desacoplado)
module.exports = async (params, idGenerator: IdGenerator) => {
  const id = await idGenerator.generate(); // Usa abstracci贸n, no concreci贸n
};
```

**Cambio clave:** Depender de interfaz IdGenerator, no de funci贸n generateUniqueId directa

---

## VIOLACI肹SPEC]N 5: Falta de Error Handling Completo

**C贸digo:** SOLID-V4 / Code Smell
**Severidad:** SEVERA
**Ubicaci贸n:** Todos los 5 orquestadores
**L铆neas afectadas:** 0 l铆neas (falta try/catch)

### Descripci贸n del Problema

No hay captura de excepciones. Si falla cualquier operaci贸n, macro explota sin feedback.

```javascript
module.exports = async (params) => {
  // SIN try/catch
  const input = await quickAddApi.inputPrompt("...");
  const id = await generateUniqueId();
  const date = getCurrentDateTime();
  // Si cualquiera falla macro incompleta, usuario sin saber qu茅 pas贸
};
```

### Impacto

- Usuario intenta crear repositorio
- Falla en l铆nea 50 (validaci贸n)
- Usuario ve: Nada (silencio absoluto)
- Usuario confundido: "驴Qu茅 pas贸?"

### Soluci贸n

```javascript
module.exports = async (params) => {
  try {
    const input = await quickAddApi.inputPrompt("...");
    const id = await generateUniqueId();
    const date = getCurrentDateTime();
    
    // ... resto
    
    await showNotification("脡xito", "success");
  } catch (error) {
    const errorMessage = error.message || "Error desconocido";
    await showNotification(`Error: ${errorMessage}`, "error");
    console.error("Error en createRepository:", error);
    throw error;
  }
};
```

---

## RESUMEN DE VIOLACIONES SOLID/DRY

| Violaci贸n | C贸digo | Severidad | L铆neas | Impacto |
|---|---|---|---|---|
| SRP | SOLID-V1 | SEVERA | 1750 | Testing, mantenibilidad |
| DRY | DRY-V1 | MODERADA | 500 | Consistencia, mantenimiento |
| OCP | SOLID-V2 | MODERADA | 1750 | Extensibilidad |
| DIP | SOLID-V3 | BAJA | 1750 | Acoplamiento |
| Error Handling | Code-Smell-1 | SEVERA | 5 | UX, debugging |

**Total: 5 violaciones principales, 3 severas, 2 moderadas**

---

## MATRIZ DE RELACIONES

| Violaci贸n | Causa Ra铆z | Consecuencia | Soluci贸n |
|---|---|---|---|
| SRP violado | Orquestador hace TODO | DRY violado | Dividir en funciones |
| DRY violado | Copiar/pegar entre archivos | Inconsistencia | Extraer a m贸dulos comunes |
| OCP violado | Patr贸n no escalable | Duplicaci贸n | Usar configuraci贸n |
| DIP d茅bil | Acoplamiento directo | Fr谩gil a cambios | Inyectar dependencias |
| Sin error handling | No hay try/catch | UX pobre | Agregar try/catch |

---

## C肹SPEC]MO ESTAS VIOLACIONES SE RELACIONAN

```
Violaci贸n SRP
[DONE]擺DONE][DONE]擺READY] Causa: Orquestador intenta hacer 8 cosas
[DONE]擺DONE][DONE]擺READY] Resultado: Dif铆cil de testear, mantener, extender
[DONE]擺DONE][DONE]擺READY] Facilita: Duplicaci贸n de c贸digo (DRY violado)
[DONE]擺DONE][DONE]擺READY] Hace dif铆cil: Seguir OCP (agregar entidades nuevas)
[DONE]敂[DONE]擺READY] Agrava: Error handling incompleto

Violaci贸n DRY
[DONE]擺DONE][DONE]擺READY] Causa: C贸digo duplicado entre 5 orquestadores
[DONE]擺DONE][DONE]擺READY] Resultado: 500 l铆neas innecesarias
[DONE]擺DONE][DONE]擺READY] Facilita: Bugs introducidos en solo un archivo
[DONE]擺DONE][DONE]擺READY] Viola: OCP (no es escalable)
[DONE]敂[DONE]擺READY] S铆ntoma: SRP quebrantado en cada archivo

Violaci贸n OCP
[DONE]擺DONE][DONE]擺READY] Causa: Arquitectura no permite extensi贸n sin modificaci贸n
[DONE]擺DONE][DONE]擺READY] Resultado: Agregar entidad nueva requiere copiar 100 l铆neas
[DONE]擺DONE][DONE]擺READY] S铆ntoma: DRY violado sist茅micamente
[DONE]擺DONE][DONE]擺READY] Causa ra铆z: SRP violado en cada orquestador
[DONE]敂[DONE]擺READY] Requiere: Refactorizaci贸n arquitect贸nica
```

---

## CONCLUSI肹SPEC]N

Las 5 violaciones SOLID/DRY est谩n **interconectadas**. La ra铆z es **SRP quebrantado** en orquestadores, que causa **DRY violado**, que hace **OCP imposible**.

La refactorizaci贸n debe comenzar por SRP (PASO 4), lo que autom谩ticamente mejorar谩 DRY, facilitar谩 OCP y permitir谩 DIP correcto.

---

## PR肹SPEC]XIMA ACCI肹SPEC]N

El ARTEFACTO 6 (REFACTOR-ROADMAP) propone plan de refactorizaci贸n fase-por-fase, comenzando con SRP.

---

**ARTEFACTO 5 COMPLETADO**

Pr贸ximo: PASO1-V4-REFACTOR-ROADMAP

驴Confirm谩s para continuar?
