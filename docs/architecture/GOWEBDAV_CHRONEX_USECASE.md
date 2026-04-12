# Casos de Uso: gowebdav en Chronex

## 📋 Resumen Ejecutivo

`studio-b12/gowebdav` es la librería de **cliente WebDAV** que necesita Chronex para sincronizar chunks encriptados y snapshots a servidores como **Nextcloud, OwnCloud, o cualquier servidor WebDAV compatible**.

**NO pensamos en SiYuan.** Pensamos en **nuestros requisitos específicos**:
- ✅ Subir chunks encriptados (FastCDC output)
- ✅ Bajar chunks remotos para reconstrucción
- ✅ Sincronización bidireccional automática
- ✅ Estructura de directorios simple en el servidor

---

## 🎯 Casos de Uso de gowebdav en Chronex

### 1. **Crear Estructura de Directorios en el Servidor**

**Contexto**: Primera vez que sincronizamos, o servidor WebDAV vacío.

**Flujo**:
```
SyncWorker inicia
    ↓
¿Existe /chronex/ en servidor?
    ├─ NO → gowebdav.Mkdir("/chronex")
    │       gowebdav.Mkdir("/chronex/chunks")
    │       gowebdav.Mkdir("/chronex/snapshots")
    │       gowebdav.Mkdir("/chronex/refs")
    └─ SÍ → Continúa con sync
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) EnsureStructure() error {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    dirs := []string{
        "/chronex",
        "/chronex/chunks",
        "/chronex/snapshots",
        "/chronex/refs",
    }
    
    for _, dir := range dirs {
        if err := client.Mkdir(dir, 0755); err != nil {
            // Ignora si ya existe
            if !strings.Contains(err.Error(), "405") {
                return err
            }
        }
    }
    
    return nil
}
```

**¿Por qué gowebdav?** → `Mkdir()` es la operación más simple para crear directorios.

---

### 2. **Subir Chunk Encriptado (Push)**

**Contexto**: FastCDC detectó cambio → creó chunk → AES-256 lo encriptó → AHORA lo subimos.

**Flujo**:
```
FastCDC divide archivo en chunks
    ↓
Bloom Filter: ¿chunk ya existe localmente?
    ↓
AES-256-CTR encripta chunk
    ↓
gowebdav.WriteStream("/chronex/chunks/{sha256_hash}.chunk", encryptedData)
    ↓
SQLite: registra en tabla 'chunks' que está en remote
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) UploadChunk(chunkHash string, encryptedData []byte) error {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    // Usar WriteStream para no cargar todo en memoria
    reader := bytes.NewReader(encryptedData)
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", chunkHash)
    
    return client.WriteStream(path, reader, os.ModePerm)
}
```

**Datos en tránsito**:
```
┌──────────────────────────────────┐
│ Original file: documento.pdf     │
│ (1MB)                            │
└──────────────────────────────────┘
           ↓ FastCDC
┌──────────────────────────────────┐
│ Chunk 1: 256KB (hash: abc123...) │
│ Chunk 2: 256KB (hash: def456...) │
│ Chunk 3: 256KB (hash: ghi789...) │
│ Chunk 4: 256KB (hash: jkl012...) │
└──────────────────────────────────┘
           ↓ AES-256-CTR encrypt
┌──────────────────────────────────┐
│ Encrypted Chunk 1: [0x2f, 0x8a...│
│ Encrypted Chunk 2: [0x5d, 0x4c...│
│ Encrypted Chunk 3: [0x1a, 0x9f...│
│ Encrypted Chunk 4: [0x7e, 0x3b...│
└──────────────────────────────────┘
           ↓ gowebdav.WriteStream
┌──────────────────────────────────┐
│ WebDAV Server (Nextcloud)        │
│ /chronex/chunks/abc123....chunk  │
│ /chronex/chunks/def456....chunk  │
│ /chronex/chunks/ghi789....chunk  │
│ /chronex/chunks/jkl012....chunk  │
└──────────────────────────────────┘
```

