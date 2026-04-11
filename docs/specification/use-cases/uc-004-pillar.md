```yaml
type: Caso de Uso Formal
title: UC-004 - CREAR PILAR
version: 1.0.0
scope: ACTIVIDAD 1 - Sistema QuickAdd
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-004: CREAR PILAR

## 1. IDENTIFICACI�[SPEC]N

| Atributo | Valor |
|----------|-------|
| **ID** | UC-004 |
| **Nombre** | Crear Pilar |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Fecha �[REF]ltima Actualización** | 2026-04-11 |
| **Prioridad** | MEDIA (Sprint 1-2) |
| **Complejidad** | MEDIA |
| **Operaciones Atómicas** | OP-001, OP-002, OP-005, OP-006, OP-008, OP-011, OP-012, OP-013, OP-014, OP-015 |

---

## 2. DESCRIPCI�[SPEC]N BREVE

El usuario invoca macro "Crear Pilar" a través de command palette de Obsidian. El sistema QuickAdd carga el script createPillar.js que solicita nombre del pilar y estado (Active, Inactive). Valida entrada, genera ID único, obtiene fecha de creación y carpeta padre, construye estructura de carpetas, asigna variables de template, ejecuta template pillar.md y crea archivo final. El usuario recibe notificación de éxito. Un pilar es un concepto o área temática fundamental que contiene notas relacionadas.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario (Nestor)** | Humano | Primario | Invoca macro, proporciona nombre y estado del pilar |
| **QuickAdd Plugin** | Sistema Externo | Secundario | Ejecuta macro, gestiona flujo de scripts |
| **Obsidian Core** | Componente Externo | Secundario | API vault (crear carpetas, crear archivos) |
| **Módulo Utilities** | Componente Externo | Secundario | Genera IDs, obtiene metadata, valida datos |
| **Template pillar.md** | Artefacto | Consumidor | Recibe variables y genera contenido markdown |

---

## 4. PRECONDICIONES

### Precondiciones Técnicas

1. **Macro QuickAdd registrado**
   - Macro "Crear Pilar" está registrada en QuickAdd
   - Script createPillar.js existe en folder scripts/
   - Template pillar.md existe en folder templates/

2. **Obsidian activo**
   - Vault está abierto y accesible
   - Usuario tiene permisos de lectura/escritura en vault
   - Plugin QuickAdd está habilitado

3. **Recursos disponibles**
   - Suficiente espacio en disco para crear carpetas y archivos
   - Suficiente RAM para ejecutar macros QuickAdd

4. **Dependencias instaladas**
   - Plugin QuickAdd versión 1.0+
   - Obsidian versión 1.1+
   - Módulos utils/ instalados correctamente

### Precondiciones de Negocio

1. Usuario tiene intención de crear nuevo pilar
2. Usuario está familiarizado con concepto de pilares (áreas temáticas)
3. Pilar es diferente de proyecto (escala de concepto vs ejecución)

---

## 5. FLUJO PRINCIPAL

### Descripción General

El usuario ejecuta macro que dispara proceso de 12 pasos que culmina en la creación de archivo pillar.md en estructura de carpetas por estado.

### Pasos Detallados

---

#### **Paso 1: Invocación de Macro**

**Actor**: Usuario

**Acción**: Usuario abre command palette (Ctrl+P / Cmd+P) en Obsidian y busca "Crear Pilar"

**Componentes invocados**: Obsidian command palette, QuickAdd macro registry

**Resultado esperado**: Macro "Crear Pilar" es encontrada y seleccionada

---

#### **Paso 2: Carga de Script**

**Actor**: QuickAdd Plugin

**Acción**: 
- QuickAdd detecta selección de macro
- Carga archivo createPillar.js desde folder scripts/
- Inyecta parámetros: { app, quickAddApi, variables }
- Ejecuta función principal del script

**Componentes invocados**: QuickAdd script loader, JavaScript runtime

**Resultado esperado**: Script createPillar.js en ejecución con contexto inyectado

---

#### **Paso 3: Obtener Nombre del Pilar (OP-001)**

**Actor**: createPillar.js + Usuario

**Acción**:
- Script llama quickAddApi.inputPrompt("Nombre del pilar:")
- QuickAdd muestra prompt interactivo
- Usuario ingresa nombre (ej: "Arquitectura de Software")
- Script recibe valor en variable _input_name

**Componentes invocados**: quickAddApi.inputPrompt(), UI prompts QuickAdd

**Resultado esperado**: _input_name contiene nombre ingresado por usuario

---

#### **Paso 4: Obtener Estado del Pilar**

**Actor**: createPillar.js + Usuario

**Acción**:
- Script llama quickAddApi.suggester(["Active", "Inactive"], ["Active", "Inactive"])
- QuickAdd muestra selector con 2 opciones
- Usuario selecciona uno (ej: "Active")
- Script recibe valor en variable _input_status

**Componentes invocados**: quickAddApi.suggester(), UI selector QuickAdd

**Resultado esperado**: _input_status contiene estado seleccionado ("Active" o "Inactive")

---

#### **Paso 5: Validar Entrada (OP-002)**

**Actor**: createPillar.js

**Acción**:
- Validar _input_name no esté vacío
- Validar _input_name >= 3 caracteres
- Validar _input_name <= 255 caracteres
- Validar _input_name contiene solo: letras, números, guiones, espacios
- Validar _input_status es uno de: "Active", "Inactive"
- Si cualquier validación falla Lanzar excepción

**Componentes invocados**: validationOperations.validateCommonInput()

**Resultado esperado**: _valid_input es true, o excepción E-001 a E-004

---

#### **Paso 6: Generar ID �[REF]nico (OP-003)**

**Actor**: createPillar.js

**Acción**:
- Llama generateUniqueId() de módulo utils/
- Genera ID con formato: id-{timestamp}-{random-hex}
- Asigna a variable _pillar_id

**Componentes invocados**: generateUniqueId(), Web Crypto API

**Resultado esperado**: _pillar_id contiene string único (ej: "id-naq5a7-d0h6f5e4g3c1b7d8")

---

#### **Paso 7: Obtener Fecha de Creación (OP-005)**

**Actor**: createPillar.js

**Acción**:
- Llama getCurrentDateTime() de módulo utils/
- Obtiene fecha/hora actual en formato ISO
- Asigna a variable _meta_created

**Componentes invocados**: getCurrentDateTime(), JavaScript Date API

**Resultado esperado**: _meta_created contiene timestamp ISO (ej: "2026-04-11T15:30:15.234Z")

---

#### **Paso 8: Obtener Nombre de Archivo (OP-006)**

**Actor**: createPillar.js

**Acción**:
- Llama getFileName(_input_name) de módulo utils/
- Limpia caracteres especiales
- Limita a 200 caracteres
- Reemplaza espacios con guiones
- Añade extensión .md
- Asigna a variable _file_name

**Componentes invocados**: getFileName()

**Resultado esperado**: _file_name contiene nombre archivo válido (ej: "arquitectura-software.md")

---

#### **Paso 9: Obtener Carpeta Padre (OP-008)**

**Actor**: createPillar.js

**Acción**:
- Llama getGrandParentFolder(currentFilePath) de módulo utils/
- Obtiene nombre de carpeta padre del archivo actual
- Asigna a variable _folder_parent

**Componentes invocados**: getGrandParentFolder()

**Resultado esperado**: _folder_parent contiene nombre carpeta (ej: "400-DIARIO")

---

#### **Paso 10: Procesar Información Específica (OP-011)**

**Actor**: createPillar.js

**Acción**:
- Obtener autor actual (getAuthorName())
- Normalizar estado a minúsculas: "Active" "active"
- Construir tags: [estado, "pilar"]
- Crear objeto _pillar_metadata con estructura completa:
  - id
  - name
  - status (normalizado)
  - created
  - author
  - tags
  - relatedPillars (vacío)

**Componentes invocados**: getAuthorName(), object construction

**Resultado esperado**: _pillar_metadata contiene:
```javascript
{
  id: "id-naq5a7-d0h6f5e4g3c1b7d8",
  name: "Arquitectura de Software",
  status: "active",
  created: "2026-04-11T15:30:15.234Z",
  author: "Nestor",
  tags: ["active", "pilar"],
  relatedPillars: []
}
```

---

#### **Paso 11: Construir Estructura de Carpetas (OP-010)**

**Actor**: createPillar.js

**Acción**:
- Construir ruta de estructura: pillars/{status}/{id}/
- Normalizar estado a minúsculas: "Active" "active"
- Construir ruta completa: pillars/active/{id}/
- Asignar a variable _folder_structure

**Componentes invocados**: String formatting, path construction

**Resultado esperado**: _folder_structure contiene ruta válida (ej: "pillars/active/id-naq5a7-d0h6f5e4g3c1b7d8/")

---

#### **Paso 12: Asignar Variables de Template (OP-012)**

**Actor**: createPillar.js

**Acción**:
- Asignar variables.pillarId = _pillar_id
- Asignar variables.pillarName = _input_name
- Asignar variables.pillarStatus = _input_status
- Asignar variables.folderPath = _folder_structure
- Asignar variables.fileName = _file_name
- Asignar variables.metadata = _pillar_metadata
- Asignar variables.createdDate = _meta_created

**Componentes invocados**: QuickAdd variables object

**Resultado esperado**: Objeto variables poblado con 7 variables para template

---

#### **Paso 13: Ejecutar Template (OP-013)**

**Actor**: QuickAdd Engine

**Acción**:
- QuickAdd carga template templates/pillar.md
- Reemplaza placeholders {{VARIABLE:...}} con valores de variables
- Genera contenido final markdown
- Prepara para creación de archivo

**Componentes invocados**: QuickAdd template engine

**Resultado esperado**: Contenido markdown final generado, sin placeholders sin reemplazar

**Ejemplo de contenido generado**:
```markdown
---
id: id-naq5a7-d0h6f5e4g3c1b7d8
name: Arquitectura de Software
status: active
created: 2026-04-11T15:30:15.234Z
author: Nestor
tags:
  - active
  - pilar
