```yaml
type: Caso de Uso Formal
title: UC-P01 - INSTALAR PLUGIN
version: 1.0.0
scope: SETUP - Sistema Plugin Obsidian
date: 2026-04-11
language: Español Mexicano - Técnico Profesional
status: Especificación Completada
```

# UC-P01: INSTALAR PLUGIN

## 1. IDENTIFICACIÓN

| Atributo | Valor |
|----------|-------|
| **ID** | UC-P01 |
| **Nombre** | Instalar Plugin |
| **Versión** | 1.0.0 |
| **Estado** | Especificación Completada |
| **Responsable** | Especificador de Casos de Uso |
| **Fecha Creación** | 2026-04-11 |
| **Fecha Última Actualización** | 2026-04-11 |
| **Prioridad** | CRÍTICA (Sprint 0) |
| **Complejidad** | BAJA |
| **Operaciones Atómicas** | OP-INSTALL-001, OP-INSTALL-002, OP-INSTALL-003, OP-LOAD-PLUGIN |

---

## 2. DESCRIPCIÓN BREVE

El usuario accede a configuración de Obsidian (Community Plugins → Browse), busca "Obsidian Repository Manager", descarga el plugin desde el registro oficial. Sistema Obsidian carga automaticamente manifest.json, descomprime archivos, registra 5 comandos en Command Palette, inyecta dependencias (App API), carga módulos utils/helpers/adapters y añade settings tab. Usuario recibe confirmación visual de plugin habilitado y disponible.

---

## 3. ACTORES INVOLUCRADOS

| Actor | Tipo | Rol | Responsabilidad |
|-------|------|-----|-----------------|
| **Usuario (Nestor)** | Humano | Primario | Abre settings, busca plugin, inicia instalación |
| **Obsidian Community** | Sistema Externo | Secundario | Hosting de plugin, descarga binarios |
| **Obsidian Core** | Componente Externo | Secundario | Carga plugin, registra comandos, inyecta API |
| **Plugin Loader** | Componente Interno | Secundario | Valida manifest.json, descomprime, inicializa |
| **main.ts** | Módulo Principal | Consumidor | Ejecuta onload(), registra eventos |

---

## 4. PRECONDICIONES

### Precondiciones Técnicas

1. **Obsidian instalado y funcionando**
   - Obsidian versión 1.5.0 o superior
   - Vault ya creado y accesible
   - Usuario tiene permisos de instalación en sistema

2. **Conexión a internet activa**
   - Conexión a Obsidian Community Registry
   - Velocidad mínima: 1 Mbps
   - Timeout máximo: 30 segundos

3. **Espacio disponible**
   - Mínimo 10 MB libres en disco
   - Directorio .obsidian/plugins/ accesible

4. **Plugins habilitados en Community**
   - Usuario ha activado "Community Plugins" en configuración
   - No existe restricción de instalación (sandbox mode)

### Precondiciones de Negocio

1. Plugin debe estar publicado en Obsidian Community Registry
2. manifest.json debe cumplir especificaciones de Obsidian
3. No debe existir conflicto de ID con otro plugin
4. Usuario busca automatizar creación de notas estructuradas

---

## 5. FLUJO PRINCIPAL

### Descripción General

El usuario inicia desde Settings → Community Plugins → Browse, busca el plugin en registro, solicita instalación, y sistema descarga/carga automáticamente. Toma ~15-30 segundos.

### Pasos Detallados

---

#### **Paso 1: Acceder a Community Plugins**

**Actor**: Usuario

**Acción**: Usuario abre Settings (Obsidian gear icon), navega a "Community plugins", hace click en "Browse"

**Componentes invocados**: 
- Obsidian Settings panel
- Plugin Manager UI
- Community Registry endpoint

**Resultado esperado**: Página de búsqueda de Community Plugins abierta, buscador activo

---

#### **Paso 2: Buscar Plugin**

**Actor**: Usuario

**Acción**: Usuario ingresa "obsidian-repo" o "repository manager" en buscador, presiona Enter

**Componentes invocados**:
- Community Registry search API
- Plugin index (filtro por nombre/descripción)

