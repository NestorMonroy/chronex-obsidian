# Análisis del Paquete DejaVu - Sistema de Sincronización de SiYuan

## 📋 Resumen Ejecutivo

**DejaVu** es la librería Go que SiYuan usa para **snapshots y sincronización de datos**. Es un sistema inspirado en Git pero optimizado específicamente para:

- ✅ Control de versiones de documentos
- ✅ Deduplicación de archivos mediante fragmentación (chunks)
- ✅ Compresión de datos
- ✅ Encriptación AES-256 end-to-end
- ✅ Sincronización multi-dispositivo a través de múltiples proveedores

**Licencia**: GNU AFFERO GENERAL PUBLIC LICENSE, Version 3 (open source)

**Repositorio Oficial**: [github.com/siyuan-note/dejavu](https://github.com/siyuan-note/dejavu)

---

## 🏗️ Arquitectura de DejaVu

### 1. Concepto Fundamental: Snapshots

DejaVu NO sincroniza archivos directamente. En su lugar, **crea snapshots (instantáneas)** del estado completo de los datos en momentos específicos.

```
Snapshot = Estado completo de todos los documentos en un momento T
          └─ Identificado por SHA-1 (como Git commits)
          └─ Contiene: Index + File Metadata + Chunks
```

### 2. Cuatro Entidades Principales

#### A. **Index** (Índice)
```
Index = Metadatos de un snapshot
├─ ID: SHA-1 hash
├─ Created: Timestamp de creación
├─ FileCount: Cantidad total de archivos
├─ Size: Tamaño total en bytes
└─ Files: Lista de archivos en el snapshot
```

**Ejemplo**:
```json
{
  "id": "a1b2c3d4e5f6...",
  "created": 1712961600000,
  "fileCount": 1256,
  "size": 52428800,
  "files": [
    {
      "path": "data/202404/note1.md",
      "size": 4096,
      "updated": 1712961500000,
      "chunks": ["chunk1", "chunk2"]
    }
  ]
}
```

#### B. **File** (Archivo)
```
File = Metadatos de un archivo individual
├─ Path: Ruta relativa (ej: data/202404/note1.md)
├─ Size: Tamaño en bytes
├─ Updated: Timestamp de última modificación
└─ Chunks: Lista de IDs de fragmentos que componen el archivo
```

#### C. **Chunk** (Fragmento)
```
Chunk = Bloque de datos actual (4KB - 64KB típicamente)
├─ ID: SHA-1 del contenido (content-addressed)
├─ Data: Contenido binario (comprimido + encriptado)
└─ [Compartido entre múltiples archivos si contenido es idéntico]
```

**Ventaja**: Si 100 archivos tienen un bloque idéntico, se almacena UNA SOLA VEZ. Deduplicación automática.

#### D. **References** (Referencias)
```
latest  → Apunta al snapshot más reciente
tags    → Versiones marcadas específicamente
         └─ v1.0.0
         └─ backup-2024-04-12
```

### 3. Estructura del Repositorio en Disco

```
repo/                              ← Almacenamiento DejaVu
├── indexes/                        ← Snapshots indexados
│   ├── a1/
│   │   └── b2c3d4e5f6...json      ← Snapshot #1
│   └── f7/
│       └── 8e9d0a1b2c...json      ← Snapshot #2
│
├── objects/                        ← Chunks de datos
│   ├── 00/                         ← Primeros 2 caracteres del SHA-1
│   │   ├── 1a2b3c4d5e...          ← Chunk #1 (comprimido + encriptado)
│   │   └── 5f6g7h8i9j...          ← Chunk #2
│   ├── 01/
│   │   └── ...
│   └── ff/
│       └── ...
│
└── refs/                           ← Referencias
    ├── latest                      ← Apunta a último snapshot
    └── tags/
        ├── v1.0.0
        └── backup-2024-04-12
```

**Nota**: Los chunks se organizan en subdirectorios de 2 caracteres para eficiencia de búsqueda.

---

## 🔄 Flujo de Sincronización (SyncDownload/SyncUpload)

### A. Sincronización Manual (sync_manual.go)

Inicio del proceso: Usuario hace click en "Sync"

```
Usuario solicita sync
    ↓
SiYuan obtiene snapshot local (latest index)
    ↓
Se conecta al servidor WebDAV/S3/etc
    ↓
Obtiene snapshot remoto (latest index)
    ↓
Comparar ambos snapshots
    ├─ Si son idénticos → No hay cambios
    ├─ Si local > remote → SyncUpload (subir cambios)
    └─ Si remote > local → SyncDownload (descargar cambios)
        ├─ Si ambos tienen cambios → Detección de conflicto
        └─ Resolver conflicto (user input o estrategia automática)
```

### B. Sincronización Automática (sync.go)

```
Timer dispara cada Conf.Sync.Interval segundos (default 30s)
    ↓
SyncDataJob() → SyncData(false)
    ↓
Mismo flujo que sincronización manual
    ↓
Si hay error: planificar reintentos con backoff exponencial
```

### C. Detección de Cambios: Hashes

DejaVu usa hashes SHA-1 para comparar snapshots:

```
Snapshot Local  Index Hash: a1b2c3d4e5f6...
Snapshot Remoto Index Hash: f7e8d9c0b1a2...

Si a1b2c3d4e5f6... != f7e8d9c0b1a2...
    → Hay cambios desde último sync
    → Analizar archivos individuales para identificar qué cambió
```

---

## 🔐 Seguridad: Encriptación AES-256

### Almacenamiento en Disco

**Antes**:
```
documento.md (4KB de texto plano)
```

**Después de procesar DejaVu**:
```
chunk_a1b2c3d4.encrypted (4KB encriptado con AES-256)
```

**Flujo**:
```
1. Leer contenido del archivo
2. Comprimir (opcional, si reduce tamaño)
3. Encriptar con AES-256
   ├─ Key: Generada del password del usuario
   └─ IV: Incluido en el chunk
4. Guardar archivo encriptado en objects/
```

### Sincronización Encriptada

Cuando se sincroniza a WebDAV/S3:
- ✅ Los chunks se envían **ya encriptados**
- ✅ El servidor WebDAV/S3 NUNCA ve contenido sin encriptar
- ✅ Solo la máquina local (con la key) puede descifrar

```
Máquina Local                    Servidor WebDAV
┌──────────────────────┐         ┌─────────────────┐
│ Contenido: "Secreto" │         │ Datos encriptados│
│     ↓               │         │                  │
│  Encriptar AES-256  │  HTTP   │ (no puede leer) │
│     ↓               │ ───→    │                  │
│ 0x4F9B2E7C...       │ HTTPS   │ 0x4F9B2E7C...   │
└──────────────────────┘         └─────────────────┘
```

---

## 🔄 Resolución de Conflictos

DejaVu mantiene una estructura `MergeResult`:

```go
type MergeResult struct {
    Upserts  []string        // Archivos nuevos/modificados
    Removes  []string        // Archivos eliminados
    Conflicts []Conflict     // Conflictos detectados
}

type Conflict struct {
    Path      string         // Ruta del archivo conflictivo
    LocalTime int64          // Timestamp local
    RemoteTime int64         // Timestamp remoto
    LocalID   string         // Hash local
    RemoteID  string         // Hash remoto
}
```

### Estrategias de Resolución

1. **Manual**: Usuario decide qué versión mantener
   ```
   Usuario: "¿Mantener versión local o remota?"
   ```

2. **Automática (latest-wins)**: Versión más reciente gana
   ```
   if LocalTime > RemoteTime:
       keep local
   else:
       keep remote
   ```

3. **Configurada por usuario**:
   ```
   Conf.Sync.GenerateConflictDoc = true
   └─ Crea documento especial con ambas versiones
   ```

---

## ☁️ Proveedores de Almacenamiento

### Interfaz Cloud (dejavu/cloud)

DejaVu define una interfaz estándar que TODOS los proveedores deben implementar:

```go
type Cloud interface {
    // Operaciones básicas
    PutObject(key string, data []byte) error
    GetObject(key string) ([]byte, error)
    DeleteObject(key string) error
    
    // Listar objetos
    ListObjects(prefix string) ([]string, error)
    
    // Sincronización
    SyncDownload(...) error
    SyncUpload(...) error
}
```

### Proveedores Soportados

#### 1. **SiYuan Cloud** (servidor oficial)
```go
cloud.NewSiYuan(&cloud.BaseCloud{Conf: cloudConf})
```
- Servidor propietario
- API HTTP personalizada
- Solo para suscriptores

#### 2. **S3 Compatible** (AWS S3, MinIO, DigitalOcean Spaces)
```go
cloud.NewS3(&cloud.BaseCloud{Conf: cloudConf}, s3HTTPClient)
```
- Endpoint configurable
- Access Key + Secret Key
- Path style URL support
- Skip TLS verification (para certificados auto-firmados)

#### 3. **WebDAV** (Nextcloud, OwnCloud, etc.)
```go
webdavClient := gowebdav.NewClient(endpoint, username, password)
cloud.NewWebDAV(&cloud.BaseCloud{Conf: cloudConf}, webdavClient)
```
- Endpoint URL
- Basic Auth (username + password)
- TLS configurable
- Concurrent requests

#### 4. **Local Filesystem**
```go
cloud.NewLocal(&cloud.BaseCloud{Conf: cloudConf})
```
- Sincronizar a carpeta local
- Útil para backups en NAS

---

## 📊 Deduplicación y Compresión

### Ejemplo de Ahorro

**Caso de uso**: 1000 documentos, cada uno referencia una imagen común

**Sin deduplicación**:
```
imagen.png: 5MB
× 1000 documentos
= 5000MB (5GB) almacenado
```

**Con deduplicación DejaVu**:
```
imagen.png: 5MB
+ 1000 referencias (100 bytes cada)
= 5.1MB almacenado
```

**Ahorro**: 98%

### Compresión

DejaVu comprime automáticamente:
- Texto: ~70% reducción
- Markdown: ~75% reducción
- JSON: ~80% reducción
- Binarios: Minimal improvement

---

## ❌ Limitaciones Conocidas

DejaVu **NO soporta**:
- ❌ Carpetas vacías (no almacena directorios, solo archivos)
- ❌ Atributos de permisos (chmod)
- ❌ Enlaces simbólicos
- ❌ Archivos especiales (pipes, sockets)

**Razón**: Enfoque en sincronización de datos, no backup de sistema completo.

---

## 🔗 Integración con SiYuan Kernel

Cuando SiYuan inicia sincronización:

### 1. Crear Repositorio (newRepository)
```go
cloudRepo := cloud.NewWebDAV(baseCloud, webdavClient)
repo := dejavu.NewRepo(
    dataDir,          // ~/workspace
    repoDir,          // ~/workspace/.siyuan/repo
    historyDir,       // ~/workspace/.siyuan/history
    tempDir,          // ~/workspace/.siyuan/temp
    systemID,         // ID único del dispositivo
    systemName,       // Nombre del dispositivo
    osType,           // Windows/Linux/macOS
    repoKey,          // Clave de encriptación
    ignorePatterns,   // Archivos a no sincronizar
    cloudRepo,        // Cliente WebDAV/S3/etc
)
```

### 2. Ejecutar Sincronización
```go
mergeResult, trafficStat, err := repo.SyncDownload(syncContext)
// o
mergeResult, trafficStat, err := repo.SyncUpload(syncContext)
```

**trafficStat** devuelve:
- UploadFileCount / DownloadFileCount
- UploadChunkCount / DownloadChunkCount
- UploadBytes / DownloadBytes

### 3. Procesar Resultado
```go
processSyncMergeResult(false, true, mergeResult, trafficStat, "d", elapsed)
├─ Actualizar índices locales
├─ Reindexar documentos en SQLite
├─ Actualizar caché
└─ Notificar UI
```

---

## 💡 Comparación: DejaVu vs Alternativas

| Aspecto | DejaVu | Git | Syncthing | rsync |
|---------|--------|-----|-----------|-------|
| **Encriptación AES** | ✅ Sí | ❌ No | ✅ Sí | ❌ No |
| **Deduplicación** | ✅ Sí (chunks) | ❌ No | ❌ No | ❌ No |
| **Control de versiones** | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| **Multi-dispositivo** | ✅ Sí | ⚠️ Manual | ✅ Sí | ⚠️ Manual |
| **Conflictos automático** | ⚠️ Configurable | ❌ No | ⚠️ Complejo | ❌ No |
| **Múltiples proveedores** | ✅ S3/WebDAV/etc | ❌ No | ❌ No | ❌ No |
| **Comprimido** | ✅ Sí | ❌ No | ⚠️ Parcial | ❌ No |

---

## 🚀 Alternativas para Chronex

### Opción 1: Usar DejaVu directamente (NO RECOMENDADO)
```
Ventajas:
- Código probado en producción
- Todos los features listos

Desventajas:
- Dependencia externa en Go
- Complejidad extra
- Enfoque en archivos, no en registros de BD
```

### Opción 2: Inspirarse en DejaVu (RECOMENDADO)
```
Implementar sistema similar pero:
- CDC con SQL triggers en lugar de snapshots
- Chunks de datos SQLite (tablas de sync)
- Encriptación AES-256 igual que DejaVu
- Mismo concepto de proveedores intercambiables

Ventajas:
- Control total
- Integración natural con SQLite
- Menos dependencias
- Arquitectura más sencilla para Chronex
```

---

## 📝 Implementación Propuesta para Chronex

### Phase 1: Sistema de Snapshots SQLite

```sql
-- Tabla para versiones (similar a snapshots DejaVu)
CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,           -- SHA-1
    created_at TIMESTAMP,
    file_count INT,
    total_size INT,
    parent_snapshot_id TEXT,       -- Para rastrear historial
    FOREIGN KEY (parent_snapshot_id) REFERENCES snapshots(id)
);

-- Tabla para archivos en cada snapshot
CREATE TABLE snapshot_files (
    snapshot_id TEXT,
    file_path TEXT,
    file_size INT,
    updated_at TIMESTAMP,
    chunks TEXT,                   -- JSON array de chunk IDs
    PRIMARY KEY (snapshot_id, file_path),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

-- Tabla para fragmentos (chunks)
CREATE TABLE chunks (
    id TEXT PRIMARY KEY,           -- SHA-1 del contenido
    data BLOB,                     -- Encriptado + comprimido
    size INT,
    created_at TIMESTAMP
);
```

### Phase 2: Detección de Cambios (CDC)

```go
// SyncWorker detecta cambios desde último snapshot
func (w *SyncWorker) DetectChanges() ([]Change, error) {
    lastSnapshot := getLastSnapshot()
    currentFiles := w.scanLocalFiles()
    
    // Comparar hashes
    changes := compareSnapshots(lastSnapshot, currentFiles)
    
    return changes, nil
}
```

### Phase 3: Sincronización Multi-Proveedor

```go
type SyncProvider interface {
    Upload(chunks []Chunk, metadata Metadata) error
    Download(snapshotID string) ([]Chunk, error)
    GetLatest() (snapshotID string, err error)
}

// Implementaciones concretas
var _ SyncProvider = (*WebDAVProvider)(nil)
var _ SyncProvider = (*S3Provider)(nil)
var _ SyncProvider = (*LocalProvider)(nil)
```

---

## 🔗 Referencias

- [DejaVu GitHub Repository](https://github.com/siyuan-note/dejavu)
- [DejaVu Cloud Package](https://pkg.go.dev/github.com/siyuan-note/dejavu/cloud)
- [SiYuan Data Sync Discussion](https://github.com/siyuan-note/siyuan/issues/5331)
- [DejaVu Sync Manual Implementation](https://github.com/siyuan-note/dejavu/blob/main/sync_manual.go)
- [DejaVu Repository Implementation](https://github.com/siyuan-note/dejavu/blob/main/repo.go)

---

## ✅ Conclusión

DejaVu es un **sistema de versionado y sincronización optimizado para documentos**, no para sistemas de archivos generales. Para Chronex:

1. ✅ Podemos **inspirarnos** en su arquitectura
2. ✅ Usar el concepto de **snapshots con hashes**
3. ✅ Implementar **deduplicación por fragmentos**
4. ✅ Mantener **encriptación AES-256**
5. ✅ Soportar **múltiples proveedores** (WebDAV, S3, Local)
6. ❌ NO necesitamos usar DejaVu directamente

**Enfoque recomendado**: CDC en SQLite + Worker background + Encriptación AES + Proveedores intercambiables = Sistema de sincronización robusto y transparente.
