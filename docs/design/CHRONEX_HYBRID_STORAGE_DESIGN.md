# CHRONEX Hybrid Storage Design

**Design Document Version**: 2.0 (UPDATED to WebDAV + Go)  
**Date**: 2026-04-13  
**Status**: Approved for v1.0  
**References**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md, CHRONEX_API_DESIGN.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **UPDATED** to reflect Go + WebDAV architecture:

**OLD (Pre-correction)**:
- ❌ NestJS backend references
- ❌ POST /api/blocks REST endpoints
- ❌ Custom sync protocol

**NEW (Official)**:
- ✅ Go WebDAV server (golang.org/x/net/webdav)
- ✅ WebDAV PUT/GET/DELETE operations
- ✅ Vector clocks + 3-way merge (unchanged)
- ✅ SQLite local + PostgreSQL optional (unchanged)

---

## 1. STORAGE ARCHITECTURE OVERVIEW

### 1.1 Design Philosophy

```
CHRONEX Storage = SiYuan's instant local operations 
                + Joplin's multi-device consistency
                + Rclone's reliable sync via WebDAV

Key Principle: "Optimize for the common case, handle edge cases gracefully"

Backend: Go + WebDAV protocol (RFC 4918)
├─ No TypeScript/NestJS complexity
├─ Follows Rclone serve webdav pattern
└─ Universal client support (Obsidian, WinSCP, Finder, etc.)
```

### 1.2 Two-Tier Storage Model

```
TIER 1: LOCAL (SQLite)
├─ Primary: User's device
├─ Purpose: Instant operations (<100ms)
├─ Scope: Full blocktree + metadata
├─ Consistency: Immediately persistent
├─ Encryption: Per-block E2EE (AES-256-GCM)
└─ Replicated to: Tier 2 (async via WebDAV)

TIER 2: REMOTE (PostgreSQL, optional)
├─ Primary: Chronex server (if sync enabled)
├─ Purpose: Multi-device sync + backup
├─ Scope: Same blocktree as Tier 1
├─ Consistency: Eventually consistent
├─ Encryption: Server stores ciphertext only
├─ Protocol: WebDAV (PUT/GET/DELETE)
└─ Availability: Handles offline mode

Access via: WebDAV Protocol (RFC 4918)
├─ VFS translates: Blocks ↔ Filesystem paths
├─ HTTP Methods: GET, PUT, DELETE, PROPFIND
├─ Conflict detection: ETag + If-Match headers
├─ Vector clocks: Track causality across devices
└─ 3-way merge: Resolve conflicts automatically
```

---

## 2. LOCAL STORAGE DESIGN (SQLITE)

### 2.1 Database Schema

