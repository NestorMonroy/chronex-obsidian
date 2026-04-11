```yaml
type: Caso de Uso Formal
title: UC-019 - CONSULTAR DOCUMENTO ARCHIVADO
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Consultas
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-019: CONSULTAR DOCUMENTO ARCHIVADO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-019 |
| **Nombre** | Consultar Documento Archivado |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | BAJA |
| **Bloquea MVP** | Parcial (búsqueda lo cubre) |
| **Dependencias** | UC-015 (búsqueda global) |

---

## 2. DESCRIPCIÓN BREVE

Usuario busca documento archivado usando UC-015 (búsqueda global). Sistema retorna documento con status archivado. Usuario abre documento, puede ver su contenido completo, metadata, historial de cambios, y relaciones. Documento es read-only para prevenir cambios accidentales. Usuario puede reactivar documento si lo necesita o acceder a él para referencia.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Busca y abre documento |
| **UC-015 Búsqueda** | Componente | Intermediario | Proporciona documento |
| **Obsidian Editor** | Componente | Secundario | Renderiza contenido |
| **Metadata Cache** | Componente | Secundario | Proporciona metadata |

---

## 4. PRECONDICIONES

### Técnicas

1. UC-015 (Búsqueda Global) funcional
2. Documento tiene status "archivado" en frontmatter
3. Archivo de documento existe
4. Obsidian pueda renderizar markdown

### De Negocio

1. Documento fue previamente clasificado (UC-002)
2. Documento fue archivado (cambio de estado)
3. Usuario tiene permisos de lectura

---

## 5. FLUJO PRINCIPAL

### PASO 1: Buscar Documento Archivado

```
Usuario usa UC-015:
  - Invoca "Búsqueda Global"
  - Ingresa término de búsqueda: "oauth2"
  - Filtro Estado: [archivado]
  - Presiona BUSCAR
```

### PASO 2: Sistema Retorna Documento

```
Resultados:
  ✓ OAuth2 Implementation (status: archivado)
    📁 AUTHENTICATION
    Archivado: 2026-04-08
    Actualizado: 2026-04-05
```

### PASO 3: Usuario Abre Documento

```
Usuario:
  - Click en resultado
  - OR presiona Enter
  - OR Ctrl+Click para nueva pestaña
```

### PASO 4: Sistema Abre Documento en Modo Read-Only

```javascript
// Detectar status archivado:
if (frontmatter.status === 'archivado') {
  // Modo read-only
  editor.setReadOnly(true);
  showBanner('Este documento está archivado. Ver en read-only.');
}
```

### PASO 5: Mostrar Banner Informativo

```
┌────────────────────────────────────────────┐
│ ⚠️ Este documento está ARCHIVADO           │
│ Archivado: 2026-04-08 por Nestor Monroy   │
│ [🔄 Reactivar] [📋 Ver Historial] [✕]    │
└────────────────────────────────────────────┘
```

### PASO 6: Mostrar Contenido Completo

```
Documento muestra:
├─ Frontmatter completo (metadata)
├─ Contenido markdown (read-only)
├─ Links internos funcionales [[como siempre]]
├─ Backlinks a este documento
└─ Archivos relacionados
```

### PASO 7: Mostrar Metadata Archivado

```yaml
Información del Documento:
├─ UID: DOC-202604-AUTH-001
├─ Tipo: documento
├─ Status: archivado ← Resaltado
├─ Repositorio: AUTHENTICATION
├─ Fecha Creación: 2026-04-01
├─ Fecha Arquivado: 2026-04-08
├─ Tamaño: 2.3 KB
├─ Actualizado: 2026-04-05
├─ Etiquetas: [oauth, security]
├─ Proyectos: [PROJ-202604-A1B2C]
└─ Documentos Relacionados: 5
```

### PASO 8: Mostrar Opciones de Usuario

```
Usuario puede:
├─ Leer contenido (read-only)
├─ Seguir links internos
├─ Ver backlinks
├─ Ver relaciones a proyectos/tareas
├─ Opción: Reactivar documento (ALT-1)
├─ Opción: Ver historial de cambios (ALT-2)
└─ Opción: Copiar contenido
```

### PASO 9: Historial de Cambios (Opcional)

```
Si usuario presiona "Ver Historial":
├─ 2026-04-08 14:30 - ARCHIVADO por Nestor
├─ 2026-04-05 10:15 - Actualizado por Nestor
├─ 2026-04-03 09:20 - Clasificado por Nestor
├─ 2026-04-01 12:45 - Creado por Nestor
└─ (Si Git disponible: Ver commit history)
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Usuario Intenta Editar

```
Si usuario intenta editar documento archivado:
  - Sistema bloquea edición
  - Mostrar: "No puedes editar un documento archivado"
  - Opción: "¿Reactivar documento?" [SÍ] [NO]
  
Si usuario presiona SÍ:
  - Cambiar status a "activo"
  - Actualizar fecha_actualizacion
  - Habilitar modo edición
  - Notificar: "Documento reactivado"
```

