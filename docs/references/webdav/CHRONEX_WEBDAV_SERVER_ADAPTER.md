# Chronex como Servidor WebDAV: Adaptando rclone serve webdav

## 🎯 Propuesta: Chronex Dual-Mode Architecture

Chronex podría funcionar en **dos modos complementarios**:

1. **Client Mode**: Sincronizar DESDE servidores WebDAV remotos (Joplin pattern)
2. **Server Mode**: Exponer la base de datos local Chronex COMO servidor WebDAV

```
Modo Cliente:
Remote WebDAV Server ←→ Chronex ←→ Local SQLite DB

Modo Servidor:
Local SQLite DB ←→ Chronex WebDAV Server ←→ External Clients
                                    ↓
                        (Obsidian, Nextcloud,
                         Cadaver, WinSCP, etc.)
```

---

## 📊 Caso de Uso: Por Qué Chronex Necesita Servidor WebDAV

### Escenario 1: Compartir Bóvedas

```
User A (Chronex)
    ├─ starts: chronex serve webdav --port 8080
    │
    └─ Otros usuarios acceden via:
       ├─ Obsidian WebDAV plugin
       ├─ Nextcloud
       ├─ Cadaver CLI
       └─ WinSCP
```

### Escenario 2: Multi-Dispositivo

```
Desktop (Chronex Server)
    ├─ chronex serve webdav --port 8080 --cache-mode full
    │
    └─ Mobile (Chronex Client)
       └─ Sincroniza via WebDAV hacia desktop
```

### Escenario 3: Backup + Sync

```
Chronex Local
    ├─ Server: chronex serve webdav unix:///tmp/chronex.socket
    │
    ├─ Cliente Backup: rclone copy webdav:localhost s3://backup
    │
    └─ Cliente Mobile: Obsidian sync via WebDAV
```

---

## 🏗️ Arquitectura: Chronex WebDAV Server

### Tres Capas (Similar a rclone)

```
┌─────────────────────────────────────────────────┐
│           Chronex Application                    │
│  - Block model                                   │
│  - SQLite local DB                               │
│  - Conflict resolution                           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│        Virtual File System (VFS)                 │
│  - Block → File mapping                          │
│  - Directory structure                           │
│  - Cache (metadata, content)                     │
│  - Serializaton (FlatBuffers)                    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│      WebDAV Handler (golang.org/x/net/webdav)   │
│  - PROPFIND (lista directorio)                   │
│  - GET (descarga bloque)                         │
│  - PUT (sube bloque)                             │
│  - DELETE (elimina)                              │
│  - MOVE (renombra)                               │
│  - LOCK/UNLOCK (concurrencia)                    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         HTTP Server + Authentication             │
│  - TLS/HTTPS support                             │
│  - Basic Auth                                    │
│  - Token Auth                                    │
│  - Unix Socket support                           │
└────────────────┬────────────────────────────────┘
                 │
            External Clients
            (Obsidian, Nextcloud, etc.)
```

---

## 🔧 Implementación: Opciones Adaptadas de rclone

### 1. HTTP Server Configuration

```go
// cmd/serve/webdav_server.go

type WebDAVServerConfig struct {
    // Network
    Addr              string        // default: localhost:8080
    TLSCert           string        // /path/to/cert.pem
    TLSKey            string        // /path/to/key.pem
    
    // Authentication
    Username          string        // Basic auth user
    Password          string        // Basic auth password
    HtpasswdFile      string        // Apache-style htpasswd
    AuthProxy         string        // https://auth-server for proxy auth
    
    // HTTP Options
    MaxHeaderBytes    int64         // default: 8192
    ReadTimeout       time.Duration // HTTP read timeout
    WriteTimeout      time.Duration // HTTP write timeout
    
    // WebDAV Options
    EtagHash          string        // MD5, SHA1, auto
    DisableDirList    bool          // Disable HTML dir listing
    DisableZip        bool          // Disable ZIP downloads
    ReadOnly          bool          // Read-only mode
}
```

