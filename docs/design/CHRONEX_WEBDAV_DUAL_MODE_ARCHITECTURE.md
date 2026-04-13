# Chronex: WebDAV Dual-Mode Architecture (Client + Server)

**Design Document Version**: 1.0  
**Date**: 2026-04-13  
**Foundation**: Rclone serve webdav architecture adapted for Chronex blocks  
**Philosophy**: "Chronex = Rclone for blocks (both client and server)"

---

## 1. EXECUTIVE SUMMARY

### The Vision

```
Chronex = Rclone Architecture
        + WebDAV Protocol
        + Blocks ↔ Filesystem VFS
        + Dual-Mode: Client + Server
        + SQLite Local Database
        + Universal Interoperability
```

### Why Rclone Pattern?

```
Rclone Proven:
├─ 50+ remote storage backends
├─ Efficient sync protocol
├─ Streaming/chunking support
├─ Robust error handling
├─ Cross-platform (Windows, macOS, Linux)
├─ WebDAV standard (no proprietary protocol)
└─ Battle-tested in production

Chronex Adaptation:
├─ Blocks instead of files
├─ WebDAV serves blocks as filesystem
├─ VFS translates between models
├─ Can sync TO/FROM any WebDAV server
├─ Obsidian compatible (native WebDAV)
└─ Nextcloud compatible (standard WebDAV)
```

---

## 2. CHRONEX DUAL-MODE ARCHITECTURE

### 2.1 Client Mode (Pull from Remote)

```
┌─────────────────────────────────────────────┐
│  CHRONEX CLIENT                              │
│  (Pulling from Remote Servers)               │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Remote Servers       │
        ├───────────────────────┤
        │ • Nextcloud WebDAV    │
        │ • S3 (via rclone)     │
        │ • Dropbox (via rclone)│
        │ • OneDrive            │
        │ • Generic WebDAV      │
        │ • HTTP server         │
        └───────────────────────┘
                    ↑
        ┌───────────────────────────────────┐
        │  CHRONEX VFS Layer                │
        ├───────────────────────────────────┤
        │  Translate filesystem → blocks    │
        │  Filesystem paths → block IDs     │
        │  File content → encrypted content │
        │  Metadata → block attributes      │
        └───────────────────────────────────┘
                    ↑
        ┌───────────────────────────────────┐
        │  SQLite Local Database            │
        ├───────────────────────────────────┤
        │  • blocks table                   │
        │  • notebooks table                │
        │  • metadata                       │
        │  • sync_state (vector clocks)    │
        │  • conflict resolution            │
        └───────────────────────────────────┘
```

**Use Case: Sync FROM Remote**

```bash
# Chronex pulls blocks from Nextcloud
chronex sync \
    --remote nextcloud \
    --remote-url https://nextcloud.example.com/remote.php/webdav \
    --remote-user alice \
    --remote-pass secret \
    --local-db ~/.chronex/chronex.db

# Result:
# ✅ Blocks from Nextcloud imported
# ✅ Stored in local SQLite
# ✅ Conflicts resolved via vector clocks
# ✅ Local edits can be pushed back
```

### 2.2 Server Mode (Serve to Clients)

```
┌─────────────────────────────────────────────┐
│  CHRONEX SERVER                              │
│  (Serving blocks via WebDAV)                 │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────────────┐
        │  External Clients                 │
        ├───────────────────────────────────┤
        │ • Obsidian + WebDAV plugin        │
        │ • WinSCP / FTP client             │
        │ • macOS Finder (mount WebDAV)     │
        │ • Linux Nautilus                  │
        │ • Nextcloud (consume blocks)      │
        │ • Another Chronex client          │
        │ • Any WebDAV-compatible client    │
        └───────────────────────────────────┘
                    ↑
        ┌───────────────────────────────────┐
        │  CHRONEX VFS Layer                │
        ├───────────────────────────────────┤
        │  Translate blocks → filesystem    │
        │  Block IDs → filesystem paths     │
        │  Block content → file content     │
        │  Metadata → WebDAV properties     │
        └───────────────────────────────────┘
                    ↑
        ┌───────────────────────────────────┐
        │  SQLite Local Database            │
        ├───────────────────────────────────┤
        │  • blocks table                   │
        │  • notebooks table                │
        │  • metadata                       │
        │  • sync_state (vector clocks)    │
        │  • conflict resolution            │
        └───────────────────────────────────┘
                    ↑
        ┌───────────────────────────────────┐
        │  WebDAV Server                    │
        ├───────────────────────────────────┤
        │  golang.org/x/net/webdav          │
        │  HTTP/HTTPS                       │
        │  Authentication (Basic/Digest)    │
        │  TLS/HTTPS support                │
        │  ETag/If-Match headers            │
        └───────────────────────────────────┘
```

