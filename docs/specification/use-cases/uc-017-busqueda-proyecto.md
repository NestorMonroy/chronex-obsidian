```yaml
type: Caso de Uso Formal
title: UC-017 - BÚSQUEDA POR PROYECTO
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Búsqueda
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-017: BÚSQUEDA POR PROYECTO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-017 |
| **Nombre** | Búsqueda por Proyecto |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | BAJA |
| **Dependencias** | UC-015 (búsqueda base) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-015. Búsqueda enfocada a documentos de un proyecto específico. Usuario selecciona proyecto de 200-PROYECTOS/, sistema ejecuta búsqueda limitada a documentos vinculados a ese proyecto. Útil para ver toda documentación de un proyecto en contexto.

---

## 3. FLUJO PRINCIPAL

### Entrada
- Usuario invoca "Búsqueda por Proyecto"
- O selecciona proyecto desde contexto (UC-021)

### Proceso
1. Mostrar lista de proyectos
2. Usuario selecciona proyecto
3. Modal de búsqueda filtra por documentos_vinculados del proyecto
4. Usuario ingresa término o ve todos los documentos del proyecto
5. Resultados muestran solo documentos vinculados

### Salida
- Documentos del proyecto mostrados
- Navegación de proyecto facilitada

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
