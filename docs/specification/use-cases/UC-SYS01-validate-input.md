```yaml
type: Caso de Uso Formal
title: UC-SYS01 - VALIDAR ENTRADA
version: 1.0.0
scope: SISTEMA - Validación de Datos
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-SYS01: VALIDAR ENTRADA

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-SYS01 |
| **Nombre** | Validar Entrada de Usuario |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA |
| **Complejidad** | MEDIA |

---

## 2. DESCRIPCIÓN BREVE

Módulo validateCommonInput() ejecutado en todos los casos de uso operacionales para asegurar que entrada de usuario es válida, segura, y cumple requisitos. Valida: longitud, caracteres permitidos, no XSS, no path traversal, formatos específicos (fecha, email, etc.).

---

## 3. REGLAS DE VALIDACIÓN

### Longitud de Nombre

- Mínimo: 3 caracteres
- Máximo: 255 caracteres
- Error: "Name must be 3-255 characters"

### Caracteres Especiales

- Permitidos: a-z, A-Z, 0-9, -, _, espacio
- No permitidos: <, >, /, \, *, ?, ", :, |, ., .., ../, etc.
- Error: "Contains invalid characters"

### XSS Prevention

- Detecta: <script>, <img>, onclick=, onerror=, etc.
- Rechaza: cualquier patrón HTML/JavaScript
- Error: "Invalid characters detected"

### Path Traversal

- Rechaza: ../, ..\, etc.
- Error: "Invalid path - traversal detected"

### Formato Fecha

- Aceptados: YYYY-MM-DD, ISO 8601
- Error: "Invalid date format"

---

## 4. FLUJO DE VALIDACIÓN

```
Input → Length check
      ├─ Valid: continuar
      └─ Invalid: error + reject

      → Character check
      ├─ Valid: continuar
      └─ Invalid: error + reject

      → XSS pattern check
      ├─ Valid: continuar
      └─ Invalid: error + reject

      → Format-specific check (si aplica)
      ├─ Valid: accept
      └─ Invalid: error + reject
```

---

## 5. EXCEPCIONES

### Todos los validadores pueden fallar

Manejo:
1. Mostrar error específico
2. Permitir reintentar
3. Log para debugging

---