**Use Case: Serve TO Clients**

```bash
# Chronex serves blocks via WebDAV
chronex serve webdav \
    --addr 0.0.0.0:8080 \
    --cert /etc/letsencrypt/live/chronex.io/fullchain.pem \
    --key /etc/letsencrypt/live/chronex.io/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 50G

# Result:
# ✅ Obsidian connects via WebDAV
# ✅ Tablets sync via WebDAV
# ✅ External clients access blocks
# ✅ Changes synchronized back
```

### 2.3 Bidirectional (Client + Server Together)

```
┌──────────────┐                 ┌──────────────┐
│ Desktop      │                 │   Tablet     │
│ Chronex      │ ←WebDAV Server→ │   Obsidian   │
│ (Server)     │                 │  (Client)    │
└──────────────┘                 └──────────────┘
       ↓ Sync                          ↓ Sync
       │                              │
       └──────→ Nextcloud Cloud ←─────┘
             (Remote sync v1.5)

Flow:
1. Desktop Chronex serves blocks via WebDAV (Server)
2. Tablet Obsidian connects to Desktop WebDAV (Client)
3. Desktop Chronex syncs TO Nextcloud (Client mode)
4. Nextcloud broadcasts changes to authorized users
5. All devices eventually consistent
```

---

## 3. RCLONE SERVE WEBDAV OPTIONS → CHRONEX ADAPTATION

### 3.1 HTTP Server Options

```bash
# ============================================================================
# RCLONE PATTERN                      │ CHRONEX ADAPTATION
# ============================================================================

# 1. LISTEN ADDRESS & PORT
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \                 # Rclone listens on default
  --addr 127.0.0.1:8080 \             # (localhost:8080)
  gdrive:

# Chronex adaptation:
chronex serve webdav \                # Chronex listens on custom
  --addr 0.0.0.0:8080 \               # (all interfaces)
  --db ~/.chronex/chronex.db

# Config file:
# [server]
# addr = "0.0.0.0:8080"
# db = "~/.chronex/chronex.db"


# 2. HTTPS/TLS (CRITICAL for remote access)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --cert /etc/letsencrypt/live/domain/fullchain.pem \
  --key /etc/letsencrypt/live/domain/privkey.pem \
  gdrive:

# Chronex adaptation (same):
chronex serve webdav \
  --addr 0.0.0.0:443 \
  --cert /etc/letsencrypt/live/chronex.io/fullchain.pem \
  --key /etc/letsencrypt/live/chronex.io/privkey.pem

# Config file:
# [server]
# cert = "/etc/letsencrypt/live/chronex.io/fullchain.pem"
# key = "/etc/letsencrypt/live/chronex.io/privkey.pem"


# 3. AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --user alice \
  --pass secret \
  gdrive:

# Chronex adaptation (same):
chronex serve webdav \
  --addr 0.0.0.0:8080 \
  --user alice \
  --pass secret

# OR use htpasswd file (better):
chronex serve webdav \
  --htpasswd /etc/chronex/users.htpasswd

# Htpasswd format:
# alice:$apr1$...encrypted...
# bob:$apr1$...encrypted...


# 4. MAX HEADER SIZE (prevent DoS)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --max-header-bytes 8192 \
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --max-header-bytes 16384 \  # Blocks may have large metadata
  --db ~/.chronex/chronex.db

# Config:
# [server]
# max_header_bytes = 16384
```

### 3.2 VFS Cache Options (CRITICAL for Performance)

