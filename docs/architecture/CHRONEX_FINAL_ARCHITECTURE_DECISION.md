# Decisión Final: Arquitectura de Chronex Basada en Análisis Comparativo

## 📋 Contexto

Se han analizado tres sistemas de sincronización profesionales:

1. **rclone** - Herramienta sync genérica (70+ backends)
2. **SiYuan** - App de notas con sync minimalista
3. **Joplin** - App de notas con sync robusto (8 backends)

## 🎯 Decisión Arquitectónica

### ADOPTAR: Joplin's Adapter Pattern + SiYuan's FastCDC Optimizations

```
┌─────────────────────────────────────────────────────────┐
│             CHRONEX ARCHITECTURE                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  LAYER 1: APPLICATION                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Desktop App (Electron)                          │   │
│  │  - UI para configuración de sync                 │   │
│  │  - Seleccionar backend (WebDAV, S3, Local)       │   │
│  │  - Mostrar estado de sincronización              │   │
│  │  - Resolver conflictos (si aplica)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  LAYER 2: SYNC ENGINE (Núcleo)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SyncEngine struct {                             │   │
│  │    db: *sqlite.DB                                │   │
│  │    provider: StorageProvider                     │   │
│  │    lock: DistributedLock                         │   │
│  │  }                                               │   │
│  │                                                  │   │
│  │  Responsabilidades:                              │   │
│  │  - Detectar cambios locales                      │   │
│  │  - Obtener cambios remotos (delta)               │   │
│  │  - Reconciliar conflictos (LWW)                  │   │
│  │  - Descargar items remotos                       │   │
│  │  - Subir items locales                           │   │
│  │  - Manejo de locks distribuidos                  │   │
│  │  - Reporte de progreso                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  LAYER 3: STORAGE ABSTRACTION                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  interface StorageProvider {                     │   │
│  │    Stat(ctx, path) -> Stats                      │   │
│  │    List(ctx, path) -> Items[]                    │   │
│  │    Get(ctx, path) -> []byte                      │   │
│  │    Put(ctx, path, data) -> void                  │   │
│  │    Delete(ctx, path) -> void                     │   │
│  │    Mkdir(ctx, path) -> void                      │   │
│  │    Move(ctx, oldPath, newPath) -> void           │   │
│  │    Delta(ctx, path) -> Changes[]                 │   │
│  │  }                                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  LAYER 4: STORAGE IMPLEMENTATIONS                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ WebDAVProvider│  │ S3Provider    │              │   │
│  │  │              │  │              │              │   │
│  │  │ Uses:        │  │ Uses:        │              │   │
│  │  │ gowebdav     │  │ aws-sdk-go-v2│              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  │                                                  │   │
│  │  ┌──────────────┐                                │   │
│  │  │LocalProvider │                                │   │
│  │  │              │                                │   │
│  │  │ Uses:        │                                │   │
│  │  │ os/filesystem│                                │   │
│  │  └──────────────┘                                │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  LAYER 5: LOCAL STORAGE                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SQLite Database                                 │   │
│  │                                                  │   │
│  │  Tables:                                         │   │
│  │  - documents (id, content, title, tags)          │   │
│  │  - snapshots (id, doc_id, content, timestamp)    │   │
│  │  - sync_state (path, updated_time, etag)         │   │
│  │  - encryption_keys (id, key_data)                │   │
│  │  - changes (id, type, path, timestamp)           │   │
│  │                                                  │   │
│  │  Optimizaciones:                                 │   │
│  │  - FastCDC chunking (interno)                    │   │
│  │  - Bloom filter para dedup                       │   │
│  │  - Content-addressable storage                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔑 Características Clave

### 1. Adapter Pattern (de Joplin)

```go
// StorageProvider es la interfaz única para todos los backends
type StorageProvider interface {
    Stat(ctx context.Context, path string) (*Stats, error)
    List(ctx context.Context, path string) ([]*Item, error)
    Get(ctx context.Context, path string) ([]byte, error)
    Put(ctx context.Context, path string, data []byte) error
    Delete(ctx context.Context, path string) error
    Mkdir(ctx context.Context, path string) error
    Move(ctx context.Context, oldPath, newPath string) error
    Delta(ctx context.Context, path string) ([]*Change, error)
}

// Cada backend implementa esta interfaz
type WebDAVProvider struct {
    client *gowebdav.Client
}

type S3Provider struct {
    client *s3.Client
}

type LocalProvider struct {
    basePath string
}

// SyncEngine no conoce detalles de backends
type SyncEngine struct {
    provider StorageProvider  // Puede ser cualquier implementación
    db       *sql.DB
}
```

**Ventajas**:
- ✅ Agregar nuevos backends es trivial
- ✅ Testeable (mock provider)
- ✅ Separación clara de concerns
- ✅ No depender de detalles específicos del backend

### 2. FastCDC + Bloom Filter (de SiYuan)

```go
// Chunking eficiente
type Chunk struct {
    Hash   string // SHA-256
    Size   int
    Data   []byte
}

