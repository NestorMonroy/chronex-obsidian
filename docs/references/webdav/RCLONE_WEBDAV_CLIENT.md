# rclone: Cliente WebDAV - Análisis Profundo

## 📋 Resumen

rclone implementa un **cliente WebDAV completo** en `/backend/webdav/`:
- ✅ **1,684 líneas** de código en `webdav.go`
- ✅ Implementación **100% manual** (sin librerías WebDAV externas)
- ✅ Soporta **70+ características** de diferentes servidores
- ✅ Métodos WebDAV: PUT, GET, DELETE, PROPFIND, MKCOL, MOVE, COPY
- ✅ Autenticación: Basic, Bearer Token, NTLM, OAuth
- ✅ Chunking: TUS protocol para Nextcloud
- ✅ Optimización: Pacer, singleflight, retry automático

---

## 🏗️ Estructura de Código

### Archivo Principal: `backend/webdav/webdav.go` (1,684 líneas)

```go
package webdav

// Estructura principal del cliente
type Fs struct {
    name          string              // nombre del remote
    root          string              // ruta raíz
    opt           Options             // configuración
    srv           *rest.Client        // cliente HTTP genérico de rclone
    pacer         *fs.Pacer          // rate limiting
    endpoint      *url.URL           // URL del servidor
    endpointURL   string
    
    // Características detectadas
    canStream     bool               // soporta streaming
    canTus        bool               // soporta TUS protocol
    useOCMtime    bool               // soporta X-OC-Mtime header
    propsetMtime  bool               // soporta PROPPATCH mtime
    hasOCMD5      bool               // soporta OwnCloud MD5
    hasOCSHA1     bool               // soporta OwnCloud SHA1
    canChunk      bool               // soporta Nextcloud chunking
}

type Object struct {
    fs          *Fs                 // referencia a Fs padre
    remote      string              // ruta del objeto
    size        int64               // tamaño
    modTime     time.Time           // modification time
    sha1        string              // SHA-1 hash
    md5         string              // MD5 hash
}
```

### Archivos Auxiliares

```
backend/webdav/
├── webdav.go              (1,684 líneas) - Cliente principal
├── chunking.go            (221 líneas)   - Lógica de chunking
├── tus.go                 (108 líneas)   - TUS protocol
├── tus-uploader.go        (191 líneas)   - TUS upload implementation
├── tus-upload.go          (88 líneas)    - Utilitarios TUS
├── tus-errors.go          (40 líneas)    - Error handling TUS
├── api/types.go           (259 líneas)   - Structs XML para PROPFIND
├── odrvcookie/            (2 archivos)   - Manejo de cookies OneDrive
└── webdav_test.go         (64 líneas)    - Tests
```

---

## 🔧 Configuración: Opciones del Cliente

```go
type Options struct {
    // Básico
    URL              string             // URL del servidor WebDAV
    Vendor           string             // "nextcloud", "owncloud", "sharepoint", etc.
    User             string             // usuario
    Pass             string             // contraseña
    
    // Autenticación avanzada
    BearerToken      string             // Token en lugar de user/pass
    BearerTokenCmd   fs.SpaceSepList    // Comando para obtener token
    
    // Configuración
    Enc              encoder.MultiEnc   // Encoding de caracteres
    Headers          fs.CommaSepList    // Headers HTTP personalizados
    PacerMinSleep    fs.Duration        // Rate limiting mínimo (default: 10ms)
    ChunkSize        fs.SizeSuffix      // Tamaño de chunks Nextcloud (default: 10MB)
    UnixSocket       string             // Socket Unix en lugar de TCP
    
    // Opciones específicas de vendor
    ExcludeShares    bool               // OwnCloud: excluir shares
    ExcludeMounts    bool               // OwnCloud: excluir mounted storage
    AuthRedirect     bool               // Preservar auth en redirects
}
```

### Vendors Soportados

```go
// rclone/backend/webdav/webdav.go línea 80-105
"nextcloud"         → Nextcloud (con TUS chunking, 10MB default)
"owncloud"          → OwnCloud 10 (con soporte OC-MD5, OC-SHA1)
"infinitescale"     → ownCloud Infinite Scale (versión empresarial)
"sharepoint"        → Microsoft Sharepoint Online (OAuth)
"sharepoint-ntlm"   → Sharepoint On-Premises (NTLM auth)
"fastmail"          → Fastmail Files
"rclone"            → rclone serve webdav (otro rclone)
"other"             → WebDAV genérico (RFC 4918)
```