**¿Por qué gowebdav?** → `WriteStream()` permite subir datos binarios encriptados sin cargar todo en memoria.

---

### 3. **Subir Snapshot (Metadatos)**

**Contexto**: SyncWorker creó un snapshot (índice de qué chunks forman el archivo). Lo encriptó. Ahora lo sube.

**Flujo**:
```
SyncWorker crea snapshot JSON:
{
    "id": "snap_2024_01_15_1430",
    "timestamp": 1705334400,
    "files": [
        {
            "path": "documento.pdf",
            "chunks": ["abc123", "def456", "ghi789", "jkl012"],
            "size": 1048576,
            "modified": 1705334200
        }
    ],
    "previousSnapshot": "snap_2024_01_14_1900"
}
    ↓
AES-256-CTR encripta JSON completo
    ↓
gowebdav.WriteStream("/chronex/snapshots/{snapshot_id}.snapshot", encryptedJSON)
    ↓
gowebdav.WriteStream("/chronex/refs/latest", metadataRef)
```

**Código Chronex**:
```go
package sync

type Snapshot struct {
    ID               string                    `json:"id"`
    Timestamp        int64                     `json:"timestamp"`
    Files            []SnapshotFile            `json:"files"`
    PreviousSnapshot string                    `json:"previous_snapshot,omitempty"`
}

func (p *WebDAVProvider) UploadSnapshot(snapshot *Snapshot, encryptedData []byte) error {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    // Upload snapshot
    snapshotPath := fmt.Sprintf("/chronex/snapshots/%s.snapshot", snapshot.ID)
    reader := bytes.NewReader(encryptedData)
    
    if err := client.WriteStream(snapshotPath, reader, os.ModePerm); err != nil {
        return err
    }
    
    // Update ref: "latest points to this snapshot"
    latestRef := []byte(snapshot.ID)
    refReader := bytes.NewReader(latestRef)
    return client.WriteStream("/chronex/refs/latest", refReader, os.ModePerm)
}
```

**¿Por qué gowebdav?** → Necesitamos `WriteStream()` para escribir metadatos pequeños pero también para atomicidad conceptual (mismo cliente, misma sesión).

---

### 4. **Listar Chunks Disponibles en Remoto (Pull)**

**Contexto**: Laptop intenta sincronizar. Pregunta: ¿Qué chunks hay en el servidor que NO tengo localmente?

**Flujo**:
```
Laptop local: tengo chunks [abc123, def456]
    ↓
gowebdav.ReadDir("/chronex/chunks")
    ↓
Respuesta: [abc123.chunk, def456.chunk, ghi789.chunk, jkl012.chunk, xyz999.chunk]
    ↓
Comparar: local vs remote
    ↓
Falta descargar: [ghi789.chunk, jkl012.chunk, xyz999.chunk]
    ↓
Para cada chunk faltante: gowebdav.ReadStream(path)
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) ListRemoteChunks() ([]string, error) {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    files, err := client.ReadDir("/chronex/chunks")
    if err != nil {
        return nil, err
    }
    
    var chunkHashes []string
    for _, file := range files {
        if strings.HasSuffix(file.Name(), ".chunk") {
            // Extract hash: "abc123.chunk" → "abc123"
            hash := strings.TrimSuffix(file.Name(), ".chunk")
            chunkHashes = append(chunkHashes, hash)
        }
    }
    
    return chunkHashes, nil
}

func (p *WebDAVProvider) GetMissingChunks(localChunks []string) ([]string, error) {
    remoteChunks, err := p.ListRemoteChunks()
    if err != nil {
        return nil, err
    }
    
    localSet := make(map[string]bool)
    for _, h := range localChunks {
        localSet[h] = true
    }
    
    var missing []string
    for _, h := range remoteChunks {
        if !localSet[h] {
            missing = append(missing, h)
        }
    }
    
    return missing, nil
}
```

