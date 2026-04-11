```yaml
type: Documento T茅cnico
title: PASO 3 - FLUJOS DE SECUENCIA
version: 1.0.0
scope: ACTIVIDAD 1 - Flujos de datos entre UCs
date: 2026-04-11
language: Espa帽ol Mexicano - T茅cnico Profesional
status: An谩lisis de flujos y secuencias
```

# PASO 3: FLUJOS DE SECUENCIA
## Documentaci贸n de Flujos de Datos entre UCs

---

## INTRODUCCI肹SPEC]N

Este artefacto documenta **5 flujos principales** que muestra c贸mo los UCs se conectan y c贸mo fluyen los datos entre ellos:

1. **Flujo 1**: UC-001 UC-002 (Crear repositorio, luego crear tarea)
2. **Flujo 2**: UC-001 UC-005 (Crear repositorio, luego crear nota dentro)
3. **Flujo 3**: UC-004 (Independiente: crear pilar)
4. **Flujo 4**: UC-003 (Independiente: crear proyecto)
5. **Flujo 5**: Flujo completo (todos los UCs en secuencia)

Cada flujo incluye diagrama, an谩lisis de dependencias y consideraciones de implementaci贸n.

---

## FLUJO 1: UC-001 UC-002
### Crear Repositorio, Luego Crear Tarea

### Prop贸sito
El usuario crea un repositorio y luego una tarea asociada. La tarea puede ser contexto del repositorio o independiente.

### Precondiciones
- UC-001 completado exitosamente

### Pasos del Flujo

```
1. Usuario invoca UC-001 (Crear Repositorio)
   [DONE]敂[DONE]擺READY] Ingresa nombre, tipo
   [DONE]敂[DONE]擺READY] Sistema crea: repositories/work/id-naq5a4.../repository.md
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

2. Usuario invoca UC-002 (Crear Tarea)
   [DONE]敂[DONE]擺READY] Ingresa t铆tulo, prioridad, fecha
   [DONE]敂[DONE]擺READY] Sistema crea: tasks/high/id-naq5a5.../task.md
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

3. Resultado final
   [DONE]敂[DONE]擺READY] Vault contiene:
      [DONE]擺DONE][DONE]擺READY] repositories/work/id-naq5a4.../repository.md
      [DONE]敂[DONE]擺READY] tasks/high/id-naq5a5.../task.md
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian
    
    U->>Q: 1. Invoca "Crear Repositorio"
    Q->>O: Crea: repositories/work/id-xxx/repository.md
    O->>U: Notificaci贸n: "Repositorio creado"
    
    Note over U,Q: [Usuario verifica repository.md]
    
    U->>Q: 2. Invoca "Crear Tarea"
    Q->>O: Crea: tasks/high/id-yyy/task.md
    O->>U: Notificaci贸n: "Tarea creada"
    
    Note over U,Q: Ambos UCs completados
```

### An谩lisis de Datos

| Elemento | UC-001 | UC-002 | Conexi贸n |
|----------|--------|--------|----------|
| Vault State | Inicial | repositories/work/id-xxx/ | Acumula estructura |
| Archivos creados | 1 | +1 = 2 total | Sin sobreescritura |
| IDs 煤nicos | id-naq5a4 | id-naq5a5 | No colisionan |
| Metadata | Timestamps | Timestamps | Independientes |

### Consideraciones de Implementaci贸n

- **Independencia**: UC-002 NO depende de UC-001 (crear tarea sin repositorio es v谩lido)
- **Contexto**: Usuario puede vincular tarea al repositorio manualmente en templates
- **Timing**: Pueden ejecutarse inmediatamente sin esperar
- **Riesgo**: BAJO - sin precondiciones

---

## FLUJO 2: UC-001 UC-005
### Crear Repositorio, Luego Crear Nota en Repositorio

### Prop贸sito
El usuario crea un repositorio y luego una nota dentro de ese repositorio. UC-005 depende de UC-001.

### Precondiciones
- UC-001 completado exitosamente
- Usuario conoce el ID o nombre del repositorio creado

### Pasos del Flujo

