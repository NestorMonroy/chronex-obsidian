```yaml
type: Caso de Uso Formal
title: UC-009 - ACTIVAR OBJETIVO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Estados
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-009: ACTIVAR OBJETIVO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-009 |
| **Nombre** | Activar Objetivo |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | BAJA |
| **Dependencias** | UC-013 (máquina de estados) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-013 aplicado a objetivos. Usuario abre objetivo.md en estado PENDIENTE e invoca "Activar Objetivo". Sistema cambia status a ACTIVO, registra fecha_inicio, notifica. Objetivo listo para agregar tareas.

---

## 3. FLUJO PRINCIPAL

### Entrada
- objetivo.md abierto
- Status: PENDIENTE
- Invoca "Activar Objetivo"

### Proceso
1. Verificar status = PENDIENTE
2. Cambiar status = ACTIVO
3. Agregar fecha_inicio = hoy
4. Registrar en auditoría
5. Notificar éxito

### Salida
- Status = ACTIVO
- Objetivo listo para agregar tareas (UC-012)

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
