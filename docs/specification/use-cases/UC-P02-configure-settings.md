```yaml
type: Caso de Uso Formal
title: UC-P02 - CONFIGURAR SETTINGS DEL PLUGIN
version: 1.0.0
scope: SETUP - Configuración del Sistema
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-P02: CONFIGURAR SETTINGS DEL PLUGIN

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-P02 |
| **Nombre** | Configurar Settings del Plugin |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Fecha Última Actualización** | 2026-04-11 |
| **Prioridad** | ALTA (Sprint 0-1) |
| **Complejidad** | BAJA |
| **Operaciones Atómicas** | OP-CONFIG-001, OP-CONFIG-002, OP-CONFIG-003, OP-SETTINGS-SAVE |

---

## 2. DESCRIPCIÓN BREVE

Usuario accede a Obsidian Settings → Community Plugins → Options (obsidian-repo), abre settings tab del plugin. Sistema presenta formulario con 5 opciones configurables: Author Name, Templates Folder, Scripts Folder, Enable Notifications, Enable Auto-Capture. Usuario modifica valores según preferencias. Sistema valida rutas, almacena cambios automáticamente en persistencia. Usuario recibe confirmación visual de guardado.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario (Nestor)** | Humano | Primario | Abre settings, modifica opciones |
| **Obsidian Core** | Componente Externo | Secundario | Proporciona Settings UI framework |
| **RepositoryManagerSettingTab** | Módulo Interno | Consumidor | Renderiza formulario, valida entrada |
| **Plugin API** | Componente Externo | Secundario | Persiste datos en vault |
| **Adapter: configAdapter** | Módulo Interno | Secundario | Valida rutas y configuración |

---

## 4. PRECONDICIONES

### Precondiciones Técnicas

1. **Plugin instalado y habilitado**
   - Plugin UC-P01 completado exitosamente
   - Plugin visible en Community Plugins list
   - onload() ha ejecutado sin errores

2. **Obsidian Settings accesible**
   - Settings panel abierto
   - Community Plugins tab disponible
   - Vault tiene permisos de escritura en .obsidian/

3. **Recursos disponibles**
   - Carpetas 990-UTILIDADES/991-template y 992-script existen en vault
   - O van a ser creadas automáticamente (con rutas por defecto)

4. **Validador disponible**
   - validateCommonInput() y configAdapter disponibles

### Precondiciones de Negocio

1. Usuario quiere personalizar plugin según su vault structure
2. Usuario tiene carpetas de templates y scripts en vault
3. Usuario quiere control sobre notificaciones
4. Usuario quiere definir nombre de autor para metadata

---

## 5. FLUJO PRINCIPAL

### Descripción General

Usuario navega a Settings → Community Plugins → Options, abre tab del plugin, ve formulario con 5 campos, modifica según necesidad, cambios se guardan automáticamente.

### Pasos Detallados

---

#### **Paso 1: Acceder a Community Plugins Settings**

**Actor**: Usuario

**Acción**: Usuario abre Obsidian Settings (gear icon), busca y hace click en "Community plugins"

**Componentes invocados**:
- Obsidian Settings panel
- Community Plugins section
- Plugin list renderer

**Resultado esperado**: Vista de Community Plugins con list de plugins instalados

---

#### **Paso 2: Ubicar Plugin en Lista**

**Actor**: Usuario

**Acción**: Usuario localiza "Obsidian Repository Manager" en la lista de plugins (nombre alfabético o buscar)

**Componentes invocados**:
- Plugin registry
- Search/filter function

**Resultado esperado**: Plugin encontrado en lista, visible con estado "Enabled" o "Disabled"

---

#### **Paso 3: Acceder a Opciones del Plugin**

**Actor**: Usuario

**Acción**: Usuario hace click en nombre del plugin o botón "Options" asociado

**Componentes invocados**:
- Plugin options router
- RepositoryManagerSettingTab renderer

**Resultado esperado**: Settings tab del plugin abierto, formulario visible

---

#### **Paso 4: Visualizar Formulario de Configuración**

**Actor**: RepositoryManagerSettingTab

**Acción**: Sistema renderiza formulario con 5 secciones:

1. **Author Name** (Text input)
   - Placeholder: "Nestor"
   - Descripción: "Your name (used in metadata)"
   - Default value: de settings persistidos

2. **Templates Folder** (Text input / Path selector)
   - Placeholder: "990-UTILIDADES/991-template"
   - Descripción: "Path to templates folder"
   - Default value: "990-UTILIDADES/991-template"

3. **Scripts Folder** (Text input)
   - Placeholder: "990-UTILIDADES/992-script"
   - Descripción: "Path to scripts folder"
   - Default value: "990-UTILIDADES/992-script"

4. **Enable Notifications** (Toggle switch)
   - Descripción: "Show notifications for actions"
   - Default: true (habilitado)

5. **Enable Auto-Capture** (Toggle switch)
   - Descripción: "Auto-capture in current note"
   - Default: true (habilitado)

**Componentes invocados**:
- PluginSettingTab.display()
- Setting class (Obsidian)
- UI renderer

**Resultado esperado**: Formulario visible y accesible, todos los campos con valores actuales

---

#### **Paso 5: Usuario Modifica Author Name**

**Actor**: Usuario

**Acción**: Usuario hace click en campo "Author Name", borra valor actual, ingresa nuevo nombre (ej: "John Doe")

**Componentes invocados**:
- Text input handler
- onChange listener

**Resultado esperado**: Campo actualizado con nuevo valor en tiempo real

---

#### **Paso 6: Validar Author Name**

**Actor**: configAdapter (onChange trigger)

**Acción**: Sistema valida nombre:
- Longitud: 3-50 caracteres
- Sin caracteres especiales peligrosos
- No contiene /../ o path traversal

**Componentes invocados**:
- validateCommonInput()
- validators helper

**Resultado esperado**: 
- Si válido: campo verde, guarda automáticamente
- Si inválido: campo rojo, muestra error inline

---

#### **Paso 7: Usuario Modifica Templates Folder**

**Actor**: Usuario

**Acción**: Usuario hace click en "Templates Folder", modifica ruta (ej: "100-VAULT/templates")

**Componentes invocados**:
- Text input handler
- Path selector (opcional)

**Resultado esperado**: Campo actualizado

---

#### **Paso 8: Validar Templates Folder Path**

**Actor**: configAdapter

**Acción**: Sistema valida ruta:
- Formato válido (sin caracteres especiales)
- No contiene ../
- Folder existe en vault (o será creado automáticamente)

**Componentes invocados**:
- pathUtils helper
- Vault API (check folder existence)

**Resultado esperado**:
- Si válido: guarda automáticamente
- Si inválido: muestra error "Invalid path"

---

#### **Paso 9: Usuario Modifica Scripts Folder**

**Actor**: Usuario

**Acción**: Similar a Paso 7, usuario modifica Scripts Folder path

**Componentes invocados**:
- Text input + validation

**Resultado esperado**: Ruta validada y guardada

---

#### **Paso 10: Usuario Toggle Notifications**

**Actor**: Usuario

**Acción**: Usuario hace click en switch "Enable Notifications" para habilitar/deshabilitar

**Componentes invocados**:
- Toggle switch handler
- onChange callback

**Resultado esperado**: Switch visual actualizado, valor guardado

---

#### **Paso 11: Usuario Toggle Auto-Capture**

**Actor**: Usuario

**Acción**: Usuario hace click en switch "Enable Auto-Capture" para habilitar/deshabilitar

**Componentes invocados**:
- Toggle switch handler

**Resultado esperado**: Switch actualizado, valor guardado

---

#### **Paso 12: Persistir Cambios**

**Actor**: Plugin API (saveSettings)

**Acción**: Sistema guarda automáticamente todos los cambios en `.obsidian/plugins/obsidian-repo/data.json`

**Componentes invocados**:
- Plugin.saveData()
- File system API
- JSON serialization

**Resultado esperado**: Archivo data.json actualizado con nueva configuración

---

#### **Paso 13: Confirmar Guardado**

**Actor**: Obsidian Settings UI

**Acción**: Sistema muestra indicador visual de guardado (ej: checkmark, color cambio)

**Componentes invocados**:
- Visual feedback system

**Resultado esperado**: Usuario ve confirmación de que cambios fueron guardados

---

## 6. FLUJOS ALTERNATIVOS

### Flujo Alternativo 6A: Restaurar Valores por Defecto

**Trigger**: Usuario hace click en botón "Reset to Defaults"

**Acciones**:
1. Sistema muestra confirmación: "Reset all settings to defaults?"
2. Si usuario confirma: 
   - Author Name → "Nestor"
   - Templates Folder → "990-UTILIDADES/991-template"
   - Scripts Folder → "990-UTILIDADES/992-script"
   - Enable Notifications → true
   - Enable Auto-Capture → true
3. Guardar cambios automáticamente
4. Mostrar confirmación: "Settings reset to defaults"

**Resultado**: Configuración restaurada a valores originales

---

### Flujo Alternativo 6B: Validación Fallida - Campo con Error

**Trigger**: Usuario ingresa valor inválido en campo

**Acciones**:
1. Sistema detecta error durante validación
2. Campo muestra error inline (color rojo)
3. Mensaje de error: "Invalid path format" o "Name too short"
4. Bloquea guardado del campo hasta que sea válido
5. Usuario puede:
   - Corregir valor → campo válido, guardado automático
   - Deshacer cambio → revertir a valor anterior válido

**Resultado**: Configuración mantiene estado válido anterior

---

### Flujo Alternativo 6C: Cargar Configuración Desde Template

**Trigger**: Usuario selecciona preset de configuración

**Acciones**:
1. Mostrar dropdown: [Personal] [Work] [Research]
2. Si usuario selecciona "Work":
   - Author Name → "Work Team"
   - Templates Folder → "200-WORK/templates"
   - Scripts Folder → "200-WORK/scripts"
   - Enable Notifications → true
3. Guardar configuración presetada

**Resultado**: Configuración presetada cargada

---

## 7. EXCEPCIONES

### Excepción EXC-P02-001: Ruta de Folder No Existe

**Condición**: Usuario ingresa path que no existe en vault

**Causa potencial**:
- Usuario escribió ruta incorrecta
- Folder fue renombrado/eliminado
- Typo en la ruta

**Manejo**:
1. Sistema detecta que folder no existe
2. Mostrar advertencia: "Folder '100-VAULT/templates' not found"
3. Ofrecer opciones:
   - [Create folder automatically]
   - [Edit path]
   - [Keep original]
4. Si usuario elige crear: crear folder y guardar
5. Si elige editar: volver a campo para corrección

**Postcondición en Excepción**: Configuración no cambia hasta que sea válida

---

### Excepción EXC-P02-002: Carácter Inválido en Nombre de Autor

**Condición**: Usuario ingresa caracteres especiales peligrosos

**Causa potencial**:
- Usuario ingresa "<script>" o caracteres XSS
- Caracteres path traversal (../)

**Manejo**:
1. Sistema detecta durante validación
2. Mostrar error: "Contains invalid characters: <, >, /"
3. Campo se vuelve rojo
4. Sugerir corrección
5. No permitir guardado hasta corrección

**Postcondición en Excepción**: Campo rechaza cambio, mantiene valor anterior

---

### Excepción EXC-P02-003: Permiso Denegado al Guardar

**Condición**: No hay permisos de escritura en .obsidian/plugins/

**Causa potencial**:
- Vault en modo read-only
- Problemas de permisos del sistema
- Disco protegido

**Manejo**:
1. Sistema intenta guardar data.json
2. Falla por falta de permisos
3. Mostrar error: "Permission denied - cannot save settings"
4. Bloquear cambios futuros
5. Log error para debugging

**Postcondición en Excepción**: Configuración no persiste, usuario debe reintentar

---

### Excepción EXC-P02-004: Timeout de Validación

**Condición**: Validación de folder tarda > 5 segundos

**Causa potencial**:
- Folder muy grande
- File system lento
- Network vault remota

**Manejo**:
1. Mostrar spinner: "Validating..."
2. Esperar máximo 5 segundos
3. Si timeout: mostrar "Validation timeout - skipping check"
4. Permitir guardar (validación deferred)
5. Log warning

**Postcondición en Excepción**: Campo guardado sin validación completa

---

## 8. POSTCONDICIONES

### Postcondiciones Exitosas

1. **Configuración persistida**
   - Archivo .obsidian/plugins/obsidian-repo/data.json contiene cambios
   - Valores coinciden con lo ingresado por usuario

2. **Plugin re-inicializado**
   - Settings recargados en memoria
   - Módulos utilizan nueva configuración

3. **Usuario informado**
   - Cambios guardados visualmente confirmados
   - No hay errores en consola

4. **Validación completada**
   - Todos los valores son válidos antes de guardar
   - Rutas existen o serán creadas automáticamente

### Postcondiciones Anormales (Excepciones)

- Si EXC-P02-001 (folder no existe): Usuario debe crear folder o editar ruta
- Si EXC-P02-002 (caracteres inválidos): Campo rechaza valor, mantiene anterior
- Si EXC-P02-003 (permiso denegado): Usuario debe reintentar o cambiar permisos
- Si EXC-P02-004 (timeout): Campo guardado sin validación completa

---

## 9. DATOS DE ENTRADA/SALIDA

### Entrada

| Campo | Tipo | Validación | Ejemplo |
|-------|------|-----------|---------|
| Author Name | String | 3-50 chars, no XSS | "Nestor Monroy" |
| Templates Folder | Path | 3-255 chars, no ../ | "990-UTILIDADES/991-template" |
| Scripts Folder | Path | 3-255 chars, no ../ | "990-UTILIDADES/992-script" |
| Enable Notifications | Boolean | true/false | true |
| Enable Auto-Capture | Boolean | true/false | true |

### Salida

| Artefacto | Tipo | Destino | Ejemplo |
|-----------|------|---------|---------|
| data.json | JSON | .obsidian/plugins/obsidian-repo/ | {"author":"Nestor",...} |
| Settings object | Object | Memory | RepositoryManagerSettings |
| Confirmación | UI | Toast | "Settings saved" |

---

## 10. RELACIONES CON OTROS UC

| UC Relacionado | Tipo de Relación | Descripción |
|----------------|------------------|-------------|
| UC-P01 | Precedencia | UC-P01 debe completarse antes |
| UC-001...005b | Dependencia | Todos los UC operacionales usan settings |

---

## 11. OPERACIONES ATÓMICAS RELACIONADAS

| OP ID | Nombre | UC |
|-------|--------|-----|
| OP-CONFIG-001 | Render settings form | UC-P02 Paso 4 |
| OP-CONFIG-002 | Validate input values | UC-P02 Paso 6-9 |
| OP-CONFIG-003 | Check folder existence | UC-P02 Paso 8-9 |
| OP-SETTINGS-SAVE | Persist data.json | UC-P02 Paso 12 |

---

## 12. NOTAS Y CONSIDERACIONES

1. **Auto-save**: Cambios se guardan automáticamente al modificar campo (no requerido botón Save)
2. **Validación en tiempo real**: Feedback inmediato sobre validez de entrada
3. **Valores por defecto**: Todos los campos tienen valores razonables por defecto
4. **Persistencia**: Datos guardados en .obsidian/, persisten entre sesiones
5. **Permiso de usuario**: Usuario DEBE ejecutar UC-P02 antes que UC-001...005b para configuración óptima
6. **Folder creation**: Sistema puede crear folders automáticamente si no existen

---