### 2. VFS (Virtual File System) - Mapping Blocks to Files

```go
// pkg/sync/vfs/chronex_vfs.go

type ChronexVFS struct {
    db           *SQLiteDB              // Local database
    cache        *BlockCache            // Metadata cache
    serializer   *FlatBuffersSerializer // FlatBuffers encoding
    mu           sync.RWMutex
    
    // Configuration
    CacheMode    CacheMode              // off, minimal, writes, full
    CacheTTL     time.Duration
    MaxCacheSize int64
}

// Block → File System Mapping
// /notes/work/project.md     → Block(id=uuid-123, title="project", format=markdown)
// /attachments/image.png     → Block(id=uuid-456, content=binary)
// /tags/important/           → Virtual directory (filtered blocks)
// /deleted/                  → Trash (soft-deleted blocks)
```

### 3. WebDAV Handler Implementation

```go
// pkg/sync/webdav_server/handler.go

type ChronexWebDAVHandler struct {
    vfs     *ChronexVFS
    handler *webdav.Handler
}

// Implements golang.org/x/net/webdav.FileSystem
func (h *ChronexWebDAVHandler) Mkdir(ctx context.Context, name string, perm os.FileMode) error {
    // Create virtual directory (tagged blocks)
}

func (h *ChronexWebDAVHandler) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error) {
    // Open block as file (serialize with FlatBuffers if needed)
}

func (h *ChronexWebDAVHandler) RemoveAll(ctx context.Context, name string) error {
    // Soft delete blocks
}

func (h *ChronexWebDAVHandler) Rename(ctx context.Context, oldName, newName string) error {
    // Update block metadata
}

func (h *ChronexWebDAVHandler) Stat(ctx context.Context, name string) (os.FileInfo, error) {
    // Get block metadata from cache
}
```

### 4. Block-to-File Serialization

```go
// Key Decision: How to represent blocks in filesystem namespace

// Option A: One file per block
// /blocks/
//   ├─ uuid-123.md                 (markdown block)
//   ├─ uuid-456.json               (structured block)
//   └─ uuid-789/                   (directory-like block)

// Option B: Hierarchical (by tags/folders)
// /notes/
//   ├─ work/
//   │  ├─ project.md
//   │  └─ meeting-notes.md
//   └─ personal/
//      └─ ideas.md

// Option C: Flat (by date)
// /2026/
//  ├─ 04/
//  │  ├─ 12-morning-notes.md
//  │  └─ 12-afternoon.md
//  └─ 03/

// RECOMMENDED: Option B (Hierarchical) + Option A (UUID fallback)
// - More user-friendly for external clients
// - Can still access by UUID if needed
// - Tags create virtual directories
```

---

## 📋 Opciones: Parámetros de línea de comandos

