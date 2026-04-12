# rclone: Servidor WebDAV - Análisis Profundo

## 📋 Resumen

rclone implementa un **servidor WebDAV completo** en `/cmd/serve/webdav/`:
- ✅ **705 líneas** de código en `webdav.go`
- ✅ Usa librería estándar de Go: `golang.org/x/net/webdav`
- ✅ Exposición de **cualquier backend de rclone** vía WebDAV
- ✅ RFC 4918 compliant
- ✅ Soporte para: Basic Auth, Proxy Auth, directorios, archivos
- ✅ Características: ETag, Virtual File System (VFS), Streaming

**Diferencia importante**:
- **Cliente WebDAV** (`backend/webdav/`): Conecta a servidor WebDAV remoto
- **Servidor WebDAV** (`cmd/serve/webdav/`): Expone storage local/remoto como WebDAV

---

## 🏗️ Arquitectura del Servidor

### Uso

```bash
# Exponer S3 como WebDAV
rclone serve webdav s3:mybucket

# Exponer Google Drive como WebDAV
rclone serve webdav gdrive:

# Con autenticación
rclone serve webdav --htpasswd /etc/rclone.htpasswd gdrive:

# En socket Unix (sin auth, usa permisos de archivo)
rclone serve webdav --addr unix:///tmp/webdav.socket gdrive:
```

### Stack de Tecnología

```go
package webdav

import (
    "golang.org/x/net/webdav"  // ← Librería estándar de Go (RFC 4918)
    
    "github.com/rclone/rclone/vfs"  // Virtual File System
    "github.com/rclone/rclone/lib/http/serve"
    "github.com/go-chi/chi/v5"  // Router HTTP
)
```

---

## 🔧 Estructura de Código

### Archivo Principal: `cmd/serve/webdav/webdav.go` (705 líneas)

```go
// Estructura del servidor
type Server struct {
    opt      *Options            // configuración
    f        fs.Fs              // backend (S3, GDrive, etc.)
    vfs      *vfs.VirtualFS     // VFS para acceso a archivos
    handler  *webdav.Handler    // handler WebDAV estándar de Go
    router   chi.Router          // router HTTP
}

// Configuración
type Options struct {
    Auth          libhttp.AuthConfig      // Autenticación
    HTTP          libhttp.Config          // Configuración HTTP
    EtagHash      string                  // Qué hash usar para ETag
    DisableDirList bool                  // Deshabilitar listado HTML
    DisableZip     bool                  // Deshabilitar ZIP download
}
```

### Librería `golang.org/x/net/webdav`

Go proporciona una implementación estándar de WebDAV:

```go
// Interfaz que debe implementar el backend
type FileSystem interface {
    Mkdir(ctx context.Context, name string, perm os.FileMode) error
    OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (File, error)
    RemoveAll(ctx context.Context, name string) error
    Rename(ctx context.Context, oldName, newName string) error
    Stat(ctx context.Context, name string) (os.FileInfo, error)
}

// Handler WebDAV que implementa http.Handler
type Handler struct {
    FileSystem FileSystem
    LockSystem LockSystem
    Logger     Logger
}

// Automáticamente soporta:
// - PROPFIND
// - PROPPATCH
// - MKCOL
// - GET/HEAD
// - PUT
// - DELETE
// - MOVE
// - COPY
// - LOCK/UNLOCK
```

**rclone lo implementa así**:

```go
// cmd/serve/webdav/webdav.go
type vfsHandler struct {
    vfs *vfs.VirtualFS
}

// Implementa webdav.FileSystem interface
func (h *vfsHandler) Mkdir(ctx context.Context, name string, perm os.FileMode) error {
    return h.vfs.Mkdir(ctx, name, perm)
}

func (h *vfsHandler) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error) {
    return h.vfs.OpenFile(ctx, name, flag, perm)
}

func (h *vfsHandler) RemoveAll(ctx context.Context, name string) error {
    return h.vfs.RemoveAll(ctx, name)
}

func (h *vfsHandler) Rename(ctx context.Context, oldName, newName string) error {
    return h.vfs.Rename(ctx, oldName, newName)
}

func (h *vfsHandler) Stat(ctx context.Context, name string) (os.FileInfo, error) {
    return h.vfs.Stat(ctx, name)
}
```

---

## 📡 Métodos WebDAV que el Servidor Soporta

### Automáticos (vía `golang.org/x/net/webdav`)

El Handler estándar de Go implementa automáticamente:

```
1. PROPFIND    ← Listar directorios, obtener metadata
2. PROPPATCH   ← Modificar propiedades (no siempre funciona)
3. MKCOL       ← Crear directorio
4. GET/HEAD    ← Descargar archivo
5. PUT         ← Subir archivo
6. DELETE      ← Eliminar archivo/directorio
7. MOVE        ← Mover/renombrar
8. COPY        ← Copiar archivo/directorio
9. LOCK/UNLOCK ← Control de concurrencia (opcional)
```

### Personalizados (rclone agrega)

rclone agrega con su router chi:

