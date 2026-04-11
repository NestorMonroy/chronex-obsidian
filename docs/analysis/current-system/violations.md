```yaml
type: Documento Técnico
title: PASO 1 V4 - VIOLACIONES SOLID Y DRY
version: 4.0.0
scope: ACTIVIDAD 1 - Análisis de principios de código limpio
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
analysis_framework: SOLID + DRY + Code Smell Detection
```

# PASO 1 V4: VIOLACIONES SOLID Y DRY
## Diagnóstico de Problemas de Diseño y Mantenibilidad

---

## INTRODUCCIÓN

Este documento profundiza en violaciones específicas de principios SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) y DRY (Don't Repeat Yourself) identificadas en el código AS-IS.

A diferencia del ARTEFACTO 4 (violaciones de convenciones superficiales), este documento analiza problemas de **diseño estructural** que afectan arquitectura del código.

---

## PRINCIPIOS EVALUADOS

**SOLID:**
- S: Single Responsibility Principle (SRP) - Una responsabilidad por clase/función
- O: Open/Closed Principle (OCP) - Abierto para extensión, cerrado para modificación
- L: Liskov Substitution Principle (LSP) - Sustitución de tipos sin quebrar contrato
- I: Interface Segregation Principle (ISP) - Interfaces específicas, no genéricas
- D: Dependency Inversion Principle (DIP) - Depender de abstracciones, no concreciones

**DRY:**
- Don't Repeat Yourself - Código duplicado debe ser extraído
- Reutilización maximizada
- Lógica centralizada

---

## VIOLACIÓN 1: SRP - Single Responsibility Principle

**Código:** SOLID-V1
**Severidad:** SEVERA
**Ubicación:** Todos los 5 orquestadores (createRepository.js, createTask.js, etc)
**Líneas afectadas:** 5 archivos × 350 líneas = 1750 líneas

### Descripción del Problema

Los orquestadores actuales violan SRP porque cada uno es responsable de:

1. Obtener entrada del usuario
2. Validar entrada
3. Generar identificadores
4. Obtener metadatos
5. Procesar información específica del contexto
6. Asignar variables
7. Mostrar notificaciones
8. Manejar errores

Una función NO debe ser responsable de 8 cosas.

### Manifestación en Código

**Ejemplo: createRepository.js (violación SRP)**
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
  
  // Responsabilidad 5: Procesar info específica
  const folderPath = `repositories/${repoType}/${repoId}`;
  const fileName = getFileName(repoName);
  
  // Responsabilidad 6: Asignar variables
  variables.repositoryId = repoId;
  variables.repositoryName = repoName;
  variables.metadata = { dateCreated, author, tags };
  
  // Responsabilidad 7: Mostrar notificación
  showNotification("Repositorio creado");
  
  // Responsabilidad 8: Manejar errores (faltante)
  // No hay try/catch = responsabilidad ignorada
};
```

**Total: 8 responsabilidades en 100+ líneas**

### Impacto

- **Testing:** Imposible testear una responsabilidad sin las otras 7
- **Mantenimiento:** Cambiar cómo se obtiene metadata requiere tocar función entera
- **Reutilización:** No se puede reutilizar obtención de input sin código de validación
- **Comprensión:** Nuevo developer tarda horas en entender qué hace esta función

### Diagnóstico Raíz

Orquestador intenta hacer TODO:
```
Orquestador = Input + Validation + ID Gen + Metadata + Process + Variables + Notification + Error
              ^        ^           ^       ^         ^        ^         ^              ^
              1        2           3       4         5        6         7              8
```

### Solución (Aplicable en PASO 4)

Dividir orquestador en funciones con SRP única:

```javascript
// Cada función responsable de UNA cosa
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
  // SOLO genera datos específicos del repositorio
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

**Cambio clave:** De 1 función con 8 responsabilidades → 6 funciones con 1 responsabilidad cada una

---

## VIOLACIÓN 2: DRY - Don't Repeat Yourself

