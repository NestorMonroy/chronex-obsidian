# WebDAV para Chronex: Guía de Implementación

## 📋 Resumen: Lo Que Aprendimos de Joplin

Hemos analizado profundamente cómo Joplin implementa WebDAV. Aquí están las lecciones clave para Chronex:

### ✅ Lo Que Joplin Hace Bien

1. **Abstracción en Capas**:
   - WebDavApi (HTTP client low-level)
   - FileApiDriver (abstracción specific para WebDAV)
   - FileApi (interfaz genérica)
   - Synchronizer (sin conocimiento de detalles WebDAV)

2. **Robustez**:
   - Maneja múltiples servidores (Nextcloud, Seafile, Nginx, Apache, IIS)
   - Detecta incompatibilidades automáticamente
   - Retry logic implícita en FileApi

3. **XML Parsing Automático**:
   - Convierte automáticamente PROPFIND XML a JSON
   - Maneja variaciones de namespaces (d:, D:, sin namespace)

4. **Streaming**:
   - No carga archivos completos en memoria
   - shim.uploadBlob() para PUT/POST
   - shim.fetchBlob() para GET

5. **Error Handling**:
   - Workarounds específicos por servidor
   - Logging detallado para debugging

---

## 🔴 Diferencias: WebDAV Server (No Implementado en Joplin)

Joplin **NO tiene servidor WebDAV**, solo cliente.

rclone **SÍ tiene servidor WebDAV** (cmd/serve/webdav/):
- Expone cualquier backend como servidor WebDAV
- Usa golang.org/x/net/webdav (librería estándar)
- RFC 4918 compliant

**Para Chronex**: Inicialmente solo necesitamos cliente, pero podría ser útil agregar servidor más adelante.

---

## 🎯 Recomendación: Arquitectura Para Chronex WebDAV

### Option A: Seguir Exactamente a Joplin (Recomendado para MVP)

```go
// packages/sync/webdav/webdav_api.go (equivalente a WebDavApi.ts)
type WebDavApi struct {
    client   *http.Client
    baseUrl  string
    username string
    password string
    logger   Logger
    
    // Workarounds por servidor
    excludeIfNoneMatch ExcludeIfNoneMatchState
}

// Métodos principales
func (w *WebDavApi) Exec(method, path string, body []byte, headers map[string]string) (*Response, error)
func (w *WebDavApi) ExecPropFind(path string, depth int, fields []string) (*PropFindResponse, error)
func (w *WebDavApi) Auth() (string, error)  // Basic Auth

// packages/sync/webdav/file_api_driver.go (equivalente a FileApiDriverWebDav)
type FileApiDriverWebDav struct {
    api *WebDavApi
}

func (f *FileApiDriverWebDav) Stat(ctx context.Context, path string) (*Stats, error)
func (f *FileApiDriverWebDav) List(ctx context.Context, path string) ([]*Item, error)
func (f *FileApiDriverWebDav) Get(ctx context.Context, path string) ([]byte, error)
func (f *FileApiDriverWebDav) Put(ctx context.Context, path string, data []byte) error
func (f *FileApiDriverWebDav) Delete(ctx context.Context, path string) error
func (f *FileApiDriverWebDav) Move(ctx context.Context, oldPath, newPath string) error
func (f *FileApiDriverWebDav) Mkdir(ctx context.Context, path string) error
func (f *FileApiDriverWebDav) Delta(ctx context.Context, path string, context *DeltaContext) (*DeltaResult, error)
```

**Ventajas**:
- ✅ Patrón probado en producción (Joplin)
- ✅ Fácil extender a otros backends (S3, Dropbox, etc.)
- ✅ Clean separation of concerns
- ✅ Testeable

**Desventajas**:
- ❌ Más código inicial (pero vale la pena)

### Option B: Usar Librería gowebdav (Más Simple)

```go
import "github.com/studio-b12/gowebdav"

client := gowebdav.NewClient(
    "http://nextcloud.local/remote.php/dav/files/admin/",
    "username",
    "password",
)

// Usar directamente
client.Stat(path)
client.ReadStream(path)  // Descargar
client.Write(path, data, 0644)  // Subir
client.Remove(path)
client.Mkdir(path, 0755)
client.Rename(oldPath, newPath)
```

**Ventajas**:
- ✅ Menos código
- ✅ Probado en producción (SiYuan lo usa)
- ✅ Fewer dependencies

