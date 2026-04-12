# Análisis Comparativo: Sistemas de Versionado, Deduplicación y Almacenamiento Basado en Contenido

## 📋 Resumen Ejecutivo

Existen varios sistemas y patrones arquitectónicos para implementar sincronización, deduplicación y versionado en aplicaciones modernas. Este documento analiza los principales enfoques **SIN enfocarse en SiYuan**, sino en arquitecturas genéricas:

1. **Restic** - Backup con CDC en Go
2. **ArtiVC** - Versionado de artefactos
3. **IPFS** - Sistema de archivos distribuido
4. **Git** - Control de versiones tradicional
5. **F483/Dejavu** - Detección de duplicados

---

## 🔄 Content-Defined Chunking (CDC) - El Patrón Fundamental

### ¿Qué es CDC?

CDC es un algoritmo que divide datos en **fragmentos de tamaño variable** basándose en el contenido, no en posiciones fijas:

```
Archivo Original (1MB)
    ↓
┌─────────────────────────────────────┐
│ [variable]│[variable]│[variable]    │ ← Chunks basados en contenido
├─────────────────────────────────────┤
│ vs Fixed-size                       │
│ [4KB]│[4KB]│[4KB]│[4KB]│[4KB]│...  │ ← Chunks de tamaño fijo
└─────────────────────────────────────┘
```

### Ventaja: Resilencia a Cambios

**Escenario**: Insertar 10 bytes al inicio de un archivo de 1MB

**Con Fixed-Size Chunking**:
```
Antes:  [Chunk1][Chunk2][Chunk3]...[Chunk256]
Después:[Chunk1][Chunk2][Chunk3]...[Chunk256]
        ❌ TODOS los chunks cambian (boundary shift problem)
        ❌ 256 fragmentos nuevos para sincronizar
```

**Con CDC**:
```
Antes:  [Chunk_A][Chunk_B][Chunk_C]...[Chunk_Z]
Después:[Chunk_HEADER][Chunk_A][Chunk_B][Chunk_C]...[Chunk_Z]
        ✅ Solo 1 chunk nuevo (header)
        ✅ Deduplicación automática de Chunk_A, Chunk_B, etc.
```

---

## 🎯 Algoritmos de CDC

### 1. Rabin Fingerprinting (Usado por Restic)

**Concepto**: Usa ventana deslizante de 64 bytes sobre el stream de datos

```go
// Pseudocódigo
window := make([]byte, 64)
for _, byte := range data {
    window = append(window[1:], byte)  // Deslizar ventana
    hash := rabin_hash(window)
    
    // Definir un punto de corte si los bits bajos son cero
    if hash & 0x1FFF == 0 {  // Bits bajos son cero
        create_chunk()
        window.reset()
    }
}
```

**Parámetros**:
- Ventana: 64 bytes
- Tamaño target: 1 MB
- Rango: 512 KB - 8 MB

**Rendimiento**: ~20 MB/s en procesadores modernos

**Ventaja**: Matemáticamente robusto
**Desventaja**: CPU intensivo

### 2. Gear-Based CDC (Más rápido)

Simplifica Rabin usando tabla de lookup:

```go
// Pseudocódigo
gear := make([]byte, 256)
for _, byte := range data {
    hash = (hash << 1) + gear[byte]
    
    if hash % 256 == 0 {
        create_chunk()
        hash = 0
    }
}
```

**Rendimiento**: ~80 MB/s

### 3. FastCDC (Optimizado)

Mejora Gear agregando "kickstart loop":

```go
// Solo check de cutting después de tamaño mínimo
for i, byte := range data {
    if i < MIN_SIZE {
        continue  // Skip check hasta alcanzar tamaño mínimo
    }
    
    hash = (hash << 1) + gear[byte]
    if hash % target == 0 {
        create_chunk()
    }
}
```

**Rendimiento**: ~200+ MB/s (10x más rápido que Rabin)

---

## 🏗️ Restic: Arquitectura Completa de Backup

### Estructura del Repositorio Restic

```
repository/
├── config                     ← Configuración encriptada
├── keys/
│   ├── keyid1                 ← Claves derivadas
│   └── keyid2
├── snapshots/                 ← Metadatos de snapshots
│   ├── snapshot1.json
│   └── snapshot2.json
├── data/                      ← Blobs de datos
│   ├── 01/
│   │   ├── abc123...          ← Chunk encriptado
│   │   └── def456...
│   └── 02/
├── index/                     ← Índices
│   ├── index1
│   └── index2
└── locks/                     ← Control de concurrencia
```

### Flujo de Backup en Restic