**¿Por qué gowebdav?** → `ReadDir()` es eficiente para listar metadatos sin descargar archivos completos.

---

### 5. **Descargar Chunk Encriptado (Pull)**

**Contexto**: Laptop identificó que falta chunk `ghi789.chunk`. Lo descarga, desencripta, valida SHA-256.

**Flujo**:
```
gowebdav.ReadStream("/chronex/chunks/ghi789.chunk")
    ↓
Recibe datos encriptados: [0x1a, 0x9f, ...]
    ↓
AES-256-CTR desencripta
    ↓
SHA-256(datos desencriptados) == ghi789?
    ├─ SÍ → Almacenar en SQLite
    └─ NO → ERROR, corrupted o tampering
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) DownloadChunk(chunkHash string) ([]byte, error) {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    // Read encrypted chunk
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", chunkHash)
    reader, err := client.ReadStream(path)
    if err != nil {
        return nil, err
    }
    defer reader.Close()
    
    encryptedData, err := io.ReadAll(reader)
    if err != nil {
        return nil, err
    }
    
    // Decrypt with Poly1305 verification
    plaintext, err := aes256poly.Decrypt(p.encryptionKey, encryptedData)
    if err != nil {
        return nil, fmt.Errorf("decryption failed: %v", err)
    }
    
    // Verify integrity
    computedHash := sha256.Sum256(plaintext)
    if hex.EncodeToString(computedHash[:]) != chunkHash {
        return nil, fmt.Errorf("hash mismatch: expected %s", chunkHash)
    }
    
    return plaintext, nil
}
```

**¿Por qué gowebdav?** → `ReadStream()` descarga sin cargar todo en memoria, perfecto para chunks de 16-64KB.

---

### 6. **Descargar Snapshot Remoto (Pull)**

**Contexto**: Laptop ve que existe snapshot remoto más nuevo. Lo descarga y aplica.

**Flujo**:
```
gowebdav.ReadStream("/chronex/refs/latest")
    ↓
Obtiene ID: "snap_2024_01_15_1430"
    ↓
gowebdav.ReadStream("/chronex/snapshots/snap_2024_01_15_1430.snapshot")
    ↓
Desencripta JSON
    ↓
SQLite: aplica cambios (crea symlinks o referencias a chunks)
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) GetLatestSnapshot() (*Snapshot, error) {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    // Read "latest" reference
    reader, err := client.ReadStream("/chronex/refs/latest")
    if err != nil {
        return nil, err
    }
    defer reader.Close()
    
    latestID, err := io.ReadAll(reader)
    if err != nil {
        return nil, err
    }
    
    // Read snapshot data
    snapshotPath := fmt.Sprintf("/chronex/snapshots/%s.snapshot", string(latestID))
    snapshotReader, err := client.ReadStream(snapshotPath)
    if err != nil {
        return nil, err
    }
    defer snapshotReader.Close()
    
    encryptedData, err := io.ReadAll(snapshotReader)
    if err != nil {
        return nil, err
    }
    
    // Decrypt
    plaintext, err := aes256poly.Decrypt(p.encryptionKey, encryptedData)
    if err != nil {
        return nil, err
    }
    
    // Parse JSON
    var snapshot Snapshot
    if err := json.Unmarshal(plaintext, &snapshot); err != nil {
        return nil, err
    }
    
    return &snapshot, nil
}
```

**¿Por qué gowebdav?** → Necesitamos `ReadStream()` para dos archivos diferentes en secuencia.

---

### 7. **Verificar Existencia (Stat)**

**Contexto**: Antes de descargar, verificar que el archivo existe sin descargarlo completo.