**Resultado esperado**: Plugin "Obsidian Repository Manager" aparece en resultados, primera posición

---

#### **Paso 3: Ver Detalles del Plugin**

**Actor**: Usuario

**Acción**: Usuario hace click en card del plugin, ve detalles (descripción, autor, versión, minAppVersion)

**Componentes invocados**:
- Plugin metadata (manifest.json)
- Community Registry display

**Resultado esperado**: Panel de detalles muestra:
- Nombre: "Obsidian Repository Manager"
- Autor: "Nestor Monroy"
- Versión: "1.0.0"
- minAppVersion: "1.5.0"
- Descripción completa

---

#### **Paso 4: Iniciar Descarga**

**Actor**: Usuario

**Acción**: Usuario hace click en botón "Install" o "Download"

**Componentes invocados**:
- Obsidian plugin downloader
- Community Registry manifest endpoint
- Binary download service (main.js)

**Resultado esperado**: Descarga inicia, barra de progreso visible (5-10 segundos típico)

---

#### **Paso 5: Descomprimir Archivos**

**Actor**: Obsidian Plugin Manager

**Acción**: Sistema descomprime archivo descargado en `.obsidian/plugins/obsidian-repo/`

**Componentes invocados**:
- File system API
- Zip extractor
- Permissions manager

**Resultado esperado**: Archivos extraídos:
- main.js
- manifest.json
- styles.css

---

#### **Paso 6: Validar manifest.json**

**Actor**: Obsidian Plugin Loader

**Acción**: Sistema valida manifest.json contra especificaciones Obsidian

**Componentes invocados**:
- Manifest validator
- Version checker

**Resultado esperado**: 
- ID válido: "obsidian-repo" ✓
- minAppVersion: "1.5.0" ✓
- Todos los campos requeridos presentes ✓

---

#### **Paso 7: Cargar main.js**

**Actor**: Obsidian Plugin Loader

**Acción**: Sistema ejecuta main.js (entry point compilado con esbuild)

**Componentes invocados**:
- CommonJS loader
- Obsidian API injector
- Module resolver

**Resultado esperado**: main.js cargado en memoria, export default function disponible

---

#### **Paso 8: Ejecutar onload()**

**Actor**: src/main.ts (main.js compilado)

**Acción**: Plugin class invoca método onload() que:
1. Carga settings desde persistencia
2. Registra 5 comandos en Command Palette
3. Añade settings tab a UI
4. Suscribe a eventos de Obsidian

**Componentes invocados**:
- Plugin.onload() lifecycle
- App.commands.addCommand() x 5
- App.addSettingTab()
- loadSettings()

**Resultado esperado**: Plugin completamente inicializado sin errores

---

#### **Paso 9: Registrar Comandos**

**Actor**: src/main.ts

**Acción**: Sistema registra 5 comandos:

1. `repo-create-repository` → "Create Repository"
2. `repo-create-task` → "Create Task"
3. `repo-create-project` → "Create Project"
4. `repo-create-pillar` → "Create Pillar"
5. `repo-create-fleeting-note` → "Create Fleeting Note"

**Componentes invocados**:
- Command registry
- Hotkey system
- Command palette indexer

**Resultado esperado**: Todos los comandos aparecen en Command Palette (Ctrl+P)

---

#### **Paso 10: Cargar Settings Tab**

**Actor**: src/main.ts

**Acción**: Sistema añade RepositoryManagerSettingTab a UI configuración

**Componentes invocados**:
- PluginSettingTab class
- Settings UI renderer

**Resultado esperado**: Tab "Obsidian Repository Manager" aparece en Community Plugins → Options

---

#### **Paso 11: Mostrar Confirmación**

**Actor**: Obsidian Plugin Manager

**Acción**: Sistema muestra notificación de éxito al usuario

**Componentes invocados**:
- Notice API
- Toast notification

**Resultado esperado**: Notificación: "Plugin installed successfully. Enable it to get started."

---

#### **Paso 12: Habilitar Plugin (Optional)**

**Actor**: Usuario

**Acción**: Usuario hace click en toggle para habilitar plugin (o está automáticamente habilitado)

