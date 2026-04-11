# Folder About Notes (_about_) - Documentación Completa

## 🎯 Descripción General

**Folder About** es un sistema **100% PROPIO** (no depende de Folder Note) que crea automáticamente notas de descripción dentro de cada carpeta.

Cada carpeta de proyecto, objetivo, tarea o documento tiene una nota **`_about_.md`** que:
- Describe el contenido de la carpeta
- Organiza metadatos
- Actúa como punto de entrada visual
- Se actualiza automáticamente

**Inspirado en Folder Note, pero completamente independiente.**

---

## 🏗️ Arquitectura

```
chronex-obsidian/
├─ src/
│  ├─ services/
│  │  └─ folderAboutService.ts      ← Lógica PROPIA (no dependencia)
│  ├─ views/
│  │  └─ folderAbout.css            ← Estilos PROPIOS
│  └─ settings/
│     └─ folderAboutSettings.ts     ← Configuración
└─ docs/
   └─ FOLDER-ABOUT.md              ← Esta guía
```

### FolderAboutService (La lógica)

**Ubicación**: `src/services/folderAboutService.ts`

**Responsabilidades**:
- ✅ Crear _about_ notes automáticamente
- ✅ Actualizar contenido de _about_
- ✅ Leer _about_ notas
- ✅ Eliminar _about_ notas
- ✅ Verificar existencia de _about_

**NO depende de Folder Note** - Implementación 100% propia.

---

## 📁 Estructura de Carpetas con _about_

```
200-PROYECTOS/
├─ PROJ-202604-ABC12/
│  ├─ _about_.md ✨ (Carpeta descripta)
│  ├─ README.md (Detalles técnicos)
│  ├─ objetivos/
│  │  ├─ _about_.md ✨ (Subcarpeta descripta)
│  │  ├─ OBJ-202604-XYZ/
│  │  │  ├─ _about_.md ✨
│  │  │  └─ README.md
│  │  └─ ...
│  ├─ documentos/
│  │  ├─ _about_.md ✨
│  │  └─ ...
│  └─ recursos/
│     ├─ _about_.md ✨
│     └─ ...
```

**La diferencia**: Cada carpeta tiene DOBLE documentación:
- **README.md** = Detalles técnicos y frontmatter YAML
- **_about_.md** = Descripción visual con card views

---

## 🎨 Contenido de una _about_ Note

```yaml
---
type: proyecto
title: Mi Proyecto 2026
description: Descripción del proyecto
parent: ''
dateCreated: 2026-04-11
status: activo
cssclass: folder-about gridlist noyaml wide-page
obsidianUIMode: preview
---

📁 # Mi Proyecto 2026

## Descripción
Descripción completa del proyecto

## Información
- **Tipo**: proyecto
- **Estado**: activo
- **Creado**: 2026-04-11

## Contenido
<!-- Listado automático de archivos -->
```

---

## 🔄 Flujo de Creación Automática

Cuando creas una ENTIDAD (Proyecto, Objetivo, Tarea, Documento):

```
1. Usuario: Cmd+Shift+P → "Create new project"
   ↓
2. Validación y generación de ID
   ↓
3. Crear carpeta base (200-PROYECTOS/PROJ-ID/)
   ↓
4. Crear README.md (con frontmatter)
   ↓
5. Crear _about_.md (FolderAboutService) ← AQUÍ
   ↓
6. Crear subcarpetas (objetivos, documentos, recursos)
   ↓
7. Crear _about_ para CADA subcarpeta ← AQUÍ
   ↓
8. Notificar usuario
```

---

## 💻 Implementación en Servicios

### ProjectServiceWithVault

```typescript
// Crear _about_ para proyecto
await FolderAboutService.createAboutNote(folderPath, {
  type: 'proyecto',
  title: input.projectName,
  description: input.description,
  dateCreated,
  status: 'activo',
  icon: '📁'
});

// Crear _about_ para subcarpetas
const subfolders = ['objetivos', 'documentos', 'recursos'];
for (const subfolder of subfolders) {
  await FolderAboutService.createAboutNote(
    `${folderPath}/${subfolder}`,
    {
      type: 'carpeta',
      title: subfolder.toUpperCase(),
      description: `Carpeta para ${subfolder}`,
      parentId: projectId,
      dateCreated,
      status: 'activo',
      icon: '📂'
    }
  );
}
```

### ObjectiveServiceWithVault, TaskServiceWithVault, etc.

Todos los servicios WithVault siguen el mismo patrón.

---

## 🎨 Estilos CSS

**Ubicación**: `src/views/folderAbout.css`

Ofrece DOS estilos de visualización:

### 1. Cute Card Band (3 Columnas Responsive)

```css
.folder-about.cute-card-band {
  /* 1 columna en móvil */
  /* 2 columnas en tablet */
  /* 3 columnas en desktop */
}

.folder-about.cute-card-view {
  /* Tarjeta con thumb + contenido */
  /* Efecto hover: -2px, sombra aumentada */
}

.folder-about .thumb-color-proyecto {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.folder-about .thumb-color-objetivo {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
```

### 2. Strip Card View (Horizontal)