---

## 📡 Métodos WebDAV Implementados

### 1. PROPFIND (Listar / Obtener Metadata)

**Ubicación en código**: `webdav.go:343-389` (`readMetaDataForPath`)

```go
// PROPFIND es la operación más compleja
// Se usa para:
// 1. Listar directorios (Depth: 1)
// 2. Obtener metadata de archivo (Depth: 0)
// 3. Detectar si es directorio o archivo

func (f *Fs) readMetaDataForPath(ctx context.Context, path string, depth string) (info *api.Prop, error) {
    opts := rest.Opts{
        Method: "PROPFIND",
        Path:   f.filePath(path),
        ExtraHeaders: map[string]string{
            "Depth": depth,  // "0" o "1"
        },
    }
    
    // Body opcional: XML con propiedades a devolver
    // Si está vacío, devuelve allprop (todas las propiedades)
    
    var result api.Multistatus
    resp, err := f.srv.CallXML(ctx, &opts, nil, &result)
}

// Respuesta XML parseada:
type Multistatus struct {
    Responses []Response `xml:"response"`
}

type Response struct {
    Href  string `xml:"href"`        // /path/to/file
    Props Prop   `xml:"propstat"`
}

type Prop struct {
    Status      []string `xml:"DAV: status"`                   // "HTTP/1.1 200 OK"
    Name        string   `xml:"DAV: prop>displayname"`         // Nombre
    Type        *xml.Name `xml:"DAV: prop>resourcetype>collection"` // Es dir?
    Size        int64    `xml:"DAV: prop>getcontentlength"`   // Tamaño
    Modified    Time     `xml:"DAV: prop>getlastmodified"`    // mtime
    ETag        string   `xml:"DAV: prop>getetag"`            // ETag
    Checksums   []string `xml:"prop>checksums>checksum"`      // SHA1, MD5
    Permissions string   `xml:"prop>permissions"`            // Permisos
    MESha1Hex   *string  `xml:"ME: prop>sha1hex"`            // Fastmail SHA1
}
```

**HTTP Request**:
```
PROPFIND /remote.php/webdav/directorio/ HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic dXNlcjpwYXNz
Depth: 1
Content-Type: application/xml

<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:getetag/>
  </D:prop>
</D:propfind>
```

**HTTP Response** (207 Multi-Status):
```
HTTP/1.1 207 Multi-Status
Content-Type: application/xml

<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:s="http://sabredav.org/ns">
  <D:response>
    <D:href>/remote.php/webdav/archivo.pdf</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>archivo.pdf</D:displayname>
        <D:resourcetype/>
        <D:getcontentlength>4143665</D:getcontentlength>
        <D:getlastmodified>Tue, 19 Dec 2017 22:02:36 GMT</D:getlastmodified>
        <D:getetag>"048d7be4437ff7deeae94db50ff3e209"</D:getetag>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>
```

---

### 2. GET (Descargar Archivo)

**Ubicación**: `webdav.go:1534-1580` (`Open`)

```go
func (o *Object) Open(ctx context.Context, options ...fs.OpenOption) (io.ReadCloser, error) {
    opts := rest.Opts{
        Method: "GET",
        Path:   o.fs.filePath(o.Remote()),
    }
    
    // Soporta Range requests
    for _, option := range options {
        if ropt, ok := option.(*fs.RangeOption); ok {
            start := ropt.Start
            end := ropt.End
            opts.ExtraHeaders["Range"] = fmt.Sprintf("bytes=%d-%d", start, end)
        }
    }
    
    resp, err := o.fs.srv.Call(ctx, &opts)
    if err != nil {
        return nil, err
    }
    
    // Retorna el body como stream (no carga en memoria)
    return resp.Body, nil
}
```

**HTTP Request**:
```
GET /remote.php/webdav/archivo.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic dXNlcjpwYXNz
Range: bytes=0-1023                    ← Opcional, para descargas reanudables
```

**HTTP Response**:
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 4143665
ETag: "048d7be4437ff7deeae94db50ff3e209"
Last-Modified: Tue, 19 Dec 2017 22:02:36 GMT

