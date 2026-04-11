```yaml
type: Caso de Uso Formal
title: UC-SYS04 - ACTUALIZAR VERSIÓN
version: 1.0.0
scope: SISTEMA - Version Management
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-SYS04: ACTUALIZAR VERSIÓN

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-SYS04 |
| **Nombre** | Actualizar Versión |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | BAJA |
| **Complejidad** | BAJA |

---

## 2. DESCRIPCIÓN BREVE

Script npm run version que automatiza versionamiento semántico. Actualiza manifest.json y versions.json, prepara cambios para commit git. Actor: desarrollador/CI.

---

## 3. FLUJO

```
npm run version [patch|minor|major]

1. Obtener versión actual de manifest.json
2. Incrementar según tipo (default: patch)
   - patch: 1.0.0 → 1.0.1
   - minor: 1.0.0 → 1.1.0
   - major: 1.0.0 → 2.0.0
3. Actualizar manifest.json
4. Actualizar versions.json
5. git add (preparar para commit)
```

---

## 4. ARCHIVOS MODIFICADOS

| Archivo | Campo | Acción |
|---------|-------|--------|
| manifest.json | version | Incrementar |
| versions.json | {newVersion} | Agregar |

---

