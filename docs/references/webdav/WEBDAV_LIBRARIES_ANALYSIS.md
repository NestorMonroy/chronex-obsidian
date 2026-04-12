# WebDAV en rclone: Análisis Completo de Librerías

## 📋 Resumen Ejecutivo

rclone usa **3 categorías de librerías** para implementar WebDAV:

1. **Librerías Estándar de Go** (net, encoding, etc.)
2. **Librerías Externas** (Azure, chi, golang.org/x)
3. **Librerías Internas de rclone** (rest, pacer, vfs, etc.)

---

## 📦 CLIENTE WEBDAV: Librerías Utilizadas

### Categoría 1: Librerías Estándar de Go

#### 1. `net/http` - Cliente HTTP
```go
import "net/http"

// Usada para:
func (o *Object) Open(...) (io.ReadCloser, error) {
    // Crea requests HTTP GET
}

func (o *Object) Update(...) error {
    // Crea requests HTTP PUT
}
```
**Responsabilidad**: Todos los requests HTTP (PUT, GET, DELETE, PROPFIND, etc.)

---

#### 2. `encoding/xml` - Parsing de respuestas WebDAV
```go
import "encoding/xml"

// Parsea respuestas PROPFIND
type Multistatus struct {
    Responses []Response `xml:"response"`
}

type Response struct {
    Href  string `xml:"href"`
    Props Prop   `xml:"propstat"`
}

type Prop struct {
    Size     int64     `xml:"DAV: prop>getcontentlength"`
    Modified Time      `xml:"DAV: prop>getlastmodified"`
    ETag     string    `xml:"DAV: prop>getetag"`
}

// Uso:
var result api.Multistatus
xml.Unmarshal(respBody, &result)
```
**Responsabilidad**: Parsear XML de respuestas PROPFIND (RFC 4918)

---

#### 3. `net/url` - Parsing y construcción de URLs
```go
import "net/url"

// Construir URLs para WebDAV
func (f *Fs) filePath(path string) string {
    u := url.URL{
        Scheme: f.endpoint.Scheme,
        Host:   f.endpoint.Host,
        Path:   path.Join(f.root, path),
    }
    return u.String()
}
```
**Responsabilidad**: Manejo seguro de URLs y parámetros

---

#### 4. `crypto/tls` - HTTPS/TLS
```go
import "crypto/tls"

// Configurar HTTPS
tlsConfig := &tls.Config{
    InsecureSkipVerify: false,
    // ...
}

httpClient := &http.Client{
    Transport: &http.Transport{
        TLSClientConfig: tlsConfig,
    },
}
```
**Responsabilidad**: Conexiones seguras HTTPS a servidores WebDAV

---

#### 5. `context` - Cancelación y timeouts
```go
import "context"

func (f *Fs) readMetaDataForPath(ctx context.Context, path string) (info *api.Prop, error) {
    // ctx puede ser cancelado por timeout o user
    // Propagar cancelaciones en requests
}
```
**Responsabilidad**: Manejo de ciclo de vida de requests

---

#### 6. `io` - Lectura/escritura de streams
```go
import "io"

func (o *Object) Open(...) (io.ReadCloser, error) {
    // Retorna io.ReadCloser para descargar sin cargar en memoria
}

func (o *Object) Update(in io.Reader, ...) error {
    // Acepta io.Reader para subidas en streaming
}
```
**Responsabilidad**: Streaming de datos sin cargar en memoria

---

#### 7. Otras librerías estándar
```go
import (
    "bytes"      // Buffer de bytes
    "errors"     // Manejo de errores
    "fmt"        // Formatting
    "path"       // Manipulación de rutas
    "regexp"     // Parsing de status HTTP ("HTTP/1.1 200 OK")
    "strconv"    // Conversión string ↔ int
    "strings"    // Manipulación de strings
    "sync"       // Mutex para thread-safety
    "time"       // Timestamps, timeouts
    "os/exec"    // Ejecutar comandos (para bearer token)
)
```

---

### Categoría 2: Librerías Externas

#### 1. `github.com/Azure/go-ntlmssp` (v0.1.0)
```go
import "github.com/Azure/go-ntlmssp"

// Para autenticación NTLM (Sharepoint)
// Negocia NTLM automáticamente
transport := ntlmssp.Negotiator{
    RoundTripper: http.DefaultTransport,
}

httpClient := &http.Client{
    Transport: &transport,
}
```
**Responsabilidad**: 
- ✅ Autenticación NTLM (Sharepoint On-Premises)
- ✅ Negociación de múltiples rounds
- ✅ Cifrado de credenciales

**Línea en código**: `webdav.go:28`

---