```sql
-- BLOCKS TABLE (core data)
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,                    -- UUID v4
  parent_id TEXT,                         -- FK to blocks.id
  root_id TEXT,                           -- FK to notebooks.id
  content_encrypted BLOB,                 -- AES-256-GCM encrypted
  content_iv BLOB,                        -- 96-bit nonce
  content_tag BLOB,                       -- 128-bit auth tag
  
  type TEXT,                              -- 'heading', 'paragraph', 'list', etc.
  
  -- Metadata (NOT encrypted, allows server-side search)
  title TEXT,                             -- First 200 chars of content (plaintext)
  created_at INTEGER,                     -- Unix timestamp (ms)
  updated_at INTEGER,                     -- Unix timestamp (ms)
  updated_by TEXT,                        -- User ID (for multi-device)
  
  -- Versioning
  version_vector TEXT,                    -- JSON: {device_id: clock}
  
  -- Sync status
  sync_status TEXT,                       -- 'pending', 'synced', 'conflict'
  sync_version INTEGER,                   -- Server version (for reconciliation)
  
  -- Indices
  is_deleted INTEGER DEFAULT 0,           -- Soft delete (for recovery)
  sort_order REAL,                        -- Fractional positioning (like Notion)
  
  FOREIGN KEY (parent_id) REFERENCES blocks(id),
  FOREIGN KEY (root_id) REFERENCES notebooks(id)
);

-- NOTEBOOKS TABLE (top-level containers)
CREATE TABLE notebooks (
  id TEXT PRIMARY KEY,                    -- UUID v4
  name TEXT,                              -- Plaintext (allows search)
  description TEXT,
  
  created_at INTEGER,
  updated_at INTEGER,
  
  -- Encryption metadata
  encrypted_key BLOB,                     -- Master key encrypted with password
  
  is_deleted INTEGER DEFAULT 0,
  sort_order REAL
);

-- SYNC_QUEUE TABLE (pending changes)
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id TEXT,                          -- FK to blocks.id
  operation TEXT,                         -- 'create', 'update', 'delete'
  payload_encrypted BLOB,                 -- Full block data (for recovery)
  
  created_at INTEGER,
  status TEXT,                            -- 'pending', 'sent', 'acked'
  
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- METADATA TABLE (app-level configuration)
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT,                             -- JSON if complex
  updated_at INTEGER
);

-- INDICES for performance
CREATE INDEX idx_blocks_parent_id ON blocks(parent_id);
CREATE INDEX idx_blocks_root_id ON blocks(root_id);
CREATE INDEX idx_blocks_updated_at ON blocks(updated_at);
CREATE INDEX idx_blocks_user_updated ON blocks(root_id, updated_at);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_blocks_title_fts ON blocks(title);  -- For full-text search

-- FULL-TEXT SEARCH (FTS5)
CREATE VIRTUAL TABLE blocks_fts USING fts5(
  title,
  content_preview,
  block_id UNINDEXED,
  content='blocks',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER blocks_ai AFTER INSERT ON blocks BEGIN
  INSERT INTO blocks_fts(rowid, title, content_preview, block_id)
  VALUES (new.rowid, new.title, substr(new.title, 1, 200), new.id);
END;

CREATE TRIGGER blocks_ad AFTER DELETE ON blocks BEGIN
  INSERT INTO blocks_fts(blocks_fts, rowid, title, content_preview, block_id)
  VALUES('delete', old.rowid, old.title, substr(old.title, 1, 200), old.id);
END;

CREATE TRIGGER blocks_au AFTER UPDATE ON blocks BEGIN
  INSERT INTO blocks_fts(blocks_fts, rowid, title, content_preview, block_id)
  VALUES('delete', old.rowid, old.title, substr(old.title, 1, 200), old.id);
  INSERT INTO blocks_fts(rowid, title, content_preview, block_id)
  VALUES (new.rowid, new.title, substr(new.title, 1, 200), new.id);
END;
```

### 2.2 Storage Layout on Disk

```
~/.chronex/
├─ data/
│  ├─ chronex.db                         -- Main SQLite database
│  ├─ chronex.db-wal                     -- Write-ahead log
│  ├─ chronex.db-shm                     -- Shared memory (WAL)
│  │
│  └─ attachments/
│     ├─ {block_id}/
│     │  ├─ image_001.jpg
│     │  └─ document_001.pdf
│     └─ ...
│
├─ config/
│  ├─ app_config.json                    -- UI preferences
│  ├─ sync_config.json                   -- Sync settings (server URL, etc.)
│  └─ device_id                          -- Unique device identifier (plaintext)
│
└─ cache/
   ├─ search_results.db                  -- FTS cache (can be cleared)
   └─ thumbnails/                        -- Attachment thumbnails
```

### 2.3 SQLite Configuration (Performance)

```bash
-- pragmas.sql (applied on database open)

-- Write-ahead logging (better concurrency)
PRAGMA journal_mode = WAL;

-- Sync level (balance between durability and speed)
PRAGMA synchronous = NORMAL;  -- Not FULL (safer) or OFF (faster)

-- Cache size (pages in memory)
PRAGMA cache_size = 20000;     -- ~80MB cache (tuned for 100k blocks)

-- Temporary storage (faster operations)
PRAGMA temp_store = MEMORY;

-- Foreign key enforcement
PRAGMA foreign_keys = ON;

-- Memory-mapped I/O (better performance on large databases)
PRAGMA mmap_size = 30000000;   -- 30MB mapping

-- Automatic vacuum
PRAGMA auto_vacuum = INCREMENTAL;

-- Page size (balance between cache and I/O)
PRAGMA page_size = 4096;       -- Default, good for most cases
```

