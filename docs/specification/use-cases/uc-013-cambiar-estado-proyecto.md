```yaml
type: Caso de Uso Formal
title: UC-013 - CAMBIAR ESTADO DE PROYECTO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Proyectos
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-013: CAMBIAR ESTADO DE PROYECTO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-013 |
| **Nombre** | Cambiar Estado de Proyecto |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Fecha Creación** | 2026-04-11 |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-008 (proyecto debe existir) |

---

## 2. DESCRIPCIÓN BREVE

El usuario invoca comando "Cambiar Estado Proyecto" desde un proyecto abierto. Sistema presenta modal con estados disponibles: pendiente, activo, pausado, completado, archivado. Usuario selecciona nuevo estado. Sistema valida transición válida, actualiza frontmatter de proyecto.md, recalcula métricas (objetivos completados, tareas pendientes), actualiza archivo de auditoría, notifica cambio. Proyecto queda en nuevo estado listo para operaciones correspondientes.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca comando desde proyecto |
| **Obsidian API** | Sistema | Secundario | Actualiza propiedades de archivo |
| **Obsidian Metadata** | Componente | Secundario | Gestiona frontmatter YAML |
| **Dataviewjs** | Componente | Secundario | Actualiza métricas y referencias |
| **Auditoría System** | Componente | Secundario | Registra cambio de estado |

---

## 4. PRECONDICIONES

### Técnicas

1. Usuario está dentro de un proyecto (proyecto.md abierto)
2. Plugin Obsidian Metadata Handler disponible
3. Sistema tiene acceso a archivo proyecto.md
4. Dataviewjs instalado para actualizar métricas
5. Archivo de auditoría creado (o será creado)

### De Negocio

1. Usuario es responsable del proyecto
2. Proyecto está en estado válido (tiene UID)
3. Transición de estado es válida según reglas de negocio
4. Usuario puede justificar cambio si es necesario

---

## 5. MÁQUINA DE ESTADOS

```
Estado Inicial: PENDIENTE (default al crear)

PENDIENTE
  ├─ puede cambiar a: ACTIVO
  └─ puede cambiar a: ARCHIVADO

ACTIVO
  ├─ puede cambiar a: PAUSADO
  ├─ puede cambiar a: COMPLETADO
  └─ puede cambiar a: ARCHIVADO

PAUSADO
  ├─ puede cambiar a: ACTIVO
  └─ puede cambiar a: ARCHIVADO

COMPLETADO
  └─ puede cambiar a: ARCHIVADO

ARCHIVADO
  └─ puede cambiar a: (terminal - NO CAMBIA)

TRANSICIONES INVÁLIDAS:
  ✗ COMPLETADO → ACTIVO (no se descompletaría)
  ✗ ARCHIVADO → cualquier otro (archivado es final)
  ✗ mismo estado → mismo estado (sin cambio)
```

---

## 6. FLUJO PRINCIPAL

### PASO 1: Detectar Proyecto Abierto

```javascript
const activeFile = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(activeFile).frontmatter;
const projectId = frontmatter.UID;
const currentStatus = frontmatter.status;
const projectName = frontmatter.nombre;
```

### PASO 2: Validar que es proyecto.md

```javascript
if (!currentStatus || !projectId || frontmatter.type !== 'proyecto') {
  new Notice('Por favor abre un proyecto.md para cambiar su estado');
  return;
}
```

### PASO 3: Determinar Estados Permitidos

```javascript
const validTransitions = {
  'pendiente': ['activo', 'archivado'],
  'activo': ['pausado', 'completado', 'archivado'],
  'pausado': ['activo', 'archivado'],
  'completado': ['archivado'],
  'archivado': []  // Terminal
};

const allowedStates = validTransitions[currentStatus] || [];

if (allowedStates.length === 0) {
  new Notice(`Proyecto en estado ${currentStatus}: No hay transiciones permitidas`);
  return;
}
```

### PASO 4: Mostrar Modal de Selección

```
MODAL: "Cambiar estado de: {nombreProyecto}"
  - Mostrar estado actual: {currentStatus}
  - Listar opciones: {allowedStates}
  - Botones: [PENDIENTE], [ACTIVO], [PAUSADO], [COMPLETADO], [ARCHIVADO]
  - Solo habilitar los que están en allowedStates
```

### PASO 5: Usuario Selecciona Nuevo Estado

```javascript
const newStatus = userSelection;  // Ej: 'completado'
const timestamp = getCurrentDateTime();
```

### PASO 6: Validar Transición

```javascript
if (!allowedStates.includes(newStatus)) {
  new Notice(`No se puede cambiar de ${currentStatus} a ${newStatus}`);
  return;
}