**Componentes invocados**:
- Plugin enablement API
- Settings persistence

**Resultado esperado**: Plugin habilitado, comandos disponibles en Command Palette

---

## 6. FLUJOS ALTERNATIVOS

### Flujo Alternativo 6A: Instalación Manual

**Trigger**: Usuario descarga plugin manualmente desde GitHub releases

**Acciones**:
1. Usuario descarga main.js, manifest.json, styles.css
2. Usuario crea folder `.obsidian/plugins/obsidian-repo/`
3. Usuario copia archivos al folder
4. Usuario reinicia Obsidian
5. Plugin aparece en Community Plugins list
6. Continuar desde Paso 9 (registrar comandos)

**Resultado**: Plugin instalado, funcional

---

### Flujo Alternativo 6B: Actualizar Plugin Existente

**Trigger**: Usuario tiene versión anterior instalada

**Acciones**:
1. Sistema detecta nueva versión disponible
2. Mostrar botón "Update" en lugar de "Install"
3. Descargar nueva versión
4. Desactivar plugin anterior
5. Reemplazar archivos
6. Reactivar plugin
7. Mostrar changelog

**Resultado**: Plugin actualizado sin perder settings

---

### Flujo Alternativo 6C: Instalación Fallida - Reintentar

**Trigger**: Descarga interrumpida o timeout

**Acciones**:
1. Mostrar error: "Download failed. Retrying..."
2. Esperar 3 segundos
3. Reintentar descarga (máximo 3 intentos)
4. Si falla: mostrar error permanente
5. Ofrecer link a manual installation

**Resultado**: Si éxito después de reintentos, continuar flujo principal. Si fracaso, usuario puede instalar manualmente.

---

## 7. EXCEPCIONES

### Excepción EXC-P01-001: Plugin No Encontrado en Registry

**Condición**: Usuario busca plugin pero no aparece en resultados

**Causa potencial**: 
- Plugin aún no publicado en Community Registry
- Nombre de búsqueda incorrecto
- Internet sin conexión

**Manejo**:
1. Sistema muestra: "Plugin not found"
2. Sugerir búsqueda alternativa
3. Link a GitHub: https://github.com/NestorMonroy/obsidian-repo
4. Opción para instalación manual

**Postcondición en Excepción**: Ningún archivo descargado, vault sin cambios

---

### Excepción EXC-P01-002: Versión de Obsidian Incompatible

**Condición**: Obsidian versión < 1.5.0

**Causa potencial**:
- Usuario tiene Obsidian antiguo
- minAppVersion: "1.5.0" no cumplido

**Manejo**:
1. Sistema muestra: "This plugin requires Obsidian 1.5.0 or newer"
2. Mostrar versión actual del usuario
3. Link a descarga de Obsidian latest
4. Bloquear instalación

**Postcondición en Excepción**: Plugin NO instalado

---

### Excepción EXC-P01-003: Espacio en Disco Insuficiente

**Condición**: Menos de 10 MB disponibles

**Cause potencial**:
- Disco lleno
- Permisos insuficientes en .obsidian/

**Manejo**:
1. Sistema detecta espacio insuficiente
2. Mostrar: "Insufficient disk space (need 10 MB)"
3. Sugerir liberar espacio
4. Cancelar descarga
5. Limpiar archivos parcialmente descargados

**Postcondición en Excepción**: Ningún archivo descargado, .obsidian/ sin cambios

---

### Excepción EXC-P01-004: Timeout de Descarga

**Condición**: Descarga tarda > 60 segundos

**Causa potencial**:
- Conexión lenta
- Servidor de Community Registry inaccesible
- Firewall bloqueando descarga

**Manejo**:
1. Mostrar: "Download timed out (60s)"
2. Ofrecer reintentar (máximo 3 veces)
3. Si falla permanentemente: ofrecer manual installation
4. Log error para debugging

**Postcondición en Excepción**: Descarga cancelada, archivos limpios

---

### Excepción EXC-P01-005: Conflicto de ID de Plugin

**Condición**: Plugin con ID "obsidian-repo" ya instalado

