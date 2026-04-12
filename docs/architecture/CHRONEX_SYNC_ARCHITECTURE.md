# Arquitectura de Sincronización para Chronex - Diseño Final

## 🎯 Visión

Crear un **sistema de sincronización de datos transparente, encriptado y agnóstico de proveedor** inspirado en lo mejor de Restic, ArtiVC e IPFS, pero optimizado para Chronex.

```
Chronex Sync Architecture

┌─────────────────────────────────────────────────────────┐
│  Electron Frontend (TypeScript)                         │
│  - UI para configuración de sync                        │
│  - Monitoreo de estado                                  │
│  - Control manual de snapshots                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Go Kernel Backend                                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CDC Engine (FastCDC)                             │  │
│  │ - Detectar cambios en archivos                   │  │
│  │ - Dividir en chunks variable                     │  │
│  │ - SHA-256 para identificar                       │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Deduplicación (Bloom Filter)                     │  │
│  │ - Check rápido: ¿chunk ya existe?                │  │
│  │ - O(1) time, minimal memory                      │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Encriptación (AES-256-CTR + Poly1305)            │  │
│  │ - Scrypt para derivación de keys                 │  │
│  │ - End-to-end encryption                          │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ SQLite Storage Layer                             │  │
│  │ - snapshots table                                │  │
│  │ - chunks table                                   │  │
│  │ - snapshot_files table                           │  │
│  │ - refs (latest, tags)                            │  │
│  │ - sync_state                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Sync Worker (Background Job)                     │  │
│  │ - Monitorea cambios                              │  │
│  │ - Sincroniza cada N segundos                     │  │
│  │ - Retry con exponential backoff                  │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Provider Interface (Intercambiable)              │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ├─ WebDAV Provider (Nextcloud, OwnCloud, etc)   │  │
│  │ ├─ S3 Provider (AWS, MinIO, DigitalOcean)       │  │
│  │ └─ Local Filesystem Provider (NAS, carpeta)     │  │
│  └──────────────────────────────────────────────────┘  │
│                     ↓                                    │
└─────────────────────┬──────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    WebDAV         S3         Filesystem
    (Nextcloud)  (MinIO)     (NAS, Carpeta)
```

---

## 📊 Componentes Clave

### 1. FastCDC Engine

**Propósito**: Detectar cambios de manera eficiente dividiendo en chunks variables

**Implementación**:
```go
package sync

type CDCChunker struct {
    minSize    int    // Mínimo 4KB
    targetSize int    // Target 16KB (configurable)
    maxSize    int    // Máximo 64KB
    gearTable  []byte // Tabla de lookup para Gear algorithm
}

func (c *CDCChunker) Chunk(data []byte) [][]byte {
    var chunks [][]byte
    var chunk []byte
    var hash uint32
    
    for _, b := range data {
        chunk = append(chunk, b)
        hash = (hash << 1) + uint32(c.gearTable[b])
        
        // Solo check después de tamaño mínimo
        if len(chunk) >= c.minSize && 
           hash % uint32(c.targetSize) == 0 {
            chunks = append(chunks, chunk)
            chunk = []byte{}
            hash = 0
        }
    }
    
    if len(chunk) > 0 {
        chunks = append(chunks, chunk)
    }
    
    return chunks
}
```

**Características**:
- ✅ Rendimiento: 200+ MB/s
- ✅ Adaptive: Chunking basado en contenido, no posición
- ✅ Resiliente: Cambios al inicio no afectan chunks posteriores
- ✅ Comprimible: Chunks de ~16KB ideales para compresión

### 2. Deduplicación con Bloom Filter

**Propósito**: Detectar rápidamente si un chunk ya existe

**Implementación**:
```go
package dedup

type BloomDedup struct {
    filter *BloomFilter  // Solo bits, no datos
    seen   map[string]bool // Para chunks que sí almacenamos
}

func (b *BloomDedup) IsNew(chunkHash string) bool {
    if b.filter.Maybe(chunkHash) {
        // Posible que ya exista, pero podría ser falso positivo
        // Verificar en base de datos
        return !b.seen[chunkHash]
    }
    // Definitivamente nuevo
    return true
}

func (b *BloomDedup) Record(chunkHash string) {
    b.filter.Add(chunkHash)
    b.seen[chunkHash] = true
}
```

