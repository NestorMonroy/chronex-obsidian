# Cache Optimization: Multi-Concurrent Access

## 🎯 Problem Statement

Chronex WebDAV server must handle **multiple simultaneous connections** efficiently:

```
Client A: GET /notes/work/project.md (100KB file)
Client B: GET /notes/work/project.md (same file, same moment)
Client C: PUT /notes/personal/ideas.md (write)
Client D: PROPFIND /notes/ (list directory)

Requirements:
├─ No duplicate database queries (A and B fetch same block once)
├─ Fast metadata access (O(1) lookups)
├─ LRU eviction (limited memory)
├─ Write invalidation (C's PUT invalidates A/B's cache)
└─ Three-tier: Hot (memory) → Warm (disk) → Cold (DB)
```

---

## 🏗️ Three-Tier Cache Architecture

### Tier 1: Hot Cache (Memory)

```
├─ Type: In-memory hash map
├─ Size: 100-1000 active entries
├─ Access time: < 1μs
├─ Eviction: LRU when full
├─ Content: Recently accessed blocks + metadata
└─ Lifetime: Session (survives restarts? NO)

Example entries:
  Block "uuid-123" → {timestamp: 1234567890, title: "project.md", size: 102400}
  Path "/notes/work" → {uuid: "uuid-456", type: DIRECTORY, children: [3]}
```

### Tier 2: Warm Cache (Disk)

```
├─ Type: SQLite database
├─ Size: 1GB+ (configurable)
├─ Access time: 1-10ms
├─ Eviction: LRU or TTL-based
├─ Content: Metadata, hashes, serialized blocks
└─ Lifetime: Persistent (survives restarts? YES)

Example entries:
  cache_metadata:     block_id → (title, type, size, hash, timestamp)
  cache_blocks:       block_id → (content, serialized_fb)
  cache_paths:        block_id → (path, canonical_path)
```

### Tier 3: Cold Storage (Database)

```
├─ Type: Main SQLite database
├─ Size: Unlimited
├─ Access time: 10-100ms (with index)
├─ Content: Single source of truth
└─ Queries: SELECT + JOIN (slower)

Original blocks table
```

---

## 📊 Cache Hierarchy Flow

```
GET /notes/work/project.md
   ↓
1. CHECK HOT (memory)
   ├─ Path → block_id lookup: /notes/work/project.md → uuid-123
   ├─ HIT: Return immediately (< 1μs)
   └─ MISS: Continue to tier 2
   
2. CHECK WARM (disk SQLite)
   ├─ Query: SELECT * FROM cache_blocks WHERE id = uuid-123
   ├─ HIT: Promote to hot, return (5-10ms)
   └─ MISS: Continue to tier 3
   
3. CHECK COLD (main database)
   ├─ Query: SELECT * FROM blocks WHERE id = uuid-123
   ├─ Hit: Deserialize, promote to warm+hot (50-100ms)
   └─ MISS: Return 404
```

---

## 🔥 Hot Cache Implementation

### Data Structure

```go
type HotCacheEntry struct {
    Block           *Block        // Actual block data
    Metadata        *BlockMeta    // Title, size, type, etc.
    Hash            string        // FastCDC hash for ETag
    SerializedFB    []byte        // FlatBuffers binary (cached)
    DeseriializeAt  time.Time     // When FlatBuffers was created
}

type HotCache struct {
    // Main cache
    cache           map[string]*HotCacheEntry  // blockID → entry
    cacheMutex      sync.RWMutex
    
    // LRU tracking
    lru             *lru.Cache[string, *HotCacheEntry]
    maxSize         int  // max entries (e.g., 1000)
    
    // Statistics
    hits            int64
    misses          int64
    evictions       int64
}
```

### Get Operation (with Lock)