---

# Arquitectura de Software

**Estado:** Active  
**Creado:** 2026-04-11  
**Autor:** Nestor

## Descripción

Conceptos, principios y patrones fundamentales de arquitectura de software

## �[DIR]reas Clave

- [ ] Diseño de sistemas
- [ ] Patrones arquitectónicos
- [ ] Microservicios
- [ ] SOLID Principles
- [ ] Clean Architecture

## Notas Relacionadas

[Enlaces a notas dentro de este pilar]

## Recursos

- Books
- Articles
- Courses
- Projects

## Referencias

[Agregar referencias externas aquí]
```

---

#### **Paso 14: Crear Archivo en Vault (OP-014)**

**Actor**: Obsidian API

**Acción**:
- Obsidian crea carpeta: pillars/active/id-naq5a7-d0h6f5e4g3c1b7d8/
- Obsidian crea archivo: arquitectura-software.md
- Obsidian escribe contenido generado
- Sistema operativo persiste en disco

**Componentes invocados**: app.vault.createFolder(), app.vault.create()

**Resultado esperado**: Archivo creado en ruta correcta con contenido completo

**Manejo de errores**:
- Carpeta no puede ser creada Excepción E-005
- Archivo ya existe Excepción E-006
- Permisos insuficientes Excepción E-007
- Espacio en disco Excepción E-008

---

#### **Paso 15: Mostrar Notificación de Éxito (OP-015)**

**Actor**: createPillar.js

**Acción**:
- Llamar showNotification("Pilar creado: Arquitectura de Software [Active]", "success")
- QuickAdd muestra notificación visual
- Notificación desaparece después de 5 segundos

**Componentes invocados**: showNotification(), QuickAdd notices

**Resultado esperado**: Usuario ve notificación verde: "Éxito: Pilar creado [Active]"

---

## 6. FLUJOS ALTERNATIVOS

---

### Flujo Alternativo A1: Usuario Cancela Durante Nombre

**Punto de Activación**: Paso 3 (prompt de nombre)

**Pasos**:
1. Usuario abre prompt de nombre
2. Usuario presiona ESC o cierra prompt sin ingresar valor
3. QuickAdd detiene ejecución
4. Sistema retorna a estado inicial sin cambios
5. Usuario no ve notificación

**Retorno a Flujo Principal**: No aplica, UC termina sin completar

**Resultado**: Ningún archivo creado

---

### Flujo Alternativo A2: Usuario Ingresa Nombre Inválido

**Punto de Activación**: Paso 5 (validación)

**Pasos**:
1. Usuario ingresa nombre con caracteres inválidos: "Arquitectura @ Software!"
2. Validación en Paso 5 falla
3. Script captura excepción E-003
4. Script llama showNotification("Error: Caracteres inválidos", "error")
5. Macro termina sin crear archivo

**Retorno a Flujo Principal**: No retorna, UC falla

**Resultado**: Ningún archivo creado, usuario ve error

---

## 7. POSTCONDICIONES

### Postcondiciones Técnicas

1. **Archivo creado**
   - Archivo arquitectura-software.md existe en pillars/active/id-naq5a7.../
   - Contenido contiene frontmatter YAML válido
   - Contenido contiene headers markdown válidos
   - Archivo es accesible en Obsidian

2. **Metadatos almacenados**
   - Frontmatter contiene: id, name, status, created, author, tags
   - Valores correctos según entrada usuario
   - Fecha en formato ISO 8601
   - Status es uno de: active, inactive

3. **Estructura creada**
   - Carpeta pillars/ existe
   - Carpeta pillars/active/ (según estado) existe
   - Carpeta pillars/active/id-naq5a7.../ existe
   - Ninguna otra carpeta fue creada

4. **Obsidian actualizado**
   - Archivo aparece en file explorer
   - Archivo es indexable por metadataCache
   - Backlinks funcionan correctamente

### Postcondiciones de Negocio

1. Pilar está listo para ser usado como concepto base
2. Usuario puede abrir archivo y editar contenido
3. Usuario puede crear notas de pilar dentro de este pilar
4. Pilar facilita organización conceptual del vault

---

## 8. PUNTOS CRÍTICOS

### Punto Crítico PC1: Validación de Estado
**Ubicación**: Paso 5
**Riesgo**: Si estado no es uno de los 2 permitidos, estructura será inconsistente
**Mitigación**: Usar lista VALID_STATUSES = ["Active", "Inactive"]

---

### Punto Crítico PC2: Normalización de Estado
**Ubicación**: Paso 11
**Riesgo**: Si estado no es normalizado a minúsculas, carpeta será "Active" en lugar de "active"
**Mitigación**: Siempre normalizar: _input_status.toLowerCase()

---

## 9. EXCEPCIONES

| Código | Condición | Mensaje | Acción |
|--------|-----------|---------|--------|
| **E-001** | Nombre vacío | "Error: Nombre no puede estar vacío" | Mostrar error, terminar macro |
| **E-002** | Nombre < 3 caracteres | "Error: Nombre mínimo 3 caracteres" | Mostrar error, terminar macro |
| **E-003** | Caracteres inválidos | "Error: Solo letras, números, guiones y espacios" | Mostrar error, terminar macro |
| **E-004** | Estado inválido | "Error: Estado debe ser Active o Inactive" | Mostrar error, terminar macro |
| **E-005** | Carpeta no puede crearse | "Error: No se puede crear carpeta (permisos)" | Mostrar error, terminar macro |
| **E-006** | Archivo ya existe | "Error: El archivo ya existe" | Mostrar error, terminar macro |
| **E-007** | Permisos insuficientes | "Error: Permisos insuficientes en vault" | Mostrar error, terminar macro |
| **E-008** | Espacio en disco | "Error: Espacio en disco insuficiente" | Mostrar error, terminar macro |
| **E-009** | Template no encontrado | "Error: Template pillar.md no encontrado" | Mostrar error, terminar macro |

---

## 10. DIAGRAMAS

### Diagrama 1: Flujo de Secuencia

```mermaid
sequenceDiagram
    participant User as Usuario
    participant CP as Command Palette
    participant QA as QuickAdd
    participant Script as createPillar.js
    participant Utils as Módulos Utils/
    participant Template as Template
    participant Obsidian as Obsidian API
    participant FS as File System

    User->>CP: Busca "Crear Pilar"
    CP->>QA: Selecciona macro
    QA->>Script: Carga script, inyecta params
    
    Script->>QA: inputPrompt("Nombre")
    QA->>User: Muestra prompt
    User->>QA: Ingresa "Arquitectura Software"
    QA->>Script: Retorna valor
    
    Script->>QA: suggester(estados)
    QA->>User: Muestra selector
    User->>QA: Selecciona "Active"
    QA->>Script: Retorna "Active"
    
    Script->>Utils: validateCommonInput(input)
    Utils->>Script: Retorna true
    
    Script->>Utils: generateUniqueId()
    Utils->>Script: Retorna id-xxx
    
    Script->>Utils: getCurrentDateTime()
    Utils->>Script: Retorna 2026-04-11T...
    
    Script->>Utils: getFileName(nombre)
    Utils->>Script: Retorna arquitectura-software.md
    
    Script->>Utils: getGrandParentFolder()
    Utils->>Script: Retorna carpeta padre
    
    Script->>Template: Asigna variables
    Template->>Script: Listo para ejecutar
    
    QA->>Template: Reemplaza placeholders
    Template->>QA: Contenido final
    
    QA->>Obsidian: createFolder(pillars/active/id)
    Obsidian->>FS: Crea carpetas
    FS->>Obsidian: Éxito
    
    QA->>Obsidian: create(archivo, contenido)
    Obsidian->>FS: Escribe archivo
    FS->>Obsidian: Archivo creado
    
    Script->>QA: showNotification(éxito)
    QA->>User: Muestra notificación
    User->>User: Ve "Pilar creado [Active]"
