# CHRONEX Cache Architecture Design

**Design Document Version**: 1.1 (Updated for WebDAV)  
**Date**: 2026-04-13  
**Status**: Approved for v1.0 (critical for performance)  
**References**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md, CHRONEX_API_DESIGN.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **UPDATED** to include WebDAV VFS cache integration:

**Added Context**:
- ✅ WebDAV VFS cache modes (full, writes, minimal, off)
- ✅ Integration with Rclone-style caching
- ✅ Block ↔ File translation caching
- ✅ Path resolution caching

**Unchanged**:
- ✅ 3-tier cache architecture (still valid)
- ✅ LRU eviction strategies (still valid)
- ✅ SQLite buffer cache (still valid)
- ✅ Encryption/decryption optimization (still valid)

---

## 1. THREE-TIER CACHE ARCHITECTURE

### 1.1 Cache Philosophy

```
From Phase A4 Analysis:
├─ SiYuan: Instant local operations (<100ms)
├─ Joplin: Real-time responsiveness (<500ms for multi-platform)
└─ CHRONEX: Both through intelligent caching

Goal: Minimize database queries while respecting memory constraints

Architecture:
TIER 1 (HOT)       TIER 2 (WARM)     TIER 3 (COLD)
├─ In-Memory        ├─ SQLite Cache    ├─ Disk Storage
├─ <5ms latency     ├─ 10-50ms         ├─ 50-500ms (SSD)
├─ 10-50 MB         ├─ 50-200 MB       ├─ Unbounded
├─ LRU eviction     ├─ OS page cache   ├─ Persistent
└─ Hot data         └─ Warm data       └─ Cold data
```

### 1.2 Cache Hierarchy

```
User requests block:

1. Check TIER 1 (Hot): <1ms
   ├─ Is block in memory? YES → Return immediately
   ├─ Is block in memory? NO → Check TIER 2

2. Check TIER 2 (Warm): 10-50ms
   ├─ Is block in SQLite buffer? YES → Load to memory
   ├─ Is block in SQLite buffer? NO → Check TIER 3

3. Check TIER 3 (Cold): 50-500ms
   ├─ Query SQLite from disk
   ├─ Block found? YES → Decrypt, load to TIER 1
   ├─ Block found? NO → 404 error

Result:
├─ Hot hit (80%): <1ms (from memory)
├─ Warm hit (15%): 10-50ms (from SQLite cache)
├─ Cold hit (5%): 100-500ms (from disk)
└─ Miss (<1%): 404 error
```

---

## 2. TIER 1: HOT CACHE (In-Memory)

### 2.1 Design

```
Purpose: Keep frequently accessed blocks in RAM for instant access

Data structure:
├─ Map<block_id, DecryptedBlock>
├─ Key: UUID block ID
├─ Value: Plaintext block data (decrypted)
└─ Thread-safe: Use sync.RWMutex (Go) or ConcurrentHashMap (Java)

Size constraints:
├─ Typical desktop: 10-50 MB
├─ Typical mobile: 5-20 MB
├─ Max: 100 MB (configurable by user)
└─ Scaling: ~200 blocks per 1 MB (varies by block size)

Eviction strategy:
├─ Algorithm: LRU (Least Recently Used)
├─ TTL: 10 minutes (blocks not accessed for 10 min → evict)
├─ When full: Evict least recently used block
└─ Deterministic: Oldest accessed first

Example (with 50 MB budget):

Memory usage:
├─ Block A (loaded 10:00): 5 KB → LRU position 1
├─ Block B (loaded 10:01): 5 KB → LRU position 2
├─ Block C (loaded 10:02): 5 KB → LRU position 3
└─ ... (continue until 50 MB full)

User accesses Block A:
├─ Found in memory: Return immediately
├─ Update LRU: Block A moves to end (most recent)
└─ Time: <1ms

User accesses Block Z (not in cache):
├─ Not found in TIER 1: Query TIER 2
├─ TIER 2 hit: Load Block Z → TIER 1
├─ TIER 1 full: Evict oldest (Block B)
└─ Result: Block Z now in TIER 1
```

### 2.2 Invalidation Strategy