[archivo binario: 4143665 bytes]
```

---

### 3. PUT (Subir Archivo)

**Ubicación**: `webdav.go:1628-1700` (`Update`)

```go
func (o *Object) Update(ctx context.Context, in io.Reader, src fs.ObjectInfo, ...) error {
    size := src.Size()
    
    opts := rest.Opts{
        Method:        "PUT",
        Path:          o.fs.filePath(o.Remote()),
        Body:          in,
        ContentLength: &size,
        ExtraHeaders: map[string]string{
            "If-Match": `*`,  // Fail si existe y cambió
        },
    }
    
    // Para Nextcloud con chunking habilitado, redirige a TUS
    if o.fs.canChunk && size > 0 {
        // usa uploadChunked() con TUS protocol
    } else {
        // PUT directo
        resp, err := o.fs.srv.Call(ctx, &opts)
        o.bytes = size
        o.modTime = src.ModTime(ctx)
    }
}
```

**HTTP Request (directo)**:
```
PUT /remote.php/webdav/archivo.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic dXNlcjpwYXNz
Content-Type: application/pdf
Content-Length: 1024
If-Match: *                           ← Fail si modificado

[1024 bytes de archivo]
```

**HTTP Response**:
```
HTTP/1.1 201 Created
Location: /remote.php/webdav/archivo.pdf
ETag: "abc123def456"
Last-Modified: Sat, 12 Apr 2025 20:20:00 GMT
```

---

### 4. DELETE (Eliminar Archivo)

**Ubicación**: `webdav.go:1660-1675` (`Remove`)

```go
func (o *Object) Remove(ctx context.Context) error {
    opts := rest.Opts{
        Method: "DELETE",
        Path:   o.fs.filePath(o.Remote()),
    }
    
    resp, err := o.fs.srv.Call(ctx, &opts)
    return err
}
```

**HTTP Request**:
```
DELETE /remote.php/webdav/archivo.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic dXNlcjpwYXNz
```

**HTTP Response**:
```
HTTP/1.1 204 No Content
```

---

### 5. MKCOL (Crear Directorio)

**Ubicación**: `webdav.go:1033-1060` (`Mkdir`)

```go
func (f *Fs) Mkdir(ctx context.Context, dir string) error {
    opts := rest.Opts{
        Method: "MKCOL",
        Path:   f.filePath(dir),
    }
    
    resp, err := f.srv.Call(ctx, &opts)
    
    if resp.StatusCode == 405 {
        // Method Not Allowed = ya existe
        return fs.ErrorDirExists
    }
}
```

**HTTP Request**:
```
MKCOL /remote.php/webdav/nuevacarpeta/ HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic dXNlcjpwYXNz
```

**HTTP Response**:
```
HTTP/1.1 201 Created
```

---

### 6. MOVE (Renombrar/Mover)

**Ubicación**: Probablemente en funciones de `Move()` o `Copy()`

```
MOVE /remote.php/webdav/viejo.pdf HTTP/1.1
Host: nextcloud.example.com
Destination: /remote.php/webdav/nuevo.pdf
Overwrite: F                          ← No sobrescribir

HTTP/1.1 201 Created
```

---

## 🔐 Autenticación Implementada

### 1. Basic Auth (Username/Password)

```go
// Implementado automáticamente en rest.Client
opts := rest.Opts{
    Method: "GET",
    Path:   "/archivo.pdf",
}

// rest.Client internamente ejecuta:
req.SetBasicAuth(user, pass)
// Que añade header:
// Authorization: Basic base64(user:pass)
```

### 2. Bearer Token

```go
opts := rest.Opts{
    ExtraHeaders: map[string]string{
        "Authorization": "Bearer " + f.opt.BearerToken,
    },
}

// Si el token expira (401), se refresca automáticamente:
if resp.StatusCode == 401 && len(f.opt.BearerTokenCommand) > 0 {
    // Ejecutar comando para obtener nuevo token
    f.fetchAndSetBearerToken()
    // Reintentar request
}
```

### 3. NTLM (Sharepoint On-Premises)

```go
// Usa librería: github.com/Azure/go-ntlmssp
// Negociación NTLM automática:

import "github.com/Azure/go-ntlmssp"

