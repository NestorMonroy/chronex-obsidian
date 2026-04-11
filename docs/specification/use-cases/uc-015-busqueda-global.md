```yaml
type: Caso de Uso Formal
title: UC-015 - BÚSQUEDA GLOBAL DE DOCUMENTOS
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Búsqueda
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: CRÍTICO MVP
```

# UC-015: BÚSQUEDA GLOBAL DE DOCUMENTOS

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-015 |
| **Nombre** | Búsqueda Global de Documentos |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA (Sprint 1) |
| **Complejidad** | MEDIA-ALTA |
| **Bloquea MVP** | SÍ |
| **Dependencias** | UC-002 (documentos clasificados), UC-003 (índice) |

---

## 2. DESCRIPCIÓN BREVE

Usuario abre modal de búsqueda global desde command palette. Ingresa término de búsqueda y selecciona filtros opcionales (repositorio, proyecto, estado, tipo). Sistema utiliza índice dataviewjs (UC-003) para búsqueda O(1), retorna resultados con preview, permite acciones rápidas (abrir, vincular, cambiar estado). Búsqueda integrada con UC-015 permite drill-down a búsqueda específica por repositorio/proyecto.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario** | Humano | Primario | Invoca búsqueda, define criterios |
| **Command Palette** | Sistema | Secundario | Acceso al comando |
| **Dataviewjs Index** | Componente | Secundario | Proporciona índice invertido |
| **Modal Búsqueda** | Componente | Secundario | UI de búsqueda y filtros |
| **Obsidian Vault API** | Componente | Secundario | Acceso a archivos |

---

## 4. PRECONDICIONES

### Técnicas

1. UC-003 (Indexación) completado - índice existe
2. Dataviewjs instalado y funcional
3. Documentos clasificados (UC-002)
4. Modal de búsqueda implementado
5. Índice en memoria actualizado

### De Negocio

1. Almenos 1 documento clasificado existe
2. Usuario necesita encontrar documentos
3. Criterios de búsqueda bien definidos

---

## 5. FLUJO PRINCIPAL

### PASO 1: Invocar Búsqueda Global

```
Usuario: abre command palette
Usuario: escribe "Búsqueda Global" o "Search Documents"
Sistema: abre modal de búsqueda
```

### PASO 2: Entrada de Búsqueda

```
MODAL BÚSQUEDA:
┌─────────────────────────────────────┐
│ Búsqueda Global de Documentos       │
├─────────────────────────────────────┤
│ Buscar: [__________________________] │ (INPUT)
│                                     │
│ Filtros Opcionales:                │
│ ├─ Repositorio: [dropdown]         │
│ ├─ Proyecto: [dropdown]            │
│ ├─ Estado: [checkbox list]         │
│ ├─ Tipo: [checkbox list]           │
│ └─ Ordenar por: [dropdown]         │
│                                     │
│ [BUSCAR] [CANCELAR]                │
└─────────────────────────────────────┘
```

### PASO 3: Construir Query

```javascript
const query = {
  texto: "oauth2",
  filtros: {
    repositorio: "AUTHENTICATION",  // opcional
    proyecto: "PROJ-202604-A1B2C",  // opcional
    estado: ["archivado"],           // opcional
    tipo: ["documento"],             // opcional
    ordenar: "relevancia"            // default: relevancia
  }
};
```

### PASO 4: Buscar en Índice (O(1))

```javascript
// Usar índice invertido creado en UC-003:
const results = searchIndex.search(query);

// Índice es estructura:
{
  "oauth2": [
    { id: "DOC-001", titulo: "OAuth2 Implementation", score: 0.95 },
    { id: "DOC-002", titulo: "OAuth2 Best Practices", score: 0.87 }
  ],
  "oauth": [
    { id: "DOC-001", titulo: "OAuth2 Implementation", score: 0.90 }
  ]
}
```

### PASO 5: Aplicar Filtros

