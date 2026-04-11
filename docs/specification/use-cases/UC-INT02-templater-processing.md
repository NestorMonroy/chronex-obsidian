```yaml
type: Caso de Uso Formal
title: UC-INT02 - PROCESAMIENTO TEMPLATER DINÁMICO
version: 1.0.0
scope: INTEGRACIÓN - Templater Plugin
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-INT02: PROCESAMIENTO TEMPLATER DINÁMICO

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-INT02 |
| **Nombre** | Procesamiento Templater Dinámico |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | MEDIA (Sprint 1-2) |
| **Complejidad** | MEDIA |

---

## 2. DESCRIPCIÓN BREVE

Template contiene {{VALUE:*}} placeholders (QuickAdd) y <% %> code blocks (Templater). QuickAdd reemplaza {{VALUE:*}} con variables. Templater recibe template procesado, ejecuta <% %> bloques JavaScript, evalúa <%= %> expresiones usando API Templater (tp.date, tp.file, etc.). Genera contenido final completamente dinámico y personalizado.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol |
|-------|------|-----|
| **Template** | Artefacto | Primario |
| **QuickAdd** | Sistema | Secundario |
| **Templater** | Sistema | Secundario |
| **Obsidian API** | Componente | Terciario |

---

## 4. PRECONDICIONES

1. Template contiene {{VALUE:*}} y <% %> blocks
2. Templater plugin instalado
3. QuickAdd ha reemplazado {{VALUE:*}}

---

## 5. FLUJO PRINCIPAL

### Pasos Detallados

---

#### **Paso 1: QuickAdd Envía Template a Templater**

**Actor**: QuickAdd

**Acción**: 
```
Template después de reemplazo:
---
id: {{VALUE:repositoryId}} → repo-123-abc
createdAt: {{VALUE:createdAt}} → 2026-04-11T...
lastModified: <% tp.date.now("YYYY-MM-DD") %>
---
# {{VALUE:repositoryName}} → My Repository
```

**Resultado esperado**: Template listo para Templater

---

#### **Paso 2: Templater Detecta Bloques <% %>**

**Actor**: Templater

**Acción**: Parser detecta:
- <% %> code execution blocks
- <%= %> expression evaluation blocks

**Resultado esperado**: Bloques identificados

---

#### **Paso 3: Templater Ejecuta Bloques <% %>**

**Actor**: Templater Engine

**Acción**: Ejecuta JavaScript dentro de <% %>:

```javascript
<% 
  const vault = app.vault;
  const folder = await vault.adapter.list("500-REPOSITORIOS");
  folder.files.forEach(f => print(`- [[${f}]]`));
%>
```

Acceso a APIs:
- tp.date.now() - fecha actual
- tp.file.title - nombre del archivo
- tp.file.folder() - carpeta actual
- app.vault - Obsidian vault API
- print() - output

**Resultado esperado**: Código ejecutado, resultados capturados

---

#### **Paso 4: Templater Evalúa Expresiones <%= %>**

**Actor**: Templater

**Acción**: Evalúa y sustituye expressions:

```javascript
<%= tp.date.now("YYYY-MM-DD HH:mm:ss") %>
```

**Resultado esperado**: "2026-04-11 04:30:45" generado

---

#### **Paso 5: Combinar Resultados**

**Actor**: Templater

**Acción**: Reemplaza bloques con resultados generados

**Resultado esperado**: Template final sin <% %> blocks

---

#### **Paso 6: Retornar Contenido Final**

**Actor**: Templater

**Acción**: Devuelve HTML/Markdown final procesado

**Resultado esperado**: Contenido completamente procesado

---

## 6. DATOS DINÁMICOS SOPORTADOS

| Expresión | Resultado | Ejemplo |
|-----------|-----------|---------|
| `<% tp.date.now() %>` | ISO 8601 | 2026-04-11T04:30:00Z |
| `<% tp.date.now("YYYY-MM-DD") %>` | Formato personalizado | 2026-04-11 |
| `<% tp.file.title %>` | Nombre archivo | My Repository |
| `<% tp.file.folder(true) %>` | Carpeta actual | 500-REPOSITORIOS |
| `<% app.vault.getFiles().length %>` | Total archivos | 342 |

---

## 7. EXCEPCIONES

### Excepción EXC-INT02-001: Syntax Error en Bloque <% %>

**Condición**: JavaScript syntax error en template

**Manejo**:
1. Templater detecta error
2. Mostrar error: "Templater syntax error at line X"
3. Template no procesado

**Postcondición**: Archivo no creado

---

## 8. POSTCONDICIONES

1. Contenido final completamente procesado
2. Sin bloques <% %> o <%= %> en resultado
3. Todas las {{VALUE:*}} reemplazadas
4. Listo para crear archivo

---