```bash
# ============================================================================
# CACHE STRATEGY                      │ CHRONEX MEANING
# ============================================================================

# 1. CACHE MODE (VFS behavior)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --vfs-cache-mode off \              # No caching (always fetch remote)
  gdrive:

rclone serve webdav \
  --vfs-cache-mode minimal \          # Cache open files only
  gdrive:

rclone serve webdav \
  --vfs-cache-mode writes \           # Cache writes until upload
  gdrive:

rclone serve webdav \
  --vfs-cache-mode full \             # Cache everything (best for performance)
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --vfs-cache-mode full \             # Always cache blocks (blocks are small)
  --vfs-cache-max-size 50G \          # Max cache size for all blocks
  --db ~/.chronex/chronex.db

# Meaning for Chronex blocks:
# ├─ Cache mode = "full"
# │  ├─ All blocks cached locally during serve
# │  ├─ Reduces network requests
# │  ├─ Speeds up Obsidian access
# │  └─ Updates synced back on interval
# │
# └─ Cache size = "50G"
#    ├─ Maximum disk space for cache
#    ├─ Typical case: ~100k blocks = 500MB
#    ├─ So 50G is safe for very large notebooks
#    └─ Older blocks evicted when limit reached


# 2. CACHE MAXIMUM SIZE
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --vfs-cache-mode full \
  --vfs-cache-max-size 10G \          # 10GB cache limit
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --vfs-cache-mode full \
  --vfs-cache-max-size 50G             # Blocks cache limit
  --db ~/.chronex/chronex.db

# For Chronex use case:
# ├─ Personal (10k blocks):     ~100 MB needed, set 1G
# ├─ Professional (100k blocks): ~1 GB needed, set 10G
# ├─ Enterprise (1M blocks):     ~10 GB needed, set 50G
# └─ Calculation: 1 block ≈ 10KB avg


# 3. CACHE POLL INTERVAL (how often check for remote changes)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --vfs-cache-mode full \
  --vfs-cache-poll-interval 1m \      # Check remote every 1 minute
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --vfs-cache-mode full \
  --vfs-cache-poll-interval 5m \      # Check remote every 5 minutes
  --db ~/.chronex/chronex.db

# Meaning for Chronex:
# ├─ Poll interval = "5m"
# │  ├─ Server checks remote (Nextcloud) every 5 minutes
# │  ├─ Pulls new blocks from other devices
# │  ├─ Updates local cache
# │  ├─ Broadcasts to connected clients (Obsidian, etc.)
# │  └─ Balances freshness vs network load
# │
# └─ Tuning:
#    ├─ 1m: Fresh but chatty (more network)
#    ├─ 5m: Balanced (recommended)
#    ├─ 10m: Less fresh but efficient
#    └─ 30m: Very efficient, may be stale


# 4. READ-ONLY MODE (safety)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --read-only \                       # Prevent modifications via WebDAV
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --read-only \                       # Serve as read-only to clients
  --db ~/.chronex/chronex.db

# Use case:
# ├─ Read-only share to external users
# ├─ Prevent accidental deletions
# ├─ Public notebook sharing
# └─ Archive/historical versions
```

### 3.3 WebDAV-Specific Options

```bash
# ============================================================================
# WEBDAV BEHAVIOR                     │ CHRONEX ADAPTATION
# ============================================================================

# 1. ETAG HASH (for If-Match conditional requests)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --etag-hash MD5 \                   # MD5 hash of file content
  gdrive:

rclone serve webdav \
  --etag-hash SHA1 \                  # SHA1 hash
  gdrive:

rclone serve webdav \
  --etag-hash auto \                  # Auto-detect best algorithm
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --etag-hash FastCDC \               # Use FastCDC for better chunking
  --db ~/.chronex/chronex.db

# Why FastCDC for Chronex?
# ├─ Blocks change often (edits, formatting)
# ├─ FastCDC chunk boundaries stable across edits
# ├─ Less false conflicts
# ├─ Better for sync detection
# └─ More efficient than MD5 for our use case

# ETag usage:
# ├─ Obsidian sends: If-Match: "abc123"
# ├─ Server checks: Is current ETag == "abc123"?
# ├─ If match: Allow update
# ├─ If no match: Return 412 Precondition Failed (conflict!)
# └─ Chronex resolves via vector clocks


# 2. DISABLE DIRECTORY LISTING (security)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --disable-dir-list \                # Don't return HTML directory listing
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --disable-dir-list \                # Don't expose block structure
  --db ~/.chronex/chronex.db

# Why disable for Chronex?
# ├─ Prevents enumeration of all blocks
# ├─ Clients must know path (Obsidian does)
# ├─ Improves security for shared notebooks
# ├─ Reduces information leakage
# └─ Cleaner experience (no HTML page)


# 3. DISABLE ZIP DOWNLOADS (resource limiting)
# ─────────────────────────────────────────────────────────────────────────
rclone serve webdav \
  --disable-zip \                     # Don't create .zip of directories
  gdrive:

# Chronex adaptation:
chronex serve webdav \
  --disable-zip \                     # Don't allow bulk block downloads
  --db ~/.chronex/chronex.db

# Why disable for Chronex?
# ├─ Prevents users downloading entire database as .zip
# ├─ Reduces CPU/memory usage
# ├─ Discourages bulk exports without auth
# ├─ Forces deliberate export (users choose format)
# └─ Better for resource-constrained servers
```

