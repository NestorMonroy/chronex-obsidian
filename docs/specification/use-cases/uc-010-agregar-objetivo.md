```yaml
type: Caso de Uso Formal
title: UC-010 - AGREGAR OBJETIVO A PROYECTO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Proyectos
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-010: AGREGAR OBJETIVO A PROYECTO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-010 |
| **Nombre** | Agregar Objetivo a Proyecto |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Fecha Creación** | 2026-04-11 |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-008 (proyecto debe existir) |

---

## 2. DESCRIPCIÓN BREVE

El usuario invoca macro "Agregar Objetivo" desde dentro de un proyecto. El sistema solicita nombre del objetivo, descripción, plazo y resultados clave esperados. Valida datos, genera ID único, crea archivo objetivo.md en `200-PROYECTOS/{proyecto}/01-objetivos/`, asigna frontmatter estándar, actualiza proyecto.md para incluir referencia al objetivo. Sistema notifica éxito y objetivo queda vinculado al proyecto.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca macro desde contexto de proyecto |
| **QuickAdd Plugin** | Sistema | Secundario | Ejecuta macro, gestiona flujo |
| **Obsidian Core** | Componente | Secundario | API vault para archivos |
| **Proyecto Actual** | Contexto | Requerimiento | Proporciona ID del proyecto padre |
| **Dataviewjs** | Componente | Secundario | Actualiza referencias en proyecto.md |

---

## 4. PRECONDICIONES

### Técnicas

1. Usuario está dentro de un proyecto (archivo proyecto.md abierto)
2. Script `createObjective.js` existe
3. Template `objetivo.md` existe en templates/
4. Carpeta `01-objetivos/` existe en proyecto
5. QuickAdd con soporte a `self.require.import()`

### De Negocio

1. Proyecto está en status "activo"
2. Usuario es responsable del proyecto o tiene permisos
3. Nombre del objetivo es único dentro del proyecto

---

## 5. FLUJO PRINCIPAL

### PASO 1: Detectar Contexto de Proyecto

```javascript
// En createObjective.js
const activeFile = app.workspace.getActiveFile();
const projectPath = activeFile.path;  // Ej: 200-PROYECTOS/E-Commerce/proyecto.md
const projectFolder = projectPath.split('/')[1];  // E-Commerce
const projectId = extractProjectId(activeFile);    // PROJ-202604-A1B2C
```

### PASO 2: Invocación de Macro

```
Usuario abierto en 200-PROYECTOS/NombreProyecto/proyecto.md
Usuario abre command palette
Usuario escribe "Agregar Objetivo"
Sistema detecta contexto de proyecto automáticamente
```

### PASO 3: Entrada de Datos

```
MODAL 1: "Nombre del objetivo"
  - Input: text (20 chars min, 150 max)
  - Ej: "Implementar autenticación OAuth2"
  
MODAL 2: "Descripción"
  - Input: text area (opcional)
  - Max: 1000 caracteres
  
MODAL 3: "Plazo (días)"
  - Input: number
  - Default: 30
  - Min: 1, Max: 365
  
MODAL 4: "Resultados clave esperados"
  - Input: text area (opcional)
  - Formato: lista separada por saltos de línea
```

### PASO 4: Validación

```javascript
- Nombre: no vacío, no caracteres especiales
- Descripción: max 1000 chars
- Plazo: número válido entre 1-365
- No duplicado dentro del proyecto
- Caracteres: /^[a-zA-Z0-9\s\-áéíóú()]+$/
```

### PASO 5: Generación de ID

```javascript
// Formato: OBJ-{projectId}-{XXXXX}
// Ej: OBJ-202604-A1B2C-K7M9N
const objectiveId = `OBJ-${projectId.substring(5)}-${generateUniqueId()}`;
```

### PASO 6: Calcular Fechas

```javascript
const createdDate = getCurrentDateTime();
const dueDate = addDays(createdDate, plazoInput);
// dueDate: YYYY-MM-DD
```

### PASO 7: Crear Archivo

```
200-PROYECTOS/E-Commerce/01-objetivos/
└── Implementar autenticación OAuth2.md
    Frontmatter:
    - UID: OBJ-202604-A1B2C-K7M9N
    - type: objetivo
    - proyecto_padre: PROJ-202604-A1B2C
    - nombre: "Implementar autenticación OAuth2"
    - descripcion: "..."
    - plazo: 30
    - fecha_creacion: YYYY-MM-DD
    - fecha_vencimiento: YYYY-MM-DD
    - status: "pendiente"
    - resultados_clave: []
    - tareas: []
```

### PASO 8: Actualizar Proyecto

Dataviewjs actualiza proyecto.md:

```javascript
// En proyecto.md, actualizar array:
objetivos: [
  {
    id: "OBJ-202604-A1B2C-K7M9N",
    nombre: "Implementar autenticación OAuth2",
    fecha_vencimiento: "2026-05-11"
  }
]
```

### PASO 9: Notificación de Éxito

```
Mostrar: "Objetivo creado"
Info: "{nombre}" en proyecto {nombreProyecto}
Info: ID = OBJ-202604-A1B2C-K7M9N
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Usuario no está en contexto de proyecto

```
Si activeFile no es un proyecto.md:
  - Mostrar modal: "Selecciona un proyecto"
  - Modal lista proyectos en 200-PROYECTOS/
  - Usuario selecciona proyecto
  - Continuar con PASO 3
```

### ALT-2: Nombre objetivo duplicado

```
Si nombre ya existe en mismo proyecto:
  - Detectar en validación
  - Mostrar error: "El objetivo ya existe en este proyecto"
  - Retornar a MODAL 1
```

### ALT-3: Plazo inválido

