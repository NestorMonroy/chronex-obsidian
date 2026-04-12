# Button System - Sistema de Botones Interactivos

## Descripción General

El **Button System** es el método PRIMARY para interactuar con el plugin Chronex Obsidian. Los botones son enlaces Markdown que usan el esquema URI `button://` para disparar acciones del plugin directamente desde las notas.

**NO dependen de scripts externos en el vault** - todas las acciones están codificadas en TypeScript dentro del plugin.

## Arquitectura

```
Nota Markdown (button:// URI)
        ↓
 ButtonHandler (parser)
        ↓
 ActionHandler (ejecuta acción)
        ↓
 Servicios internos (ProjectService, TaskService, etc.)
```

### Componentes Clave

1. **buttonHandler.ts** - Procesa `button://` URIs y delega a ActionHandler
2. **actionHandler.ts** - Sistema central que ejecuta todas las acciones
3. **Servicios especializados** - ProjectServiceWithVault, TaskServiceWithVault, etc.

## Sintaxis button://

### Formato General

```
button://[accion]?param1=valor1&param2=valor2&...
```

### Ejemplos de Uso

#### 1. Crear una Tarea

```markdown
[📝 Crear Tarea](button://create?type=task&name=Mi%20Tarea&priority=ALTA&dueDate=2026-04-20)
```

**Parámetros:**
- `type`: `task` (requerido)
- `name`: Nombre de la tarea (requerido)
- `priority`: `BAJA` | `MEDIA` | `ALTA` | `CRÍTICA` (opcional)
- `dueDate`: Fecha en formato YYYY-MM-DD (opcional)
- `description`: Descripción de la tarea (opcional)

#### 2. Crear un Proyecto

```markdown
[🚀 Crear Proyecto](button://create?type=project&name=Mi%20Proyecto&priority=ALTA)
```

**Parámetros:**
- `type`: `project` (requerido)
- `name`: Nombre del proyecto (requerido)
- `priority`: `BAJA` | `MEDIA` | `ALTA` | `CRÍTICA` (opcional)
- `description`: Descripción (opcional)

#### 3. Crear un Objetivo

```markdown
[🎯 Crear Objetivo](button://create?type=objective&name=Mi%20Objetivo&priority=MEDIA)
```

**Parámetros:**
- `type`: `objective` (requerido)
- `name`: Nombre del objetivo (requerido)
- `priority`: Prioridad (opcional)
- `description`: Descripción (opcional)

#### 4. Crear un Documento

```markdown
[📄 Crear Documento](button://create?type=document&name=Mi%20Documento)
```

**Parámetros:**
- `type`: `document` (requerido)
- `name`: Nombre del documento (requerido)
- `description`: Descripción (opcional)

#### 5. Marcar una Tarea como Completada

```markdown
[✅ Completar](button://complete?uid=TSK-202604-ABC123)
```

**Parámetros:**
- `uid`: UID de la tarea (requerido)

#### 6. Editar una Entidad

```markdown
[✏️ Editar](button://edit?uid=PROJ-202604-ABC&priority=MEDIA&status=en-progreso)
```

**Parámetros:**
- `uid`: UID de la entidad (requerido)
- Cualquier campo adicional se trata como update

#### 7. Archivar una Entidad

```markdown
[📦 Archivar](button://archive?uid=OBJ-202604-ABC)
```

**Parámetros:**
- `uid`: UID de la entidad a archivar (requerido)

#### 8. Eliminar una Entidad

```markdown
[🗑️ Eliminar](button://delete?uid=DOC-202604-ABC&permanent=true)
```

**Parámetros:**
- `uid`: UID de la entidad (requerido)
- `permanent`: `true` | `false` (opcional, default: false)

#### 9. Cambiar Estado

```markdown
[⚙️ En Progreso](button://status?uid=TSK-202604-ABC&value=en-progreso)
```

**Parámetros:**
- `uid`: UID de la entidad (requerido)
- `value`: Nuevo estado (requerido)

#### 10. Cambiar Prioridad

```markdown
[📌 Prioridad Alta](button://priority?uid=PROJ-202604-ABC&value=ALTA)
```

**Parámetros:**
- `uid`: UID de la entidad (requerido)
- `value`: Nueva prioridad (requerido)

## Acciones Soportadas

| Acción | Descripción | Parámetros |
|--------|-------------|-----------|
| `create` | Crear nueva entidad | `type`, `name`, `priority`, `description`, etc. |
| `edit` | Editar entidad existente | `uid`, `[campos a actualizar]` |
| `complete` | Marcar tarea completada | `uid` |
| `delete` | Eliminar entidad | `uid`, `permanent` |
| `archive` | Archivar entidad | `uid` |
| `status` | Cambiar estado | `uid`, `value` |
| `priority` | Cambiar prioridad | `uid`, `value` |

## Implementación Interna

### ActionHandler.ts

Es el **núcleo del sistema**. Centraliza todas las operaciones:

```typescript
class ActionHandler {
  async create(params: CreateActionParams): Promise<ActionResult>
  async edit(params: EditActionParams): Promise<ActionResult>
  async delete(params: DeleteActionParams): Promise<ActionResult>
  async complete(params: CompleteActionParams): Promise<ActionResult>
  async archive(params: ArchiveActionParams): Promise<ActionResult>
}
```

### ButtonHandler.ts

Procesa `button://` URIs y delega:

```typescript
function parseButtonUri(uri: string): ButtonAction | null
async function handleButtonClick(action: ButtonAction): Promise<void>
function registerButtonHandler(app: App): void
```

## Flujo de Ejecución

1. **Usuario hace click** en un button:// link
2. **ButtonHandler** intercepta el click
3. **parseButtonUri** extrae acción y parámetros
4. **handleButtonClick** delega a ActionHandler
5. **ActionHandler** ejecuta la acción específica
6. **Servicio correspondiente** (Project, Task, etc.) realiza la operación
7. **Resultado** se muestra como notificación

## Ventajas vs. Command Palette

| Aspecto | Command Palette | Button System |
|--------|-----------------|---------------|
| **Discoverabilidad** | Requiere memorizar keybindings | Visible en la nota |
| **Contexto** | Parámetros genéricos | Parámetros específicos al contexto |
| **Accesibilidad** | Solo teclado | Click fácil |
| **UX** | Modal de búsqueda | Inline en la nota |
| **Personalización** | Limitada | Total via parámetros |

## Mejores Prácticas

### 1. Usar URLs Codificadas

Los espacios deben ser codificados como `%20`:

```markdown
# CORRECTO ✅
[Crear](button://create?type=task&name=Mi%20Tarea)

# INCORRECTO ❌
[Crear](button://create?type=task&name=Mi Tarea)
```

### 2. Usar Emojis en Labels

Hace más visibles los botones:

```markdown
[🚀 Crear Proyecto](button://...)
[✅ Completar](button://...)
[🗑️ Eliminar](button://...)
```

### 3. Agrupar Botones Relacionados

```markdown
## Acciones Rápidas

[📝 Nueva Tarea](button://create?type=task)
[✅ Completar](button://complete?uid=...)
[📌 Cambiar Prioridad](button://priority?uid=...)
```

### 4. Proporcionar Contexto

Incluir información útil antes del botón:

```markdown
### Tarea: "Refactorizar código"

**UID:** TSK-202604-ABC  
**Estado:** En Progreso  
**Prioridad:** ALTA

[✅ Marcar como Completado](button://complete?uid=TSK-202604-ABC)
```

## Casos de Uso

### Template: Dashboard de Proyecto

```markdown
# Proyecto: Mi Proyecto

**UID:** PROJ-202604-ABC  
**Estado:** En Progreso

## Acciones Rápidas

- [📝 Nueva Tarea](button://create?type=task&parentId=PROJ-202604-ABC)
- [📌 Cambiar Prioridad](button://priority?uid=PROJ-202604-ABC&value=ALTA)
- [📦 Archivar](button://archive?uid=PROJ-202604-ABC)

## Tareas

| Tarea | Estado | Acción |
|-------|--------|--------|
| Tarea 1 | Pendiente | [✅ Completar](button://complete?uid=TSK-1) |
| Tarea 2 | En Progreso | [📌 ALTA](button://priority?uid=TSK-2&value=ALTA) |
```

## Integración con Otros Sistemas

### QuickAdd

El ActionHandler puede ser usado internamente por QuickAdd macros:

```typescript
// Macro de QuickAdd puede llamar ActionHandler
const handler = getActionHandler();
await handler.create({ type: 'task', name: prompt() });
```

### Templater

Los templates pueden generar botones automáticamente:

```markdown
<% 
  tp.user.createButton = (action, params) => {
    const query = new URLSearchParams(params).toString();
    return `button://${action}?${query}`;
  }
%>

[Crear Tarea](<%tp.user.createButton('create', {type: 'task'})%>)
```

## Seguridad

### Validación

Todos los parámetros se validan en ActionHandler:
- UIDs se verifican que existan
- Tipos se validan contra lista de tipos válidos
- Valores de prioridad/estado se verifican

### Sanitización

Las URIs se decodifican y sanitizan antes de procesar.

## Troubleshooting

### El botón no funciona

1. **Verificar sintaxis** - ¿Es `button://`?
2. **Verificar parámetros** - ¿Están codificados en URL?
3. **Verificar UID** - ¿Existe la entidad?
4. **Ver console** - Buscar errores en F12

### Botón aparece roto

1. **Verificar encoding** - Espacios deben ser `%20`
2. **Verificar caracteres especiales** - Usar `encodeURIComponent()`

## Roadmap

- [ ] Sistema de confirmación para acciones destructivas
- [ ] Atajos de teclado para botones (Alt+1, Alt+2, etc.)
- [ ] Botones con select dropdown para elegir valores
- [ ] Integración con comandos de Obsidian
- [ ] Histórico de acciones ejecutadas
