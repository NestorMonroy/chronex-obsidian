```yaml
type: Caso de Uso Formal
title: UC-008 - CREAR PROYECTO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Proyectos
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-008: CREAR PROYECTO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-008 |
| **Nombre** | Crear Proyecto |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-001 (repositorio base) |

---

## 2. DESCRIPCIÓN BREVE

El usuario invoca macro "Crear Proyecto" desde command palette. El sistema solicita nombre del proyecto, descripción, objetivos iniciales y responsable. Valida datos, genera ID único del proyecto, crea estructura en `200-PROYECTOS/`, asigna frontmatter estándar, ejecuta template y notifica éxito. El proyecto queda disponible para vincular documentos y crear objetivos.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca macro, proporciona datos del proyecto |
| **QuickAdd Plugin** | Sistema | Secundario | Ejecuta macro, gestiona flujo |
| **Obsidian Core** | Componente | Secundario | API vault para crear carpetas/archivos |
| **Módulo Utilities** | Componente | Secundario | Genera IDs, valida datos |
| **Template proyecto.md** | Artefacto | Consumidor | Genera contenido markdown |

---

## 4. PRECONDICIONES

### Técnicas

1. Macro "Crear Proyecto" registrada en QuickAdd
2. Script `createProject.js` existe en `990-UTILIDADES/992-script/core-services/`
3. Template `proyecto.md` existe en `990-UTILIDADES/991-template/metas/`
4. Carpeta `200-PROYECTOS/` existe en vault
5. Obsidian y QuickAdd habilitados

### De Negocio

1. Usuario tiene intención de crear nuevo proyecto
2. Nombre del proyecto no está duplicado (validación)
3. Usuario conoce los objetivos del proyecto

---

## 5. FLUJO PRINCIPAL

### PASO 1: Invocación de Macro

```
Usuario abre command palette
Usuario escribe "Crear Proyecto"
QuickAdd detecta macro y ejecuta createProject.js
```

### PASO 2: Entrada de Datos

Sistema solicita mediante modales:

```
MODAL 1: "Nombre del proyecto"
  - Input: text (30 chars min, 100 max)
  - Validación: no vacío, no duplicado
  
MODAL 2: "Descripción"
  - Input: text area (opcional)
  - Max: 500 caracteres
  
MODAL 3: "Objetivos iniciales"
  - Input: text area (opcional)
  - Formato: lista separada por saltos de línea
  
MODAL 4: "Responsable"
  - Input: text (default: autor actual)
  - Validación: nombre válido
```

### PASO 3: Validación

```javascript
// validateProject.js
- Validar nombre: no vacío, no caracteres especiales
- Validar duplicado: buscar en 200-PROYECTOS/
- Validar caracteres: /^[a-zA-Z0-9\s\-áéíóú]+$/
- Si falla: mostrar error y retornar a PASO 2
```

### PASO 4: Generación de ID

```javascript
// generateCustomId.js
- Generar formato: PROJ-{YYYYMM}-{XXXXX}
- Ej: PROJ-202604-A1B2C
- Guardar en variable: projectId
```

### PASO 5: Obtener Metadata

```javascript
- getCurrentDateTime() → fecha_creacion: YYYY-MM-DD HH:mm
- author: obtener del vault config
- status: "activo"
```

### PASO 6: Crear Estructura

```
200-PROYECTOS/
├── {nombreProyecto}/
│   ├── proyecto.md              ← Archivo principal
│   ├── 01-objetivos/
│   │   └── .gitkeep
│   ├── 02-resultados-clave/
│   │   └── .gitkeep
│   ├── 03-documentacion/
│   │   └── .gitkeep
│   └── 04-notas/
│       └── .gitkeep
```

### PASO 7: Asignar Variables de Template

```yaml
projectName: "nombre del proyecto"
projectId: "PROJ-202604-A1B2C"
description: "descripción"
objectives: ["obj1", "obj2"]
responsible: "nombre autor"
createdDate: "YYYY-MM-DD"
status: "activo"
objectives_count: 0
keyresults_count: 0
tasks_count: 0
```

### PASO 8: Ejecutar Template

QuickAdd procesa `proyecto.md` con variables y genera archivo final

### PASO 9: Notificación de Éxito

```
Mostrar: "Proyecto '{nombreProyecto}' creado exitosamente"
Info: ID = PROJ-202604-A1B2C
Info: Ruta = 200-PROYECTOS/{nombreProyecto}/proyecto.md
```

---

## 6. FLUJOS ALTERNATIVOS

### ALTERNATIVA 1: Usuario cancela en cualquier modal

```
Si usuario presiona ESC o Cancel en cualquier modal:
  - Cancelar operación
  - No crear archivos ni carpetas
  - No mostrar notificación
  - Retornar a estado anterior
```

### ALTERNATIVA 2: Nombre duplicado

```
Si nombre del proyecto ya existe:
  - Detectar en validación (PASO 3)
  - Mostrar: "El proyecto '{nombre}' ya existe"
  - Retornar a PASO 2 - MODAL 1
  - Permitir ingreso de nuevo nombre
```

### ALTERNATIVA 3: Error en creación de carpetas

```
Si falla createProject.js:
  - Capturar error
  - Mostrar: "Error al crear proyecto: {detalleError}"
  - Hacer rollback de archivos creados
  - Retornar a PASO 2
