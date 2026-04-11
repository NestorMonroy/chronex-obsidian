```yaml
type: Caso de Uso Formal
title: UC-007 - ACTIVAR PROYECTO
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema Estados
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-007: ACTIVAR PROYECTO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-007 |
| **Nombre** | Activar Proyecto |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | BAJA |
| **Dependencias** | UC-013 (máquina de estados) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-013. Usuario abre proyecto en estado PENDIENTE e invoca "Activar Proyecto". Sistema verifica validaciones (proyecto tiene UID, está en estado PENDIENTE), cambia status a ACTIVO, registra fecha_inicio, actualiza auditoría. Proyecto queda listo para agregar objetivos y tareas.

---

## 3. FLUJO PRINCIPAL

### Entrada
- proyecto.md abierto
- Status actual: PENDIENTE
- Invoca "Activar Proyecto"

### Proceso
1. Verificar status = PENDIENTE
2. Cambiar status = ACTIVO
3. Agregar fecha_inicio = hoy
4. Actualizar fecha_actualizacion
5. Registrar en auditoría
6. Notificar: "Proyecto activado"

### Salida
- Status = ACTIVO
- Proyecto listo para usar

---

## 4. POSTCONDICIONES

- status cambiado a ACTIVO
- fecha_inicio registrada
- Entrada en auditoría creada
- Usuario puede agregar objetivos (UC-010)

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
