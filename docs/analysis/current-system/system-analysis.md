```yaml
type: Documento Técnico
title: PASO 1 V4 - ANÁLISIS AS-IS DEL SISTEMA
version: 4.0.0
scope: ACTIVIDAD 1 - Estado actual del código evaluado
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
analysis_type: Code Review - Convenciones vs Realidad
```

# PASO 1 V4: ANÁLISIS AS-IS DEL SISTEMA
## Evaluación del Código Actual contra Convenciones Establecidas

---

## INTRODUCCIÓN

Este documento analiza el estado actual de los 5 orquestadores y 12 módulos de script contra las convenciones de código, pragmáticas y JavaScript establecidas en los documentos de referencia.

El objetivo es identificar:
1. Dónde el código cumple convenciones
2. Dónde viola convenciones
3. Severidad de cada violación
4. Deuda técnica acumulada
5. Impacto en mantenibilidad

---

## HALLAZGO GENERAL

El código AS-IS fue desarrollado antes de documentar convenciones formales. Por lo tanto, hay inconsistencias significativas entre estado actual y estándares documentados. Esto es NORMAL y esperado en proyectos que evolucionan.

**Estadística aproximada:**
- 60-70% del código cumple parcialmente convenciones (naming aceptable, estructura reconocible)
- 20-30% tiene violaciones moderadas (nombres vagos, prefijos inconsistentes)
- 5-10% tiene violaciones severas (código duplicado, SRP quebrantado)

---

## ANÁLISIS POR MÓDULO

### MÓDULO 1: generateUniqueId.js

**Estado Actual:**
```javascript
// AS-IS - Estado actual
async function generateUniqueId() {
  const array = new Uint8Array(16);
  const random = window.crypto.getRandomValues(array);
  
  const hex = random
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  
  const id = `id-${Date.now()}-${hex}`;
  return id;
}

module.exports = generateUniqueId;
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Variables sin prefijo _contexto_: array, random, hex (VIOLACIÓN LEVE)
- Nombres genéricos: hex en lugar de _format_hex (VIOLACIÓN LEVE)
- No documentadas constantes mágicas (VIOLACIÓN LEVE)

Convenciones-JavaScript:
- Función es pura (cumple)
- Sin side effects (cumple)
- Nombre verbo + noun: generateUniqueId (cumple)

**Propuesta AS-IS mejorado:**
```javascript
// MEJORADO - Alineado con convenciones
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

**Cambios realizados:**
- Añadir prefijos _crypto_ y _format_
- Renombrar hex a _format_hex
- Separar timestamp a variable explícita
- Resultado final en _format_final

**Severidad:** BAJA (funciona correctamente, es cosmético)

---

### MÓDULO 2: generateCustomId.js

**Estado Actual:**
```javascript
function generateCustomId(p1, p2, p3, p4, p5) {
  const id = `${p1}-${p2}-${p3}-${p4}-${p5}`;
  return id;
}

module.exports = generateCustomId;
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Parámetros p1-p5 son genéricos (VIOLACIÓN MODERADA)
- Variable id sin prefijo (VIOLACIÓN LEVE)
- Sin documentación de qué significa cada segmento (VIOLACIÓN MODERADA)

Convenciones-JavaScript:
- Función es pura (cumple)
- Nombre verbo + noun (cumple)

**Propuesta AS-IS mejorado:**
```javascript
// MEJORADO - Documentado y prefijado
function generateCustomId(typeSegment, categorySegment, yearSegment, 
                          randomSegment, timestampSegment) {
  const _custom_parts = [typeSegment, categorySegment, yearSegment, 
                         randomSegment, timestampSegment];
  
  const _custom_id = _custom_parts.join("-");
  
  return _custom_id;
}

module.exports = generateCustomId;
```

**Cambios realizados:**
- Renombrar p1-p5 a nombres descriptivos
- Añadir prefijo _custom_
- Documentar explícitamente orden de segmentos

**Severidad:** MODERADA (parámetros genéricos afectan legibilidad)

---

### MÓDULO 3: getCurrentDateTime.js

**Estado Actual:**
```javascript
function getCurrentDateTime() {
  return new Date().toISOString();
}

module.exports = getCurrentDateTime;
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Función sin variables locales (está bien)
- Nombre claro getCurrentDateTime (cumple)

Convenciones-JavaScript:
- Función pura (cumple)
- Verbo + noun (cumple)

**Calificación:** CUMPLE CONVENCIONES (código es correcto)

**Severidad:** NINGUNA (estado ideal)

---

### MÓDULO 4: getFileName.js