```go
func (hc *HotCache) Get(blockID string) (*HotCacheEntry, bool) {
    hc.cacheMutex.RLock()
    entry, exists := hc.cache[blockID]
    hc.cacheMutex.RUnlock()
    
    if exists {
        // Update LRU
        hc.lru.Add(blockID, entry)
        atomic.AddInt64(&hc.hits, 1)
        return entry, true
    }
    
    atomic.AddInt64(&hc.misses, 1)
    return nil, false
}
```

### Put Operation (with Eviction)

```go
func (hc *HotCache) Put(blockID string, entry *HotCacheEntry) {
    hc.cacheMutex.Lock()
    defer hc.cacheMutex.Unlock()
    
    // 1. Add to cache
    hc.cache[blockID] = entry
    
    // 2. Update LRU
    evicted := hc.lru.Add(blockID, entry)
    
    // 3. If LRU evicted something, remove from hot cache
    if evicted {
        // Get evicted key and remove it
        evictedKey := hc.lru.GetOldest()[0]  // Simplification
        delete(hc.cache, evictedKey)
        atomic.AddInt64(&hc.evictions, 1)
        
        // Promote to warm cache (disk)
        hc.promoteToWarm(evictedKey, entry)
    }
}

func (hc *HotCache) promoteToWarm(blockID string, entry *HotCacheEntry) {
    // Store in tier 2 (warm cache DB)
    hc.warmDB.Exec(`
        INSERT OR REPLACE INTO cache_blocks (block_id, metadata, hash, timestamp)
        VALUES (?, ?, ?, ?)
    `, blockID, serialize(entry.Metadata), entry.Hash, time.Now())
}
```

---

## 💾 Warm Cache Implementation (SQLite)

### Database Schema

```sql
-- Warm cache storage
CREATE TABLE cache_metadata (
    block_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255),
    type VARCHAR(20),
    size INT64,
    hash VARCHAR(64),  -- FastCDC hash
    timestamp BIGINT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    INDEX (expires_at)
);

CREATE TABLE cache_blocks (
    block_id VARCHAR(36) PRIMARY KEY,
    serialized_fb BLOB,  -- Serialized FlatBuffers
    size_bytes INT64,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    FOREIGN KEY (block_id) REFERENCES cache_metadata(block_id)
);

CREATE TABLE cache_paths (
    block_id VARCHAR(36) PRIMARY KEY,
    path VARCHAR(1024),
    canonical_path VARCHAR(1024),
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (path)
);
```

### Warm Cache Operations

```go
type WarmCache struct {
    db *sql.DB
    maxSize int64  // e.g., 1GB
    ttl time.Duration  // e.g., 1 hour
}

func (wc *WarmCache) Get(blockID string) (*HotCacheEntry, error) {
    var metadata, hash string
    var serializedFB []byte
    var expiresAt time.Time
    
    err := wc.db.QueryRow(`
        SELECT metadata, hash, expires_at, serialized_fb
        FROM cache_blocks
        WHERE block_id = ?
    `, blockID).Scan(&metadata, &hash, &expiresAt, &serializedFB)
    
    if err == sql.ErrNoRows {
        return nil, ErrNotFound
    }
    
    // Check if expired
    if time.Now().After(expiresAt) {
        wc.Delete(blockID)
        return nil, ErrExpired
    }
    
    entry := &HotCacheEntry{
        Metadata:     deserialize(metadata),
        Hash:         hash,
        SerializedFB: serializedFB,
    }
    
    return entry, nil
}

func (wc *WarmCache) Put(blockID string, entry *HotCacheEntry) error {
    expiresAt := time.Now().Add(wc.ttl)
    
    return wc.db.Exec(`
        INSERT OR REPLACE INTO cache_blocks
        (block_id, metadata, hash, serialized_fb, expires_at)
        VALUES (?, ?, ?, ?, ?)
    `, blockID, serialize(entry.Metadata), entry.Hash, entry.SerializedFB, expiresAt).Error
}

// Background cleanup of expired entries
func (wc *WarmCache) CleanupExpired(ctx context.Context) error {
    _, err := wc.db.ExecContext(ctx, `
        DELETE FROM cache_blocks WHERE expires_at < datetime('now')
    `)
    return err
}

// Check size and evict if needed
func (wc *WarmCache) EnsureSize() error {
    var totalSize int64
    wc.db.QueryRow(`
        SELECT SUM(size_bytes) FROM cache_blocks
    `).Scan(&totalSize)
    
    if totalSize > wc.maxSize {
        // Evict oldest (LRU in SQLite)
        _, err := wc.db.Exec(`
            DELETE FROM cache_blocks WHERE block_id IN (
                SELECT block_id FROM cache_blocks
                ORDER BY cached_at ASC
                LIMIT (
                    SELECT COUNT(*) * 0.2  -- Delete oldest 20%
                    FROM cache_blocks
                )
            )
        `)
        return err
    }
    
    return nil
}
```

