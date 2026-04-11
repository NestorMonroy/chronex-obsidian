```yaml
type: Caso de Uso Formal
title: UC-016 - BÚSQUEDA POR REPOSITORIO
version: 1.0.0
scope: ACTIVIDAD 3 - Sistema Búsqueda
date: 2026-04-11
tier: IMPORTANTE v1.1
```

# UC-016: BÚSQUEDA POR REPOSITORIO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-016 |
| **Nombre** | Búsqueda por Repositorio |
| **Prioridad** | IMPORTANTE (Sprint 2) |
| **Complejidad** | BAJA |
| **Dependencias** | UC-015 (búsqueda base) |

---

## 2. DESCRIPCIÓN BREVE

Refinamiento de UC-015. Búsqueda enfocada a un solo repositorio. Usuario selecciona repositorio de 500-REPOSITORIOS/ desde modal o sidebar, sistema ejecuta búsqueda limitada a documentos de ese repositorio. Útil para explorar contenido de un repositorio específico sin usar búsqueda global.

---

## 3. FLUJO PRINCIPAL

### Entrada
- Usuario invoca "Búsqueda por Repositorio"
- O selecciona repositorio desde sidebar

### Proceso
1. Mostrar lista de repositorios
2. Usuario selecciona repositorio
3. Modal de búsqueda filtra automáticamente por repositorio
4. Usuario ingresa término o ve todos los documentos del repo
5. Resultados muestran solo documentos de ese repositorio

### Salida
- Resultados limitados a repositorio seleccionado
- Usuario puede navegar documentos del repo

---

**Creado**: 2026-04-11
**Estado**: PENDIENTE IMPLEMENTACIÓN
