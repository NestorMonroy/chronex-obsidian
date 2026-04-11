```yaml
type: Documento de Planificación
title: UC-PENDIENTES - Listado de Casos de Uso Faltantes
version: 1.0.0
project: obsidian-repo
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Documento de Referencia
```

# UC-PENDIENTES: CASOS DE USO FALTANTES POR DOCUMENTAR

## RESUMEN EJECUTIVO

```
Total UC a documentar:     13 UC
Estado actual:             16/35 UC documentados (46%)
Pendientes por documentar: 19 UC (54%)

DISTRIBUICIÓN:
├─ TIER 3 (Opcionales):     5 UC
├─ TIER 4 (Administración): 4 UC
├─ Setup/Configuración:     2 UC
├─ Integraciones:           3 UC
├─ Sistema/Core:            4 UC
└─ Reportes/Analytics:      1 UC

Estimado de documentación: 8-10 horas (5-7 horas si se agilizan)
```

---

## TIER 3: OPCIONALES (v1.2+) - 5 UC

### UC-022: Archivar Proyecto Completado

**Descripción**: Usuario abre proyecto completado (status=completado) e invoca "Archivar Proyecto". Sistema verifica que proyecto esté completado, lo mueve a subcarpeta "archivados/" (opcional), marca tags como "archivado", genera reporte final de cierre, notifica. Proyecto archivado se oculta de vistas activas pero permanece accesible para búsqueda histórica.

**Dependencias**: UC-008, UC-013 (cambio a completado)
**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Verifica que proyecto está COMPLETADO
- [ ] Puede mover a carpeta "archivados" (opcional)
- [ ] Agrega tag "archivado" a frontmatter
- [ ] Genera reporte de cierre
- [ ] Oculta de vistas activas pero accesible en búsqueda
- [ ] Notifica archivación

---

### UC-023: Buscar Proyectos Completados

**Descripción**: Usuario invoca "Buscar Proyectos Completados" desde dashboard o command palette. Sistema retorna lista de proyectos con status=completado. Muestra fecha de completación, duración total, estadísticas finales (objetivos completados, tareas completadas, documentos). Usuario puede ver historial de proyectos terminados.

**Dependencias**: UC-015 (búsqueda base), UC-022 (archivados)
**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Filtra proyectos con status=completado
- [ ] Muestra fecha de completación
- [ ] Muestra duración en días
- [ ] Muestra estadísticas finales
- [ ] Resultados ordenables por fecha o duración
- [ ] Links para abrir proyecto

---

### UC-024: Vincular a Pilar (200-METAS)

**Descripción**: Extensión de UC-004. Usuario abre documento y lo vincula a un pilar en 200-METAS (objetivos estratégicos). Sistema permite seleccionar pilar, actualiza documento con `pilar_padre`, actualiza pilar con documento en array. Permite trazabilidad desde estrategia hasta documento operacional.

**Dependencias**: UC-004 (patrón vinculación)
**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Modal permite seleccionar pilar de 200-METAS
- [ ] Valida que pilar existe
- [ ] Actualiza documento con pilar_padre
- [ ] Actualiza pilar con documento en array
- [ ] Bidireccionalidad verificada

---

### UC-025: Referenciar en Diario (400-DIARIO)

**Descripción**: Usuario abre nota de diario (400-DIARIO/YYYY-MM-DD.md) e invoca "Referenciar Documento". Sistema permite seleccionar documento, crea reference embebida en nota del día. Documento aparece en nota del día con link y metadata. Útil para registrar trabajo del día sobre documentos específicos.

**Dependencias**: UC-004 (patrón vinculación)
**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Modal permite seleccionar documento
- [ ] Crea embedded reference en nota diaria
- [ ] Documenta qué se hizo con documento
- [ ] Backlink desde documento a nota diaria

---

### UC-026: Crear Documento desde Proyecto

**Descripción**: Usuario abierto en proyecto invoca "Crear Documento Aquí". Sistema abre QuickAdd con contexto del proyecto, pre-rellena `proyecto_padre`, usuario clasifica el documento, sistema crea documento.md ya vinculado al proyecto. Flujo inverso: en lugar de clasificar primero y vincular luego, se crea ya vinculado.

**Dependencias**: UC-004 (vinculación), UC-002 (clasificación)
**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Detecta contexto de proyecto
- [ ] Pre-rellena proyecto_padre en clasificación
- [ ] Usuario no necesita vincular después
- [ ] Documento creado con relación establecida

