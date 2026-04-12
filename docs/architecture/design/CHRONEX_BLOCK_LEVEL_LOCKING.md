# Block-Level Locking: Concurrent Access Control

## 🎯 Problem Statement

WebDAV clients need **exclusive write locks** to prevent concurrent modifications:

```
Client A: LOCK /notes/work/project.md
├─ Makes changes
└─ UNLOCK

Client B: While A has lock, tries PUT
├─ Should get 423 Locked response
└─ Must wait for A to release
```

**Challenge**: Implement WebDAV-compatible locking that works with:
- Multiple WebDAV clients (Obsidian, WinSCP, Nextcloud)
- Concurrent modifications
- Timeout handling (client crashes without UNLOCK)
- Conflict detection (Last-Write-Wins when locks expire)

---

## 🔍 WebDAV Lock System (RFC 4918)

### Lock Types

```
1. Exclusive Lock
   - Only one owner can hold
   - For: File editing
   - Example: Editing project.md

2. Shared Lock
   - Multiple owners can hold
   - For: Reading/browsing
   - Example: Multiple clients reading the file
```

### Lock Operations

```
LOCK /project.md
│
├─ locktoken: <urn:uuid:12345678>
├─ owner: alice@192.168.1.100
├─ created: 2026-04-12T14:30:00Z
├─ timeout: 5 minutes
│
└─ Response: 200 OK + Lock-Token header

PUT /project.md (with If: <urn:uuid:12345678>)
├─ Checks: Is token valid and not expired?
├─ YES: Update allowed
├─ NO: Return 423 Locked

UNLOCK /project.md
└─ Remove lock token
```

---

## 🏗️ Chronex Block-Level Locking Architecture

### Data Structure

```go
type BlockLock struct {
    // Identification
    ID         string    // uuid (e.g., "12345678-1234-1234-1234-123456789012")
    BlockID    string    // Which block is locked
    Owner      string    // Who owns the lock (e.g., "alice")
    OwnerURI   string    // Full URI (e.g., "http://192.168.1.100:8080")
    
    // Timing
    CreatedAt  time.Time
    ExpiresAt  time.Time
    
    // Lock details
    Type       LockType  // EXCLUSIVE or SHARED
    Depth      int       // 0 (just this block) or infinity (block + children)
    
    // Status
    Active     bool
}

enum LockType {
    EXCLUSIVE = 0  // Only one owner
    SHARED = 1     // Multiple owners
}
```

### Lock Manager

```go
type BlockLockManager struct {
    // In-memory: active locks (fast path)
    activeLocks map[string]*BlockLock  // lockToken → BlockLock
    lockMutex   sync.RWMutex
    
    // Database: lock history + recovery
    db          *sql.DB
    
    // Configuration
    DefaultTimeout time.Duration  // e.g., 5 minutes
    MaxTimeout     time.Duration  // e.g., 1 hour
}
```

---

## 🔐 Lock Acquisition Algorithm

### LOCK Request

```go
func (lm *BlockLockManager) AcquireLock(
    ctx context.Context,
    blockID string,
    owner string,
    ownerURI string,
    lockType LockType,
    timeout time.Duration,
) (lockToken string, err error) {
    
    // 1. Validate input
    if timeout < 0 || timeout > lm.MaxTimeout {
        return "", ErrInvalidTimeout
    }
    
    lm.lockMutex.Lock()
    defer lm.lockMutex.Unlock()
    
    // 2. Check for conflicting locks
    existingLock := lm.findActiveLock(blockID)
    
    if existingLock != nil {
        // Check lock type compatibility
        if existingLock.Type == EXCLUSIVE || lockType == EXCLUSIVE {
            // EXCLUSIVE + anything = conflict
            // Shared + Shared = OK
            return "", ErrLocked
        }
    }
    
    // 3. Generate lock token
    lockToken = fmt.Sprintf("urn:uuid:%s", uuid.New().String())
    
    // 4. Create lock record
    lock := &BlockLock{
        ID:        lockToken,
        BlockID:   blockID,
        Owner:     owner,
        OwnerURI:  ownerURI,
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(timeout),
        Type:      lockType,
        Depth:     0,
        Active:    true,
    }
    
    // 5. Store in memory
    lm.activeLocks[lockToken] = lock
    
    // 6. Store in database (for recovery)
    lm.db.ExecContext(ctx, `
        INSERT INTO block_locks (token, block_id, owner, owner_uri, type, created_at, expires_at, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, lockToken, blockID, owner, ownerURI, lockType, lock.CreatedAt, lock.ExpiresAt)
    
    return lockToken, nil
}
```

### Lock Validation (During PUT)

```go
func (lm *BlockLockManager) ValidateLockToken(
    ctx context.Context,
    blockID string,
    lockToken string,
) error {
    lm.lockMutex.RLock()
    defer lm.lockMutex.RUnlock()
    
    // 1. Check if lock exists
    lock, exists := lm.activeLocks[lockToken]
    if !exists {
        return ErrLockNotFound
    }
    
    // 2. Check if lock is for this block
    if lock.BlockID != blockID {
        return ErrWrongBlock
    }
    
    // 3. Check if lock is expired
    if time.Now().After(lock.ExpiresAt) {
        // Auto-release expired locks
        lm.releaseLockUnsafe(lockToken)
        return ErrLockExpired
    }
    
    // 4. Check if lock is active
    if !lock.Active {
        return ErrLockReleased
    }
    
    return nil
}
```

### Lock Release

```go
func (lm *BlockLockManager) ReleaseLock(ctx context.Context, lockToken string) error {
    lm.lockMutex.Lock()
    defer lm.lockMutex.Unlock()
    
    lock, exists := lm.activeLocks[lockToken]
    if !exists {
        return ErrLockNotFound
    }
    
    return lm.releaseLockUnsafe(lockToken)
}

