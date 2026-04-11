/**
 * UC-056: VAULTWRITER + BUTTON INTEGRATION
 * 
 * Sistema profesional para escribir archivos en el Vault manteniendo estructura,
 * frontmatter y botones integrados.
 * 
 * OBJETIVO: Completar el ciclo lectura-procesamiento-escritura del sistema
 * permitiendo actualizar archivos con cambios de tareas y botones dinámicos.
 * 
 * DEPENDENCIAS:
 * - UC-054: VaultReader (leer archivos)
 * - UC-055: TaskCollector + TemplateEngine (coleccionar y procesar)
 * - UC-040-050: TaskParser + Managers (procesar lógica)
 */

═══════════════════════════════════════════════════════════════════════════════

## 1. DESCRIPCIÓN GENERAL

UC-056 proporciona un sistema robusto para:
1. Escribir archivos en el Vault preservando estructura
2. Gestionar frontmatter YAML correctamente
3. Insertar botones en archivos (markdown links)
4. Validar cambios antes de escribir
5. Mantener backups automáticos

CONTEXTO EN EL FLUJO COMPLETO:

  Obsidian Vault
       ↓
  VaultReader (UC-054) ← Lee archivos
       ↓
  TaskCollector (UC-055) ← Colecciona tasks
       ↓
  TemplateEngine (UC-055) ← Procesa templates
       ↓
  TaskParser (UC-040-050) ← Aplica lógica
       ↓
  VaultWriter (UC-056) ← AQUÍ ESCRIBEMOS ✨
       ↓
  ButtonSystem (UC-057) ← Ejecuta botones
       ↓
  Obsidian Vault actualizado


═══════════════════════════════════════════════════════════════════════════════

## 2. COMPONENTES PRINCIPALES

### 2.1 VAULTWRITER (230 líneas)

**Responsabilidad:** Escribir y actualizar archivos en el Vault

```typescript
class VaultWriter {
  
  // Escribir archivo nuevo
  async writeFile(
    path: string,
    content: string,
    options?: WriteOptions
  ): Promise<WriteResult>
  
  // Actualizar archivo existente
  async updateFile(
    path: string,
    content: string,
    options?: UpdateOptions
  ): Promise<UpdateResult>
  
  // Preservar frontmatter existente y actualizar contenido
  async updateContent(
    path: string,
    newContent: string
  ): Promise<UpdateResult>
  
  // Actualizar solo fields del frontmatter
  async updateFrontmatterField(
    path: string,
    field: string,
    value: any
  ): Promise<UpdateResult>
  
  // Crear backup antes de escribir
  async createBackup(path: string): Promise<string>
  
  // Restaurar desde backup
  async restoreFromBackup(
    path: string,
    backupPath: string
  ): Promise<boolean>
}
```

**Métodos críticos:**
- ✓ Validar path
- ✓ Preservar frontmatter YAML
- ✓ Mantener estructura markdown
- ✓ Manejo de errores
- ✓ Operaciones atómicas


### 2.2 BUTTONWRITER (150 líneas)

**Responsabilidad:** Insertar y gestionar botones en archivos

```typescript
class ButtonWriter {
  
  // Insertar botón en markdown (link)
  async insertButton(
    file: TFile,
    position: number,
    button: ButtonConfig
  ): Promise<boolean>
  
  // Renderizar botón como markdown link
  renderButton(button: ButtonConfig): string
  // Resultado: [✅ Completar](button://complete?uid=task-123)
  
  // Parsear configuración de botón
  parseButtonConfig(config: string): ButtonConfig
  
  // Validar configuración
  validateButton(button: ButtonConfig): ValidationResult
  
  // Remover botón de archivo
  async removeButton(
    file: TFile,
    buttonId: string
  ): Promise<boolean>
  
  // Actualizar parámetros de botón
  async updateButtonParams(
    file: TFile,
    buttonId: string,
    newParams: Record<string, string>
  ): Promise<boolean>
}
```

**Botones soportados:**

```
[✏️ Editar](button://edit?uid={{UID}})
[✅ Completar](button://complete?uid={{UID}}&date={{currentDate}})
[📌 Prioridad](button://priority?uid={{UID}}&value=ALTA)
[🗑️ Eliminar](button://delete?uid={{UID}})
[🔗 Ver Proyecto](button://open?link=[[{{projectRef}}]])
[📊 Estadísticas](button://stats?uid={{UID}})
[🔄 Refrescar](button://refresh)
[🏠 Home](button://home)
```


### 2.3 FRONTMATTERMANAGER (120 líneas)

**Responsabilidad:** Gestionar frontmatter YAML

```typescript
class FrontmatterManager {
  
  // Parsear frontmatter YAML
  parseFrontmatter(content: string): {
    frontmatter: Record<string, any>,
    body: string
  }
  
  // Actualizar campo específico
  updateField(
    frontmatter: Record<string, any>,
    field: string,
    value: any
  ): Record<string, any>
  
  // Validar schema del frontmatter
  validateSchema(
    frontmatter: Record<string, any>,
    schema: Schema
  ): ValidationResult
  
  // Mergear dos frontmatters
  mergeFrontmatter(
    existing: Record<string, any>,
    updates: Record<string, any>
  ): Record<string, any>
  
  // Serializar a YAML
  serializeToYAML(frontmatter: Record<string, any>): string
}
```