---

## TIER 4: ADMINISTRACIÓN (v2.0) - 4 UC

### UC-027: Generar Reporte de Proyecto

**Descripción**: Usuario abierto en proyecto invoca "Generar Reporte". Sistema construye reporte completo: resumen ejecutivo, objetivos y progreso, tareas completadas/pendientes, documentación vinculada, timeline, recursos utilizados. Exporta a PDF o markdown. Útil para presentaciones de cierre o status updates.

**Dependencias**: UC-008, UC-020 (trazabilidad)
**Complejidad**: MEDIA-ALTA
**Timeline**: 3-4 horas
**Criterios**:
- [ ] Construye resumen ejecutivo
- [ ] Lista objetivos con % completado
- [ ] Lista tareas con status
- [ ] Documenta todos vinculados
- [ ] Timeline de hitos
- [ ] Exportable a PDF
- [ ] Exportable a markdown

---

### UC-028: Generar Inventario de Repositorio

**Descripción**: Usuario invoca "Inventario de Repositorio" desde repositorio. Sistema genera inventario: lista de todos documentos, distribución por proyecto, documentación sin clasificar, archivados, estadísticas (total docs, tamaño, últimas actualizaciones). Exporta como tabla markdown o CSV.

**Dependencias**: UC-015 (búsqueda)
**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Lista todos documentos del repositorio
- [ ] Agrupa por proyecto
- [ ] Muestra documentos sin clasificar
- [ ] Muestra archivados
- [ ] Estadísticas de tamaño y fecha
- [ ] Exportable a CSV

---

### UC-029: Dashboard de Documentación de Proyecto

**Descripción**: Dataviewjs dashboard específico por proyecto. Muestra: progreso de objetivos (barras), tareas pendientes, documentación reciente, salud del proyecto (índice), enlaces a todos objetivos y tareas. Actualiza dinámicamente. Accesible desde proyecto.md o dashboard central.

**Dependencias**: UC-008, UC-010, UC-012
**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Barras de progreso de objetivos
- [ ] Lista de tareas pendientes
- [ ] Documentación reciente
- [ ] Índice de salud del proyecto
- [ ] Links a objetivos
- [ ] Links a tareas
- [ ] Actualiza dinámicamente con dataviewjs

---

### UC-030: Análisis de Reutilización de Documentos

**Descripción**: User invoca "Analizar Reutilización". Sistema genera reporte: documentos más vinculados, documentos sin vincular (huérfanos), documentos en múltiples proyectos, patrones de reutilización. Identifica documentación "candidata para consolidar" y documentación "no utilizada".

**Dependencias**: UC-004 (vinculación)
**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Identifica documentos más vinculados
- [ ] Identifica documentos huérfanos
- [ ] Identifica documentos en múltiples proyectos
- [ ] Sugiere consolidación
- [ ] Sugiere archivado de no utilizados

---

## SETUP & CONFIGURACIÓN - 2 UC

### UC-P01: Instalar Plugin

**Descripción**: Usuario descarga obsidian-repo plugin desde releases de GitHub. Extrae en carpeta plugins/ de vault. Obsidian detecta plugin, usuario habilita. Primera vez: sistema ejecuta setup wizard que crea estructura base (100-INBOX, 200-PROYECTOS, 500-REPOSITORIOS, 990-UTILIDADES). Plugin listo para usar.

**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Plugin descargable desde GitHub releases
- [ ] Extracción en plugins/ funciona
- [ ] Setup wizard crea estructura base
- [ ] Crea carpetas requeridas
- [ ] Genera archivo de configuración default
- [ ] Plugin funcional post-instalación

---

### UC-P02: Configurar Plugin

**Descripción**: Usuario abre Settings tab del plugin. Interfaz permite configurar: rutas de carpetas (INBOX, PROYECTOS, REPOSITORIOS), nombres de templates, habilitar/deshabilitar features, configurar logging, establecer idioma. Cambios se guardan en data.json del plugin. Permite customización sin hardcoding.

**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Settings tab accesible desde Obsidian settings
- [ ] Permite cambiar rutas de carpetas
- [ ] Permite seleccionar templates personalizados
- [ ] Toggle para features
- [ ] Toggle para logging
- [ ] Selector de idioma
- [ ] Cambios se persisten en data.json