### 2.4 Block Content Encryption

```
Per-Block Encryption Strategy:

1. Master Key Storage:
   ├─ Generated from password: Argon2id(password, salt, time=2, memory=65536)
   ├─ Stored: Never on disk (only in RAM, derived on login)
   ├─ Per-device option: Can use device-specific key for additional security
   └─ Recovery: If forgotten, data is unrecoverable (secure by design)

2. Block Encryption:
   ├─ Algorithm: AES-256-GCM
   ├─ Key: Master key (same for all blocks)
   ├─ IV: 96-bit random per block (stored in database)
   ├─ AAD: block_id || updated_at (additional authenticated data)
   └─ Overhead: ~16 bytes (auth tag)

3. Storage Structure:
   -- Column: content_encrypted
   ├─ Format: IV (12 bytes) || Ciphertext || Auth Tag (16 bytes)
   ├─ Size: Plaintext size + 28 bytes overhead
   ├─ Example: 5KB plaintext → 5.028 KB encrypted
   └─ Encryption time: 2-5ms per block (modern CPU)

4. Decryption Process:
   ├─ On app launch: Master key derived from password
   ├─ On block load: Fetch content_encrypted from database
   ├─ Decrypt: AES-256-GCM.decrypt(master_key, content_encrypted)
   ├─ Time: <5ms per block (cached in TIER 1)
   └─ Failure: Abort block load, show error (data not corrupted)
```

---

## 3. REMOTE STORAGE DESIGN (POSTGRESQL)

### 3.1 Database Schema (Server-Side)

```sql
-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,                     -- bcryptjs (not plaintext)
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login TIMESTAMP,
  
  is_active BOOLEAN DEFAULT TRUE
);

-- NOTEBOOKS TABLE (per-user)
CREATE TABLE notebooks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  name TEXT,                              -- Plaintext (encrypted by client)
  description TEXT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  is_deleted BOOLEAN DEFAULT FALSE,
  sort_order FLOAT,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, name)
);

-- BLOCKS TABLE (per-user)
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_id UUID,
  root_id UUID,
  
  content_encrypted BYTEA,                -- Client sends encrypted
  content_iv BYTEA,                       -- Nonce
  content_tag BYTEA,                      -- Auth tag
  
  type TEXT,
  title TEXT,                             -- Plaintext (for search, but encrypted by client)
  
  -- Metadata
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID,                        -- Which device created
  updated_by UUID,                        -- Which device last updated
  
  -- Versioning
  version_vector JSONB,                   -- {device_id: logical_clock}
  
  -- Sync status (server knows)
  is_deleted BOOLEAN DEFAULT FALSE,
  sort_order FLOAT,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES blocks(id),
  FOREIGN KEY (root_id) REFERENCES notebooks(id),
  FOREIGN KEY (created_by) REFERENCES devices(id),
  FOREIGN KEY (updated_by) REFERENCES devices(id)
);

-- DEVICES TABLE (for multi-device sync)
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  name TEXT,                              -- "Alice's MacBook Pro"
  device_type TEXT,                       -- 'desktop', 'mobile', 'web'
  
  master_key_encrypted BYTEA,             -- Master key encrypted with password
  
  last_seen TIMESTAMP,
  created_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SYNC_CHANGELOG TABLE (for incremental sync)
CREATE TABLE sync_changelog (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  block_id UUID,
  operation TEXT,                         -- 'create', 'update', 'delete'
  
  created_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);

-- INDICES
CREATE INDEX idx_blocks_user_id ON blocks(user_id);
CREATE INDEX idx_blocks_updated_at ON blocks(user_id, updated_at);
CREATE INDEX idx_blocks_root_id ON blocks(root_id);
CREATE INDEX idx_sync_changelog_user_id ON sync_changelog(user_id);
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- FULL-TEXT SEARCH (PostgreSQL)
CREATE INDEX idx_blocks_title_fts ON blocks USING GIN(to_tsvector('english', title));
```