// Dedup mediante Bloom Filter
type ChunkStore struct {
    bloomFilter *BloomFilter  // O(1) lookup
    chunks      map[string]*Chunk  // SHA-256 -> Chunk
}

// Durante upload, detectar chunks ya existentes
func (cs *ChunkStore) MayExist(hash string) bool {
    return cs.bloomFilter.Contains(hash)  // Fast no-false-negatives
}

// Resultado: ~70% reducción en datos transmitidos (típico)
```

**Ventajas**:
- ✅ Reducir ancho de banda en uploads
- ✅ Dedup local eficiente
- ✅ Content-addressable storage
- ✅ Resume capability

### 3. Sincronización Two-Way con LWW (Last-Write-Wins)

```go
type SyncEngine struct {
    db       *sql.DB
    provider StorageProvider
}

func (se *SyncEngine) Sync(ctx context.Context) error {
    // 1. Adquirir lock distribuido
    lock := NewDistributedLock(se.provider, "sync.lock")
    if err := lock.Acquire(ctx); err != nil {
        return fmt.Errorf("could not acquire lock: %w", err)
    }
    defer lock.Release(ctx)

    // 2. Obtener cambios remotos
    remoteChanges, err := se.provider.Delta(ctx, "")
    if err != nil {
        return err
    }

    // 3. Obtener cambios locales
    localChanges, err := se.db.GetChanges(ctx)
    if err != nil {
        return err
    }

    // 4. Reconciliar
    for _, remoteChange := range remoteChanges {
        localChange := findLocalChange(localChanges, remoteChange.Path)
        
        if localChange == nil {
            // Nuevo remotamente: descargar
            se.downloadItem(ctx, remoteChange)
        } else {
            // Existe localmente: LWW (Last-Write-Wins)
            if remoteChange.UpdatedTime > localChange.UpdatedTime {
                se.downloadItem(ctx, remoteChange)
            } else {
                se.uploadItem(ctx, localChange)
            }
        }
    }

    // 5. Subir items nuevos locales
    for _, localChange := range localChanges {
        if !remoteChanges.Contains(localChange.Path) {
            se.uploadItem(ctx, localChange)
        }
    }

    return nil
}
```

**Ventajas**:
- ✅ Simple y predecible (timestamp es fuente de verdad)
- ✅ Funciona con cualquier backend
- ✅ Sin servidor central necesario
- ✅ Determinístico (mismo resultado siempre)

### 4. Locks Distribuidos (de Joplin)

```go
type DistributedLock struct {
    provider StorageProvider
    lockPath string
    clientID string
    token    string
}

func (dl *DistributedLock) Acquire(ctx context.Context) error {
    // Crear archivo lock con contenido:
    // {clientID, timestamp, token}
    
    lockData := fmt.Sprintf("%s:%d:%s",
        dl.clientID,
        time.Now().Unix(),
        generateToken(),
    )
    
    err := dl.provider.Put(ctx, dl.lockPath, []byte(lockData))
    if err != nil {
        return fmt.Errorf("could not acquire lock: %w", err)
    }
    
    return nil
}

func (dl *DistributedLock) Release(ctx context.Context) error {
    return dl.provider.Delete(ctx, dl.lockPath)
}

// Evita sincronización simultánea desde múltiples clientes
```

**Ventajas**:
- ✅ Múltiples clientes pueden sincronizar de forma segura
- ✅ Basado en timestamps (simple)
- ✅ Works con cualquier backend (WebDAV, S3, etc)

## 📦 Stack Tecnológico

### Backend

```go
// Lenguaje: Go 1.21+
// Razón: Compilación rápida, binario único, bajo consumo memoria

Dependencias Necesarias:
├── studio-b12/gowebdav          // WebDAV client
├── aws/aws-sdk-go-v2/s3         // S3 client
├── golang.org/x/crypto          // AES-256 (futuro E2EE)
├── golang.org/x/sync            // Distributed lock primitives
├── mattn/go-sqlite3             // SQLite
├── spf13/cobra                  // CLI framework
├── golang.org/x/net/webdav      // WebDAV server (opcional)
└── ... máximo 2-3 más

Total: ~10 dependencias (vs 254 de rclone, vs 50 de Joplin)
```

### Frontend

```typescript
// Lenguaje: TypeScript + React
// Framework: Electron (Desktop) + React Native (Mobile después)