**Schema validado:**

```yaml
UID: string (requerido)
type: string (requerido)
status: enum[TODO|IN_PROGRESS|DONE|CANCELLED]
priority: enum[ALTA|MEDIA|BAJA]
date: string (YYYY-MM-DD)
tags: array[string]
aliases: array[string]
```


### 2.4 FILEFORMATTER (80 líneas)

**Responsabilidad:** Formatear archivo markdown

```typescript
class FileFormatter {
  
  // Normalizar formato markdown
  formatMarkdown(content: string): string
  
  // Preservar estructura (headings, lists, etc)
  preserveStructure(content: string): string
  
  // Indentar correctamente
  indentProperly(content: string): string
  
  // Normalizar whitespace
  normalizeWhitespace(content: string): string
  
  // Validar estructura markdown
  validateStructure(content: string): ValidationResult
}
```


═══════════════════════════════════════════════════════════════════════════════

## 3. TIPOS E INTERFACES

```typescript
interface WriteOptions {
  backup?: boolean;           // Crear backup antes de escribir (default: true)
  overwrite?: boolean;        // Sobrescribir si existe (default: false)
  createIfNotExists?: boolean; // Crear si no existe (default: true)
  validateBefore?: boolean;   // Validar antes de escribir (default: true)
}

interface UpdateOptions {
  preserveFrontmatter?: boolean; // Mantener frontmatter existente (default: true)
  mergeFields?: boolean;        // Mergear fields nuevos (default: false)
  backup?: boolean;             // Crear backup (default: true)
}

interface WriteResult {
  success: boolean;
  path: string;
  backupPath?: string;
  error?: string;
}

interface ButtonConfig {
  name: string;
  action: string;
  uid?: string;
  type?: string;
  params?: Record<string, string>;
  icon?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

interface Schema {
  fields: Record<string, FieldSchema>;
  required?: string[];
}

interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'enum';
  enum?: string[];
  required?: boolean;
  default?: any;
}
```


═══════════════════════════════════════════════════════════════════════════════

## 4. BOTONES INTEGRADOS (PRIORITARIOS)

### 4.1 BOTONES CRÍTICOS (Prioridad 1)

**Create Task**
```
[➕ Nueva Tarea](button://create?type=task)
```
- Acción: Crear nueva tarea en carpeta actual
- Parámetros: type=task

**Complete Task**
```
[✅ Completar](button://complete?uid={{UID}}&date={{currentDate}})
```
- Acción: Marcar como DONE
- Parámetros: uid (requerido), date

**Edit Task**
```
[✏️ Editar](button://edit?uid={{UID}})
```
- Acción: Abrir editor de la tarea
- Parámetros: uid (requerido)

**Delete Task**
```
[🗑️ Eliminar](button://delete?uid={{UID}})
```
- Acción: Eliminar la tarea
- Parámetros: uid (requerido)


### 4.2 BOTONES IMPORTANTES (Prioridad 2)

**Change Priority**
```
[📌 Prioridad](button://priority?uid={{UID}}&value=ALTA)
```
- Parámetros: uid, value (ALTA|MEDIA|BAJA)

**Set Due Date**
```
[📅 Vence](button://due?uid={{UID}}&date=2026-04-15)
```
- Parámetros: uid, date (YYYY-MM-DD)

**Go to Project**
```
[🎯 Proyecto](button://open?link=[[{{projectRef}}]])
```
- Parámetros: link (wikilink)

**Refresh/Sync**
```
[🔄 Refrescar](button://refresh)
```
- Sin parámetros


### 4.3 BOTONES DE NAVEGACIÓN (Prioridad 3)

**Home**
```
[🏠 Home](button://home)
```

**Save Stats**
```
[📊 Estadísticas](button://stats)
```

**Archive**
```
[📦 Archivar](button://archive?uid={{UID}})
```


═══════════════════════════════════════════════════════════════════════════════

## 5. CASOS DE USO PRINCIPALES

### 5.1 Crear tarea nueva con botones

```
ENTRADA:
  content = template-task.md procesado
  buttons = [Complete, Edit, Delete, Priority, Due]

PROCESO:
  1. VaultWriter.writeFile("tasks/tarea-123.md", content)
  2. ButtonWriter.insertButton(file, 0, completeButton)
  3. ButtonWriter.insertButton(file, 1, editButton)
  4. ButtonWriter.insertButton(file, 2, deleteButton)
  5. FrontmatterManager.validateSchema(fm, taskSchema)

SALIDA:
  ✅ Archivo escrito con botones integrados
```


### 5.2 Actualizar status de tarea