```
1. Leer archivos locales
    ↓
2. Para cada archivo:
    ├─ Dividir en chunks con FastCDC
    ├─ Computar SHA-256 de cada chunk
    └─ Comprimir + Encriptar (AES-256)
    ↓
3. Deduplicación: Comparar SHA-256 con chunks existentes
    ├─ Si existe → Skip (ya está en repo)
    └─ Si nuevo → Guardar en data/
    ↓
4. Crear snapshot (metadatos del backup)
    ├─ Lista de archivos
    ├─ Referencias a chunks
    └─ Timestamp
    ↓
5. Comprimir snapshot y guardar
```

### Encriptación en Restic

```
Data + Metadata
    ↓
AES-256 (Counter Mode)
    ↓
Poly1305-AES (Autenticación)
    ↓
Key Derivation: Scrypt(password, salt, N, r, p)
    ├─ 32 bytes para AES key
    └─ 32 bytes para Auth key
```

**Seguridad**: End-to-end, servidor no puede leer datos

---

## 🎨 ArtiVC: Versionado de Artefactos

ArtiVC es más cercano al uso en Chronex que Restic (que es para backups):

### Concepto

```
ArtiVC = Git + Deduplicación + Multi-Backend
```

### Estructura

```
artivc-repo/
├── .artivc/
│   ├── config              ← Configuración
│   ├── index               ← Índices de versiones
│   └── lock
├── objects/                ← Chunks deduplicados
│   ├── ab/
│   │   ├── cdef123...
│   │   └── cdef456...
│   └── cd/
├── refs/                   ← Referencias
│   ├── heads/main
│   ├── tags/v1.0.0
│   └── commits
└── tmp/
```

### Operaciones Clave

```
artivc commit -m "Add training data"
    ├─ CDC: Dividir archivos en chunks
    ├─ Dedup: Comparar con chunks existentes
    ├─ Compress: Comprimir nuevos chunks
    └─ Store: Guardar en objects/

artivc push <backend>
    ├─ Sincronizar con S3/GCS/Azure/etc
    ├─ Solo subir chunks nuevos (deduplicación)
    └─ Transferir metadatos

artivc checkout v1.0.0
    ├─ Recuperar chunks de objects/
    ├─ Reconstruir árbol de archivos
    └─ Restaurar a versión etiquetada
```

### Backends Soportados

```
Local Filesystem
├─ ssh://        ← Remote SSH
├─ s3://         ← Amazon S3
├─ gs://         ← Google Cloud Storage
├─ az://         ← Azure Blob Storage
└─ (40+ más vía Rclone)
```

---

## 🌐 IPFS: Almacenamiento Basado en Contenido Distribuido

### Conceptos Clave

#### 1. Content Addressing (direccionamiento por contenido)

```
Archivo: datos.csv
    ↓
SHA-256(datos.csv) = QmABC123...
    ↓
"Dirección" del archivo = su hash
    ↓
Ventaja: Mismo contenido siempre tiene mismo hash
         → Deduplicación automática global
```

#### 2. Merkle DAG

```
Root Hash (QmXYZ)
    ├─ Block A (QmABC)
    │  ├─ Chunk 1 (Qm001)
    │  └─ Chunk 2 (Qm002)
    ├─ Block B (QmDEF)
    │  ├─ Chunk 3 (Qm003)
    │  └─ Chunk 4 (Qm004)
    └─ Block C (QmGHI)
       ├─ Chunk 5 (Qm005)
       └─ Chunk 6 (Qm006)

Propiedad: Si cambias un chunk, su hash cambia
           → Todos los hashes padres también cambian
           → Detección de cambios trivial
```

#### 3. Content Identifier (CID)

```
CID = Hash Algorithm + Encoding + Hash Digest

Ejemplo: 
QmABCDEF...
└─ Q = base32
   m = IPFS multicodec
   ABCDEF... = SHA-256 hash
```

### IPFS vs Git

```
┌─────────────┬──────────────────┬──────────────────┐
│             │ Git              │ IPFS             │
├─────────────┼──────────────────┼──────────────────┤
│ DAG         │ Merkle Tree      │ Merkle DAG       │
│ Ubicación   │ URL + rama       │ CID              │
│ Replicación │ Centralizado     │ P2P distribuido  │
│ Integridad  │ Firma GPG        │ Hash verificación│
│ Dedup       │ Delta compress   │ Content-based    │
└─────────────┴──────────────────┴──────────────────┘
```

---

## 🔍 F483/Dejavu: Detección de Duplicados Eficiente

### Propósito

