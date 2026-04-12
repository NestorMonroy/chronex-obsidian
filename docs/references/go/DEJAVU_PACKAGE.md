# DejaVu - Go Package for Data Snapshots & Synchronization

## 📋 Resumen Ejecutivo

**DejaVu** es una librería Go que proporciona:
- ✅ Sistema de snapshots para datos
- ✅ Versionado tipo Git
- ✅ Sincronización a múltiples backends
- ✅ Abstracción de almacenamiento en la nube
- ✅ Encriptación AES-256 end-to-end

**Licencia**: GNU AFFERO GENERAL PUBLIC LICENSE, Version 3

**Repositorio**: [github.com/siyuan-note/dejavu](https://github.com/siyuan-note/dejavu)

**Usado por**: SiYuan Note (PKM open source)

---

## 🏗️ Arquitectura General

### Propósito

DejaVu resuelve el problema de:
```
"¿Cómo sincronizar datos entre dispositivos?"

SIN:
- Servidor central
- Dependencias de terceros
- Pérdida de privacidad

CON:
- Snapshots versionados
- Múltiples backends
- Control total del usuario
```

### Componentes Principales

```
┌──────────────────────────────────────────────┐
│ DejaVu Package (github.com/siyuan-note/dejavu)
├──────────────────────────────────────────────┤
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Core (Repo, Index, Checkout)            │ │
│  │ ├─ Repo: Gestionar snapshots            │ │
│  │ ├─ Index: Indexar archivos              │ │
│  │ └─ Checkout: Restaurar datos            │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Sync (SyncDownload, SyncUpload)         │ │
│  │ ├─ Sincronización bidireccional         │ │
│  │ ├─ Resolución automática de conflictos  │ │
│  │ └─ Merge de cambios                     │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Cloud (Abstracción de Almacenamiento)   │ │
│  │ ├─ Interface Cloud                      │ │
│  │ ├─ SiYuan (servidor oficial)            │ │
│  │ ├─ S3 (AWS, MinIO, etc)                 │ │
│  │ ├─ WebDAV (Nextcloud, etc)              │ │
│  │ └─ Local (filesystem)                   │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Storage (Índices, Chunks, Referencias)  │ │
│  │ ├─ indexes/: Snapshots etiquetados      │ │
│  │ ├─ objects/: Chunks de datos            │ │
│  │ └─ refs/: latest, tags                  │ │
│  └─────────────────────────────────────────┘ │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 📦 Estructura del Repositorio DejaVu

### Componentes en Disco

```
repo/
├── indexes/                    ← Snapshots indexados
│   ├── a1/
│   │   └── b2c3d4e5f6...      ← Snapshot #1 (JSON)
│   └── f7/
│       └── 8e9d0a1b2c...      ← Snapshot #2 (JSON)
│
├── objects/                    ← Chunks de datos
│   ├── 00/
│   │   ├── 1a2b3c4d5e...      ← Chunk encriptado + comprimido
│   │   └── 5f6g7h8i9j...
│   ├── 01/
│   │   └── ...
│   └── ff/
│       └── ...
│
├── refs/                       ← Referencias
│   ├── latest                  ← Apunta a último snapshot
│   └── tags/
│       ├── v1.0.0
│       └── backup-2024-04-12
│
└── locks/                      ← Control de concurrencia
    └── sync.lock
```

### Estructura de un Snapshot (Index)

```json
{
  "id": "a1b2c3d4e5f6...",
  "created": 1712961600000,
  "deviceID": "device-abc-123",
  "deviceName": "MyLaptop",
  "deviceOS": "darwin",
  "fileCount": 1256,
  "size": 52428800,
  "entries": [
    {
      "path": "data/202404/note1.md",
      "size": 4096,
      "updated": 1712961500000,
      "chunks": ["chunk_hash_1", "chunk_hash_2"]
    },
    {
      "path": "data/202404/note2.md",
      "size": 8192,
      "updated": 1712961450000,
      "chunks": ["chunk_hash_3"]
    }
  ]
}
```

---

## 🔑 API Principal de DejaVu

### 1. Crear Repositorio: `NewRepo()`

```go
// Función:
func NewRepo(
    dataPath string,        // Ruta donde están los datos
    repoPath string,        // Ruta del repositorio (.siyuan/repo)
    historyPath string,     // Historial de cambios
    tempPath string,        // Archivos temporales
    deviceID string,        // ID único del dispositivo
    deviceName string,      // Nombre legible del dispositivo
    deviceOS string,        // Sistema operativo
    aesKey []byte,          // Clave AES-256 para encriptación
    ignoreLines []string,   // Patrones a ignorar
    cloud Cloud,            // Provider de almacenamiento en nube
) (*Repo, error)

// Uso:
repo, err := dejavu.NewRepo(
    util.DataDir,
    util.RepoDir,
    util.HistoryDir,
    util.TempDir,
    conf.System.ID,
    conf.System.Name,
    conf.System.OS,
    encryptionKey,
    ignorePatterns,
    cloudProvider,  // WebDAV, S3, Local, etc
)
```

### 2. Indexar Archivos: `Index()`

```go
// Función:
func (r *Repo) Index(context map[string]interface{}) (*Index, error)

// Propósito:
// Escanear directorio de datos y crear Index (snapshot)
// Detectar cambios desde último Index
// Crear hashes de nuevos archivos

// Uso:
context := map[string]interface{}{
    eventbus.CtxPushMsg: eventbus.CtxPushMsgToStatusBar,
}

index, err := repo.Index(context)
if err != nil {
    // Manejar error
}

fmt.Printf("Indexed %d files\n", index.FileCount)
```

### 3. Restaurar Datos: `Checkout()`

```go
// Función:
func (r *Repo) Checkout(context map[string]interface{}) (
    upserts []string,  // Archivos nuevos/modificados
    removes []string,  // Archivos eliminados
    error,
)

// Propósito:
// Extraer datos del repositorio al directorio de datos
// Reconstruir árbol de archivos desde chunks
// Detectar cambios (upserts y removes)

// Uso:
upserts, removes, err := repo.Checkout(context)

fmt.Printf("Updated %d files\n", len(upserts))
fmt.Printf("Deleted %d files\n", len(removes))
```

### 4. Sincronizar Descargas: `SyncDownload()`

```go
// Función:
func (r *Repo) SyncDownload(
    context map[string]interface{},
) (*MergeResult, *TrafficStat, error)

// Propósito:
// Descargar cambios desde backend remoto
// Realizar merge automático
// Actualizar repositorio local

// Retorno:
// - MergeResult: Cambios detectados (conflicts, upserts, removes)
// - TrafficStat: Estadísticas (files, chunks, bytes)

// Uso:
mergeResult, traffic, err := repo.SyncDownload(context)

fmt.Printf("Files downloaded: %d\n", traffic.DownloadFileCount)
fmt.Printf("Bytes: %s\n", humanize.Bytes(traffic.DownloadBytes))

if len(mergeResult.Conflicts) > 0 {
    fmt.Printf("Conflicts: %d\n", len(mergeResult.Conflicts))
}
```

### 5. Sincronizar Subidas: `SyncUpload()`

```go
// Función:
func (r *Repo) SyncUpload(
    context map[string]interface{},
) (*MergeResult, *TrafficStat, error)

// Propósito:
// Subir cambios locales a backend remoto
// Realizar merge automático
// Actualizar referencias

// Uso:
mergeResult, traffic, err := repo.SyncUpload(context)

fmt.Printf("Files uploaded: %d\n", traffic.UploadFileCount)
fmt.Printf("Bytes: %s\n", humanize.Bytes(traffic.UploadBytes))
```

### 6. Obtener Snapshot Actual: `Latest()`

```go
// Función:
func (r *Repo) Latest() (*Index, error)

// Propósito:
// Obtener el snapshot más reciente

// Uso:
latest, err := repo.Latest()
fmt.Printf("Latest snapshot: %s (%d files)\n", latest.ID, latest.FileCount)
```

### 7. Obtener Snapshot Específico: `GetIndex()`

```go
// Función:
func (r *Repo) GetIndex(id string) (*Index, error)

// Propósito:
// Recuperar snapshot específico por ID

// Uso:
snapshot, err := repo.GetIndex("a1b2c3d4...")
```

### 8. Crear Tag: `CreateTag()`

```go
// Función:
func (r *Repo) CreateTag(name string, id string) error

// Propósito:
// Marcar snapshot con nombre legible (v1.0.0, backup-2024-04-12)

// Uso:
err := repo.CreateTag("v1.0.0", snapshotID)
```

---

## ☁️ Interface Cloud (Abstracción de Almacenamiento)

### Definición de Interface

```go
type Cloud interface {
    // Operaciones básicas de objetos
    GetObject(key string) ([]byte, error)
    PutObject(key string, data []byte) error
    RemoveObject(key string) error
    
    // Listar objetos
    ListObjects(pathPrefix string) ([]string, error)
    
    // Operaciones de índices
    GetIndex(id string) (*Index, error)
    PutIndex(index *Index) error
    RemoveIndex(id string) error
    
    // Operaciones de repositorio
    GetRepos() ([]string, error)
    
    // Sincronización
    SyncDownload(...) error
    SyncUpload(...) error
}
```

### Implementaciones de Cloud

#### 1. SiYuan Cloud (Servidor Oficial)

```go
cloud.NewSiYuan(&cloud.BaseCloud{Conf: cloudConf})

Características:
- Servidor propietario de SiYuan
- Requiere suscripción
- API HTTP personalizada
- Almacenamiento en servidores de SiYuan
```

#### 2. S3 Cloud (AWS, MinIO, etc)

```go
s3HTTPClient := &http.Client{
    Transport: httpclient.NewTransport(skipTLS),
}
s3HTTPClient.Timeout = time.Duration(conf.S3.Timeout) * time.Second

cloud.NewS3(
    &cloud.BaseCloud{Conf: cloudConf},
    s3HTTPClient,
)

Características:
- Compatible con AWS S3
- Soporta MinIO (self-hosted)
- DigitalOcean Spaces
- Buckets privados
- Control total de datos
```

#### 3. WebDAV Cloud (Nextcloud, OwnCloud, etc)

```go
webdavClient := gowebdav.NewClient(
    endpoint,
    username,
    password,
)
webdavClient.SetHeader("Authorization", basicAuth)
webdavClient.SetTimeout(timeout)

cloud.NewWebDAV(
    &cloud.BaseCloud{Conf: cloudConf},
    webdavClient,
)

Características:
- Compatible con Nextcloud
- OwnCloud
- Servidores WebDAV personalizados
- Autenticación Basic Auth
- HTTP/HTTPS seguro
```

#### 4. Local Cloud (Filesystem)

```go
cloud.NewLocal(&cloud.BaseCloud{Conf: cloudConf})

Características:
- Almacenar en filesystem local
- Útil para NAS
- Backups locales
- Desarrollo/testing
```

---

## 🔄 Flujo Completo de Sincronización

### Scenario: Usuario Modifica Documentos

```
1. Usuario edita archivos localmente
   datos/
   ├── file1.md (modificado)
   ├── file2.md (nuevo)
   └── file3.md (sin cambios)

2. Aplicación llama repo.Index()
   └─ Escanea archivos
   └─ Crea snapshot
   └─ Calcula hashes

3. Aplicación llama repo.SyncUpload()
   ├─ Compara con último snapshot remoto
   ├─ Detecta cambios
   ├─ Sube chunks nuevos a cloud provider
   ├─ Sube snapshot metadata
   └─ Actualiza "latest" reference

4. Cloud provider almacena
   S3/WebDAV/etc:
   └─ chunks/ nuevos
   └─ indexes/ actualizado

5. Otro dispositivo sincroniza
   repo.SyncDownload():
   ├─ Pregunta al cloud: ¿hay cambios?
   ├─ Cloud responde: "último snapshot es XYZ"
   ├─ Descarga chunks faltantes
   ├─ repo.Checkout() reconstruye archivos
   └─ Archivos actualizados localmente
```

---

## 🔐 Encriptación & Seguridad

### Proceso de Encriptación

```
1. Usuario proporciona password

2. Derivar clave con Scrypt:
   masterKey = Scrypt(password, salt, N, r, p)

3. Encriptar chunks:
   encryptedChunk = AES-256-CTR(chunk, masterKey)

4. Autenticar con MAC:
   mac = Poly1305(encryptedChunk)

5. Almacenar:
   [IV || EncryptedData || MAC]

6. En cloud:
   └─ Datos completamente encriptados
   └─ Servidor NO puede leer contenido
   └─ Integridad garantizada por MAC
```

### Propiedades de Seguridad

```
✅ End-to-End Encryption
   - Cloud provider no ve plaintext
   
✅ Integridad Verificada
   - MAC detecta tampering
   
✅ Derivación Segura
   - Scrypt resistente a fuerza bruta
   
✅ No Key Sharing
   - Password nunca se transmite
   - Solo user conoce masterKey
```

---

## 📊 Estructura de MergeResult

```go
type MergeResult struct {
    Upserts   []string     // Archivos nuevos/modificados
    Removes   []string     // Archivos eliminados
    Conflicts []Conflict   // Conflictos detectados
}

type Conflict struct {
    Path      string       // Ruta del archivo conflictivo
    LocalTime int64        // Timestamp local
    RemoteTime int64       // Timestamp remoto
    LocalHash string       // Hash de versión local
    RemoteHash string      // Hash de versión remota
}
```

---

## 📊 Estructura de TrafficStat

```go
type TrafficStat struct {
    UploadFileCount   int    // Archivos subidos
    DownloadFileCount int    // Archivos descargados
    UploadChunkCount  int    // Chunks subidos
    DownloadChunkCount int   // Chunks descargados
    UploadBytes       int64  // Bytes subidos
    DownloadBytes     int64  // Bytes descargados
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear Repositorio y Hacer Snapshot

```go
package main

import (
    "github.com/siyuan-note/dejavu"
    "github.com/siyuan-note/dejavu/cloud"
)

func main() {
    // Crear proveedor WebDAV
    cloudConf := &cloud.BaseCloud{
        Conf: &conf.Cloud{
            WebDAV: &conf.WebDAV{
                Endpoint: "https://nextcloud.example.com/dav",
                Username: "usuario",
                Password: "contraseña",
                Timeout: 30,
            },
        },
    }
    
    webdavClient := gowebdav.NewClient(
        "https://nextcloud.example.com/dav",
        "usuario",
        "contraseña",
    )
    
    cloudProvider := cloud.NewWebDAV(cloudConf, webdavClient)
    
    // Crear repositorio
    repo, err := dejavu.NewRepo(
        "/home/user/data",           // dataPath
        "/home/user/.siyuan/repo",   // repoPath
        "/home/user/.siyuan/history",// historyPath
        "/tmp/chronex",              // tempPath
        "device-12345",              // deviceID
        "My Laptop",                 // deviceName
        "linux",                     // deviceOS
        encryptionKey,               // aesKey
        []string{"*.tmp", ".DS_Store"}, // ignoreLines
        cloudProvider,               // cloud
    )
    
    if err != nil {
        panic(err)
    }
    
    // Crear snapshot (index)
    index, err := repo.Index(context)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Snapshot created: %s (%d files)\n", index.ID, index.FileCount)
    
    // Subir a cloud
    mergeResult, traffic, err := repo.SyncUpload(context)
    
    fmt.Printf("Uploaded %d files, %s\n", 
        traffic.UploadFileCount,
        humanize.Bytes(uint64(traffic.UploadBytes)),
    )
}
```

### Ejemplo 2: Descargar desde Cloud

```go
// En otro dispositivo
repo2, _ := dejavu.NewRepo(...)

// Descargar cambios
mergeResult, traffic, err := repo2.SyncDownload(context)

// Restaurar datos
upserts, removes, err := repo2.Checkout(context)

fmt.Printf("Updated %d files, removed %d files\n", 
    len(upserts), 
    len(removes),
)
```

---

## 🎯 Ventajas de DejaVu

```
✅ Versionado Completo
   - Snapshots etiquetables
   - Historial de cambios
   - Rollback sencillo

✅ Abstracción de Almacenamiento
   - Múltiples backends intercambiables
   - SiYuan + S3 + WebDAV + Local
   - Sin vendor lock-in

✅ Encriptación Integrada
   - AES-256 end-to-end
   - Transparente para usuario

✅ Sincronización Bidireccional
   - Download y upload
   - Merge automático
   - Detección de conflictos

✅ Deduplicación
   - Chunks compartidos
   - Ahorro de espacio
   - Eficiente en transferencia

✅ Probado en Producción
   - Usado por SiYuan (millones usuarios)
   - Código maduro
   - Open source
```

---

## ❌ Limitaciones

```
❌ Complejidad
   - Múltiples componentes
   - Curva de aprendizaje
   - Debugging distribuido

❌ Deduplicación a Nivel de Archivo
   - No CDC (content-defined chunking)
   - Cambios pequeños afectan todo archivo
   - Menos eficiente que Restic

❌ Dependencia de Cloud
   - Requiere proveedor confiable
   - Sin verdadera descentralización
   - Latencia de red

❌ Retención de Datos
   - Requiere configuración
   - Datos se pueden perder si no hay pinning
```

---

## 🔗 Comparación: DejaVu vs Alternativas

| Aspecto | DejaVu | Git | Restic | IPFS |
|---------|--------|-----|--------|------|
| **Versionado** | ✅ Sí | ✅ Sí | ⚠️ Snapshots | ✅ DAG |
| **Multi-backend** | ✅ Sí | ❌ No | ✅ Sí | ❌ IPFS only |
| **Encriptación** | ✅ Sí | ❌ No | ✅ Sí | ⚠️ Opcional |
| **Deduplicación** | ✅ Chunks | Delta | ✅ CDC | ✅ Global |
| **Complejidad** | Alta | Baja | Media | Muy Alta |
| **Usado para** | Datos | Código | Backup | Distribuido |

---

## 🚀 Casos de Uso de DejaVu

```
✅ Aplicaciones de Notas (como SiYuan)
   - Versionado de documentos
   - Multi-dispositivo sync
   - Backup automático

✅ PKM (Personal Knowledge Management)
   - Historial de cambios
   - Snapshots etiquetables
   - Sincronización transparente

✅ Aplicaciones con Datos Locales
   - Encriptación integrada
   - Múltiples backends
   - Control del usuario
```

---

## 📚 Referencias

- [DejaVu GitHub Repository](https://github.com/siyuan-note/dejavu)
- [DejaVu Cloud Package](https://pkg.go.dev/github.com/siyuan-note/dejavu/cloud)
- [SiYuan Project](https://github.com/siyuan-note/siyuan)
- [DejaVu Architecture Overview](https://dejavurepo.github.io/)

---

## ✅ Conclusión

**DejaVu** es una **librería Go madura y probada** para:
- ✅ Snapshots y versionado de datos
- ✅ Sincronización multi-dispositivo
- ✅ Encriptación end-to-end
- ✅ Múltiples backends de almacenamiento

**Para Chronex**:
- 🤔 Podríamos usar DejaVu directamente (like SiYuan)
- 🤔 O inspirarnos en su arquitectura pero usar SQLite + CDC
- ✅ Recomendación actual: Arquitectura propia más simple

DejaVu es excelente pero **agrega overhead** si solo necesitamos versionado simple con snapshots. Para Chronex, un sistema basado en SQLite + CDC es suficiente y más controlable.