func (lm *BlockLockManager) releaseLockUnsafe(lockToken string) error {
    lock, _ := lm.activeLocks[lockToken]
    
    // 1. Mark as inactive in memory
    delete(lm.activeLocks, lockToken)
    
    // 2. Mark as inactive in database
    lm.db.Exec(`
        UPDATE block_locks SET active = 0 WHERE token = ?
    `, lockToken)
    
    return nil
}
```

---

## ⏱️ Lock Timeout Handling

### Automatic Expiration

```go
type LockExpirationManager struct {
    lockManager *BlockLockManager
    ticker      *time.Ticker
}

// Run in background goroutine
func (lem *LockExpirationManager) CleanupExpiredLocks(ctx context.Context) {
    lem.ticker = time.NewTicker(1 * time.Minute)
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-lem.ticker.C:
            lem.lockManager.lockMutex.Lock()
            
            // Find expired locks
            for token, lock := range lem.lockManager.activeLocks {
                if time.Now().After(lock.ExpiresAt) {
                    // Auto-release
                    delete(lem.lockManager.activeLocks, token)
                    
                    lem.lockManager.db.Exec(`
                        UPDATE block_locks SET active = 0 WHERE token = ?
                    `, token)
                }
            }
            
            lem.lockManager.lockMutex.Unlock()
        }
    }
}
```

### Lock Refresh/Renew

```go
// Client can extend lock timeout
func (lm *BlockLockManager) RefreshLock(
    ctx context.Context,
    lockToken string,
    newTimeout time.Duration,
) error {
    lm.lockMutex.Lock()
    defer lm.lockMutex.Unlock()
    
    lock, exists := lm.activeLocks[lockToken]
    if !exists {
        return ErrLockNotFound
    }
    
    // Extend expiration
    lock.ExpiresAt = time.Now().Add(newTimeout)
    
    lm.db.ExecContext(ctx, `
        UPDATE block_locks SET expires_at = ? WHERE token = ?
    `, lock.ExpiresAt, lockToken)
    
    return nil
}
```

---

## 🔄 Multi-Block Locking (Parent-Child)

### Scenario: Lock Directory

```
LOCK /notes/work/ with Depth: infinity
├─ Should lock all children recursively
├─ /notes/work/project.md (locked)
├─ /notes/work/meeting.md (locked)
└─ /notes/work/sub/details.md (locked)
```

### Implementation

```go
func (lm *BlockLockManager) AcquireRecursiveLock(
    ctx context.Context,
    blockID string,  // Parent block (directory)
    owner string,
    timeout time.Duration,
) (lockToken string, err error) {
    
    lm.lockMutex.Lock()
    defer lm.lockMutex.Unlock()
    
    // 1. Get all descendant blocks
    descendants, _ := lm.getDescendants(ctx, blockID)
    
    // 2. Check for conflicts on any descendant
    for _, childID := range descendants {
        lock := lm.findActiveLock(childID)
        if lock != nil && lock.Type == EXCLUSIVE {
            return "", ErrLocked  // Can't lock if any child has exclusive lock
        }
    }
    
    // 3. Create parent lock
    parentLock := &BlockLock{
        ID:        fmt.Sprintf("urn:uuid:%s", uuid.New()),
        BlockID:   blockID,
        Owner:     owner,
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(timeout),
        Type:      EXCLUSIVE,
        Depth:     -1,  // -1 = infinity
        Active:    true,
    }
    
    lockToken = parentLock.ID
    lm.activeLocks[lockToken] = parentLock
    
    // 4. Create child locks (implicit)
    for _, childID := range descendants {
        childLock := &BlockLock{
            ID:        fmt.Sprintf("urn:uuid:%s", uuid.New()),
            BlockID:   childID,
            Owner:     owner,
            CreatedAt: time.Now(),
            ExpiresAt: time.Now().Add(timeout),
            Type:      EXCLUSIVE,
            Depth:     0,
            Active:    true,
        }
        // Store with parent reference
        lm.activeLocks[childLock.ID] = childLock
    }
    
    return lockToken, nil
}

