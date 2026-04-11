```yaml
type: Documento Técnico
title: PASO 2 - IDENTIFICAR CASOS DE USO FORMALES
version: 1.0.0
scope: ACTIVIDAD 1 - Sistema QuickAdd
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Índice de 5 UCs formales
```

# PASO 2: IDENTIFICAR CASOS DE USO FORMALES
## Índice Maestro de 5 Casos de Uso - ACTIVIDAD 1

---

## INTRODUCCIÓN

PASO 2 documenta formalmente los 5 casos de uso (UCs) del sistema ACTIVIDAD 1. Cada UC describe un flujo completo desde la perspectiva del usuario, identificando actores, precondiciones, pasos detallados, flujos alternativos, postcondiciones y criterios de aceptación.

El formato utilizado sigue estándar IEEE 830 adaptado para desarrollo ágil.

---

## LOS 5 CASOS DE USO FORMALES

### UC-001: CREAR REPOSITORIO
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea un nuevo repositorio especificando nombre, tipo y descripción. El sistema genera ID único, obtiene metadatos, construye estructura de carpetas y crea archivo Markdown con template.

**Artefacto**: PASO2-UC-001-REPOSITORY.md

---

### UC-002: CREAR TAREA
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea una nueva tarea especificando título, prioridad, descripción y fecha de vencimiento. El sistema asigna ID, obtiene contexto, construye estructura y crea nota con estado inicial.

**Artefacto**: PASO2-UC-002-TASK.md

---

### UC-003: CREAR PROYECTO
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea un nuevo proyecto especificando nombre, estado, descripción. El sistema genera ID, obtiene metadatos, crea carpeta estructurada y enlaza archivos asociados.

**Artefacto**: PASO2-UC-003-PROJECT.md

---

### UC-004: CREAR PILAR
**Prioridad**: MEDIA | **Complejidad**: MEDIA

El usuario crea un nuevo pilar especificando nombre, estado, descripción. El sistema genera ID, obtiene metadatos de pilares existentes, construye estructura de referencias.

**Artefacto**: PASO2-UC-004-PILLAR.md

---

### UC-005: CREAR NOTA DE PILAR
**Prioridad**: MEDIA | **Complejidad**: ALTA

El usuario crea una nota dentro de un pilar específico. El sistema obtiene contexto del pilar, valida referencias, genera ID vinculado, crea nota con metadatos cruzados.

**Artefacto**: PASO2-UC-005-PILLAR-NOTE.md

---

## ESTRUCTURA DE CADA UC

Cada documento UC-XXX contiene:

| Sección | Contenido |
|---------|----------|
| **1. IDENTIFICACIÓN** | ID, Nombre, Versión, Estado, Prioridad, Complejidad |
| **2. DESCRIPCIÓN BREVE** | Párrafo narrativo del UC en contexto |
| **3. ACTORES INVOLUCRADOS** | Usuario, QuickAdd, Obsidian, Modules, Template |
| **4. PRECONDICIONES** | Qué debe ser verdad antes de iniciar UC |
| **5. FLUJO PRINCIPAL** | Pasos 1-N detallados (Actor/Acción/Resultado) |
| **6. FLUJOS ALTERNATIVOS** | A1, A2, A3... variantes y excepciones |
| **7. POSTCONDICIONES** | Qué es verdad después del UC completado |
| **8. PUNTOS CRÍTICOS** | Dónde pueden ocurrir fallos |
| **9. EXCEPCIONES** | Errores posibles y manejo |
| **10. DIAGRAMAS** | Secuencia, Estados, Arquitectura (Mermaid) |
| **11. NOTAS DE IMPLEMENTACIÓN** | Patrones, librerías, estrategia testing |
| **12. TRAZABILIDAD** | Operaciones atómicas ↔ Código |
| **13. CRITERIOS DE ACEPTACIÓN** | Checklist de completitud |
| **14. REFERENCIAS** | Links a PASO 1 V4, convenciones, código |