Dependencias:
├── react
├── electron
├── axios (HTTP client)
├── zustand (state management)
├── tailwindcss (styling)
└── ... etc
```

### Database

```sql
SQLite (como Joplin)
Razón:
- ✅ Cero configuración
- ✅ Embedded (no servidor)
- ✅ ACID transactions
- ✅ Eficiente para local
- ✅ Ampliamente usado (Joplin, Firefox, etc)
```

## 🔄 Algoritmo de Sincronización en Detalle

### Pseudocódigo

```
function Sync():
    1. AcquireLock()
        └─ Crear archivo "sync.lock" en remoto
        └─ Si ya existe y es > 5min antiguo, hacer timeout
    
    2. GetRemoteState()
        └─ Llamar provider.Delta("/")
        └─ Obtener lista de items remotos con timestamps
    
    3. GetLocalChanges()
        └─ Leer tabla "changes" de SQLite
        └─ Items: nuevos, modificados, eliminados
    
    4. ReconcileConflicts()
        for each item:
            local_time = item.local_updated_time
            remote_time = item.remote_updated_time
            
            if local_time > remote_time:
                action = UPLOAD
            elif remote_time > local_time:
                action = DOWNLOAD
            else:
                action = SKIP
    
    5. DownloadRemoteItems()
        for each remote_item in remoteChanges:
            data = provider.Get(remote_item.path)
            db.SaveDocument(remote_item.path, data)
            db.UpdateSyncState(remote_item.path, remote_item.timestamp)
    
    6. UploadLocalItems()
        for each local_change in localChanges:
            data = db.GetDocument(local_change.path)
            
            // FastCDC + Dedup
            chunks = FastCDC(data)
            for chunk in chunks:
                if not bloomFilter.MayExist(chunk.hash):
                    provider.Put(chunk.path, chunk.data)
            
            // Put metadata
            provider.Put(local_change.path, metadata)
            db.UpdateSyncState(local_change.path, now())
    
    7. CleanupLocalChanges()
        └─ Limpiar tabla "changes"
    
    8. ReleaseLock()
        └─ Eliminar archivo "sync.lock"
```

### Flowchart

```
START
  │
  ├─► AcquireLock() ──────────┐
  │                           │
  ├─► GetRemoteState()        │
  │   (provider.Delta)        │
  │   └─ [remote items]       │
  │                           │
  ├─► GetLocalChanges()       │
  │   (SQLite)                │
  │   └─ [local changes]      │
  │                           │
  ├─► Reconcile()             │
  │   (LWW)                   │
  │                           │
  ├─► Download()              │ Dentro del lock
  │   (DOWNLOAD actions)      │
  │                           │
  ├─► Upload()                │
  │   (UPLOAD actions)        │
  │   (FastCDC + Bloom)       │
  │                           │
  ├─► Cleanup()               │
  │                           │
  └─► ReleaseLock() ─────────┘
  │
  └─► END
      (Report status)
```

## 📊 Comparación Final

| Criterio | rclone | SiYuan | Joplin | **Chronex** |
|----------|--------|--------|--------|-----------|
| Patrón | Generic | Specific | Adapter | **Adapter** |
| Backends | 70+ | 2-3 | 8 | **3-5** |
| E2EE | No | Sí | Sí | **Sí (Fase 3)** |
| Conflictos | No | No | Sí | **Sí (LWW)** |
| Lock distribuido | No | No | Sí | **Sí** |
| FastCDC | No | Sí | No | **Sí** |
| Dependencias | 254 | ~20 | ~50 | **~10** |
| Líneas código | ~250K | ~50K | ~100K | **~20K (MVP)** |

## 🚀 Fases de Implementación

### FASE 1: MVP (Semanas 1-4)

```
Objetivos:
- ✅ StorageProvider interface
- ✅ WebDAVProvider implementation
- ✅ S3Provider implementation
- ✅ LocalProvider implementation
- ✅ SyncEngine básica (LWW)
- ✅ SQLite schema
- ✅ Electron UI básica
- ✅ CLI para testing

Dependencias a agregar:
- studio-b12/gowebdav
- aws/aws-sdk-go-v2/s3
- mattn/go-sqlite3
- spf13/cobra
```

### FASE 2: Optimizaciones (Semanas 5-8)

```
Objetivos:
- ✅ FastCDC chunking
- ✅ Bloom filter dedup
- ✅ Distributed lock
- ✅ Parallel uploads
- ✅ Resume capability
- ✅ Progress tracking

Performance target:
- < 100MB en 30 segundos (típico)
- 70% reducción en re-uploads (dedup)
```

### FASE 3: Seguridad (Semanas 9-12)

```
Objetivos:
- ✅ AES-256 encryption
- ✅ Key derivation (Scrypt)
- ✅ Transparent E2EE
- ✅ Key rotation
- ✅ Secure storage (OS keyring)
```

### FASE 4: Avanzado (Semanas 13+)

```
Objetivos:
- ✅ Sharing + permissions
- ✅ Selective sync
- ✅ Bandwidth throttling
- ✅ Mobile (React Native)
- ✅ Server sync component
```

## ✅ Conclusión

Esta arquitectura proporciona:

1. **Simplicidad**: ~10 dependencias vs 254 de rclone
2. **Flexibilidad**: Adapter pattern permite agregar backends fácilmente
3. **Robustez**: Sincronización two-way con reconciliación
4. **Eficiencia**: FastCDC + Bloom filter para optimizar ancho de banda
5. **Seguridad**: Preparado para E2EE en fase 3
6. **Escalabilidad**: Locks distribuidos para múltiples clientes
7. **Testabilidad**: Providers pueden ser mockeados

**Próximo paso**: Implementar FASE 1 (MVP) en 4 semanas.