### 3.2 Server-Side Constraints

```
Important: Server NEVER decrypts block content

What server CAN do:
├─ Store ciphertext (opaque blobs)
├─ Index metadata (block IDs, timestamps)
├─ Track version vectors (for conflict detection)
├─ Handle user authentication
├─ Manage device registration
└─ Enforce access control

What server CANNOT do:
├─ Decrypt block content (no master key)
├─ Read user data
├─ Perform content-based search (E2EE limitation)
├─ Modify encrypted blocks
└─ Impersonate users (JWT requires secret key)
```

---

## 4. STORAGE OPERATION PATTERNS

### 4.1 Create Block Flow

```
User creates new block: "Learn Rust"

1. LOCAL (Immediate):
   ├─ Generate block ID: UUID v4
   ├─ Encrypt content: AES-256-GCM(master_key, "Learn Rust")
   ├─ Insert to SQLite: blocks table
   ├─ Add to sync_queue: status='pending'
   ├─ Update local tree
   ├─ Render UI
   └─ User sees block instantly (<50ms)

2. BACKGROUND (Async, via WebDAV):
   ├─ Encrypt: AES-256-GCM(master_key, full_block_data)
   ├─ PUT to WebDAV server with If-Match header
   ├─ Server path: /My%20Notebook/Learn%20Rust.md
   ├─ Server stores: INSERT into blocks table
   ├─ Server returns: 204 No Content + new ETag
   ├─ Update local: sync_queue status='synced'
   └─ Total: 200-500ms (non-blocking)

Timeline:
├─ 0-50ms: User sees block
├─ 50-100ms: Sync queue updated
├─ 100-500ms: Server confirms (via WebDAV)
└─ Result: Responsive UI + eventual durability
```

### 4.2 Update Block Flow

```
User edits block: "Learn Rust & Go"

1. LOCAL (Debounced):
   ├─ User types: Characters appear instantly
   ├─ Debounce: 1 second (wait for typing to pause)
   ├─ Update SQLite: blocks.content_encrypted
   ├─ Add to sync_queue
   └─ Total latency: 1000ms (debounce) + 50ms (local)

2. BACKGROUND (Async, Batched, via WebDAV):
   ├─ Collect changes: 1-5 minutes (configurable)
   ├─ Batch encrypt: All pending updates
   ├─ PUT to WebDAV server (one PUT per block)
   ├─ Include If-Match header (ETag for conflict detection)
   ├─ Server processes: Update with vector clocks
   ├─ On conflict (412): Perform 3-way merge
   └─ Total: 1-2 seconds (batched)

Optimization:
├─ Don't sync every keystroke (huge overhead)
├─ Batch updates (reduce network round-trips 10x)
├─ Debounce (balance responsiveness + efficiency)
├─ WebDAV If-Match prevents conflicts (optimistic locking)
└─ Result: Instant local feel + efficient sync
```

### 4.3 Delete Block Flow (Soft Delete)

```
User deletes block (with 10 children):

1. LOCAL (Immediate):
   ├─ Set is_deleted = TRUE (soft delete)
   ├─ Cascade: All children marked deleted
   ├─ UPDATE SQLite: Timestamp cascade
   ├─ Add to sync_queue
   └─ UI: Hide deleted blocks immediately

2. BACKGROUND (Async, via WebDAV):
   ├─ Batch with other changes: 1-5 minutes
   ├─ DELETE /My%20Notebook/Learn%20Rust.md (WebDAV)
   ├─ Server marks: is_deleted=TRUE (soft delete)
   ├─ Result: Consistent across devices
   └─ Note: Block remains in database (recoverable)

3. RECOVERY (If needed):
   ├─ Server keeps deleted blocks: 30 days
   ├─ User can restore: FROM recycle bin
   ├─ Restore: PUT block back (with is_deleted=FALSE)
   └─ Total: Zero data loss, recycle bin support
```

