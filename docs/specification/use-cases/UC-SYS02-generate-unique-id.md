```yaml
type: Caso de Uso Formal
title: UC-SYS02 - GENERAR ID ÚNICO
version: 1.0.0
scope: SISTEMA - ID Generation
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-SYS02: GENERAR ID ÚNICO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-SYS02 |
| **Nombre** | Generar ID Único |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | CRÍTICA |
| **Complejidad** | BAJA |

---

## 2. DESCRIPCIÓN BREVE

Módulo generateUniqueId() ejecutado en todos los UC operacionales para generar IDs únicos, no colisionables. Usa: prefijo + timestamp + random hex (crypto). Garantiza: Unicidad garantizada, imposible de predecir, seguro para URLs.

---

## 3. FORMATO ID

```
{prefix}-{timestamp}-{randomHex}

Ejemplo: repo-1712817000000-a1b2c3d4

Componentes:
- Prefijo: repo, task, proj, pillar, note (2-6 chars)
- Timestamp: milliseconds since epoch (13 dígitos)
- Random: crypto random hex (8 caracteres)

Total: 2-6 + 1 + 13 + 1 + 8 = 25-31 caracteres máximo
```

---

## 4. CARACTERÍSTICAS

- **Seguridad**: Web Crypto API, no Math.random()
- **Unicidad**: Timestamp + random imposible colisión
- **Formato**: URL-safe (sin caracteres especiales)
- **Legibilidad**: Humano-legible (contiene timestamp)

---

## 5. GENERACIÓN

```javascript
generateUniqueId({ prefix: "repo" })

Pasos:
1. Get timestamp: Date.now() → 1712817000000
2. Get random: crypto.getRandomValues() → a1b2c3d4
3. Format: ${prefix}-${timestamp}-${randomHex}
4. Return: "repo-1712817000000-a1b2c3d4"
```

---