```go
// Rutas personalizadas
router.Get("/", handleDir)              // Listado HTML
router.Get("/*", handleFile)            // Descarga archivo
router.Post("/*", handleFileWrite)      // Subida
router.Options("/*", handleOptions)     // CORS
```

---

## 🔐 Autenticación

### 1. Htpasswd (Apache-style)

```bash
# Crear archivo de contraseñas
htpasswd -c /etc/rclone.htpasswd usuario

# Servir con autenticación
rclone serve webdav --htpasswd /etc/rclone.htpasswd gdrive:

# HTTP Request requiere:
GET /archivo.pdf HTTP/1.1
Authorization: Basic dXN1YXJpbzpjb250cmFzZW7Ew1E=

# El servidor verifica contra htpasswd
```

### 2. Basic Auth con Usuario/Contraseña

```go
// Parámetro: --user usuario --pass contraseña
type AuthConfig struct {
    User string
    Pass string
}

// Validación
if username != config.User || password != config.Pass {
    http.Error(w, "Unauthorized", http.StatusUnauthorized)
}
```

### 3. Proxy Auth (para behind proxy)

```bash
# Si está detrás de un proxy que autentica
rclone serve webdav --auth-proxy https://auth-server gdrive:
```

### 4. Unix Socket (sin auth)

```bash
# Socket Unix - la autenticación es vía permisos del socket
rclone serve webdav --addr unix:///tmp/webdav.socket gdrive:

# Solo procesos con permisos en /tmp/webdav.socket pueden conectar
ls -l /tmp/webdav.socket
srw-rw---- 1 root rclone 0 ...
```

---

## 📁 Virtual File System (VFS)

El servidor **NO accede directamente** al backend. Usa la capa VFS de rclone:

```go
// rclone/vfs - Virtual File System
type VirtualFS struct {
    root     *Dir              // directorio raíz
    cache    *cache.Cache      // cache de metadata
    fs       fs.Fs            // backend (S3, GDrive, etc.)
    mu       sync.Mutex
    
    // Opciones
    CacheMode   CacheMode     // off, minimal, writes, full
    CacheTTL    time.Duration // tiempo de caché
}

// Operaciones
func (vfs *VirtualFS) Mkdir(ctx context.Context, name string, perm os.FileMode) error
func (vfs *VirtualFS) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (File, error)
func (vfs *VirtualFS) RemoveAll(ctx context.Context, name string) error
func (vfs *VirtualFS) Rename(ctx context.Context, oldName, newName string) error
func (vfs *VirtualFS) Stat(ctx context.Context, name string) (os.FileInfo, error)
```

### VFS Cache Modes

```bash
# off       - Sin caché (más lento, menos memoria)
rclone serve webdav --vfs-cache-mode off gdrive:

# minimal   - Solo caché metadatos
rclone serve webdav --vfs-cache-mode minimal gdrive:

# writes    - Caché escrituras (default)
rclone serve webdav --vfs-cache-mode writes gdrive:

# full      - Caché todo (más rápido, más memoria)
rclone serve webdav --vfs-cache-mode full gdrive:
```

---

## 🔄 Flujo de Operación

### Descarga de Archivo (GET)

```
Cliente WebDAV (Nextcloud, WinSCP, etc.)
    │
    ├─ GET /directorio/archivo.pdf
    │
    ▼
rclone serve webdav
    │
    ├─ HTTP Handler
    ├─ VirtualFS: Stat("/directorio/archivo.pdf")
    ├─ Backend: Describe(remoteFile)
    │
    ├─ VirtualFS: OpenFile(...)
    ├─ Backend: Open() → Stream (S3, GDrive, etc.)
    │
    └─ HTTP Response: 200 OK + stream de datos
```

### Subida de Archivo (PUT)

```
Cliente WebDAV
    │
    ├─ PUT /directorio/archivo.pdf + contenido
    │
    ▼
rclone serve webdav
    │
    ├─ HTTP Handler
    ├─ VirtualFS: OpenFile("/directorio/archivo.pdf", O_CREATE)
    │
    ├─ (Si cache enabled) Guardar en caché local
    │
    ├─ Backend: Upload() → S3, GDrive, etc.
    │
    └─ HTTP Response: 201 Created
```

### Listar Directorio (PROPFIND)

```
Cliente WebDAV
    │
    ├─ PROPFIND /directorio/ (Depth: 1)
    │
    ▼
rclone serve webdav
    │
    ├─ golang.org/x/net/webdav Handler
    ├─ VirtualFS: OpenFile("/directorio")
    ├─ VirtualFS: Readdir() → lista de archivos
    │
    ├─ Para cada archivo:
    │   ├─ Stat() → obtener metadata
    │   ├─ Calcular ETag (si configured)
    │   └─ Generar <response> XML
    │
    └─ HTTP Response: 207 Multi-Status + XML
```

---

## ⚙️ Opciones Principales

### HTTP Server