```
When does data in TIER 1 become stale?

Local edit (same device):
├─ User edits Block A
├─ Update TIER 1 immediately (in-memory)
├─ Update TIER 2 (SQLite)
├─ Add to sync_queue
└─ Invalidation: Not needed (we updated it)

Remote edit (sync from server):
├─ Server has updated Block A
├─ Client downloads change during sync
├─ Replace in-memory version with new plaintext
├─ Update TIER 1 (in-memory)
├─ Update TIER 2 (SQLite)
└─ User sees latest version immediately

Conflict detected:
├─ Server and client both edited Block A
├─ Client performs 3-way merge
├─ Result: Merged plaintext
├─ Update TIER 1: New merged content
└─ User sees merged version

Explicit invalidation:
├─ User: "Reload from server"
├─ Remove Block A from TIER 1
├─ Force query TIER 2 → TIER 3
└─ Refresh to latest server version
```

### 2.3 Implementation (Go pseudocode)

```go
type Block struct {
    ID        string
    Content   string  // Plaintext (decrypted)
    Title     string
    Type      string
    UpdatedAt int64
}

type HotCache struct {
    mu       sync.RWMutex
    blocks   map[string]*Block
    lru      *list.List  // Doubly-linked list for LRU
    entries  map[string]*list.Element
    maxSize  int64  // Bytes
    curSize  int64
}

func (c *HotCache) Get(id string) (*Block, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    block, ok := c.blocks[id]
    if ok {
        // Update LRU: Move to end (most recent)
        element := c.entries[id]
        c.lru.MoveToBack(element)
    }
    return block, ok
}

func (c *HotCache) Set(id string, block *Block) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    size := int64(len(block.Content) + len(block.Title))
    
    // Make room if needed
    for c.curSize+size > int64(c.maxSize) && c.lru.Len() > 0 {
        c.evictOldest()
    }
    
    c.blocks[id] = block
    element := c.lru.PushBack(id)
    c.entries[id] = element
    c.curSize += size
}

func (c *HotCache) evictOldest() {
    if c.lru.Len() == 0 {
        return
    }
    
    element := c.lru.Front()
    id := element.Value.(string)
    
    // Remove from maps
    block := c.blocks[id]
    delete(c.blocks, id)
    delete(c.entries, id)
    c.lru.Remove(element)
    
    c.curSize -= int64(len(block.Content) + len(block.Title))
}
```

---

## 3. TIER 2: WARM CACHE (SQLite Buffer)

### 3.1 Design

```
Purpose: Cache query results from SQLite for 10-50ms access time

Mechanism:
├─ SQLite has built-in page cache (PRAGMA cache_size)
├─ Default: 2000 pages = ~8 MB
├─ Recommended: 20000 pages = ~80 MB (for 100k blocks)
├─ OS also caches: OS page cache sits on top
└─ Result: "Cache-within-a-cache"

How it works:

Query 1: SELECT content FROM blocks WHERE id = 'uuid-001'
├─ SQLite reads from disk (10-50ms)
├─ Page loaded into SQLite buffer cache
└─ Result: Row returned to application

Query 2: SELECT content FROM blocks WHERE id = 'uuid-001' (again)
├─ SQLite finds page in buffer cache (no disk I/O!)
├─ Return result from memory: <1ms
└─ Application unaware (transparent caching)

Eviction:
├─ Automatic (SQLite manages)
├─ LRU-like policy
├─ When cache full: Least used pages evicted
└─ User configurable: PRAGMA cache_size = N
```

### 3.2 SQLite Configuration for TIER 2

```sql
-- Optimize for caching and concurrent access

-- WAL mode (better concurrent reads)
PRAGMA journal_mode = WAL;

-- Large cache (80 MB for 100k blocks)
PRAGMA cache_size = 20000;  -- 20000 pages × 4KB = 80 MB

-- Memory-mapped I/O (faster reads)
PRAGMA mmap_size = 30000000;  -- 30 MB mapping

-- Temporary storage in memory
PRAGMA temp_store = MEMORY;

-- Keep pages in memory longer
PRAGMA cache_spill = OFF;  -- Don't spill to disk

-- Asynchronous mode (faster writes, eventual durability)
PRAGMA synchronous = NORMAL;  -- Not FULL

-- Foreign key enforcement
PRAGMA foreign_keys = ON;
```

### 3.3 Index Strategy