```bash
# ============================================
# HTTP Server Options
# ============================================

# Puerto y binding (default: localhost:8080)
chronex serve --addr 0.0.0.0:8080

# HTTPS/TLS (Let's Encrypt)
chronex serve \
    --addr 0.0.0.0:443 \
    --cert /etc/letsencrypt/live/chronex.example.com/fullchain.pem \
    --key /etc/letsencrypt/live/chronex.example.com/privkey.pem

# Unix socket (IPC, no auth needed - uses socket perms)
chronex serve --addr unix:///tmp/chronex.socket

# Max header size (for large PUT requests)
chronex serve --max-header-bytes 16384

# ============================================
# Authentication Options
# ============================================

# Basic Auth (single user)
chronex serve --user alice --pass secretpassword

# Htpasswd file (multiple users, Apache-style)
chronex serve --htpasswd /etc/chronex.htpasswd

# Token Auth (Bearer tokens)
chronex serve --token-auth --token-file /etc/chronex.tokens

# Proxy Auth (behind reverse proxy)
chronex serve --auth-proxy https://auth.company.com

# Public (no authentication)
chronex serve --public

# ============================================
# VFS Cache Options
# ============================================

# Cache mode: off, minimal, writes, full (default: writes)
chronex serve --vfs-cache-mode full

# Max cache size (default: 10G)
chronex serve --vfs-cache-max-size 50G

# Cache TTL (default: 5m)
chronex serve --vfs-cache-poll-interval 10m

# Disable cache warmup on startup
chronex serve --vfs-cache-no-warmup

# ============================================
# WebDAV-Specific Options
# ============================================

# ETag hash: MD5, SHA1, FastCDC, auto (default: auto)
chronex serve --etag-hash fastcdc

# Disable directory listing (HTML)
chronex serve --disable-dir-list

# Disable ZIP downloads
chronex serve --disable-zip

# Read-only mode (no PUT, DELETE, MOVE)
chronex serve --read-only

# Enable CORS
chronex serve --enable-cors

# ============================================
# Performance Options
# ============================================

# Max concurrent requests
chronex serve --max-concurrent 100

# Timeout values
chronex serve \
    --read-timeout 30s \
    --write-timeout 30s \
    --idle-timeout 60s

# Bandwidth limiting (throttle upload/download)
chronex serve \
    --bwlimit upload:1M \
    --bwlimit download:5M

# ============================================
# Logging & Debug
# ============================================

# Log level: CRITICAL, ERROR, WARNING, NOTICE, INFO, DEBUG
chronex serve --log-level debug

# Log file
chronex serve --log-file /var/log/chronex-server.log

# Request logging (HTTP)
chronex serve --http-trace

# Database query logging
chronex serve --sql-trace
```

---

## 💡 Ejemplo: Configuraciones Comunes

### 1. Development Server (Local Network)

```bash
chronex serve \
    --addr 192.168.1.100:8080 \
    --user alice \
    --pass devpassword \
    --vfs-cache-mode full \
    --log-level debug \
    --enable-cors
```

### 2. Production Server (HTTPS, Multiple Users)

```bash
chronex serve \
    --addr 0.0.0.0:443 \
    --cert /etc/letsencrypt/live/chronex.io/fullchain.pem \
    --key /etc/letsencrypt/live/chronex.io/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 100G \
    --log-file /var/log/chronex.log \
    --max-concurrent 500
```

### 3. Read-Only Backup Server

```bash
chronex serve \
    --addr unix:///tmp/chronex-backup.socket \
    --read-only \
    --vfs-cache-mode minimal \
    --auth-proxy https://internal-auth.company.com
```

### 4. Mobile Sync (Low-Bandwidth)

```bash
chronex serve \
    --addr 0.0.0.0:443 \
    --cert /path/to/cert.pem \
    --key /path/to/key.pem \
    --user mobile \
    --pass token123 \
    --etag-hash fastcdc \
    --bwlimit download:500K \
    --disable-zip
```

---

## 🔐 Security Considerations

### 1. HTTPS is Mandatory for Remote Access

```bash
# ❌ NEVER use HTTP for remote access
chronex serve --addr 0.0.0.0:8080  # Bad!

# ✅ Always use HTTPS
chronex serve \
    --addr 0.0.0.0:443 \
    --cert /path/to/cert.pem \
    --key /path/to/key.pem
```

### 2. Strong Authentication

```bash
# ❌ Weak: simple password
chronex serve --user admin --pass password123

# ✅ Better: htpasswd with bcrypt
htpasswd -B -C 10 /etc/chronex.htpasswd alice
chronex serve --htpasswd /etc/chronex.htpasswd

# ✅ Best: Token auth + proxy auth
chronex serve --token-auth --auth-proxy https://keycloak.company.com
```

### 3. Unix Socket for Local Services

```bash
# ✅ Safe: Only local processes with socket permissions can access
chronex serve --addr unix:///var/run/chronex/webdav.socket
chmod 600 /var/run/chronex/webdav.socket
```