---

## RELACIÓN CON PASO 1 V4

Cada UC mapea directamente a operaciones atómicas de PASO 1 V4:

| UC | Operaciones Atómicas Utilizadas |
|---|---|
| UC-001 (Repository) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-008, OP-010, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-002 (Task) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-007, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-003 (Project) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-007, OP-008, OP-010, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-004 (Pillar) | OP-001, OP-002, OP-005, OP-006, OP-008, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-005 (PillarNote) | OP-001, OP-002, OP-003, OP-005, OP-007, OP-011, OP-012, OP-013, OP-014, OP-015 |

---

## RELACIÓN CON CONVENCIONES

Cada UC valida contra:

**Convenciones-de-Código v1.0.0:**
- Prefijos _contexto_ en variables
- Naming conventions
- Error handling

**Convenciones-Pragmáticas v1.0.0:**
- Estructura utils/ (Opción 2)
- Escalabilidad (OCP)
- Documentación

**Convenciones-JavaScript v2.0.0:**
- SOLID principles
- DRY (no duplicación)
- Best practices

---

## STAKEHOLDERS EN TODOS LOS UCs

| Stakeholder | Rol | Responsabilidad |
|---|---|---|
| **Usuario (Nestor)** | Actor Primario | Inicia macro, proporciona datos de entrada |
| **QuickAdd** | Actor Secundario | Ejecuta script, gestiona flujo de macros |
| **Obsidian Core** | Actor Secundario | Crea archivos/carpetas, proporciona API |
| **Módulos (utils/)** | Actor Secundario | Generan IDs, validan, obtienen metadatos |
| **Templates** | Actor Consumidor | Reciben variables, generan contenido final |

---

## FLUJO COMÚN A TODOS LOS UCs

Todos los UCs siguen patrón similar:

```
Usuario inicia macro
    ↓
QuickAdd carga script orquestador
    ↓
Obtener entrada usuario (OP-001)
    ↓
Validar entrada (OP-002)
    ↓
Generar ID único (OP-003)
    ↓
Obtener metadata (OP-005, OP-007)
    ↓
Procesar específico (OP-011)
    ↓
Asignar variables (OP-012)
    ↓
Ejecutar template (OP-013)
    ↓
Crear archivo (OP-014)
    ↓
Mostrar notificación (OP-015)
    ↓
Completado
```

Las diferencias están en OP-011 (lógica específica) y estructura de datos.

---

## DIAGRAMAS GENERALES

### Diagrama 1: Relación entre 5 UCs

