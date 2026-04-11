```yaml
type: Documento T茅cnico
title: PASO 3 - DIAGRAMAS DE ACTORES
version: 1.0.0
scope: ACTIVIDAD 1 - Visualizaciones de relaciones
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
status: Diagramas Mermaid completos
```

# PASO 3: DIAGRAMAS DE ACTORES
## Visualizaciones de Relaciones Actor[DONE]啍UC y Dependencias

---

## INTRODUCCI肹SPEC]N

Este artefacto proporciona **4 diagramas Mermaid** que visualizan:

1. **Diagrama 1**: Relaci贸n Actor UC (qui茅n participa en qu茅)
2. **Diagrama 2**: Flujo de datos entre actores
3. **Diagrama 3**: Dependencias entre UCs
4. **Diagrama 4**: Timeline de ejecuci贸n

Los diagramas complementan la matriz textual de ARTEFACTO 2.

---

## DIAGRAMA 1: RELACI肹SPEC]N ACTOR UC

### Descripci贸n
Muestra qu茅 actores participan en cada UC. Cada nodo UC se conecta a los actores que intervienen.

### Visualizaci贸n Mermaid

```mermaid
graph TB
    Usuario["[SPEC][SPEC]懁 Usuario (Nestor)"]
    QuickAdd["[DONE][REF]橻ARCH][ARCH][ARCH] QuickAdd Plugin"]
    Obsidian["[SPEC][SPEC][SPEC][DIR] Obsidian Core"]
    Utils["[SPEC][SPEC]敡 M贸dulos Utils/"]
    Template["[SPEC][SPEC][SPEC][CONV] Template Engine"]
    MetadataCache["[SPEC][SPEC]捑 MetadataCache"]
    
    UC001["UC-001: Crear Repositorio"]
    UC002["UC-002: Crear Tarea"]
    UC003["UC-003: Crear Proyecto"]
    UC004["UC-004: Crear Pilar"]
    UC005["UC-005: Crear Nota en Repo"]
    
    Usuario -->|Invoca| UC001
    Usuario -->|Invoca| UC002
    Usuario -->|Invoca| UC003
    Usuario -->|Invoca| UC004
    Usuario -->|Invoca| UC005
    
    QuickAdd -->|Orquesta| UC001
    QuickAdd -->|Orquesta| UC002
    QuickAdd -->|Orquesta| UC003
    QuickAdd -->|Orquesta| UC004
    QuickAdd -->|Orquesta| UC005
    
    Obsidian -->|Crea estructura| UC001
    Obsidian -->|Crea estructura| UC002
    Obsidian -->|Crea estructura| UC003
    Obsidian -->|Crea estructura| UC004
    Obsidian -->|Crea estructura| UC005
    
    Utils -->|Valida, genera| UC001
    Utils -->|Valida, genera| UC002
    Utils -->|Valida, genera| UC003
    Utils -->|Valida, genera| UC004
    Utils -->|Valida, genera| UC005
    
    Template -->|Genera contenido| UC001
    Template -->|Genera contenido| UC002
    Template -->|Genera contenido| UC003
    Template -->|Genera contenido| UC004
    Template -->|Genera contenido| UC005
    
    MetadataCache -->|Lee metadata| UC005
    
    style Usuario fill:#4a7c8f,stroke:#fff,color:#fff
    style QuickAdd fill:#2d5a7b,stroke:#fff,color:#fff
    style Obsidian fill:#5a3d2a,stroke:#fff,color:#fff
    style Utils fill:#3d5a2a,stroke:#fff,color:#fff
    style Template fill:#5a3d5a,stroke:#fff,color:#fff
    style MetadataCache fill:#5a5a3d,stroke:#fff,color:#fff
    
    style UC001 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC002 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC003 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC004 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC005 fill:#3d7ba8,stroke:#fff,color:#fff
```

### Interpretaci贸n
- **L铆neas s贸lidas**: Participaci贸n obligatoria en UC
- **Color de Actor**: Tipo de actor (Usuario, Sistema, Componente)
- **Convergencia**: UC-005 tiene 6 actores (extra: MetadataCache)

---

## DIAGRAMA 2: FLUJO DE DATOS ENTRE ACTORES

### Descripci贸n
Muestra c贸mo fluyen los datos entre actores durante la ejecuci贸n de un UC t铆pico (UC-001).