**Características**:
- ✅ Memoria: O(log n) - muy eficiente
- ✅ Tiempo: O(1) por query
- ✅ Falsos positivos: ~1e-6 (aceptable)
- ✅ Sin falsos negativos (garantizado)

### 3. Encriptación (Como Restic)

**Propósito**: Garantizar privacidad end-to-end

**Implementación**:
```go
package crypto

type CryptoManager struct {
    masterKey  []byte // AES-256 key (32 bytes)
    macKey     []byte // Poly1305 key (32 bytes)
}

func NewCryptoManager(password string, salt []byte) *CryptoManager {
    // Scrypt KDF
    keys := scrypt.Key(
        []byte(password),
        salt,
        16384,  // N
        8,      // r
        1,      // p
        64,     // Generar 64 bytes
    )
    
    return &CryptoManager{
        masterKey: keys[:32],   // Primeros 32 para AES
        macKey:    keys[32:],   // Últimos 32 para MAC
    }
}

func (cm *CryptoManager) EncryptChunk(plaintext []byte) ([]byte, error) {
    // IV aleatorio (16 bytes)
    iv := make([]byte, 16)
    rand.Read(iv)
    
    // AES-256-CTR
    cipher, _ := aes.NewCipher(cm.masterKey)
    stream := cipher.NewCTR(iv)
    ciphertext := make([]byte, len(plaintext))
    stream.XORKeyStream(ciphertext, plaintext)
    
    // Poly1305 MAC
    mac := poly1305.Sum(ciphertext, cm.macKey)
    
    // Resultado: IV || Ciphertext || MAC
    result := append(iv, ciphertext...)
    result = append(result, mac[:]...)
    
    return result, nil
}
```

**Características**:
- ✅ AES-256-CTR: Standard moderno
- ✅ Poly1305: Autenticación de datos
- ✅ Scrypt: KDF resistente a ataques de fuerza bruta
- ✅ End-to-end: Servidor no puede leer datos

### 4. SQLite Storage Layer

**Propósito**: Almacenar snapshots, chunks y metadatos localmente

**Schema**:
```sql
-- Snapshots (versiones)
CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_id TEXT,
    message TEXT,
    files_count INT,
    total_size INT,
    synced_to_remote BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (parent_id) REFERENCES snapshots(id),
    INDEX idx_created (created_at DESC)
);

-- Chunks (fragmentos de datos encriptados)
CREATE TABLE chunks (
    id TEXT PRIMARY KEY,
    data BLOB NOT NULL,           -- Encriptado + comprimido
    size INT NOT NULL,             -- Tamaño original
    compressed_size INT,           -- Tamaño comprimido
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_to_remote BOOLEAN DEFAULT FALSE,
    INDEX idx_created (created_at DESC)
);

-- Archivos en cada snapshot
CREATE TABLE snapshot_files (
    snapshot_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,
    modified_at TIMESTAMP,
    chunk_ids TEXT,                -- JSON array: ["chunk1", "chunk2", ...]
    PRIMARY KEY (snapshot_id, file_path),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id),
    INDEX idx_snapshot (snapshot_id)
);

-- Referencias (apuntan a snapshots)
CREATE TABLE refs (
    name TEXT PRIMARY KEY,         -- "latest", "tag:v1.0", etc
    snapshot_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

-- Estado de sincronización
CREATE TABLE sync_state (
    id TEXT PRIMARY KEY,
    entity_type TEXT,              -- 'snapshot' | 'chunk'
    entity_id TEXT NOT NULL,
    provider TEXT NOT NULL,        -- 'webdav' | 's3' | 'local'
    local_hash TEXT,
    remote_hash TEXT,
    last_synced TIMESTAMP,
    status TEXT,                   -- 'synced' | 'pending' | 'conflict'
    error_msg TEXT,
    INDEX idx_pending (provider, status)
);

-- Configuración de encriptación
CREATE TABLE crypto_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Solo 1 fila
    salt BLOB NOT NULL,                      -- 16 bytes random
    scrypt_n INTEGER DEFAULT 16384,
    scrypt_r INTEGER DEFAULT 8,
    scrypt_p INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Operaciones clave**:
```go
// Crear snapshot
func CreateSnapshot(message string, files []File) (snapshotID string, err error)