---

## 5. SCALABILITY BOUNDARIES

### 5.1 SQLite Local Limits

```
Blocks per database:
├─ Optimal: 10,000 blocks
├─ Acceptable: 50,000 blocks
├─ Slow: 100,000 blocks
│  └─ Queries: 500-1000ms (linear scan)
│  └─ Solution: Migrate to PostgreSQL or split database
├─ Broken: >500,000 blocks
│  └─ Not recommended (requires partitioning)
└─ Typical user: 5,000-20,000 blocks

When to recommend upgrade:
├─ App launch time: >5 seconds
├─ Search time: >2 seconds
├─ Database size: >1 GB
└─ Solution: Offer archive feature or v2.0 migration
```

### 5.2 PostgreSQL Server Limits

```
Blocks per user:
├─ Optimal: 100,000 blocks
├─ Acceptable: 1,000,000 blocks
├─ Slow: 10,000,000+ blocks
│  └─ Solution: Sharding by user or notebook
└─ Current design: Single table (single shard)

Concurrent users:
├─ Single PostgreSQL: 500-1000 users
├─ With replication: 2000-5000 users
├─ With sharding: >10,000 users
└─ v1.0 scope: <100 concurrent users acceptable

When to scale:
├─ Database CPU: >70% sustained
├─ Query latency P99: >500ms
├─ Connection pool: >80% saturated
└─ Solution: Read replicas → Sharding
```

---

## 6. DATA CONSISTENCY MODELS

### 6.1 Eventual Consistency

```
Chronex follows "eventual consistency" for multi-device sync:

Timeline of consistency:

Local Device (Consistent immediately):
├─ t=0: User creates block in app
├─ t=0+50ms: Block visible in UI
├─ t=0+100ms: Block in local database
└─ Status: CONSISTENT

Server (Eventual consistency):
├─ t=0+200ms: Block encrypted + sent to server
├─ t=0+500ms: Server stores block
├─ t=0+600ms: Server confirms to client
└─ Status: Eventually consistent

Other Devices (Eventual consistency):
├─ t=5min: Next sync check
├─ t=5min+500ms: Download changes
├─ t=5min+800ms: Decrypt + merge locally
└─ Status: Consistent with server (no longer consistent with other devices until they sync)

Conflict Example:
├─ Device A: Edits paragraph at 10:00:00
├─ Device B: Edits same paragraph at 10:00:01
├─ Server: Receives both (stores with version vectors)
├─ Merge: 3-way merge detects conflict
└─ Result: User notified, must resolve manually
```

### 6.2 Consistency Guarantees

```
CHRONEX Guarantees:

1. Local Consistency (Strong):
   ├─ Write is immediately visible on same device
   ├─ No risk of losing local data
   └─ SLA: 100% consistency

2. Multi-Device Consistency (Eventually):
   ├─ After sync, all devices see same data
   ├─ Sync frequency: 5 minutes (configurable)
   ├─ Offline updates: Queued and sent when online
   └─ SLA: 99% consistency within 10 minutes

3. Server Consistency (Strong):
   ├─ Server sees exactly what clients sent
   ├─ No data loss in transit (E2EE prevents tampering)
   ├─ Version vectors track causality
   └─ SLA: 100% durability (with backups)
```

---

## 7. IMPLEMENTATION ROADMAP

### 7.1 Phase 1 (v1.0): Local-First with Optional Sync

```
SQLite local database: COMPLETE
├─ Schema: blocks, notebooks, metadata tables
├─ Encryption: Per-block AES-256-GCM
├─ Sync queue: Pending changes tracking
└─ Full-text search: FTS5 index

Manual sync via WebDAV:
├─ Backend: Go + WebDAV server (chronex serve webdav)
├─ Client: Pulls from remote WebDAV (Nextcloud, S3-to-WebDAV, etc.)
├─ Frequency: On-demand
└─ Scope: v1.0 MVP

No server required (optional):
├─ Works completely offline
├─ No account needed
├─ Data stored locally (user has full control)
├─ Can connect to any WebDAV server (Nextcloud, etc.)
└─ Suitable for: Personal users, privacy-focused
```