**Desventajas**:
- ❌ Menos control sobre detalles (headers, workarounds)
- ❌ No abstracción genérica para múltiples backends
- ❌ Limitado si necesitas server WebDAV después

---

## 📋 Checklist: Implementar WebDAV para Chronex

### FASE 1: HTTP Client (Semana 1)

- [ ] Crear WebDavApi struct
- [ ] Implementar Exec() method
- [ ] Implementar ExecPropFind()
- [ ] Implementar Basic Auth
- [ ] Headers management (Cache-Control, Content-Type, etc.)
- [ ] Content-Length calculation
- [ ] Error handling básico (401, 403, 404, 409, 405)
- [ ] Logging de requests/responses

```go
// Test básico
func TestWebDavApi_Stat(t *testing.T) {
    api := NewWebDavApi("http://localhost/dav/", "user", "pass")
    stat, err := api.Stat("/archivo.md")
    assert.NoError(t, err)
    assert.NotNil(t, stat)
}
```

### FASE 2: Abstracción FileApiDriver (Semana 1-2)

- [ ] Crear FileApiDriverWebDav struct
- [ ] Implementar Stat()
- [ ] Implementar List()
- [ ] Implementar Get()
- [ ] Implementar Put()
- [ ] Implementar Delete()
- [ ] Implementar Move()
- [ ] Implementar Mkdir()
- [ ] Implementar Delta()
- [ ] XML parsing (propiedades WebDAV)
- [ ] Resource parsing (detectar directorios)

```go
// Test
func TestFileApiDriverWebDav_List(t *testing.T) {
    driver := NewFileApiDriverWebDav(api)
    items, err := driver.List(context.Background(), "/")
    assert.NoError(t, err)
    assert.True(t, len(items) > 0)
}
```

### FASE 3: Integración con Sync Engine (Semana 2-3)

- [ ] Crear SyncTargetWebDAV struct
- [ ] Implementar initFileApi()
- [ ] Implementar initSynchronizer()
- [ ] Config validation (checkConfig)
- [ ] Integración con Synchronizer
- [ ] Upload workflow
- [ ] Download workflow
- [ ] Conflict detection

### FASE 4: Robustez y Workarounds (Semana 3)

- [ ] Detectar Nginx 404 hack
- [ ] Detectar Seafile/Tomcat If-None-Match issue
- [ ] Detectar Microsoft IIS quirks
- [ ] Retry logic
- [ ] Rate limiting
- [ ] Bandwidth limiting
- [ ] Tests con múltiples servidores

```go
func TestWebDavApi_NginxHack(t *testing.T) {
    // Nginx retorna 200 con 404 en XML
    // Debe lanzar error 404
}

func TestWebDavApi_SeafileIfNoneMatch(t *testing.T) {
    // Seafile rechaza If-None-Match
    // Debe detectar y reintentar sin el header
}
```

---

## 🛠️ Decisiones de Implementación

### Librería HTTP

**Opciones**:
- `net/http` (estándar) - Control total, bajo nivel
- `resty` - Más alto nivel, manejo de retries
- `fasthttp` - Más performance

**Recomendación**: `net/http` para MVP, luego optimizar si es necesario

### XML Parsing

**Opciones**:
- `encoding/xml` (estándar)
- `xmlquery` - Similar a Joplin
- `etree` - Más alto nivel

**Recomendación**: `encoding/xml` inicialmente, luego evaluar

### Testing

**Mockear WebDAV**:
```go
type MockWebDavApi struct {
    files map[string][]byte
}

func (m *MockWebDavApi) Stat(path string) (*Stats, error) {
    if data, ok := m.files[path]; ok {
        return &Stats{
            Path:      path,
            Size:      int64(len(data)),
            IsDir:     false,
            Modified:  time.Now(),
        }, nil
    }
    return nil, ErrorNotFound
}

// Tests pueden usar MockWebDavApi
func TestSync_WithMockWebDav(t *testing.T) {
    mock := NewMockWebDavApi()
    mock.files["/test.md"] = []byte("content")
    
    driver := NewFileApiDriverWebDav(mock)
    data, _ := driver.Get(context.Background(), "/test.md")
    assert.Equal(t, "content", string(data))
}
```

---

## 📊 Tabla: Comparación de Enfoques