func (lm *BlockLockManager) getDescendants(ctx context.Context, blockID string) ([]string, error) {
    // Query: SELECT id FROM blocks WHERE parent_id = blockID RECURSIVELY
    var descendants []string
    
    // BFS traversal
    queue := []string{blockID}
    for len(queue) > 0 {
        current := queue[0]
        queue = queue[1:]
        
        var children []string
        rows, _ := lm.db.QueryContext(ctx, `
            SELECT id FROM blocks WHERE parent_id = ?
        `, current)
        
        for rows.Next() {
            var childID string
            rows.Scan(&childID)
            descendants = append(descendants, childID)
            queue = append(queue, childID)
        }
    }
    
    return descendants, nil
}
```

---

## 🛡️ Conflict Detection & Resolution

### Scenario: Lock Expires, Both Clients Write

```
Time    Client A              Client B
----    --------              --------
0:00    LOCK project.md       (waiting)
        (5 min timeout)
0:01    PUT project.md
        (with lock token)
0:05    (lock expires)       LOCK project.md (succeeds)
0:06    Unaware, modifies    
        block metadata
0:07                         PUT project.md
                             (with new lock)

Result: Conflict! Both modified, last wins
```

### Conflict Resolution Strategy

```go
type ConflictResolver struct {
    db *sql.DB
}

// Called when PUT happens without lock (or expired lock)
func (cr *ConflictResolver) DetectConflict(
    ctx context.Context,
    blockID string,
    clientVersion uint64,  // Last known timestamp
    clientHash string,     // Client's hash
) (conflict bool, serverVersion uint64, serverHash string, err error) {
    
    // 1. Get current server version
    var serverTimestamp uint64
    var serverContent []byte
    
    cr.db.QueryRowContext(ctx, `
        SELECT timestamp, content FROM blocks WHERE id = ?
    `, blockID).Scan(&serverTimestamp, &serverContent)
    
    // 2. Compute server hash
    serverHash = fastcdc.Hash(serverContent)
    
    // 3. Check if client version matches server
    if clientVersion != serverTimestamp || clientHash != serverHash {
        return true, serverTimestamp, serverHash, nil
    }
    
    return false, serverTimestamp, serverHash, nil
}

// Conflict resolution: Last-Write-Wins with timestamp
func (cr *ConflictResolver) ResolveConflict(
    ctx context.Context,
    blockID string,
    clientTimestamp uint64,
    serverTimestamp uint64,
    clientContent []byte,
    serverContent []byte,
) ([]byte, error) {
    
    // Client wins if its timestamp is newer
    if clientTimestamp > serverTimestamp {
        return clientContent, nil  // Use client version
    }
    
    // Server wins
    return serverContent, nil
}
```

### Logging for Debugging

```go
type LockLog struct {
    db *sql.DB
}

// Log all lock events
func (ll *LockLog) LogEvent(ctx context.Context, event string, lockID, blockID string, timestamp time.Time) {
    ll.db.ExecContext(ctx, `
        INSERT INTO lock_events (event, lock_id, block_id, timestamp)
        VALUES (?, ?, ?, ?)
    `, event, lockID, blockID, timestamp)
}

// Queries
// 1. Find who locked block
// 2. Track lock duration
// 3. Find abandoned locks
// 4. Analyze contention
```

---

## 💾 Lock Persistence & Recovery

### Database Schema

```sql
CREATE TABLE block_locks (
    token VARCHAR(255) PRIMARY KEY,
    block_id VARCHAR(36) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    owner_uri TEXT NOT NULL,
    type INT NOT NULL,  -- 0=EXCLUSIVE, 1=SHARED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT 1,
    
    FOREIGN KEY (block_id) REFERENCES blocks(id),
    INDEX (block_id),
    INDEX (active, expires_at)
);