---

## 🔄 Cache Invalidation Strategy

### Write Invalidation Cascade

```
PUT /notes/work/project.md (Client C modifies)
   ↓
1. BLOCK LEVEL INVALIDATION
   ├─ Invalidate hot cache: uuid-123 (the block)
   ├─ Invalidate warm cache: uuid-123
   └─ Invalidate path cache: /notes/work/project.md
   
2. PARENT LEVEL INVALIDATION
   ├─ Invalidate parent block: uuid-456 (work directory)
   ├─ Invalidate parent path cache
   └─ Update directory timestamp
   
3. VIRTUAL CACHE INVALIDATION
   ├─ Invalidate tag indices (if tags changed)
   ├─ Invalidate date indices (timestamp changed)
   └─ Invalidate any filtered lists
   
4. AFFECTED CLIENT CACHE INVALIDATION
   ├─ Notify Client A: "Block uuid-123 changed"
   ├─ Notify Client B: "Block uuid-123 changed"
   └─ (They can refresh if needed)
```

### Implementation

```go
type CacheInvalidator struct {
    hot  *HotCache
    warm *WarmCache
    db   *sql.DB
}

func (ci *CacheInvalidator) OnBlockModified(blockID string, changes map[string]interface{}) {
    // 1. Invalidate block itself
    ci.hot.Delete(blockID)
    ci.warm.Delete(blockID)
    
    // 2. Invalidate path caches
    ci.hot.Delete("path:" + blockID)  // Path cache key
    ci.warm.Exec("DELETE FROM cache_paths WHERE block_id = ?", blockID)
    
    // 3. Invalidate parent
    var parentID *string
    ci.db.QueryRow("SELECT parent_id FROM blocks WHERE id = ?", blockID).Scan(&parentID)
    
    if parentID != nil {
        ci.hot.Delete(*parentID)
        ci.warm.Delete(*parentID)
    }
    
    // 4. Invalidate virtual caches
    if _, ok := changes["tags"]; ok {
        ci.hot.InvalidatePrefix("tags:")
        ci.warm.Exec("DELETE FROM cache_blocks WHERE block_id LIKE 'tags:%'")
    }
    
    if _, ok := changes["timestamp"]; ok {
        ci.hot.InvalidatePrefix("dates:")
        ci.warm.Exec("DELETE FROM cache_blocks WHERE block_id LIKE 'dates:%'")
    }
}

// Batch invalidation
func (ci *CacheInvalidator) InvalidateDescendants(ctx context.Context, parentID string) {
    // Get all descendants
    descendants, _ := ci.getDescendants(ctx, parentID)
    
    for _, blockID := range descendants {
        ci.hot.Delete(blockID)
        ci.warm.Delete(blockID)
    }
}
```

---

## 🚀 Concurrent Access Optimization

### Lock-Free Reads (Copy-on-Write)