Detectar rápidamente si datos ya fueron "vistos" (para deduplicación):

```
Has visto estos datos antes?
    ├─ Sí → Deduplicar
    └─ No → Guardar
```

### Implementaciones

#### Determinística
```
Memory: O(n) donde n = cantidad de datos únicos
Time:   O(1) por query
```

#### Probabilística (Bloom Filter)
```
Memory: O(log n) ← Mucho más eficiente
Time:   O(1) por query
Tradeoff: Falsos positivos posibles (~1e-6)
          Pero NO falsos negativos
```

### Uso en Deduplicación

```
Procesar archivo.pdf:
    ├─ Dividir en chunks (CDC)
    ├─ Para cada chunk:
    │  ├─ ¿Ya visto este chunk?
    │  │  ├─ Sí (Dejavu dice que sí) → Skip
    │  │  └─ No → Guardar + Registrar en Dejavu
    └─ Resultado: Solo guardar chunks nuevos
```

---

## 📊 Comparación de Arquitecturas

| Aspecto | Restic | ArtiVC | IPFS | Git |
|---------|--------|--------|------|-----|
| **Caso de Uso** | Backup | Artefactos | Distribuido | VCS |
| **CDC** | ✅ FastCDC | ✅ Sí | ⚠️ Fixed | ❌ No |
| **Dedup** | ✅ Sí | ✅ Sí | ✅ Sí | Delta |
| **Encriptación** | ✅ AES-256 | ⚠️ Opcional | ❌ No | ❌ No |
| **Multi-Backend** | ✅ 4+ | ✅ 40+ | P2P | Local |
| **Versiones** | Snapshots | Commits | DAG | History |
| **Conflictos** | No aplica | Manual merge | DAG | Manual |
| **Tamaño DB** | 100GB+ | 10GB+ | Distribuido | ~1GB |

---

## 🚀 Implementación Recomendada para Chronex

### Enfoque Híbrido: Lo Mejor de Cada Sistema

```
┌─────────────────────────────────────────────────────┐
│ Chronex Sync System (Propuesta)                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Layer 1: CDC Detection (Similar a Restic)          │
│  ├─ FastCDC para dividir cambios en chunks         │
│  └─ SHA-256 para identificar contenido             │
│                                                      │
│ Layer 2: SQLite Snapshots (Similar a ArtiVC)       │
│  ├─ Tabla snapshots con metadatos                  │
│  ├─ Tabla chunks con datos encriptados             │
│  └─ Tabla refs (latest, tags)                      │
│                                                      │
│ Layer 3: Detección de Duplicados (Como F483)       │
│  ├─ Bloom filter para chunks vistos                │
│  ├─ O(1) query time                                │
│  └─ Minimal memory overhead                        │
│                                                      │
│ Layer 4: Múltiples Proveedores (Como ArtiVC)       │
│  ├─ WebDAV                                          │
│  ├─ S3 Compatible                                   │
│  └─ Local Filesystem                               │
│                                                      │
│ Layer 5: Encriptación (Como Restic)                │
│  ├─ AES-256 en counter mode                        │
│  ├─ Poly1305 para autenticación                    │
│  └─ Scrypt para derivación de keys                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Tabla Comparativa: Qué Tomar de Cada Sistema

| Sistema | Tomar | Adaptar | Descartar |
|---------|-------|---------|-----------|
| **Restic** | FastCDC, AES-256 | CDC para DB | Snapshot file-based |
| **ArtiVC** | Estructura refs | Multi-backend | CLI-only |
| **IPFS** | Merkle DAG idea | P2P no needed | Blockchain overhead |
| **Git** | Commit history | Para docs | Central model |
| **F483** | Bloom filter | Para chunks | Standalone tool |

---

## 💾 Estructura de Base de Datos Propuesta

### Tables para Chronex

```sql
-- Snapshots (como ArtiVC commits)
CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,           -- SHA-256
    created_at TIMESTAMP,
    parent_id TEXT,                -- Chain de versiones
    message TEXT,                  -- Commit message
    files_count INT,
    total_size INT,
    FOREIGN KEY (parent_id) REFERENCES snapshots(id)
);

-- Chunks (como objects en Restic/ArtiVC)
CREATE TABLE chunks (
    id TEXT PRIMARY KEY,           -- SHA-256
    data BLOB,                     -- Encriptado AES-256
    size INT,
    compressed_size INT,
    created_at TIMESTAMP,
    INDEX idx_chunks_created (created_at)
);

