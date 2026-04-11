```yaml
type: Documento T茅cnico
title: PASO 2 - IDENTIFICAR CASOS DE USO FORMALES
version: 1.0.0
scope: ACTIVIDAD 1 - Sistema QuickAdd
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
status: 脥ndice de 5 UCs formales
```

# PASO 2: IDENTIFICAR CASOS DE USO FORMALES
## 脥ndice Maestro de 5 Casos de Uso - ACTIVIDAD 1

---

## INTRODUCCI肹SPEC]N

PASO 2 documenta formalmente los 5 casos de uso (UCs) del sistema ACTIVIDAD 1. Cada UC describe un flujo completo desde la perspectiva del usuario, identificando actores, precondiciones, pasos detallados, flujos alternativos, postcondiciones y criterios de aceptaci贸n.

El formato utilizado sigue est谩ndar IEEE 830 adaptado para desarrollo 谩gil.

---

## LOS 5 CASOS DE USO FORMALES

### UC-001: CREAR REPOSITORIO
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea un nuevo repositorio especificando nombre, tipo y descripci贸n. El sistema genera ID 煤nico, obtiene metadatos, construye estructura de carpetas y crea archivo Markdown con template.

**Artefacto**: PASO2-UC-001-REPOSITORY.md

---

### UC-002: CREAR TAREA
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea una nueva tarea especificando t铆tulo, prioridad, descripci贸n y fecha de vencimiento. El sistema asigna ID, obtiene contexto, construye estructura y crea nota con estado inicial.

**Artefacto**: PASO2-UC-002-TASK.md

---

### UC-003: CREAR PROYECTO
**Prioridad**: ALTA | **Complejidad**: MEDIA

El usuario crea un nuevo proyecto especificando nombre, estado, descripci贸n. El sistema genera ID, obtiene metadatos, crea carpeta estructurada y enlaza archivos asociados.

**Artefacto**: PASO2-UC-003-PROJECT.md

---

### UC-004: CREAR PILAR
**Prioridad**: MEDIA | **Complejidad**: MEDIA

El usuario crea un nuevo pilar especificando nombre, estado, descripci贸n. El sistema genera ID, obtiene metadatos de pilares existentes, construye estructura de referencias.

**Artefacto**: PASO2-UC-004-PILLAR.md

---

### UC-005: CREAR NOTA DE PILAR
**Prioridad**: MEDIA | **Complejidad**: ALTA

El usuario crea una nota dentro de un pilar espec铆fico. El sistema obtiene contexto del pilar, valida referencias, genera ID vinculado, crea nota con metadatos cruzados.

**Artefacto**: PASO2-UC-005-PILLAR-NOTE.md

---

## ESTRUCTURA DE CADA UC

Cada documento UC-XXX contiene:

| Secci贸n | Contenido |
|---------|----------|
| **1. IDENTIFICACI肹SPEC]N** | ID, Nombre, Versi贸n, Estado, Prioridad, Complejidad |
| **2. DESCRIPCI肹SPEC]N BREVE** | P谩rrafo narrativo del UC en contexto |
| **3. ACTORES INVOLUCRADOS** | Usuario, QuickAdd, Obsidian, Modules, Template |
| **4. PRECONDICIONES** | Qu茅 debe ser verdad antes de iniciar UC |
| **5. FLUJO PRINCIPAL** | Pasos 1-N detallados (Actor/Acci贸n/Resultado) |
| **6. FLUJOS ALTERNATIVOS** | A1, A2, A3... variantes y excepciones |
| **7. POSTCONDICIONES** | Qu茅 es verdad despu茅s del UC completado |
| **8. PUNTOS CR脥TICOS** | D贸nde pueden ocurrir fallos |
| **9. EXCEPCIONES** | Errores posibles y manejo |
| **10. DIAGRAMAS** | Secuencia, Estados, Arquitectura (Mermaid) |
| **11. NOTAS DE IMPLEMENTACI肹SPEC]N** | Patrones, librer铆as, estrategia testing |
| **12. TRAZABILIDAD** | Operaciones at贸micas [DONE]啍 C贸digo |
| **13. CRITERIOS DE ACEPTACI肹SPEC]N** | Checklist de completitud |
| **14. REFERENCIAS** | Links a PASO 1 V4, convenciones, c贸digo |

