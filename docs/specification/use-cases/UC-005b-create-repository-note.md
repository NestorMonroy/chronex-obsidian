```yaml
type: Caso de Uso Formal
title: UC-005b - CREAR NOTA DE REPOSITORIO
version: 1.0.0
scope: OPERACIONAL - Notas Estructuradas Vinculadas
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-005b: CREAR NOTA DE REPOSITORIO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-005b |
| **Nombre** | Crear Nota de Repositorio |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Fecha Última Actualización** | 2026-04-11 |
| **Prioridad** | ALTA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Operaciones Atómicas** | OP-005B-001, OP-005B-002, OP-005B-003, OP-005B-004 |

---

## 2. DESCRIPCIÓN BREVE

Usuario ejecuta comando "Create Repository Note" o usa macro QuickAdd mAdd500Note. Sistema prompts solicitando: Nombre de Nota, Contenido, Repositorio padre (opcional). Script valida, genera ID único, obtiene metadata. Template repositoryNote.md procesado con variables. Sistema crea archivo vinculado a repositorio padre usando wikiLink. Nota abierta en editor.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario (Nestor)** | Humano | Primario | Ejecuta comando/macro, proporciona datos |
| **QuickAdd Plugin** | Sistema Externo | Secundario | (Opcional) Ejecuta macro |
| **createRepositoryNote.js** | Script Externo | Secundario | Input prompt, validación |
| **Obsidian Core** | Componente Externo | Secundario | API creación archivos, wikilinks |
| **Template repositoryNote.md** | Artefacto | Consumidor | Estructura de nota |

---

## 4. PRECONDICIONES

### Precondiciones Técnicas

1. **Plugin configurado** (UC-P02)
2. **Repositorio padre existe** (UC-001)
3. **Template disponible**: repositoryNote.md

### Precondiciones de Negocio

1. Usuario tiene repositorio creado previamente
2. Usuario desea agregar nota dentro de repositorio
3. Usuario quiere mantener estructura vinculada

---

## 5. FLUJO PRINCIPAL

### Pasos Detallados

---

#### **Paso 1: Ejecutar Comando o Macro**

**Actor**: Usuario

**Acción**: 
- Opción A: Command Palette → "Create Repository Note"
- Opción B: QuickAdd macro (mAdd500Note)

**Resultado esperado**: Handler ejecutado

---

#### **Paso 2: Solicitar Nombre de Nota**

**Actor**: createRepositoryNote.js

**Acción**: Sistema prompts: "Note Name?" (3-100 caracteres)

**Resultado esperado**: Input dialog abierto

---

#### **Paso 3: Solicitar Contenido**

**Actor**: Script

**Acción**: Prompts: "Content?" (textarea)

**Resultado esperado**: User input capturado

---

#### **Paso 4: Solicitar Repositorio Padre (Opcional)**

**Actor**: Script

**Acción**: Prompts: "Repository Name (optional)?"
- Si vacío: nota no vinculada
- Si completado: nota vinculada al repositorio

**Resultado esperado**: Repository ID capturado

---

#### **Paso 5: Validar Entrada**

**Actor**: Script

**Acción**: Valida:
- Nombre: 3-100 chars
- Contenido: 1-5000 chars
- Repository: válido si proporcionado

**Componentes invocados**: validateCommonInput()

**Resultado esperado**: Valores validados

---

#### **Paso 6: Generar ID**

**Actor**: Script

**Acción**: Genera: note-{timestamp}-{randomHex}

**Resultado esperado**: ID único obtenido

---

#### **Paso 7: Cargar Template y Sustituir**

**Actor**: Plugin

**Acción**: 
1. Carga repositoryNote.md
2. Sustituye variables:
   - {{VALUE:noteId}}
   - {{VALUE:noteName}}
   - {{VALUE:repositoryName}} (si proporcionado)

**Resultado esperado**: Template con variables reemplazadas

---

#### **Paso 8: Procesar con Templater**

**Actor**: Templater

**Acción**: Procesa <% %> blocks, genera contenido final

**Resultado esperado**: Contenido procesado

---

#### **Paso 9: Crear Archivo Vinculado**

**Actor**: Obsidian Core

**Acción**: Crea archivo en:
- Path: `500-REPOSITORIOS/{repositoryName}/notas/{fileName}.md`
- Content: Incluye `[[{repositoryName}]]` wikilink

**Resultado esperado**: Archivo creado con backlink

---

#### **Paso 10: Abrir en Editor**

**Actor**: Obsidian

**Acción**: Abre nota en editor

**Resultado esperado**: Nota editable

---

## 6. EXCEPCIONES

### Excepción EXC-005B-001: Repositorio No Encontrado

**Condición**: Repository especificado no existe

**Manejo**:
1. Detectar que [[repositoryName]] no existe
2. Mostrar warning: "Repository not found - note created without link"
3. Crear nota igual (sin wikilink)

**Postcondición**: Nota creada sin vinculación

---

## 7. POSTCONDICIONES

1. **Archivo creado** con backlink a repositorio padre
2. **Nota visible** en editor
3. **Backlink bidireccional** (nota aparece en repositorio)

---

## 8. RELACIONES

| UC | Relación |
|-----|----------|
| UC-001 | Referencia (repositorio padre) |
| UC-INT01 | Puede ejecutarse vía macro |

---