```javascript
let filtered = results;

// Filtrar por repositorio
if (query.filtros.repositorio) {
  filtered = filtered.filter(d => 
    d.repositorio === query.filtros.repositorio
  );
}

// Filtrar por proyecto
if (query.filtros.proyecto) {
  filtered = filtered.filter(d => 
    d.proyectos.includes(query.filtros.proyecto)
  );
}

// Filtrar por estado
if (query.filtros.estado.length > 0) {
  filtered = filtered.filter(d => 
    query.filtros.estado.includes(d.status)
  );
}

// Filtrar por tipo
if (query.filtros.tipo.length > 0) {
  filtered = filtered.filter(d => 
    query.filtros.tipo.includes(d.type)
  );
}
```

### PASO 6: Ordenar Resultados

```javascript
switch(query.filtros.ordenar) {
  case 'relevancia':
    filtered.sort((a, b) => b.score - a.score);
    break;
  case 'fecha':
    filtered.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    break;
  case 'nombre':
    filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
    break;
}
```

### PASO 7: Mostrar Resultados

```
┌─────────────────────────────────────┐
│ Resultados: 12 documentos encontrados
├─────────────────────────────────────┤
│ • OAuth2 Implementation              │ [preview]
│   📁 AUTHENTICATION | 📌 PROJ-xxx   │
│   Actualizado: 2026-04-10           │
│   Status: archivado                 │
│                                     │
│ • OAuth2 Best Practices             │ [preview]
│   📁 SECURITY | 📌 PROJ-xxx         │
│   Actualizado: 2026-04-05           │
│   Status: archivado                 │
│                                     │
│ [MÁS RESULTADOS...]                │
└─────────────────────────────────────┘
```

### PASO 8: Mostrar Preview

```javascript
// Al pasar hover sobre resultado:
const preview = {
  titulo: "OAuth2 Implementation",
  descripcion: "Integración de OAuth2 con...",
  tags: ["oauth", "security", "authentication"],
  ultimaActualizacion: "2026-04-10",
  tamaño: "2.3 KB"
};
```

### PASO 9: Acciones Rápidas

```
Usuario puede (sin abrir archivo):
├─ Click: Abrir documento
├─ Ctx-Click: Mostrar opciones:
│  ├─ Abrir en nueva pestaña
│  ├─ Vincular a proyecto
│  ├─ Cambiar estado
│  ├─ Copiar referencia wiki
│  └─ Copiar ruta
└─ ESC: Cerrar búsqueda
```

### PASO 10: Resultado Seleccionado

```javascript
if (userClicksOnResult) {
  const document = selectedResult;
  // Opción 1: Abrir en editor
  app.workspace.openLinkText(document.path);
  
  // Opción 2: Mostrar contexto
  showContext(document);
}
```

---

## 6. FLUJOS ALTERNATIVOS

### ALT-1: Sin resultados

```
Si search retorna vacío:
  - Mostrar: "No se encontraron documentos"
  - Sugerir: "¿Ajustar búsqueda o filtros?"
  - Mostrar búsquedas recientes
```

### ALT-2: Búsqueda lenta (índice no actualizado)

```
Si índice no actualizado (fallback):
  - Usar búsqueda linear en vault
  - Mostrar: "Búsqueda en progreso..."
  - Actualizar índice para próxima
```

### ALT-3: Usuario modifica filtros

```
Si usuario cambia filtro:
  - Reejecutar búsqueda con nuevos filtros
  - Re-mostrar resultados
  - Mantener texto de búsqueda
```

---

## 7. POSTCONDICIONES

### Si éxito

1. Resultados mostrados en modal
2. Resultados ordenados por relevancia/fecha/nombre
3. Usuario puede seleccionar resultado
4. Usuario puede ver preview
5. Usuario puede ejecutar acciones rápidas
6. Búsqueda registrada en historial (opcional)

### Si fallo

1. Modal abierto
2. Mensaje de error o sin resultados
3. Usuario puede retornar e intentar nuevamente

---

## 8. ESTRUCTURA DE ÍNDICE (UC-003)