### Visualizaci贸n Mermaid

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant Utils as Utils/
    participant T as Template
    participant O as Obsidian
    participant FS as File System

    U->>Q: 1. Invoca macro "Crear Repositorio"
    Q->>U: 2. Muestra prompt "Nombre repositorio"
    U->>Q: 3. Ingresa "Mi Proyecto" + selecciona "Work"
    
    Q->>Utils: 4. validateCommonInput(input)
    Utils->>Q: 5. Retorna: v谩lido [DONE][DONE][SPEC]
    
    Q->>Utils: 6. generateUniqueId()
    Utils->>Q: 7. Retorna: id-naq5a4-...
    
    Q->>Utils: 8. getCurrentDateTime()
    Utils->>Q: 9. Retorna: 2026-04-11T14:30:45Z
    
    Q->>Utils: 10. getFileName("Mi Proyecto")
    Utils->>Q: 11. Retorna: mi-proyecto.md
    
    Q->>Utils: 12. getGrandParentFolder()
    Utils->>Q: 13. Retorna: 400-DIARIO
    
    Q->>Q: 14. Asigna variables (OP-012)
    Q->>T: 15. Paso variables al template
    T->>Q: 16. Retorna: contenido markdown final
    
    Q->>O: 17. createFolder(repositories/work/id-naq5a4)
    O->>FS: 18. Crea carpetas recursivamente
    FS->>O: 19. 脡xito
    
    Q->>O: 20. create(mi-proyecto.md, contenido)
    O->>FS: 21. Escribe archivo
    FS->>O: 22. Archivo creado
    
    Q->>Utils: 23. showNotification("脡xito")
    Utils->>U: 24. Muestra notificaci贸n verde
    U->>U: 25. Ve "Repositorio creado"
    
    style U fill:#4a7c8f,stroke:#fff,color:#fff
    style Q fill:#2d5a7b,stroke:#fff,color:#fff
    style Utils fill:#3d5a2a,stroke:#fff,color:#fff
    style T fill:#5a3d5a,stroke:#fff,color:#fff
    style O fill:#5a3d2a,stroke:#fff,color:#fff
    style FS fill:#3d3d3d,stroke:#fff,color:#fff
```

### Interpretaci贸n
- **Actor a Actor**: Paso de datos entre componentes
- **Numeraci贸n 1-25**: Secuencia de pasos en UC-001
- **Pasos 4-13**: Core operations (Utils)
- **Pasos 14-16**: Template execution
- **Pasos 17-22**: File system creation
- **Pasos 23-25**: Feedback al usuario

---

## DIAGRAMA 3: DEPENDENCIAS ENTRE UCS

### Descripci贸n
Muestra qu茅 UCs dependen de otros. Solo UC-005 tiene una precondici贸n (UC-001).

### Visualizaci贸n Mermaid

```mermaid
graph LR
    UC001["UC-001<br/>Crear Repositorio<br/>(Base)"]
    UC002["UC-002<br/>Crear Tarea<br/>(Independiente)"]
    UC003["UC-003<br/>Crear Proyecto<br/>(Independiente)"]
    UC004["UC-004<br/>Crear Pilar<br/>(Independiente)"]
    UC005["UC-005<br/>Crear Nota en Repo<br/>(Dependencia)"]
    
    UC001 -->|Precondici贸n| UC005
    
    UC002 -.->|Sin dependencia| UC002
    UC003 -.->|Sin dependencia| UC003
    UC004 -.->|Sin dependencia| UC004
    
    style UC001 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:3px
    style UC002 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC003 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC004 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC005 fill:#8a6b3d,stroke:#fff,color:#fff,stroke-width:3px
```

### Interpretaci贸n
- **Flecha s贸lida**: Dependencia real (UC-001 UC-005)
- **L铆nea punteada**: Independencia (UCs 2, 3, 4)
- **Color verde**: UC base (UC-001)
- **Color naranja**: UC dependiente (UC-005)
- **Color azul**: UCs independientes (UC-002, 003, 004)

### Testing Order Implicado
1. **Paralelo**: UC-001, UC-002, UC-003, UC-004
2. **Despu茅s**: UC-005 (requiere UC-001)

---

## DIAGRAMA 4: OPERACIONES AT肹SPEC]MICAS REUTILIZADAS

### Descripci贸n
Muestra qu茅 operaciones at贸micas (OP-001 a OP-015) se reutilizan en cada UC.

### Visualizaci贸n Mermaid

```mermaid
graph TB
    OP001["OP-001: Obtener Entrada"]
    OP002["OP-002: Validar Entrada"]
    OP003["OP-003: Gen ID 肹REF]nico"]
    OP005["OP-005: Obtener Fecha"]
    OP006["OP-006: Nombre Archivo"]
    OP007["OP-007: Obtener Metadata"]
    OP008["OP-008: Carpeta Padre"]
    OP010["OP-010: Estructura Carpetas"]
    OP011["OP-011: Procesar Espec铆fico"]
    OP012["OP-012: Asignar Variables"]
    OP013["OP-013: Ejecutar Template"]
    OP014["OP-014: Crear Archivo"]
    OP015["OP-015: Notificaci贸n"]
    
    UC001["UC-001"]
    UC002["UC-002"]
    UC003["UC-003"]
    UC004["UC-004"]
    UC005["UC-005"]
    
    OP001 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP002 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP003 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP005 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP006 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP007 --> UC002 & UC003 & UC005
    OP008 --> UC001 & UC003 & UC004
    OP010 --> UC001 & UC003 & UC004
    OP011 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP012 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP013 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP014 --> UC001 & UC002 & UC003 & UC004 & UC005
    OP015 --> UC001 & UC002 & UC003 & UC004 & UC005
    
    style OP001 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP002 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP003 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP005 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP006 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP012 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP013 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP014 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP015 fill:#2a5a2a,stroke:#fff,color:#fff,stroke-width:2px
    style OP007 fill:#5a5a2a,stroke:#fff,color:#fff
    style OP008 fill:#5a5a2a,stroke:#fff,color:#fff
    style OP010 fill:#5a5a2a,stroke:#fff,color:#fff
    style OP011 fill:#5a5a2a,stroke:#fff,color:#fff
    
    style UC001 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC002 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC003 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC004 fill:#3d7ba8,stroke:#fff,color:#fff
    style UC005 fill:#3d7ba8,stroke:#fff,color:#fff
