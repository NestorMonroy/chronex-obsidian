```yaml
type: Caso de Uso Formal
title: UC-SYS03 - MOSTRAR NOTIFICACIÓN
version: 1.0.0
scope: SISTEMA - User Feedback
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-SYS03: MOSTRAR NOTIFICACIÓN

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-SYS03 |
| **Nombre** | Mostrar Notificación |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | MEDIA |
| **Complejidad** | BAJA |

---

## 2. DESCRIPCIÓN BREVE

Módulo showNotification() y notificationAdapter ejecutado en todos los UC operacionales para proporcionar feedback visual al usuario. Tipos: success, error, warning, info. Usa Obsidian Notice API con duration configurable.

---

## 3. TIPOS DE NOTIFICACIONES

| Tipo | Color | Duración | Ejemplo |
|------|-------|----------|---------|
| **success** | Verde | 3-5s | "Repository created: My Repo" |
| **error** | Rojo | 5-8s | "Invalid repository name" |
| **warning** | Amarillo | 5-7s | "Note content is empty" |
| **info** | Azul | 3-5s | "Checking templates folder..." |

---

## 4. FORMATO

```
showNotification(message, type, duration)

showNotification(
  "Repository created: My Repository",
  "success",
  5000  // milliseconds
)
```

---

## 5. UBICACIÓN

Toast en esquina inferior derecha, no bloqueante

---