```javascript
// En memoria:
class SearchIndex {
  private index: Map<string, Document[]> = new Map();
  
  // Índice invertido por palabra clave:
  {
    "oauth2": [
      { id: "DOC-001", titulo: "...", score: 0.95 },
      { id: "DOC-002", titulo: "...", score: 0.87 }
    ],
    "authentication": [
      { id: "DOC-001", ... },
      { id: "DOC-003", ... }
    ],
    "security": [
      { id: "DOC-002", ... },
      { id: "DOC-004", ... }
    ]
  }
  
  // Índice por repositorio:
  {
    "AUTHENTICATION": [
      { id: "DOC-001", ... },
      { id: "DOC-003", ... }
    ]
  }
  
  // Índice por proyecto:
  {
    "PROJ-202604-A1B2C": [
      { id: "DOC-001", ... },
      { id: "DOC-002", ... }
    ]
  }
}
```

---

## 9. CASOS DE PRUEBA

### CT-001: Búsqueda exitosa por palabra

```
ENTRADA:
  - Búsqueda: "oauth2"
  - Filtros: ninguno
  - Ordenar: relevancia

RESULTADO ESPERADO:
  - 2-3 documentos encontrados
  - Ordenados por score de relevancia
  - Status: PASS
```

### CT-002: Búsqueda con filtro repositorio

```
ENTRADA:
  - Búsqueda: "auth"
  - Repositorio: "AUTHENTICATION"

RESULTADO ESPERADO:
  - Solo docs en AUTHENTICATION retornados
  - Status: PASS
```

### CT-003: Búsqueda con múltiples filtros

```
ENTRADA:
  - Búsqueda: "security"
  - Repositorio: "SECURITY"
  - Proyecto: "PROJ-202604-A1B2C"
  - Estado: "archivado"

RESULTADO ESPERADO:
  - Solo docs que cumplen TODOS los filtros
  - Status: PASS
```

### CT-004: Sin resultados

```
ENTRADA:
  - Búsqueda: "xyzabc123notexist"

RESULTADO ESPERADO:
  - "No se encontraron documentos"
  - Sugerencias alternativas
  - Status: PASS
```

### CT-005: Usuario cancela búsqueda

```
ENTRADA:
  - ESC o CANCELAR

RESULTADO ESPERADO:
  - Modal se cierra
  - Sin cambios en vault
  - Status: PASS
```

---

## 10. PUNTOS DE VALIDACIÓN

| Punto | Validación | Acción si Falla |
|-------|-----------|-----------------|
| V1 | Índice existe | Actualizar índice |
| V2 | Búsqueda no vacía | Error: "Ingresa término" |
| V3 | Filtros válidos | Ignorar inválidos |
| V4 | Resultados > 0 | ALT-1 |
| V5 | Resultados ordenados | Usar default |
| V6 | Acciones rápidas funcionales | Error en acción |

---

## 11. RELACIONES CON OTROS UC

```
UC-015 (Búsqueda Global)
├─ Requiere: UC-003 (Índice creado)
├─ Requiere: UC-002 (Documentos clasificados)
├─ Refina: UC-016 (Búsqueda por Repositorio)
├─ Refina: UC-017 (Búsqueda por Proyecto)
├─ Refina: UC-018 (Búsqueda Avanzada)
└─ Acceso desde: UI global de búsqueda
```

---

## 12. CRITERIOS DE ACEPTACIÓN

- [ ] Modal de búsqueda abre desde command palette
- [ ] Input de búsqueda acepta texto
- [ ] Filtros disponibles: repositorio, proyecto, estado, tipo
- [ ] Dropdown de ordenamiento: relevancia, fecha, nombre
- [ ] Búsqueda usa índice de UC-003
- [ ] Resultados O(1) si índice está actualizado
- [ ] Resultados ordenados correctamente
- [ ] Preview disponible en hover
- [ ] Acciones rápidas funcionales: abrir, vincular, estado
- [ ] ALT-1: Sin resultados muestra mensaje
- [ ] Filtros se aplican correctamente
- [ ] Búsqueda es case-insensitive
- [ ] Soporte para búsqueda fuzzy (opcional)

---

## 13. TIMELINE & ESFUERZO

- **Estimado**: 3-4 horas
- **Dependencias**: UC-002, UC-003
- **Bloqueador de**: UC-016, UC-017, UC-018
- **Bloquea MVP**: SÍ

---

**Creado**: 2026-04-11
**Por**: Especificación Automática
**Estado**: PENDIENTE IMPLEMENTACIÓN
