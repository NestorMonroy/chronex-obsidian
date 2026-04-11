```yaml
type: Caso de Uso Formal
title: UC-012 - AGREGAR TAREA A OBJETIVO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Proyectos
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-012: AGREGAR TAREA A OBJETIVO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-012 |
| **Nombre** | Agregar Tarea a Objetivo |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Fecha Creación** | 2026-04-11 |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-010 (objetivo debe existir) |

---

## 2. DESCRIPCIÓN BREVE

El usuario invoca macro "Agregar Tarea" desde un objetivo o proyecto. El sistema solicita nombre de la tarea, descripción, prioridad, responsable y plazo. Valida datos, genera ID único de tarea, crea archivo tarea.md con frontmatter estándar, vincula a objetivo padre, actualiza objetivo.md para incluir referencia. Tarea queda lista para asociar documentos y cambiar estado.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca macro desde objetivo |
| **QuickAdd Plugin** | Sistema | Secundario | Ejecuta macro |
| **Obsidian Core** | Componente | Secundario | API vault |
| **Objetivo Padre** | Contexto | Requerimiento | Proporciona ID del objetivo |
| **Dataviewjs** | Componente | Secundario | Actualiza referencias |

---

## 4. PRECONDICIONES

### Técnicas

1. Usuario está dentro de un objetivo (archivo objetivo.md abierto)
2. Script `createTask.js` existe
3. Template `tarea.md` existe
4. Plugin obsidian-tasks instalado (opcional, para checksboxes)
5. QuickAdd con soporte a `self.require.import()`

### De Negocio

1. Objetivo está en status "activo" o "pendiente"
2. Usuario es responsable o tiene permisos
3. Nombre de tarea único dentro del objetivo

---

## 5. FLUJO PRINCIPAL

### PASO 1: Detectar Contexto (Objetivo o Proyecto)

```javascript
const activeFile = app.workspace.getActiveFile();
const path = activeFile.path;
const objectiveId = extractObjectiveId(activeFile);  // OBJ-202604-A1B2C-K7M9N
const projectId = extractProjectId(activeFile);      // PROJ-202604-A1B2C
```

### PASO 2: Entrada de Datos

```
MODAL 1: "Nombre de la tarea"
  - Input: text (20 chars min, 200 max)
  - Ej: "Implementar endpoint GET /auth/verify"
  
MODAL 2: "Descripción"
  - Input: text area (opcional)
  - Max: 1000 caracteres
  
MODAL 3: "Prioridad"
  - Select: [BAJA, MEDIA, ALTA, CRÍTICA]
  - Default: MEDIA
  
MODAL 4: "Responsable"
  - Input: text
  - Default: usuario actual
  
MODAL 5: "Plazo (días)"
  - Input: number
  - Default: 7
  - Min: 1, Max: 365
```

### PASO 3: Validación

```javascript
- Nombre: no vacío, caracteres válidos
- Descripción: max 1000 chars
- Prioridad: uno de [BAJA, MEDIA, ALTA, CRÍTICA]
- Responsable: nombre válido
- Plazo: 1-365
- No duplicado dentro del objetivo
```

### PASO 4: Generación de ID

```javascript
// Formato: TSK-{objectiveId}-{XXXXX}
// Ej: TSK-202604-A1B2C-K7M9N-P3Q5R
const taskId = `TSK-${objectiveId.substring(4)}-${generateUniqueId()}`;
```

### PASO 5: Calcular Fechas y Status

```javascript
const createdDate = getCurrentDateTime();
const dueDate = addDays(createdDate, plazoInput);
const status = "pendiente";
const priority = prioridadInput.toUpperCase();
```

### PASO 6: Crear Archivo Tarea

```
En mismo nivel que objetivo.md o en subcarpeta:
200-PROYECTOS/E-Commerce/01-objetivos/
└── Implementar autenticación OAuth2/
    └── Implementar endpoint GET auth verify.md
