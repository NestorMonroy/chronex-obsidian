```yaml
type: Caso de Uso Formal
title: UC-005 - CREAR NOTA FUGAZ
version: 1.0.0
scope: OPERACIONAL - Creación de Notas Rápidas
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-005: CREAR NOTA FUGAZ

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-005 |
| **Nombre** | Crear Nota Fugaz |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Fecha Última Actualización** | 2026-04-11 |
| **Prioridad** | ALTA (Sprint 1) |
| **Complejidad** | MEDIA |
| **Operaciones Atómicas** | OP-005-001, OP-005-002, OP-005-003, OP-005-004 |

---

## 2. DESCRIPCIÓN BREVE

Usuario ejecuta comando "Create Fleeting Note" desde Command Palette. Sistema prompts solicitando contenido de nota rápida. Usuario ingresa texto. Script valida, genera ID único con timestamp, obtiene fecha/autor actual. Templater procesa template nota-fugaz.md. Sistema crea archivo timestamped en folder 100-INBOX/notas-fugaz/. Usuario recibe confirmación, nota abre en editor.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario (Nestor)** | Humano | Primario | Ejecuta comando, proporciona contenido |
| **Plugin Command Handler** | Componente Interno | Secundario | Ejecuta handler del comando |
| **createFleetingNote.js** | Script Externo | Secundario | Prompt de usuario, validación |
| **Obsidian Core** | Componente Externo | Secundario | API de creación de archivos |
| **Template nota-fugaz.md** | Artefacto | Consumidor | Recibe variables y genera contenido |

---

## 4. PRECONDICIONES

### Precondiciones Técnicas

1. **Plugin instalado y configurado**
   - UC-P01 y UC-P02 completados
   - Comando "Create Fleeting Note" registrado

2. **Folder destino existe o será creado**
   - 100-INBOX/notas-fugaz/ debe existir
   - O será creado automáticamente

3. **Template disponible**
   - nota-fugaz.md existe en templates folder
   - O existe en 990-UTILIDADES/991-template/

4. **Permisos de escritura**
   - Usuario tiene permisos para crear archivos en 100-INBOX/

### Precondiciones de Negocio

1. Usuario necesita capturar idea rápida/temporal
2. Nota será procesada posteriormente
3. Usuario prefiere formato simple sin estructura compleja

---

## 5. FLUJO PRINCIPAL

### Descripción General

Usuario ejecuta comando, ingresa contenido rápido, sistema crea nota con timestamp automático en folder INBOX.

### Pasos Detallados

---

#### **Paso 1: Ejecutar Comando**

**Actor**: Usuario

**Acción**: Usuario abre Command Palette (Ctrl+P), busca "Fleeting Note" o "Create Fleeting Note", presiona Enter

**Componentes invocados**:
- Obsidian Command Palette
- Command registry
- main.ts: createFleetingNote() handler

**Resultado esperado**: Handler ejecutado, prompt dialog abierto

---

#### **Paso 2: Solicitar Contenido**

**Actor**: createFleetingNote.js

**Acción**: Sistema muestra diálogo modal solicitando:
- "Fleeting Note Content:" (textarea multi-línea)
- Botones: [Create] [Cancel]

**Componentes invocados**:
- Obsidian InputDialog
- Textarea renderer

**Resultado esperado**: Dialog abierto, usuario puede ingresar texto

---

#### **Paso 3: Usuario Ingresa Contenido**

**Actor**: Usuario

**Acción**: Usuario escribe contenido en textarea (1-5000 caracteres típicamente)

**Componentes invocados**:
- Textarea input handler

**Resultado esperado**: Texto visible en textarea, guardado en memoria

---

#### **Paso 4: Validar Contenido**

**Actor**: createFleetingNote.js

**Acción**: Sistema valida:
- Longitud mínima: 1 carácter
- Longitud máxima: 5000 caracteres
- No contiene XSS patterns

**Componentes invocados**:
- validateCommonInput()
- validators helper

**Resultado esperado**:
- Si válido: continuar flujo
- Si inválido: mostrar error, permitir reintentar

---

#### **Paso 5: Generar ID Único**

**Actor**: createFleetingNote.js

**Acción**: Sistema llama generateUniqueId() con prefijo "note"

**Generación**: note-{timestamp}-{randomHex}

**Componentes invocados**:
- generateUniqueId()
- Web Crypto API

**Resultado esperado**: ID único: ej "note-1712817000000-a1b2c3d4"

---

#### **Paso 6: Obtener Metadata**

**Actor**: createFleetingNote.js

**Acción**: Sistema obtiene:
- createdAt: getCurrentDateTime() → ISO 8601
- author: getAuthorName() → desde settings
- fileName: getFileName(noteId) → "note-1712817000000-a1b2c3d4"

**Componentes invocados**:
- getCurrentDateTime()
- getAuthorName()
- getFileName()

**Resultado esperado**: Variables obtenidas:
```
{
  noteId: "note-1712817000000-a1b2c3d4",
  content: "Usuario input",
  createdAt: "2026-04-11T04:30:00.000Z",
  author: "Nestor"
}
```

---

#### **Paso 7: Cargar Template**

**Actor**: Plugin command handler

**Acción**: Sistema carga template: nota-fugaz.md desde templates folder

**Componentes invocados**:
- File system API
- Template loader

**Resultado esperado**: Contenido de template en memoria

---

#### **Paso 8: Sustituir Variables**

**Actor**: Plugin

**Acción**: Sistema reemplaza {{VALUE:*}} placeholders:
- {{VALUE:noteId}} → "note-1712817000000-a1b2c3d4"
- {{VALUE:content}} → Usuario input
- {{VALUE:createdAt}} → "2026-04-11T04:30:00.000Z"
- {{VALUE:author}} → "Nestor"

**Componentes invocados**:
- String replace (regex)

**Resultado esperado**: Template con variables reemplazadas

---

#### **Paso 9: Procesar con Templater**

**Actor**: Templater Plugin (si instalado)

**Acción**: Sistema pasa template procesado a Templater si está disponible:
- Procesa <% %> code blocks
- Evalúa <%= %> expressions
- Genera contenido final

**Componentes invocados**:
- Templater API (si disponible)

**Resultado esperado**: Contenido final completamente procesado

---

#### **Paso 10: Crear Archivo en Vault**

**Actor**: Obsidian Core API

**Acción**: Sistema crea archivo en:
- Path: `100-INBOX/notas-fugaz/{fileName}.md`
- Content: Contenido procesado
- Formato: Markdown

**Componentes invocados**:
- Vault.create() API
- File system

**Resultado esperado**: Archivo creado en vault

---

#### **Paso 11: Abrir en Editor**

**Actor**: Obsidian Core

**Acción**: Sistema abre archivo creado en editor activo

**Componentes invocados**:
- Workspace.openLeaf()
- Editor UI

**Resultado esperado**: Nota visible en editor, usuario puede editar

---

#### **Paso 12: Mostrar Confirmación**

**Actor**: Plugin via notificationAdapter

**Acción**: Sistema muestra notificación de éxito:
- "Fleeting note created: {fileName}"
- Duration: 5 segundos

**Componentes invocados**:
- showNotification()
- Notice API

**Resultado esperado**: Notificación visible

---

## 6. FLUJOS ALTERNATIVOS

### Flujo Alternativo 6A: Usuario Cancela

**Trigger**: Usuario hace click en [Cancel] o presiona Escape

**Acciones**:
1. Dialog se cierra
2. Ningún archivo creado
3. No se muestra confirmación

**Resultado**: Caso de uso cancelado

---

### Flujo Alternativo 6B: Contenido Vacío

**Trigger**: Usuario deja textarea vacío y hace click [Create]

**Acciones**:
1. Sistema detecta validación fallida
2. Mostrar warning: "Note content cannot be empty"
3. Ofrecer reintentar o cancelar

**Resultado**: Si reintentar, volver a Paso 2. Si cancelar, terminar.

---

## 7. EXCEPCIONES

### Excepción EXC-005-001: Folder No Existe

**Condición**: 100-INBOX/notas-fugaz/ no existe

**Manejo**:
1. Sistema intenta crear folder automáticamente
2. Si éxito: continuar con creación de archivo
3. Si falla: mostrar error "Cannot create folder"

**Postcondición en Excepción**: No se crea archivo

---

### Excepción EXC-005-002: Sin Espacio en Disco

**Condición**: Disco lleno

**Manejo**:
1. Detectar durante creación de archivo
2. Mostrar error: "Insufficient disk space"
3. Bloquear creación

**Postcondición en Excepción**: Nota no creada

---

## 8. POSTCONDICIONES

### Postcondiciones Exitosas

1. **Archivo creado**
   - Ubicación: 100-INBOX/notas-fugaz/{fileName}.md
   - Contenido: Template procesado + variables
   - Timestamp: Fecha actual

2. **Nota visible**
   - Abierta en editor
   - Listo para edición

3. **Usuario informado**
   - Notificación de éxito mostrada

### Postcondiciones Anormales

- Si excepciones: No se crea archivo, vault sin cambios

---

## 9. OPERACIONES ATÓMICAS RELACIONADAS

| OP ID | Nombre | UC |
|-------|--------|-----|
| OP-005-001 | Validate content | UC-005 Paso 4 |
| OP-005-002 | Generate fleeting note ID | UC-005 Paso 5 |
| OP-005-003 | Create INBOX file | UC-005 Paso 10 |
| OP-005-004 | Show notification | UC-005 Paso 12 |

---