#### 2. `golang.org/x/sync/singleflight`
```go
import "golang.org/x/sync/singleflight"

// Evitar requests duplicados
f.authSingleflight := new(singleflight.Group)

// Si 10 goroutines quieren token al mismo tiempo:
token, err, shared := f.authSingleflight.Do("fetch_token", func() (interface{}, error) {
    // Solo se ejecuta UNA VEZ
    return f.refreshBearerToken()
})
// Las 10 goroutines comparten el resultado
```
**Responsabilidad**:
- ✅ Deduplicación de requests concurrentes
- ✅ Optimización de performance
- ✅ Evitar race conditions

**Línea en código**: `webdav.go:29`

---

### Categoría 3: Librerías Internas de rclone

#### 1. `github.com/rclone/rclone/lib/rest` - Cliente REST genérico
```go
import "github.com/rclone/rclone/lib/rest"

// Abstracción HTTP para TODOS los backends
f.srv := rest.NewClient(httpClient)

// Uso genérico:
opts := rest.Opts{
    Method: "PROPFIND",
    Path:   "/archivo.pdf",
    ExtraHeaders: map[string]string{
        "Depth": "0",
    },
}

resp, err := f.srv.CallXML(ctx, &opts, nil, &result)
```
**Responsabilidad**:
- ✅ Abstracción HTTP reutilizable
- ✅ Retry automático
- ✅ Manejo de errores
- ✅ Logging/debugging
- ✅ Parseado de XML/JSON

**Ubicación**: `/lib/rest/`

**Métodos clave**:
```go
func (c *Client) Call(ctx context.Context, opts *Opts) (*http.Response, error)
func (c *Client) CallXML(ctx context.Context, opts *Opts, params, result interface{}) (*http.Response, error)
func (c *Client) CallJSON(ctx context.Context, opts *Opts, params, result interface{}) (*http.Response, error)
```

---

#### 2. `github.com/rclone/rclone/lib/pacer` - Rate limiting
```go
import "github.com/rclone/rclone/lib/pacer"

// Controlar velocidad de requests
f.pacer := fs.NewPacer(ctx, &pacer.Opts{
    MinSleep: 10 * time.Millisecond,  // default
    MaxSleep: 2 * time.Second,
})

// Cada request usa pacer:
err = f.pacer.Call(func() (bool, error) {
    resp, err := f.srv.Call(ctx, &opts)
    return f.shouldRetry(ctx, resp, err)
})
```
**Responsabilidad**:
- ✅ Rate limiting (default: 100 requests/sec)
- ✅ Exponential backoff en errores
- ✅ Evitar sobrecargar servidor

**Ubicación**: `/lib/pacer/`

---

#### 3. `github.com/rclone/rclone/lib/encoder` - Encoding de caracteres
```go
import "github.com/rclone/rclone/lib/encoder"

// Diferentes servidores necesitan encoding distinto
opt.Enc = encoder.MultiEncoder{
    encoder.EncodeWin,           // Para Sharepoint/IIS
    encoder.EncodeHashPercent,   // % en URLs
    encoder.EncodeBackSlash,     // \ en paths
}

// Resultado: caracteres especiales codificados correctamente
encodedPath := opt.Enc.Encode(path)
```
**Responsabilidad**:
- ✅ Codificar caracteres especiales según vendor
- ✅ Sharepoint-NTLM tiene encoding diferente
- ✅ Escapar URLs correctamente

**Ubicación**: `/lib/encoder/`

---

#### 4. `github.com/rclone/rclone/fs` - Sistema de archivos abstracto
```go
import "github.com/rclone/rclone/fs"

// Interfaz que implementa WebDAV
type Fs interface {
    Name() string
    Root() string
    Features() *fs.Features
    List(ctx context.Context, dir string) (objs []Object, dirs []Directory, err error)
    NewObject(ctx context.Context, remote string) (Object, error)
    Put(ctx context.Context, in io.Reader, src ObjectInfo) (Object, error)
    Mkdir(ctx context.Context, path string) error
    Remove(ctx context.Context, path string) error
}

type Object interface {
    Remote() string
    ModTime(ctx context.Context) time.Time
    Size() int64
    Open(ctx context.Context) (io.ReadCloser, error)
    Update(ctx context.Context, in io.Reader, src ObjectInfo) error
}
```
**Responsabilidad**:
- ✅ Define interfaz que implementa WebDAV
- ✅ Permite intercambiabilidad de backends
- ✅ Abstracción común para 70+ backends

**Ubicación**: `/fs/`

---