### 4. Read-Only for Untrusted Networks

```bash
# ✅ Safer: Block uploads from untrusted users
chronex serve --read-only --user backup
```

---

## 🚀 Implementation Plan

### Phase 1: VFS Layer (Weeks 1-2)

- [ ] Implement `ChronexVFS` struct
- [ ] Block → Filesystem path mapping
- [ ] Create virtual directories (tags, dates, etc.)
- [ ] Implement cache layer (metadata, content)
- [ ] Add FlatBuffers serialization for GET/PUT

```go
type ChronexVFS interface {
    // Implement golang.org/x/net/webdav.FileSystem
    Mkdir(ctx context.Context, name string, perm os.FileMode) error
    OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error)
    RemoveAll(ctx context.Context, name string) error
    Rename(ctx context.Context, oldName, newName string) error
    Stat(ctx context.Context, name string) (os.FileInfo, error)
}
```

### Phase 2: WebDAV Handler (Week 2-3)

- [ ] Create WebDAV handler using `golang.org/x/net/webdav.Handler`
- [ ] Wrap VFS layer
- [ ] Implement lock system
- [ ] Add ETag support (MD5, SHA1, FastCDC)

```go
handler := &webdav.Handler{
    FileSystem: vfs,
    LockSystem: webdav.NewMemoryLockSystem(),
    Logger:     debugLogger,
}
```

### Phase 3: HTTP Server (Week 3-4)

- [ ] Create HTTP server with TLS support
- [ ] Implement authentication (Basic, Htpasswd, Token)
- [ ] Add request logging
- [ ] Support Unix sockets, TCP, TLS

### Phase 4: Configuration & Testing (Week 4-5)

- [ ] Command-line flags (addr, cert, key, auth, cache, etc.)
- [ ] Configuration file support
- [ ] Unit tests (VFS layer)
- [ ] Integration tests (WebDAV client + server)
- [ ] Performance testing

### Phase 5: Optimization (Week 5-6)

- [ ] Cache warmup on startup
- [ ] Bandwidth limiting
- [ ] Concurrent request limiting
- [ ] Custom ETag generation (FastCDC)

---

## 📊 Comparison: Chronex Server vs rclone serve webdav

| Feature | rclone serve webdav | Chronex serve |
|---------|-------------------|---------------|
| **Purpose** | Expose any rclone backend | Expose Chronex blocks |
| **Backend** | S3, GDrive, Dropbox, Local, etc. | SQLite (blocks) |
| **VFS** | ✅ rclone/vfs | ✅ ChronexVFS (blocks → files) |
| **Handler** | golang.org/x/net/webdav | golang.org/x/net/webdav |
| **Auth** | Basic, Htpasswd, Proxy | Basic, Htpasswd, Token, Proxy |
| **Serialization** | Raw files | FlatBuffers (optimized) |
| **ETag** | MD5, SHA1 | FastCDC hash (better dedup) |
| **Locking** | Memory-based | Memory-based (could use DB) |
| **Caching** | VFS modes | Block cache + metadata cache |
| **HTTPS** | ✅ Yes | ✅ Yes |
| **Unix Socket** | ✅ Yes | ✅ Yes |
| **Read-Only** | ✅ Yes | ✅ Yes |
| **Special** | Works with 70+ backends | Works with Chronex blocks |

---

## 🎯 Use Cases for Chronex WebDAV Server

### 1. **Obsidian Integration**
```bash
# Obsidian WebDAV plugin can connect to:
# Server: chronex.io
# Port: 443 (HTTPS)
# Username/Password: from htpasswd
```

### 2. **Nextcloud Sync**
```bash
# Nextcloud External Storage
# Protocol: WebDAV
# URL: https://chronex.io:443/
# Auth: username/password
```

### 3. **Cadaver CLI**
```bash
# Mount Chronex as WebDAV filesystem
cadaver https://chronex.io:443/
dav:https://chronex.io/> ls
dav:https://chronex.io/> cd notes/work
dav:https://chronex.io/notes/work> put local-file.md
```

