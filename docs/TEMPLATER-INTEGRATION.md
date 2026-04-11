# Integración Templater - obsidian-repo

## Descripción General

La integración con **Templater** permite generar automáticamente notas con contenido dinámico
basado en templates reutilizables.

## Templates Disponibles

```
docs/templates/
├─ project-template.md      # Template para Proyectos (UC-008)
├─ objective-template.md    # Template para Objetivos (UC-010)
├─ task-template.md         # Template para Tareas (UC-012)
└─ document-template.md     # Template para Documentos (UC-013)
```

## Estructura de Template

### Sintaxis Templater

```markdown
---
uid: <% tp.frontmatter.uid %>
type: <% tp.frontmatter.type %>
title: <% tp.frontmatter.title %>
priority: <% tp.frontmatter.priority %>
dateCreated: <% tp.frontmatter.dateCreated %>
---

# <% tp.frontmatter.title %>

Contenido con variables dinámicas...
```

### Variables de Frontmatter

#### Proyecto (UC-008)
```yaml
uid: PROJ-202604-ABC12           # ID único
type: proyecto                   # Tipo de entidad
title: Nombre del Proyecto       # Nombre
description: Descripción         # (opcional)
priority: ALTA|MEDIA|BAJA|CRÍTICA # Prioridad
dateCreated: 2026-04-11          # Fecha creación (YYYY-MM-DD)
status: activo                   # Estado
```

#### Objetivo (UC-010)
```yaml
uid: OBJ-202604-ABC12
type: objetivo
title: Nombre del Objetivo
description: Descripción
priority: ALTA|MEDIA|BAJA|CRÍTICA
dateCreated: 2026-04-11
status: activo
```

#### Tarea (UC-012)
```yaml
uid: TSK-202604-ABC12
type: tarea
title: Nombre de la Tarea
description: Descripción
priority: ALTA|MEDIA|BAJA|CRÍTICA
dueDate: 2026-05-15              # Fecha vencimiento (YYYY-MM-DD)
dateCreated: 2026-04-11
status: pendiente|completa|archivado
```

#### Documento (UC-013)
```yaml
uid: DOC-202604-ABC12
type: documento
title: Nombre del Documento
description: Descripción
dateCreated: 2026-04-11
status: activo|archivado
```

## Flujo de Integración

### 1. Creación de Proyecto

```typescript
// UC-008: Create Project
const result = await ProjectService.createProject({
  projectName: 'Mi Proyecto 2026',
  description: 'Descripción completa',
  priority: 'ALTA'
});

// Internamente:
// 1. Genera ID: PROJ-202604-ABC12
// 2. Obtiene template: docs/templates/project-template.md
// 3. Procesa variables de frontmatter
// 4. Crea: 200-PROYECTOS/PROJ-202604-ABC12/README.md
// 5. Nota generada con contenido dinámico
```

### 2. Procesamiento de Template

```typescript
const templateData = {
  uid: 'PROJ-202604-ABC12',
  type: 'proyecto',
  title: 'Mi Proyecto 2026',
  description: 'Descripción completa',
  priority: 'ALTA',
  dateCreated: '2026-04-11'
};

// TemplaterIntegration procesa:
const result = await TemplaterIntegration.processTemplate(
  'project-template',
  templateData
);
// → Reemplaza {{uid}}, {{title}}, etc. en el template
// → Genera contenido final con variables sustituidas
```

## Ejemplo de Nota Generada

### Entrada
```typescript
await ProjectService.createProject({
  projectName: 'Sistema de Gestión',
  description: 'Sistema integral para organizar proyectos',
  priority: 'ALTA'
});
```

### Nota Generada (README.md)
```markdown
---
uid: PROJ-202604-ABC12
type: proyecto
title: Sistema de Gestión
description: Sistema integral para organizar proyectos
priority: ALTA
dateCreated: 2026-04-11
status: activo
---

# Sistema de Gestión

## Descripción
Sistema integral para organizar proyectos

## Detalles
- **UID**: PROJ-202604-ABC12
- **Prioridad**: ALTA
- **Creado**: 2026-04-11
- **Estado**: Activo

## Estructura
- Objetivos
- Documentos
- Recursos

## Notas
Proyecto creado automáticamente con sistema obsidian-repo.
```

## Uso en Servicios

### createProject.ts
```typescript
private static async createProjectNote(
  projectId: string,
  input: CreateProjectInput
): Promise<string> {
  const templateData = {
    uid: projectId,
    type: 'proyecto',
    title: input.projectName,
    description: input.description || '',
    priority: input.priority || 'MEDIA',
    dateCreated: new Date().toISOString().split('T')[0]
  };

  // Usar TemplaterIntegration para procesar
  const result = await TemplaterIntegration.processTemplate(
    'project-template',
    templateData
  );

  return `200-PROYECTOS/${projectId}/README.md`;
}
```

## Validación de Template

Antes de usar un template, validar syntax:

```typescript
const syntax = await TemplaterIntegration.validateTemplateSyntax(
  templateContent
);

if (!syntax.valid) {
  console.error('Errors:', syntax.errors);
  console.log('Variables found:', syntax.variables);
}
```

## Mejores Prácticas

1. **Mantener templates en docs/templates/** - Facilita reutilización
2. **Usar variables de frontmatter consistentes** - Entre todos los templates
3. **Validar syntax antes de usar** - Evitar errores en tiempo de creación
4. **Documentar variables en cada template** - Facilita mantenimiento
5. **Registrar templates en TemplaterIntegration** - Para acceso centralizado

## Próximos Pasos

- [ ] Crear templates para búsqueda y reportes
- [ ] Agregar templates para importar/exportar
- [ ] Implementar templates condicionales ({% if %})
- [ ] Crear templates para diferentes lenguajes
- [ ] Template versioning y migración