CREATE TABLE lock_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event VARCHAR(50),  -- LOCK, UNLOCK, EXPIRED, CONFLICT
    lock_id VARCHAR(255),
    block_id VARCHAR(36),
    timestamp TIMESTAMP,
    
    FOREIGN KEY (lock_id) REFERENCES block_locks(token),
    FOREIGN KEY (block_id) REFERENCES blocks(id),
    INDEX (timestamp)
);
```

### Server Startup: Recovery

```go
func (lm *BlockLockManager) RecoverLocks(ctx context.Context) error {
    // 1. Load all active locks from database
    rows, _ := lm.db.QueryContext(ctx, `
        SELECT token, block_id, owner, owner_uri, type, expires_at
        FROM block_locks
        WHERE active = 1
    `)
    
    for rows.Next() {
        var lock BlockLock
        rows.Scan(&lock.ID, &lock.BlockID, &lock.Owner, &lock.OwnerURI, &lock.Type, &lock.ExpiresAt)
        
        // 2. Check if expired
        if time.Now().After(lock.ExpiresAt) {
            // Mark as expired
            lm.db.Exec(`UPDATE block_locks SET active = 0 WHERE token = ?`, lock.ID)
            continue
        }
        
        // 3. Reload into memory
        lock.Active = true
        lm.activeLocks[lock.ID] = &lock
    }
    
    return nil
}
```

---

## 📊 Lock Statistics & Monitoring

```go
type LockMetrics struct {
    TotalLocks          int64
    ActiveLocks         int64
    ExpiredLocks        int64
    ConflictCount       int64
    AverageHoldTime     time.Duration
    MaxHoldTime         time.Duration
    LongestWaitTime     time.Duration
}

func (lm *BlockLockManager) GetMetrics(ctx context.Context) *LockMetrics {
    lm.lockMutex.RLock()
    defer lm.lockMutex.RUnlock()
    
    metrics := &LockMetrics{
        TotalLocks:  int64(len(lm.activeLocks)),
        ActiveLocks: int64(len(lm.activeLocks)),
    }
    
    // Query database for stats
    row := lm.db.QueryRowContext(ctx, `
        SELECT COUNT(*), 
               SUM(CASE WHEN active=0 THEN 1 ELSE 0 END),
               COUNT(DISTINCT block_id)
        FROM block_locks
    `)
    
    row.Scan(&metrics.TotalLocks, &metrics.ExpiredLocks)
    
    return metrics
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Lock Data Structure

- [ ] Define `BlockLock` struct
- [ ] Create database schema (`block_locks` table)
- [ ] Implement lock token generation (UUID)

### Phase 2: Lock Operations

- [ ] Implement `AcquireLock()` (exclusive)
- [ ] Implement `AcquireLock()` (shared)
- [ ] Implement `ValidateLockToken()`
- [ ] Implement `ReleaseLock()`
- [ ] Implement `RefreshLock()`

### Phase 3: Concurrency & Expiration

- [ ] Implement `BlockLockManager` with proper sync.RWMutex
- [ ] Implement background expiration cleanup
- [ ] Test race conditions
- [ ] Add lock timeout validation

### Phase 4: Multi-Block Locking

- [ ] Implement recursive locking (Depth: infinity)
- [ ] Query descendants
- [ ] Handle circular reference detection

### Phase 5: Conflict Detection

- [ ] Implement conflict detection (version/hash compare)
- [ ] Implement Last-Write-Wins resolution
- [ ] Log conflict events

### Phase 6: Recovery & Testing

- [ ] Implement lock recovery on startup
- [ ] Implement lock event logging
- [ ] Unit tests: Lock acquisition, expiration, release
- [ ] Integration tests: Multiple clients with locks
- [ ] Stress tests: High contention scenarios

---

## 📈 Performance Considerations

### Lock Contention Scenarios

```
Scenario 1: Low Contention (2-5 concurrent users)
├─ Most blocks have no locks
├─ Expiration cleanup every 5 minutes
└─ In-memory lookups < 1ms

Scenario 2: Medium Contention (10-20 users)
├─ Some popular blocks locked frequently
├─ Need better cache invalidation
├─ Potential timeout conflicts

Scenario 3: High Contention (100+ users)
├─ Database bottleneck (lock table writes)
├─ Need distributed locking (Redis)
├─ Rebalance timeout settings
```

### Optimization Strategies

1. **Read-Write Lock**: `sync.RWMutex` (readers don't block each other)
2. **Lock bucketing**: Partition locks by block_id hash
3. **Lazy cleanup**: Only clean expired on access (not background)
4. **Database indexing**: `INDEX (block_id, active, expires_at)`
5. **Cache warmup**: Pre-load hot locks on startup