// Cliente HTTP personalizado con transporte NTLM
transport := ntlmssp.Negotiator{
    RoundTripper: http.DefaultTransport,
}

httpClient := &http.Client{
    Transport: &transport,
}
```

---

## 📊 TUS Protocol (Nextcloud Chunking)

**Ubicación**: `tus.go`, `tus-uploader.go`, `chunking.go`

```go
// TUS (Tusd Upload Server) para uploads resumibles

// Paso 1: Iniciar upload
POST /uploads/{userId}/
Response: 201 Created
Location: /uploads/{userId}/abc123def/

// Paso 2: Subir chunks (PARALELO)
PUT /uploads/{userId}/abc123def/{partNumber}
    Content: 10 MB
Response: 204 No Content

// Paso 3: Finalizar
MOVE /uploads/{userId}/abc123def → /files/{userId}/documento.pdf
Response: 201 Created

// Ventajas:
// ✅ Resume automático si conexión se cae
// ✅ Chunks paralelos
// ✅ Bajo overhead
// ✅ Soporte para uploads > HTTP timeout
```

---

## 🔄 Rate Limiting & Retry

### Pacer (Rate Limiting)

```go
// rclone/lib/pacer - Control de velocidad
f.pacer := fs.NewPacer(ctx, &pacer.Opts{
    MinSleep: f.opt.PacerMinSleep,  // default: 10ms
    MaxSleep: 2 * time.Second,
})

// Cada request usa pacer:
err = f.pacer.Call(func() (bool, error) {
    resp, err := f.srv.Call(ctx, &opts)
    return f.shouldRetry(ctx, resp, err)
})
```

### Retry Automático

```go
// rclone reintenta en estos casos:
var retryErrorCodes = []int{
    423, // Locked
    425, // Too Early
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
    509, // Bandwidth Limit Exceeded
}
```

---

## 📈 Detección de Características

Cuando se conecta a un servidor WebDAV, rclone **detecta automáticamente** qué puede hacer:

```go
// En NewFs(), rclone prueba:

// ¿Soporta TUS? (Nextcloud)
f.canTus = f.serverVersion() >= "13.0"

// ¿Soporta X-OC-Mtime? (OwnCloud)
f.useOCMtime = f.supportsOCHeaders()

// ¿Soporta OC-MD5? (OwnCloud)
f.hasOCMD5 = f.hasOwnCloudChecksums("md5")

// ¿Soporta OC-SHA1? (OwnCloud)
f.hasOCSHA1 = f.hasOwnCloudChecksums("sha1")

// ¿Soporta streaming?
f.canStream = f.probeStreamSupport()
```

---

## 🎯 Performance Optimizations

### 1. Singleflight (Evitar Requests Duplicados)

```go
// golang.org/x/sync/singleflight
f.authSingleflight := new(singleflight.Group)

// Si 10 goroutines quieren Bearer token al mismo tiempo:
token, err, shared := f.authSingleflight.Do("fetch_token", func() (interface{}, error) {
    // Solo se ejecuta UNA VEZ
    return f.refreshBearerToken()
})
// Las 10 goroutines comparten el mismo resultado
```

### 2. Streaming (No cargar en memoria)

```go
// GET devuelve resp.Body directamente (io.ReadCloser)
// No espera a que el archivo se descargue completo
body, _ := o.Open(ctx)
defer body.Close()

// Se puede leer como stream mientras se descarga
io.Copy(destFile, body)
```

### 3. Concurrencia Controlada

```go
// Pacer limita requests simultáneos
// Default: 1 request cada 10ms = 100 requests/segundo

f.pacer.Call(func() (bool, error) {
    return f.shouldRetry(ctx, resp, err)
})
```

---

## ✅ Conclusión

**rclone como cliente WebDAV es**:
- ✅ Completo (todos los métodos WebDAV)
- ✅ Optimizado (pacer, singleflight, streaming)
- ✅ Robusto (retry automático, detección de características)
- ✅ Flexible (soporta múltiples autenticaciones)
- ✅ Eficiente (sin cargar archivos en memoria)

**Para Chronex, podríamos**:
- Usar `studio-b12/gowebdav` (más simple)
- O copiar patrones de rclone (más control)
- Los dos son válidos según necesidades