### 7.2 Phase 2 (v1.5): Multi-Device Sync

```
PostgreSQL server database: NEW
├─ Schema: Extend local with user/device tracking
├─ Version vectors: Track causality across devices
├─ Changelog: For incremental sync
└─ Conflict detection: 3-way merge

Automatic sync via WebDAV: NEW
├─ Backend: Go WebDAV server
├─ Frequency: Every 5 minutes
├─ Or: On-demand (user triggered)
├─ Backoff: Exponential backoff (offline)
├─ Non-blocking: Async background sync

Multi-device support: NEW
├─ Register devices: Phone, laptop, tablet
├─ Master key exchange: Derived from password (like Joplin)
├─ Conflict resolution: Vector clocks + 3-way merge
├─ Sync protocol: WebDAV with ETag/If-Match headers
└─ Suitable for: Professional users, multiple devices
```

### 7.3 Phase 3 (v2.0): Enterprise Collaboration

```
Advanced features: FUTURE
├─ Block-level locking: Concurrent editing
├─ Real-time collab: WebSocket updates (optional)
├─ Meilisearch: Full-text search at scale (500k+ blocks)
├─ Team permissions: Share notebooks with colleagues
└─ Audit logging: Track who changed what

PostgreSQL cluster: FUTURE
├─ Replication: Read replicas for scaling
├─ Sharding: By user/notebook (1000+ users)
├─ Failover: High availability
└─ Suitable for: Teams, enterprises
```

---

## 8. MIGRATION STRATEGY

### 8.1 From Obsidian/Notion/OneNote

```
Data import:
├─ Format: Markdown (Obsidian), JSON (Notion), DOCX (OneNote)
├─ Import process: 
│  ├─ Parse source format
│  ├─ Create blocks in local SQLite
│  ├─ Encrypt with master key
│  ├─ Preserve hierarchy (Obsidian folders → notebooks)
│  └─ Estimate time: 100 blocks/second
├─ Attachments: Optional (separate import step)
└─ Compatibility: 90% (some formatting may be lost)
```

### 8.2 From Joplin

```
Migration path (since Joplin uses similar E2EE):
├─ Backup Joplin database
├─ Export notebooks as MARKDOWN
├─ Import into Chronex via bulk import
├─ Verify: Check block structure
├─ Delete: Remove Joplin data (if no longer needed)
└─ Time: <1 minute for 10k blocks
```

---

## Summary

**CHRONEX Storage Design**: Hybrid SQLite (local) + PostgreSQL (remote, optional) via WebDAV

**Key Principles**:
- ✅ Local-first: All operations <100ms
- ✅ E2EE: Per-block encryption, server never sees plaintext
- ✅ Offline-ready: Works without server
- ✅ Eventually consistent: Multi-device sync with conflict detection
- ✅ Scalable: SQLite up to 100k blocks, PostgreSQL beyond
- ✅ WebDAV protocol: Universal client support (Obsidian, WinSCP, Finder, etc.)
- ✅ Go backend: Rclone-style serve webdav command

**Protocol**:
- Format: WebDAV (RFC 4918)
- Methods: GET (read), PUT (write), DELETE (soft delete), PROPFIND (list)
- Conflict detection: ETag + If-Match headers
- Sync: Vector clocks + 3-way merge

**Performance SLOs**:
- Local create: <100ms
- Server sync: <2 seconds (batched)
- WebDAV operations: <300ms P99
- Search: <500ms (10k blocks), <1 second (100k blocks)
- Memory: <600MB (personal), <1GB (professional)

**Migration Path**:
- v1.0: SQLite only, manual WebDAV sync
- v1.5: PostgreSQL optional, automatic WebDAV sync
- v2.0: PostgreSQL enterprise, collaboration

---

**Document Status**: Updated to WebDAV + Go Architecture  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md  
**Next**: CHRONEX_CACHE_ARCHITECTURE_DESIGN.md