```
Si plazo < 1 o > 365:
  - Mostrar error: "El plazo debe estar entre 1 y 365 días"
  - Usar default: 30
  - Preguntar al usuario si aceptar default
```

### ALT-4: Carpeta 01-objetivos/ no existe

```
Si carpeta no existe:
  - Sistema la crea automáticamente
  - Continua con PASO 7
```

---

## 7. POSTCONDICIONES

### Si éxito

1. Archivo `objetivo.md` creado en `01-objetivos/`
2. Frontmatter contiene UID único y referencias
3. Array `objetivos` en proyecto.md actualizado
4. Usuario puede ver objetivo en explorador
5. Objetivo listo para agregar resultados clave (UC-011)
6. Objetivo listo para agregar tareas (UC-012)

### Si fallo

1. Ningún archivo creado
2. proyecto.md sin cambios
3. Usuario recibe mensaje de error

---

## 8. FRONTMATTER ESTÁNDAR OBJETIVO

```yaml
---
UID: OBJ-202604-A1B2C-K7M9N
type: objetivo
proyecto_padre: PROJ-202604-A1B2C
nombre: "Nombre del Objetivo"
descripcion: "Descripción detallada"
plazo: 30
fecha_creacion: 2026-04-11
fecha_vencimiento: 2026-05-11
status: pendiente
resultados_clave: []
tareas: []
documentos_vinculados: []
tags: [objetivo]
cssclass: [justify, noscroll]
---
```

---

## 9. ESTRUCTURA DE PROYECTO DESPUÉS

```
200-PROYECTOS/E-Commerce/
├── proyecto.md (actualizado con 1 objetivo)
├── 01-objetivos/
│   ├── Implementar autenticación OAuth2.md (NUEVO)
│   └── Implementar pagos con Stripe.md
├── 02-resultados-clave/
├── 03-documentacion/
└── 04-notas/
```

---

## 10. CASOS DE PRUEBA

### CT-001: Creación exitosa de objetivo

```
ENTRADA:
  - Contexto: 200-PROYECTOS/E-Commerce/proyecto.md
  - Nombre: "Implementar autenticación OAuth2"
  - Descripción: "Integrar OAuth2 con Google y GitHub"
  - Plazo: 30
  - Resultados: (vacío)

RESULTADO ESPERADO:
  - Archivo objetivo.md creado en 01-objetivos/
  - ID: OBJ-202604-A1B2C-K7M9N
  - proyecto.md actualizado
  - Status: PASS
```

### CT-002: Objetivo con datos mínimos

```
ENTRADA:
  - Nombre: "Objetivo Simple"
  - Otros: defaults

RESULTADO ESPERADO:
  - Objetivo creado
  - Plazo default: 30
  - Status: PASS
```

### CT-003: Usuario fuera de contexto proyecto

```
ENTRADA:
  - Usuario abierto en otro archivo
  - Invoca macro "Agregar Objetivo"

RESULTADO ESPERADO:
  - Sistema pregunta: "¿Seleccionar proyecto?"
  - Modal lista proyectos
  - Usuario selecciona
  - Continúa flujo
  - Status: PASS
```

### CT-004: Nombre duplicado

```
ENTRADA:
  - Nombre: "OAuth2" (ya existe)

RESULTADO ESPERADO:
  - Error: "El objetivo ya existe"
  - Retornar a MODAL 1
  - Status: PASS
```

---

## 11. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Contexto de proyecto detectado | ALT-1 |
| V2 | Nombre no vacío | Repetir MODAL 1 |
| V3 | Nombre no duplicado | Repetir MODAL 1 |
| V4 | Descripción < 1000 chars | Truncar o error |
| V5 | Plazo válido (1-365) | Usar default 30 |
| V6 | proyecto.md actualizado | Error y rollback |
| V7 | Archivo objetivo.md creado | Error |

---

## 12. NOTAS TÉCNICAS

### Extracción de projectId desde archivo abierto

```javascript
const activeFile = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(activeFile).frontmatter;
const projectId = frontmatter?.UID;  // PROJ-202604-A1B2C
```

### Actualizar proyecto.md (Dataviewjs)

```javascript
// En proyecto.md, crear query dataviewjs para actualizar:
const objectives = dv.page().objetivos || [];
// Agregar nuevo objetivo al array
```

---

## 13. RELACIONES CON OTROS UC

```
UC-010 (Agregar Objetivo)
├─ Requiere: UC-008 (Crear Proyecto)
├─ Habilita: UC-011 (Agregar Resultado Clave)
├─ Habilita: UC-012 (Agregar Tarea)
├─ Actualizado por: UC-013 (Cambiar Estado)
└─ Vinculado por: UC-004 (Vincular Documento)
```

---

## 14. CRITERIOS DE ACEPTACIÓN

- [ ] Modal 1: Solicita nombre (requerido)
- [ ] Modal 2: Solicita descripción (opcional)
- [ ] Modal 3: Solicita plazo en días (default 30)
- [ ] Modal 4: Solicita resultados clave (opcional)
- [ ] Detecta contexto de proyecto automáticamente
- [ ] ALT-1 si usuario no está en proyecto
- [ ] Genera ID único: OBJ-{projectId}-XXXXX
- [ ] Crea objetivo.md en 01-objetivos/
- [ ] Frontmatter contiene UID y referencias
- [ ] proyecto.md actualizado con referencia
- [ ] Notifica éxito con ID y ruta
- [ ] Objetivo listo para UC-011 y UC-012

---

## 15. TIMELINE & ESFUERZO

- **Estimado**: 2-3 horas
- **Dependencias**: UC-008 completado
- **Bloqueador de**: UC-011, UC-012
- **Bloquea MVP**: SÍ

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