```
1. Usuario invoca UC-001 (Crear Repositorio)
   [DONE]敂[DONE]擺READY] Ingresa nombre: "Mi Proyecto", tipo: "Work"
   [DONE]敂[DONE]擺READY] Sistema crea:
      [DONE]擺DONE][DONE]擺READY] repositories/work/id-naq5a4.../repository.md
      [DONE]敂[DONE]擺READY] Metadata en frontmatter: id=id-naq5a4
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

2. Usuario invoca UC-005 (Crear Nota en Repositorio)
   [DONE]敂[DONE]擺READY] Sistema lista repositorios existentes
   [DONE]敂[DONE]擺READY] Usuario selecciona "Mi Proyecto (Work)"
   [DONE]敂[DONE]擺READY] Sistema lee metadata: id=id-naq5a4
   [DONE]敂[DONE]擺READY] Usuario ingresa t铆tulo: "An谩lisis requisitos"
   [DONE]敂[DONE]擺READY] Sistema crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md
   [DONE]敂[DONE]擺READY] Frontmatter incluye: repositoryId=id-naq5a4, repositoryName="Mi Proyecto"
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

3. Resultado final
   [DONE]敂[DONE]擺READY] Vault contiene:
      [DONE]擺DONE][DONE]擺READY] repositories/work/id-naq5a4.../
      [DONE]攤  [DONE]擺DONE][DONE]擺READY] repository.md (padre)
      [DONE]攤  [DONE]敂[DONE]擺READY] notes/id-naq5b8.../repositoryNote.md (hijo)
      [DONE]敂[DONE]擺READY] Referencia cruzada: [[Mi Proyecto]]
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian
    participant M as MetadataCache

    U->>Q: 1. Invoca "Crear Repositorio"
    Q->>O: Crea: repositories/work/id-naq5a4.../repository.md
    O->>M: Indexa metadata (id, name, type)
    O->>U: Notificaci贸n: "Repositorio creado"
    
    Note over U,Q: [Usuario verifica repository.md]
    
    U->>Q: 2. Invoca "Crear Nota en Repositorio"
    Q->>M: Solicita lista de repositorios
    M->>Q: Retorna: ["Mi Proyecto (Work)", "Otro (Personal)"]
    Q->>U: Muestra selector
    U->>Q: Selecciona "Mi Proyecto (Work)"
    
    Q->>M: Lee metadata: id-naq5a4, name, type
    Q->>U: Pide t铆tulo y descripci贸n
    U->>Q: Ingresa "An谩lisis requisitos"
    
    Q->>O: Crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md
    O->>M: Indexa con referencia al repositorio
    O->>U: Notificaci贸n: "Nota creada en Repositorio"
    
    Note over U,Q: Referencia cruzada bidireccional activa
```

### An谩lisis de Datos

| Elemento | UC-001 | UC-005 | Conexi贸n |
|----------|--------|--------|----------|
| Vault State | Inicial | repositories/work/id-xxx/notes/ | Estructura jer谩rquica |
| Archivos creados | 1 | +1 dentro = 2 total en repo | Contenido anidado |
| IDs 煤nicos | id-naq5a4 | id-naq5b8 | No colisionan |
| Metadata | name, type | repositoryId, repositoryName | Vinculaci贸n expl铆cita |
| Referencia Cruzada | - | [[Mi Proyecto]] | Bidireccional |

### Consideraciones de Implementaci贸n

- **Precondici贸n CR脥TICA**: UC-001 debe estar completado
- **MetadataCache**: Esencial para listar repositorios
- **Validaci贸n**: Si repositorio no existe Error E-001
- **Timing**: UC-005 debe ejecutarse DESPU脡S de UC-001
- **Riesgo**: MEDIO - depende de integridad de metadata

### Testing Order
1. Primero: Test UC-001 completamente
2. Luego: Test UC-005 con repositorio existente
3. Finalmente: Test secuencia completa

---

## FLUJO 3: UC-004 (INDEPENDIENTE)
### Crear Pilar

### Prop贸sito
El usuario crea un pilar (谩rea tem谩tica fundamental). UC-004 es completamente independiente.

### Precondiciones
- Ninguna

### Pasos del Flujo

