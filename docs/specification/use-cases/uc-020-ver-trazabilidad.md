```yaml
type: Caso de Uso Formal
title: UC-020 - VER TRAZABILIDAD COMPLETA
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Auditoría
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-020: VER TRAZABILIDAD COMPLETA

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-020 |
| **Nombre** | Ver Trazabilidad Completa |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ (para auditoría) |
| **Dependencias** | UC-002, UC-004, UC-008 |

---

## 2. DESCRIPCIÓN BREVE

Usuario invoca comando "Ver Trazabilidad" desde documento, proyecto u objetivo. Sistema genera vista completa mostrando: línea de tiempo de cambios, quién hizo cada acción, cuándo, vinculaciones a otros entidades, cambios de estado. Trazabilidad se construye desde log de auditoría central. Usuario ve DAG (grafo acíclico dirigido) de relaciones y puede navegar entre relacionados.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca comando, navega trazabilidad |
| **Archivo Actual** | Contexto | Requerimiento | Proporciona UID para búsqueda |
| **Log Auditoría Central** | Componente | Secundario | Proporciona eventos |
| **Dataviewjs** | Componente | Secundario | Construye timeline y relaciones |
| **Modal/Sidebar** | UI | Secundario | Visualiza grafo y timeline |

---

## 4. PRECONDICIONES

### Técnicas

1. Archivo abierto con UID válido (documento, proyecto, objetivo)
2. Log de auditoría central existe
3. Dataviewjs funcional para queries
4. Mermaid o D3.js disponible para grafo (opcional)
5. Timestamps válidos en log

### De Negocio

1. Entidad fue creada (UC-001, UC-008, UC-010)
2. Hay al menos 1 evento en auditoría
3. Usuario tiene permisos de auditoría

---

## 5. FLUJO PRINCIPAL

### PASO 1: Invocar Trazabilidad

```
Usuario abierto en: documento.md, proyecto.md u objetivo.md
Usuario: command palette → "Ver Trazabilidad"
Sistema: extrae UID del archivo abierto
```

### PASO 2: Extraer UID y Buscar Log

```javascript
const activeFile = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(activeFile).frontmatter;
const uid = frontmatter.UID;  // Ej: DOC-202604-AUTH-001

// Buscar en log central de auditoría:
const auditLog = vault.getAbstractFileByPath('990-UTILIDADES/audit/audit.log');
const events = parseAuditLog(auditLog, uid);
```

### PASO 3: Construir Timeline

```javascript
const timeline = events.map(evt => ({
  timestamp: evt.fecha,
  evento: evt.accion,
  usuario: evt.usuario,
  detalles: evt.detalles,
  cambios: evt.cambios,
  contexto: evt.contexto
}));

// Ordenar por fecha descendente (más recientes arriba)
timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
```

### PASO 4: Construir Grafo de Relaciones

```javascript
// Recolectar todas las entidades relacionadas:
const relaciones = {
  padre: frontmatter.objetivo_padre,      // Si es tarea
  proyecto: frontmatter.proyecto_padre,   // Si es documento
  objetivos: frontmatter.objetivos,       // Si es proyecto
  tareas: frontmatter.tareas,             // Si es objetivo
  documentos_vinculados: frontmatter.documentos_vinculados
};