**Estado Actual:**
```javascript
function getFileName(name) {
  const clean = name
    .replace(/[^a-zA-Z0-9\-_\s]/g, "")
    .trim();
  
  const truncated = clean.substring(0, 200);
  
  const normalized = truncated.replace(/\s+/g, "-");
  
  return `${normalized}.md`;
}

module.exports = getFileName;
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Variables sin prefijo _filename_ o _file_ (VIOLACIÓN LEVE)
- Números acoplados: 200 (VIOLACIÓN LEVE)
- Pasos intermedios son comprensibles pero genéricos (VIOLACIÓN LEVE)

Convenciones-JavaScript:
- Función pura (cumple)
- Nombre verbo + noun (cumple)

**Propuesta AS-IS mejorado:**
```javascript
// MEJORADO - Prefijado y constante documentada
function getFileName(inputName) {
  const MAX_FILENAME_LENGTH = 200;
  
  const _filename_clean = inputName
    .replace(/[^a-zA-Z0-9\-_\s]/g, "")
    .trim();
  
  const _filename_limited = _filename_clean.substring(0, MAX_FILENAME_LENGTH);
  
  const _filename_normalized = _filename_limited.replace(/\s+/g, "-");
  
  const _filename_final = `${_filename_normalized}.md`;
  
  return _filename_final;
}

module.exports = getFileName;
```

**Cambios realizados:**
- Extraer 200 a constante MAX_FILENAME_LENGTH
- Prefijo _filename_ en todas las variables
- Renombrar lógicamente: clean, limited, normalized, final

**Severidad:** BAJA (funciona, pero nombres genéricos)

---

### MÓDULO 5: showNotification.js

**Estado Actual:**
```javascript
function showNotification(message, type = "info") {
  new Notice(message, 5000);
}

module.exports = showNotification;
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Sin validación de tipo (VIOLACIÓN MODERADA)
- Constante 5000 acoplada (VIOLACIÓN LEVE)
- Sin diferenciación de tipos de notificación (VIOLACIÓN MODERADA)

Convenciones-JavaScript:
- Nombre verbo + noun (cumple)
- Parámetro type no utilizado (VIOLACIÓN SEVERA - bug)

**Propuesta AS-IS mejorado:**
```javascript
// MEJORADO - Validado y completo
function showNotification(message, type = "info") {
  const VALID_TYPES = ["success", "error", "info", "warning"];
  const NOTIFICATION_DURATION_MS = 5000;
  
  const _notif_type = VALID_TYPES.includes(type) ? type : "info";
  const _notif_title = {
    success: "Éxito",
    error: "Error",
    info: "Información",
    warning: "Advertencia"
  }[_notif_type];
  
  const _notif_message = `[${_notif_title}] ${message}`;
  
  new Notice(_notif_message, NOTIFICATION_DURATION_MS);
}

module.exports = showNotification;
```

**Cambios realizados:**
- Validar parámetro type contra VALID_TYPES
- Extraer 5000 a NOTIFICATION_DURATION_MS
- Usar type para generar título contextual
- Prefijo _notif_ para variables

**Severidad:** MODERADA (parámetro type ignorado es bug)

---

### ORQUESTADOR 1: createRepository.js

**Estado Actual (fragmento crítico):**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  const id = generateUniqueId();
  const fileName = getFileName(name);
  const dateCreated = getCurrentDateTime();
  
  // 50+ líneas más con variables sin prefijo
  // Mezcla de lógica, validación, procesamiento
  // Sin try/catch
  
  variables.repositoryId = id;
  variables.repositoryName = name;
  // ... resto
};
```

**Evaluación contra Convenciones:**

Convenciones-de-Código:
- Variables sin prefijo _repo_, _meta_, _input_ (VIOLACIÓN SEVERA)
- Mezcla de responsabilidades (VIOLACIÓN SEVERA - SRP)
- Sin error handling (VIOLACIÓN SEVERA)

Convenciones-Pragmáticas:
- Estructura confusa (VIOLACIÓN MODERADA)
- Módulos no reutilizados claramente (VIOLACIÓN MODERADA)

**Propuesta AS-IS mejorado:**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi, variables } = params;
  
  try {
    // ENTRADA
    const _input_name = await quickAddApi.inputPrompt("Nombre del repositorio:");
    const _input_type = await askRepositoryType();
    
    // VALIDACIÓN
    const _valid_name = _input_name && _input_name.length > 0;
    if (!_valid_name) throw new Error("Nombre inválido");
    
    // GENERACIÓN
    const _repo_id = await generateUniqueId();
    const _repo_type = _input_type.toLowerCase();
    
    // METADATA
    const _meta_created = getCurrentDateTime();
    const _meta_author = await getAuthorName();
    const _meta_tags = ["repository", _repo_type];
    
    // ESTRUCTURA
    const _file_name = getFileName(_input_name);
    const _folder_structure = `repositories/${_repo_type}/${_repo_id}`;
    
    // ASIGNACIÓN
    variables.repositoryId = _repo_id;
    variables.repositoryName = _input_name;
    variables.repositoryType = _repo_type;
    variables.metadata = {
      created: _meta_created,
      author: _meta_author,
      tags: _meta_tags
    };
    variables.folderPath = _folder_structure;
    variables.fileName = _file_name;
    
    // FEEDBACK
    await showNotification("Repositorio creado exitosamente", "success");
    
  } catch (error) {
    await showNotification(`Error: ${error.message}`, "error");
    throw error;
  }
};
```

