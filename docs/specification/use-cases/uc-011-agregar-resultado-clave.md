```yaml
type: Caso de Uso Formal
title: UC-011 - AGREGAR RESULTADO CLAVE
version: 1.0.0
scope: ACTIVIDAD 2 - Sistema OKR
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-011: AGREGAR RESULTADO CLAVE

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-011 |
| **Nombre** | Agregar Resultado Clave a Objetivo |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | MEDIA |
| **Dependencias** | UC-010 (objetivo debe existir) |

---

## 2. DESCRIPCIÓN BREVE

Usuario abre objetivo.md e invoca "Agregar Resultado Clave". Sistema solicita nombre del resultado, descripción, métrica de éxito, valor inicial y target. Crea registro de resultado clave vinculado al objetivo. Permite seguimiento OKR (Objectives & Key Results).

---

## 3. FLUJO PRINCIPAL

### Entrada
- objetivo.md abierto
- Invoca "Agregar Resultado Clave"

### Proceso
1. Modal 1: Nombre del resultado
2. Modal 2: Descripción
3. Modal 3: Métrica de éxito (ej: "% usuarios con OAuth2")
4. Modal 4: Valor inicial (ej: 0)
5. Modal 5: Target (ej: 100)
6. Generar ID: KR-{objectiveId}-XXXXX
7. Crear registro en array resultado_clave de objetivo
8. Notificar éxito

### Salida
- Resultado clave agregado a objetivo
- Métrica lista para tracking

---

## 4. POSTCONDICIONES

- resultado_clave agregado a objetivo.md
- ID único generado
- Métrica inicializada en valor inicial
- Objetivo puede rastrear progreso hacia target

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
