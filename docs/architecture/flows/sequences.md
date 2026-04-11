```yaml
type: Documento Técnico
title: PASO 3 - FLUJOS DE SECUENCIA
version: 1.0.0
scope: ACTIVIDAD 1 - Flujos de datos entre UCs
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Análisis de flujos y secuencias
```

# PASO 3: FLUJOS DE SECUENCIA
## Documentación de Flujos de Datos entre UCs

---

## INTRODUCCIÓN

Este artefacto documenta **5 flujos principales** que muestra cómo los UCs se conectan y cómo fluyen los datos entre ellos:

1. **Flujo 1**: UC-001 → UC-002 (Crear repositorio, luego crear tarea)
2. **Flujo 2**: UC-001 → UC-005 (Crear repositorio, luego crear nota dentro)
3. **Flujo 3**: UC-004 (Independiente: crear pilar)
4. **Flujo 4**: UC-003 (Independiente: crear proyecto)
5. **Flujo 5**: Flujo completo (todos los UCs en secuencia)

Cada flujo incluye diagrama, análisis de dependencias y consideraciones de implementación.

---

## FLUJO 1: UC-001 → UC-002
### Crear Repositorio, Luego Crear Tarea

### Propósito
El usuario crea un repositorio y luego una tarea asociada. La tarea puede ser contexto del repositorio o independiente.

### Precondiciones
- UC-001 completado exitosamente

### Pasos del Flujo

```
1. Usuario invoca UC-001 (Crear Repositorio)
   └─ Ingresa nombre, tipo
   └─ Sistema crea: repositories/work/id-naq5a4.../repository.md
   └─ Usuario ve notificación de éxito

2. Usuario invoca UC-002 (Crear Tarea)
   └─ Ingresa título, prioridad, fecha
   └─ Sistema crea: tasks/high/id-naq5a5.../task.md
   └─ Usuario ve notificación de éxito

3. Resultado final
   └─ Vault contiene:
      ├─ repositories/work/id-naq5a4.../repository.md
      └─ tasks/high/id-naq5a5.../task.md
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian
    
    U->>Q: 1. Invoca "Crear Repositorio"
    Q->>O: Crea: repositories/work/id-xxx/repository.md
    O->>U: Notificación: "Repositorio creado"
    
    Note over U,Q: [Usuario verifica repository.md]
    
    U->>Q: 2. Invoca "Crear Tarea"
    Q->>O: Crea: tasks/high/id-yyy/task.md
    O->>U: Notificación: "Tarea creada"
    
    Note over U,Q: Ambos UCs completados
```

### Análisis de Datos

| Elemento | UC-001 | UC-002 | Conexión |
|----------|--------|--------|----------|
| Vault State | Inicial | repositories/work/id-xxx/ | Acumula estructura |
| Archivos creados | 1 | +1 = 2 total | Sin sobreescritura |
| IDs únicos | id-naq5a4 | id-naq5a5 | No colisionan |
| Metadata | Timestamps | Timestamps | Independientes |

### Consideraciones de Implementación

- **Independencia**: UC-002 NO depende de UC-001 (crear tarea sin repositorio es válido)
- **Contexto**: Usuario puede vincular tarea al repositorio manualmente en templates
- **Timing**: Pueden ejecutarse inmediatamente sin esperar
- **Riesgo**: BAJO - sin precondiciones

---

## FLUJO 2: UC-001 → UC-005
### Crear Repositorio, Luego Crear Nota en Repositorio

### Propósito
El usuario crea un repositorio y luego una nota dentro de ese repositorio. UC-005 depende de UC-001.

### Precondiciones
- UC-001 completado exitosamente
- Usuario conoce el ID o nombre del repositorio creado

### Pasos del Flujo