---

## INTEGRACIONES - 3 UC

### UC-INT01: Integración con QuickAdd

**Descripción**: Plugin se integra con QuickAdd: define macros predefinidas (mAddProyecto, mAddObjetivo, mAddTarea, mAddDocumento), registra scripts core-services/ automáticamente, actualiza data.json de QuickAdd al instalar. Usuarios pueden customizar macros.

**Dependencias**: UC-P01 (instalación)
**Complejidad**: MEDIA-ALTA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Macros registradas en QuickAdd
- [ ] Scripts importables desde QuickAdd
- [ ] data.json de QuickAdd actualizado
- [ ] Usuarios pueden modificar macros
- [ ] Sin conflictos de nombres

---

### UC-INT02: Procesamiento con Templater

**Descripción**: Plugin integra con Templater: templates usan funciones de plugin para validar datos, generar IDs, obtener metadata. Usuarios escriben templates que acceden a `tp.user.PROJECT_ID()`, `tp.user.validate()`, etc. Templater procesa templates con funciones del plugin.

**Dependencias**: UC-P01
**Complejidad**: MEDIA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Funciones disponibles en contexto de Templater
- [ ] Validación callable desde template
- [ ] Generación de IDs callable
- [ ] Metadata accessible desde template

---

### UC-INT03: Flujo Cross-Plugin (QuickAdd → Templater → Obsidian)

**Descripción**: Flujo completo integrado: usuario invoca macro QuickAdd → QuickAdd ejecuta script del plugin → script llama validación → script carga template Templater → Templater procesa y usa funciones del plugin → genera archivo final en Obsidian con metadata correcta. Sin errores de integración.

**Dependencias**: UC-INT01, UC-INT02
**Complejidad**: MEDIA-ALTA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Flujo end-to-end sin errores
- [ ] QuickAdd → Plugin → Templater → Obsidian
- [ ] Metadata generada correctamente
- [ ] Sin conflictos entre plugins
- [ ] Casos de error manejados

---

## SISTEMA/CORE - 4 UC

### UC-SYS01: Validar Entrada de Usuario

**Descripción**: Core system UC. Sistema implementa validación robusta para todos inputs de usuario: nombres (no caracteres especiales), descripciones (max 1000 chars), IDs (formato válido), fechas (rango válido), emails (si aplica). Valida antes de operación. Retorna errores claros si falla.

**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] Valida nombres (regex)
- [ ] Valida descripciones (length)
- [ ] Valida IDs (formato)
- [ ] Valida fechas (range)
- [ ] Errores específicos por tipo

---

### UC-SYS02: Generar ID Único

**Descripción**: Core system UC. Sistema usa crypto.getRandomValues() para generar IDs únicos garantizados. Formato: `{TYPE}-{YYYYMM}-{UNIQUE}`. Ejemplo: `DOC-202604-A1B2C`. Previene colisiones en vault. IDs son inmutables.

**Complejidad**: BAJA
**Timeline**: 1 hora
**Criterios**:
- [ ] Genera formato correcto
- [ ] Usa Web Crypto API
- [ ] No hay colisiones
- [ ] IDs inmutables
- [ ] Timestamp correcto

---

### UC-SYS03: Mostrar Notificación

**Descripción**: Core system UC. Sistema muestra notificaciones a usuario: información (verde), advertencia (amarillo), error (rojo). Usa `new Notice(message)` de Obsidian. Notificaciones cortas y accionables.

**Complejidad**: BAJA
**Timeline**: 30 min
**Criterios**:
- [ ] Notificaciones info, warning, error
- [ ] Colores apropiados
- [ ] Mensajes claros
- [ ] Auto-dismiss después 5s

---

### UC-SYS04: Actualizar Versión Plugin

**Descripción**: Core system UC. Sistema registra versión actual en manifest.json. Al actualizar plugin, sistema detecta cambio de versión en data.json vs manifest.json, ejecuta migrations si es necesario, registra cambio en log. Permite historial de cambios de versión.

**Complejidad**: BAJA
**Timeline**: 1-2 horas
**Criterios**:
- [ ] manifest.json tiene versión
- [ ] Detecta actualización
- [ ] Ejecuta migrations
- [ ] Registra cambio en log
- [ ] Backward compatible

---