```

### PASO 7: Frontmatter de Tarea

```yaml
---
UID: TSK-202604-A1B2C-K7M9N-P3Q5R
type: tarea
objetivo_padre: OBJ-202604-A1B2C-K7M9N
proyecto_padre: PROJ-202604-A1B2C
nombre: "Implementar endpoint GET /auth/verify"
descripcion: "Crear endpoint para verificar tokens válidos"
prioridad: ALTA
responsable: "Nestor Monroy"
fecha_creacion: 2026-04-11
fecha_vencimiento: 2026-04-18
status: pendiente
documentos_vinculados: []
tags: [tarea]
cssclass: [justify, noscroll]
---
```

### PASO 8: Actualizar Objetivo

```javascript
// En objetivo.md, dataviewjs actualiza:
tareas: [
  {
    id: "TSK-202604-A1B2C-K7M9N-P3Q5R",
    nombre: "Implementar endpoint GET /auth/verify",
    prioridad: "ALTA",
    responsable: "Nestor Monroy",
    fecha_vencimiento: "2026-04-18",
    status: "pendiente"
  }
]
```

### PASO 9: Actualizar Proyecto

```javascript
// En proyecto.md, actualizar contador de tareas
tareas_total: 1
tareas_pendientes: 1
```

### PASO 10: Notificación

```
Mostrar: "Tarea creada"
Info: "{nombre}" en objetivo {nombreObjetivo}
Info: ID = TSK-202604-A1B2C-K7M9N-P3Q5R
Info: Vencimiento: 2026-04-18
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Usuario no está en contexto objetivo

```
Si activeFile no es objective.md:
  - Detectar si está en proyecto.md
  - Si está en proyecto: preguntar "¿Crear tarea directa o en objetivo?"
  - Si está en otro lado: listar objetivos disponibles
  - Usuario selecciona objetivo
  - Continuar con PASO 2
```

### ALT-2: Nombre tarea duplicado

```
Si nombre ya existe en mismo objetivo:
  - Mostrar error: "La tarea ya existe en este objetivo"
  - Retornar a MODAL 1
```

### ALT-3: Prioridad no válida

```
Si prioridad no está en lista:
  - Usar default: MEDIA
  - Continuar
```

### ALT-4: Plazo negativo o muy grande

```
Si plazo < 1 o > 365:
  - Usar default: 7
  - Preguntar confirmación al usuario
```

---

## 7. POSTCONDICIONES

### Si éxito

1. Archivo `tarea.md` creado con UID único
2. Frontmatter contiene referencias a objetivo y proyecto
3. Array `tareas` en objetivo.md actualizado
4. Contador `tareas_total` en proyecto.md actualizado
5. Tarea visible en explorador
6. Tarea lista para vincular documentos (UC-006)
7. Tarea lista para cambiar estado (UC-014)

### Si fallo

1. Ningún archivo creado
2. objetivo.md sin cambios
3. Usuario recibe error

---

## 8. FRONTMATTER ESTÁNDAR TAREA

```yaml
---
UID: TSK-202604-A1B2C-K7M9N-P3Q5R
type: tarea
objetivo_padre: OBJ-202604-A1B2C-K7M9N
proyecto_padre: PROJ-202604-A1B2C
nombre: "Nombre de la Tarea"
descripcion: "Descripción detallada"
prioridad: ALTA
responsable: "Nombre Responsable"
fecha_creacion: 2026-04-11
fecha_vencimiento: 2026-04-18
status: pendiente
subtareas: []
documentos_vinculados: []
tags: [tarea, alta-prioridad]
cssclass: [justify, noscroll]
---
```

---

## 9. NIVELES DE PRIORIDAD

| Nivel | Valor | Color (CSS) | Emoji |
|-------|-------|------------|-------|
| BAJA | BAJA | blue | 🔵 |
| MEDIA | MEDIA | yellow | 🟡 |
| ALTA | ALTA | orange | 🟠 |
| CRÍTICA | CRÍTICA | red | 🔴 |

---

## 10. CASOS DE PRUEBA

### CT-001: Creación exitosa de tarea