**Flujo**:
```
gowebdav.Stat("/chronex/chunks/abc123.chunk")
    ↓
¿Existe?
    ├─ SÍ → Obtener tamaño, timestamp
    └─ NO → No existe en remoto
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) ChunkExists(chunkHash string) (bool, error) {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", chunkHash)
    info, err := client.Stat(path)
    
    if err != nil {
        if strings.Contains(err.Error(), "404") {
            return false, nil
        }
        return false, err
    }
    
    return !info.IsDir(), nil
}
```

**¿Por qué gowebdav?** → `Stat()` es HTTP HEAD, muy rápido, no trae contenido.

---

### 8. **Limpiar Chunks Antiguos**

**Contexto**: Usuario ejecutó "garbage collection". Los chunks no referenciados en ningún snapshot pueden eliminarse.

**Flujo**:
```
SQLite: obtener chunks no usados
    ↓
Para cada chunk a eliminar:
    gowebdav.Remove("/chronex/chunks/{hash}.chunk")
```

**Código Chronex**:
```go
package sync

func (p *WebDAVProvider) DeleteChunk(chunkHash string) error {
    client := gowebdav.NewClient(
        p.endpoint,
        p.username,
        p.password,
    )
    
    path := fmt.Sprintf("/chronex/chunks/%s.chunk", chunkHash)
    return client.Remove(path)
}

func (p *WebDAVProvider) GarbageCollect(chunksToDelete []string) error {
    for _, hash := range chunksToDelete {
        if err := p.DeleteChunk(hash); err != nil {
            // Log pero continúa
            log.Printf("Failed to delete chunk %s: %v", hash, err)
        }
    }
    return nil
}
```

**¿Por qué gowebdav?** → `Remove()` elimina archivos que no necesitamos.

---

## 🔐 Seguridad: Flujo de gowebdav en Chronex

### Autenticación
```
gowebdav.NewClient(endpoint, username, password)
    ↓
Internamente: Basic Auth (username:password en Base64)
    ↓
HTTPS encripta las credenciales en tránsito
    ↓
Servidor WebDAV autentica y autoriza
```

**IMPORTANTE**: Las credenciales se usan como Basic Auth. Por eso SIEMPRE usamos HTTPS, y las credenciales se almacenan encriptadas localmente en SQLite.

### Datos en Tránsito
```
Datos locales: plaintext
    ↓
AES-256-CTR encripta (Scrypt KDF para key derivation)
    ↓
gowebdav.WriteStream (HTTPS)
    ↓
Servidor WebDAV: datos encriptados en storage
    ↓
No puede leer el servidor (no tiene la key)
```

### Integridad
```
gowebdav.ReadStream
    ↓
AES-256-CTR + Poly1305 desencripta Y verifica
    ↓
SHA-256 hash del contenido debe coincidir con nombre del archivo
```

---

## 📊 Operaciones gowebdav Usadas en Chronex

| Operación | HTTP | Caso de Uso | Frecuencia |
|-----------|------|-----------|-----------|
| `Mkdir()` | MKCOL | Crear estructura | Una sola vez (setup) |
| `WriteStream()` | PUT | Subir chunks/snapshots | Cada sync push |
| `ReadDir()` | PROPFIND | Listar chunks remotos | Cada sync pull |
| `ReadStream()` | GET | Descargar chunks | Cada sync pull |
| `Stat()` | HEAD | Verificar existencia | Antes de download |
| `Remove()` | DELETE | Garbage collection | Manual/periodic |

---

## 🎯 ¿Por qué gowebdav y NO otra cosa?

### vs. S3 SDK
- **S3**: Para providers S3-compatibles (MinIO, AWS)
- **gowebdav**: Para Nextcloud, OwnCloud, y servidores WebDAV genéricos
- **Chronex**: Soportar AMBOS (arquitectura de provider agnóstico)

### vs. emersion/go-webdav
- **emersion**: Servidor WebDAV (RFC 4791 CalDAV, RFC 6352 CardDAV)
- **gowebdav**: Cliente WebDAV (operaciones de archivo simples)
- **Chronex**: Necesitamos CLIENTE, no servidor → gowebdav es correcto

