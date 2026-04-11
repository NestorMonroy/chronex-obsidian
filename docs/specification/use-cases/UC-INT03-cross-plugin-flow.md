```yaml
type: Caso de Uso Formal
title: UC-INT03 - FLUJO CROSS-PLUGIN
version: 1.0.0
scope: INTEGRACIÓN - Flujo Completo End-to-End
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-INT03: FLUJO CROSS-PLUGIN (END-TO-END)

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-INT03 |
| **Nombre** | Flujo Cross-Plugin End-to-End |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | MEDIA (Sprint 1-2) |
| **Complejidad** | ALTA |

---

## 2. DESCRIPCIÓN BREVE

Flujo completo que integra obsidian-repo, QuickAdd, Templater. Usuario ejecuta comando/macro. obsidian-repo script valida y genera metadata. QuickAdd sustituye variables de template. Templater procesa código dinámico. Obsidian crea archivo. Flujo total: 15-30 segundos. Valida integración perfecta entre 3 plugins.

---

## 3. ARQUITECTURA DE FLUJO

```
Usuario Input
    ↓
obsidian-repo Script
  ├─ validateCommonInput() [UC-SYS01]
  ├─ generateUniqueId() [UC-SYS02]
  ├─ getCurrentDateTime()
  └─ Retorna variables
    ↓
QuickAdd Macro
  ├─ Carga template
  ├─ Sustituye {{VALUE:*}}
  └─ Pasa a Templater
    ↓
Templater Processor
  ├─ Procesa <% %> blocks
  ├─ Evalúa <%= %> expressions
  └─ Genera contenido final
    ↓
Obsidian File API
  ├─ Crea archivo
  ├─ Abre en editor
  └─ Muestra notificación [UC-SYS03]
    ↓
Vault Updated
```

---

## 4. FLUJO PASO A PASO

---

#### **Paso 1-3: obsidian-repo**

Valida input, genera ID, obtiene metadata (UC-SYS01, UC-SYS02)

**Resultado**: Object con variables
```javascript
{
  id: "repo-123-abc",
  name: "Repository Name",
  description: "Desc",
  createdAt: "2026-04-11T...",
  author: "Nestor"
}
```

---

#### **Paso 4-5: QuickAdd**

Sustituye {{VALUE:*}} en template, pasa a Templater

---

#### **Paso 6-7: Templater**

Procesa dinámicamente, genera contenido final

---

#### **Paso 8-9: Obsidian**

Crea archivo, abre editor, muestra notificación (UC-SYS03)

---

## 5. TIMING Y PERFORMANCE

| Componente | Tiempo Típico | Máximo |
|-----------|---------------|--------|
| obsidian-repo Script | 10-50ms | 100ms |
| QuickAdd substitution | 5-20ms | 50ms |
| Templater processing | 20-100ms | 200ms |
| Obsidian file creation | 50-200ms | 500ms |
| **TOTAL** | **85-370ms** | **850ms** |

---

## 6. PUNTOS DE INTEGRACIÓN

| Plugin 1 | Plugin 2 | Integración | Verificación |
|----------|----------|-------------|--------------|
| obsidian-repo | QuickAdd | Script output → Template input | Variables correctas |
| QuickAdd | Templater | Template {{}} → <% %> blocks | Contenido final válido |
| Templater | Obsidian | Final content → File API | Archivo creado |
| obsidian-repo | Obsidian | showNotification() → UI | Notificación mostrada |

---

## 7. VALIDACIÓN DE FLUJO

Validar que cada transición funciona:

1. ✓ Script ejecuta sin errores
2. ✓ Variables generadas correctamente
3. ✓ QuickAdd carga template
4. ✓ {{VALUE:*}} sustituidos
5. ✓ Templater procesa
6. ✓ Archivo creado
7. ✓ Notificación mostrada
8. ✓ Archivo abierto en editor

---