**Causa potencial**:
- Usuario intenta instalar dos veces
- Versión anterior no desinstalada correctamente

**Manejo**:
1. Sistema detecta conflicto
2. Mostrar: "Plugin with ID 'obsidian-repo' already installed"
3. Ofrecer: [Update] [Reinstall] [Cancel]
4. Update: descargar versión nueva, reemplazar
5. Reinstall: desinstalar anterior + instalar nuevo

**Postcondición en Excepción**: Una única versión del plugin activa

---

## 8. POSTCONDICIONES

### Postcondiciones Exitosas

1. **Plugin instalado**
   - Directorio `.obsidian/plugins/obsidian-repo/` existe
   - main.js descargado y descomprimido
   - manifest.json validado y registrado

2. **Plugin inicializado**
   - Plugin class instanciada
   - onload() ejecutado sin errores
   - 5 comandos registrados en Command Palette

3. **Configuración lista**
   - Settings tab disponible
   - Valores por defecto cargados
   - Persistencia configurada

4. **Interfaz actualizada**
   - Comandos visibles en Command Palette
   - Settings tab accesible
   - Plugin visible en Community Plugins list

5. **Usuario informado**
   - Notificación de éxito mostrada
   - Plugin listo para usar
   - Documentación accesible (README.md)

### Postcondiciones Anormales (Excepciones)

- Si EXC-P01-002 (versión incompatible): Plugin NO instalado
- Si EXC-P01-003 (sin espacio): Plugin NO instalado, disco sin cambios
- Si EXC-P01-004 (timeout): Descarga cancelada, reintentos agotados
- Si EXC-P01-005 (conflicto): Versión anterior reemplazada o actualizada

---

## 9. DATOS DE ENTRADA/SALIDA

### Entrada

| Parámetro | Tipo | Origen | Ejemplo |
|-----------|------|--------|---------|
| Query búsqueda | String | Usuario | "obsidian-repo" |
| Plugin ID | String | Community Registry | "obsidian-repo" |
| Versión deseada | String | Registry | "1.0.0" |
| minAppVersion | String | manifest.json | "1.5.0" |

### Salida

| Artefacto | Tipo | Destino | Ejemplo |
|-----------|------|---------|---------|
| main.js | Binario | .obsidian/plugins/obsidian-repo/ | 250 KB compilado |
| manifest.json | JSON | .obsidian/plugins/obsidian-repo/ | Metadata plugin |
| styles.css | CSS | .obsidian/plugins/obsidian-repo/ | Estilos opcionales |
| Notificación | UI | Obsidian toast | "Plugin installed" |
| Settings data | JSON | .obsidian/plugins/obsidian-repo/data.json | Valores por defecto |

---

## 10. RELACIONES CON OTROS UC

| UC Relacionado | Tipo de Relación | Descripción |
|----------------|------------------|-------------|
| UC-P02 | Precedencia | UC-P01 debe completarse antes que UC-P02 |
| UC-001 | Precedencia | UC-P01 debe completarse antes que UC-001 |
| UC-INT01 | Dependencia | Requiere que UC-P01 esté completado |

---

## 11. OPERACIONES ATÓMICAS RELACIONADAS

| OP ID | Nombre | UC |
|-------|--------|-----|
| OP-INSTALL-001 | Download plugin binary | UC-P01 Paso 4-5 |
| OP-INSTALL-002 | Extract plugin files | UC-P01 Paso 5 |
| OP-INSTALL-003 | Validate manifest.json | UC-P01 Paso 6 |
| OP-LOAD-PLUGIN | Load and initialize plugin | UC-P01 Paso 7-10 |

---

## 12. NOTAS Y CONSIDERACIONES

1. **Seguridad**: Manifest.json se valida antes de cargar main.js para prevenir código malicioso
2. **Performance**: Descarga típica: 5-10 segundos. Carga: <1 segundo
3. **Compatibilidad**: Soporta Obsidian 1.5.0+ en Desktop y Mobile
4. **Offline**: Una vez instalado, plugin funciona sin conexión a internet
5. **Reintentos**: Máximo 3 reintentos automáticos en caso de error temporal

---