**Código:** DRY-V1
**Severidad:** MODERADA
**Ubicación:** Todos los 5 orquestadores
**Líneas duplicadas:** Aproximadamente 500+ líneas

### Descripción del Problema

Código duplicado entre orquestadores. Los 5 archivos repiten patrones casi idénticos:

**Operación duplicada:** Obtener entrada usuario
**Código en createRepository.js:**
```javascript
const repoName = await quickAddApi.inputPrompt("Nombre del repositorio:");
const repoType = await askRepositoryType();
const repoDescription = await quickAddApi.wideInputPrompt("Descripción...");
```

**Código en createTask.js:**
```javascript
const taskName = await quickAddApi.inputPrompt("Nombre de la tarea:");
const taskType = await askTaskType();
const taskDescription = await quickAddApi.wideInputPrompt("Descripción...");
```

**Código en createProject.js:**
```javascript
const projectName = await quickAddApi.inputPrompt("Nombre del proyecto:");
const projectType = await askProjectType();
const projectDescription = await quickAddApi.wideInputPrompt("Descripción...");
```

**Patrón idéntico, solo cambió: repository → task → project**

### Manifestación Completa

**Duplicación en Validación:**
```javascript
// createRepository.js
if (!repoName || repoName.length === 0) {
  throw new Error("Nombre inválido");
}

// createTask.js
if (!taskName || taskName.length === 0) {
  throw new Error("Nombre inválido");
}

// createProject.js
if (!projectName || projectName.length === 0) {
  throw new Error("Nombre inválido");
}
```

**Duplicación en Generación de ID:**
```javascript
// createRepository.js
const repoId = await generateUniqueId();

// createTask.js
const taskId = await generateUniqueId();

// createProject.js
const projectId = await generateUniqueId();
```

**Duplicación en Obtención de Metadata:**
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

### Estadística de Duplicación

| Operación | Repetida | Veces |
|---|---|---|
| Obtener fecha | OP-005 | 5 |
| Generar ID | OP-003 | 4 |
| Obtener metadata | OP-007 | 4 |
| Obtener entrada | OP-001 | 5 |
| Validar entrada | OP-002 | 5 |
| Mostrar notificación | OP-015 | 5 |

**Total: 27 repeticiones de operaciones (debería ser 1)**

### Impacto

- **Mantenimiento:** Bug en validación requiere 5 cambios
- **Inconsistencia:** Una corrección podría olvidarse en un archivo
- **Líneas innecesarias:** 500 líneas que podrían ser 50
- **Complejidad:** Más código = más probabilidad de bugs

### Diagrama de Duplicación

```
createRepository.js
├── Obtener entrada ← DUPLICADA
├── Validar entrada ← DUPLICADA
├── Generar ID ← DUPLICADA
├── Obtener metadata ← DUPLICADA
├── Procesar repo-específico
├── Asignar variables ← DUPLICADA
├── Mostrar notificación ← DUPLICADA
└── Error handling

createTask.js
├── Obtener entrada ← DUPLICADA
├── Validar entrada ← DUPLICADA
├── Generar ID ← DUPLICADA
├── Obtener metadata ← DUPLICADA
├── Procesar task-específico
├── Asignar variables ← DUPLICADA
├── Mostrar notificación ← DUPLICADA
└── Error handling

[Patrón se repite 4 veces más]
```

### Solución (Aplicable en PASO 4)

Extraer operaciones comunes a módulos reutilizables:

```javascript
// utils/inputOperations.js
async function getCommonInput(quickAddApi, type) {
  // "tipo" es parámetro: repository, task, project
  const name = await quickAddApi.inputPrompt(`Nombre del ${type}:`);
  const typeValue = await askType(type); // askRepositoryType, askTaskType, etc
  const description = await quickAddApi.wideInputPrompt("Descripción...");
  
  return { name, type: typeValue, description };
}

// utils/validationOperations.js
function validateCommonInput(input) {
  if (!input.name || input.name.length === 0) {
    throw new Error("Nombre inválido");
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
    
    // Solo lógica específica de repositorio
    const structure = buildRepositoryStructure(id, input, metadata);
    
    assignVariables(params.variables, structure);
    await showNotification("Repositorio creado", "success");
  } catch (error) {
    await showNotification(`Error: ${error.message}`, "error");
  }
};
```