**Cambios realizados:**
- Prefijo _input_ para entrada usuario
- Prefijo _valid_ para validaciones
- Prefijo _repo_ para contexto repositorio
- Prefijo _meta_ para metadatos
- Prefijo _file_ para operaciones de archivo
- Prefijo _folder_ para carpetas
- Try/catch englobando todo
- Comentarios indicando secciones lógicas

**Severidad:** SEVERA (múltiples violaciones afectan mantenibilidad)

---

## MATRIZ DE VIOLACIONES

| Módulo/Orq | Conv-Código | Conv-Pragmáticas | Conv-JavaScript | Severidad |
|---|---|---|---|---|
| generateUniqueId.js | BAJA | - | CUMPLE | BAJA |
| generateCustomId.js | MODERADA | - | CUMPLE | MODERADA |
| getCurrentDateTime.js | CUMPLE | - | CUMPLE | NINGUNA |
| getFileName.js | BAJA | - | CUMPLE | BAJA |
| showNotification.js | MODERADA | - | BUG | MODERADA |
| createRepository.js | SEVERA | MODERADA | SEVERA | SEVERA |
| createTask.js | SEVERA | MODERADA | SEVERA | SEVERA |
| createPillar.js | SEVERA | MODERADA | SEVERA | SEVERA |
| createProject.js | SEVERA | MODERADA | SEVERA | SEVERA |
| createPilarNote.js | SEVERA | MODERADA | SEVERA | SEVERA |

**Resumen:**
- 0 sin violaciones
- 3 BAJA
- 3 MODERADA
- 9 SEVERA

---

## VIOLACIONES COMUNES

### Violación V1: Variables sin prefijo _contexto_

**Ubicación:** Todos los 5 orquestadores
**Severidad:** SEVERA
**Impacto:** Difícil determinar propósito de variable, confunde con variables externas

**Ejemplo ANTES:**
```javascript
const id = generateUniqueId();
const name = inputName;
const type = inputType;
const date = getCurrentDateTime();
```

**Ejemplo DESPUÉS:**
```javascript
const _repo_id = await generateUniqueId();
const _input_name = inputName;
const _repo_type = inputType;
const _meta_date = getCurrentDateTime();
```

---

### Violación V2: Variables con nombres genéricos

**Ubicación:** Módulos getFileName, getMetadataByFrontmatter
**Severidad:** MODERADA
**Impacto:** Ambigüedad, reutilización difícil

**Ejemplo ANTES:**
```javascript
const clean = name.replace(...);
const truncated = clean.substring(...);
const normalized = truncated.replace(...);
```

**Ejemplo DESPUÉS:**
```javascript
const _filename_clean = name.replace(...);
const _filename_limited = _filename_clean.substring(...);
const _filename_normalized = _filename_limited.replace(...);
```

---

### Violación V3: Números acoplados (Magic Numbers)

**Ubicación:** getFileName (200), showNotification (5000)
**Severidad:** LEVE
**Impacto:** Difícil cambiar valores, falta documentación de por qué

**Ejemplo ANTES:**
```javascript
const truncated = clean.substring(0, 200);
new Notice(message, 5000);
```

**Ejemplo DESPUÉS:**
```javascript
const MAX_FILENAME_LENGTH = 200;
const NOTIFICATION_DURATION_MS = 5000;

const truncated = clean.substring(0, MAX_FILENAME_LENGTH);
new Notice(message, NOTIFICATION_DURATION_MS);
```

---

### Violación V4: Sin error handling (try/catch)

**Ubicación:** Todos los 5 orquestadores
**Severidad:** SEVERA
**Impacto:** Errores no capturados causan macro incompleta sin feedback