```

### Interpretaci贸n
- **Verde oscuro**: OP reutilizadas en TODOS los 5 UCs (9 operaciones)
- **Verde oliva**: OP reutilizadas en 3-4 UCs (4 operaciones)
- **Azul**: UCs que usan estas operaciones

### An谩lisis
**OP Core (reutilizadas en 5/5 UCs):**
- OP-001, OP-002, OP-003, OP-005, OP-006, OP-011, OP-012, OP-013, OP-014, OP-015 (10 operaciones)

**OP Selectivas (reutilizadas en 3-4 UCs):**
- OP-007 (3 UCs: UC-002, UC-003, UC-005)
- OP-008 (3 UCs: UC-001, UC-003, UC-004)
- OP-010 (3 UCs: UC-001, UC-003, UC-004)
- OP-011 (5 UCs: todas)

---

## DIAGRAMA 5: TIMELINE DE EJECUCI肹SPEC]N

### Descripci贸n
Muestra el tiempo relativo de ejecuci贸n de cada UC, asumiendo que se ejecutan en paralelo donde es posible.

### Visualizaci贸n Mermaid

```mermaid
gantt
    title Timeline de Ejecuci贸n - ACTIVIDAD 1
    dateFormat YYYY-MM-DD
    
    section UC Independientes
    UC-001 Crear Repositorio :uc001, 2026-04-11, 30m
    UC-002 Crear Tarea :uc002, 2026-04-11, 25m
    UC-003 Crear Proyecto :uc003, 2026-04-11, 30m
    UC-004 Crear Pilar :uc004, 2026-04-11, 25m
    
    section UC Dependiente
    UC-005 Crear Nota (requiere UC-001) :crit, uc005, after uc001, 30m
    
    section Validaci贸n
    Testing UC-001 :test001, 2026-04-12, 2h
    Testing UC-002 :test002, 2026-04-12, 1.5h
    Testing UC-003 :test003, 2026-04-12, 1.5h
    Testing UC-004 :test004, 2026-04-12, 1h
    Testing UC-005 :crit, test005, after test001, 2h
```

### Interpretaci贸n
- **UCs 1-4**: Se pueden ejecutar en paralelo (0:00 - 0:30)
- **UC-5**: Debe ejecutarse DESPU脡S de UC-001 (0:30 - 1:00)
- **Testing UC-5**: Depende de que UC-001 est茅 testeado primero

**Parallelismo:**
- M谩ximo nivel de paralelismo: 4 UCs simult谩neamente (UC-001 a UC-004)
- Despu茅s: 1 UC secuencial (UC-005)

---

## DIAGRAMA 6: MATRIZ DE COMPLEJIDAD

### Descripci贸n
Muestra la complejidad relativa de cada UC (complejidad vs n煤mero de actores).

### Visualizaci贸n Mermaid

```mermaid
scatter
    title Matriz de Complejidad - UCs vs Actores
    x-axis "N煤mero de Actores Involucrados"
    y-axis "Complejidad Estimada"
    
    point [5, 2] -> UC-001
    point [5, 2] -> UC-002
    point [5, 2] -> UC-003
    point [5, 2] -> UC-004
    point [6, 3] -> UC-005
