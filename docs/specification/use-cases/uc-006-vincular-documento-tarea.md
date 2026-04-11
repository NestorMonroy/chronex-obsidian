```yaml
type: Caso de Uso Formal
title: UC-006 - VINCULAR DOCUMENTO A TAREA
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Vinculación
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
tier: IMPORTANTE v1.1
```

# UC-006: VINCULAR DOCUMENTO A TAREA

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-006 |
| **Nombre** | Vincular Documento a Tarea |
| **Versión** | 1.0.0 |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | BAJA |
| **Dependencias** | UC-004 (usar mismo patrón) |

---

## 2. DESCRIPCIÓN BREVE

Extensión de UC-004. Usuario abre documento clasificado y busca vincular a una tarea específica. Sistema permite seleccionar proyecto > objetivo > tarea, valida relación, actualiza frontmatter del documento agregando `tarea_padre` y `proyecto_padre`, actualiza array de tarea con referencia a documento. Documento queda asociado a la tarea.

---

## 3. FLUJO PRINCIPAL

### Entrada
- Usuario abre documento.md
- Invoca "Vincular a Tarea"

### Proceso
1. Modal 1: Seleccionar Proyecto (de 200-PROYECTOS/)
2. Modal 2: Seleccionar Objetivo dentro del proyecto
3. Modal 3: Seleccionar Tarea dentro del objetivo
4. Validar que tarea existe
5. Actualizar documento.md:
   ```yaml
   tarea_padre: TSK-xxx
   proyecto_padre: PROJ-xxx
   ```
6. Actualizar tarea.md:
   ```yaml
   documentos_vinculados: [DOC-xxx, ...]
   ```

### Salida
- Documento vinculado a tarea
- Usuario notificado
- Tarea se actualiza con referencia

---

## 4. POSTCONDICIONES

- frontmatter documento actualizado con `tarea_padre`
- frontmatter tarea actualizado con documento en array
- Relación bidireccional establecida
- Documento visible en contexto de tarea (UC-021)

---

## 5. CRITERIOS DE ACEPTACIÓN

- [ ] Modal permite seleccionar proyecto
- [ ] Modal permite seleccionar objetivo
- [ ] Modal permite seleccionar tarea
- [ ] Validación: tarea existe
- [ ] documento.md actualizado correctamente
- [ ] tarea.md actualizado correctamente
- [ ] Bidireccionalidad validada
- [ ] Notificación de éxito

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
