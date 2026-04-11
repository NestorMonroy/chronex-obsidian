# Button Registry - Registro Centralizado de Botones

Archivo maestro que documenta todos los botones disponibles en la bóveda Obsidian.
Usado por UC-056 para resolver referencias dinámicamente e inyectar SVGs.

---

## Categoría 1: Notas

### button-add-nota-pilar

**Propósito:** Agregar nota asociada a un pilar

**Configuración:**
- Nombre mostrado: Agregar Nota
- Emoji: 📝
- Color SVG: Azul (#2196F3)
- Acción: QuickAdd: add-nota-pilar
- Parámetros: type=nota, parent=pilar

**Aparece en templates:**
- addNotaPilar.md
- addObjetivo.md
- addPilar.md

**Descripción:**
Permite crear una nota adjunta a un pilar específico. La nota se vincula automáticamente al pilar padre.

---

### button-add-nota-tarea

**Propósito:** Agregar nota asociada a una tarea

**Configuración:**
- Nombre mostrado: Agregar Nota
- Emoji: 📝
- Color SVG: Verde (#4CAF50)
- Acción: QuickAdd: add-nota-tarea
- Parámetros: type=nota, parent=tarea

**Aparece en templates:**
- addNotaTarea.md
- addProyecto.md
- addTarea.md

**Descripción:**
Permite crear una nota adjunta a una tarea específica. La nota se vincula automáticamente a la tarea padre.

---

## Categoría 2: Objetivos y Resultados

### button-add-objetivo

**Propósito:** Agregar objetivo a pilar o proyecto

**Configuración:**
- Nombre mostrado: Agregar Objetivo
- Emoji: 🧭
- Color SVG: Naranja (#FF9800)
- Acción: QuickAdd: add-objetivo
- Parámetros: type=objetivo, parent=pilar|proyecto

**Aparece en templates:**
- addPilar.md
- addProyecto.md

**Descripción:**
Permite crear un nuevo objetivo vinculado a un pilar o proyecto existente.

---

### button-add-resultado

**Propósito:** Agregar resultado a objetivo o proyecto

**Configuración:**
- Nombre mostrado: Agregar Resultado
- Emoji: 📊
- Color SVG: Púrpura (#9C27B0)
- Acción: QuickAdd: add-resultado
- Parámetros: type=resultado, parent=objetivo|proyecto

**Aparece en templates:**
- addObjetivo.md
- addProyecto.md
- addResultado.md

**Descripción:**
Permite crear un nuevo resultado (key result) vinculado a un objetivo o proyecto.

---

## Categoría 3: Tareas

### button-add-task

**Propósito:** Agregar tarea a proyecto o resultado

**Configuración:**
- Nombre mostrado: Agregar Tarea
- Emoji: ⌚
- Color SVG: Verde (#4CAF50)
- Acción: QuickAdd: add-task
- Parámetros: type=tarea, parent=proyecto|resultado

**Aparece en templates:**
- addProyecto.md
- addResultado.md
- addTarea.md

**Descripción:**
Permite crear una nueva tarea vinculada a un proyecto o resultado existente.

---

## Categoría 4: Repositorio

### button-add-500-categoria-repositorio

**Propósito:** Agregar nueva categoría en repositorio

**Configuración:**
- Nombre mostrado: Nueva Categoría
- Emoji: 📂
- Color SVG: Azul (#2196F3)
- Acción: QuickAdd: add-500-categoria
- Parámetros: type=categoria, parent=500-REPOSITORIOS

**Aparece en templates:**
- indexCategoriaRepositorio.md

**Descripción:**
Permite crear una nueva categoría dentro del repositorio de referencias (500-REPOSITORIOS).

---

### button-add-500-file-nota-repositorio

**Propósito:** Agregar nota dentro de categoría de repositorio

**Configuración:**
- Nombre mostrado: Nueva Nota
- Emoji: 📑
- Color SVG: Verde (#4CAF50)
- Acción: QuickAdd: add-500-nota
- Parámetros: type=nota, parent=500-REPOSITORIOS

**Aparece en templates:**
- indexCategoriaRepositorio.md

**Descripción:**
Permite crear una nueva nota dentro de una categoría del repositorio.

---

## Categoría 5: Navegación

### button-home-principal

**Propósito:** Navegar al home principal

**Configuración:**
- Nombre mostrado: Home Principal
- Emoji: 🏠
- Color SVG: Verde (#4CAF50)
- Acción: Navegar a Home.md
- Parámetros: nav=home

**Aparece en templates:**
- 100-INBOX.md

**Descripción:**
Permite navegar rápidamente al dashboard principal del sistema desde el INBOX.

---

### button-add-fugaz

**Propósito:** Agregar nota fugaz (fleeting note)

**Configuración:**
- Nombre mostrado: Agregar Nota Fugaz
- Emoji: ⚡
- Color SVG: Amarillo (#FFC107)
- Acción: QuickAdd: add-fugaz
- Parámetros: type=fleeting, parent=100-INBOX

**Aparece en templates:**
- 100-INBOX.md

**Descripción:**
Permite crear una nota fugaz rápidamente. Las notas fugaces se capturan en el INBOX para procesamiento posterior.

---

## Resumen de Botones

| ID | Nombre | Emoji | Color | Apariciones |
|---|---|---|---|---|
| button-add-nota-pilar | Agregar Nota | 📝 | Azul | 3 |
| button-add-nota-tarea | Agregar Nota | 📝 | Verde | 3 |
| button-add-objetivo | Agregar Objetivo | 🧭 | Naranja | 2 |
| button-add-resultado | Agregar Resultado | 📊 | Púrpura | 3 |
| button-add-task | Agregar Tarea | ⌚ | Verde | 3 |
| button-add-500-categoria-repositorio | Nueva Categoría | 📂 | Azul | 1 |
| button-add-500-file-nota-repositorio | Nueva Nota | 📑 | Verde | 1 |
| button-home-principal | Home Principal | 🏠 | Verde | 1 |
| button-add-fugaz | Agregar Nota Fugaz | ⚡ | Amarillo | 1 |

**Total: 9 botones únicos | 18 apariciones en templates**

---

## Notas de Implementación

### Para UC-056: ButtonRegistryManager

El `ButtonRegistryManager` debe:

1. **Parsear este archivo** - Leer y extraer definiciones de botones
2. **Mapear IDs a configuraciones** - Crear mapa: `button-id` → configuración
3. **Resolver referencias** - Cuando encuentre `` `button-id` ``, obtener config
4. **Inyectar SVGs** - Agregar SVG correspondiente a la referencia
5. **Mantener compatibilidad** - Estructura ad-flex/ad-blank intacta

### Para UC-057: ButtonSystem

El `ButtonSystem` debe:

1. **Detectar clics en botones** - Interceptar clics en referencias de botones
2. **Resolver acciones** - Ejecutar QuickAdd o navegación según configuración
3. **Pasar parámetros** - Enviar parámetros a macros

---

## Convenciones

- **Nombres**: `button-[accion]-[contexto]`
- **Emojis**: Consistentes con el tipo de acción
- **Colores**: Material Design palette
- **Apariciones**: Documentadas para rastrear uso
- **Parámetros**: Formato key=value separado por `|`

---

**Autor:** Nestor + Claude  
**Fecha:** 2026-04-11  
**Versión:** 1.0  
**Estado:** CENTRALIZADO Y DOCUMENTADO ✅