```go
// Instead of holding mutex for reads, use atomic operations
type AtomicBlockCache struct {
    snapshot atomic.Value  // *map[string]*HotCacheEntry
}

func (abc *AtomicBlockCache) Get(blockID string) (*HotCacheEntry, bool) {
    // No lock needed - reads are atomic
    cache := abc.snapshot.Load().(map[string]*HotCacheEntry)
    entry, exists := cache[blockID]
    return entry, exists
}

func (abc *AtomicBlockCache) Put(blockID string, entry *HotCacheEntry) {
    // On write: copy whole map, modify, swap
    oldCache := abc.snapshot.Load().(map[string]*HotCacheEntry)
    newCache := make(map[string]*HotCacheEntry)
    
    // Copy all entries
    for k, v := range oldCache {
        newCache[k] = v
    }
    
    // Add new entry
    newCache[blockID] = entry
    
    // Atomic swap
    abc.snapshot.Store(newCache)
}
```

### Read-Write Locking (Fine-Grained)

```go
// Lock only on changes, not on reads
type FineGrainedCache struct {
    entries map[string]*HotCacheEntry
    locks   map[string]*sync.RWMutex  // Per-block locks
    mu      sync.RWMutex  // Protects locks map
}

func (fgc *FineGrainedCache) Get(blockID string) (*HotCacheEntry, bool) {
    fgc.mu.RLock()
    blockLock, _ := fgc.locks[blockID]
    fgc.mu.RUnlock()
    
    // RLock doesn't block other readers
    blockLock.RLock()
    defer blockLock.RUnlock()
    
    entry, exists := fgc.entries[blockID]
    return entry, exists
}

func (fgc *FineGrainedCache) Put(blockID string, entry *HotCacheEntry) {
    // Ensure lock exists
    fgc.mu.Lock()
    if _, exists := fgc.locks[blockID]; !exists {
        fgc.locks[blockID] = &sync.RWMutex{}
    }
    blockLock := fgc.locks[blockID]
    fgc.mu.Unlock()
    
    // Write lock only for this block
    blockLock.Lock()
    defer blockLock.Unlock()
    
    fgc.entries[blockID] = entry
}
```

---

## 📈 Cache Warmup & Preloading

### On Startup

```go
func (cache *CacheManager) WarmupHot(ctx context.Context) error {
    // 1. Load recently accessed blocks from warm cache
    rows, _ := cache.warmDB.QueryContext(ctx, `
        SELECT block_id FROM cache_blocks
        ORDER BY cached_at DESC
        LIMIT ?
    `, cache.hotMaxSize/2)
    
    for rows.Next() {
        var blockID string
        rows.Scan(&blockID)
        
        entry, _ := cache.warm.Get(blockID)
        cache.hot.Put(blockID, entry)
    }
    
    return nil
}
```

### Predictive Preloading

```go
// Before directory listing, preload likely-to-be-accessed blocks
func (cache *CacheManager) PreloadChildren(ctx context.Context, dirBlockID string) {
    // Query: Get children of directory
    rows, _ := cache.db.QueryContext(ctx, `
        SELECT id FROM blocks WHERE parent_id = ? LIMIT 20
    `, dirBlockID)
    
    for rows.Next() {
        var blockID string
        rows.Scan(&blockID)
        
        // Asynchronously load from warm/cold
        go func(bID string) {
            if entry, _ := cache.warm.Get(bID); entry != nil {
                cache.hot.Put(bID, entry)
            }
        }(blockID)
    }
}
```

---

## 📊 Cache Statistics & Monitoring

### Metrics Collection

```go
type CacheMetrics struct {
    HotHitRate        float64  // hot hits / total requests
    WarmHitRate       float64  // warm hits / total requests
    ColdHitRate       float64  // cold hits / total requests
    
    AvgAccessTime     time.Duration
    P99AccessTime     time.Duration
    P999AccessTime    time.Duration
    
    HotSize           int64
    WarmSize          int64
    HotEvictions      int64
    WarmEvictions     int64
    
    ActiveConnections int
    PeakMemory        int64
}

func (cm *CacheManager) GetMetrics() *CacheMetrics {
    totalRequests := cm.hot.hits + cm.hot.misses
    
    return &CacheMetrics{
        HotHitRate:    float64(cm.hot.hits) / float64(totalRequests),
        WarmHitRate:   float64(cm.warm.hits) / float64(totalRequests),
        HotEvictions:  cm.hot.evictions,
        WarmEvictions: cm.warm.evictions,
        HotSize:       int64(len(cm.hot.cache)),
        WarmSize:      cm.warmDB.Size(),
    }
}

// Expose metrics for monitoring
// /metrics endpoint returns Prometheus format
```

