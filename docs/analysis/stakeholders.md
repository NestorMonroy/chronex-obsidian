```yaml
type: Documento Técnico
title: PASO 1 V4 - IDENTIFICACIÓN DE STAKEHOLDERS
version: 4.0.0
scope: ACTIVIDAD 1 - Obsidian Vault - QuickAdd Scripts
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Análisis Completado
```

# PASO 1 V4: IDENTIFICACIÓN DE STAKEHOLDERS
## Análisis de Actores y Responsabilidades

---

## INTRODUCCIÓN

Este documento identifica y caracteriza los 6 stakeholders que participan en el sistema ACTIVIDAD 1 del vault Obsidian. Cada stakeholder tiene responsabilidades específicas, interacciones definidas y dependencias con otros actores.

El análisis de stakeholders es fundamental para comprender:
- Quién ORQUESTAmqué operaciones
- Dónde se generan datos
- Cómo fluyen los datos entre actores
- Quién tiene la responsabilidad de validación
- Dónde ocurren fallos potenciales

---

## 1. USUARIO (NESTOR)

**Código:** SH-001
**Clasificación:** Actor Primario (Human)
**Responsabilidad Principal:** Iniciar y controlar flujos de trabajo

### Características

**Descripción Funcional:**
El usuario es quién inicia las operaciones de ACTIVIDAD 1. A través de la interfaz de Obsidian, selecciona acciones (crear repositorio, crear tarea, crear pillar) y proporciona entrada mediante prompts interactivos de QuickAdd.

**Responsabilidades Específicas:**
- Iniciar macros de QuickAdd mediante command palette
- Proporcionar datos solicitados en prompts (nombres, descripciones, tipos, prioridades)
- Validar datos ingresados antes de confirmar
- Revisar resultados generados
- Tomar decisiones sobre estructura del vault

**Dependencias:**
- Depende del Plugin QuickAdd para interfaz de interacción
- Depende de templates para visualizar estructura
- Requiere que Obsidian esté abierto con vault activo

**Puntos de Fallo Potenciales:**
- Cancelar operación durante prompts
- Ingresar datos inválidos (strings vacios, caracteres especiales)
- Realizar operaciones sin validar precondiciones

---

## 2. PLUGIN QUICKADD

**Código:** SH-002
**Clasificación:** Actor Secundario (Sistema - Executor)
**Responsabilidad Principal:** Ejecutar macros y scripts según instrucciones

### Características

**Descripción Funcional:**
QuickAdd es el motor de ejecución que orquesta múltiples pasos: ejecuta scripts, recopila valores de usuario mediante prompts interactivos, ejecuta templates y maneja el flujo de operaciones. Es responsable de cargar archivos JavaScript y ejecutarlos con contexto adecuado.

**Responsabilidades Específicas:**
- Cargar scripts desde folder scripts/ correcto
- Pasar parámetros (app, quickAddApi, variables) a cada script
- Ejecutar prompts interactivos (inputPrompt, suggester, checkboxPrompt)
- Ejecutar templates con variables proporcionadas
- Manejar errores de script con try/catch
- Proporcionar retroalimentación visual al usuario

**Dependencias:**
- Depende del archivo manifest.json para configuración
- Depende de scripts ubicados en vault (rutas relativas)
- Requiere que templates existan en paths especificados
- Integración con Obsidian API (app, vault, workspace)

**Puntos de Fallo Potenciales:**
- Script no encontrado en path especificado
- Variables no inicializadas antes de template
- Errores no capturados en script causan macro incompleta
- Template contiene {{}} inválido que QuickAdd no entiende

---

## 3. OBSIDIAN CORE

**Código:** SH-003
**Clasificación:** Actor Terciario (Infrastructure - Platform)
**Responsabilidad Principal:** Proporcionar plataforma base y APIs

### Características

**Descripción Funcional:**
Obsidian es la plataforma base que proporciona acceso al vault, al sistema de archivos, a metadatos de notas y a APIs para plugins. Sin Obsidian, ningún plugin o script podría funcionar.

**Responsabilidades Específicas:**
- Mantener integridad del vault (sincronización, backups)
- Proporcionar API de acceso a archivo (vault.create, vault.read, vault.modify)
- Proporcionar metadata cache (metadataCache)
- Proporcionar workspace API (getActiveFile, workspace.openLeaf)
- Validar permisos de archivo y acceso
- Mantener índice de archivos y carpetas

**Dependencias:**
- Depende del sistema operativo para acceso a filesystem
- Requiere que vault esté abierto y válido
- Sincronización con plugins registrados

**Puntos de Fallo Potenciales:**
- Vault no sincronizado correctamente
- Permisos insuficientes para crear carpetas/archivos
- Rutas mal formadas o con caracteres inválidos
- Archivos abiertos en otros editores (conflictos de escritura)

---

## 4. TEMPLATE QUICKADD

**Código:** SH-004
**Clasificación:** Actor Terciario (Application - Consumer)
**Responsabilidad Principal:** Consumir variables y generar contenido

### Características