```

---

## 7. POSTCONDICIONES

### Si éxito (happy path)

1. Carpeta `200-PROYECTOS/{nombreProyecto}/` existe
2. Archivo `proyecto.md` creado en esa carpeta
3. Archivo contiene frontmatter estándar:
   ```yaml
   UID: PROJ-202604-A1B2C
   type: proyecto
   status: activo
   nombre: "Nombre del Proyecto"
   descripcion: "..."
   responsable: "..."
   fecha_creacion: "2026-04-11"
   objetivos: []
   resultados_clave: []
   tareas: []
   documentos: []
   cssclass: [justify, noscroll]
   ```
4. 4 subcarpetas creadas (objetivos, resultados, docs, notas)
5. Usuario recibe notificación de éxito
6. Usuario puede ver proyecto en explorador de archivos

### Si fallo

1. Ningún archivo creado
2. Ninguna carpeta creada
3. Usuario recibe mensaje de error
4. Sistema retorna a estado anterior

---

## 8. FRONTMATTER ESTÁNDAR PROYECTO

```yaml
---
UID: PROJ-202604-A1B2C
type: proyecto
status: activo
nombre: "Nombre del Proyecto"
descripcion: "Descripción detallada"
responsable: "Nombre Responsable"
fecha_creacion: 2026-04-11
fecha_actualizacion: 2026-04-11
objetivos: []
resultados_clave: []
tareas: []
documentos: []
tags: [proyecto]
cssclass: [justify, noscroll, wide-page]
---
```

---

## 9. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Nombre no vacío | Mostrar error, repetir MODAL 1 |
| V2 | Nombre no duplicado | Mostrar error, repetir MODAL 1 |
| V3 | Caracteres válidos | Sanitizar o rechazar |
| V4 | Descripción < 500 chars | Truncar o error |
| V5 | Responsable válido | Usar default si vacío |
| V6 | Carpetas creadas | Rollback si falla |
| V7 | Archivo creado | Error y notificación |

---

## 10. CASOS DE PRUEBA

### CT-001: Creación exitosa con todos los datos

```
ENTRADA:
  - Nombre: "E-Commerce Platform"
  - Descripción: "Plataforma de venta online"
  - Objetivos: "Objetivo 1, Objetivo 2"
  - Responsable: "Nestor Monroy"

RESULTADO ESPERADO:
  - Carpeta 200-PROYECTOS/E-Commerce Platform/ creada
  - Archivo proyecto.md creado con UID único
  - Status: PASS
```

### CT-002: Creación con datos mínimos

```
ENTRADA:
  - Nombre: "Landing Page"
  - Descripción: (vacío)
  - Objetivos: (vacío)
  - Responsable: (default)

RESULTADO ESPERADO:
  - Proyecto creado con defaults
  - Campos opcionales vacíos
  - Status: PASS
```

### CT-003: Nombre duplicado

```
ENTRADA:
  - Nombre: "E-Commerce Platform" (existe)

RESULTADO ESPERADO:
  - Error: "El proyecto ya existe"
  - Retornar a MODAL 1
  - Sin cambios en vault
  - Status: PASS
```

### CT-004: Usuario cancela en MODAL 2

```
ENTRADA:
  - Nombre: OK
  - Presionar ESC en MODAL 2

RESULTADO ESPERADO:
  - Operación cancelada
  - Sin archivos creados
  - Status: PASS
```

---

## 11. NOTAS TÉCNICAS

### Dependencias

- `generateCustomId.js` — generar ID único
- `validateProject.js` — validar datos
- `getFileName.js` — sanitizar nombre para carpeta
- `getCurrentDateTime.js` — obtener timestamp

### Variables QuickAdd

```javascript
// Pasar a template
wikiLink: "[[" + projectName + "]]"
linkTitle: projectName  // Sin [[]]
projectId: "PROJ-202604-A1B2C"
description: descriptionText
```

### Rutas

- Input: Usuario via modales
- Output: `200-PROYECTOS/{nombreProyecto}/proyecto.md`
- Template: `990-UTILIDADES/991-template/metas/proyecto.md`

---

## 12. RELACIONES CON OTROS UC

```
UC-008 (Crear Proyecto)
├─ UC-010 (Agregar Objetivo) → requiere proyecto existente
├─ UC-012 (Agregar Tarea) → requiere objetivo o proyecto
├─ UC-013 (Cambiar Estado) → actualiza status proyecto
├─ UC-004 (Vincular Documento) → vincula a este proyecto
└─ UC-026 (Crear Documento desde Proyecto) → contexto inverso
```

---

## 13. CRITERIOS DE ACEPTACIÓN

- [ ] Modal 1: Solicita nombre del proyecto (requerido)
- [ ] Modal 2: Solicita descripción (opcional)
- [ ] Modal 3: Solicita objetivos iniciales (opcional)
- [ ] Modal 4: Solicita responsable (default: autor)
- [ ] Validación: Nombre no duplicado
- [ ] Validación: Caracteres válidos en nombre
- [ ] Genera ID único: PROJ-YYYYMM-XXXXX
- [ ] Crea carpeta en 200-PROYECTOS/{nombreProyecto}/
- [ ] Crea 4 subcarpetas (objetivos, resultados, docs, notas)
- [ ] Crea proyecto.md con frontmatter completo
- [ ] Notifica éxito con ID y ruta
- [ ] Rollback si algún paso falla

---

## 14. TIMELINE & ESFUERZO

- **Estimado**: 2-3 horas
- **Dependencias**: UC-001 completado
- **Bloqueador de**: UC-010, UC-012, UC-013
- **Bloquea MVP**: SÍ

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
