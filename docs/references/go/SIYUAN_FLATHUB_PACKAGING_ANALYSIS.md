# SiYuan Flatpak: Análisis de Empaquetamiento y Distribución

## 📋 Resumen Ejecutivo

El repositorio `github.com/flathub/org.b3log.siyuan` es el **empaquetamiento de SiYuan para Flathub**, un repositorio centralizado de aplicaciones Linux.

- ✅ **No es el código fuente** de SiYuan (ese está en github.com/siyuan-note/siyuan)
- ✅ **Es la configuración de distribución** para Flathub
- ✅ **Actualiza automáticamente** desde releases oficiales de GitHub
- ✅ **Incluye metadatos** para mostrar en Flathub
- ✅ **Maneja permisos de Flatpak** (sandbox)

---

## 🏗️ Estructura del Repositorio

```
org.b3log.siyuan/ (Flathub Packaging)
├── org.b3log.siyuan.yml          ← Configuración de build (Flatpak manifest)
├── org.b3log.siyuan.metainfo.xml ← Metadatos para Flathub
├── org.b3log.siyuan.desktop      ← Descriptor de aplicación desktop
├── start-siyuan.sh               ← Script de inicio personalizado
├── README.md                      ← Documentación y notas para usuarios
├── flathub.json                  ← Metadata de Flathub
└── .git/                         ← Repositorio Git
```

---

## 🎯 Para Qué Se Usa SiYuan

SiYuan es una **aplicación de gestión de conocimiento personal** (Personal Knowledge Management - PKM).

### Qué es SiYuan

```
SiYuan = Obsidian/Roam Research + Control Total de Datos + Sincronización

Descripción oficial: "A privacy-first personal knowledge management system"

Características principales:
- ✅ Block-level editing (edición a nivel de bloques de contenido)
- ✅ Markdown WYSIWYG (editor visual)
- ✅ Bidirectional links (enlaces bidireccionales como Roam)
- ✅ Outline/List organization (organización jerárquica)
- ✅ Multi-device sync (sincronización entre dispositivos)
- ✅ Privacy-first (datos en tu computadora, no en la nube)
- ✅ Works offline (funciona completamente sin internet)
```

### Comparación con Otras Herramientas

| Característica | Obsidian | Roam Research | SiYuan | Notion | OneNote |
|---|---|---|---|---|---|
| **Block-level editing** | No | Sí | Sí | Sí | No |
| **Markdown nativo** | Sí | No | Sí | Parcial | No |
| **Open source** | No | No | Sí (AGPL) | No | No |
| **Control total datos** | Sí (local) | No | Sí | No | No |
| **Sincronización nativa** | No (necesita Obsidian Sync) | Sí | Sí (WebDAV, S3, etc.) | Sí | Sí |
| **Multiplataforma** | Sí (Desktop+Mobile) | Sí | Sí (Desktop+Mobile) | Sí | Sí |
| **Precio** | $0 (vault local) + pago sync | $15/mes | $0 (local) o ~$5/mes (sync) | $0-$20/mes | Gratuito |

---

## 📦 ¿Por Qué Flatpak?

### Qué es Flatpak

```
Flatpak = "App Store para Linux"

Es un sistema de distribución de aplicaciones para Linux que:
- ✅ Facilita instalación (sin compilar desde fuente)
- ✅ Proporciona sandboxing (seguridad)
- ✅ Maneja dependencias automáticamente
- ✅ Funciona en cualquier distribución Linux
- ✅ Permite actualizaciones automáticas
```

### Por Qué SiYuan Necesita Flatpak

1. **Distribución fácil**: Los usuarios pueden instalar con `flatpak install org.b3log.siyuan`
2. **Multiplataforma**: Funciona en Fedora, Ubuntu, Arch, Debian, etc.
3. **Sandboxing**: Flatpak aísla la aplicación (seguridad)
4. **Actualizaciones**: Se actualiza automáticamente
5. **Sin compilación**: Los usuarios no necesitan compilar desde código fuente

---

## 🔧 Arquitectura del Flatpak Manifest

### org.b3log.siyuan.yml (Configuración de Build)