```
Indices improve cache hit rates:

CREATE INDEX idx_blocks_parent_id ON blocks(parent_id);
├─ Query: SELECT * FROM blocks WHERE parent_id = 'uuid'
├─ Without index: Full table scan → Multiple pages
├─ With index: Index lookup → 1-2 pages
└─ Result: 5-10× faster, better cache utilization

CREATE INDEX idx_blocks_updated_at ON blocks(updated_at);
├─ Query: SELECT * FROM blocks WHERE updated_at > timestamp
├─ Use case: Incremental sync (get changes since X)
└─ Result: Efficient range queries

CREATE INDEX idx_blocks_user_updated ON blocks(user_id, updated_at);
├─ Compound index (most important!)
├─ Query: SELECT * FROM blocks WHERE user_id = 'X' AND updated_at > timestamp
├─ Without index: Full scan → Many pages
├─ With index: Direct lookup → Few pages
└─ Result: 10-20× faster

Index overhead:
├─ Storage: +20% (10 indices = extra copy of data)
├─ Write time: +5-10% (need to update indices)
├─ Read time: -50-70% (faster queries)
└─ Trade-off: Worth it (reads >> writes)
```

---

## 4. TIER 3: COLD CACHE (Disk Storage)

### 4.1 Design

```
Purpose: Persistent storage on disk (SQLite database file)

Access pattern:
├─ First query: Disk I/O (10-50ms on SSD, 50-200ms on HDD)
├─ Second query: SQLite buffer cache (if page still cached)
├─ Typical: Mix of disk reads and buffer hits

File structure:
├─ Chronex.db: Main database file
├─ Chronex.db-wal: Write-ahead log
├─ Chronex.db-shm: Shared memory for WAL
└─ Size: ~1 MB per 1000 blocks (compressed)

Persistence:
├─ Data survives process crash
├─ Data survives OS crash (fsync on commit)
├─ Data survives hardware failure (if using RAID)
└─ Recovery: Automatic (WAL replay)

Scalability:
├─ SQLite: Efficient up to 100 GB
├─ For Chronex: Limit to ~50 GB (100k blocks × typical sizes)
├─ Beyond that: Consider PostgreSQL (v2.0)
└─ Typical user: 100 MB - 1 GB database
```

### 4.2 Storage Format

```
Block storage (per block):

Columns:
├─ id: TEXT (36 bytes UUID)
├─ content_encrypted: BLOB (~5 KB)
├─ content_iv: BLOB (12 bytes)
├─ content_tag: BLOB (16 bytes)
├─ type: TEXT (8 bytes)
├─ title: TEXT (200 bytes)
├─ updated_at: INTEGER (8 bytes)
└─ ... (metadata columns)

Total per block: ~5.5 KB

Example: 10,000 blocks
├─ Data size: 10,000 × 5.5 KB = 55 MB
├─ Indices (20% overhead): 11 MB
├─ Overhead (20%): 13 MB
├─ Total: ~79 MB
└─ With WAL: ~85 MB total
```

---

## 5. CACHE COHERENCY

### 5.1 Keeping Caches In Sync

```
Challenge: TIER 1, TIER 2, TIER 3 must always have consistent data

Edit Flow:

1. User edits Block A:
   ├─ Update TIER 1 (in-memory): ✅
   ├─ Update TIER 2 (SQLite): ✅
   └─ Update TIER 3 (confirm saved): ✅

2. Query Block A again:
   ├─ TIER 1 check: Found (in-memory) → Use ✅
   └─ Result: Latest version from memory

3. Sync from server (Block A also changed remotely):
   ├─ Merge: 3-way merge algorithm
   ├─ Result: Merged content
   ├─ Update TIER 1: New merged content ✅
   ├─ Update TIER 2: SQLite persist ✅
   └─ Update TIER 3: Confirm persisted ✅

4. Query Block A:
   ├─ TIER 1 check: Found (merged version) → Use ✅
   └─ Result: Latest merged version
```

### 5.2 Invalidation on Conflict

```
When 3-way merge happens:

Merge detected:
├─ Server version: Block A (from remote device)
├─ Local version: Block A (edited locally)
├─ Ancestor version: Block A (common ancestor)
└─ Result: Merged content

Cache update (must happen atomically):
1. Acquire write lock (TIER 1)
2. Update TIER 1: New merged content
3. Update TIER 2: INSERT/UPDATE to SQLite
4. Release lock
5. Mark sync complete

If partial failure:
├─ TIER 1 updated but TIER 2 failed: CORRUPTION
├─ Solution: Use transactions (atomic updates)
└─ SQLite transactions: ACID compliant
```

---

## 6. CACHE MONITORING & TUNING

### 6.1 Cache Hit Rate Metrics

