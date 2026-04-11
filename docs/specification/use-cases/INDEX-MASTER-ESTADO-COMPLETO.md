```yaml
type: Índice Maestro
title: ÍNDICE MASTER - ESTADO COMPLETO DE UC
version: 1.0.0
project: obsidian-repo
date: 2026-04-11
language: Español
status: ACTUALIZADO
```

# ÍNDICE MASTER: ESTADO DE TODOS LOS CASOS DE USO (35 UC)

## RESUMEN GLOBAL

```
Total UC definidos:           35 UC
Documentados:                 16 UC (46%)
Pendientes de documentar:     19 UC (54%)

DISTRIBUCIÓN POR ESTADO:
├─ TIER 1 (MVP CRÍTICO):      8 UC ✅ DOCUMENTADOS
├─ TIER 2 (v1.1 IMPORTANTE):  8 UC ✅ DOCUMENTADOS
├─ TIER 3 (v1.2 OPCIONAL):    5 UC ⏳ PENDIENTES
├─ TIER 4 (v2.0 ADMIN):       4 UC ⏳ PENDIENTES
├─ SETUP (P):                 2 UC ⏳ PENDIENTES
├─ INTEGRACIONES (INT):       3 UC ⏳ PENDIENTES
├─ SISTEMA/CORE (SYS):        4 UC ⏳ PENDIENTES
└─ REPORTES (031):            1 UC ⏳ PENDIENTES
```

---

## DOCUMENTACIÓN EXISTENTE (16 UC) ✅

### TIER 1 - CRÍTICO MVP

Archivo | UC ID | Nombre | Estado | Estimado
--------|-------|--------|--------|----------
[uc-008-crear-proyecto.md](uc-008-crear-proyecto.md) | UC-008 | Crear Proyecto | ✅ DOCUMENTADO | 2-3h
[uc-010-agregar-objetivo.md](uc-010-agregar-objetivo.md) | UC-010 | Agregar Objetivo | ✅ DOCUMENTADO | 2-3h
[uc-012-agregar-tarea.md](uc-012-agregar-tarea.md) | UC-012 | Agregar Tarea | ✅ DOCUMENTADO | 2-3h
[uc-013-cambiar-estado-proyecto.md](uc-013-cambiar-estado-proyecto.md) | UC-013 | Cambiar Estado Proyecto | ✅ DOCUMENTADO | 2h
[uc-015-busqueda-global.md](uc-015-busqueda-global.md) | UC-015 | Búsqueda Global | ✅ DOCUMENTADO | 3-4h
[uc-019-consultar-documento-archivado.md](uc-019-consultar-documento-archivado.md) | UC-019 | Consultar Documento Archivado | ✅ DOCUMENTADO | 1h
[uc-020-ver-trazabilidad.md](uc-020-ver-trazabilidad.md) | UC-020 | Ver Trazabilidad | ✅ DOCUMENTADO | 2-3h
[uc-021-ver-contexto-proyectos.md](uc-021-ver-contexto-proyectos.md) | UC-021 | Ver Contexto en Proyectos | ✅ DOCUMENTADO | 2-3h

**Subtotal TIER 1**: 8 UC documentados | **16-21 horas** de implementación

---

### TIER 2 - IMPORTANTE v1.1

Archivo | UC ID | Nombre | Estado | Estimado
--------|-------|--------|--------|----------
[uc-006-vincular-documento-tarea.md](uc-006-vincular-documento-tarea.md) | UC-006 | Vincular a Tarea | ✅ DOCUMENTADO | 1-2h
[uc-007-activar-proyecto.md](uc-007-activar-proyecto.md) | UC-007 | Activar Proyecto | ✅ DOCUMENTADO | 1h
[uc-009-activar-objetivo.md](uc-009-activar-objetivo.md) | UC-009 | Activar Objetivo | ✅ DOCUMENTADO | 1h
[uc-011-agregar-resultado-clave.md](uc-011-agregar-resultado-clave.md) | UC-011 | Agregar Resultado Clave | ✅ DOCUMENTADO | 2-3h
[uc-014-cambiar-estado-objetivo-tarea.md](uc-014-cambiar-estado-objetivo-tarea.md) | UC-014 | Cambiar Estado Objetivo/Tarea | ✅ DOCUMENTADO | 1-2h
[uc-016-busqueda-repositorio.md](uc-016-busqueda-repositorio.md) | UC-016 | Búsqueda por Repositorio | ✅ DOCUMENTADO | 1-2h
[uc-017-busqueda-proyecto.md](uc-017-busqueda-proyecto.md) | UC-017 | Búsqueda por Proyecto | ✅ DOCUMENTADO | 1-2h
[uc-018-busqueda-avanzada.md](uc-018-busqueda-avanzada.md) | UC-018 | Búsqueda Avanzada | ✅ DOCUMENTADO | 2-3h

