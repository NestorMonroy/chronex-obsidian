# rclone: Arquitectura de Sincronización Multi-Provider

## 📋 Resumen Ejecutivo

**rclone** es un programa CLI de sincronización que soporta **70+ proveedores de almacenamiento** (WebDAV, S3, Google Drive, Dropbox, etc.) con una **arquitectura agnóstica de backend**.

**Relevancia para Chronex**:
- ✅ Diseño modular: aprender estructura de providers
- ✅ WebDAV client implementation (gowebdav internamente)
- ✅ Sincronización unidireccional (copy/sync)
- ✅ Sincronización bidireccional (bisync)
- ✅ Detección de cambios: size, mtime, hash
- ✅ Manejo de conflictos y resolución
- ⚠️ Diferencia: rclone NO encripta localmente (encriptación es opcional, en cloud)

---

## 🏗️ Arquitectura de rclone

### 1. Abstracción Multi-Provider

rclone usa un patrón de **interfaz agnóstica** que permite soportar cualquier almacenamiento:

```
┌──────────────────────────────────────┐
│ CLI Commands (sync, copy, bisync)   │
└────────────────┬─────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ fs/sync/ (Sync Engine)     │
    │ fs/operations/ (Operations)│
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Backend Interface (Fs)      │
    │ - NewFs(ctx, config)       │
    │ - List(ctx, path)          │
    │ - Put(ctx, data, info)     │
    │ - Copy(ctx, src, dst)      │
    │ - Delete(ctx, path)        │
    └────────┬───────────────────┘
             │
    ┌────────┴──────────────────────────┐
    ▼                                   ▼
  backend/webdav/              backend/s3/
  backend/local/               backend/drive/
  ...                          backend/dropbox/
```

### 2. Componentes Clave

#### **Fs Interface** (filesystem abstraction)
```go
type Fs interface {
    // Basic info
    Name() string              // "webdav", "s3", "local"
    Root() string              // root path
    String() string            // human readable
    
    // Listing
    List(ctx context.Context, dir string) (objs []Object, dirs []Directory, err error)
    ListP(ctx context.Context, dir string, callback ListRCallback) error
    
    // Object operations
    NewObject(ctx context.Context, remote string) (Object, error)
    Put(ctx context.Context, in io.Reader, src ObjectInfo, options ...OpenOption) (Object, error)
    Mkdir(ctx context.Context, path string) error
    Remove(ctx context.Context, path string) error
    RemoveDir(ctx context.Context, dir string) error
    
    // Features
    Features() *Features        // what this Fs can do
    Precision() time.Duration   // modify time precision
}

type Object interface {
    // Metadata
    Remote() string             // name of object
    ModTime(ctx context.Context) time.Time
    Size() int64
    Fs() Fs                     // parent filesystem
    
    // Operations
    Open(ctx context.Context, options ...OpenOption) (io.ReadCloser, error)
    SetModTime(ctx context.Context, t time.Time) error
    Storable(ctx context.Context) bool
    Hash(ctx context.Context, typ string) (string, error)
}
```

#### **Features** (Capabilities Declaration)
```go
type Features struct {
    CanHaveEmptyDirectories bool        // supports empty dirs
    WriteDirSetModTime      bool        // can set dir modtime
    CanWriteMetadata        bool        // can sync metadata
    DuplicateFiles          bool        // can have duplicate names
    SetTier                 bool        // can change storage class
    MimeType                bool        // can set MIME type
    // ... 40+ more features
}
```

Cada backend declara qué puede hacer. El sync engine consulta estas features para decidir qué operaciones ejecutar.

---

## 🌐 WebDAV en rclone

### Ubicación y Estructura

```
backend/webdav/
├── webdav.go           (50KB - implementación principal)
├── chunking.go         (para Nextcloud uploads)
├── tus.go              (TUS protocol - resumable uploads)
├── api/                (HTTP helpers)
└── odrvcookie/         (OneDrive cookies)
```

### Configuración de rclone WebDAV