```
Monitor for performance:

TIER 1 hit rate target: 80%+ (most queries served from memory)
TIER 2 hit rate target: 15%+ (SQLite buffer cache)
TIER 3 hit rate target: <5% (disk reads)

Example: 1000 queries
├─ 800 from TIER 1: <1ms each = 0.8s total
├─ 150 from TIER 2: 20ms each = 3s total
├─ 50 from TIER 3: 100ms each = 5s total
└─ Average: 9.8s / 1000 = 9.8ms per query

Measurement:

In application:
├─ Count TIER 1 hits: hits_tier1++
├─ Count misses: misses++
├─ Hit rate = hits_tier1 / (hits_tier1 + misses)
├─ Log metrics (every hour)
└─ Alert if hit rate <70% (degradation)

Too low hit rate (60%)?
├─ Increase TIER 1 size: TIER 1 likely too small
├─ Increase TIER 2 size: PRAGMA cache_size too small
└─ Solution: User can increase cache size in settings
```

### 6.2 Tuning Parameters (User-Configurable)

```
Default settings (user can tune):

TIER 1 size:
├─ Default: 50 MB
├─ Mobile: 10 MB (low memory)
├─ Desktop: 100+ MB (high memory)
└─ Setting: Preferences → Cache → Size

Eviction TTL:
├─ Default: 10 minutes
├─ Interactive use: 5 minutes (smaller dataset)
├─ Bulk operations: 30 minutes
└─ Setting: Preferences → Cache → TTL

TIER 2 (SQLite) size:
├─ Default: 20,000 pages (80 MB)
├─ Mobile: 5,000 pages (20 MB)
├─ Desktop: 50,000 pages (200 MB)
└─ Setting: Preferences → Database → Cache

Recommendation:
├─ Auto-tune based on available RAM
├─ 1 GB RAM: TIER 1 = 50 MB, TIER 2 = 80 MB (total 130 MB)
├─ 8 GB RAM: TIER 1 = 200 MB, TIER 2 = 200 MB (total 400 MB)
└─ Show current usage in preferences
```

---

## 7. SPECIAL CASES

### 7.1 Bulk Operations (Import)

```
Scenario: Import 1000 blocks from Markdown

Naive approach (would hit cache hard):
├─ Load 1000 blocks into TIER 1
├─ TIER 1 capacity: 50 MB → Can hold ~250 blocks
├─ Cache thrashing: 250 blocks in, 250 out, 250 in, 250 out
└─ Result: Cache ineffective, slow operation

Smart approach (batch processing):

1. Create blocks in TIER 1 (no read needed)
   ├─ Blocks 1-250: Add to TIER 1
   ├─ TIER 1 fills up
   └─ Don't read, just write

2. Flush TIER 1 to TIER 2 (when full):
   ├─ Batch INSERT into SQLite
   ├─ Clear TIER 1 (make room)
   └─ Continue importing

3. Repeat:
   ├─ Blocks 251-500: Add to TIER 1
   ├─ Flush to TIER 2
   └─ Continue

Result:
├─ No cache thrashing
├─ Streaming write pattern
├─ Import 1000 blocks: <2 seconds
└─ Total performance: 1000 × 2ms = 2 seconds
```

### 7.2 Search Operations

```
Scenario: Full-text search for "Rust" in 10k blocks

Query: SELECT * FROM blocks_fts WHERE title MATCH 'Rust'

Without caching:
├─ SQLite FTS scan: 500ms
├─ Each matching block: Random disk access
├─ Results: Variable (1-1000 blocks)
└─ Time: 500ms + (matches × 20ms)

With caching:

1. FTS index lookup: 500ms (same)
2. Results: Find 100 matching blocks
3. Load first 20 results:
   ├─ Check TIER 1: Miss (first search)
   ├─ Check TIER 2: Miss (new search)
   ├─ Load from TIER 3: 100ms (batch read)
   ├─ Load to TIER 1: 100 blocks
   └─ Time: 100ms

4. User scrolls, view next 20:
   ├─ Check TIER 1: Hit! (just loaded)
   ├─ Return immediately
   └─ Time: <1ms

Result:
├─ First page: 600ms (FTS + load)
├─ Subsequent pages: <1ms (all in TIER 1)
└─ Performance: 20 results in 600ms, then instant paging
```

---

## 8. MOBILE SPECIFIC CACHING

### 8.1 Memory Constraints