**Subtotal TIER 2**: 8 UC documentados | **11-17 horas** de implementación

---

### UC EXISTENTES PREVIOS (5 UC)

Archivo | UC ID | Nombre | Estado | Notas
--------|-------|--------|--------|-------
uc-001-repository.md | UC-001 | Crear Repositorio | ✅ DOCUMENTADO | Previo
uc-002-task.md | UC-002 | Clasificar Documento | ✅ DOCUMENTADO | Previo
uc-003-project.md | UC-003 | Indexar Documento | ✅ DOCUMENTADO | Previo
uc-004-pillar.md | UC-004 | Vincular Documento | ✅ DOCUMENTADO | Previo
uc-005-repository-note.md | UC-005 | Crear Nota Fugaz | ✅ DOCUMENTADO | Previo

**Subtotal Previos**: 5 UC (no contados en el trabajo de esta sesión)

---

## DOCUMENTACIÓN PENDIENTE (19 UC) ⏳

### TIER 3 - OPCIONALES v1.2+

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-022 | Archivar Proyecto Completado | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-022-archivar-proyecto-completado)
UC-023 | Buscar Proyectos Completados | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-023-buscar-proyectos-completados)
UC-024 | Vincular a Pilar (200-METAS) | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-024-vincular-a-pilar-200-metas)
UC-025 | Referenciar en Diario (400) | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-025-referenciar-en-diario-400-diario)
UC-026 | Crear Documento desde Proyecto | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-026-crear-documento-desde-proyecto)

**Subtotal TIER 3**: 5 UC | ~7-10 horas

---

### TIER 4 - ADMINISTRACIÓN v2.0

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-027 | Generar Reporte de Proyecto | MEDIA-ALTA | 3-4h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-027-generar-reporte-de-proyecto)
UC-028 | Generar Inventario Repositorio | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-028-generar-inventario-de-repositorio)
UC-029 | Dashboard de Documentación Proyecto | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-029-dashboard-de-documentación-de-proyecto)
UC-030 | Análisis de Reutilización | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-030-análisis-de-reutilización-de-documentos)

**Subtotal TIER 4**: 4 UC | ~9-13 horas

---

### SETUP & CONFIGURACIÓN

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-P01 | Instalar Plugin | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-p01-instalar-plugin)
UC-P02 | Configurar Plugin | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-p02-configurar-plugin)

**Subtotal SETUP**: 2 UC | ~4-6 horas

---

### INTEGRACIONES

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-INT01 | Integración QuickAdd | MEDIA-ALTA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-int01-integración-con-quickadd)
UC-INT02 | Procesamiento Templater | MEDIA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-int02-procesamiento-con-templater)
UC-INT03 | Cross-Plugin Flow | MEDIA-ALTA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-int03-flujo-cross-plugin-quickadd--templater--obsidian)

**Subtotal INTEGRACIONES**: 3 UC | ~5-8 horas

---

### SISTEMA/CORE

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-SYS01 | Validar Entrada de Usuario | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-sys01-validar-entrada-de-usuario)
UC-SYS02 | Generar ID Único | BAJA | 1h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-sys02-generar-id-único)
UC-SYS03 | Mostrar Notificación | BAJA | 0.5h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-sys03-mostrar-notificación)
UC-SYS04 | Actualizar Versión Plugin | BAJA | 1-2h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-sys04-actualizar-versión-plugin)