**Descripción Funcional:**
Las templates de QuickAdd son archivos Markdown con placeholders especiales ({{VALUE:...}}, {{VARIABLE:...}}, {{DATE:...}}) que se reemplazan con valores durante ejecución. Las templates definen la estructura final de las notas generadas.

**Responsabilidades Específicas:**
- Definir estructura y formato de notas generadas
- Especificar placeholders {{}} correctos
- Incluir frontmatter con propiedades YAML
- Proporcionar contenido boilerplate
- Comunicar campos requeridos mediante nombres de placeholders

**Dependencias:**
- Depende de QuickAdd para reemplazar placeholders
- Requiere que variables existan con nombres específicos
- Depende de Obsidian para renderizar Markdown final

**Puntos de Fallo Potenciales:**
- Placeholders con nombre incorrecto no se reemplazan
- YAML frontmatter inválido causa errores de parsing
- Variables no definidas quedan como literales {{VAR}}
- Caracteres especiales en template causan salida corrupta

---

## 5. MÓDULOS DE SCRIPT (UTILITIES)

**Código:** SH-005
**Clasificación:** Actor Secundario (Code - Auxiliary)
**Responsabilidad Principal:** Proporcionar funcionalidad reutilizable a orquestadores

### Características

**Descripción Funcional:**
Los módulos de script son funciones JavaScript reusables ubicadas en folder utils/ (o utils/subcarpetas según opción elegida). Cada módulo proporciona funcionalidad específica: generar IDs, obtener fecha actual, validar datos, etc. Los orquestadores (createRepository.js, createTask.js, etc) los importan y usan.

**Responsabilidades Específicas:**
- Generar identificadores únicos (generateUniqueId, generateCustomId)
- Obtener y formatear fechas (getCurrentDateTime)
- Validar datos de entrada (validateRepositoryName, getMetadataByFrontmatter)
- Obtener metadatos de archivos (getMetadataByFrontmatter)
- Proporcionar notificaciones al usuario (showNotification)
- Calcular rutas y nombres de archivo (getFileName)

**Dependencias:**
- Dependen de Obsidian API para operaciones de archivo
- Requieren que QuickAdd pase contexto (app, quickAddApi)
- Se usan solamente desde scripts orquestadores

**Puntos de Fallo Potenciales:**
- Nombres de módulos ambiguos (utils.js vago)
- Funciones sin propósito claro (helpers.js)
- Reutilización no documentada
- Violaciones de SRP (single responsibility principle)

---

## 6. SISTEMA OPERATIVO

**Código:** SH-006
**Clasificación:** Actor Cuaternario (Infrastructure - Base)
**Responsabilidad Principal:** Validar y almacenar datos en filesystem

### Características

**Descripción Funcional:**
El sistema operativo es la capa base que valida operaciones de lectura/escritura de archivos, mantiene permisos, gestiona el filesystem y almacena datos permanentemente.

**Responsabilidades Específicas:**
- Validar permisos de lectura/escritura
- Mantener integridad de archivos
- Prevenir acceso simultáneo a archivos
- Almacenar datos permanentemente
- Generar errores si operación es inválida

**Dependencias:**
- Depende del hardware para almacenamiento
- Requiere que rutas sean válidas según SO

**Puntos de Fallo Potenciales:**
- Rutas con caracteres inválidos para el SO
- Intentar escribir en directorio sin permisos
- Espacio en disco insuficiente
- Rutas con espacios o caracteres unicode no escapados

---

## MATRIZ DE INTERACCIONES

| Stakeholder | Inicia | Usa | Proporciona | Depende |
|---|---|---|---|---|
| **Usuario (SH-001)** | Macros | Obsidian, QuickAdd | Datos de entrada | Obsidian, QuickAdd |
| **QuickAdd (SH-002)** | Scripts | Obsidian API, Modules | Ejecución, context | User, Scripts, Templates |
| **Obsidian (SH-003)** | - | SO API | Vault access, API | SO, Filesystem |
| **Template (SH-004)** | - | Variables | Contenido generado | QuickAdd, Variables |
| **Modules (SH-005)** | - | Obsidian API | Funcionalidad | Obsidian API |
| **SO (SH-006)** | - | Hardware | Persistencia | Hardware |

---

## FLUJO DE DATOS: EJEMPLO ACTIVIDAD

Ejemplo: Usuario crea un repositorio nuevo

```
1. Usuario (SH-001) selecciona "Crear Repository" en command palette
   |
   V
2. QuickAdd (SH-002) carga createRepository.js
   - Pasa (app, quickAddApi, variables) a script
   |
   V
3. createRepository.js usa Modules (SH-005)
   - generateUniqueId() para generar _repo_id
   - getCurrentDateTime() para obtener _meta_created
   - validateRepositoryName() para validar entrada
   |
   V
4. createRepository.js llama quickAddApi.inputPrompt()
   - Usuario (SH-001) proporciona nombre del repositorio
   |
   V
5. createRepository.js guarda en variables
   - variables.repositoryId = _repo_id
   - variables.repositoryName = _nombre_usuario
   |
   V
6. QuickAdd (SH-002) ejecuta template (template/repository.md)
   - Reemplaza {{VARIABLE:repositoryId}} con valor
   - Reemplaza {{VALUE:repositoryName}} con valor
   |
   V
7. Obsidian (SH-003) crea archivo mediante vault API
   - createFolder() valida ruta
   - create() escribe contenido
   |
   V
8. SO (SH-006) persiste archivo en disco
   - Valida permisos de escritura
   - Almacena datos en filesystem
```