```yaml
app-id: org.b3log.siyuan
runtime: org.freedesktop.Platform              # Runtime Linux base
runtime-version: 24.08                         # Versión de runtime
sdk: org.freedesktop.Sdk                       # SDK para compilar
base: org.electronjs.Electron2.BaseApp         # Base de Electron
base-version: 24.08

command: start-siyuan.sh                        # Script de inicio

finish-args:                                    # Permisos del sandbox
  - --device=dri                               # Acceso a GPU (gráficos)
  - --persist=SiYuan                           # Persistir carpeta SiYuan
  - --persist=.config/siyuan                   # Persistir config
  - --filesystem=xdg-pictures:ro               # Acceso readonly a fotos
  - --filesystem=xdg-videos:ro                 # Acceso readonly a videos
  - --filesystem=xdg-music:ro                  # Acceso readonly a música
  - --filesystem=xdg-desktop                   # Acceso r/w a Desktop
  - --filesystem=xdg-download                  # Acceso r/w a Downloads
  - --filesystem=xdg-documents                 # Acceso r/w a Documents
  - --share=ipc                                # Compartir IPC
  - --share=network                            # Acceso a red
  - --socket=x11                               # Soporte X11

modules:                                        # Módulos a instalar
  - name: siyuan
    buildsystem: simple
    build-commands:
      - mv "siyuan" ${FLATPAK_DEST}/siyuan     # Copiar binario
      - install -Dm644 org.b3log.siyuan.desktop ...
      - install -Dm755 start-siyuan.sh ...
    sources:
      - type: archive
        dest: siyuan
        url: https://github.com/siyuan-note/siyuan/releases/download/v3.6.3/siyuan-3.6.3-linux.tar.gz
        sha256: 558b8fea7554fdd53ddedfbbb1f084383255d66efd9a04cc97770402c997c9f3
```

### Qué Significa Cada Sección

#### 1. **Runtime y SDK**

```yaml
runtime: org.freedesktop.Platform     # Sistema base (glibc, X11, etc.)
sdk: org.freedesktop.Sdk              # Herramientas de compilación
base: org.electronjs.Electron2.BaseApp # Base de Electron pre-compilada
```

El Flatpak trae su propia **versión de Electron embebida**. Esto significa:
- No necesita versión del sistema
- Consistencia entre sistemas
- Tamaño más grande (~200MB)

#### 2. **Permisos (finish-args)**

```yaml
# GPU / Gráficos
--device=dri                          # Acceso a tarjeta gráfica

# Almacenamiento
--persist=SiYuan                      # Guardar datos persistentemente
--persist=.config/siyuan              # Configuración persistente
--filesystem=xdg-pictures:ro          # Leer fotos (read-only)
--filesystem=xdg-desktop              # Leer/escribir Desktop

# Red y comunicación
--share=network                       # Acceso a internet
--share=ipc                           # Comunicación entre procesos
--socket=x11                          # Soporte para X11
```

#### 3. **Módulos (Instalación)**

```yaml
modules:
  - name: siyuan                      # Nombre del módulo
    buildsystem: simple               # No necesita compilar (es binario precompilado)
    sources:
      - type: archive                 # Tipo: archivo comprimido
        url: ...siyuan-3.6.3-linux.tar.gz
        sha256: [hash para verificación]
    build-commands:
      - mv "siyuan" ${FLATPAK_DEST}/siyuan
      # Copiar otros archivos (desktop, metadatos, scripts)
```

---

## 🚀 Script de Inicio: start-siyuan.sh

### Propósito

Ejecutar SiYuan dentro del sandbox de Flatpak con configuración especial.

### Código Principal

```bash
#!/bin/bash

WORKSPACE_CONFIG_FILE="$HOME/.config/siyuan/workspace.json"

# Crear configuración de workspace al primer inicio
if [ ! -s "$WORKSPACE_CONFIG_FILE" ]; then
    echo "[\"$HOME/SiYuan\"]" > "$WORKSPACE_CONFIG_FILE"
    
    # Notificar al usuario sobre limitaciones de Flatpak
    notify-send "⚠️ Warning" "You can only export documents such as pdf \
to ~/Desktop, ~/Downloads and ~/Documents due to the Flakpak sandbox limitation."
fi

# Argumentos especiales de Chromium/Electron
EXTRA_ARGS=(--enable-features=Vulkan)

# Soporte Wayland (opcional)
WL_DISPLAY="${WAYLAND_DISPLAY:-"wayland-0"}"
if [[ -e "${XDG_RUNTIME_DIR}/${WL_DISPLAY}" ]]; then
    EXTRA_ARGS+=(
        --ozone-platform-hint=auto
        --enable-features=UseOzonePlatform,WaylandWindowDecorations
        --enable-wayland-ime
    )
fi

# Ejecutar SiYuan dentro de Flatpak
zypak-wrapper /app/siyuan/siyuan $@ ${EXTRA_ARGS[@]}
```

