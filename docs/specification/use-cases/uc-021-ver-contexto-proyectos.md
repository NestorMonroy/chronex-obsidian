```yaml
type: Caso de Uso Formal
title: UC-021 - VER CONTEXTO EN PROYECTOS
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Visualización
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-021: VER CONTEXTO EN PROYECTOS

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-021 |
| **Nombre** | Ver Contexto en Proyectos |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-004 (vinculación) |

---

## 2. DESCRIPCIÓN BREVE

Usuario visualiza un documento o proyecto y ve automáticamente en qué proyectos, objetivos y tareas está vinculado. Sistema construye "contexto anidado" mostrando jerarquía: Proyecto > Objetivo > Tarea > Documento actual. Permite navegación rápida entre niveles. Útil para entender posición de documento en estructura mayor sin navegar archivos.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Visualiza contexto |
| **Archivo Abierto** | Contexto | Requerimiento | Proporciona UID |
| **Dataviewjs** | Componente | Secundario | Construye jerarquía |
| **Panel Lateral** | UI | Secundario | Visualiza árbol de contexto |

---

## 4. PRECONDICIONES

### Técnicas

1. Usuario tiene archivo abierto (documento, proyecto, objetivo o tarea)
2. Archivo tiene UID válido
3. Archivo está vinculado a proyecto/objetivo/tarea (relaciones existen)
4. Dataviewjs funcional
5. Panel lateral disponible en Obsidian

### De Negocio

1. Archivo fue vinculado mediante UC-004 (o creado dentro de proyecto)
2. Relaciones son válidas (no orphaned)
3. Usuario puede navegar estructura

---

## 5. FLUJO PRINCIPAL

### PASO 1: Detectar Archivo Abierto

```javascript
const activeFile = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(activeFile).frontmatter;
const uid = frontmatter.UID;
const type = frontmatter.type;  // documento, proyecto, objetivo, tarea

// Extender información desde frontmatter:
const proyecto_padre = frontmatter.proyecto_padre;
const objetivo_padre = frontmatter.objetivo_padre;
const documentos_vinculados = frontmatter.documentos_vinculados;
```

### PASO 2: Construir Jerarquía

```javascript
// CASO 1: Documento abierto
if (type === 'documento') {
  const context = {
    nivel_0: { uid: proyecto_padre, type: 'proyecto' },  // Si existe
    nivel_1: { uid: objetivo_padre, type: 'objetivo' },  // Si existe (de tarea)
    nivel_2: { uid: null, type: 'tarea' },              // Si está vinculado a tarea
    nivel_3: { uid, type: 'documento', current: true }
  };
}

// CASO 2: Tarea abierta
if (type === 'tarea') {
  const context = {
    nivel_0: { uid: proyecto_padre, type: 'proyecto' },
    nivel_1: { uid: objetivo_padre, type: 'objetivo' },
    nivel_2: { uid, type: 'tarea', current: true },
    nivel_3: []  // Documentos vinculados a esta tarea
  };
}

// CASO 3: Objetivo abierto
if (type === 'objetivo') {
  const context = {
    nivel_0: { uid: proyecto_padre, type: 'proyecto' },
    nivel_1: { uid, type: 'objetivo', current: true },
    nivel_2: [],  // Tareas dentro
    nivel_3: []   // Documentos
  };
}

// CASO 4: Proyecto abierto
if (type === 'proyecto') {
  const context = {
    nivel_0: { uid, type: 'proyecto', current: true },
    nivel_1: [],  // Objetivos dentro
    nivel_2: [],  // Tareas dentro
    nivel_3: []   // Documentos
  };
}
```

### PASO 3: Cargar Información de Padre

```javascript
// Cargar nombre y metadata de proyecto padre
if (context.nivel_0.uid) {
  const projectFile = vault.getAbstractFileByPath(
    `200-PROYECTOS/{nombre}/${context.nivel_0.uid}.md`
  );
  context.nivel_0.nombre = projectMetadata.nombre;
  context.nivel_0.status = projectMetadata.status;
  context.nivel_0.ruta = projectFile.path;
}

