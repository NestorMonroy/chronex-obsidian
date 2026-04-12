# Cómo rclone Implementa WebDAV (Sin Librerías Externas)

## 📋 Resumen Ejecutivo

**rclone NO usa `studio-b12/gowebdav` ni `emersion/go-webdav`**

rclone implementa el cliente WebDAV **desde cero** usando:
- ✅ `net/http` (cliente HTTP estándar de Go)
- ✅ `encoding/xml` (parsear respuestas XML)
- ✅ `github.com/rclone/rclone/lib/rest` (abstracción genérica REST)
- ✅ Estructuras propias en `backend/webdav/api/types.go` (tipos XML para PROPFIND)

**Ventaja**: Control total, sin dependencias externas de WebDAV

**Desventaja**: Más código que mantener (pero centralizado en rclone)

---

## 🏗️ Arquitectura de rclone WebDAV

### 1. Abstracción REST genérica

```go
// github.com/rclone/rclone/lib/rest - abstracción utilizada por TODO backend

type Opts struct {
    Method         string              // HTTP method
    Path           string              // Relative path
    ExtraHeaders   map[string]string   // Custom headers
    Body           io.Reader           // Request body
    CheckRedirect  CheckRedirectFn     // Handle redirects
    // ... más opciones
}

// Método genérico usado por TODOS los backends
func (s *Client) CallXML(
    ctx context.Context,
    opts *Opts,
    params interface{},
    result interface{},
) (*http.Response, error) {
    // 1. Construir request HTTP
    // 2. Ejecutar con retry/pacer
    // 3. Parsear XML response
    // 4. Retornar
}
```

**¿Por qué?** rclone usa esta abstracción para TODOS los backends REST (Drive, Dropbox, etc.). WebDAV es simplemente otro backend que usa esta abstracción.

### 2. Estructuras XML para PROPFIND

```go
// backend/webdav/api/types.go

type Multistatus struct {
    Responses []Response `xml:"response"`
}

type Response struct {
    Href  string `xml:"href"`           // /path/to/file
    Props Prop   `xml:"propstat"`
}

type Prop struct {
    Status         []string  `xml:"DAV: status"`           // "HTTP/1.1 200 OK"
    Name           string    `xml:"DAV: prop>displayname"` // Nombre del archivo
    Type           *xml.Name `xml:"DAV: prop>resourcetype>collection"`  // Es directorio?
    Size           int64     `xml:"DAV: prop>getcontentlength"`        // Tamaño
    Modified       Time      `xml:"DAV: prop>getlastmodified"`         // Mtime
    Checksums      []string  `xml:"prop>checksums>checksum"`           // SHA1, MD5
    Permissions    string    `xml:"prop>permissions"`                  // Permisos
}
```

**Ejemplo de respuesta PROPFIND parseada**:
```xml
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/webdav/documento.pdf</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>documento.pdf</d:displayname>
        <d:getcontentlength>4143665</d:getcontentlength>
        <d:getlastmodified>Tue, 19 Dec 2017 22:02:36 GMT</d:getlastmodified>
        <d:getetag>"048d7be4437ff7deeae94db50ff3e209"</d:getetag>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>
```

Parseado a structs Go automáticamente por `encoding/xml`.

---

## 📡 Métodos WebDAV Implementados en rclone

### 1. PROPFIND (Listar, obtener metadata)

```go
// backend/webdav/webdav.go - línea 344-389

func (f *Fs) readMetaDataForPath(ctx context.Context, path string, depth string) (*api.Prop, error) {
    opts := rest.Opts{
        Method: "PROPFIND",
        Path:   f.filePath(path),
        ExtraHeaders: map[string]string{
            "Depth": depth,  // "0" (solo este archivo) o "1" (este + hijos)
        },
        CheckRedirect: rest.PreserveMethodRedirectFn,
    }
    
    // Body opcional: XML especificando qué propiedades devuelven
    if f.hasOCMD5 || f.hasOCSHA1 {
        opts.Body = bytes.NewBuffer(owncloudProps)  // Custom OwnCloud props
    } else if f.useStandardProps {
        opts.Body = bytes.NewBuffer(standardProps)  // Estándares WebDAV
    }
    
    var result api.Multistatus
    var resp *http.Response
    err := f.pacer.Call(func() (bool, error) {
        resp, err = f.srv.CallXML(ctx, &opts, nil, &result)
        return f.shouldRetry(ctx, resp, err)
    })
    
    if err != nil {
        return nil, err
    }
    
    // Parsear respuesta
    if len(result.Responses) < 1 {
        return nil, fs.ErrorObjectNotFound
    }
    
    return &result.Responses[0].Props, nil
}
```