```
1. Usuario invoca UC-004 (Crear Pilar)
   [DONE]敂[DONE]擺READY] Ingresa nombre: "Arquitectura Software", estado: "Active"
   [DONE]敂[DONE]擺READY] Sistema crea: pillars/active/id-naq5a7.../pillar.md
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

2. Resultado final
   [DONE]敂[DONE]擺READY] Vault contiene:
      [DONE]敂[DONE]擺READY] pillars/active/id-naq5a7.../pillar.md
      [DONE]敂[DONE]擺READY] Sin dependencias de otros UCs
      [DONE]敂[DONE]擺READY] Sin archivos relacionados autom谩ticamente
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian

    U->>Q: 1. Invoca "Crear Pilar"
    Q->>U: Muestra prompt nombre
    U->>Q: Ingresa "Arquitectura Software"
    
    Q->>U: Muestra selector estado
    U->>Q: Selecciona "Active"
    
    Q->>O: Crea: pillars/active/id-naq5a7.../pillar.md
    O->>U: Notificaci贸n: "Pilar creado"
    
    Note over U,Q: UC-004 completado - sin dependencias
```

### An谩lisis de Datos

| Elemento | UC-004 |
|----------|--------|
| Precondici贸n | Ninguna |
| Estructura | pillars/active/id-xxx/ |
| Archivos | 1 (pillar.md) |
| IDs | id-naq5a7 |
| Independencia | Total (no depende de otros UCs) |

### Consideraciones de Implementaci贸n

- **Simplicidad**: M谩s simple que UC-001, UC-002, UC-003
- **Independencia**: Puede ejecutarse en cualquier momento
- **Paralelismo**: Puede ejecutarse simult谩neamente con UC-001, UC-002, UC-003, UC-005
- **Riesgo**: BAJO - sin precondiciones

---

## FLUJO 4: UC-003 (INDEPENDIENTE)
### Crear Proyecto

### Prop贸sito
El usuario crea un proyecto. UC-003 es completamente independiente.

### Precondiciones
- Ninguna

### Pasos del Flujo

```
1. Usuario invoca UC-003 (Crear Proyecto)
   [DONE]敂[DONE]擺READY] Ingresa nombre: "Implementar autenticaci贸n", estado: "Active"
   [DONE]敂[DONE]擺READY] Ingresa descripci贸n: "Sistema OAuth2 + 2FA"
   [DONE]敂[DONE]擺READY] Sistema crea: projects/active/id-naq5a6.../project.md
   [DONE]敂[DONE]擺READY] Usuario ve notificaci贸n de 茅xito

2. Resultado final
   [DONE]敂[DONE]擺READY] Vault contiene:
      [DONE]敂[DONE]擺READY] projects/active/id-naq5a6.../project.md
      [DONE]敂[DONE]擺READY] Sin dependencias
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian

    U->>Q: 1. Invoca "Crear Proyecto"
    Q->>U: Muestra prompts (nombre, estado, descripci贸n)
    U->>Q: Ingresa datos
    
    Q->>O: Crea: projects/active/id-naq5a6.../project.md
    O->>U: Notificaci贸n: "Proyecto creado"
```

### An谩lisis de Datos

| Elemento | UC-003 |
|----------|--------|
| Estructura | projects/active/id-xxx/ |
| Archivos | 1 (project.md) |
| IDs | id-naq5a6 |
| Independencia | Total |

### Consideraciones de Implementaci贸n

- **Complejidad**: Similar a UC-001 (17 pasos)
- **Independencia**: No depende de otros UCs
- **Paralelismo**: Compatible con todos los dem谩s
- **Riesgo**: BAJO

---

## FLUJO 5: FLUJO COMPLETO
### Todos los UCs en Secuencia L贸gica

### Prop贸sito
El usuario ejecuta todos los UCs en el orden que tiene m谩s sentido l贸gico, aprovechando dependencias donde existen.

### Orden Recomendado

```
PARALELO (T=0:00 a 0:30)
[DONE]擺DONE][DONE]擺READY] UC-001: Crear Repositorio (30 min)
[DONE]擺DONE][DONE]擺READY] UC-002: Crear Tarea (25 min)
[DONE]擺DONE][DONE]擺READY] UC-003: Crear Proyecto (30 min)
[DONE]敂[DONE]擺READY] UC-004: Crear Pilar (25 min)

SECUENCIAL (T=0:30 a 1:00)
[DONE]敂[DONE]擺READY] UC-005: Crear Nota en Repositorio (30 min)
   (Requiere UC-001 completado)

RESULTADO FINAL (T=1:00)
[DONE]敂[DONE]擺READY] Vault contiene todos los elementos creados
```