```
ENTRADA:
  - Contexto: objetivo.md abierto
  - Nombre: "Implementar endpoint GET /auth/verify"
  - Descripción: "Endpoint para verificar tokens"
  - Prioridad: ALTA
  - Responsable: "Nestor Monroy"
  - Plazo: 7

RESULTADO ESPERADO:
  - tarea.md creado
  - ID: TSK-202604-A1B2C-K7M9N-P3Q5R
  - objetivo.md actualizado
  - proyecto.md actualizado
  - Status: PASS
```

### CT-002: Tarea con datos mínimos

```
ENTRADA:
  - Nombre: "Tarea Simple"
  - Otros: defaults

RESULTADO ESPERADO:
  - Tarea creada
  - Prioridad: MEDIA
  - Plazo: 7 días
  - Status: PASS
```

### CT-003: Usuario fuera de contexto

```
ENTRADA:
  - Usuario en otro archivo
  - Invoca "Agregar Tarea"

RESULTADO ESPERADO:
  - ALT-1 activada
  - Modal lista objetivos
  - Usuario selecciona
  - Continúa flujo
  - Status: PASS
```

### CT-004: Nombre duplicado

```
ENTRADA:
  - Nombre: "Implementar OAuth2" (existe)

RESULTADO ESPERADO:
  - Error: "La tarea ya existe"
  - Retornar a MODAL 1
  - Status: PASS
```

---

## 11. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Contexto detectado | ALT-1 |
| V2 | Nombre no vacío | Repetir MODAL 1 |
| V3 | Nombre no duplicado | Repetir MODAL 1 |
| V4 | Descripción < 1000 chars | Truncar o error |
| V5 | Prioridad válida | Usar default |
| V6 | Responsable válido | Usar default |
| V7 | Plazo válido (1-365) | Usar default 7 |
| V8 | objetivo.md actualizado | Error y rollback |
| V9 | tarea.md creado | Error |

---

## 12. NOTAS TÉCNICAS

### Estructura de directorio con tareas

Opción A (Tareas en carpeta separada):
```
01-objetivos/
├── Objetivo 1.md
├── tareas/
│   ├── Tarea 1.1.md
│   └── Tarea 1.2.md
└── Tarea 2.md
```

Opción B (Tareas junto a objetivo):
```
01-objetivos/
├── Objetivo 1.md
├── Objetivo 1/
│   ├── Tarea 1.1.md
│   └── Tarea 1.2.md
└── Objetivo 2.md
```

Recomendación: **Opción B** (más jerárquico, más intuitivo)

---

## 13. RELACIONES CON OTROS UC

```
UC-012 (Agregar Tarea)
├─ Requiere: UC-010 (Crear Objetivo)
├─ Requiere: UC-008 (Crear Proyecto)
├─ Habilita: UC-006 (Vincular Documento a Tarea)
├─ Actualizado por: UC-014 (Cambiar Estado)
└─ Referenciado en: UC-004 (Buscar Documentos por Tarea)
```

---

## 14. CRITERIOS DE ACEPTACIÓN

- [ ] Modal 1: Solicita nombre (requerido)
- [ ] Modal 2: Solicita descripción (opcional)
- [ ] Modal 3: Solicita prioridad (BAJA/MEDIA/ALTA/CRÍTICA, default MEDIA)
- [ ] Modal 4: Solicita responsable (default usuario actual)
- [ ] Modal 5: Solicita plazo en días (default 7)
- [ ] Detecta contexto de objetivo
- [ ] ALT-1 si usuario no está en objetivo
- [ ] Genera ID único: TSK-{objectiveId}-XXXXX
- [ ] Crea tarea.md con frontmatter completo
- [ ] objetivo.md actualizado con referencia
- [ ] proyecto.md actualizado (contador tareas)
- [ ] Tarea visible en explorador
- [ ] Notifica éxito con ID y vencimiento

---

## 15. TIMELINE & ESFUERZO

- **Estimado**: 2-3 horas
- **Dependencias**: UC-008, UC-010 completados
- **Bloqueador de**: UC-006, UC-014
- **Bloquea MVP**: SÍ

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