// Guardar chunk
func SaveChunk(chunkID string, encrypted []byte) error

// Obtener snapshot
func GetSnapshot(snapshotID string) (*Snapshot, error)

// Listar snapshots
func ListSnapshots(limit int) ([]*Snapshot, error)

// Checkout (restaurar) snapshot
func CheckoutSnapshot(snapshotID string) error
```

### 5. Sync Worker (Background Job)

**Propósito**: Sincronizar automáticamente con proveedores remotos

**Implementación**:
```go
package worker

type SyncWorker struct {
    interval     time.Duration      // 30 segundos default
    db           *sql.DB
    provider     provider.Provider   // WebDAV, S3, etc
    stopChan     chan bool
}

func (w *SyncWorker) Start() {
    ticker := time.NewTicker(w.interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-w.stopChan:
            return
        case <-ticker.C:
            w.performSync()
        }
    }
}

func (w *SyncWorker) performSync() {
    // 1. Obtener snapshots pendientes
    pending := w.db.QueryPendingSnapshots()
    
    for _, snapshot := range pending {
        // 2. Sincronizar chunks del snapshot
        chunks := w.db.GetSnapshotChunks(snapshot.ID)
        
        for _, chunk := range chunks {
            // 3. Upload chunk si no existe en remote
            exists, _ := w.provider.ChunkExists(chunk.ID)
            if !exists {
                err := w.provider.UploadChunk(chunk.ID, chunk.Data)
                if err != nil {
                    w.handleUploadError(chunk.ID, err)
                    return  // Retry en siguiente ciclo
                }
            }
        }
        
        // 4. Upload snapshot metadatos
        err := w.provider.UploadSnapshot(snapshot)
        if err != nil {
            w.handleSyncError(snapshot.ID, err)
            return
        }
        
        // 5. Marcar como sincronizado
        w.db.MarkSnapshotSynced(snapshot.ID)
    }
}

// Retry con exponential backoff
func (w *SyncWorker) handleSyncError(snapshotID string, err error) {
    retryCount := w.db.GetRetryCount(snapshotID)
    backoff := time.Duration(math.Pow(2, float64(retryCount))) * time.Minute
    
    w.db.PlanRetry(snapshotID, time.Now().Add(backoff))
}
```

**Características**:
- ✅ Background: No bloquea UI
- ✅ Incremental: Solo sincroniza lo pendiente
- ✅ Resiliente: Retry con exponential backoff
- ✅ Configurable: Interval y provider personalizables

### 6. Provider Interface (Intercambiable)

**Propósito**: Soportar múltiples backends sin cambiar código core

**Interfaz**:
```go
package provider

type Provider interface {
    // Chunk operations
    ChunkExists(chunkID string) (bool, error)
    UploadChunk(chunkID string, data []byte) error
    DownloadChunk(chunkID string) ([]byte, error)
    DeleteChunk(chunkID string) error
    
    // Snapshot operations
    UploadSnapshot(snapshot *Snapshot) error
    DownloadSnapshot(snapshotID string) (*Snapshot, error)
    ListSnapshots() ([]*Snapshot, error)
    
    // Metadata
    GetLatestSnapshot() (*Snapshot, error)
    GetLatestHash() (string, error)  // Para detección de cambios
}

// Implementaciones concretas
type WebDAVProvider struct { ... }
type S3Provider struct { ... }
type LocalProvider struct { ... }
```

**WebDAV Implementation**:
```go
type WebDAVProvider struct {
    client *gowebdav.Client
    basePath string  // "Chronex/data" por ejemplo
}