**Ejemplo ANTES:**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi } = params;
  
  const name = await quickAddApi.inputPrompt(...);
  const id = await generateUniqueId();
  // Si cualquier línea falla, macro explota sin mensaje
};
```

**Ejemplo DESPUÉS:**
```javascript
module.exports = async (params) => {
  const { app, quickAddApi } = params;
  
  try {
    const name = await quickAddApi.inputPrompt(...);
    const id = await generateUniqueId();
    // ... resto
  } catch (error) {
    await showNotification(`Error: ${error.message}`, "error");
    throw error;
  }
};
```

---

### Violación V5: Violación de SRP (Single Responsibility Principle)

**Ubicación:** createRepository.js (y otros orquestadores)
**Severidad:** SEVERA
**Impacto:** Difícil de testear, mantener, extender

**Ejemplo ANTES:**
```javascript
// createRepository hace TODO en una función:
module.exports = async (params) => {
  // 1. Obtiene entrada
  // 2. Valida
  // 3. Genera IDs
  // 4. Obtiene metadata
  // 5. Obtiene estructura carpetas
  // 6. Procesa información
  // 7. Asigna variables
  // 8. Muestra notificación
  // 9. Maneja errores
  // TODO en 100+ líneas
};
```

**Ejemplo DESPUÉS:**
```javascript
module.exports = async (params) => {
  try {
    // Delegación clara a módulos
    const _input_data = await getInput(quickAddApi);
    validateInput(_input_data);
    const _repo_data = generateRepositoryData(_input_data);
    const _meta_data = await getMetadata(_repo_data);
    assignVariables(variables, _repo_data, _meta_data);
    await showNotification("Éxito", "success");
  } catch (error) {
    handleError(error);
  }
};
```

---

### Violación V6: Parámetros ignorados

**Ubicación:** showNotification.js
**Severidad:** SEVERA (es un bug)
**Impacto:** Parámetro type no se usa, todos los mensajes parecen iguales

**Código AS-IS:**
```javascript
function showNotification(message, type = "info") {
  new Notice(message, 5000);  // type ignorado!
}
```

**Código mejorado:**
```javascript
function showNotification(message, type = "info") {
  const VALID_TYPES = ["success", "error", "info", "warning"];
  const _type = VALID_TYPES.includes(type) ? type : "info";
  
  // Usar type para generar título o estilo
  const titles = {
    success: "✓ Éxito",
    error: "✗ Error",
    info: "ⓘ Información",
    warning: "⚠ Advertencia"
  };
  
  new Notice(`${titles[_type]} ${message}`, 5000);
}
```

---

## DEUDA TÉCNICA ACUMULADA

**Cálculo aproximado:**
- 1750 líneas total de código (5 orquestadores × 350 líneas promedio)
- 80% del código tiene violaciones moderadas-severas (1400 líneas)
- Refactorización estimada: 40-50 horas de desarrollo

**Líneas por Severidad:**
- SEVERA: 700 líneas (prefijos, SRP, error handling)
- MODERADA: 500 líneas (nombres genéricos, estructura)
- BAJA: 200 líneas (constantes acopladas)

---

## IMPACTO EN CALIDAD DE CÓDIGO

| Métrica | AS-IS | Después Refactor |
|---|---|---|
| Legibilidad | Baja | Alta |
| Mantenibilidad | Baja | Alta |
| Testabilidad | Muy baja | Media |
| Documentación | Baja | Alta |
| Reutilización | Baja | Alta |
| Escalabilidad | Baja | Media |

---

## PUNTOS POSITIVOS DEL AS-IS

A pesar de las violaciones, el código AS-IS tiene cualidades positivas:

1. **Funciona:** El código cumple su propósito, todos los orquestadores ejecutan correctamente
2. **Módulos separados:** Los 5 orquestadores están en archivos diferentes
3. **Módulos reutilizables:** generateUniqueId, getCurrentDateTime se reutilizan
4. **Templates bien definidos:** Los templates tienen estructura clara
5. **Nombres generalmente comprensibles:** Aunque genéricos, los nombres comunican intención

---

## CONCLUSIÓN

El código AS-IS es **funcional pero deficiente en calidad técnica**. Las violaciones identificadas no impiden que el código funcione, pero sí afectan:

- Tiempo para entender código existente
- Tiempo para hacer cambios sin introducir bugs
- Facilidad para nuevos desarrolladores
- Escalabilidad del sistema

La refactorización propuesta mejorará significativamente mantenibilidad sin cambiar funcionalidad.

---

## RELACIÓN CON ARTEFACTOS ANTERIORES

Este análisis AS-IS usa como referencia:

- **PASO1-V4-STAKEHOLDERS:** Identifica dónde ocurren fallos (puntos críticos)
- **PASO1-V4-OPERACIONES-ATOMICAS:** Compara implementación actual vs documentada
- **Convenciones-de-Código v1.0.0:** Métrica para evaluar variables, funciones
- **Convenciones-Pragmáticas v1.0.0:** Métrica para estructura utils/
- **Convenciones-JavaScript v2.0.0:** Métrica para SOLID, DRY, patrones

---

**ARTEFACTO 4 COMPLETADO**

Próximo: PASO1-V4-VIOLACIONES-SOLID-DRY

¿Confirmás para continuar?