### 4. **Mobile Client Backup**
```go
// Mobile app syncs to desktop Chronex server
// Instead of cloud service (more privacy)
webdavClient.Upload("https://desktop:8080/notes/", file)
```

### 5. **Cross-Device Sync**
```
Desktop Chronex Server (file serving)
    ↓
Tablet WebDAV Client (Obsidian plugin)
    ↓
Phone WebDAV Client (Obsidian plugin)
    
All syncing locally, no cloud required
```

---

## 🔄 Dual-Mode Architecture

Chronex podría soportar AMBOS modos simultáneamente:

```bash
# Single process serving BOTH directions
chronex run \
    # Client mode: sync FROM remote servers
    --client-webdav-urls "https://nextcloud.example.com/dav/" \
    --client-auth-type basic \
    --client-username alice \
    --client-password secret \
    \
    # Server mode: expose as WebDAV TO clients
    --server-addr 0.0.0.0:443 \
    --server-cert /etc/letsencrypt/live/chronex.io/fullchain.pem \
    --server-key /etc/letsencrypt/live/chronex.io/privkey.pem \
    --server-htpasswd /etc/chronex.htpasswd
```

```
External WebDAV Server
    ↑ (pull via WebDAV client)
    │
Chronex Local DB
(bidirectional sync)
    │
    ↓ (serve via WebDAV server)
External Clients
(Obsidian, Nextcloud, etc.)
```

---

## 🎓 Learning from rclone

**rclone serve webdav** taught us:

1. **Use golang.org/x/net/webdav** - No need to implement from scratch
2. **VFS abstraction is key** - Decouple storage from HTTP protocol
3. **Support multiple auth methods** - Different use cases need different auth
4. **Cache is critical** - Especially for remote backends
5. **ETag support** - For proper If-Match/If-None-Match semantics
6. **Locking system** - For concurrent access
7. **Simple options** - Port, TLS, auth, cache, that's it

---

## 💻 Implementation Complexity

### Estimated Effort

| Component | Lines of Code | Complexity | Effort |
|-----------|--------------|-----------|---------|
| ChronexVFS | ~500 | Medium | 1 week |
| WebDAV Handler | ~300 | Low | 3 days |
| HTTP Server | ~400 | Low | 1 week |
| Authentication | ~200 | Low | 3 days |
| Tests | ~800 | Medium | 1 week |
| **Total** | **~2,200** | **Low-Medium** | **4-5 weeks** |

vs rclone serve webdav: **705 lines** (but they didn't need VFS, already had it)

Chronex would be slightly larger because of:
- Custom VFS (block → file mapping)
- FlatBuffers serialization
- Custom ETag (FastCDC)

But much simpler than full rclone (which has 70+ backends).

---

## 🎯 Final Recommendation

**Chronex should implement WebDAV Server** because:

1. ✅ **Enables sharing** - Users can share vaults with others
2. ✅ **Multi-device sync** - Without cloud intermediary
3. ✅ **Better privacy** - No third-party involved
4. ✅ **Ecosystem compatibility** - Works with Obsidian, Nextcloud, WinSCP, etc.
5. ✅ **rclone proves it's doable** - Just 705 lines, using standard Go library
6. ✅ **Chronex-specific optimizations** - Can use FastCDC ETags, FlatBuffers serialization
7. ✅ **Foundation for future**:
   - S3 backend (expose Chronex blocks to S3)
   - Dropbox backend
   - iCloud backend
   - "Chronex server in the cloud" mode

**Timeline**: 4-5 weeks for MVP (basic VFS + WebDAV + Basic Auth)

**Advantage over rclone**: Chronex can optimize specifically for block-based storage:
- Semantic file paths (by tags, dates, etc.)
- FlatBuffers for network efficiency
- FastCDC for better deduplication
- Block-level locking (not file-level)