```
ENTRADA:
  path = "tasks/tarea-123.md"
  updates = { status: "DONE", dateCompleted: "2026-04-11" }

PROCESO:
  1. VaultWriter.updateFrontmatterField(path, "status", "DONE")
  2. VaultWriter.updateFrontmatterField(path, "dateCompleted", "2026-04-11")
  3. ButtonWriter.updateButtonParams("complete", { status: "DONE" })
  4. FrontmatterManager.validateSchema(updatedFm, taskSchema)

SALIDA:
  ✅ Archivo actualizado con cambios de estado
```


### 5.3 Actualizar contenido manteniendo frontmatter

```
ENTRADA:
  path = "tasks/tarea-123.md"
  newContent = "# Nueva descripción\n\nContenido actualizado"

PROCESO:
  1. content = app.vault.read(path)
  2. { frontmatter, body } = FrontmatterManager.parse(content)
  3. updatedContent = formatFrontmatter(fm) + newContent
  4. VaultWriter.updateContent(path, updatedContent)

SALIDA:
  ✅ Contenido actualizado, frontmatter preservado
```


═══════════════════════════════════════════════════════════════════════════════

## 6. VALIDACIONES

### 6.1 Validaciones de archivo

✓ Path válido
✓ Permisos de escritura
✓ Estructura markdown válida
✓ Frontmatter YAML válido
✓ Codificación UTF-8

### 6.2 Validaciones de botones

✓ Parámetros requeridos presentes
✓ Valores dentro de enumeración
✓ UIDs válidos
✓ Links válidos (wikilinks)
✓ Sintaxis correcta

### 6.3 Validaciones de frontmatter

✓ Schema completo
✓ Campos requeridos
✓ Tipos de datos correctos
✓ Enumeraciones válidas
✓ Relaciones entre campos


═══════════════════════════════════════════════════════════════════════════════

## 7. MANEJO DE ERRORES

```typescript
ErrorCases:

WriteError
  - Path inválido
  - Permiso denegado
  - Espacio insuficiente
  - Contenido corrompido

UpdateError
  - Archivo no existe
  - Frontmatter inválido
  - Cambios en conflicto
  - Validación fallida

ButtonError
  - Parámetros inválidos
  - Botón duplicado
  - Sintaxis incorrecta
  - Acción no soportada

FrontmatterError
  - YAML inválido
  - Schema no cumple
  - Tipos incorrectos
  - Campos requeridos faltantes
```


═══════════════════════════════════════════════════════════════════════════════

## 8. TESTS ESPECIFICADOS

### 8.1 VaultWriter Tests (20 tests)

✓ Escribir archivo nuevo
✓ Actualizar archivo existente
✓ Preservar frontmatter en update
✓ Actualizar campo específico
✓ Crear backup automático
✓ Restaurar desde backup
✓ Validar path
✓ Manejo de errores
✓ Operación atómica
✓ Actualizar contenido sin cambiar FM
✓ Mergear frontmatter fields
✓ Normalizar archivo
✓ Validar antes de escribir
✓ Crear carpeta si no existe
✓ Sobrescribir existente
+ 5 más (manejo de casos edge)

### 8.2 ButtonWriter Tests (15 tests)

✓ Insertar botón markdown
✓ Renderizar botón
✓ Parsear configuración
✓ Validar configuración
✓ Remover botón
✓ Actualizar parámetros
✓ Insertar múltiples botones
✓ Evitar botones duplicados
✓ Validar parámetros requeridos
✓ Validar enumeraciones
+ 5 más

### 8.3 FrontmatterManager Tests (10 tests)

✓ Parsear YAML
✓ Actualizar field
✓ Validar schema
✓ Mergear frontmatters
✓ Serializar a YAML
✓ Parsear dates
✓ Parsear arrays
✓ Validar tipos
✓ Generar YAML válido
✓ Manejar valores especiales


═══════════════════════════════════════════════════════════════════════════════

## 9. TIMELINE

**Hora 1-2: TDD RED (Tests)**
  - 45+ tests especificando todo
  - COMMIT RED

**Hora 3-8: TDD GREEN (Implementación)**
  - VaultWriter (3h)
  - ButtonWriter (2h)
  - FrontmatterManager (1.5h)
  - COMMIT GREEN

**Hora 9-10: REFINEMENT**
  - Validaciones completas
  - Error handling
  - 100% tests pasando
  - COMMIT FINAL


═══════════════════════════════════════════════════════════════════════════════

## 10. ESTADO FINAL ESPERADO

Después de UC-056:

✅ 11 UCS COMPLETADOS
✅ 689+ TESTS PASANDO
✅ 10.700+ LÍNEAS CÓDIGO
✅ 95% FUNCIONALIDAD
✅ SISTEMA COMPLETO LECTURA-PROCESAMIENTO-ESCRITURA
✅ BOTONES INTEGRADOS Y FUNCIONALES

SISTEMA OPERACIONAL EN OBSIDIAN SIN DEPENDENCIAS EXTERNAS


═══════════════════════════════════════════════════════════════════════════════

FIN DE ESPECIFICACIÓN UC-056

Autor: Nestor + Claude
Fecha: 2026-04-11
Estado: ESPECIFICACIÓN COMPLETA - LISTO PARA TDD RED

═══════════════════════════════════════════════════════════════════════════════