-- Files en cada snapshot (como refs)
CREATE TABLE snapshot_files (
    snapshot_id TEXT,
    file_path TEXT,
    file_size INT,
    modified_at TIMESTAMP,
    chunk_ids TEXT,                -- JSON array de chunk IDs
    PRIMARY KEY (snapshot_id, file_path),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

-- Refs (latest, tags)
CREATE TABLE refs (
    name TEXT PRIMARY KEY,         -- "latest", "tag:v1.0", etc
    snapshot_id TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

-- Duplicate detection (Bloom filter data)
CREATE TABLE dedup_filter (
    chunk_id TEXT PRIMARY KEY,
    first_seen TIMESTAMP
);

-- Sync state
CREATE TABLE sync_state (
    id TEXT PRIMARY KEY,
    entity_type TEXT,              -- 'snapshot', 'chunk'
    entity_id TEXT,
    local_hash TEXT,
    remote_hash TEXT,
    last_synced TIMESTAMP,
    status TEXT,                   -- 'synced', 'pending', 'conflict'
    provider TEXT                  -- 'webdav', 's3', 'local'
);
```

---

## 🔐 Encriptación Propuesta (Como Restic)

### Key Derivation

```
Password
    ↓
Scrypt(
    password,
    salt,
    N=16384,        -- CPU cost
    r=8,
    p=1
)
    ↓
64 bytes
├─ 32 bytes → AES-256 key
└─ 32 bytes → Poly1305 auth key
```

### Encriptación de Chunk

```
PlainText Chunk
    ↓
IV (random 16 bytes)
    ↓
AES-256-CTR (Encrypt)
    ↓
Poly1305-AES (Authenticate)
    ↓
[IV || Ciphertext || MAC]
    ↓
Guardar en chunks table
```

---

## 📈 Performance Targets

Basado en Restic y FastCDC:

```
CDC Chunking:    200+ MB/s
AES Encryption:  500+ MB/s
SHA-256:         200+ MB/s
Network:         Depende de conexión

Total Throughput (local): ~100 MB/s
Total Throughput (network): Limited by network
```

---

## 🎯 Fases de Implementación

### Fase 1: CDC + SHA-256
```
Detectar cambios con CDC
Almacenar chunks en SQLite
```

### Fase 2: Deduplicación
```
Bloom filter para chunks
Comparar antes de guardar
```

### Fase 3: Encriptación
```
AES-256-CTR
Poly1305 authentication
```

### Fase 4: Múltiples Proveedores
```
WebDAV
S3
Local Filesystem
```

### Fase 5: Sincronización Automática
```
Background worker
Retry con exponential backoff
Conflict resolution
```

---

## 🔗 Referencias Técnicas

- [Restic CDC Blog](https://restic.net/blog/2015-09-12/restic-foundation1-cdc/)
- [FastCDC Paper](https://www.usenix.org/system/files/conference/atc16/atc16-paper-xia.pdf)
- [Restic Design](https://restic.readthedocs.io/en/stable/design.html)
- [ArtiVC GitHub](https://github.com/infuseai/artivc)
- [IPFS Specs](https://specs.ipfs.tech/)
- [Rolling Hash Wikipedia](https://en.wikipedia.org/wiki/Rolling_hash)
- [Rabin Fingerprint Wikipedia](https://en.wikipedia.org/wiki/Rabin_fingerprint)
- [F483/Dejavu GitHub](https://github.com/F483/dejavu)
- [go-cdc-chunkers](https://plakar.io/posts/2025-07-11/introducing-go-cdc-chunkers-chunk-and-deduplicate-everything/)

---

## ✅ Conclusión

Para Chronex, recomendamos un **sistema híbrido** que combine:

1. ✅ **FastCDC** de Restic (eficiente, probado)
2. ✅ **Estructura de snapshots** de ArtiVC (simple, versionado)
3. ✅ **Encriptación AES-256** de Restic (segura, estándar)
4. ✅ **Bloom filter** de F483/Dejavu (deduplicación eficiente)
5. ✅ **Múltiples proveedores** de ArtiVC (flexibilidad)

**NO necesitamos**:
- ❌ Merkle DAG completo (demasiado complejo para docs)
- ❌ P2P distribution (IPFS) - Centralizamos en proveedores
- ❌ Blockchain (sin necesidad)
- ❌ CLI-only (integrado en Electron)

**Ventajas resultantes**:
- ✅ Deduplicación: 70-90% ahorro de almacenamiento
- ✅ Encriptación: End-to-end segura
- ✅ Multi-dispositivo: Sincronización bidireccional
- ✅ Transparencia: Usuario controla dónde guardar
- ✅ Rendimiento: 100+ MB/s en máquinas locales