```go
// Soportados vendors
const vendors = map[string]string{
    "nextcloud":        "Nextcloud",
    "owncloud":         "Owncloud 10",
    "sharepoint":       "Sharepoint Online",
    "sharepoint-ntlm":  "Sharepoint with NTLM",
    "rclone":           "rclone WebDAV server",
    "other":            "Generic WebDAV",
}

// Configuración estructura
type Options struct {
    URL                string          // https://nextcloud.example.com/remote.php/dav/files/user/
    Vendor             string          // nextcloud, owncloud, etc.
    User               string          // username
    Pass               string          // password
    BearerToken        string          // optional bearer token
    BearerTokenCommand string          // command to get token
    Headers            map[string]string // custom headers
    Encoding           string          // character encoding
    NextcloudChunkSize int64           // Nextcloud upload chunk (default 10MB)
    PacerMinSleep      time.Duration   // rate limiting
}
```

### Operaciones WebDAV en rclone

```go
// Implementación de Fs interface para WebDAV

func (f *Fs) List(ctx context.Context, dir string) ([]Object, []Directory, error) {
    // PROPFIND a server
    // Retorna listado de archivos con size, mtime
}

func (f *Fs) Put(ctx context.Context, in io.Reader, src ObjectInfo, ...) (Object, error) {
    // Manejo especial según vendor:
    
    if f.vendor == "nextcloud" {
        // Usa Nextcloud Chunked Upload API
        // Divide en chunks de NextcloudChunkSize (default 10MB)
        // HTTP PUT a /remote.php/dav/uploads/{tempId}/
        // MOVE para finalizar
    } else {
        // WebDAV estándar: HTTP PUT
    }
}

func (f *Fs) NewObject(ctx context.Context, remote string) (Object, error) {
    // HEAD request para obtener size/mtime
}

func (f *Fs) Remove(ctx context.Context, path string) error {
    // HTTP DELETE
}

func (f *Fs) Mkdir(ctx context.Context, path string) error {
    // HTTP MKCOL (WebDAV make collection)
}

func (f *Fs) Copy(ctx context.Context, src string, dst string, ...) (Object, error) {
    // HTTP COPY (server-side copy, si soporta)
}
```

### Detección de Cambios en WebDAV

rclone usa **tres estrategias** (en orden de preferencia):

```go
// 1. Usar PROPFIND getetag (ETag)
// Si servidor soporta, ETag cambia cuando archivo cambia
if etagSupported {
    etag1 := GetETag(remoteFile)
    // ... cambios ...
    etag2 := GetETag(remoteFile)
    if etag1 != etag2 {
        // Archivo cambió
    }
}

// 2. Usar Modification Time (mtime) + Modify Window
// Compara mtime local vs remoto con ventana de tolerancia
modifyWindow := 100 * time.Millisecond // precision
if abs(local.ModTime - remote.ModTime) > modifyWindow {
    // Archivo cambió
}

// 3. Comparar Size + Hash (último recurso)
// Si mtime no es confiable
if local.Size != remote.Size {
    // Cambió
} else if local.Hash != remote.Hash {
    // Modificación sin cambio de size
}
```

### Chunking para Nextcloud

Nextcloud tiene un protocolo especial para uploads grandes (para evitar timeouts):

```go
// Nextcloud Chunked Upload Flow:

// 1. Iniciar upload: POST /remote.php/dav/uploads/{userId}/new-chunked
uploadId := "abc123"

// 2. Subir chunks en paralelo: PUT /uploads/{userId}/{uploadId}/{chunkIndex}
for chunkIndex, chunk := range chunks {
    PUT(fmt.Sprintf("/uploads/%s/%s/%d", userId, uploadId, chunkIndex), chunk)
}

// 3. Finalizar: MOVE /uploads/{userId}/{uploadId} → /files/{userId}/filename
MOVE(uploadUrl, finalPath)
```

**¿Por qué?** Permite:
- Subir archivos grandes sin timeout HTTP
- Retry de chunks individuales
- Uploads paralelos
- Resume si conexión se cae

---

## 🔄 Sincronización: Unidireccional vs Bidireccional

### 1. Sync Unidireccional (rclone sync)

**Objetivo**: `Make source and dest identical, modifying destination only`

```
laptop/           nextcloud/
├── file1.txt     ├── file1.txt (old version)
├── file2.txt     ├── file2.txt
├── file3.txt     └── file4.txt (no en laptop)
└── file5.txt
        ↓ rclone sync laptop nextcloud
nextcloud/
├── file1.txt (actualizado)
├── file2.txt
├── file3.txt (nuevo)
└── file5.txt (nuevo)
        ↑ file4.txt eliminado
```

