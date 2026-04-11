```yaml
type: Caso de Uso Formal
title: UC-INT01 - INTEGRACIÓN CON QUICKADD
version: 1.0.0
scope: INTEGRACIÓN - QuickAdd Plugin
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-INT01: INTEGRACIÓN CON QUICKADD

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-INT01 |
| **Nombre** | Integración con QuickAdd |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Prioridad** | ALTA (Sprint 1) |
| **Complejidad** | MEDIA-ALTA |

---

## 2. DESCRIPCIÓN BREVE

Usuario configura macro en QuickAdd que ejecuta script de creación (ej: createRepository.js). QuickAdd carga macro, ejecuta UserScript, script devuelve objeto con variables. QuickAdd sustituye {{VALUE:*}} en template. Sistema pasa a Templater. Templater procesa dinamicamente. Archivo final creado y capturado en sección determinada del vault.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol |
|-------|------|-----|
| **Usuario** | Humano | Primario |
| **QuickAdd Plugin** | Sistema | Secundario |
| **chronex-obsidian Plugin** | Sistema | Secundario |
| **Templater Plugin** | Sistema | Secundario |
| **Scripts (createRepository, etc.)** | Artefacto | Consumidor |

---

## 4. PRECONDICIONES

1. QuickAdd plugin instalado y configurado
2. Macros configurados en data.json (mAdd500Repo, mAdd500Note, etc.)
3. Scripts existentes: 5 scripts en 992-script/
4. Templates existentes: 5 templates en 991-template/

---

## 5. FLUJO PRINCIPAL

### Pasos Detallados

---

#### **Paso 1: Usuario Invoca Macro en QuickAdd**

**Actor**: Usuario

**Acción**: Usuario hace click en botón QuickAdd (ej: "Add Repository") o Command Palette macro

**Resultado esperado**: Macro iniciada

---

#### **Paso 2: QuickAdd Carga Configuración de Macro**

**Actor**: QuickAdd Plugin

**Acción**: Carga macro config desde .obsidian/plugins/quickadd/data.json:
- Obtiene: UserScript path, template path, capture setting

**Resultado esperado**: Configuración cargada en memoria

---

#### **Paso 3: Ejecutar UserScript**

**Actor**: QuickAdd

**Acción**: Ejecuta script (ej: createRepository.js):
1. Script ejecuta en contexto QuickAdd
2. Script prompts usuario por datos
3. Script valida entrada
4. Script genera ID y metadata
5. Script retorna objeto JavaScript

**Componentes invocados**: createRepository.js (o create*.js)

**Resultado esperado**: Objeto retornado:
```javascript
{
  repositoryId: "repo-123-abc",
  repositoryName: "My Repo",
  description: "Desc",
  createdAt: "2026-04-11T...",
  author: "Nestor"
}
```

---

#### **Paso 4: QuickAdd Sustituye Variables en Template**

**Actor**: QuickAdd

**Acción**: 
1. Carga template (repository.md)
2. Reemplaza {{VALUE:key}} con valores del objeto
3. {{VALUE:repositoryId}} → repo-123-abc
4. {{VALUE:repositoryName}} → My Repo
5. etc.

**Resultado esperado**: Template con variables reemplazadas

---

#### **Paso 5: QuickAdd Pasa a Templater**

**Actor**: QuickAdd → Templater

**Acción**: Template con {{}} reemplazados pasa a Templater para procesamiento

**Resultado esperado**: Template listo para Templater

---

#### **Paso 6: Templater Procesa Bloques Dinámicos**

**Actor**: Templater Plugin

**Acción**:
1. Procesa <% %> JavaScript blocks
2. Evalúa <%= %> expressions
3. Ejecuta funciones Templater (tp.date, tp.file, etc.)
4. Genera contenido final

**Resultado esperado**: HTML/Markdown final completamente procesado

---

#### **Paso 7: QuickAdd Crea Archivo**

**Actor**: QuickAdd

**Acción**: Crea nuevo archivo con contenido procesado en ubicación especificada

**Resultado esperado**: Archivo creado

---

#### **Paso 8: QuickAdd Captura Resultado (Optional)**

**Actor**: QuickAdd

**Acción**: Si "Capture" habilitado:
- Agrega link al archivo en sección determinada
- Ej: agrega [[repository-name]] a "## Repositorios" en nota activa

**Resultado esperado**: Link capturado en nota activa

---

## 6. FLUJOS ALTERNATIVOS

### Flujo Alternativo 6A: Sin Templater

**Trigger**: Templater no instalado

**Acciones**:
1. Saltar Paso 6
2. QuickAdd usa contenido con {{}} ya reemplazados
3. Crear archivo directamente

**Resultado**: Archivo sin procesamiento dinámico Templater

---

## 7. EXCEPCIONES

### Excepción EXC-INT01-001: Script Error

**Condición**: Script falla durante ejecución

**Manejo**:
1. QuickAdd detecta error
2. Mostrar error: "Script failed: {error message}"
3. Permitir reintentar o cancelar

**Postcondición**: Macro cancelada, ningún archivo creado

---

## 8. POSTCONDICIONES

1. Archivo creado con contenido procesado
2. QuickAdd macro completada
3. Opcional: Link capturado en sección destino
4. Usuario puede editar archivo inmediatamente

---