```css
.folder-about.strip-card-view {
  /* Thumbnail (120px) + Contenido a la derecha */
  /* Mejor para listas largas */
}
```

### Colores por Tipo

```
Proyecto:  Gradiente morado → púrpura
Objetivo:  Gradiente rosa → rojo
Tarea:     Gradiente azul → cian
Documento: Gradiente verde → turquesa
Carpeta:   Gradiente rosa → amarillo
```

---

## ⚙️ Configuración en Settings

En Obsidian Settings → "chronex-obsidian":

### Folder About Notes (_about_)

- **Auto-generate _about_ notes** ✅
  - Crear _about_.md automáticamente para cada carpeta

- **Hide _about_ files in sidebar** (opcional)
  - Esconder _about_ del árbol de archivos

- **Card view type** (cute | strip)
  - cute: 3 columnas responsive
  - strip: Horizontal, mejor para listas

- **Auto-update _about_ content** ✅
  - Actualizar _about_ al editar metadatos

---

## 🔧 API de FolderAboutService

### Métodos principales

```typescript
// Crear _about_ note
await FolderAboutService.createAboutNote(folderPath, data);

// Actualizar _about_ existente
await FolderAboutService.updateAboutNote(folderPath, data);

// Leer _about_ note
const content = await FolderAboutService.readAboutNote(folderPath);

// Eliminar _about_ note
await FolderAboutService.deleteAboutNote(folderPath);

// Verificar si existe _about_
const exists = await FolderAboutService.hasFolderAbout(folderPath);

// Obtener configuración por defecto
const config = FolderAboutService.getDefaultConfig();
```

### Interfaces

```typescript
interface FolderAboutData {
  type: string;          // 'proyecto', 'objetivo', 'tarea', 'documento', 'carpeta'
  title: string;         // Nombre de la entidad
  description?: string;  // Descripción
  parentId?: string;     // ID del padre
  dateCreated: string;   // YYYY-MM-DD
  status: string;        // 'activo', 'archivado', etc
  icon?: string;         // Emoji (📁, 🎯, ✅, 📄, 📂)
}

interface FolderAboutConfig {
  folderAboutHide: boolean;
  folderAboutName: string;           // "_about_"
  folderAboutAutoGenerate: boolean;
  folderAboutTemplate: string;
}
```

---

## 🔗 Integración con Otras Características

### Con Edit Service (UC-019)

Cuando editas metadatos de una entidad:
```typescript
// EditServiceWithVault
await FolderAboutService.updateAboutNote(folderPath, {
  title: newTitle,
  description: newDescription,
  status: newStatus
});
```

### Con Delete Service (UC-020)

Cuando eliminas una entidad:
```typescript
// DeleteServiceWithVault
await FolderAboutService.deleteAboutNote(folderPath);
```

### Con Views (Dashboard, Calendar, Kanban)

Las vistas pueden acceder a _about_ notes para mostrar descripciones.

---

## 📊 Ejemplos de _about_ Notes Reales

### Ejemplo 1: Proyecto

```markdown
---
type: proyecto
title: Sistema 2026
description: Sistema integral de gestión de proyectos
dateCreated: 2026-04-11
status: activo
---

📁 # Sistema 2026

## Descripción
Sistema integral de gestión de proyectos, objetivos y tareas para 2026.

## Información
- **Tipo**: proyecto
- **Estado**: activo
- **Creado**: 2026-04-11

## Contenido
- 3 Objetivos principales
- 12 Tareas asignadas
- 5 Documentos de referencia
```

### Ejemplo 2: Carpeta de Objetivos

```markdown
---
type: carpeta
title: Objetivos
parent: PROJ-202604-ABC
---

📂 # Objetivos

Carpeta para almacenar todos los objetivos del proyecto.
```

---

## 🚀 Ventajas vs Folder Note

| Característica | Folder About | Folder Note |
|---|---|---|
| Dependencia | ❌ Ninguna | ✅ Plugin requerido |
| Configuración | ✅ Integrada en settings | Manual |
| Auto-creación | ✅ Automática en todos los UC | Manual |
| Card views | ✅ Incluidos (CSS propio) | ✅ Incluidos |
| Estilos | ✅ Personalizados | ✅ Genéricos |
| Mantenimiento | ✅ Nuestro código | ❌ Dependencia externa |

---

## 📝 Próximas Mejoras

- [ ] Dataviewjs en _about_ para listas dinámicas
- [ ] Sincronización bi-direccional con README.md
- [ ] Temas personalizables
- [ ] Exportar _about_ a PDF
- [ ] Incluir estadísticas en _about_

---

## 🔒 Independencia Total

**Lo más importante**: 

✅ **FolderAboutService** NO depende de Folder Note
✅ **Usa el mismo nombre** "_about_" para compatibilidad
✅ **Implementación propia** 100% controlada
✅ **Integración nativa** con Obsidian API
✅ **Sin conflictos** si Folder Note está instalado

---

## 📚 Archivos Relacionados

- `src/services/folderAboutService.ts` - Lógica principal
- `src/views/folderAbout.css` - Estilos
- `src/settings/folderAboutSettings.ts` - Configuración
- `src/main.ts` - Integración en plugin principal
- Todos los `*ServiceWithVault.ts` - Usan FolderAboutService