```
1. Usuario invoca UC-001 (Crear Repositorio)
   └─ Ingresa nombre: "Mi Proyecto", tipo: "Work"
   └─ Sistema crea:
      ├─ repositories/work/id-naq5a4.../repository.md
      └─ Metadata en frontmatter: id=id-naq5a4
   └─ Usuario ve notificación de éxito

2. Usuario invoca UC-005 (Crear Nota en Repositorio)
   └─ Sistema lista repositorios existentes
   └─ Usuario selecciona "Mi Proyecto (Work)"
   └─ Sistema lee metadata: id=id-naq5a4
   └─ Usuario ingresa título: "Análisis requisitos"
   └─ Sistema crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md
   └─ Frontmatter incluye: repositoryId=id-naq5a4, repositoryName="Mi Proyecto"
   └─ Usuario ve notificación de éxito

3. Resultado final
   └─ Vault contiene:
      ├─ repositories/work/id-naq5a4.../
      │  ├─ repository.md (padre)
      │  └─ notes/id-naq5b8.../repositoryNote.md (hijo)
      └─ Referencia cruzada: [[Mi Proyecto]]
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
    O->>U: Notificación: "Repositorio creado"
    
    Note over U,Q: [Usuario verifica repository.md]
    
    U->>Q: 2. Invoca "Crear Nota en Repositorio"
    Q->>M: Solicita lista de repositorios
    M->>Q: Retorna: ["Mi Proyecto (Work)", "Otro (Personal)"]
    Q->>U: Muestra selector
    U->>Q: Selecciona "Mi Proyecto (Work)"
    
    Q->>M: Lee metadata: id-naq5a4, name, type
    Q->>U: Pide título y descripción
    U->>Q: Ingresa "Análisis requisitos"
    
    Q->>O: Crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md
    O->>M: Indexa con referencia al repositorio
    O->>U: Notificación: "Nota creada en Repositorio"
    
    Note over U,Q: Referencia cruzada bidireccional activa
```

### Análisis de Datos

| Elemento | UC-001 | UC-005 | Conexión |
|----------|--------|--------|----------|
| Vault State | Inicial | repositories/work/id-xxx/notes/ | Estructura jerárquica |
| Archivos creados | 1 | +1 dentro = 2 total en repo | Contenido anidado |
| IDs únicos | id-naq5a4 | id-naq5b8 | No colisionan |
| Metadata | name, type | repositoryId, repositoryName | Vinculación explícita |
| Referencia Cruzada | - | [[Mi Proyecto]] | Bidireccional |

### Consideraciones de Implementación

- **Precondición CRÍTICA**: UC-001 debe estar completado
- **MetadataCache**: Esencial para listar repositorios
- **Validación**: Si repositorio no existe → Error E-001
- **Timing**: UC-005 debe ejecutarse DESPUÉS de UC-001
- **Riesgo**: MEDIO - depende de integridad de metadata

### Testing Order
1. Primero: Test UC-001 completamente
2. Luego: Test UC-005 con repositorio existente
3. Finalmente: Test secuencia completa

---

## FLUJO 3: UC-004 (INDEPENDIENTE)
### Crear Pilar

### Propósito
El usuario crea un pilar (área temática fundamental). UC-004 es completamente independiente.

### Precondiciones
- Ninguna

### Pasos del Flujo

```
1. Usuario invoca UC-004 (Crear Pilar)
   └─ Ingresa nombre: "Arquitectura Software", estado: "Active"
   └─ Sistema crea: pillars/active/id-naq5a7.../pillar.md
   └─ Usuario ve notificación de éxito

2. Resultado final
   └─ Vault contiene:
      └─ pillars/active/id-naq5a7.../pillar.md
      └─ Sin dependencias de otros UCs
      └─ Sin archivos relacionados automáticamente
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
    O->>U: Notificación: "Pilar creado"
    
    Note over U,Q: UC-004 completado - sin dependencias
```

### Análisis de Datos

| Elemento | UC-004 |
|----------|--------|
| Precondición | Ninguna |
| Estructura | pillars/active/id-xxx/ |
| Archivos | 1 (pillar.md) |
| IDs | id-naq5a7 |
| Independencia | Total (no depende de otros UCs) |

### Consideraciones de Implementación

- **Simplicidad**: Más simple que UC-001, UC-002, UC-003
- **Independencia**: Puede ejecutarse en cualquier momento
- **Paralelismo**: Puede ejecutarse simultáneamente con UC-001, UC-002, UC-003, UC-005
- **Riesgo**: BAJO - sin precondiciones