#### 5. `github.com/rclone/rclone/fs/hash` - Checksums
```go
import "github.com/rclone/rclone/fs/hash"

// Diferentes hashes según servidor
type Type int

const (
    MD5    // OwnCloud/Nextcloud
    SHA1   // OwnCloud/Fastmail
    SHA256
)

// Parsear checksums de PROPFIND
checksums := prop.Hashes()  // Retorna map[Type]string
```
**Responsabilidad**:
- ✅ Tipos de hashes soportados
- ✅ Verificación de integridad
- ✅ ETag basado en hashes

**Ubicación**: `/fs/hash/`

---

#### 6. Librerías de configuración
```go
import (
    "github.com/rclone/rclone/fs/config"               // Config general
    "github.com/rclone/rclone/fs/config/configmap"     // Mapeo de config
    "github.com/rclone/rclone/fs/config/configstruct"  // Structs config
    "github.com/rclone/rclone/fs/config/obscure"       // Ofuscar passwords
    "github.com/rclone/rclone/fs/config/flags"         // CLI flags
)

// Ejemplo
type Options struct {
    URL       string             `config:"url"`
    User      string             `config:"user"`
    Pass      string             `config:"pass"`
    Headers   fs.CommaSepList    `config:"headers"`
}
```
**Responsabilidad**:
- ✅ Parsear configuración de usuario
- ✅ Ofuscar contraseñas (no almacenarlas en texto claro)
- ✅ Validar opciones
- ✅ Integración con CLI

---

#### 7. `github.com/rclone/rclone/backend/webdav/api` - Tipos XML
```go
import "github.com/rclone/rclone/backend/webdav/api"

// Tipos para parsear respuestas PROPFIND
// (Ya cubierto en encoding/xml, pero rclone mantiene tipos propios)
```

---

#### 8. `github.com/rclone/rclone/backend/webdav/odrvcookie` - OneDrive Cookies
```go
import "github.com/rclone/rclone/backend/webdav/odrvcookie"

// Para autenticación con OneDrive
// Maneja renovación automática de cookies
```

---

#### 9. `github.com/rclone/rclone/fs/fshttp` - HTTP helpers
```go
import "github.com/rclone/rclone/fs/fshttp"

// Configuración HTTP compartida
// User-Agent, timeouts, etc.
```

---

## 📦 SERVIDOR WEBDAV: Librerías Utilizadas

### Categoría 1: Librerías Estándar de Go

```go
import (
    "context"       // Lifecycle management
    "encoding/xml"  // Parsear XML (LOCK requests)
    "errors"        // Error handling
    "fmt"           // Formatting
    "mime"          // MIME types (Content-Type)
    "net"           // TCP/UDP networking
    "net/http"      // HTTP server
    "os"            // File operations
    "path"          // Path handling
    "strconv"       // String conversions
    "strings"       // String manipulation
    "time"          // Timestamps
)
```

---

### Categoría 2: Librerías Externas

#### 1. `golang.org/x/net/webdav` - Servidor WebDAV RFC 4918
```go
import "golang.org/x/net/webdav"

// Implementación estándar de WebDAV
type Handler struct {
    FileSystem FileSystem
    LockSystem LockSystem
    Logger     Logger
}

// Implementa http.Handler
// Soporta automáticamente:
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
**Responsabilidad**:
- ✅ Implementación completa de RFC 4918
- ✅ Manejo de métodos WebDAV
- ✅ Control de locks
- ✅ Negociación de características

**Línea en código**: `webdav.go:36`

---

#### 2. `github.com/go-chi/chi/v5` (v5.2.5) - Router HTTP
```go
import "github.com/go-chi/chi/v5"

// Router HTTP moderno y simple
router := chi.NewRouter()

// Agregar middleware
router.Use(middleware.RequestID)
router.Use(middleware.RealIP)
router.Use(middleware.Logger)

// Registrar handlers
router.Handle("/*", davHandler)      // WebDAV
router.Get("/*", handleDirOrFile)    // HTML listing
```
**Responsabilidad**:
- ✅ Enrutamiento HTTP moderno
- ✅ Middleware support
- ✅ Pattern matching
- ✅ Mejor performance que gorilla/mux

**Línea en código**: `webdav.go:18`

---

#### 3. `github.com/spf13/cobra` - CLI Framework
```go
import "github.com/spf13/cobra"

// Definir comando
var Command = &cobra.Command{
    Use:   "webdav remote:path",
    Short: "Serve remote:path over WebDAV",
    RunE:  func(cmd *cobra.Command, args []string) error { ... },
}