---

## PUNTOS CRÍTICOS DE INTERACCIÓN

### Punto Crítico 1: Usuario → QuickAdd
**Descripción:** Usuario inicia macro a través de command palette

**Validaciones Necesarias:**
- Macro existe en configuración QuickAdd
- Script está ubicado en ruta correcta
- Variable de entrada no es vacía o nula

**Riesgos:**
- Usuario cancela operación durante prompts
- Usuario ingresa datos invalidos (strings vacios)
- Macro no está registrada correctamente

---

### Punto Crítico 2: QuickAdd → Scripts/Modules
**Descripción:** QuickAdd pasa contexto a scripts JavaScript

**Validaciones Necesarias:**
- app, quickAddApi, variables están definidos
- Módulos importados existen en disco
- Variables inicializadas antes de usar en template

**Riesgos:**
- Script no captura errores (try/catch faltante)
- Módulo no encontrado causa excepción
- Variables indefinidas quedan como literales {{}}

---

### Punto Crítico 3: Modules → Obsidian API
**Descripción:** Módulos realizan operaciones en vault

**Validaciones Necesarias:**
- Rutas están formateadas correctamente
- Permisos de lectura/escritura existen
- Operaciones están dentro de try/catch

**Riesgos:**
- Ruta inválida causa error de creación
- Permisos insuficientes causa denegación
- Archivo duplicado causa conflicto

---

### Punto Crítico 4: Templates → Obsidian
**Descripción:** Templates reemplazan placeholders y crean archivos

**Validaciones Necesarias:**
- Placeholders {{}} son válidos para QuickAdd
- YAML frontmatter tiene sintaxis correcta
- Variables existen y tienen valores

**Riesgos:**
- Placeholder mal escrito no se reemplaza
- Frontmatter inválido corrompe archivo
- Variable undefined genera salida inconsistente

---

## RESPONSABILIDADES POR OPERACIÓN ATÓMICA

Cada operación atómica (las 15 identificadas en PASO 1) involucra stakeholders específicos:

| Operación | Quién Inicia | Quién Ejecuta | Quién Valida | Quién Persiste |
|---|---|---|---|---|
| Obtener entrada usuario | Usuario | QuickAdd | Script Module | - |
| Validar entrada | Script Module | Script Module | Module logic | - |
| Generar ID | Script Module | Module fn | Módulo | Variables |
| Obtener fecha | Script Module | Module fn | Módulo | Variables |
| Obtener metadata | Script Module | Obsidian API | Módulo | Variables |
| Procesar estructura | Script Module | Script logic | Script | Variables |
| Asignar variables | Script | Variables store | Script | QuickAdd |
| Ejecutar template | QuickAdd | Template engine | Template | Obsidian |
| Crear archivo | Obsidian API | Filesystem | SO permisos | SO Filesystem |
| Mostrar notificación | Script | QuickAdd UI | QuickAdd | User display |

---

## DIFERENCIA CON PASO 1 V3

**V3 vs V4 - Stakeholders:**

| Aspecto | V3 | V4 |
|---|---|---|
| Número | 6 (igual) | 6 (igual) |
| Detalle | Básico | Ampliado con responsabilidades específicas |
| Matriz interacción | No | Sí, incluida |
| Flujo datos | Mencionado | Ejemplo completo documentado |
| Puntos críticos | No | 4 identificados y analizados |
| Operación × Stakeholder | No | Matriz documentada |
| Validaciones | Implícitas | Explícitas por punto |
| Riesgos | No documentado | Documentados por punto |

---

## VALIDACIÓN CONTRA CONVENCIONES

Este análisis de stakeholders valida contra:

**Convenciones-Pragmaticas v1.0.0:**
- Estructura Tipo B (QuickAdd Scripts)
- Responsabilidades de cada componente

**Convenciones-Código v1.0.0:**
- Stakeholders definen límites de responsabilidad
- Módulos (SH-005) deben cumplir SRP

**Convenciones-JavaScript v2.0.0:**
- Cada stakeholder tiene responsabilidades claras (no mixed concerns)
- Pasaje de contexto entre stakeholders documentado

---

## CONCLUSIÓN

Los 6 stakeholders forman un sistema bien definido con responsabilidades claras:

1. Usuario inicia y proporciona datos
2. QuickAdd orquesta ejecución
3. Obsidian proporciona plataforma
4. Templates consumir variables y generan estructura
5. Módulos proporcionar funcionalidad reutilizable
6. SO persiste datos

Las interacciones entre stakeholders son puntos críticos donde pueden ocurrir fallos. El análisis de estos puntos es fundamental para identificar dónde mejorar robustez.

---

**ARTEFACTO 2 COMPLETADO**

Próximo: PASO1-V4-OPERACIONES-ATOMICAS

¿Confirmás para continuar?