---

## FLUJO 4: UC-003 (INDEPENDIENTE)
### Crear Proyecto

### Propósito
El usuario crea un proyecto. UC-003 es completamente independiente.

### Precondiciones
- Ninguna

### Pasos del Flujo

```
1. Usuario invoca UC-003 (Crear Proyecto)
   └─ Ingresa nombre: "Implementar autenticación", estado: "Active"
   └─ Ingresa descripción: "Sistema OAuth2 + 2FA"
   └─ Sistema crea: projects/active/id-naq5a6.../project.md
   └─ Usuario ve notificación de éxito

2. Resultado final
   └─ Vault contiene:
      └─ projects/active/id-naq5a6.../project.md
      └─ Sin dependencias
```

### Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Q as QuickAdd
    participant O as Obsidian

    U->>Q: 1. Invoca "Crear Proyecto"
    Q->>U: Muestra prompts (nombre, estado, descripción)
    U->>Q: Ingresa datos
    
    Q->>O: Crea: projects/active/id-naq5a6.../project.md
    O->>U: Notificación: "Proyecto creado"
```

### Análisis de Datos

| Elemento | UC-003 |
|----------|--------|
| Estructura | projects/active/id-xxx/ |
| Archivos | 1 (project.md) |
| IDs | id-naq5a6 |
| Independencia | Total |

### Consideraciones de Implementación

- **Complejidad**: Similar a UC-001 (17 pasos)
- **Independencia**: No depende de otros UCs
- **Paralelismo**: Compatible con todos los demás
- **Riesgo**: BAJO

---

## FLUJO 5: FLUJO COMPLETO
### Todos los UCs en Secuencia Lógica

### Propósito
El usuario ejecuta todos los UCs en el orden que tiene más sentido lógico, aprovechando dependencias donde existen.

### Orden Recomendado

```
PARALELO (T=0:00 a 0:30)
├─ UC-001: Crear Repositorio (30 min)
├─ UC-002: Crear Tarea (25 min)
├─ UC-003: Crear Proyecto (30 min)
└─ UC-004: Crear Pilar (25 min)

SECUENCIAL (T=0:30 a 1:00)
└─ UC-005: Crear Nota en Repositorio (30 min)
   (Requiere UC-001 completado)

RESULTADO FINAL (T=1:00)
└─ Vault contiene todos los elementos creados
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
    
    section UC Secuencial (Después de 0:30)
    UC-005 Nota en Repo :crit, uc005, after uc001, 30m
```

### Pasos del Flujo Completo

```
FASE 1: PARALELIZACIÓN (T=0:00 a 0:30)

En paralelo:
  Usuario 1: Ejecuta UC-001 (Crear Repositorio "Mi Proyecto")
  Usuario 2: Ejecuta UC-002 (Crear Tarea "Revisar documento")
  Usuario 3: Ejecuta UC-003 (Crear Proyecto "Implementar auth")
  Usuario 4: Ejecuta UC-004 (Crear Pilar "Arquitectura")

RESULTADO PARCIAL:
  ├─ repositories/work/id-naq5a4.../repository.md
  ├─ tasks/high/id-naq5a5.../task.md
  ├─ projects/active/id-naq5a6.../project.md
  └─ pillars/active/id-naq5a7.../pillar.md

FASE 2: SECUENCIAL (T=0:30 a 1:00)

Prerequisito cumplido: UC-001 completado (repositorio "Mi Proyecto" existe)

Usuario 5: Ejecuta UC-005 (Crear Nota en Repositorio)
  └─ Selecciona: "Mi Proyecto (Work)"
  └─ Ingresa: "Análisis requisitos"
  └─ Sistema crea: repositories/work/id-naq5a4.../notes/id-naq5b8.../repositoryNote.md

RESULTADO FINAL (T=1:00):
  ├─ repositories/
  │  └─ work/id-naq5a4.../
  │     ├─ repository.md (padre)
  │     └─ notes/id-naq5b8.../repositoryNote.md (hijo)
  ├─ tasks/high/id-naq5a5.../task.md
  ├─ projects/active/id-naq5a6.../project.md
  └─ pillars/active/id-naq5a7.../pillar.md