---

## RELACI肹SPEC]N CON PASO 1 V4

Cada UC mapea directamente a operaciones at贸micas de PASO 1 V4:

| UC | Operaciones At贸micas Utilizadas |
|---|---|
| UC-001 (Repository) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-008, OP-010, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-002 (Task) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-007, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-003 (Project) | OP-001, OP-002, OP-003, OP-005, OP-006, OP-007, OP-008, OP-010, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-004 (Pillar) | OP-001, OP-002, OP-005, OP-006, OP-008, OP-011, OP-012, OP-013, OP-014, OP-015 |
| UC-005 (PillarNote) | OP-001, OP-002, OP-003, OP-005, OP-007, OP-011, OP-012, OP-013, OP-014, OP-015 |

---

## RELACI肹SPEC]N CON CONVENCIONES

Cada UC valida contra:

**Convenciones-de-C贸digo v1.0.0:**
- Prefijos _contexto_ en variables
- Naming conventions
- Error handling

**Convenciones-Pragm谩ticas v1.0.0:**
- Estructura utils/ (Opci贸n 2)
- Escalabilidad (OCP)
- Documentaci贸n

**Convenciones-JavaScript v2.0.0:**
- SOLID principles
- DRY (no duplicaci贸n)
- Best practices

---

## STAKEHOLDERS EN TODOS LOS UCs

| Stakeholder | Rol | Responsabilidad |
|---|---|---|
| **Usuario (Nestor)** | Actor Primario | Inicia macro, proporciona datos de entrada |
| **QuickAdd** | Actor Secundario | Ejecuta script, gestiona flujo de macros |
| **Obsidian Core** | Actor Secundario | Crea archivos/carpetas, proporciona API |
| **M贸dulos (utils/)** | Actor Secundario | Generan IDs, validan, obtienen metadatos |
| **Templates** | Actor Consumidor | Reciben variables, generan contenido final |

---

## FLUJO COM肹REF]N A TODOS LOS UCs

Todos los UCs siguen patr贸n similar:

```
Usuario inicia macro
    
QuickAdd carga script orquestador
    
Obtener entrada usuario (OP-001)
    
Validar entrada (OP-002)
    
Generar ID 煤nico (OP-003)
    
Obtener metadata (OP-005, OP-007)
    
Procesar espec铆fico (OP-011)
    
Asignar variables (OP-012)
    
Ejecutar template (OP-013)
    
Crear archivo (OP-014)
    
Mostrar notificaci贸n (OP-015)
    
Completado
```

Las diferencias est谩n en OP-011 (l贸gica espec铆fica) y estructura de datos.

---

## DIAGRAMAS GENERALES

### Diagrama 1: Relaci贸n entre 5 UCs

```
[DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼
[DONE]攤          SISTEMA ACTIVIDAD 1 (QuickAdd)         [DONE]攤
[DONE]擺DONE][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敜
[DONE]攤                                                 [DONE]攤
[DONE]攤  [DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼  [DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼  [DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼 [DONE]攤
[DONE]攤  [DONE]攤UC-001    [DONE]攤  [DONE]攤UC-002    [DONE]攤  [DONE]攤UC-003        [DONE]攤 [DONE]攤
[DONE]攤  [DONE]攤Crear     [DONE]攤  [DONE]攤Crear     [DONE]攤  [DONE]攤Crear         [DONE]攤 [DONE]攤
[DONE]攤  [DONE]攤Repositorio[DONE]攤  [DONE]攤Tarea     [DONE]攤  [DONE]攤Proyecto      [DONE]攤 [DONE]攤
[DONE]攤  [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇  [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇  [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇 [DONE]攤
[DONE]攤                                              [DONE]攤
[DONE]攤       [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敶[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇          [DONE]攤
[DONE]攤                 Patr贸n com煤n                    [DONE]攤
[DONE]攤                                                 [DONE]攤
[DONE]攤  [DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼                 [DONE]攲[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]攼 [DONE]攤
[DONE]攤  [DONE]攤UC-004    [DONE]攤                 [DONE]攤UC-005        [DONE]攤 [DONE]攤
[DONE]攤  [DONE]攤Crear     [DONE]攤                 [DONE]攤Crear Nota    [DONE]攤 [DONE]攤
[DONE]攤  [DONE]攤Pilar     [DONE]攤[DONE]啇[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY]relacionado[DONE]擺READY][DONE]啋de Pilar     [DONE]攤 [DONE]攤
[DONE]攤  [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇                 [DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇 [DONE]攤
[DONE]攤                                                 [DONE]攤
[DONE]敂[DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]擺READY][DONE]敇
```