// Validaciones adicionales:
if (newStatus === 'completado') {
  // Verificar que no hay tareas pendientes
  const pendingTasks = countPendingTasks(projectId);
  if (pendingTasks > 0) {
    // Preguntar confirmación
    const confirmed = await showConfirmation(
      `Hay ${pendingTasks} tareas pendientes. ¿Completar de todas formas?`
    );
    if (!confirmed) return;
  }
}
```

### PASO 7: Actualizar Frontmatter

```yaml
# En proyecto.md:
status: "completado"  # Antes: "activo"
fecha_actualizacion: "2026-04-11 14:30"
fecha_completado: "2026-04-11"  # Solo si nuevo estado es 'completado'
```

### PASO 8: Recalcular Métricas

```javascript
const stats = {
  objetivos_totales: countObjectives(projectId),
  objetivos_completados: countCompletedObjectives(projectId),
  tareas_totales: countTasks(projectId),
  tareas_completadas: countCompletedTasks(projectId),
  tareas_pendientes: countPendingTasks(projectId),
  documentos_totales: countLinkedDocuments(projectId),
  salud_proyecto: calculateProjectHealth(projectId)  // Porcentaje
};

// Actualizar en frontmatter:
stats: stats
```

### PASO 9: Crear/Actualizar Auditoría

```yaml
# En archivo: 990-UTILIDADES/audit/proyecto-{projectId}.md
- fecha: 2026-04-11 14:30
  accion: "Estado cambiado"
  estado_anterior: "activo"
  estado_nuevo: "completado"
  usuario: "Nestor Monroy"
  razon: (opcional)
  metrics:
    objetivos_completados: 5/5
    tareas_completadas: 12/12
```

### PASO 10: Guardar Cambios

```javascript
await app.vault.modify(activeFile, newContent);
```

### PASO 11: Notificación de Éxito

```
Mostrar: "Proyecto actualizado"
Info: "{nombreProyecto}" → {newStatus}
Info: Actualización registrada en auditoría
```

### PASO 12: Actualizar Dashboards

```javascript
// Trigger refresh de:
// - 200-PROYECTOS/Mi Dashboard.md
// - Home.md
// - Reportes.md
```

---

## 7. TRANSICIONES ESPECIALES

### Transición → COMPLETADO

```javascript
if (newStatus === 'completado') {
  // Verificar requisitos:
  - 100% de objetivos completados? (warning si no)
  - Registrar fecha de completación
  - Calcular duración total del proyecto
  - Generar reporte de cierre automático
}
```

### Transición → ARCHIVADO

```javascript
if (newStatus === 'archivado') {
  // Acciones:
  - Mover proyecto a subcarpeta "archivados/" (opcional)
  - Marcar en dashboards como archivado
  - Permitir búsqueda pero no edición
  - Agregar tag 'archivado' a frontmatter
}
```

### Transición PENDIENTE → ACTIVO

```javascript
if (currentStatus === 'pendiente' && newStatus === 'activo') {
  // Acciones:
  - Asignar fecha de inicio si no existe
  - Activar recordatorios (si existen)
  - Notificar a responsables
}
```

---

## 8. POSTCONDICIONES

### Si éxito

1. frontmatter `status` actualizado en proyecto.md
2. `fecha_actualizacion` registrada
3. Métricas recalculadas en proyecto.md
4. Entrada en archivo de auditoría creada
5. Dashboards refrescados
6. Usuario notificado con cambio exitoso
7. Proyecto listo para operaciones del nuevo estado

### Si fallo

1. proyecto.md sin cambios
2. Auditoría sin nuevo registro
3. Usuario recibe mensaje de error
4. Sistema retorna a estado anterior

---

## 9. FRONTMATTER ACTUALIZADO

```yaml
---
UID: PROJ-202604-A1B2C
type: proyecto
status: completado           # Actualizado
nombre: "E-Commerce Platform"
descripcion: "..."
responsable: "Nestor Monroy"
fecha_creacion: 2026-04-11
fecha_actualizacion: 2026-04-11  # Actualizado
fecha_completado: 2026-04-11     # Nuevo si completado
duracion_dias: 31                 # Calculado si completado
objetivos: [...]
resultados_clave: [...]
tareas: [...]
documentos: [...]
stats:
  objetivos_totales: 5
  objetivos_completados: 5
  tareas_totales: 12
  tareas_completadas: 12
  tareas_pendientes: 0
  documentos_totales: 23
  salud_proyecto: 100%
tags: [proyecto, completado]
cssclass: [justify, noscroll]
---
```

---

## 10. CASOS DE PRUEBA

### CT-001: Cambio ACTIVO → COMPLETADO (exitoso)

```
ENTRADA:
  - Proyecto: "E-Commerce Platform"
  - Estado actual: ACTIVO
  - 5/5 objetivos completados
  - 12/12 tareas completadas
  - Usuario: "Nestor Monroy"