### Benchmark Template

```
Scenario: 100 concurrent clients, 1000 blocks, 80% read/20% write

Warmup:
  ├─ Load 1000 blocks into cold cache (DB): 10s
  ├─ Warmup hot cache (first 500): 5s
  └─ Ready

Test (60 seconds):
  ├─ Hot cache hit rate: 85% (avg 0.1ms)
  ├─ Warm cache hit rate: 10% (avg 5ms)
  ├─ Cold cache hit rate: 5% (avg 50ms)
  │
  ├─ Average response time: 2.5ms
  ├─ P99 response time: 15ms
  ├─ P999 response time: 120ms
  │
  ├─ Peak memory: 150MB
  ├─ Hot cache entries: 800
  ├─ Warm cache size: 250MB
  │
  └─ Throughput: 40,000 req/sec
```

---

## 🎯 Implementation Checklist

### Phase 1: Hot Cache

- [ ] Implement `HotCache` with LRU eviction
- [ ] Implement `Get()` and `Put()` operations
- [ ] Add metrics (hits, misses, evictions)
- [ ] Unit tests: Basic operations, LRU correctness

### Phase 2: Warm Cache

- [ ] Create SQLite cache database schema
- [ ] Implement `WarmCache` Get/Put/Delete
- [ ] Implement expiration cleanup
- [ ] Implement size management (LRU eviction)
- [ ] Unit tests: Persistence, expiration

### Phase 3: Cache Invalidation

- [ ] Implement block-level invalidation
- [ ] Implement parent-level cascade
- [ ] Implement virtual cache invalidation
- [ ] Test invalidation correctness
- [ ] Integration tests: Write → read (should get new data)

### Phase 4: Concurrency

- [ ] Implement fine-grained locking (per-block)
- [ ] Test race conditions (100+ goroutines)
- [ ] Benchmark lock contention
- [ ] Consider lock-free alternatives

### Phase 5: Warmup & Preloading

- [ ] Implement hot cache warmup on startup
- [ ] Implement predictive preloading
- [ ] Measure warmup time
- [ ] Test cache hit rates after warmup

### Phase 6: Monitoring

- [ ] Implement metrics collection
- [ ] Create Prometheus endpoint (/metrics)
- [ ] Dashboard for monitoring
- [ ] Alerting (high eviction rate, memory pressure)

---

## 💡 Performance Tuning Parameters

### Adjustable Knobs

```go
type CacheConfig struct {
    // Hot cache
    HotMaxEntries    int           // 100-10000
    HotMaxMemory     int64         // 100MB-1GB
    
    // Warm cache
    WarmMaxSize      int64         // 500MB-10GB
    WarmTTL          time.Duration // 1h-24h
    
    // Expiration
    CleanupInterval  time.Duration // 1m-60m
    
    // Preloading
    PreloadPercent   int           // 10-50% of hot cache
    PreloadOnAccess  bool
    
    // Locking
    LockTimeout      time.Duration // 100ms-1s
}
```

### Tuning Strategy

```
1. Monitor hot hit rate
   If < 70%: Increase HotMaxEntries
   If > 95%: Decrease HotMaxEntries (waste of memory)

2. Monitor warm hit rate
   If < 50%: Increase WarmMaxSize
   If cold hits > 20%: Decrease WarmTTL (faster refresh)

3. Monitor lock contention
   If P99 > 100ms: Use lock-free reads
   If many evictions: Reduce HotMaxEntries, increase WarmMaxSize

4. Monitor memory
   If > 80% of available: Reduce all cache sizes, increase TTL
```

