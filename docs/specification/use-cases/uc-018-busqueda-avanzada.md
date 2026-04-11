```yaml
type: Caso de Uso Formal
title: UC-018 - BÚSQUEDA AVANZADA
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Búsqueda
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-018: BÚSQUEDA AVANZADA

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-018 |
| **Nombre** | Búsqueda Avanzada |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | MEDIA |
| **Dependencias** | UC-015 (búsqueda base) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-015 con filtros avanzados. Usuario invoca "Búsqueda Avanzada" y obtiene modal con filtros complejos: rango de fechas, múltiples estados, múltiples repositorios, múltiples proyectos, tipos de documento, etiquetas, operadores booleanos (AND, OR, NOT). Permite búsquedas precisas en documentación amplia.

---

## 3. FILTROS AVANZADOS

```
Búsqueda Avanzada:
├─ Texto: [________________]  (soporte fuzzy/regex)
├─ Fecha Creación: [desde] [hasta]
├─ Fecha Actualización: [desde] [hasta]
├─ Status: [checkbox] ✓ Activo □ Archivado □ Borrador
├─ Repositorio: [multi-select] AUTHENTICATION, SECURITY, ...
├─ Proyecto: [multi-select] E-Commerce, Auth Upgrade, ...
├─ Tipo: [checkbox] □ Documento □ Proyecto □ Objetivo □ Tarea
├─ Etiquetas: [multi-tag input] oauth, security, ...
├─ Booleano: (Texto) [AND] [OR] [NOT]
└─ Ordenar: [relevancia] [fecha] [nombre]
```

---

## 4. FLUJO PRINCIPAL

### Entrada
- Usuario invoca "Búsqueda Avanzada"

### Proceso
1. Mostrar modal con todos los filtros
2. Usuario completa filtros según necesidades
3. Construir query booleana compleja
4. Ejecutar búsqueda en índice
5. Aplicar filtros en cascada
6. Mostrar resultados

### Salida
- Resultados según criterios avanzados
- Usuario puede refinar búsqueda

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