### Qué Hace Línea por Línea

```
1. Definir ruta de configuración de workspace
2. Si es primer inicio, crear workspace.json por defecto en ~/SiYuan
3. Mostrar notificación sobre limitaciones de Flatpak
4. Habilitar Vulkan (aceleración gráfica)
5. Detectar si hay Wayland disponible
6. Si hay Wayland, habilitar soporte moderno
7. Usar zypak-wrapper para ejecutar dentro del sandbox de Flatpak
```

### Variables Importantes

```bash
$FLATPAK_ID              # "org.b3log.siyuan"
${XDG_RUNTIME_DIR}       # Directorio temporal de Flatpak
$WORKSPACE_CONFIG_FILE   # ~/.config/siyuan/workspace.json
zypak-wrapper            # Utilidad Flatpak para ejecutar aplicaciones
```

---

## 📁 Cambios en Versión 3.1.8+: Rutas de Directorio

### Problema: Flatpak Sandbox

En versiones anteriores, SiYuan guardaba datos en `~/SiYuan`. En v3.1.8+, cambió a `~/.var/app/org.b3log.siyuan/` para cumplir mejor con estándares de Flatpak.

### Migración de Datos

```
ANTES (v3.1.7)           AHORA (v3.1.8+)
────────────────────────────────────────────────────────────────

~/SiYuan/                ~/.var/app/org.b3log.siyuan/SiYuan/
Workspace                Workspace (movido aquí)

~/.config/siyuan/        ~/.var/app/org.b3log.siyuan/.config/siyuan/
Config                   Config (en sandbox)

~/.config/SiYuan/        ~/.var/app/org.b3log.siyuan/.config/SiYuan/
~/.config/SiYuan-Electron/  ~/.var/app/org.b3log.siyuan/.config/SiYuan-Electron/
```

### Por Qué el Cambio

```yaml
finish-args:
  - --persist=SiYuan              # Antes: usar $HOME directamente
  - --persist=.config/siyuan      # Antes: usar $HOME/.config

Ahora usa:
  - XDG_CONFIG_HOME              # Seguir estándares XDG
  - XDG_DATA_HOME                # Almacenamiento en sandbox específico
```

**Ventaja**: Mejor aislamiento. Cada Flatpak tiene su próprio "home" virtual.

---

## 🔐 Restricciones de Sandbox (Flatpak)

### Permisos Permitidos por Defecto

```
READ-ONLY (lectura):
  ~/Pictures/     → Ver imágenes
  ~/Videos/       → Ver vídeos
  ~/Music/        → Escuchar música

READ-WRITE (lectura y escritura):
  ~/Desktop/      → Exportar documentos
  ~/Downloads/    → Exportar documentos
  ~/Documents/    → Crear workspace nuevo
```

### Limitaciones de Sandbox

| Funcionalidad | Disponible | Razón |
|---|---|---|
| Editar notas | ✅ Sí | Dentro de ~/SiYuan |
| Exportar PDF | ✅ Sí | A ~/Desktop/Downloads/Documents |
| Ver fotos | ✅ Sí | Acceso read-only |
| Acceder ~/ | ❌ No | Sandbox restriction |
| Acceder /home | ❌ No | Sandbox restriction |
| Input method (IBus) | ❌ No (Wayland) | Limitación de Electron en Wayland |

### Cómo Expandir Permisos

```bash
# Dar acceso read-write a $HOME
flatpak override --user --filesystem=home org.b3log.siyuan

# Dar acceso a Wayland
flatpak override --user --socket=wayland org.b3log.siyuan

# Usar Flatseal (GUI)
flatpak install flathub com.github.tchx84.Flatseal
# Luego abrir Flatseal y editar org.b3log.siyuan
```

---

## 📋 Metadatos: org.b3log.siyuan.metainfo.xml