---

## 4. CHRONEX CLIENT MODE: Pulling from Remote

### 4.1 Connecting to Remote Servers

```bash
# ============================================================================
# SYNC FROM REMOTE WEBDAV SERVER TO LOCAL CHRONEX
# ============================================================================

# Config: ~/.chronex/chronex.toml
[client]
remote_type = "webdav"                      # Type of remote
remote_url = "https://nextcloud.example.com/remote.php/webdav"
remote_user = "alice"
remote_pass = "secret"
remote_path = "/Notes/"                     # Folder in remote to sync

local_db = "~/.chronex/chronex.db"          # Local SQLite
local_vault = "~/Chronex/"                  # Local vault directory

# Sync behavior
sync_interval = "5m"                        # Poll remote every 5 minutes
conflict_strategy = "vector_clock"          # Use vector clocks to resolve
sync_direction = "bidirectional"            # Can push changes back

# Encryption (optional)
encryption_key = "..."                      # Master key for E2EE


# ============================================================================
# COMMAND LINE
# ============================================================================

# 1. INITIAL SYNC (pull all blocks)
chronex sync pull \
    --remote nextcloud \
    --remote-url https://nextcloud.example.com/remote.php/webdav \
    --remote-user alice \
    --remote-pass secret

# ✅ Pulls all blocks from Nextcloud
# ✅ Stores in local SQLite
# ✅ Creates local .md files (optional)
# ✅ Ready for editing

# 2. CONTINUOUS SYNC (bidirectional)
chronex sync daemon \
    --remote nextcloud \
    --interval 5m \
    --conflict-strategy vector_clock

# ✅ Runs in background
# ✅ Polls remote every 5 minutes
# ✅ Pushes local changes
# ✅ Pulls remote changes
# ✅ Resolves conflicts automatically

# 3. SYNC TO OBSIDIAN VAULT (export)
chronex sync export \
    --format markdown \
    --output ~/ObsidianVault/

# ✅ Exports blocks as .md files
# ✅ Maintains hierarchy (folders/subfolders)
# ✅ Includes metadata (tags, created_at)
# ✅ Links between blocks preserved
```

### 4.2 Supported Remote Types

```toml
# Chronex can pull from multiple remote types:

# WebDAV (Nextcloud, ownCloud, generic)
[client.remote]
type = "webdav"
url = "https://nextcloud.example.com/remote.php/webdav"
user = "alice"
pass = "secret"

# S3 (AWS, MinIO, etc.)
[client.remote]
type = "s3"
bucket = "chronex-backup"
region = "us-east-1"
access_key = "..."
secret_key = "..."

# Dropbox
[client.remote]
type = "dropbox"
token = "..."

# OneDrive
[client.remote]
type = "onedrive"
token = "..."

# HTTP (read-only)
[client.remote]
type = "http"
url = "https://api.example.com/notebooks/"

# Local filesystem (USB, mounted NAS)
[client.remote]
type = "local"
path = "/mnt/usb/chronex/"

# Git repository (version control)
[client.remote]
type = "git"
url = "https://github.com/user/chronex-notes.git"
branch = "main"
```

---

## 5. CHRONEX SERVER MODE: Serving to Clients

### 5.1 Complete Server Configuration