RESULTADO ESPERADO:
  - status cambiado a: COMPLETADO
  - fecha_completado: 2026-04-11
  - Auditoría registrada
  - Notificación: "Proyecto completado"
  - Status: PASS
```

### CT-002: Cambio ACTIVO → COMPLETADO (con tareas pendientes)

```
ENTRADA:
  - Proyecto: "E-Commerce Platform"
  - Estado actual: ACTIVO
  - 5/5 objetivos completados
  - 10/12 tareas completadas (2 pendientes)

RESULTADO ESPERADO:
  - Modal confirma: "¿Completar con tareas pendientes?"
  - Si usuario acepta: status = COMPLETADO
  - Si usuario rechaza: sin cambios
  - Status: PASS
```

### CT-003: Transición inválida COMPLETADO → ACTIVO

```
ENTRADA:
  - Estado actual: COMPLETADO
  - Usuario intenta cambiar a: ACTIVO

RESULTADO ESPERADO:
  - Error: "No se puede cambiar de COMPLETADO a ACTIVO"
  - Sin cambios en frontmatter
  - Status: PASS
```

### CT-004: Transición válida ACTIVO → PAUSADO

```
ENTRADA:
  - Estado actual: ACTIVO
  - Usuario cambia a: PAUSADO

RESULTADO ESPERADO:
  - status: PAUSADO
  - Auditoría registrada
  - Notificación de éxito
  - Status: PASS
```

### CT-005: Usuario no está en proyecto.md

```
ENTRADA:
  - Usuario en otro archivo
  - Invoca comando cambiar estado

RESULTADO ESPERADO:
  - Error: "Por favor abre un proyecto.md"
  - Sin cambios
  - Status: PASS
```

---

## 11. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Archivo es proyecto.md | Error: "Abre un proyecto" |
| V2 | Proyecto tiene UID válido | Error: "Proyecto inválido" |
| V3 | Transición es válida | Error: "Transición no permitida" |
| V4 | Si completado: verificar tareas | Pedir confirmación |
| V5 | Guardar cambios en YAML | Error: "Fallo al guardar" |
| V6 | Crear entrada auditoría | Error: "Fallo auditoría" |
| V7 | Actualizar métricas | Warning: "Métricas no actualizadas" |

---

## 12. DIAGRAMA DE FLUJO

```
┌─ Detectar proyecto.md
├─ Validar que es proyecto
├─ Obtener estado actual
├─ Determinar transiciones válidas
├─ Si sin transiciones: Error
├─ Mostrar modal con opciones
├─ Usuario selecciona nuevo estado
├─ Validar transición
├─ Si inválida: Error
├─ Si completado: Verificar tareas
├─ Si tareas pendientes: Pedir confirmación
├─ Si usuario cancela: Return
├─ Actualizar frontmatter
├─ Recalcular métricas
├─ Crear auditoría
├─ Guardar cambios
├─ Refrescar dashboards
└─ Notificar éxito
```

---

## 13. RELACIONES CON OTROS UC

```
UC-013 (Cambiar Estado Proyecto)
├─ Requiere: UC-008 (Crear Proyecto)
├─ Actualiza: UC-010 (Objetivos vinculados)
├─ Actualiza: UC-012 (Tareas vinculadas)
├─ Afecta: UC-022 (Archivar Proyecto)
├─ Registrado en: UC-020 (Trazabilidad)
└─ Visualizado en: UC-015 (Búsqueda Global)
```

---

## 14. CRITERIOS DE ACEPTACIÓN

- [ ] Detecta proyecto.md abierto
- [ ] Valida que archivo es tipo proyecto
- [ ] Obtiene estado actual desde frontmatter
- [ ] Determina transiciones válidas según máquina de estados
- [ ] Modal muestra solo estados permitidos
- [ ] Usuario puede seleccionar nuevo estado
- [ ] Validación: Transición es válida
- [ ] Si COMPLETADO: Verifica 100% de tareas
- [ ] Pide confirmación si tareas pendientes
- [ ] Actualiza frontmatter status
- [ ] Actualiza fecha_actualizacion
- [ ] Recalcula métricas (objetivos, tareas, documentos)
- [ ] Crea/actualiza auditoría
- [ ] Guarda cambios en archivo
- [ ] Notifica éxito con nuevo estado
- [ ] Refresca dashboards

---

## 15. TIMELINE & ESFUERZO

- **Estimado**: 2 horas
- **Dependencias**: UC-008 completado
- **Bloqueador de**: UC-022 (Archivar)
- **Bloquea MVP**: SÍ

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