**Algoritmo**:
```go
func Sync(ctx context.Context, src, dst Fs) error {
    // 1. Listar ambos lados
    srcObjs := src.List(ctx, "")
    dstObjs := dst.List(ctx, "")
    
    // 2. Comparar
    for _, srcObj := range srcObjs {
        dstObj := findByName(dstObjs, srcObj.Name)
        
        if dstObj == nil {
            // Nuevo en source → copiar
            dst.Put(ctx, srcObj)
        } else if needsUpdate(srcObj, dstObj) {
            // Cambió en source → sobrescribir
            dst.Delete(ctx, dstObj)
            dst.Put(ctx, srcObj)
        }
    }
    
    // 3. Limpiar destination
    for _, dstObj := range dstObjs {
        srcObj := findByName(srcObjs, dstObj.Name)
        if srcObj == nil {
            // En destination pero no en source → eliminar
            dst.Delete(ctx, dstObj)
        }
    }
}
```

### 2. Sync Bidireccional (rclone bisync)

**Objetivo**: Sincronizar cambios en AMBAS direcciones

```
Día 1:
laptop/           nextcloud/
├── a.txt         ├── a.txt
└── b.txt         └── b.txt

Día 2 (cambios divergentes):
laptop/           nextcloud/
├── a.txt (mod)   ├── a.txt (mod DIFERENTE)
├── b.txt         ├── b.txt
├── c.txt         └── d.txt
    ↓ bisync
    
Resultado (después resolución de conflictos):
laptop/           nextcloud/
├── a.txt.*       ├── a.txt.* (conflicto - ambas versiones guardadas)
├── b.txt         ├── b.txt
├── c.txt         ├── c.txt (copiado de laptop)
└── d.txt         └── d.txt (copiado de nextcloud)
```

**Bisync mantiene un estado previo** (snapshot) de ambos lados:

```
.bisync/
├── laptop.bak.1   (estado previo de laptop)
├── nextcloud.bak.1
├── laptop.list    (listado actual de laptop)
├── nextcloud.list
└── bisync.log
```

**Algoritmo simplificado**:
```go
func BiSync(ctx context.Context, src, dst Fs) error {
    // 1. Cargar estado previo
    prevSrc := LoadSnapshot(ctx, "src.bak")
    prevDst := LoadSnapshot(ctx, "dst.bak")
    
    // 2. Listar estado actual
    currSrc := src.List(ctx, "")
    currDst := dst.List(ctx, "")
    
    // 3. Calcular deltas
    // Qué cambió en source desde último sync
    deltasSrc := Diff(prevSrc, currSrc)
    // Qué cambió en destination desde último sync
    deltasDst := Diff(prevDst, currDst)
    
    // 4. Detectar conflictos
    conflicts := FindConflicts(deltasSrc, deltasDst)
    
    // 5. Resolver conflictos
    for _, conflict := range conflicts {
        // Estrategias: newer, older, larger, local-wins, remote-wins
        resolution := ResolveConflict(conflict, strategy)
        Apply(ctx, resolution)
    }
    
    // 6. Aplicar cambios
    for _, delta := range deltasSrc {
        if !HasConflict(delta) {
            // Cambió en source, no en destination
            // Copiar a destination
            dst.Put(ctx, delta)
        }
    }
    
    // 7. Guardar snapshots para próximo sync
    SaveSnapshot(ctx, currSrc, "src.bak")
    SaveSnapshot(ctx, currDst, "dst.bak")
}
```

---

## 🔍 Detección de Cambios: La Estrategia de rclone

### Comparación de Objetos

```go
// rclone compara objetos usando TRES criterios:

func NeedsTransfer(src, dst Object, modifyWindow time.Duration) bool {
    // 1. TAMAÑO - diferente → necesita transferencia
    if src.Size() != dst.Size() {
        return true
    }
    
    // 2. MODIFICATION TIME - con ventana de tolerancia
    srcMod := src.ModTime(ctx)
    dstMod := dst.ModTime(ctx)
    if abs(srcMod - dstMod) > modifyWindow {
        return true
    }
    
    // 3. HASH - comparación de contenido (última opción)
    // Solo si tamaño igual y mtime similar pero no confiable
    if src.Hash(ctx, "MD5") != dst.Hash(ctx, "MD5") {
        return true
    }
    
    return false
}
```