```toml
# ~/.chronex/chronex.toml
[server]
# HTTP/HTTPS
addr = "0.0.0.0:443"
cert = "/etc/letsencrypt/live/chronex.io/fullchain.pem"
key = "/etc/letsencrypt/live/chronex.io/privkey.pem"

# Database
db = "~/.chronex/chronex.db"
vault = "~/Chronex/"

# Authentication
htpasswd = "/etc/chronex/users.htpasswd"    # File-based (simple)
# OR
auth_type = "jwt"                           # JWT tokens (advanced)
jwt_secret = "..."

# VFS & Caching
vfs_cache_mode = "full"                     # full|writes|minimal|off
vfs_cache_max_size = "50G"
vfs_cache_poll_interval = "5m"

# WebDAV Options
etag_hash = "fastcdc"                       # fastcdc|md5|sha1
disable_dir_list = true
disable_zip = true
max_header_bytes = 16384

# Read-only (optional)
read_only = false

# TLS/HTTPS
min_tls_version = "1.2"
cipher_suites = [...]                       # Strong ciphers

# Rate limiting
rate_limit = "100 req/s per IP"

# Logging
log_level = "info"
log_file = "/var/log/chronex/server.log"
```

### 5.2 Running Chronex Server

```bash
# ============================================================================
# START SERVER
# ============================================================================

# 1. SIMPLE (localhost only, for testing)
chronex serve webdav \
    --addr 127.0.0.1:8080 \
    --db ~/.chronex/chronex.db \
    --user alice \
    --pass secret

# ✅ Chronex serves blocks via WebDAV
# ✅ Available at http://127.0.0.1:8080/
# ✅ Obsidian can connect via WebDAV plugin


# 2. PRODUCTION (all interfaces, HTTPS, users file)
chronex serve webdav \
    --addr 0.0.0.0:443 \
    --cert /etc/letsencrypt/live/chronex.io/fullchain.pem \
    --key /etc/letsencrypt/live/chronex.io/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 50G \
    --vfs-cache-poll-interval 5m \
    --etag-hash fastcdc \
    --disable-dir-list \
    --disable-zip \
    --db ~/.chronex/chronex.db

# ✅ HTTPS enabled (secure)
# ✅ Multiple users (htpasswd)
# ✅ Full caching (fast)
# ✅ Production-ready


# 3. WITH DOCKER (cloud deployment)
docker run -d \
    --name chronex-server \
    --restart always \
    -p 443:443 \
    -v ~/.chronex:/data \
    -v /etc/letsencrypt:/certs:ro \
    chronex-server:latest \
    serve webdav \
        --addr 0.0.0.0:443 \
        --cert /certs/live/chronex.io/fullchain.pem \
        --key /certs/live/chronex.io/privkey.pem \
        --htpasswd /data/users.htpasswd \
        --vfs-cache-mode full \
        --vfs-cache-max-size 50G \
        --db /data/chronex.db

# ✅ Runs in container
# ✅ Persistent storage
# ✅ Automatic restart
# ✅ Easy deployment
```

### 5.3 Client Connection (Obsidian)

```
Obsidian WebDAV Plugin:
├─ URL: https://chronex.example.com:443/
├─ Username: alice
├─ Password: secret
└─ ✅ Obsidian now syncs with Chronex!

Access in Chronex:
├─ Blocks appear as folders/files
├─ Example: Notebook/ → Notes/
├─ Example: Block → file.md
├─ Edits sync via WebDAV
└─ Changes reflected in Chronex server
```

---

## 6. CHRONEX VFS: Blocks ↔ Filesystem Translation

### 6.1 How Blocks Map to WebDAV Paths