```

---

### Diagrama 2: Máquina de Estados

```mermaid
stateDiagram-v2
    [*] --> MACRO_INVOKED
    
    MACRO_INVOKED --> SCRIPT_LOADED: QuickAdd carga script
    
    SCRIPT_LOADED --> PROMPT_NAME: inputPrompt()
    
    PROMPT_NAME --> CANCELLED: Usuario presiona ESC
    PROMPT_NAME --> NAME_RECEIVED: Usuario ingresa nombre
    
    CANCELLED --> [*]: Termina sin cambios
    
    NAME_RECEIVED --> PROMPT_STATUS: suggester()
    PROMPT_STATUS --> STATUS_RECEIVED: Usuario selecciona
    
    STATUS_RECEIVED --> VALIDATED: Validar entrada
    
    VALIDATED --> VALIDATE_ERROR: Error en validación
    VALIDATED --> VALIDATED_OK: Validación exitosa
    
    VALIDATE_ERROR --> [*]: Mostrar error, termina
    
    VALIDATED_OK --> ID_GENERATED: generateUniqueId()
    
    ID_GENERATED --> METADATA_FETCHED: Obtener metadata
    
    METADATA_FETCHED --> STRUCTURE_BUILT: Construir estructura
    
    STRUCTURE_BUILT --> TEMPLATE_ASSIGNED: Asignar variables
    
    TEMPLATE_ASSIGNED --> TEMPLATE_EXECUTED: QuickAdd ejecuta template
    
    TEMPLATE_EXECUTED --> FOLDER_CREATED: createFolder()
    
    FOLDER_CREATED --> FOLDER_ERROR: Error creando carpeta
    FOLDER_CREATED --> FILE_CREATED: create() archivo
    
    FOLDER_ERROR --> [*]: Mostrar error, termina
    
    FILE_CREATED --> FILE_ERROR: Error escribiendo
    FILE_CREATED --> NOTIF_SUCCESS: Mostrar notificación
    
    FILE_ERROR --> [*]: Mostrar error, termina
    
    NOTIF_SUCCESS --> [*]: Éxito - UC completado
    
    style CANCELLED fill:#5a2a2a,stroke:#fff,color:#fff
    style VALIDATE_ERROR fill:#5a2a2a,stroke:#fff,color:#fff
    style FOLDER_ERROR fill:#5a2a2a,stroke:#fff,color:#fff
    style FILE_ERROR fill:#5a2a2a,stroke:#fff,color:#fff
    style NOTIF_SUCCESS fill:#2a5a2a,stroke:#fff,color:#fff
    style VALIDATED_OK fill:#3d5a80,stroke:#fff,color:#fff
    style METADATA_FETCHED fill:#3d5a80,stroke:#fff,color:#fff
    style TEMPLATE_EXECUTED fill:#3d5a80,stroke:#fff,color:#fff