func (w *WebDAVProvider) UploadChunk(chunkID string, data []byte) error {
    path := w.basePath + "/chunks/" + chunkID[:2] + "/" + chunkID
    return w.client.Write(path, data, 0644)
}

func (w *WebDAVProvider) UploadSnapshot(snapshot *Snapshot) error {
    metadata, _ := json.Marshal(snapshot)
    path := w.basePath + "/snapshots/" + snapshot.ID + ".json"
    return w.client.Write(path, metadata, 0644)
}
```

**S3 Implementation**:
```go
type S3Provider struct {
    client *s3.Client
    bucket string
    prefix string  // "Chronex/data" por ejemplo
}

func (s *S3Provider) UploadChunk(chunkID string, data []byte) error {
    key := s.prefix + "/chunks/" + chunkID[:2] + "/" + chunkID
    _, err := s.client.PutObject(context.Background(), 
        &s3.PutObjectInput{
            Bucket: aws.String(s.bucket),
            Key:    aws.String(key),
            Body:   bytes.NewReader(data),
        })
    return err
}
```

---

## 🔄 Flujo Completo de Sincronización

```
1. Usuario hace cambios en Chronex (crea/edita documentos)
    ↓
2. SQLite triggers detectan cambios (CDC)
    ↓
3. SyncWorker despierta cada 30 segundos
    ↓
4. CDC Engine divide archivos en chunks
    ↓
5. Bloom Filter: ¿Chunk nuevo?
    ├─ Sí → Encriptar + Comprimir → Guardar
    └─ No → Skip (deduplicación)
    ↓
6. Crear Snapshot (metadatos)
    ↓
7. Provider.UploadChunks() al backend configurado
    ├─ WebDAV: PUT a Nextcloud
    ├─ S3: UploadObject a MinIO
    └─ Local: Escribir en carpeta NAS
    ↓
8. Provider.UploadSnapshot() con índice
    ↓
9. Actualizar sync_state table
    ├─ status = "synced"
    └─ last_synced = now()
    ↓
10. Broadcast a UI: "✅ Sync complete"
    ↓
11. Usuario puede ver en otro dispositivo (o descargarlo manualmente)
```

---

## 💾 Ciclo de Vida de Datos

### Estadio 1: Creación
```
Usuario crea archivo
    ↓
File system detect (CDC)
    ↓
Guardar en SQLite chunks table (encriptado)
```

### Estadio 2: Sincronización
```
SyncWorker detecta chunks pendientes
    ↓
UploadChunk() al provider remoto
    ↓
Marcar como uploaded_to_remote = true
```

### Estadio 3: Recuperación (Otro dispositivo)
```
SyncWorker del dispositivo B detecta nuevo snapshot
    ↓
DownloadSnapshot() metadatos
    ↓
Para cada chunk: DownloadChunk() si no está localmente
    ↓
Descifrar chunks (con misma password)
    ↓
Reconstruir archivos
    ↓
Crear nuevo snapshot local
```

### Estadio 4: Retención
```
Old snapshots pueden:
- Guardarse (con tag: backup-2024-04-01)
- O eliminarse automáticamente (configurable)

Chunks no referenciados pueden:
- Ser reciclados (cleanup job)
- O conservados para recuperación
```

---

## 🔐 Modelo de Seguridad

### Encrypt Everything
```
En Tránsito:
- HTTPS/TLS al provider remoto (no es suficiente)

En Reposo:
- AES-256-CTR en chunks
- Password nunca en texto plano
- Scrypt derivation para keys
```

### End-to-End
```
Provider NO puede:
- Leer documentos (están encriptados)
- Modificar datos (Poly1305 MAC detecta cambios)
- Acceder a password (no se transmite)
```

### Disaster Recovery
```
Si pierdes password:
- No puedes recuperar datos encriptados
- Diseño por propósito (como IPFS, Restic)