### ALT-2: Usuario Quiere Reactivar

```
Si usuario presiona [🔄 Reactivar]:
  - Modal: "¿Reactivar {documento}?"
  - Razón: [text input] (opcional)
  - [REACTIVAR] [CANCELAR]
  
Si usuario confirma:
  - status: "activo"
  - fecha_reactivacion: ahora
  - razon_reactivacion: texto ingresado
  - Registrar en auditoría
  - Habilitar edición
  - Notificar éxito
```

### ALT-3: Documento No Existe o Está Muy Viejo

```
Si documento no se puede cargar:
  - Error: "Documento no encontrado o corrupto"
  - Opción: "Ver en explorador de archivos"
  - Opción: "Ver en Git history"
```

---

## 7. POSTCONDICIONES

### Si éxito (lectura)

1. Documento abierto en editor
2. Contenido visible y read-only
3. Banner archivado mostrado
4. Metadata visible al usuario
5. Acciones permitidas disponibles
6. Usuario puede navegar contenido

### Si reactivación exitosa

1. status cambiado a "activo"
2. fecha_reactivacion registrada
3. Entrada de auditoría creada
4. Modo edición habilitado
5. Usuario notificado

---

## 8. FRONTMATTER DOCUMENTO ARCHIVADO

```yaml
---
UID: DOC-202604-AUTH-001
type: documento
status: archivado  # ← Key indicator
repositorio: AUTHENTICATION
titulo: "OAuth2 Implementation"
descripcion: "Completa..."
fecha_creacion: 2026-04-01
fecha_clasificacion: 2026-04-03
fecha_archivado: 2026-04-08
fecha_reactivacion: null
responsable: "Nestor Monroy"
hash: "sha256..."
proyectos: [PROJ-202604-A1B2C]
tags: [oauth, security, archived]
cssclass: [justify, noscroll, archived-document]
---
```

---

## 9. CASOS DE PRUEBA

### CT-001: Abrir documento archivado - read-only

```
ENTRADA:
  - Buscar "oauth2" con filtro archivado
  - Click en resultado

RESULTADO ESPERADO:
  - Documento abierto
  - Editor en read-only
  - Banner: "Este documento está archivado"
  - Metadata visible
  - Status: PASS
```

### CT-002: Usuario intenta editar

```
ENTRADA:
  - Documento archivado abierto
  - Usuario intenta escribir

RESULTADO ESPERADO:
  - Sistema bloquea edición
  - Mostrar: "No puedes editar archivado"
  - Opción: Reactivar
  - Status: PASS
```

### CT-003: Reactivar documento

```
ENTRADA:
  - Click [🔄 Reactivar]
  - Confirmar reactivación
  - Razón: "Encontré información nueva"

RESULTADO ESPERADO:
  - status: activo
  - fecha_reactivacion: ahora
  - razon_reactivacion registrada
  - Editor ahora editable
  - Notificación de éxito
  - Status: PASS
```

### CT-004: Ver historial cambios

```
ENTRADA:
  - Documento archivado abierto
  - Click [📋 Ver Historial]

RESULTADO ESPERADO:
  - Timeline de cambios mostrado
  - Eventos de: creación, clasificación, archivado
  - Fechas y usuarios visibles
  - Status: PASS
```

---

## 10. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Documento encontrado | Mostrar error |
| V2 | status = archivado | Abrir normal |
| V3 | Editor read-only | Forzar read-only |
| V4 | Banner mostrado | Log warning |
| V5 | Metadata accesible | Mostrar defaults |
| V6 | Reactivación válida | Pedir confirmación |

---

## 11. RELACIONES CON OTROS UC

```
UC-019 (Consultar Documento Archivado)
├─ Requiere: UC-015 (Búsqueda Global)
├─ Puede activar: UC-013 (Cambiar Estado)
├─ Referencia: UC-020 (Ver Trazabilidad)
└─ Relacionado: UC-022 (Archivar Proyecto)
```

---

## 12. CRITERIOS DE ACEPTACIÓN

- [ ] UC-015 retorna documentos archivados cuando se filtra
- [ ] Documento archivado se abre en read-only
- [ ] Banner informativo mostrado con fecha archivado
- [ ] Metadata del documento visible
- [ ] Usuario NO puede editar contenido
- [ ] Intento de editar muestra error
- [ ] Opción [Reactivar] disponible
- [ ] Reactivación abre modal de confirmación
- [ ] Reactivación cambia status a "activo"
- [ ] Reactivación registra en auditoría
- [ ] Historial de cambios disponible (opcional)
- [ ] Links internos funcionales

---

## 13. TIMELINE & ESFUERZO

- **Estimado**: 1 hora (es principalmente lectura)
- **Dependencias**: UC-015
- **Bloqueador de**: Ninguno
- **Bloquea MVP**: Parcial (búsqueda lo cubre)

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