TOTAL: 6 archivos, 4 carpetas principales, estructura jerárquica completa
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
        Q->>Q: Ejecuta 4 UCs simultáneamente
    end
    
    Note over U1,Q: [SINCRONIZACIÓN EN T=0:30]
    
    seq FASE 2: Secuencial (0:30-1:00)
        U5->>Q: UC-005: Crear Nota (requiere UC-001)
        Q->>Q: UC-001 está completado ✓
        Q->>U5: Éxito: Nota creada en Repositorio
    end
    
    Note over U1,U5: [COMPLETADO EN T=1:00]
```

### Análisis de Datos - Flujo Completo

| Elemento | ANTES | DESPUÉS |
|----------|-------|---------|
| Archivos | 0 | 6 |
| Carpetas principales | 0 | 4 (repositories, tasks, projects, pillars) |
| Niveles de profundidad | N/A | 3 |
| IDs únicos | 0 | 5 (repo, tarea, proyecto, pilar, nota) |
| Metadatos | 0 | 6 (todos los archivos) |
| Referencias cruzadas | 0 | 1 (nota → repositorio) |

### Consideraciones de Implementación - Flujo Completo

**Ventajas:**
- Paralelizar UC-001 a UC-004 reduce tiempo total
- UC-005 se ejecuta después, garantizando precondición
- Estructura jerárquica resulta intuitiva

**Riesgos:**
- Sincronización entre fases (necesita validación en T=0:30)
- UC-005 depende de UC-001 (si falla, UC-005 falla)
- Metadata debe estar indexada antes de UC-005

**Recomendación:**
- Usar paralelismo para UC-001 a UC-004
- Esperar confirmación antes de UC-005
- Validar metadata de repositorio antes de selector

---

## FLUJOS ALTERNATIVOS

### Flujo Alternativo 1: Solo UC-001 + UC-005 (Mínimo Viable)

```
Usuario crea 1 repositorio y 1 nota dentro
└─ UC-001: Crear Repositorio
└─ UC-005: Crear Nota en Repositorio
└─ Tiempo total: 1 hora
└─ Complejidad: MEDIA
└─ Satisface: "Crear nota dentro de repositorio"
```

---

### Flujo Alternativo 2: Solo UC independientes

```
Usuario crea repositorio, tarea, proyecto, pilar (sin notas)
├─ UC-001: Crear Repositorio
├─ UC-002: Crear Tarea
├─ UC-003: Crear Proyecto
└─ UC-004: Crear Pilar
└─ Tiempo total: 30 minutos (paralelo)
└─ Complejidad: BAJA
└─ Satisface: "Crear múltiples entidades"
```

---

## RESUMEN: FLUJOS DOCUMENTADOS

| Flujo | UCs | Tiempo | Dependencias | Complejidad |
|-------|-----|--------|---|---|
| **Flujo 1** | UC-001 → UC-002 | 55 min | Ninguna | BAJA |
| **Flujo 2** | UC-001 → UC-005 | 1 h | UC-001 req | MEDIA |
| **Flujo 3** | UC-004 | 25 min | Ninguna | BAJA |
| **Flujo 4** | UC-003 | 30 min | Ninguna | BAJA |
| **Flujo 5** | UC-001→UC-005 + UC-002 + UC-003 + UC-004 | 1 h (paralelo) | UC-001 req | MEDIA |

---

## CONCLUSIÓN

Los 5 flujos documentan cómo los UCs se conectan y pueden ejecutarse:

1. **Flujo 1-4**: Combinaciones parciales (útiles para debugging)
2. **Flujo 5**: Flujo completo (recomendado para uso real)

**Recomendación de Implementación:**
- Desarrollar UC-001 a UC-004 en paralelo
- Implementar UC-005 después, con validación de UC-001
- Testing puede seguir flujos 1-4 para aislamiento

---

**DOCUMENTO**: PASO3-FLUJOS-SECUENCIA.md
**VERSIÓN**: 1.0.0
**FECHA**: 2026-04-11
**ESTADO**: FLUJOS DOCUMENTADOS - PASO 3 COMPLETADO