| Aspecto | Joplin Pattern | gowebdav Library | Custom Minimal |
|---------|----------------|------------------|----------------|
| **Líneas de código** | ~800 (driver) | ~50 (usar) | ~200 |
| **Librerías externas** | xml2js, base-64 | studio-b12/gowebdav | ninguna (extra) |
| **Soporta multiples backends** | Sí (patrón) | No | No |
| **Control sobre headers** | Total | Limitado | Total |
| **Workarounds por servidor** | Fácil agregar | Difícil | Fácil |
| **Testing** | Muy testeable | Testeable | Muy testeable |
| **Mantención** | Nuestro código | Confiar en librería | Nuestro código |

---

## 🔐 Consideraciones de Seguridad

### 1. Autenticación

```go
// CORRECTO: Basic Auth sobre HTTPS
api.SetAuth(username, password)  // Con TLS

// INCORRECTO: Basic Auth sobre HTTP
// ❌ Las credenciales se envían en claro

// Implementar:
func (w *WebDavApi) SetInsecureAllowTLS() {
    // Para certificados autofirmados (desarrollo)
}
```

### 2. Validación de URLs

```go
// Validar que la URL es válida
func ValidateWebDAVURL(url string) error {
    u, err := url.Parse(url)
    if err != nil {
        return err
    }
    
    if u.Scheme != "http" && u.Scheme != "https" {
        return fmt.Errorf("only HTTP and HTTPS supported")
    }
    
    if u.Host == "" {
        return fmt.Errorf("invalid host")
    }
    
    return nil
}
```

### 3. Injection Attacks

```go
// Path traversal: usuario intenta subir a "../../../etc/passwd"
// Joplin: Rechaza paths con ".."

func ValidatePath(path string) error {
    if strings.Contains(path, "..") {
        return fmt.Errorf("path traversal not allowed")
    }
    return nil
}
```

---

## 💡 Tips de Implementación

### 1. Streaming Grande Files

```go
// NO: Cargar todo en memoria
data, _ := ioutil.ReadAll(response.Body)  // ❌ Bad para 1GB

// SÍ: Stream
func (f *FileApiDriverWebDav) Get(ctx context.Context, path string) (io.ReadCloser, error) {
    // Retornar reader directamente
    return response.Body, nil
}
```

### 2. Retry Logic

```go
func (w *WebDavApi) ExecWithRetry(method, path string, body []byte) (*Response, error) {
    var lastErr error
    
    for attempt := 0; attempt < 3; attempt++ {
        resp, err := w.Exec(method, path, body)
        
        if err == nil {
            return resp, nil
        }
        
        // Retry solo en errores transientes
        if !isRetryable(err) {
            return nil, err
        }
        
        lastErr = err
        
        // Backoff exponencial
        time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
    }
    
    return nil, fmt.Errorf("max retries exceeded: %w", lastErr)
}

func isRetryable(err error) bool {
    // 5xx = servidor error (retry)
    // 429 = rate limit (retry)
    // 408 = timeout (retry)
    // 401 = auth fail (no retry)
    // 404 = not found (no retry)
}
```

### 3. Context Handling

```go
// Siempre respetar context (para cancellations)
func (w *WebDavApi) ExecContext(ctx context.Context, method, path string, body []byte) (*Response, error) {
    req, _ := http.NewRequestWithContext(ctx, method, w.baseUrl + path, bytes.NewReader(body))
    
    // Si context es cancelado, request es cancelado
    resp, err := w.client.Do(req)
    
    if ctx.Err() != nil {
        return nil, ctx.Err()  // Client cancelled
    }
    
    return parseResponse(resp), err
}
```

---

## ✅ Conclusión para Chronex

### Recomendación Final

**Usar Joplin's Adapter Pattern**:
1. WebDavApi para HTTP low-level
2. FileApiDriverWebDav para abstracción WebDAV
3. StorageProvider interface (como FileApi)
4. Synchronizer sin detalles de WebDAV

**Ventajas**:
- ✅ Patrón probado en producción
- ✅ Fácil extender a S3, Dropbox, Local
- ✅ Control total sobre detalles
- ✅ Robust (múltiples servidores)
- ✅ Testeable

**Timeline**:
- Semana 1: WebDavApi + FileApiDriver
- Semana 2: Integración con Sync
- Semana 3: Robustez y workarounds

**Total**: ~1000 líneas de Go robusto vs 254 dependencias de rclone.

El análisis profundo de Joplin proporciona un **blueprint claro para implementar WebDAV en Chronex**.