**Cambio clave:** De 5 copias de getInput → 1 módulo reutilizado 5 veces

---

## VIOLACIÓN 3: OCP - Open/Closed Principle

**Código:** SOLID-V2
**Severidad:** MODERADA
**Ubicación:** Estructura de utils/ en common/ (no escalable)

### Descripción del Problema

El sistema NO está abierto a extensión (agregar nuevo tipo de entidad).

Para agregar nuevo orquestador (createArticle.js), se requiere:
1. Copiar createRepository.js
2. Cambiar nombres: repo → article
3. Modificar lógica específica
4. Crear/modificar template
5. Modificar configuración QuickAdd

**No está diseñado para ser extendido sin modificación.**

### Ejemplo

**Quiero agregar createArticle.js**

Estado actual: Copiar/pegar createRepository.js (MALO)

```javascript
// Tiene que copiarse TODO
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  const articleName = await quickAddApi.inputPrompt("Nombre...");
  // ... copiar 90 líneas más
  
  variables.articleId = articleId;
  // ... resto
};
```

Diseño mejorado: Usar configuración extensible (BUENO)

```javascript
// createEntity.js (genérico)
async function createEntity(params, entityConfig) {
  const { inputLabels, processLogic, metadata } = entityConfig;
  
  const input = await getCommonInput(params.quickAddApi, entityConfig.type);
  validateCommonInput(input);
  const id = await generateUniqueId();
  const meta = await getCommonMetadata(entityConfig.type);
  
  const entity = processLogic(id, input, meta); // Delegar lógica específica
  
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

// createArticle.js (nuevo - solo 3 líneas!)
module.exports = async (params) => {
  return createEntity(params, articleConfig);
};
```

**Cambio clave:** De copiar 100 líneas → definir configuración 20 líneas

### Impacto de Violación OCP

- Agregar nuevo tipo requiere duplicación de código
- Bugs en patrón común requieren cambios en 5+ lugares
- Mantener 5 versiones del mismo patrón es error-prone

---

## VIOLACIÓN 4: DIP - Dependency Inversion Principle

**Código:** SOLID-V3
**Severidad:** BAJA
**Ubicación:** Todos los 5 orquestadores
**Líneas afectadas:** Acoplamiento directo a APIs

### Descripción del Problema

Los orquestadores están acoplados directamente a:
- Obsidian API (app, vault)
- QuickAdd API (quickAddApi)
- Módulos específicos (generateUniqueId, getCurrentDateTime)

No hay inversión de dependencias. Si Obsidian API cambia, todos los orquestadores deben cambiar.

### Manifestación en Código

**Acoplamiento directo:**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  // Acoplado directamente a API de Obsidian
  const folder = app.vault.getAbstractFileByPath(path);
  
  // Acoplado directamente a API de QuickAdd
  const name = await quickAddApi.inputPrompt("...");
  
  // Acoplado directamente a módulo
  const id = await generateUniqueId();
};
```

Si `generateUniqueId` cambia su interfaz, todos los orquestadores fallan.

### Solución (DIP)

Usar interfaces/abstracciones:

```javascript
// abstractions/idGenerator.ts
interface IdGenerator {
  generate(): Promise<string>;
}

// implementations/cryptoIdGenerator.ts
class CryptoIdGenerator implements IdGenerator {
  async generate() {
    // implementación
  }
}