```bash
# Puerto (default: 127.0.0.1:8080)
rclone serve webdav --addr 0.0.0.0:8080 gdrive:

# HTTPS/TLS
rclone serve webdav \
    --cert /etc/letsencrypt/live/domain/fullchain.pem \
    --key /etc/letsencrypt/live/domain/privkey.pem \
    gdrive:

# Max header size
rclone serve webdav --max-header-bytes 8192 gdrive:
```

### VFS Options

```bash
# Cache
rclone serve webdav --vfs-cache-mode full gdrive:

# Max file size en caché
rclone serve webdav --vfs-cache-max-size 10G gdrive:

# TTL de caché
rclone serve webdav --vfs-cache-poll-interval 1m gdrive:

# Read-only
rclone serve webdav --read-only gdrive:
```

### WebDAV Specific

```bash
# ETag hash (para If-Match headers)
rclone serve webdav --etag-hash MD5 gdrive:
rclone serve webdav --etag-hash SHA1 gdrive:
rclone serve webdav --etag-hash auto gdrive:  # Auto-detect

# Deshabilitar listado HTML
rclone serve webdav --disable-dir-list gdrive:

# Deshabilitar descarga ZIP
rclone serve webdav --disable-zip gdrive:
```

---

## 📊 Tabla Comparativa: Cliente vs Servidor WebDAV

| Aspecto | Cliente | Servidor |
|---------|--------|----------|
| **Ubicación** | `backend/webdav/` | `cmd/serve/webdav/` |
| **Líneas de código** | 1,684 | 705 |
| **Librería** | Implementación propia | `golang.org/x/net/webdav` |
| **Función** | Conecta a servidor remoto | Expone backend local como server |
| **RFC 4918** | Parcial (métodos básicos) | Completo (estándar de Go) |
| **Autenticación** | Basic, Bearer, NTLM | Basic, Htpasswd, Proxy |
| **Streaming** | Sí (no carga en memoria) | Sí (via VFS) |
| **Caching** | Metadata caché | VFS cache modes |
| **Performance** | Optimizado (pacer, singleflight) | Optimizado (VFS) |
| **Caso uso** | Sincronizar desde servidor remoto | Exponer almacenamiento local |

---

## 🎯 Cuando Usar Cada Uno

### Usar Cliente WebDAV (`backend/webdav/`)

```bash
# Sincronizar de Nextcloud a S3
rclone sync webdav:nextcloud s3:mybucket

# Backup de Nextcloud a local
rclone copy webdav:nextcloud /backup/nextcloud

# Mount de Nextcloud (FUSE)
rclone mount webdav:nextcloud /mnt/nextcloud

# Necesitas conectarte a servidor remoto
```

### Usar Servidor WebDAV (`serve webdav`)

```bash
# Exponer S3 como WebDAV (para applications que solo hablan WebDAV)
rclone serve webdav s3:mybucket

# Exponer Google Drive como WebDAV (para Nextcloud, WinSCP, etc.)
rclone serve webdav gdrive:

# Crear un "proxy" WebDAV transparente
rclone serve webdav --addr 0.0.0.0:8080 s3:mybucket

# Necesitas acceder a datos locales vía WebDAV
```

---

## 🛠️ Implementación Técnica

### Inicialización del Handler

```go
// cmd/serve/webdav/webdav.go ~ línea 250+
func newWebDAV(ctx context.Context, f fs.Fs, opt *Options, ...) (*Server, error) {
    // 1. Crear VirtualFS
    vfsFS := vfs.New(f, &vfsOpt)
    
    // 2. Crear handler WebDAV que envuelve VFS
    fsHandler := &vfsHandler{vfs: vfsFS}
    
    // 3. Crear handler de Go
    davHandler := &webdav.Handler{
        FileSystem: fsHandler,
        LockSystem: webdav.NewMemoryLockSystem(),
        Logger: func(r *http.Request, err ...interface{}) {
            fs.Debugf(nil, "%s %s", r.Method, r.URL.Path)
        },
    }
    
    // 4. Registrar en router
    router := chi.NewRouter()
    router.Handle("/*", davHandler)  // Todos los métodos WebDAV
    
    // 5. Agregar rutas personalizadas
    router.Get("/*", handleDirOrFile)
    
    return &Server{
        opt: opt,
        f: f,
        vfs: vfsFS,
        handler: davHandler,
        router: router,
    }, nil
}
```

---

## ✅ Conclusión

**rclone Servidor WebDAV es**:
- ✅ Simple (delega a `golang.org/x/net/webdav`)
- ✅ Completo (RFC 4918 compliant)
- ✅ Flexible (expone cualquier backend)
- ✅ Seguro (con autenticación integrada)
- ✅ Performante (con VFS caching)

**Para Chronex**:
- **Cliente**: Usar gowebdav o patrón de rclone para sincronizar
- **Servidor**: Podrías usar `golang.org/x/net/webdav` si necesitas exponer storage local

**Dato importante**: rclone sabe que existen AMBAS operaciones:
- Conectar a servidor remoto (cliente)
- Exponer como servidor (serve webdav)

Para Chronex necesitas probablemente la **operación cliente** (conectar a Nextcloud, S3, etc.)
