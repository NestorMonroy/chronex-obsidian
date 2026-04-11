```yaml
type: Caso de Uso Formal
title: UC-014 - CAMBIAR ESTADO OBJETIVO Y TAREA
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Estados
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-014: CAMBIAR ESTADO OBJETIVO Y TAREA

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-014 |
| **Nombre** | Cambiar Estado Objetivo y Tarea |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | MEDIA |
| **Dependencias** | UC-013 (máquina de estados) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-013 para objetivos y tareas. Usuario abre objetivo.md o tarea.md e invoca "Cambiar Estado". Sistema presenta estados válidos según máquina de estados, usuario selecciona nuevo estado. Sistema valida transición, actualiza frontmatter, recalcula métricas padre, registra auditoría.

---

## 3. MÁQUINA DE ESTADOS

### Para Objetivos
```
PENDIENTE → ACTIVO → COMPLETADO → ARCHIVADO
          ↓         ↓              ↓
          └─ ARCHIVADO  (en cualquier momento)
```

### Para Tareas
```
PENDIENTE → EN PROGRESO → COMPLETADO → ARCHIVADO
          ↓              ↓              ↓
          └─────── BLOQUEADA ────── ARCHIVADO
```

---

## 4. FLUJO PRINCIPAL

### Entrada
- objetivo.md o tarea.md abierto
- Invoca "Cambiar Estado"

### Proceso
1. Detectar tipo (objetivo o tarea)
2. Obtener estado actual
3. Determinar transiciones válidas
4. Mostrar modal con opciones
5. Usuario selecciona nuevo estado
6. Validar transición
7. Actualizar frontmatter
8. Recalcular métricas padre
9. Registrar auditoría
10. Notificar

### Salida
- Status actualizado
- Métricas padre recalculadas
- Auditoría registrada

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