**Subtotal SISTEMA/CORE**: 4 UC | ~3.5-6 horas

---

### REPORTES & ANALYTICS

UC ID | Nombre | Complejidad | Estimado | Archivo
-------|--------|------------|----------|--------
UC-031 | Dashboard de Análisis General | MEDIA | 2-3h | [⏳ PENDIENTE](UC-PENDIENTES-LISTADO-COMPLETO.md#uc-031-dashboard-de-análisis-general)

**Subtotal REPORTES**: 1 UC | ~2-3 horas

---

## RESUMEN DE TIEMPOS

```
TIER 1 (CRÍTICO):        16-21 horas  ✅ DOCUMENTADOS
TIER 2 (IMPORTANTE):     11-17 horas  ✅ DOCUMENTADOS
────────────────────────────────────────────────────
SUBTOTAL MVP:            27-38 horas

TIER 3 (OPCIONAL):        7-10 horas  ⏳ PENDIENTES
TIER 4 (ADMIN):           9-13 horas  ⏳ PENDIENTES
SETUP:                    4-6 horas   ⏳ PENDIENTES
INTEGRACIONES:            5-8 horas   ⏳ PENDIENTES
SISTEMA/CORE:             3.5-6 horas ⏳ PENDIENTES
REPORTES:                 2-3 horas   ⏳ PENDIENTES
────────────────────────────────────────────────────
SUBTOTAL PENDIENTE:       30-46 horas

TOTAL ESTIMADO:           57-84 horas de implementación
```

---

## MATRIZ DE DEPENDENCIAS

```
INDEPENDIENTES (Sin dependencias):
├─ UC-001 (Repositorio)
├─ UC-SYS01, SYS02, SYS03, SYS04 (Core)
└─ UC-P01, P02 (Setup)

NIVEL 1 (Dependen de independientes):
├─ UC-002 (Clasificar) ← UC-001
├─ UC-003 (Indexar) ← UC-001
└─ UC-008 (Crear Proyecto) ← (sin dependencias reales)

NIVEL 2 (Dependen de Nivel 1):
├─ UC-004 (Vincular Documento) ← UC-002, UC-003, UC-008
├─ UC-010 (Agregar Objetivo) ← UC-008
├─ UC-005 (Nota Fugaz) ← UC-001
└─ UC-012 (Agregar Tarea) ← UC-010

NIVEL 3 (Dependen de Nivel 2):
├─ UC-006 (Vincular a Tarea) ← UC-004, UC-012
├─ UC-013 (Cambiar Estado Proyecto) ← UC-008
├─ UC-014 (Cambiar Estado Obj/Tarea) ← UC-013
├─ UC-011 (Resultado Clave) ← UC-010
└─ UC-015 (Búsqueda Global) ← UC-002, UC-003

NIVEL 4 (Dependen de Nivel 3):
├─ UC-016, 017, 018 (Búsquedas refinadas) ← UC-015
├─ UC-019 (Consultar Archivado) ← UC-015
├─ UC-020 (Trazabilidad) ← UC-002, UC-004, UC-008
├─ UC-021 (Contexto Proyectos) ← UC-004
├─ UC-007 (Activar Proyecto) ← UC-013
└─ UC-009 (Activar Objetivo) ← UC-014

NIVEL 5+ (Dependen de Nivel 4+):
├─ UC-022 (Archivar Proyecto) ← UC-013
├─ UC-023 (Buscar Completados) ← UC-015
├─ UC-024 (Vincular Pilar) ← UC-004
├─ UC-025 (Referenciar Diario) ← UC-004
├─ UC-026 (Crear Doc desde Proyecto) ← UC-004, UC-002
├─ UC-027 (Reporte Proyecto) ← UC-008, UC-020
├─ UC-028 (Inventario) ← UC-015
├─ UC-029 (Dashboard Proyecto) ← UC-008, UC-010, UC-012
├─ UC-030 (Análisis Reutilización) ← UC-004
└─ UC-031 (Dashboard Analytics) ← UC-015, UC-020, UC-030
```

---

## RUTA DE IMPLEMENTACIÓN RECOMENDADA

### FASE 1: CORE & SETUP (Semanas 1-2)
```
Paralelo:
├─ UC-SYS01, SYS02, SYS03, SYS04 (Core system)
├─ UC-P01 (Instalación)
├─ UC-P02 (Configuración)
└─ UC-INT01, INT02, INT03 (Integraciones setup)

Secuencial después de setup:
└─ UC-001 (Crear Repositorio base)
```

### FASE 2: TIER 1 MVP CRÍTICO (Semanas 3-6)
```
Secuencial (dependencias):
├─ UC-002, UC-003 (Clasificar e Indexar)
├─ UC-008 (Crear Proyecto) [bloqueador de muchos]
├─ UC-010 (Agregar Objetivo) [bloqueador]
├─ UC-012 (Agregar Tarea) [bloqueador]
├─ Paralelo: UC-013, UC-015, UC-019, UC-020, UC-021
└─ UC-004 (Vincular) [necesita base]
```

### FASE 3: TIER 2 IMPORTANT v1.1 (Semanas 7-9)
```
Secuencial:
├─ UC-006, UC-007, UC-009, UC-011 (Refinamientos)
├─ UC-014 (Estado objetivo/tarea)
└─ UC-016, UC-017, UC-018 (Búsquedas refinadas)
```

### FASE 4: TIER 3+ FUTUROS (Semanas 10+)
```
Post-MVP, implementar según prioridad:
├─ UC-022, UC-023, UC-024, UC-025, UC-026 (TIER 3)
├─ UC-027, UC-028, UC-029, UC-030, UC-031 (TIER 4 + Reportes)
└─ Polish & optimización
```

---

## CHECKLIST DE DOCUMENTACIÓN

### ✅ COMPLETADO
- [x] UC-001 a UC-005 (previos)
- [x] UC-006 a UC-021 (nuevos TIER 1 + TIER 2) - 16 UC documentados
- [x] UC-PENDIENTES-LISTADO-COMPLETO.md (listado de los 19 pendientes)
- [x] ÍNDICE MASTER (este documento)

### ⏳ PRÓXIMO: IMPLEMENTACIÓN
- [ ] Preparar estructura del plugin TypeScript
- [ ] Implementar UC-SYS01, SYS02, SYS03, SYS04 (core)
- [ ] Implementar UC-P01, P02 (setup)
- [ ] Implementar UC-INT01, INT02, INT03 (integraciones)
- [ ] Implementar TIER 1 secuencialmente
- [ ] Implementar TIER 2
- [ ] Testing end-to-end
- [ ] Release v1.0

---

## CONEXIÓN ENTRE UC

```
FLUJO USUARIO TÍPICO:

1. Instala plugin (UC-P01)
2. Configura (UC-P02)
3. Crea Repositorio (UC-001)
   ├─ Clasifica documento (UC-002)
   ├─ Indexa (UC-003)
   └─ Visualiza en Búsqueda (UC-015)
4. Crea Proyecto (UC-008)
   ├─ Agrega Objetivo (UC-010)
   │  ├─ Agrega Resultado Clave (UC-011)
   │  └─ Agrega Tarea (UC-012)
   │     └─ Vincula documento a tarea (UC-006)
   ├─ Cambia estado (UC-013)
   └─ Ve trazabilidad (UC-020)
5. Ve contexto de documento (UC-021)
6. Busca en repositorio (UC-016)
7. Genera reporte (UC-027)

CICLO COMPLETO: UC-P01 → UC-001 → UC-008 → UC-020 → UC-027
```

---

## ESTADO ACTUAL

```
Sesión 2026-04-11:
├─ Documentación: 16/35 UC (46%) ✅ COMPLETADA
├─ Próxima sesión: IMPLEMENTACIÓN de UC-TIER 1
├─ Stack tecnológico: TypeScript + Obsidian API
├─ Testing: Jest + Integration tests
└─ Deadline estimado MVP: 6-8 semanas (si dedicación full-time)
```

---

**Documento Maestro**
**Creado**: 2026-04-11
**Última actualización**: 2026-04-11
**Responsable**: Equipo obsidian-repo
**Estado**: ACTUALIZADO - LISTO PARA IMPLEMENTACIÓN