## REPORTES & ANALYTICS - 1 UC

### UC-031: Dashboard de Análisis General

**Descripción**: Dataviewjs dashboard centralizado que muestra: estadísticas globales (total documentos, proyectos, objetivos), actividad reciente (documentos modificados, proyectos completados), salud general (% completado de proyectos), lista de proyectos activos, documentos más vinculados, documentos huérfanos. Actualiza dinámicamente.

**Dependencias**: UC-015, UC-020, UC-030
**Complejidad**: MEDIA
**Timeline**: 2-3 horas
**Criterios**:
- [ ] Estadísticas globales
- [ ] Actividad reciente
- [ ] Índice de salud general
- [ ] Lista proyectos activos
- [ ] Top documentos más usados
- [ ] Documentos huérfanos
- [ ] Actualiza dinámicamente

---

## RESUMEN DE PENDIENTES

| UC | Nombre | Tier | Complejidad | Horas | Estado |
|----|--------|------|-------------|-------|--------|
| UC-022 | Archivar Proyecto | TIER 3 | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-023 | Buscar Completados | TIER 3 | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-024 | Vincular a Pilar | TIER 3 | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-025 | Referenciar en Diario | TIER 3 | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-026 | Crear Doc desde Proyecto | TIER 3 | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-027 | Generar Reporte Proyecto | TIER 4 | MEDIA-ALTA | 3-4 | ⏳ PENDIENTE |
| UC-028 | Inventario Repositorio | TIER 4 | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-029 | Dashboard Proyecto | TIER 4 | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-030 | Análisis Reutilización | TIER 4 | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-P01 | Instalar Plugin | SETUP | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-P02 | Configurar Plugin | SETUP | MEDIA | 2-3 | ⏳ PENDIENTE |
| UC-INT01 | Integración QuickAdd | INT | MEDIA-ALTA | 2-3 | ⏳ PENDIENTE |
| UC-INT02 | Procesamiento Templater | INT | MEDIA | 1-2 | ⏳ PENDIENTE |
| UC-INT03 | Cross-Plugin Flow | INT | MEDIA-ALTA | 2-3 | ⏳ PENDIENTE |
| UC-SYS01 | Validar Entrada | CORE | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-SYS02 | Generar ID | CORE | BAJA | 1 | ⏳ PENDIENTE |
| UC-SYS03 | Mostrar Notificación | CORE | BAJA | 0.5 | ⏳ PENDIENTE |
| UC-SYS04 | Actualizar Versión | CORE | BAJA | 1-2 | ⏳ PENDIENTE |
| UC-031 | Dashboard Analytics | REPORTS | MEDIA | 2-3 | ⏳ PENDIENTE |

**TOTAL**: 19 UC pendientes
**TIEMPO ESTIMADO**: 35-48 horas
**PRIORIDAD**: Post-MVP (después de implementar TIER 1 + TIER 2)

---

## ROADMAP SUGERIDO

### FASE 1: IMPLEMENTACIÓN (Actual)
```
Semana 1-4: Implementar TIER 1 (8 UC)
Semana 5-7: Implementar TIER 2 (8 UC)
Semana 8-12: Implementar TIER 3 + Setup (7 UC)
```

### FASE 2: DOCUMENTACIÓN (Actual)
```
Semana 1-2: Documentar TIER 1 ✅ COMPLETADO
Semana 3: Documentar TIER 2 ✅ COMPLETADO
Semana 4: Documentar TIER 3 + pendientes ⏳ PRÓXIMO
```

### FASE 3: EXTENSIÓN (Post-MVP)
```
Semana 13-16: Implementar TIER 4 + Reportes
Semana 17-20: Integraciones completas
Semana 21-24: Testing + Pulido final
```

---

## NOTAS IMPORTANTES

1. **TIER 1 es bloqueador**: Debe completarse antes de TIER 2
2. **TIER 2 es enhancement**: Mejora UX pero no crítica
3. **TIER 3+ es futuro**: Post-MVP, puede esperar
4. **Setup UC (P01, P02)**: Crítico para releasability
5. **Core UC (SYS01-04)**: Pueden implementarse en paralelo
6. **Documentación incremental**: Documentar mientras se implementa

---

**Creado**: 2026-04-11
**Último Update**: 2026-04-11
**Estado**: DOCUMENTO DE REFERENCIA - ACTUALIZADO