// Idem para objetivo padre
if (context.nivel_1.uid) {
  const objectiveFile = vault.getAbstractFileByPath(
    `200-PROYECTOS/{proyecto}/01-objetivos/${context.nivel_1.uid}.md`
  );
  context.nivel_1.nombre = objectiveMetadata.nombre;
  context.nivel_1.status = objectiveMetadata.status;
  context.nivel_1.ruta = objectiveFile.path;
}
```

### PASO 4: Construir Árbol de Contexto

```
CONTEXTO DEL DOCUMENTO ACTUAL:
┌─────────────────────────────────────┐
│ NIVEL 0: PROYECTO                   │
├─────────────────────────────────────┤
│ 📁 E-Commerce Platform              │  ← Clickeable
│    Status: ACTIVO                   │
│    UID: PROJ-202604-A1B2C           │
│                                     │
│ └─ NIVEL 1: OBJETIVO                │
│    📌 Implementar Autenticación     │  ← Clickeable
│       Status: EN PROGRESO           │
│       UID: OBJ-202604-...           │
│                                     │
│       └─ NIVEL 2: TAREA             │
│          ✓ Implementar OAuth2       │  ← Clickeable
│            Status: COMPLETADO       │
│            UID: TSK-202604-...      │
│                                     │
│             └─ NIVEL 3: DOCUMENTO   │
│                🔗 OAuth2 Impl...    │  ← ACTUAL (resaltado)
│                   Status: ARCHIVADO │
│                   UID: DOC-202604...│
│                                     │
│                └─ DOCUMENTOS RELACIONADOS
│                   🔗 JWT Impl...    │  ← Clickeable
│                   🔗 Security G...  │  ← Clickeable
└─────────────────────────────────────┘
```

### PASO 5: Mostrar en Panel Lateral

```
El panel lateral muestra el árbol:
- Colapsable/expandible
- Colores según status (activo=verde, archivado=gris)
- Iconos según tipo (📁 proyecto, 📌 objetivo, ✓ tarea, 🔗 doc)
- Documento actual resaltado en AMARILLO
```

### PASO 6: Permitir Navegación

```
Usuario puede:
├─ Click en PROYECTO → Abrir proyecto.md
├─ Click en OBJETIVO → Abrir objetivo.md
├─ Click en TAREA → Abrir tarea.md
├─ Click en DOCUMENTO → Abrir ese documento
├─ Click en [+] expandir → Mostrar hijos
└─ Click en [-] contraer → Ocultar hijos
```

### PASO 7: Mostrar Estadísticas (Opcional)

```
ESTADÍSTICAS CONTEXTO:
├─ Profundidad: 3 niveles
├─ Documentos en contexto: 3
├─ Tareas en objetivo: 5 (3 completadas)
├─ Objetivos en proyecto: 2
└─ Progreso proyecto: 40%
```

### PASO 8: Actualizar Automáticamente

```javascript
// Cuando usuario cambia de pestaña/archivo:
app.workspace.on('file-open', (file) => {
  // Reconstruir contexto para nuevo archivo
  rebuildContextTree(file);
  updateSidebarPanel();
});
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Documento Orphaned (sin proyecto padre)

```
Si documento no tiene proyecto_padre:
  - Mostrar: "DOCUMENTO INDEPENDIENTE"
  - Mostrar solo: Nivel 3 (documento actual)
  - Mostrar: "Documentos relacionados si existen"
```

### ALT-2: Documento Vinculado a Múltiples Proyectos

```
Si documento está en > 1 proyecto:
  - Mostrar tabs o selectable:
    [Proyecto 1] [Proyecto 2]
  - Mostrar contexto para cada proyecto
  - Usuario puede cambiar perspectiva
```

### ALT-3: Proyecto con Estructura Profunda

```
Si proyecto tiene > 20 objetivos:
  - Árbol inicial contraído por defecto
  - Opción: "[Expandir Todo]" / "[Contraer Todo]"
  - Búsqueda dentro del árbol (opcional)
```

---

## 7. POSTCONDICIONES

### Si éxito

1. Panel lateral muestra contexto completo
2. Jerarquía visible y navegable
3. Documento actual resaltado
4. Usuario puede cambiar de archivo
5. Panel se actualiza automáticamente
6. Todas las relaciones válidas y clickeables

### Si fallo

1. Panel vacío o con error
2. Mostrar ALT-1 (documento independiente)
3. Opción para reconstruir contexto

---

## 8. EJEMPLOS DE CONTEXTOS

### Ejemplo 1: Documento dentro de Tarea

```
CONTEXTO:
E-Commerce Platform (PROJ-xxx)
└─ Implementar Autenticación (OBJ-xxx)
   └─ Implementar OAuth2 (TSK-xxx)
      └─ OAuth2 Implementation (DOC-xxx) ← ACTUAL
         └─ Documentos Vinculados:
            - JWT Implementation
            - Security Guidelines
```