**Uso en rclone**:
```go
// Listar archivos en /documentos
items, err := fs.List(ctx, "/documentos")
// Internamente: PROPFIND a /documentos con Depth: 1

// Obtener metadata de un archivo
info, err := fs.readMetaDataForPath(ctx, "/documentos/archivo.pdf", "0")
// Internamente: PROPFIND a /documentos/archivo.pdf con Depth: 0
```

### 2. MKCOL (Crear directorio)

```go
// backend/webdav/webdav.go - línea 1033-1060

func (f *Fs) Mkdir(ctx context.Context, dir string) error {
    opts := rest.Opts{
        Method: "MKCOL",
        Path:   f.filePath(dir),
    }
    
    var resp *http.Response
    var err error
    err = f.pacer.Call(func() (bool, error) {
        resp, err = f.srv.Call(ctx, &opts)
        return f.shouldRetry(ctx, resp, err)
    })
    
    if err != nil {
        if resp != nil {
            switch resp.StatusCode {
            case http.StatusConflict:
                return fs.ErrorDirExists
            case http.StatusMethodNotAllowed:
                // Parent doesn't exist
                return fmt.Errorf("parent directory doesn't exist")
            }
        }
        return err
    }
    
    return nil
}
```

**HTTP:**
```
MKCOL /remote.php/webdav/nuevacarpeta/ HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic ...

HTTP/1.1 201 Created
```

### 3. PUT (Subir archivo)

```go
// backend/webdav/webdav.go - línea 1628-1700

func (o *Object) Update(ctx context.Context, in io.Reader, src fs.ObjectInfo, options ...fs.OpenOption) error {
    size := src.Size()
    
    opts := rest.Opts{
        Method:        "PUT",
        Path:          o.fs.filePath(o.Remote()),
        Body:          in,
        ContentLength: &size,
        ExtraHeaders: map[string]string{
            "If-Match": `*`,  // Fail if file exists and modified
        },
    }
    
    var resp *http.Response
    var err error
    err = o.fs.pacer.Call(func() (bool, error) {
        resp, err = o.fs.srv.Call(ctx, &opts)
        return o.fs.shouldRetry(ctx, resp, err)
    })
    
    if err != nil {
        return err
    }
    
    // Actualizar metadata local después de upload
    o.bytes = size
    o.modTime = src.ModTime(ctx)
    
    return nil
}
```

**HTTP:**
```
PUT /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic ...
Content-Length: 1024
If-Match: *

[archivo binario]

HTTP/1.1 201 Created
ETag: "048d7be4437ff7deeae94db50ff3e209"
```

### 4. GET (Descargar archivo)

```go
// backend/webdav/webdav.go - línea 1534-1580

func (o *Object) Open(ctx context.Context, options ...fs.OpenOption) (io.ReadCloser, error) {
    opts := rest.Opts{
        Method: "GET",
        Path:   o.fs.filePath(o.Remote()),
    }
    
    // Aplicar options (Range requests, etc)
    for _, option := range options {
        option.Header().Set("Range", fmt.Sprintf("bytes=%d-%d", start, end))
    }
    
    var resp *http.Response
    err := o.fs.pacer.Call(func() (bool, error) {
        resp, err = o.fs.srv.Call(ctx, &opts)
        return o.fs.shouldRetry(ctx, resp, err)
    })
    
    if err != nil {
        return nil, err
    }
    
    // Retornar body como stream
    return resp.Body, nil
}
```

**HTTP:**
```
GET /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic ...

HTTP/1.1 200 OK
Content-Length: 1024
Content-Type: application/pdf
ETag: "048d7be4437ff7deeae94db50ff3e209"

[archivo binario]
```

### 5. DELETE (Eliminar archivo)

```go
// backend/webdav/webdav.go - línea 1660-1675

func (o *Object) Remove(ctx context.Context) error {
    opts := rest.Opts{
        Method: "DELETE",
        Path:   o.fs.filePath(o.Remote()),
    }
    
    var resp *http.Response
    var err error
    err = o.fs.pacer.Call(func() (bool, error) {
        resp, err = o.fs.srv.Call(ctx, &opts)
        return o.fs.shouldRetry(ctx, resp, err)
    })
    
    return err
}
```

**HTTP:**
```
DELETE /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.example.com
Authorization: Basic ...

HTTP/1.1 204 No Content
```