### vs. curl/HTTP crudo
- **curl**: Requiere parsear respuestas HTTP/WebDAV manualmente
- **gowebdav**: Abstracción de cliente que maneja autenticación, headers, estatuses
- **Chronex**: Menos código, menos errores → usar librería

---

## 💾 Estructura en Servidor WebDAV

```
nextcloud.example.com/
├── chronex/                          ← Raíz Chronex
│   ├── chunks/                       ← Bloques de datos encriptados
│   │   ├── abc123def456....chunk     ← 16KB-64KB encriptado
│   │   ├── ghi789jkl012....chunk
│   │   └── ...
│   ├── snapshots/                    ← Índices encriptados
│   │   ├── snap_2024_01_15_1430.snapshot
│   │   ├── snap_2024_01_15_1530.snapshot
│   │   └── ...
│   └── refs/                         ← Referencias
│       ├── latest                    ← ID del último snapshot
│       └── tags/                     ← Tags opcionales
│           ├── backup_v1
│           └── stable_release
```

---

## 🔄 Ciclo Completo: Sync Bidireccional

### Push (Local → Remote)
```
1. FastCDC detecta cambios
2. Encripta chunks con AES-256
3. gowebdav.WriteStream() sube chunks
4. Crea snapshot (índice)
5. Encripta snapshot JSON
6. gowebdav.WriteStream() sube snapshot
7. gowebdav.WriteStream() actualiza /refs/latest
8. SQLite registra: estos chunks están en remote
```

### Pull (Remote → Local)
```
1. gowebdav.ReadStream("/refs/latest")
2. Obtiene ID del snapshot remoto
3. gowebdav.ReadStream(snapshot_path)
4. Desencripta JSON
5. Identifica chunks faltantes
6. gowebdav.ReadDir("/chunks")
7. Para cada chunk faltante: gowebdav.ReadStream()
8. Desencripta + SHA-256 verifica
9. SQLite aplica cambios
```

---

## 📈 Performance Consideraciones

### gowebdav + Encriptación
```
Upload 100 chunks (16KB cada uno) = 1.6MB total
- FastCDC: ~100ms (local, rápido)
- AES-256 CTR: ~50ms (fast cipher)
- gowebdav.WriteStream: ~200ms (HTTPS latency)
Total: ~350ms (network-bound, no CPU-bound)

Download 100 chunks
- gowebdav.ReadStream: ~200ms (HTTPS latency)
- AES-256 CTR + Poly1305: ~50ms
- SHA-256 verify: ~5ms
Total: ~255ms (network-bound)
```

### Recomendación
- **Chunks**: 16KB-64KB (gowebdav no tiene problema)
- **Snapshots**: <1MB (encriptado, rápido de transmitir)
- **Conexión**: HTTPS con keepalive

---

## ✅ Conclusión

**gowebdav es la herramienta correcta para Chronex porque:**

1. ✅ **Simple API** - Mitad de las operaciones que necesitamos (Write, Read, ReadDir, Stat, Mkdir, Remove)
2. ✅ **Agnóstico de servidor** - Funciona con Nextcloud, OwnCloud, cualquier WebDAV
3. ✅ **Streaming** - `ReadStream()` y `WriteStream()` para no cargar todo en memoria
4. ✅ **Autenticación** - Maneja Basic Auth automáticamente
5. ✅ **Maduro** - Librería confiable, usada en producción (SiYuan, Restic, etc.)
6. ✅ **Performance** - HTTP HEAD para Stat(), PROPFIND para ReadDir()

**NO necesitamos**:
- ❌ emersion/go-webdav (servidor, CalDAV/CardDAV)
- ❌ HTTP crudo (errores, complejidad)
- ❌ Otro cliente genérico

**gowebdav es perfecto para nuestro caso de uso específico de Chronex.**