### Ejemplo 2: Documento Independiente

```
CONTEXTO:
Documento Independiente
└─ OAuth2 Implementation (DOC-xxx) ← ACTUAL
   └─ Vinculado a:
      - E-Commerce Platform (PROJ-xxx)
      - Authentication Upgrade (PROJ-yyy)
```

### Ejemplo 3: Proyecto Abierto

```
CONTEXTO:
E-Commerce Platform (PROJ-xxx) ← ACTUAL
├─ Objetivos (2):
│  ├─ Implementar Autenticación (OBJ-xxx)
│  │  └─ Tareas (5):
│  │     ├─ Implementar OAuth2 (TSK-xxx)
│  │     ├─ Escribir Documentación (TSK-xxx)
│  │     └─ Escribir Tests (TSK-xxx)
│  └─ Implementar Pagos (OBJ-xxx)
│     └─ Tareas (3): ...
└─ Documentos Vinculados (8):
   ├─ OAuth2 Implementation
   ├─ Payment Gateway Guide
   └─ ...
```

---

## 9. CASOS DE PRUEBA

### CT-001: Documento dentro de jerarquía

```
ENTRADA:
  - Abrir documento: "OAuth2 Implementation"
  - Documento está en: Proyecto > Objetivo > Tarea

RESULTADO ESPERADO:
  - Panel lateral muestra 4 niveles
  - Documento actual resaltado
  - Todos niveles navegables
  - Status: PASS
```

### CT-002: Proyecto abierto

```
ENTRADA:
  - Abrir: "E-Commerce Platform" (proyecto.md)

RESULTADO ESPERADO:
  - Muestra proyecto como ACTUAL
  - Muestra objetivos dentro contraídos
  - [+] para expandir
  - Status: PASS
```

### CT-003: Documento orphaned

```
ENTRADA:
  - Documento sin proyecto_padre

RESULTADO ESPERADO:
  - Muestra: "DOCUMENTO INDEPENDIENTE"
  - Muestra documentos relacionados
  - Status: PASS
```

### CT-004: Cambiar de archivo

```
ENTRADA:
  - Usuario abierto en Doc1
  - Click en archivo Doc2 en explorador

RESULTADO ESPERADO:
  - Panel lateral actualiza automáticamente
  - Muestra contexto de Doc2
  - Doc2 resaltado
  - Status: PASS
```

### CT-005: Navegar desde panel

```
ENTRADA:
  - Click en objetivo padre desde panel

RESULTADO ESPERADO:
  - Objetivo.md se abre
  - Panel lateral se actualiza
  - Objetivo resaltado
  - Status: PASS
```

---

## 10. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Archivo tiene UID | Mostrar error |
| V2 | Proyecto padre existe | Mostrar ALT-1 |
| V3 | Objetivo padre existe | Ignorar nivel |
| V4 | Tarea existe | Ignorar nivel |
| V5 | Documentos vinculados válidos | Ignorar inválidos |
| V6 | Panel actualiza automáticamente | Log error |

---

## 11. RELACIONES CON OTROS UC

```
UC-021 (Ver Contexto en Proyectos)
├─ Requiere: UC-004 (Vinculaciones)
├─ Requiere: UC-008, UC-010, UC-012 (Estructura jerarquía)
├─ Complementa: UC-020 (Trazabilidad)
└─ Accesible desde: cualquier archivo
```

---

## 12. CRITERIOS DE ACEPTACIÓN

- [ ] Panel lateral visible con contexto
- [ ] Detecta tipo de archivo abierto (doc, proyecto, obj, tarea)
- [ ] Construye jerarquía correcta
- [ ] Muestra proyecto padre si existe
- [ ] Muestra objetivo padre si existe
- [ ] Muestra tarea padre si existe
- [ ] Documento actual resaltado
- [ ] Iconos por tipo visible
- [ ] Status visible (colores)
- [ ] Elementos clickeables abren archivos
- [ ] Panel actualiza al cambiar de archivo
- [ ] ALT-1: Documento orphaned tratado
- [ ] ALT-2: Múltiples proyectos permitido
- [ ] Estadísticas opcionales mostradas

---

## 13. TIMELINE & ESFUERZO

- **Estimado**: 2-3 horas (incluye UI panel lateral)
- **Dependencias**: UC-004, UC-008, UC-010, UC-012
- **Bloqueador de**: Ninguno directo
- **Bloquea MVP**: SÍ (para navegación)

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