### Problemas Resueltos por rclone

```
┌─────────────────────────────────────┐
│ Problema: ¿Cuándo un archivo cambió?│
├─────────────────────────────────────┤
│ ✓ Size change          → Confiable  │
│ ? Mtime change         → No siempre  │
│ ✗ Hash match           → Lento      │
└─────────────────────────────────────┘

Solución de rclone:
    Size distinto?        SÍ → cambió
                          NO ↓
    Mtime distinto?       SÍ → cambió (probablemente)
    (con ventana)         NO ↓
    Hash distinto?        SÍ → cambió (poco probable)
                          NO → no cambió
```

**⚠️ Diferencia con Chronex**:
- rclone: size + mtime + hash (basado en metadatos)
- Chronex: FastCDC + contenido (basado en contenido)
  - Ventaja: detecta cambios a nivel de chunks
  - Desventaja: más CPU intensive

---

## 📁 Estructura de Directorios en rclone

rclone es agnóstico de estructura. No impone un layout específico. El usuario define:

```bash
# Sincronizar directorio local a Nextcloud
rclone sync ~/MyNotes nextcloud:my-notes

# Resultado en servidor:
nextcloud:my-notes/
├── file1.txt
├── file2.txt
├── subdir/
│   └── file3.txt
```

**Comparar con Chronex**:
- rclone: estructura de usuario, agnóstica
- Chronex: estructura definida (/chunks, /snapshots, /refs)
  - Razón: Chronex necesita identificar dónde guardar chunks encriptados

---

## 🔐 Encriptación en rclone

rclone soporta encriptación con el backend `crypt`:

```bash
rclone config create encrypted crypt \
  remote nextcloud:secure \
  password mypassword \
  salt mysalt

# Los archivos en nextcloud están encriptados
# Pero es CAPA ADICIONAL, no integrada en sincronización
```

**Diferencia con Chronex**:
- rclone: encriptación es backend separado (crypt)
- Chronex: encriptación integrada en sync engine
  - Todos los chunks se encriptan antes de salir
  - Key derivation desde contraseña de usuario

---

## 🎯 Lecciones para Chronex

### 1. **Abstracción de Provider**

rclone demuestra que una interfaz simple (Fs/Object) permite soportar 70+ proveedores.

```go
// Para Chronex, podríamos usar:
type Provider interface {
    UploadChunk(ctx context.Context, hash string, data []byte) error
    DownloadChunk(ctx context.Context, hash string) ([]byte, error)
    UploadSnapshot(ctx context.Context, id string, data []byte) error
    DownloadSnapshot(ctx context.Context, id string) ([]byte, error)
    ListChunks(ctx context.Context) ([]string, error)
    DeleteChunk(ctx context.Context, hash string) error
}

// Implementaciones:
// - WebDAVProvider (gowebdav)
// - S3Provider (aws-sdk)
// - LocalProvider (filesystem)
```

### 2. **Features Capabilities**

Cada provider declara qué puede hacer, el sync engine decide qué usar.

```go
// Para Chronex:
type ProviderFeatures struct {
    SupportsParallelUpload  bool
    SupportsServerMove      bool  // server-side rename
    SupportsBandwidthLimit  bool
    MaxChunkSize            int64
    MaxConcurrentUploads    int
    SupportsProgress        bool
}
```

### 3. **Change Detection Strategy**

Chronex debería soportar múltiples estrategias (como rclone):

```go
enum ChangeDetectionStrategy {
    // 1. Hash-based (what we use)
    FastCDC,
    
    // 2. Metadata-based (for future)
    SizeAndMtime,
    
    // 3. Hybrid
    Hybrid, // use both
}
```

### 4. **Sync State Snapshots**

Como bisync, Chronex debería guardar snapshots del estado remoto:

```go
type SyncSnapshot struct {
    Timestamp     int64
    RemoteChunks  map[string]ChunkInfo // hash → {size, mtime}
    RemoteSnaps   map[string]SnapInfo  // id → {timestamp}
}

// En SQLite:
CREATE TABLE sync_state (
    id INTEGER PRIMARY KEY,
    provider_name TEXT,
    last_sync_time INTEGER,
    remote_chunks_hash TEXT, // JSON de chunks remotos
    remote_snaps_hash TEXT   // JSON de snapshots remotos
);
```