### Diagrama de Gantt

```mermaid
gantt
    title Flujo Completo ACTIVIDAD 1 - Timeline Paralelo + Secuencial
    dateFormat HH:mm
    
    section UC Paralelos (0:00-0:30)
    UC-001 Repositorio :uc001, 00:00, 30m
    UC-002 Tarea :uc002, 00:00, 25m
    UC-003 Proyecto :uc003, 00:00, 30m
    UC-004 Pilar :uc004, 00:00, 25m
    
    section UC Secuencial (Despu茅s de 0:30)
    UC-005 Nota en Repo :crit, uc005, after uc001, 30m
```

### Pasos del Flujo Completo

```
FASE 1: PARALELIZACI肹SPEC]N (T=0:00 a 0:30)

En paralelo:
  Usuario 1: Ejecuta UC-001 (Crear Repositorio "Mi Proyecto")
  Usuario 2: Ejecuta UC-002 (Crear Tarea "Revisar documento")
  Usuario 3: Ejecuta UC-003 (Crear Proyecto "Implementar auth")
  Usuario 4: Ejecuta UC-004 (Crear Pilar "Arquitectura")

RESULTADO PARCIAL:
  [DONE]擺DONE][DONE]擺READY] repositories/work/id-naq5a4.../repository.md
  [DONE]擺DONE][DONE]擺READY] tasks/high/id-naq5a5.../task.md
  [DONE]擺DONE][DONE]擺READY] projects/active/id-naq5a6.../project.md
  [DONE]敂[DONE]擺READY] pillars/active/id-naq5a7.../pillar.md

FASE 2: SECUENCIAL (T=0:30 a 1:00)

Prerequisito cumplido: UC-001 completado (repositorio "Mi Proyecto" existe)

Usuario 5: Ejecuta UC-005 (Crear Nota en Repositorio)
  [DONE]敂[DONE]擺READY] Selecciona: "Mi Proyecto (Work)"
  [DONE]敂[DONE]擺READY] Ingresa: "An谩lisis requisitos"
  [DONE]敂[DONE]擺READY] Sistema crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md

RESULTADO FINAL (T=1:00):
  [DONE]擺DONE][DONE]擺READY] repositories/
  [DONE]攤  [DONE]敂[DONE]擺READY] work/id-naq5a4.../
  [DONE]攤     [DONE]擺DONE][DONE]擺READY] repository.md (padre)
  [DONE]攤     [DONE]敂[DONE]擺READY] notes/id-naq5b8.../repositoryNote.md (hijo)
  [DONE]擺DONE][DONE]擺READY] tasks/high/id-naq5a5.../task.md
  [DONE]擺DONE][DONE]擺READY] projects/active/id-naq5a6.../project.md
  [DONE]敂[DONE]擺READY] pillars/active/id-naq5a7.../pillar.md

TOTAL: 6 archivos, 4 carpetas principales, estructura jer谩rquica completa
```

### Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    participant U1 as Usuario<br/>(Repo)
    participant U2 as Usuario<br/>(Tarea)
    participant U3 as Usuario<br/>(Proyecto)
    participant U4 as Usuario<br/>(Pilar)
    participant U5 as Usuario<br/>(Nota)
    participant Q as QuickAdd
    
    par FASE 1: Paralelo (0:00-0:30)
        U1->>Q: UC-001: Crear Repositorio
        U2->>Q: UC-002: Crear Tarea
        U3->>Q: UC-003: Crear Proyecto
        U4->>Q: UC-004: Crear Pilar
    and
        Q->>Q: Ejecuta 4 UCs simult谩neamente
    end
    
    Note over U1,Q: [SINCRONIZACI肹SPEC]N EN T=0:30]
    
    seq FASE 2: Secuencial (0:30-1:00)
        U5->>Q: UC-005: Crear Nota (requiere UC-001)
        Q->>Q: UC-001 est谩 completado [DONE][DONE][SPEC]
        Q->>U5: 脡xito: Nota creada en Repositorio
    end
    
    Note over U1,U5: [COMPLETADO EN T=1:00]