### Información para Flathub

```xml
<component type="desktop-application">
  <id>org.b3log.siyuan</id>
  <name>SiYuan</name>
  <summary>A privacy-first personal knowledge management system</summary>
  
  <description>
    <p>Block editing: edición a nivel de bloques</p>
    <p>Privacy security: datos encriptados en tu dispositivo</p>
    <p>Bidirectional link: enlaces bidireccionales</p>
    <p>Multi-device data sync: sincronización entre dispositivos</p>
  </description>
  
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>AGPL-3.0</project_license>
  
  <launchable type="desktop-id">org.b3log.siyuan.desktop</launchable>
  
  <screenshots>
    <screenshot type="default">
      <image>https://b3log.org/siyuan/static/home-img.png</image>
    </screenshot>
  </screenshots>
  
  <releases>
    <release version="3.6.3" date="2026-04-02"/>
    <release version="3.6.2" date="2026-03-31"/>
  </releases>
</component>
```

### Propósito

Proporcionar información a Flathub para mostrar en su interfaz:
- Nombre y descripción
- Screenshots
- Historial de versiones
- Enlaces (homepage, bugtracker, donation)
- Licencia

---

## 🔄 Ciclo de Actualización

### Cómo Se Actualiza SiYuan en Flathub

```
1. SiYuan Release (github.com/siyuan-note/siyuan)
   ↓
   Lanza v3.6.3 con URL: .../v3.6.3/siyuan-3.6.3-linux.tar.gz

2. Flathub Bot Detección (x-checker-data)
   ↓
   El bot detecta nueva release automáticamente
   ↓
   ```yaml
   x-checker-data:
     is-main-source: true
     type: anitya                    # Servicio de detección
     project-id: 358424
     url-template: https://github.com/siyuan-note/siyuan/releases/download/v$version/siyuan-$version-linux.tar.gz
   ```

3. Crear PR en Flathub
   ↓
   Actualizar versión y SHA256 en org.b3log.siyuan.yml

4. Build en Servidor Flathub
   ↓
   Construir Flatpak con nueva versión

5. Usuarios Reciben Actualización
   ↓
   `flatpak update org.b3log.siyuan`
```

---

## 💡 Relación con Chronex

### Qué Aprender de SiYuan Flatpak

1. **Modelo de Distribución**:
   - SiYuan usa Flatpak para distribución en Linux
   - Chronex podría hacer algo similar (Snap para Ubuntu, AppImage, etc.)

2. **Manejo de Datos**:
   - SiYuan guarda notas en `~/SiYuan` (local)
   - Sincroniza via WebDAV, S3, u otros (nuestro análisis anterior)
   - Chronex debería seguir patrón similar

3. **Sandbox y Permisos**:
   - Flatpak proporciona sandbox automático
   - Chronex necesitará manejo explícito de permisos
   - Almacenamiento persistente (SQLite local)

4. **Metadata y Distribución**:
   - AppStream XML para describir aplicación
   - Desktop file para integración con escritorio
   - Historial de versiones

### Diferencias de Chronex

| Aspecto | SiYuan | Chronex |
|---|---|---|
| **Licencia** | AGPL-3.0 | (TBD) |
| **Distribución** | Flathub + AppImage + GitHub Releases | TBD |
| **Plataforma** | Desktop (Electron) + Mobile | Desktop (Electron) + Mobile |
| **Sincronización** | Integrada en SiYuan | Será nuestro punto fuerte |
| **Código Abierto** | Sí | Sí (objetivo) |

---

## ✅ Conclusión

El repositorio `flathub/org.b3log.siyuan` es:

1. **No es código de SiYuan**, es **packaging para distribución**
2. **Automatiza actualización** desde releases oficiales
3. **Configura sandbox** (permisos de Flatpak)
4. **Proporciona metadatos** para Flathub
5. **Facilita instalación** a usuarios de Linux

SiYuan mismo es una **herramienta PKM privada** con sincronización nativa, similar a Obsidian pero con features más modernas y control total de datos.

Para **Chronex**, SiYuan es un **referente importante** en:
- Cómo manejar sincronización (WebDAV, S3)
- Cómo distribuir aplicaciones (Flatpak, packaging)
- Cómo implementar block-level editing y links bidireccionales