---

## FLUJOS DE LECTURA RECOMENDADOS

### Para Ejecutivo (30 minutos)
1. Esta p谩gina (INDEX)
2. Secci贸n "DESCRIPCI肹SPEC]N BREVE" de cada UC
3. Secci贸n "CRITERIOS DE ACEPTACI肹SPEC]N" de cada UC

### Para Arquitecto (3 horas)
1. Esta p谩gina (INDEX)
2. FLUJO PRINCIPAL + DIAGRAMAS de cada UC
3. PUNTOS CR脥TICOS y EXCEPCIONES de cada UC
4. NOTAS DE IMPLEMENTACI肹SPEC]N de cada UC

### Para Developer (1-2 horas por UC)
1. UC completo (secciones 1-14)
2. Mapeo de operaciones at贸micas (Secci贸n TRAZABILIDAD)
3. Code skeleton en NOTAS DE IMPLEMENTACI肹SPEC]N
4. Criterios de aceptaci贸n (Secci贸n 13)

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
- T茅cnico profesional, espa帽ol mexicano
- Sin emojis, sin iconos
- Directo y preciso

**Nomenclatura:**
- UC-XXX para identificar casos de uso
- OP-XXX para operaciones at贸micas (referencias a PASO 1)
- A1, A2... para flujos alternativos
- E1, E2... para excepciones

**Estructura:**
- Pasos numerados (1, 2, 3...)
- Tablas para metadata
- Mermaid diagrams para flujos
- C贸digo de ejemplo en bloques

---

## PR肹SPEC]XIMOS PASOS

Despu茅s de completar 5 UCs formales:

```
PASO 2 (ACTUAL)
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] UC-001: Crear Repositorio
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] UC-002: Crear Tarea
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] UC-003: Crear Proyecto
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] UC-004: Crear Pilar
[DONE]敂[DONE]擺READY][DONE]擺READY] UC-005: Crear Nota de Pilar

[DONE]哰SPEC] (validaci贸n y aceptaci贸n de 5 UCs)

PASO 3: Detalle de Flujos
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Describir cada paso con precisi贸n
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Documentar todas las variantes
[DONE]敂[DONE]擺READY][DONE]擺READY] Crear casos de prueba

[DONE]哰SPEC]

PASO 4: Implementaci贸n (Refactorizaci贸n)
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Ejecutar ROADMAP (Fases 1-5)
[DONE]擺DONE][DONE]擺READY][DONE]擺READY] Codificar seg煤n PASO 2 UCs
[DONE]敂[DONE]擺READY][DONE]擺READY] Testear contra criterios aceptaci贸n

[DONE]哰SPEC]

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

**Total: 5 UCs, 57 operaciones at贸micas referenciadas, 15+ flujos alternativos, 21+ excepciones**

---

## VALIDACI肹SPEC]N DE PASO 2

Cada UC ser谩 validado cuando:

- [ ] Secciones 1-14 completas
- [ ] Precondiciones expl铆citas
- [ ] Pasos detallados (Actor/Acci贸n/Resultado)
- [ ] Flujos alternativos documentados
- [ ] Excepciones mapeadas
- [ ] Diagramas Mermaid incluidos
- [ ] Operaciones at贸micas trazadas
- [ ] Criterios aceptaci贸n definidos
- [ ] Ejemplos de c贸digo (donde aplique)
- [ ] Referencias a PASO 1 V4

---

## CONCLUSI肹SPEC]N

PASO 2 formaliza los 5 casos de uso de ACTIVIDAD 1, proporcionando especificaci贸n ejecutable y testeable para desarrolladores.

Cada UC es independiente pero parte de sistema coherente, utilizando patr贸n com煤n documentado en PASO 1 V4.

---

**DOCUMENTO**: PASO2-INDEX.md
**VERSI肹SPEC]N**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: 脥NDICE COMPLETADO - LISTO PARA ARTEFACTOS SIGUIENTES