---

## 📊 Tabla Comparativa: rclone vs Chronex

| Aspecto | rclone | Chronex |
|---------|--------|---------|
| **Propósito** | Sincronización genérica CLI | Sync específico para datos personales |
| **Detección** | size + mtime + hash | FastCDC + SHA-256 |
| **Encriptación** | Backend adicional (crypt) | Integrada (AES-256) |
| **Sync** | Unidireccional (copy/sync) | Bidireccional |
| **Deduplicación** | En destino (no automática) | Automática (chunks) |
| **UI** | CLI | Desktop app (Electron) |
| **Estructura** | Agnóstica del usuario | Predefinida (/chunks, /refs) |
| **Conflictos** | Sobreescribir o renombrar | Manual en UI |
| **Performance** | Bueno (size/mtime rápido) | Mejor (chunking + local cache) |
| **WebDAV** | gowebdav para PUT/GET | gowebdav mismo |
| **Nextcloud Chunks** | Sí (10MB default) | Sí (16-64KB en Chronex) |

---

## 💾 Implementación para Chronex (Basada en rclone)

### Interfaz Provider

```go
package sync

import (
    "context"
    "io"
)

type Provider interface {
    // Metadata operations
    Name() string
    Features() *ProviderFeatures
    
    // Chunk operations
    UploadChunk(ctx context.Context, hash string, data []byte) error
    DownloadChunk(ctx context.Context, hash string) ([]byte, error)
    ChunkExists(ctx context.Context, hash string) (bool, error)
    DeleteChunk(ctx context.Context, hash string) error
    ListChunks(ctx context.Context) ([]string, error)
    
    // Snapshot operations
    UploadSnapshot(ctx context.Context, id string, data []byte) error
    DownloadSnapshot(ctx context.Context, id string) ([]byte, error)
    LatestSnapshot(ctx context.Context) (string, error)
    DeleteSnapshot(ctx context.Context, id string) error
    
    // Reference operations (latest, tags, etc)
    UpdateRef(ctx context.Context, refName string, snapshotId string) error
    GetRef(ctx context.Context, refName string) (string, error)
}

type ProviderFeatures struct {
    Encrypted       bool   // already encrypted?
    Concurrent      int    // max concurrent ops
    MaxChunkSize    int64
    MinChunkSize    int64
    RateLimitMB     int    // MB/s limit
}
```

### Implementación WebDAV

```go
package providers

import "github.com/studio-b12/gowebdav"

type WebDAVProvider struct {
    client      *gowebdav.Client
    baseURL     string
    encryptKey  []byte // AES key
}

func (p *WebDAVProvider) UploadChunk(ctx context.Context, hash string, data []byte) error {
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", hash)
    return p.client.WriteStream(path, bytes.NewReader(data), os.ModePerm)
}

func (p *WebDAVProvider) DownloadChunk(ctx context.Context, hash string) ([]byte, error) {
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", hash)
    reader, err := p.client.ReadStream(path)
    if err != nil {
        return nil, err
    }
    defer reader.Close()
    return io.ReadAll(reader)
}

func (p *WebDAVProvider) ListChunks(ctx context.Context) ([]string, error) {
    files, err := p.client.ReadDir("/chronex/chunks")
    if err != nil {
        return nil, err
    }
    
    var chunks []string
    for _, f := range files {
        if strings.HasSuffix(f.Name(), ".chunk") {
            hash := strings.TrimSuffix(f.Name(), ".chunk")
            chunks = append(chunks, hash)
        }
    }
    return chunks, nil
}
```

---

## ✅ Conclusión

**rclone demuestra**:
1. ✅ Abstracción simple permite múltiples backends
2. ✅ Detección de cambios puede ser multinivel
3. ✅ Sincronización bidireccional necesita snapshots de estado
4. ✅ WebDAV es viable para sincronización
5. ✅ Chunking es clave para performance (especialmente Nextcloud)

**Para Chronex**:
- Adoptar arquitectura de Provider agnóstica
- Usar gowebdav como lo hace rclone
- Implementar snapshots como bisync
- Pero diferenciador: integrar encriptación + FastCDC desde el inicio