// Construir DAG:
// Nodo central = UID actual
// Aristas = relaciones
```

### PASO 5: Mostrar Vista de Trazabilidad

```
┌─────────────────────────────────────────────────────┐
│ TRAZABILIDAD: OAuth2 Implementation (DOC-xxx-001)   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 ESTADÍSTICAS                                    │
│  ├─ Creado: 2026-04-01 12:45                       │
│  ├─ Última actualización: 2026-04-10 14:20         │
│  ├─ Cambios totales: 8                             │
│  └─ Usuarios involucrados: 1 (Nestor Monroy)       │
│                                                     │
│  📝 TIMELINE DE CAMBIOS                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ 2026-04-10 14:20 - Actualizado                │  │
│  │   Por: Nestor Monroy                           │  │
│  │   Cambios: Actualizado frontmatter             │  │
│  │                                                 │  │
│  │ 2026-04-08 10:15 - Archivado                   │  │
│  │   Por: Nestor Monroy                           │  │
│  │   Razón: Proyecto completado                   │  │
│  │                                                 │  │
│  │ 2026-04-03 09:20 - Clasificado                 │  │
│  │   Por: Nestor Monroy                           │  │
│  │   Clasificación: DOC-202604-AUTH-001           │  │
│  │                                                 │  │
│  │ 2026-04-01 12:45 - Creado                      │  │
│  │   Por: Nestor Monroy                           │  │
│  │   Template: repository-note.md                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  🔗 RELACIONES                                      │
│  ├─ Proyecto: E-Commerce Platform                  │
│  │  └─ [Abrir Proyecto]                           │
│  ├─ Documentos Vinculados: 3                       │
│  │  ├─ [JWT Implementation]                       │
│  │  ├─ [OAuth2 Best Practices]                    │
│  │  └─ [Security Guidelines]                      │
│  └─ Tareas Relacionadas: 2                         │
│     ├─ [Implementar OAuth2]                       │
│     └─ [Escribir tests]                           │
│                                                     │
│  [Exportar] [Copiar] [Cerrar]                      │
└─────────────────────────────────────────────────────┘
```

### PASO 6: Mostrar Timeline Detallado

```javascript
timeline.forEach(evt => {
  displayEvent({
    fecha: evt.timestamp,
    icono: getIconForAction(evt.evento),
    evento: evt.evento,
    usuario: evt.usuario,
    detalles: evt.detalles,
    clickable: evt.contexto  // Para navegar a entidad relacionada
  });
});
```

### PASO 7: Mostrar Grafo de Relaciones

```
Opción A: Texto (siempre disponible)
┌─────────────────────┐
│  DOC-202604-AUTH-001│  ← Nodo central
└──────────┬──────────┘
           │
      ┌────┴─────────────────────────┐
      ▼                             ▼
┌──────────────────┐       ┌──────────────────────┐
│ PROJ-202604-ABC  │       │ DOC-202604-AUTH-002  │
│ E-Commerce       │       │ JWT Implementation   │
└──────────────────┘       └──────────────────────┘
      ▼
 ┌────────────┐
 │ OBJ-...    │
 │ Objetivo 1 │
 └────────────┘

Opción B: Gráfico Mermaid (si D3/Mermaid disponible)
graph LR
  DOC["DOC-xxx"] --> PROJ["PROJ-xxx"]
  DOC --> DOC2["DOC-yyy"]
  PROJ --> OBJ["OBJ-zzz"]
```

### PASO 8: Permitir Navegación

```
Usuario puede:
├─ Click en nombre de proyecto → Abrir proyecto.md
├─ Click en nombre de tarea → Abrir tarea.md
├─ Click en nombre de documento → Abrir documento.md
├─ Click en evento → Mostrar detalles del cambio
└─ Click en usuario → (Opcional) Ver otros cambios por usuario
```

### PASO 9: Opciones de Exportación

```
[Exportar] botón permite:
├─ Copiar timeline como markdown
├─ Copiar grafo como mermaid
├─ Exportar a JSON (para análisis)
└─ Generar reporte PDF (futuro)
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Sin eventos en auditoría

```
Si no hay eventos registrados:
  - Mostrar: "Sin cambios registrados"
  - Mostrar solo: fecha_creacion
  - Opción: "Ver metadata actual"
```

### ALT-2: UID no válido

```
Si archivo no tiene UID:
  - Error: "Este archivo no tiene UID válido"
  - Sugerir: "Clasificar el documento primero"
```

### ALT-3: Log de auditoría corrupto

```
Si log no se puede leer:
  - Error: "No se puede leer auditoría"
  - Fallback: Mostrar solo timestamps del frontmatter
  - Opción: "Reconstruir log"
```

---

## 7. POSTCONDICIONES

### Si éxito

1. Vista de trazabilidad abierta
2. Timeline de eventos mostrado
3. Grafo de relaciones visible
4. Usuario puede navegar relaciones
5. Usuario puede exportar información
6. Trazabilidad es read-only

### Si fallo

1. Error mostrado
2. Sugerencias alternativas
3. Usuario puede cerrar y reintentar

---

## 8. ESTRUCTURA DE LOG DE AUDITORÍA