```
Mobile device typical memory:

iPhone:
├─ Available RAM: 3-6 GB
├─ App memory limit: ~500-800 MB
└─ Allocated for Chronex: 300-400 MB

Android:
├─ Available RAM: 2-8 GB
├─ App memory limit: ~256-512 MB
└─ Allocated for Chronex: 150-250 MB

Cache allocation:

iOS (400 MB app budget):
├─ TIER 1: 20-50 MB
├─ TIER 2: 50-100 MB (SQLite buffer)
├─ UI/Other: 200-300 MB
└─ Headroom: 50-100 MB (avoid OOM killer)

Android (250 MB app budget):
├─ TIER 1: 10-20 MB
├─ TIER 2: 30-50 MB (SQLite buffer)
├─ UI/Other: 150-180 MB
└─ Headroom: 30-50 MB (avoid OOM killer)
```

### 7.2 Mobile Optimization

```
Strategies for memory-constrained environments:

1. Smaller TIER 1:
   ├─ Default: 50 MB
   ├─ Mobile: 10-20 MB (smaller working set)
   └─ Shorter TTL: 5 minutes (evict faster)

2. Lazy loading:
   ├─ Don't load full block until needed
   ├─ Load title + preview first
   ├─ Load full content on demand
   └─ Saves 80-90% memory

3. Attachment caching:
   ├─ Don't cache full attachments
   ├─ Cache thumbnails only (100 KB each)
   ├─ Load full file on demand
   └─ Saves massive amounts (attachments can be 100 MB)

4. Block-level pagination:
   ├─ Load 50 blocks per "page"
   ├─ Don't load entire notebook at once
   ├─ Scroll pagination (load as user scrolls)
   └─ Effective for notebooks with 1000+ blocks
```

---

## 9. WEBDAV VFS CACHE INTEGRATION

### 9.1 VFS Translation Caching

```
WebDAV VFS Layer (in Go server):

Request: GET /My%20Notebook/First%20Note.md
    ↓
Path → Block ID (cached):
├─ Decode URL: /My%20Notebook/First%20Note.md
├─ Lookup in path_to_block_id cache: O(1)
├─ If hit: Use cached block_id
├─ If miss: Query database, cache result
└─ Result: <1ms translation (cached)

Block Query (TIER 1 cache):
├─ Load block from SQLite
├─ Decrypt content (with master key)
├─ Build response: ETag + Last-Modified
└─ Return to client (from TIER 1 cache if recent)

Performance:
├─ Path lookup: <1ms (cached)
├─ Block load: <5ms (TIER 1 hit)
├─ Total WebDAV latency: <100ms P99
```

### 9.2 WebDAV VFS Cache Modes (Rclone-inspired)

```
Go server supports configurable cache modes (like Rclone):

full (recommended):
├─ Caches all accessed blocks
├─ Poll interval: 5 minutes
├─ Best for: Desktop clients, fast access
├─ Memory: 50-200 MB (depends on block count)
├─ Server start: chronex serve webdav --vfs-cache-mode full

writes:
├─ Only cache write operations (PUT)
├─ Read operations: Query database each time
├─ Best for: Read-heavy workloads
├─ Memory: Minimal (only pending writes)
├─ Server start: chronex serve webdav --vfs-cache-mode writes

minimal:
├─ Only cache open file handles
├─ Evict when file closes
├─ Best for: One-off edits, low memory devices
├─ Memory: Very low
├─ Server start: chronex serve webdav --vfs-cache-mode minimal

off:
├─ No caching (always query database)
├─ Every block load hits SQLite
├─ Best for: Testing, or when memory is critical
├─ Memory: None
├─ Latency: Higher (database query every time)
├─ Server start: chronex serve webdav --vfs-cache-mode off
```

### 9.3 Poll Interval Configuration

```
How often VFS refreshes from database:

Configuration:
├─ Flag: --vfs-cache-poll-interval 5m
├─ Default: 5 minutes
├─ Range: 1m to 1h

When to adjust:

Faster polling (1m):
├─ Multi-device: All devices edit frequently
├─ Benefit: See changes faster (up to 1 minute)
├─ Cost: More database queries
├─ Use case: Team collaboration

Standard polling (5m):
├─ Default: Balances responsiveness + efficiency
├─ Benefit: Good for most users
├─ Cost: Moderate (5 DB queries per hour per block)
└─ Use case: Personal or small teams

Slower polling (30m):
├─ Single device: No multi-device sync needed
├─ Benefit: Minimal database load
├─ Cost: Changes visible after up to 30 minutes
└─ Use case: Local-only usage

Example command:
├─ chronex serve webdav \
│    --vfs-cache-mode full \
│    --vfs-cache-poll-interval 5m \
│    --addr 0.0.0.0:8080 \
│    --db ~/.chronex/chronex.db
```