```

### Tabla Equivalente

| UC | Actores | Complejidad | Raz贸n |
|----|---------|---|---|
| UC-001 | 5 | MEDIA | 12 operaciones |
| UC-002 | 5 | MEDIA | 11 operaciones |
| UC-003 | 5 | MEDIA | 13 operaciones |
| UC-004 | 5 | MEDIA | 10 operaciones |
| UC-005 | 6 | ALTA | 11 operaciones + precondici贸n + metadata |

### Interpretaci贸n
- **UC-005 es 煤nica**: 6 actores (incluye MetadataCache)
- **UC-005 es m谩s compleja**: ALTA (vs MEDIA en otros)
- **Todas comparten**: 5 actores core (Usuario, QuickAdd, Obsidian, Utils, Template)

---

## DIAGRAMA 7: ESTRUCTURA DE CARPETAS (Vista Jer谩rquica)

### Descripci贸n
Muestra la estructura de carpetas que cada UC crea en el vault.

### Visualizaci贸n Mermaid

```mermaid
graph TB
    Vault["Vault (ra铆z)"]
    
    Repo["repositories/"]
    Task["tasks/"]
    Proj["projects/"]
    Pill["pillars/"]
    
    RepoWork["personal/<br/>work/<br/>research/"]
    TaskPri["high/<br/>normal/<br/>low/"]
    ProjSta["active/<br/>paused/<br/>planning/"]
    PillSta["active/<br/>inactive/"]
    
    RepoID["id-xxx/<br/>repository.md"]
    TaskID["id-xxx/<br/>task.md"]
    ProjID["id-xxx/<br/>project.md"]
    PillID["id-xxx/<br/>pillar.md"]
    
    NoteFolder["notes/"]
    NoteID["id-xxx/<br/>repositoryNote.md"]
    
    Vault --> Repo & Task & Proj & Pill
    
    Repo --> RepoWork
    RepoWork --> RepoID
    RepoID --> NoteFolder
    NoteFolder --> NoteID
    
    Task --> TaskPri
    TaskPri --> TaskID
    
    Proj --> ProjSta
    ProjSta --> ProjID
    
    Pill --> PillSta
    PillSta --> PillID
    
    style Vault fill:#5a3d5a,stroke:#fff,color:#fff,stroke-width:2px
    style Repo fill:#3d5a2a,stroke:#fff,color:#fff
    style Task fill:#3d5a2a,stroke:#fff,color:#fff
    style Proj fill:#3d5a2a,stroke:#fff,color:#fff
    style Pill fill:#3d5a2a,stroke:#fff,color:#fff
    style RepoID fill:#2a5a2a,stroke:#fff,color:#fff
    style TaskID fill:#2a5a2a,stroke:#fff,color:#fff
    style ProjID fill:#2a5a2a,stroke:#fff,color:#fff
    style PillID fill:#2a5a2a,stroke:#fff,color:#fff
    style NoteFolder fill:#5a4a2a,stroke:#fff,color:#fff
    style NoteID fill:#3d4a5a,stroke:#fff,color:#fff
```

### Interpretaci贸n
- **Nivel 1**: Carpetas principales (repositories, tasks, projects, pillars)
- **Nivel 2**: Subcarpetas por tipo/estado/prioridad
- **Nivel 3**: ID 煤nico para cada entidad
- **UC-005 especial**: Crea carpeta `notes/` dentro del repositorio

---

## RESUMEN: DIAGRAMAS CLAVE

| Diagrama | Prop贸sito | Insight Clave |
|----------|-----------|---|
| **Diagrama 1** | Actor UC | 6 actores, 5 UCs, 26 interacciones |
| **Diagrama 2** | Flujo de datos | 25 pasos secuenciales en UC-001 |
| **Diagrama 3** | Dependencias | UC-005 requiere UC-001 |
| **Diagrama 4** | Operaciones | 10 OPs reutilizadas en todos los UCs |
| **Diagrama 5** | Timeline | 4 UCs paralelos, 1 UC secuencial |
| **Diagrama 6** | Complejidad | UC-005 es m谩s complejo (6 actores, ALTA) |
| **Diagrama 7** | Estructura | 4 谩rboles principales + 1 subarbol (notes/) |

---

## CONCLUSI肹SPEC]N

Los diagramas visualizan:
1. **Participaci贸n**: Cada actor en cada UC
2. **Flujo**: C贸mo fluyen los datos entre componentes
3. **Dependencias**: Qu茅 UCs dependen de otros
4. **Reutilizaci贸n**: Qu茅 operaciones se reutilizan
5. **Paralelismo**: Qu茅 UCs pueden ejecutarse simult谩neamente
6. **Complejidad**: Relative difficulty de cada UC
7. **Estructura**: C贸mo se organiza el vault post-ejecuci贸n

---

**DOCUMENTO**: PASO3-DIAGRAMA-ACTORES.md
**VERSI肹SPEC]N**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: DIAGRAMAS COMPLETADOS - VISUALIZACIONES LISTAS