```
CHRONEX DATABASE:
┌─────────────────────────────────────────┐
│ Notebooks (folders)                    │
├─────────────────────────────────────────┤
│ notebook_id: "abc123"                   │
│ name: "My Vault"                        │
│ path: "/My Vault"                       │
│ ├─ Blocks (files)                       │
│ │  ├─ block_id: "xyz789"                │
│ │  │  title: "First Note"               │
│ │  │  content: "Lorem ipsum..."         │
│ │  │  path: "/My Vault/First Note.md"   │
│ │  │                                    │
│ │  └─ block_id: "def456"                │
│ │     title: "Second Note"              │
│ │     content: "Dolor sit amet..."      │
│ │     path: "/My Vault/Second Note.md"  │
│ │                                       │
│ └─ Sub-Notebooks (folders)              │
│    └─ notebook_id: "sub123"             │
│       name: "Subfolder"                 │
│       path: "/My Vault/Subfolder"       │
│       ├─ block_id: "abc999"             │
│       │  path: "/My Vault/Subfolder/... │
│       │                                 │
│       └─ [more blocks]                  │
│                                         │
└─────────────────────────────────────────┘

WEBDAV VIEW (via VFS):
/
├─ My Vault/
│  ├─ First Note.md (← block_id: xyz789)
│  ├─ Second Note.md (← block_id: def456)
│  └─ Subfolder/
│     ├─ Deep Note.md (← block_id: abc999)
│     └─ [more blocks]
│
└─ [other notebooks]

Obsidian sees WebDAV as standard filesystem!
```

### 6.2 VFS Operations

```go
// Chronex VFS implementation (pseudo-code)

// GET request: Obsidian reads block
GET /My Vault/First Note.md
├─ VFS translates path → block_id: "xyz789"
├─ Loads block from SQLite
├─ Decrypts content (if E2EE enabled)
├─ Returns file content
└─ HTTP 200 OK

// WebDAV PROPFIND: Obsidian lists notebook
PROPFIND /My Vault/
├─ VFS queries: SELECT * FROM blocks WHERE notebook_id='abc123'
├─ Returns as directory listing
├─ Properties: size, modtime, etag
└─ HTTP 207 Multi-Status

// PUT request: Obsidian writes block
PUT /My Vault/First Note.md
├─ VFS translates path → block_id: "xyz789"
├─ Reads If-Match header (ETag for conflict detection)
├─ Checks: Is current ETag == If-Match?
├─ If YES: Update allowed
│  ├─ Decrypt old content
│  ├─ Compute diff
│  ├─ Create sync operation (vector clock increment)
│  ├─ Encrypt new content
│  ├─ Save to SQLite
│  ├─ Update ETag
│  └─ Return 204 No Content
├─ If NO: Conflict!
│  ├─ Consult vector clocks
│  ├─ Merge if possible (3-way merge)
│  ├─ Or return 412 Precondition Failed
│  └─ Client handles conflict

// DELETE request: Obsidian deletes block
DELETE /My Vault/First Note.md
├─ VFS translates path → block_id: "xyz789"
├─ Soft delete: Set deleted_at = NOW()
├─ Create sync operation
├─ Return 204 No Content
└─ Block still in DB (soft delete, recoverable)
```

---

## 7. CHRONEX SYNC: Vector Clocks + Conflict Resolution

### 7.1 Multi-Device Sync with Vector Clocks

```
SCENARIO: Two devices editing same block

Device A (Desktop):
├─ Block: "My Note"
├─ Content: "Version A"
├─ Vector Clock: {desktop: 1, tablet: 0}
└─ Timestamp: 2026-04-13 10:00:00

Device B (Tablet):
├─ Block: "My Note"
├─ Content: "Version B"
├─ Vector Clock: {desktop: 0, tablet: 1}
└─ Timestamp: 2026-04-13 10:00:00

Chronex Sync:
├─ Desktop pushes: {desktop: 1, tablet: 0} → "Version A"
├─ Tablet pushes: {desktop: 0, tablet: 1} → "Version B"
├─ Server receives both (happened concurrently!)
├─ Vector clocks show: Neither causally before other
├─ CONFLICT DETECTED!
│
├─ Resolution options:
│  ├─ 3-way merge (if possible)
│  ├─ Last-write-wins (≈ tablet won)
│  ├─ Manual merge (user chooses)
│  └─ Keep both versions (branches)
│
└─ Result: Conflict marked, user notified
   Obsidian shows: "[CONFLICT] My Note"
```

### 7.2 Sync over WebDAV