```

### An谩lisis de Datos - Flujo Completo

| Elemento | ANTES | DESPU脡S |
|----------|-------|---------|
| Archivos | 0 | 6 |
| Carpetas principales | 0 | 4 (repositories, tasks, projects, pillars) |
| Niveles de profundidad | N/A | 3 |
| IDs 煤nicos | 0 | 5 (repo, tarea, proyecto, pilar, nota) |
| Metadatos | 0 | 6 (todos los archivos) |
| Referencias cruzadas | 0 | 1 (nota repositorio) |

### Consideraciones de Implementaci贸n - Flujo Completo

**Ventajas:**
- Paralelizar UC-001 a UC-004 reduce tiempo total
- UC-005 se ejecuta despu茅s, garantizando precondici贸n
- Estructura jer谩rquica resulta intuitiva

**Riesgos:**
- Sincronizaci贸n entre fases (necesita validaci贸n en T=0:30)
- UC-005 depende de UC-001 (si falla, UC-005 falla)
- Metadata debe estar indexada antes de UC-005

**Recomendaci贸n:**
- Usar paralelismo para UC-001 a UC-004
- Esperar confirmaci贸n antes de UC-005
- Validar metadata de repositorio antes de selector

---

## FLUJOS ALTERNATIVOS

### Flujo Alternativo 1: Solo UC-001 + UC-005 (M铆nimo Viable)

```
Usuario crea 1 repositorio y 1 nota dentro
[DONE]敂[DONE]擺READY] UC-001: Crear Repositorio
[DONE]敂[DONE]擺READY] UC-005: Crear Nota en Repositorio
[DONE]敂[DONE]擺READY] Tiempo total: 1 hora
[DONE]敂[DONE]擺READY] Complejidad: MEDIA
[DONE]敂[DONE]擺READY] Satisface: "Crear nota dentro de repositorio"
```

---

### Flujo Alternativo 2: Solo UC independientes

```
Usuario crea repositorio, tarea, proyecto, pilar (sin notas)
[DONE]擺DONE][DONE]擺READY] UC-001: Crear Repositorio
[DONE]擺DONE][DONE]擺READY] UC-002: Crear Tarea
[DONE]擺DONE][DONE]擺READY] UC-003: Crear Proyecto
[DONE]敂[DONE]擺READY] UC-004: Crear Pilar
[DONE]敂[DONE]擺READY] Tiempo total: 30 minutos (paralelo)
[DONE]敂[DONE]擺READY] Complejidad: BAJA
[DONE]敂[DONE]擺READY] Satisface: "Crear m煤ltiples entidades"
```

---

## RESUMEN: FLUJOS DOCUMENTADOS

| Flujo | UCs | Tiempo | Dependencias | Complejidad |
|-------|-----|--------|---|---|
| **Flujo 1** | UC-001 UC-002 | 55 min | Ninguna | BAJA |
| **Flujo 2** | UC-001 UC-005 | 1 h | UC-001 req | MEDIA |
| **Flujo 3** | UC-004 | 25 min | Ninguna | BAJA |
| **Flujo 4** | UC-003 | 30 min | Ninguna | BAJA |
| **Flujo 5** | UC-001[DONE]啋UC-005 + UC-002 + UC-003 + UC-004 | 1 h (paralelo) | UC-001 req | MEDIA |

---

## CONCLUSI肹SPEC]N

Los 5 flujos documentan c贸mo los UCs se conectan y pueden ejecutarse:

1. **Flujo 1-4**: Combinaciones parciales (煤tiles para debugging)
2. **Flujo 5**: Flujo completo (recomendado para uso real)

**Recomendaci贸n de Implementaci贸n:**
- Desarrollar UC-001 a UC-004 en paralelo
- Implementar UC-005 despu茅s, con validaci贸n de UC-001
- Testing puede seguir flujos 1-4 para aislamiento

---

**DOCUMENTO**: PASO3-FLUJOS-SECUENCIA.md
**VERSI肹SPEC]N**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: FLUJOS DOCUMENTADOS - PASO 3 COMPLETADO