Backup de password:
- Guardar en password manager personal
- NO en el servidor
```

---

## 📈 Estimaciones de Performance

### Throughput

| Operación | Velocidad | Notas |
|-----------|-----------|-------|
| CDC Chunking | 200+ MB/s | FastCDC algorithm |
| AES Encryption | 500+ MB/s | Hardware acelerado |
| SHA-256 | 200+ MB/s | Hardware acelerado |
| **Local Sync** | **~100 MB/s** | Bottleneck: CDC + encryption |
| **Network Sync** | **Limited** | Por ancho de banda |

### Espacio de Almacenamiento

**Sin deduplicación**:
- 100 GB de documentos

**Con deduplicación (realista)**:
- 20-30 GB (70-80% ahorro)

**Con encriptación y compresión**:
- 15-20 GB (80-85% ahorro total)

---

## 🛠️ Configuración de Proveedores

### WebDAV (Nextcloud)
```json
{
  "provider": "webdav",
  "endpoint": "https://nextcloud.example.com/dav",
  "username": "usuario",
  "password": "contraseña",
  "skipTlsVerify": false,
  "timeout": 30,
  "concurrentReqs": 4
}
```

### S3 (MinIO)
```json
{
  "provider": "s3",
  "endpoint": "https://minio.example.com",
  "accessKey": "minioadmin",
  "secretKey": "minioadmin",
  "bucket": "chronex",
  "region": "us-east-1",
  "pathStyle": true,
  "skipTlsVerify": false
}
```

### Local (NAS)
```json
{
  "provider": "local",
  "endpoint": "/mnt/nas/chronex-backup",
  "timeout": 60,
  "concurrentReqs": 8
}
```

---

## ✅ Ventajas de Esta Arquitectura

| Aspecto | Ventaja |
|---------|---------|
| **Deduplicación** | 70-90% ahorro con chunks variable |
| **Encriptación** | AES-256 end-to-end |
| **Transparencia** | Usuario elige provider |
| **Rendimiento** | 100+ MB/s local, network-limited remote |
| **Flexibilidad** | Soporta WebDAV, S3, Local, etc. |
| **Recuperación** | Snapshots etiquetadas, historial completo |
| **Privacidad** | Servidor no ve datos |
| **Confiabilidad** | Retry automático, exponential backoff |

---

## 🚀 Roadmap de Implementación

### Fase 1: Core (Semanas 1-4)
- [ ] CDC Engine (FastCDC)
- [ ] SQLite schema
- [ ] Encriptación AES-256
- [ ] Unit tests

### Fase 2: Storage (Semanas 5-8)
- [ ] Bloom filter deduplicación
- [ ] WebDAV provider
- [ ] S3 provider
- [ ] Integration tests

### Fase 3: Sync (Semanas 9-12)
- [ ] SyncWorker background job
- [ ] Retry logic
- [ ] Conflict detection
- [ ] E2E tests

### Fase 4: UI (Semanas 13-16)
- [ ] Configuración de providers
- [ ] Estado de sync en vivo
- [ ] Snapshots management
- [ ] UX testing

### Fase 5: Polish (Semanas 17+)
- [ ] Performance optimization
- [ ] Documentación
- [ ] Security audit
- [ ] Release v1.0.0

---

## 📚 Referencias Clave

- **FastCDC**: USENIX paper - contenido-defined chunking
- **Restic**: Arquitectura de backup moderna
- **ArtiVC**: Versionado de artefactos
- **IPFS**: Merkle DAG y content addressing
- **AES-256**: Standard criptográfico NIST
- **Poly1305**: Autenticación de datos
- **Scrypt**: Key derivation function

---

## 🎯 Conclusión

Esta arquitectura **combina lo mejor de cada sistema**:

✅ **Restic** → FastCDC + AES-256 encryption
✅ **ArtiVC** → Snapshots + múltiples proveedores
✅ **F483** → Bloom filter deduplicación
✅ **IPFS** → Content addressing (SHA-256)

**Resultado**: Un sistema de sincronización robusto, eficiente y completamente transparente que pone el control de datos en manos del usuario.