```
FLOW:

1. Desktop Chronex edits block locally
   ├─ Updates SQLite
   ├─ Increments vector clock: {desktop: 2, tablet: 0}
   ├─ Creates sync_operation entry
   └─ Ready to serve via WebDAV

2. Tablet Obsidian (via WebDAV server) reads block
   ├─ Connects to Desktop Chronex WebDAV server
   ├─ Downloads: /My Vault/My Note.md
   ├─ Gets ETag from server
   ├─ Displays in Obsidian
   └─ Ready to edit

3. Tablet edits block in Obsidian
   ├─ Sends PUT request to WebDAV server
   ├─ Server checks: If-Match header
   ├─ Server consults vector clocks
   ├─ Server checks: Is desktop ahead?
   ├─ If desktop ahead (desktop: 2, tablet: 0)
   │  ├─ CONFLICT: Tablet trying to write old version!
   │  ├─ Server returns 412 Precondition Failed
   │  ├─ Obsidian must fetch latest first
   │  └─ Tablet re-fetches latest version
   ├─ Server merges changes
   ├─ Updates SQLite with merged content
   └─ Updates vector clock

4. If both sync to Nextcloud (v1.5+)
   ├─ Desktop pushes: {desktop: 2, tablet: 0} → version
   ├─ Tablet pushes: {desktop: 2, tablet: 1} → version
   ├─ Nextcloud resolves conflicts
   ├─ Distributes final version
   └─ Both devices converge to same state

RESULT:
└─ All devices eventually consistent
   Same content across Desktop, Tablet, Server
```

---

## 8. CONFIGURATION & DEPLOYMENT SCENARIOS

### 8.1 Personal Use (Desktop Server)

```bash
# User has desktop, wants to sync with tablet + Obsidian

# Desktop setup
chronex serve webdav \
    --addr 192.168.1.100:8080 \
    --db ~/.chronex/chronex.db \
    --user alice \
    --pass secret123 \
    --vfs-cache-mode full \
    --disable-zip

# Obsidian tablet setup
# WebDAV plugin:
# URL: http://192.168.1.100:8080/
# User: alice
# Pass: secret123

✅ Desktop serves blocks
✅ Tablet syncs via WebDAV
✅ No cloud needed
✅ Private, fast, local
```

### 8.2 Privacy-First Multi-Device

```bash
# Desktop (Server)
chronex serve webdav \
    --addr 0.0.0.0:443 \
    --cert /certs/fullchain.pem \
    --key /certs/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --db ~/.chronex/chronex.db

# Desktop (Client) - sync to Nextcloud
chronex sync daemon \
    --remote nextcloud \
    --remote-url https://nextcloud.example.com/remote.php/webdav \
    --remote-user alice \
    --remote-pass secret \
    --interval 5m \
    --conflict-strategy vector_clock

# Tablet: Connect to Desktop WebDAV
# OR Connect to Nextcloud WebDAV

✅ End-to-end encryption
✅ No data in third-party cloud
✅ Desktop is bridge to cloud
✅ Fully private
```

### 8.3 Knowledge Base Server (Corporate)

```bash
# Company Chronex Server
chronex serve webdav \
    --addr chronex.company.com:443 \
    --cert /certs/company/fullchain.pem \
    --key /certs/company/privkey.pem \
    --htpasswd /etc/chronex/employees.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 100G \
    --vfs-cache-poll-interval 5m \
    --etag-hash fastcdc \
    --disable-dir-list \
    --disable-zip \
    --db /var/chronex/chronex.db \
    --read-only false \
    --rate-limit "1000 req/s"

✅ Multiple employees access
✅ Central knowledge base
✅ Real-time sync
✅ No external cloud
✅ Full encryption
✅ Audit logs
```

---

## 9. TECHNOLOGY STACK

### 9.1 Backend Implementation

```go
// Chronex core: Written in Go (like Rclone)

import (
    "golang.org/x/net/webdav"              // WebDAV server
    "github.com/mattn/go-sqlite3"           // SQLite3
    "github.com/lib/pq"                     // PostgreSQL (optional)
    "github.com/golang-jwt/jwt/v5"          // JWT auth
    "github.com/ncw/rclone"                 // Rclone sync libraries
)

// WebDAV server
webdavHandler := &webdav.Handler{
    FileSystem: &ChronexVFS{db: sqliteDB},
    LockSystem: webdav.NewMemLS(),
}

// VFS translates blocks to filesystem
type ChronexVFS struct {
    db *sql.DB
    cache *BlockCache
    vectorClocks map[string]Clock
}

// Core operations
func (vfs *ChronexVFS) Open(path string) (http.File, error) {
    // Translate path → block_id
    // Load from SQLite
    // Decrypt content
    // Return as http.File
}

func (vfs *ChronexVFS) Stat(path string) (os.FileInfo, error) {
    // Get block metadata
    // Return as FileInfo (size, modtime, mode)
}

func (vfs *ChronexVFS) RemoveAll(path string) error {
    // Soft delete block
    // Record sync operation
}
```