```
┌─────────────────────────────────────────────────┐
│          SISTEMA ACTIVIDAD 1 (QuickAdd)         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │UC-001    │  │UC-002    │  │UC-003        │ │
│  │Crear     │  │Crear     │  │Crear         │ │
│  │Repositorio│  │Tarea     │  │Proyecto      │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│       ↑              ↑               ↑          │
│       └──────────────┴───────────────┘          │
│                 Patrón común                    │
│                                                 │
│  ┌──────────┐                 ┌──────────────┐ │
│  │UC-004    │                 │UC-005        │ │
│  │Crear     │                 │Crear Nota    │ │
│  │Pilar     │←─────relacionado─→de Pilar     │ │
│  └──────────┘                 └──────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## FLUJOS DE LECTURA RECOMENDADOS

### Para Ejecutivo (30 minutos)
1. Esta página (INDEX)
2. Sección "DESCRIPCIÓN BREVE" de cada UC
3. Sección "CRITERIOS DE ACEPTACIÓN" de cada UC

### Para Arquitecto (3 horas)
1. Esta página (INDEX)
2. FLUJO PRINCIPAL + DIAGRAMAS de cada UC
3. PUNTOS CRÍTICOS y EXCEPCIONES de cada UC
4. NOTAS DE IMPLEMENTACIÓN de cada UC

### Para Developer (1-2 horas por UC)
1. UC completo (secciones 1-14)
2. Mapeo de operaciones atómicas (Sección TRAZABILIDAD)
3. Code skeleton en NOTAS DE IMPLEMENTACIÓN
4. Criterios de aceptación (Sección 13)

---

## DEPENDENCIAS ENTRE UCs

**UC-001 es base para:**
- UC-002 (repositorio puede servir como contexto para tareas)
- UC-003 (proyecto puede usar estructura similar)

**UC-004 es independiente pero:**
- Relacionado con UC-005 (pilar contiene notas)

**UC-005 depende de:**
- UC-004 (pilar debe existir antes de crear nota)

**Testing debe cumplir orden:**
1. UC-001 (base)
2. UC-002, UC-003, UC-004 (pueden testearse en paralelo)
3. UC-005 (requiere UC-004 completado)

---

## CONVENCIONES APLICADAS

**Lenguaje:**
- Técnico profesional, español mexicano
- Sin emojis, sin iconos
- Directo y preciso

**Nomenclatura:**
- UC-XXX para identificar casos de uso
- OP-XXX para operaciones atómicas (referencias a PASO 1)
- A1, A2... para flujos alternativos
- E1, E2... para excepciones

**Estructura:**
- Pasos numerados (1, 2, 3...)
- Tablas para metadata
- Mermaid diagrams para flujos
- Código de ejemplo en bloques

---

## PRÓXIMOS PASOS

Después de completar 5 UCs formales:

```
PASO 2 (ACTUAL)
├── UC-001: Crear Repositorio
├── UC-002: Crear Tarea
├── UC-003: Crear Proyecto
├── UC-004: Crear Pilar
└── UC-005: Crear Nota de Pilar

↓ (validación y aceptación de 5 UCs)

PASO 3: Detalle de Flujos
├── Describir cada paso con precisión
├── Documentar todas las variantes
└── Crear casos de prueba

↓

PASO 4: Implementación (Refactorización)
├── Ejecutar ROADMAP (Fases 1-5)
├── Codificar según PASO 2 UCs
└── Testear contra criterios aceptación

↓

PASO 5: Testing + Release
```

---

## MATRIZ RESUMEN

| UC | Prioridad | Complejidad | Actores | Operaciones | Flujos Alt | Excepciones |
|---|---|---|---|---|---|---|
| UC-001 | ALTA | MEDIA | 5 | 12 | A1-A4 | E1-E5 |
| UC-002 | ALTA | MEDIA | 5 | 11 | A1-A3 | E1-E4 |
| UC-003 | ALTA | MEDIA | 5 | 13 | A1-A4 | E1-E5 |
| UC-004 | MEDIA | MEDIA | 5 | 10 | A1-A2 | E1-E3 |
| UC-005 | MEDIA | ALTA | 5 | 11 | A1-A3 | E1-E4 |

**Total: 5 UCs, 57 operaciones atómicas referenciadas, 15+ flujos alternativos, 21+ excepciones**

---

## VALIDACIÓN DE PASO 2

Cada UC será validado cuando:

- [ ] Secciones 1-14 completas
- [ ] Precondiciones explícitas
- [ ] Pasos detallados (Actor/Acción/Resultado)
- [ ] Flujos alternativos documentados
- [ ] Excepciones mapeadas
- [ ] Diagramas Mermaid incluidos
- [ ] Operaciones atómicas trazadas
- [ ] Criterios aceptación definidos
- [ ] Ejemplos de código (donde aplique)
- [ ] Referencias a PASO 1 V4

---

## CONCLUSIÓN

PASO 2 formaliza los 5 casos de uso de ACTIVIDAD 1, proporcionando especificación ejecutable y testeable para desarrolladores.

Cada UC es independiente pero parte de sistema coherente, utilizando patrón común documentado en PASO 1 V4.

---

**DOCUMENTO**: PASO2-INDEX.md
**VERSIÓN**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: ÍNDICE COMPLETADO - LISTO PARA ARTEFACTOS SIGUIENTES