```

---

## 11. NOTAS DE IMPLEMENTACI�[SPEC]N

### Librería y Dependencias

| Librería | Versión | Uso | Razón |
|----------|---------|-----|-------|
| **QuickAdd** | >= 1.0 | Macro engine | Estándar en Obsidian |
| **Obsidian API** | >= 1.1 | Vault access | Nativo en Obsidian |
| **Módulos Utils/** | Desarrollados | Validación, generación | Custom, controlados |

### Testing Strategy

**UC-004 requiere tests para:**
- [DONE][DONE][SPEC] Usuario ingresa nombre válido éxito
- [DONE][DONE][SPEC] Usuario selecciona estado Active estructura pillars/active/
- [DONE][DONE][SPEC] Usuario selecciona estado Inactive estructura pillars/inactive/
- [DONE][DONE][SPEC] Archivo creado contiene YAML válido parseable
- [DONE][DONE][SPEC] Template variables reemplazadas sin placeholders literales
- [DONE][DONE][SPEC] Usuario cancela durante prompt ningún cambio
- [DONE][DONE][SPEC] Carpeta estructura creada correctamente verificar filesystem

---

## 12. TRAZABILIDAD

| Operación Atómica | Pasos UC | Código | Módulo |
|---|---|---|---|
| **OP-001** (Obtener entrada) | 3, 4 | quickAddApi.inputPrompt/suggester | createPillar.js |
| **OP-002** (Validar entrada) | 5 | validateCommonInput() | utils/validationOperations.js |
| **OP-003** (Gen ID único) | 6 | generateUniqueId() | utils/generateUniqueId.js |
| **OP-005** (Fecha actual) | 7 | getCurrentDateTime() | utils/getCurrentDateTime.js |
| **OP-006** (Nombre archivo) | 8 | getFileName() | utils/getFileName.js |
| **OP-008** (Carpeta padre) | 9 | getGrandParentFolder() | utils/getGrandParentFolder.js |
| **OP-010** (Estructura carpetas) | 11 | Inline path construction | createPillar.js |
| **OP-011** (Procesar específico) | 10 | Status mapping, metadata assembly | createPillar.js |
| **OP-012** (Asignar variables) | 12 | variables.X = Y | createPillar.js |
| **OP-013** (Ejecutar template) | 13 | quickAddApi template engine | QuickAdd |
| **OP-014** (Crear archivo) | 14 | app.vault.create() | Obsidian API |
| **OP-015** (Mostrar notificación) | 15 | showNotification() | utils/showNotification.js |

---

## 13. CRITERIOS DE ACEPTACI�[SPEC]N

**UC-004 es COMPLETADO cuando:**

- [ ] Código implementado en createPillar.js
- [ ] Todos 9+ tests PASAN
- [ ] Coverage de UC-004 > 90%
- [ ] Type hints 100% (máximo eslint errors: 0)
- [ ] Docstrings completos (JSDoc style)
- [ ] No warnings de linter
- [ ] Macro ejecutable desde command palette
- [ ] Flujos alternativos A1-A2 testeados
- [ ] Excepciones E-001 a E-009 manejadas
- [ ] Notificaciones visuales funcionan
- [ ] Archivo creado contiene frontmatter válido
- [ ] Carpeta estructura por estado creada correctamente
- [ ] Variables de template reemplazadas
- [ ] Documentación (este artefacto) completada
- [ ] Revisión técnica aprobada

---

## 14. REFERENCIAS

**Documentos relacionados:**
- PASO 1 V4 - Análisis de operaciones atómicas
- PASO2-INDEX - Índice de 5 UCs
- PASO2-UC-001-REPOSITORY - Patrón similar
- PASO2-UC-002-TASK - Patrón similar
- PASO2-UC-003-PROJECT - Patrón similar
- PASO2-UC-005-PILLAR-NOTE - Relacionado (UC-004 es requisito)
- Convenciones-de-Código v1.0.0
- Convenciones-Pragmáticas v1.0.0
- Convenciones-JavaScript v2.0.0

**Especificaciones externas:**
- Obsidian API documentation: https://docs.obsidian.md/
- QuickAdd documentation: https://quickadd.obsidian.guide/

---

**Documento**: UC-004-CREAR-PILAR.md
**Versión**: 1.0.0
**Fecha**: 2026-04-11
**Estado**: ESPECIFICACI�[SPEC]N COMPLETADA - LISTO PARA IMPLEMENTACI�[SPEC]N