```yaml
# 990-UTILIDADES/audit/audit.log (central)
# Formato: JSONL (one JSON per line)

{"uid": "DOC-202604-AUTH-001", "fecha": "2026-04-10T14:20:00Z", "accion": "ACTUALIZADO", "usuario": "Nestor Monroy", "cambios": {"status": ["archivado", "activo"]}, "contexto": "Documento reactivado"}
{"uid": "DOC-202604-AUTH-001", "fecha": "2026-04-08T10:15:00Z", "accion": "ARCHIVADO", "usuario": "Nestor Monroy", "cambios": {"status": ["activo", "archivado"]}, "contexto": "Proyecto completado"}
{"uid": "DOC-202604-AUTH-001", "fecha": "2026-04-03T09:20:00Z", "accion": "CLASIFICADO", "usuario": "Nestor Monroy", "cambios": {"UID": [null, "DOC-202604-AUTH-001"]}, "contexto": "Clasificación automática"}
{"uid": "DOC-202604-AUTH-001", "fecha": "2026-04-01T12:45:00Z", "accion": "CREADO", "usuario": "Nestor Monroy", "cambios": {"UID": [null, "DOC-202604-AUTH-001"]}, "contexto": "Creado desde UC-005"}

# O alternativamente: Por archivo
# 990-UTILIDADES/audit/doc-{uid}.md (archivo separado por entidad)

# O estructura híbrida: ambos (para búsqueda rápida + details)
```

---

## 9. CASOS DE PRUEBA

### CT-001: Ver trazabilidad documento

```
ENTRADA:
  - Documento.md abierto
  - Comando: "Ver Trazabilidad"

RESULTADO ESPERADO:
  - Timeline mostrado (4+ eventos)
  - Grafo de relaciones visible
  - Proyectos relacionados clickeables
  - Status: PASS
```

### CT-002: Ver trazabilidad proyecto

```
ENTRADA:
  - Proyecto.md abierto
  - Comando: "Ver Trazabilidad"

RESULTADO ESPERADO:
  - Timeline mostrado
  - Objetivos y tareas relacionados
  - Documentos vinculados
  - Status: PASS
```

### CT-003: Sin eventos en auditoría

```
ENTRADA:
  - Archivo nuevo sin cambios
  - Ver Trazabilidad

RESULTADO ESPERADO:
  - Mostrar: "Sin cambios registrados"
  - Mostrar: fecha_creacion
  - Status: PASS
```

### CT-004: Navegar relaciones

```
ENTRADA:
  - Trazabilidad abierta
  - Click en proyecto relacionado

RESULTADO ESPERADO:
  - Proyecto.md abre
  - Status: PASS
```

---

## 10. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Archivo tiene UID | Error ALT-2 |
| V2 | UID válido | Validar formato |
| V3 | Log auditoría existe | Crear si no existe |
| V4 | Eventos encontrados | ALT-1 |
| V5 | Timeline ordenado | Ordenar por fecha |
| V6 | Relaciones válidas | Ignorar inválidas |

---

## 11. RELACIONES CON OTROS UC

```
UC-020 (Ver Trazabilidad)
├─ Requiere: UC-002, UC-004, UC-008
├─ Usa: Log auditoría de todos los UC
├─ Visualiza: UC-013 (cambios de estado)
└─ Accesible desde: cualquier documento/proyecto/objetivo
```

---

## 12. CRITERIOS DE ACEPTACIÓN

- [ ] Comando "Ver Trazabilidad" disponible
- [ ] Extrae UID del archivo abierto
- [ ] Busca eventos en log de auditoría
- [ ] Timeline mostrado ordenado por fecha (descendente)
- [ ] Evento muestra: fecha, acción, usuario, detalles
- [ ] Grafo de relaciones construido correctamente
- [ ] Relaciones clickeables y navegables
- [ ] ALT-1: Sin eventos muestra mensaje adecuado
- [ ] ALT-2: Sin UID muestra error adecuado
- [ ] Exportación de timeline disponible
- [ ] Exportación de grafo disponible (Mermaid)
- [ ] Vista es read-only

---

## 13. TIMELINE & ESFUERZO

- **Estimado**: 2-3 horas (incluye diseño de UI)
- **Dependencias**: UC-002, UC-004, UC-008 completados
- **Bloqueador de**: Reportes (UC-027)
- **Bloquea MVP**: SÍ (para auditoría)

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