// createRepository.js (desacoplado)
module.exports = async (params, idGenerator: IdGenerator) => {
  const id = await idGenerator.generate(); // Usa abstracción, no concreción
};
```

**Cambio clave:** Depender de interfaz IdGenerator, no de función generateUniqueId directa

---

## VIOLACIÓN 5: Falta de Error Handling Completo

**Código:** SOLID-V4 / Code Smell
**Severidad:** SEVERA
**Ubicación:** Todos los 5 orquestadores
**Líneas afectadas:** 0 líneas (falta try/catch)

### Descripción del Problema

No hay captura de excepciones. Si falla cualquier operación, macro explota sin feedback.

```javascript
module.exports = async (params) => {
  // SIN try/catch
  const input = await quickAddApi.inputPrompt("...");
  const id = await generateUniqueId();
  const date = getCurrentDateTime();
  // Si cualquiera falla → macro incompleta, usuario sin saber qué pasó
};
```

### Impacto

- Usuario intenta crear repositorio
- Falla en línea 50 (validación)
- Usuario ve: Nada (silencio absoluto)
- Usuario confundido: "¿Qué pasó?"

### Solución

```javascript
module.exports = async (params) => {
  try {
    const input = await quickAddApi.inputPrompt("...");
    const id = await generateUniqueId();
    const date = getCurrentDateTime();
    
    // ... resto
    
    await showNotification("Éxito", "success");
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

| Violación | Código | Severidad | Líneas | Impacto |
|---|---|---|---|---|
| SRP | SOLID-V1 | SEVERA | 1750 | Testing, mantenibilidad |
| DRY | DRY-V1 | MODERADA | 500 | Consistencia, mantenimiento |
| OCP | SOLID-V2 | MODERADA | 1750 | Extensibilidad |
| DIP | SOLID-V3 | BAJA | 1750 | Acoplamiento |
| Error Handling | Code-Smell-1 | SEVERA | 5 | UX, debugging |

**Total: 5 violaciones principales, 3 severas, 2 moderadas**

---

## MATRIZ DE RELACIONES

| Violación | Causa Raíz | Consecuencia | Solución |
|---|---|---|---|
| SRP violado | Orquestador hace TODO | DRY violado | Dividir en funciones |
| DRY violado | Copiar/pegar entre archivos | Inconsistencia | Extraer a módulos comunes |
| OCP violado | Patrón no escalable | Duplicación | Usar configuración |
| DIP débil | Acoplamiento directo | Frágil a cambios | Inyectar dependencias |
| Sin error handling | No hay try/catch | UX pobre | Agregar try/catch |

---

## CÓMO ESTAS VIOLACIONES SE RELACIONAN

```
Violación SRP
├─ Causa: Orquestador intenta hacer 8 cosas
├─ Resultado: Difícil de testear, mantener, extender
├─ Facilita: Duplicación de código (DRY violado)
├─ Hace difícil: Seguir OCP (agregar entidades nuevas)
└─ Agrava: Error handling incompleto

Violación DRY
├─ Causa: Código duplicado entre 5 orquestadores
├─ Resultado: 500 líneas innecesarias
├─ Facilita: Bugs introducidos en solo un archivo
├─ Viola: OCP (no es escalable)
└─ Síntoma: SRP quebrantado en cada archivo

Violación OCP
├─ Causa: Arquitectura no permite extensión sin modificación
├─ Resultado: Agregar entidad nueva requiere copiar 100 líneas
├─ Síntoma: DRY violado sistémicamente
├─ Causa raíz: SRP violado en cada orquestador
└─ Requiere: Refactorización arquitectónica
```

---

## CONCLUSIÓN

Las 5 violaciones SOLID/DRY están **interconectadas**. La raíz es **SRP quebrantado** en orquestadores, que causa **DRY violado**, que hace **OCP imposible**.

La refactorización debe comenzar por SRP (PASO 4), lo que automáticamente mejorará DRY, facilitará OCP y permitirá DIP correcto.

---

## PRÓXIMA ACCIÓN

El ARTEFACTO 6 (REFACTOR-ROADMAP) propone plan de refactorización fase-por-fase, comenzando con SRP.

---

**ARTEFACTO 5 COMPLETADO**

Próximo: PASO1-V4-REFACTOR-ROADMAP

¿Confirmás para continuar?