### 9.2 Frontend (Optional)

```
No required frontend for v1.0:
├─ Clients use WebDAV (Obsidian, WinSCP, Finder, etc.)
├─ No custom UI needed

Optional admin UI (v1.5+):
├─ Dashboard (statistics, activity)
├─ User management
├─ Conflict resolution UI
├─ Sync monitoring
└─ Written in TypeScript/React (optional)
```

### 9.3 Database Schema

```sql
-- Core tables
CREATE TABLE notebooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT UNIQUE,
    created_at INTEGER,
    updated_at INTEGER,
    deleted_at INTEGER
);

CREATE TABLE blocks (
    id TEXT PRIMARY KEY,
    notebook_id TEXT REFERENCES notebooks(id),
    title TEXT,
    content TEXT,          -- Encrypted
    metadata JSONB,
    created_at INTEGER,
    updated_at INTEGER,
    deleted_at INTEGER,
    vector_clock JSONB     -- {device_id: logical_clock}
);

CREATE TABLE sync_operations (
    id TEXT PRIMARY KEY,
    block_id TEXT REFERENCES blocks(id),
    device_id TEXT,
    operation TEXT,        -- 'create', 'update', 'delete'
    timestamp INTEGER,
    vector_clock JSONB,
    change_delta JSONB
);

CREATE TABLE etag (
    block_id TEXT PRIMARY KEY REFERENCES blocks(id),
    etag TEXT,             -- FastCDC hash
    updated_at INTEGER
);

-- Indexes
CREATE INDEX idx_blocks_notebook ON blocks(notebook_id);
CREATE INDEX idx_sync_operations_timestamp ON sync_operations(timestamp);
```

---

## 10. SUMMARY: CHRONEX = RCLONE FOR BLOCKS

```
Chronex Architecture:

1. FOUNDATION
   ├─ Language: Go (like Rclone)
   ├─ Protocol: WebDAV (standard, universal)
   ├─ Database: SQLite (local) + PostgreSQL (optional)
   └─ VFS: Blocks ↔ Filesystem translation

2. DUAL-MODE
   ├─ CLIENT: Pull from remote servers
   │  ├─ Nextcloud, S3, Dropbox, WebDAV, etc.
   │  ├─ Sync to local Chronex
   │  └─ Edit locally or push back
   │
   └─ SERVER: Serve blocks via WebDAV
      ├─ Obsidian connects
      ├─ External clients access
      └─ Real-time sync

3. FEATURES
   ├─ Vector clocks (conflict resolution)
   ├─ Soft deletes (recovery)
   ├─ E2EE (optional)
   ├─ Multi-device sync
   ├─ Cache strategies (like Rclone)
   ├─ ETag/If-Match (WebDAV standard)
   └─ Authentication (JWT, htpasswd)

4. USE CASES
   ├─ Desktop → Tablet sync (WebDAV)
   ├─ Desktop ↔ Nextcloud sync (client mode)
   ├─ Obsidian + Chronex seamless
   ├─ Corporate knowledge base
   └─ Privacy-first multi-device

5. DEPLOYMENT
   ├─ Docker ready
   ├─ Kubernetes ready
   ├─ Binary single executable
   ├─ No external dependencies
   └─ Scales to millions of blocks

WHY THIS ARCHITECTURE?
└─ Rclone proven for 15+ years
   WebDAV proven for 20+ years
   Simple, universal, robust
   No proprietary protocol
   Interoperable with everything
```

---

**Document Status**: WebDAV Dual-Mode Architecture Complete  
**Implementation**: Go + Rclone pattern + WebDAV protocol  
**Not TypeScript**: This is simpler, faster, more like Rclone  
**Production Ready**: Proven architecture from Rclone + WebDAV standard