// Integración con rclone serve
// Comandos disponibles:
// rclone serve webdav [flags] remote:path
```
**Responsabilidad**:
- ✅ Definición de comandos CLI
- ✅ Parsing de flags
- ✅ Help messages
- ✅ Integración en `rclone serve`

---

### Categoría 3: Librerías Internas de rclone

#### 1. `github.com/rclone/rclone/vfs` - Virtual File System
```go
import "github.com/rclone/rclone/vfs"

// VFS capa entre HTTP handler y backend
vfsFS := vfs.New(f, &vfsOpt)

// Operaciones soportadas:
// - Mkdir
// - OpenFile (lectura/escritura)
// - RemoveAll
// - Rename
// - Stat
```
**Responsabilidad**:
- ✅ Abstracción de filesystem
- ✅ Caching de metadata
- ✅ Caching de contenido (configurable)
- ✅ Operaciones POSIX

**Ubicación**: `/vfs/`

**Cache modes**:
```
off       → Sin caché
minimal   → Solo metadata
writes    → Caché escrituras
full      → Caché todo
```

---

#### 2. `github.com/rclone/rclone/lib/http/serve` - HTTP server helpers
```go
import "github.com/rclone/rclone/lib/http/serve"

// Helpers para servir HTTP
// - Listening
// - Shutdown
// - TLS setup
```

---

#### 3. `github.com/rclone/rclone/cmd/serve/proxy` - Proxy auth
```go
import "github.com/rclone/rclone/cmd/serve/proxy"

// Soporte para autenticación a través de proxy
// Útil cuando está detrás de reverse proxy
```

---

#### 4. `github.com/rclone/rclone/lib/systemd` - Systemd integration
```go
import "github.com/rclone/rclone/lib/systemd"

// Integración con systemd socket activation
// Permite que systemd maneje los sockets
```

---

#### 5. Librerías de configuración
```go
import (
    "github.com/rclone/rclone/fs"
    "github.com/rclone/rclone/fs/config/configstruct"
    "github.com/rclone/rclone/fs/config/flags"
    "github.com/rclone/rclone/vfs/vfscommon"
    "github.com/rclone/rclone/vfs/vfsflags"
)
```

---

## 📊 Tabla Comparativa: Cliente vs Servidor

| Aspecto | Cliente | Servidor |
|---------|---------|----------|
| **HTTP** | `net/http` (cliente) | `net/http` (servidor) |
| **WebDAV** | Manual (XML parsing) | `golang.org/x/net/webdav` |
| **Router** | No necesita | `github.com/go-chi/chi` |
| **Rate Limiting** | Sí (`lib/pacer`) | No (server-side) |
| **Filesystem** | No | Sí (`vfs`) |
| **Autenticación** | Basic, Bearer, NTLM | Htpasswd, Basic, Proxy |
| **Encoding** | `lib/encoder` para paths | HTTP headers automáticos |

---

## 🎯 Dependencias Externas Totales

### Cliente WebDAV
```
1. github.com/Azure/go-ntlmssp v0.1.0     (NTLM auth)
2. golang.org/x/sync/singleflight          (Deduplicación requests)
```

### Servidor WebDAV
```
1. golang.org/x/net/webdav                 (RFC 4918 implementation)
2. github.com/go-chi/chi/v5 v5.2.5        (HTTP routing)
3. github.com/spf13/cobra v1.10.2         (CLI framework)
```

### Total: 5 librerías externas

---

## 💡 Lecciones para Chronex

### Si implementas Cliente WebDAV

**Opción A: Usar gowebdav (librería especializada)**
```go
import "github.com/studio-b12/gowebdav"

// Más simple, librería lista para usar
client := gowebdav.NewClient(url, user, pass)
client.WriteStream(path, data)
```

**Opción B: Patrón de rclone (control total)**
```go
import (
    "net/http"
    "encoding/xml"
    "golang.org/x/sync/singleflight"
)

// Más control, menos dependencias externas
// Implementar manual los métodos WebDAV
```

### Si necesitas Servidor WebDAV

**Usa `golang.org/x/net/webdav`** (como rclone)
```go
import "golang.org/x/net/webdav"

// RFC 4918 compliant
// Menos 100 líneas de código
handler := &webdav.Handler{
    FileSystem: myFileSystem,
    LockSystem: webdav.NewMemoryLockSystem(),
}

http.ListenAndServe(":8080", handler)
```

---

## ✅ Conclusión

rclone usa **librerías especializadas**:
- **Cliente**: Implementación manual + Azure NTLM + singleflight
- **Servidor**: `golang.org/x/net/webdav` (estándar de Go)

Para Chronex:
- **Minimalista**: Usa `studio-b12/gowebdav` (1 librería)
- **Control**: Sigue patrón de rclone (más código, menos dependencias)
- **Servidor**: Usa `golang.org/x/net/webdav` si lo necesitas