### 9.4 Cache Coherency with WebDAV

```
Challenge: TIER 1 cache must stay coherent with WebDAV VFS cache

Edit from WebDAV client (external):

1. Client PUT: /My%20Notebook/First%20Note.md
2. Server receives: Updated content
3. VFS cache updated: New block version
4. TIER 1 cache invalidated: Mark as stale
5. Next TIER 1 access: Re-fetch from TIER 3

Edit from local app (internal):

1. Local app updates block in SQLite
2. TIER 1 updated immediately
3. Add to sync_queue (for WebDAV upload)
4. Next sync: PUT to WebDAV server
5. Server VFS cache updated

Multi-device scenario:

Device A:
├─ Edits block locally
├─ TIER 1 cache updated
├─ Sync uploads: PUT to server
└─ Server updates VFS cache

Device B:
├─ Polling: Detects server change (every 5m)
├─ VFS cache invalidated
├─ Re-fetches: GET from server
├─ Updates TIER 1 cache
└─ User sees latest version

Result:
├─ TIER 1 ↔ VFS ↔ Server consistency
├─ Eventual consistency (5m window)
└─ No data corruption (all updates atomic)
```

---

## 10. IMPLEMENTATION ROADMAP

### v1.0 (MVP)

```
Features:
├─ TIER 1: In-memory LRU cache (50 MB default)
├─ TIER 2: SQLite buffer cache (20,000 pages)
├─ TIER 3: SQLite persistent storage
├─ Basic hit rate metrics
└─ No user configuration yet

Performance:
├─ Hit rate: 70-80% (typical)
├─ Memory: <600 MB for 100k blocks
└─ Acceptable for: Single device, local operations
```

### v1.5 (Tuning + WebDAV Optimization)

```
Features:
├─ User-configurable cache size
├─ Hit rate monitoring dashboard
├─ Smart invalidation on sync
├─ Compression for TIER 2 (optional)
├─ Mobile memory optimizations
├─ VFS cache mode configuration (full/writes/minimal/off)
├─ Polling interval tuning (1m-1h)
└─ Cache coherency metrics (TIER 1 vs VFS)

Performance:
├─ Hit rate: 80-90% (after tuning)
├─ Memory: <800 MB for 100k blocks
├─ WebDAV latency: <100ms P99
└─ Acceptable for: Multi-device, professional users, WebDAV clients
```

### v2.0 (Advanced)

```
Features:
├─ Distributed cache (Redis) for team
├─ Cache replication across devices
├─ Smart prefetching (based on access patterns)
├─ Meilisearch indexing (v2.0+, if needed)
├─ Cache compression (Brotli for TIER 2)
└─ WebDAV performance analytics

Scope: Enterprise, collaborative teams
```

---

## Summary

**CHRONEX Cache Architecture**: 3-tier (Hot/Warm/Cold) + WebDAV VFS caching

**Key Principles**:
- ✅ TIER 1 (Hot): <1ms latency, 50 MB typical, LRU eviction
- ✅ TIER 2 (Warm): 10-50ms latency, SQLite buffer (80 MB)
- ✅ TIER 3 (Cold): 50-500ms latency, persistent SQLite
- ✅ VFS Cache: WebDAV path ↔ block ID translation (cached)
- ✅ Coherency: Atomic updates across all tiers + VFS cache
- ✅ Transparency: Application unaware (automatic)
- ✅ WebDAV Modes: full/writes/minimal/off (configurable)

**Performance SLOs**:
- Hit rate: 80-90% from TIER 1+2
- Average latency: <5ms per query
- WebDAV latency: <100ms P99
- Memory: <600 MB (personal), <1 GB (professional)
- Scalability: Efficient up to 100k blocks (SQLite limit)

**WebDAV VFS Caching**:
- Path translation: <1ms (cached)
- Cache modes: full, writes, minimal, off
- Poll interval: 1m to 1h (default 5m)
- Coherency: 5m eventual consistency (multi-device)

**Tuning**:
- User-configurable cache size
- TTL-based eviction (10 min default)
- Index strategy (5-8 indices recommended)
- Mobile optimizations (10-20 MB TIER 1)
- VFS cache mode selection (based on workload)

---

**Document Status**: Updated with WebDAV VFS Integration  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md  
**Next**: CHRONEX_ENCRYPTION_AT_REST_DESIGN.md