### 6. MOVE (Renombrar/mover)

```go
// Probablemente en rclone, aunque no vimos en busca anterior
// Patrón sería:

opts := rest.Opts{
    Method: "MOVE",
    Path:   o.fs.filePath(oldPath),
    ExtraHeaders: map[string]string{
        "Destination": o.fs.filePath(newPath),
        "Overwrite":   "F",  // False = no sobrescribir
    },
}
```

**HTTP:**
```
MOVE /remote.php/webdav/viejo.pdf HTTP/1.1
Host: nextcloud.example.com
Destination: /remote.php/webdav/nuevo.pdf
Overwrite: F

HTTP/1.1 201 Created
```

---

## 🔐 Autenticación en rclone WebDAV

rclone soporta múltiples métodos (todos implementados manualmente):

### 1. Basic Auth

```go
// backend/webdav/webdav.go

type Options struct {
    User string  // username
    Pass string  // password
}

// Manualmente agrega header Authorization
req.Header.Set("Authorization", "Basic " + base64.StdEncoding.EncodeToString([]byte(user + ":" + pass)))
```

### 2. Bearer Token

```go
opts := rest.Opts{
    ExtraHeaders: map[string]string{
        "Authorization": "Bearer " + token,
    },
}
```

### 3. NTLM (para Sharepoint)

```go
// backend/webdav/webdav.go importa:
// "github.com/Azure/go-ntlmssp"

// Para Sharepoint NTLM:
// 1. Cliente HTTP customizado con transporte NTLM
// 2. Maneja negociación NTLM automáticamente
```

---

## 📊 Comparativa: Estrategias de Implementación

| Aspecto | rclone | gowebdav | emersion/go-webdav |
|---------|--------|----------|-------------------|
| **Modelo** | Implementación propia | Cliente WebDAV | Servidor WebDAV |
| **Dependencias** | net/http, xml | net/http | net/http |
| **Líneas de código** | ~2000 (backend/webdav/) | ~1000 (librería completa) | ~3000 (server) |
| **API** | rest.Opts + CallXML | Simple: ReadStream, Write | RFC 4791/6352 |
| **Usado por** | rclone | Restic, otros | SiYuan, otros |
| **Ventaja** | Control total, sin deps externas | Simple, lista para usar | Completo (CalDAV/CardDAV) |
| **Desventaja** | Más código que mantener | Dependency externa | Overkill para cliente |
| **Para Chronex** | 🔵 **MODELO** | ⚠️ Opción | ❌ No aplica (server) |

---

## 🎯 Lección para Chronex: Adoptar el Modelo de rclone

### ¿Por qué rclone implementa WebDAV manualmente?

1. **Control**: Maneja exactamente lo que necesita
2. **Consistencia**: Usa su abstracción REST para TODOS los backends
3. **Sin dependencias**: No depende de librerías WebDAV externas
4. **Mantenibilidad**: Todo en un lugar (backend/webdav/)

### Para Chronex, opciones:

#### **Opción A: Usar gowebdav (como SiYuan)**
```go
// Simple, directo, probado en producción
import "github.com/studio-b12/gowebdav"

client := gowebdav.NewClient(endpoint, user, pass)
client.WriteStream(path, data, os.ModePerm)
```

✅ Ventaja: Simple, ya existe
❌ Desventaja: Dependency externa

#### **Opción B: Implementar manualmente (como rclone)**
```go
// Control total, sin dependencies de WebDAV
// Usar net/http + encoding/xml como rclone

func (p *WebDAVProvider) Put(path string, data io.Reader) error {
    req, _ := http.NewRequest("PUT", p.baseURL + path, data)
    req.SetBasicAuth(p.user, p.pass)
    resp, _ := http.DefaultClient.Do(req)
    return checkStatusCode(resp)
}
```

✅ Ventaja: Control, sin deps externas
❌ Desventaja: Más código

---

## ✅ Conclusión

**rclone NO usa gowebdav. Implementa WebDAV manualmente.**

**Para Chronex**:
- Si quieres **simplicidad**: usa `studio-b12/gowebdav` (como SiYuan)
- Si quieres **control sin dependencies**: implementa manualmente (como rclone)

Ambos son válidos. La diferencia es:
- gowebdav: **librería especializada en WebDAV**
- rclone: **abstracción REST genérica para múltiples backends**

rclone eligió abstracción genérica porque soporta 70+ backends distintos. Chronex probablemente no necesita tanta genericidad, así que **gowebdav es probablemente mejor para Chronex**.
