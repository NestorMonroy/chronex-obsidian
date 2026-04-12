# Virtual File System: Mapping Chronex Blocks to Filesystem Paths

## 🎯 Problem Statement

Chronex stores data as **blocks** (atomic units of content) in a flat table structure:

```
Blocks Table:
├─ id: uuid
├─ title: string
├─ content: binary
├─ timestamp: unix_ms
├─ parent_id: uuid (nullable)
├─ tags: array[string]
├─ type: enum (TEXT, CODE, IMAGE, etc.)
├─ is_deleted: bool
└─ metadata: json
```

But **WebDAV clients expect a hierarchical filesystem**:

```
/notes/work/project.md
/notes/personal/ideas/
/attachments/2026-04/meeting.pdf
/tags/important/
/trash/deleted-note.md
```

**Challenge**: Map flat block structure → hierarchical filesystem paths, transparently.

---

## 🏗️ Three-Layer VFS Architecture

```
┌──────────────────────────────────────────┐
│  Chronex Block Model (SQLite)            │
│  - UUID-based blocks                     │
│  - Flat structure with parent_id         │
│  - Tags, timestamps, soft deletes        │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  VFS Path Resolution Layer               │
│  - Block UUID ↔ Filesystem Path          │
│  - Hierarchical navigation               │
│  - Directory virtualization              │
├────────────────┬─────────────────────────┤
│  Path Strategy │ Examples                │
├────────────────┼─────────────────────────┤
│  Hierarchy     │ /work/project.md        │
│  Tags          │ /tags/important/        │
│  Dates         │ /2026/04/12-notes.md   │
│  UUID          │ /blocks/uuid-123/      │
│  Trash         │ /trash/deleted.md      │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  golang.org/x/net/webdav.FileSystem      │
│  - Stat(path) → os.FileInfo              │
│  - OpenFile(path) → webdav.File          │
│  - Mkdir(path)                           │
│  - RemoveAll(path)                       │
│  - Rename(oldPath, newPath)              │
└──────────────────────────────────────────┘
```

---

## 📍 Path Resolution Strategy

### Strategy 1: Hierarchical (Primary)

**Principle**: Use `parent_id` relationships to create directory structure

```
Blocks Table:
├─ id: uuid-1, title: "work", parent_id: null
├─ id: uuid-2, title: "project.md", parent_id: uuid-1
├─ id: uuid-3, title: "ideas", parent_id: null
└─ id: uuid-4, title: "startup.md", parent_id: uuid-3

Filesystem:
/work/
├─ project.md (uuid-2)
/ideas/
├─ startup.md (uuid-4)
```

**Implementation**:

```go
type HierarchicalResolver struct {
    db *sql.DB
    cache map[string]string  // uuid → path cache
    mu sync.RWMutex
}

// Get path for a block UUID
func (r *HierarchicalResolver) GetPath(ctx context.Context, blockID string) (string, error) {
    // 1. Check cache first
    r.mu.RLock()
    if path, exists := r.cache[blockID]; exists {
        r.mu.RUnlock()
        return path, nil
    }
    r.mu.RUnlock()
    
    // 2. Query database: traverse parent_id chain
    var parts []string
    var currentID = blockID
    
    for currentID != "" {
        var title string
        var parentID *string
        
        err := r.db.QueryRowContext(ctx, `
            SELECT title, parent_id FROM blocks WHERE id = ?
        `, currentID).Scan(&title, &parentID)
        
        if err != nil {
            return "", err
        }
        
        parts = append([]string{title}, parts...)  // prepend
        
        if parentID == nil {
            break
        }
        currentID = *parentID
    }
    
    // 3. Build path
    path := "/" + strings.Join(parts, "/")
    
    // 4. Cache result
    r.mu.Lock()
    r.cache[blockID] = path
    r.mu.Unlock()
    
    return path, nil
}
```

**Pros**:
- ✅ Intuitive: `/notes/work/project.md`
- ✅ Respects user's organization
- ✅ Works with external clients naturally
- ✅ Deletions work correctly (move to trash)

**Cons**:
- ❌ Requires cache invalidation on parent changes
- ❌ Circular references must be prevented
- ❌ Slow without cache (O(depth) queries)

---

### Strategy 2: Tag-Based Virtual Directories

**Principle**: Use tags to create virtual directory structure

```
Blocks Table:
├─ id: uuid-1, tags: ["work", "important"]
├─ id: uuid-2, tags: ["work", "project-alpha"]
├─ id: uuid-3, tags: ["personal", "ideas"]

Filesystem (Virtual):
/tags/
├─ work/
│  ├─ uuid-1 (symlink to actual)
│  └─ uuid-2 (symlink to actual)
├─ important/
│  └─ uuid-1 (symlink to actual)
├─ personal/
│  └─ uuid-3
└─ ideas/
   └─ uuid-3
```

**Implementation**:

```go
type TagVirtualResolver struct {
    db *sql.DB
    cache map[string][]string  // blockID → tags
}

// Get virtual paths for tags
func (r *TagVirtualResolver) GetVirtualPaths(ctx context.Context, blockID string) ([]string, error) {
    // Query: SELECT tags FROM blocks WHERE id = ?
    tags := r.cache[blockID]
    
    paths := make([]string, len(tags))
    for i, tag := range tags {
        paths[i] = "/tags/" + tag + "/" + blockID + ".md"
    }
    
    return paths, nil
}
```

**Pros**:
- ✅ Multiple views of same content
- ✅ Easy filtering by topic
- ✅ No parent-child constraints

**Cons**:
- ❌ Virtual (read-only for most operations)
- ❌ Multiple paths for same file confusing
- ❌ Can't modify tags via WebDAV easily

---

### Strategy 3: Time-Based Virtual Directories

**Principle**: Organize by creation/modification timestamps

```
Blocks Table:
├─ id: uuid-1, timestamp: 1712973600000 (2026-04-12)
├─ id: uuid-2, timestamp: 1712887200000 (2026-04-11)

Filesystem (Virtual):
/dates/
├─ 2026/
│  └─ 04/
│     ├─ 12-note-1.md (uuid-1)
│     └─ 11-note-2.md (uuid-2)

OR

/dates/
├─ 2026-04-12/
│  ├─ morning-notes.md
│  └─ afternoon-sync.md
└─ 2026-04-11/
   └─ meeting-notes.md
```

**Implementation**:

```go
func (r *TimeVirtualResolver) GetPath(ctx context.Context, blockID string) (string, error) {
    var timestamp int64
    var title string
    
    r.db.QueryRowContext(ctx, `
        SELECT timestamp, title FROM blocks WHERE id = ?
    `, blockID).Scan(&timestamp, &title)
    
    // Convert timestamp to date
    t := time.UnixMilli(timestamp)
    year := t.Year()
    month := t.Month()
    day := t.Day()
    
    // Return path like: /2026/04/12-morning-notes.md
    return fmt.Sprintf("/%d/%02d/%02d-%s", year, month, day, title), nil
}
```

**Pros**:
- ✅ Good for journals/logs
- ✅ Easy to browse by date
- ✅ Useful for versioning

**Cons**:
- ❌ Multiple files with same title on same day = collision
- ❌ Virtual only (can't move files)
- ❌ Not intuitive for knowledge bases

---

### Strategy 4: UUID-Direct Access (Fallback)

**Principle**: Direct UUID-based paths as fallback

```
Filesystem (Direct):
/blocks/
├─ uuid-123/
│  ├─ data (binary)
│  └─ metadata.json
├─ uuid-456/
│  └─ data

OR

/blocks/
├─ uuid-123.md
├─ uuid-456.pdf
└─ uuid-789.txt
```

**Implementation**:

```go
func (r *UUIDResolver) GetPath(blockID string) string {
    return "/blocks/" + blockID + ".md"
}
```

**Pros**:
- ✅ Always works (no collisions)
- ✅ Simple implementation
- ✅ Good for API operations

**Cons**:
- ❌ Not user-friendly
- ❌ Ugly paths
- ❌ Defeats purpose of WebDAV UI

---

## 🎯 Recommended: Hybrid Strategy

**Combine all four strategies**:

```go
type HybridVFSResolver struct {
    // Primary: Hierarchical paths
    hierarchical *HierarchicalResolver
    
    // Virtual: Tag-based views
    tags *TagVirtualResolver
    
    // Virtual: Time-based views
    dates *TimeVirtualResolver
    
    // Fallback: UUID direct
    uuid *UUIDResolver
}

// Directory structure:
// /                          (root)
// ├─ work/                   (hierarchical - from parent_id)
// │  ├─ project.md
// │  └─ meeting-notes.md
// ├─ personal/
// │  └─ ideas/
// ├─ tags/                   (virtual - by tags)
// │  ├─ important/
// │  ├─ work/
// │  └─ @today/
// ├─ dates/                  (virtual - by timestamp)
// │  └─ 2026/
// │     └─ 04/
// │        ├─ 12/
// │        └─ 11/
// ├─ trash/                  (hierarchical - is_deleted=true)
// ├─ attachments/            (hierarchical - type=IMAGE/PDF)
// └─ blocks/                 (fallback - UUID direct)
//    ├─ uuid-123/
//    └─ uuid-456/
```

---

## 🔄 Bidirectional Mapping

### Path → Block Lookup (for WebDAV GET/PUT)

```go
func (vfs *VFS) PathToBlockID(ctx context.Context, path string) (string, error) {
    // 1. Try hierarchical (most common)
    if blockID, err := vfs.hierarchical.PathToID(ctx, path); err == nil {
        return blockID, nil
    }
    
    // 2. Try tag-based virtual
    if blockID, err := vfs.tags.PathToID(ctx, path); err == nil {
        return blockID, nil
    }
    
    // 3. Try date-based virtual
    if blockID, err := vfs.dates.PathToID(ctx, path); err == nil {
        return blockID, nil
    }
    
    // 4. Try UUID direct
    if blockID, err := vfs.uuid.PathToID(ctx, path); err == nil {
        return blockID, nil
    }
    
    return "", os.ErrNotExist
}
```

### Block → Path Lookup (for cache, references)

```go
func (vfs *VFS) BlockIDToPath(ctx context.Context, blockID string) (string, error) {
    // Always use primary path (hierarchical)
    // Virtual paths are read-only, derived
    return vfs.hierarchical.GetPath(ctx, blockID)
}
```

---

## 📁 Directory Virtualization

### How Directories Work

Directories in Chronex are **blocks with `type=DIRECTORY`**:

```
Blocks Table:
├─ id: uuid-1, title: "work", type: DIRECTORY, parent_id: null
├─ id: uuid-2, title: "project.md", type: TEXT, parent_id: uuid-1
└─ id: uuid-3, title: "meeting.pdf", type: PDF, parent_id: uuid-1
```

### Directory Operations

```go
func (vfs *VFS) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error) {
    blockID, _ := vfs.PathToBlockID(ctx, name)
    block, _ := vfs.db.GetBlock(ctx, blockID)
    
    if block.Type == DIRECTORY {
        // Return virtual directory listing
        return &VirtualDirectory{
            blockID: blockID,
            vfs: vfs,
        }, nil
    }
    
    if block.Type == TEXT || block.Type == CODE {
        // Return file handle
        return &VirtualFile{
            blockID: blockID,
            content: block.Content,
            vfs: vfs,
        }, nil
    }
    
    return nil, os.ErrPermission
}

type VirtualDirectory struct {
    blockID string
    vfs *VFS
}

func (d *VirtualDirectory) Readdir(ctx context.Context) ([]os.FileInfo, error) {
    // 1. Query blocks with parent_id = d.blockID AND is_deleted = false
    var blocks []*Block
    d.vfs.db.QueryContext(ctx, `
        SELECT id, title, type, timestamp FROM blocks
        WHERE parent_id = ? AND is_deleted = false
        ORDER BY title
    `, d.blockID).Scan(&blocks)
    
    // 2. Convert to os.FileInfo
    var infos []os.FileInfo
    for _, block := range blocks {
        infos = append(infos, &VirtualFileInfo{
            block: block,
        })
    }
    
    return infos, nil
}
```

---

## 🗑️ Trash/Recycle Bin

**Soft Deletes**: Instead of actually deleting, set `is_deleted = true`

```
Blocks Table:
├─ id: uuid-1, title: "project.md", is_deleted: false (original)
└─ id: uuid-1, title: "project.md", is_deleted: true  (deleted copy)
```

### Trash Directory

```go
func (vfs *VFS) Stat(ctx context.Context, name string) (os.FileInfo, error) {
    // Deleted blocks appear in /trash/
    if strings.HasPrefix(name, "/trash/") {
        blockID := vfs.extractIDFromTrashPath(name)
        block, _ := vfs.db.GetBlock(ctx, blockID)
        
        if block != nil && block.IsDeleted {
            return &VirtualFileInfo{block: block}, nil
        }
    }
    
    // Regular files are only visible if not deleted
    blockID, _ := vfs.PathToBlockID(ctx, name)
    block, _ := vfs.db.GetBlock(ctx, blockID)
    
    if block == nil || block.IsDeleted {
        return nil, os.ErrNotExist
    }
    
    return &VirtualFileInfo{block: block}, nil
}

func (vfs *VFS) RemoveAll(ctx context.Context, name string) error {
    blockID, _ := vfs.PathToBlockID(ctx, name)
    
    // Soft delete: set is_deleted = true
    return vfs.db.UpdateBlock(ctx, blockID, map[string]interface{}{
        "is_deleted": true,
    })
}
```

---

## 🔄 Path Caching Strategy

### Three-Level Cache

```go
type PathCache struct {
    // Level 1: In-memory (hot paths)
    hot      map[string]string  // blockID → path (LRU, ~1000 entries)
    hotMutex sync.RWMutex
    
    // Level 2: Filesystem (warm paths)
    warmPath string  // /tmp/chronex-path-cache.db
    warmDB   *sql.DB
    
    // Level 3: Database (cold paths)
    db *sql.DB
}

// Access pattern
func (pc *PathCache) GetPath(blockID string) (string, error) {
    // 1. Check hot cache
    if path, exists := pc.hot[blockID]; exists {
        return path, nil
    }
    
    // 2. Check warm cache (SQLite)
    var path string
    err := pc.warmDB.QueryRow(`SELECT path FROM path_cache WHERE block_id = ?`, blockID).Scan(&path)
    if err == nil {
        // Promote to hot
        pc.hot[blockID] = path
        return path, nil
    }
    
    // 3. Query database
    path, _ = pc.getPathFromDB(blockID)
    
    // Cache in hot + warm
    pc.hot[blockID] = path
    pc.warmDB.Exec(`INSERT OR REPLACE INTO path_cache (block_id, path) VALUES (?, ?)`, blockID, path)
    
    return path, nil
}
```

### Cache Invalidation

```go
// When block metadata changes
func (vfs *VFS) OnBlockUpdated(blockID, fieldChanged string) {
    switch fieldChanged {
    case "title":
        vfs.cache.Invalidate(blockID)  // Path might change
    case "parent_id":
        vfs.cache.Invalidate(blockID)  // Path definitely changes
        vfs.cache.InvalidateChildren(blockID)  // All children paths invalid
    case "tags":
        vfs.cache.InvalidateVirtual("tags")  // Virtual tag paths invalid
    case "timestamp":
        vfs.cache.InvalidateVirtual("dates")  // Virtual date paths invalid
    }
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Data Structures

- [ ] Define `Block` struct with all fields (id, title, parent_id, tags, timestamp, type, is_deleted)
- [ ] Create path resolvers:
  - [ ] `HierarchicalResolver`
  - [ ] `TagVirtualResolver`
  - [ ] `DateVirtualResolver`
  - [ ] `UUIDResolver`
- [ ] Create `HybridVFSResolver` that uses all four

### Phase 2: Database Queries

- [ ] Query: Get block by ID with all metadata
- [ ] Query: Get all children of a block (by parent_id)
- [ ] Query: Get all blocks with specific tag
- [ ] Query: Get blocks created/modified on specific date
- [ ] Index optimization: `INDEX ON parent_id`, `INDEX ON tags`, `INDEX ON timestamp`

### Phase 3: Path Resolution

- [ ] Implement `PathToBlockID()` - resolve path to block UUID
- [ ] Implement `BlockIDToPath()` - get canonical path
- [ ] Test path collisions
- [ ] Test circular references prevention

### Phase 4: Cache Layer

- [ ] Implement three-level cache (hot, warm, cold)
- [ ] Implement invalidation on block updates
- [ ] Test cache hit rates
- [ ] Monitor cache memory usage

### Phase 5: VirtualFile/VirtualDirectory

- [ ] Implement `webdav.File` interface
- [ ] Implement `webdav.FileInfo` interface
- [ ] Support Stat, Open, Close, Read, Write operations
- [ ] Handle directory listing (Readdir)

### Phase 6: Testing

- [ ] Unit tests: Path resolution correctness
- [ ] Unit tests: Cache behavior
- [ ] Integration tests: WebDAV client operations (GET, PUT, DELETE)
- [ ] Edge cases: Circular references, path collisions, special characters in paths

---

## 📊 Example: Complete Request Flow

**GET /notes/work/project.md**:

```
1. VFS.Stat("/notes/work/project.md")
   ├─ PathToBlockID("/notes/work/project.md")
   │  ├─ Check cache: MISS
   │  ├─ Try hierarchical resolver
   │  │  ├─ Extract "notes" → query parent_id for "notes"
   │  │  ├─ Extract "work" → query parent_id for "work" (parent=notes)
   │  │  ├─ Extract "project.md" → query for "project.md" (parent=work)
   │  │  └─ Return uuid-456
   │  └─ Cache: /notes/work/project.md → uuid-456
   │
   ├─ Get block uuid-456 from cache
   ├─ Return os.FileInfo (size, modtime, etc.)
   │
2. Client requests content
   ├─ VFS.OpenFile(uuid-456)
   ├─ Deserialize block content from FlatBuffers
   └─ Stream to client

Total time: ~5ms (with cache), ~50ms (without cache)
```

---

## 🎓 Key Lessons

1. **Hierarchical first, virtual second** - Most users expect folder structure
2. **Cache is critical** - Path lookups happen on every operation
3. **Soft deletes > hard deletes** - Recoverable, less data loss
4. **Multiple paths per block** - One canonical, many virtual
5. **Prevent circular references** - In `parent_id` assignment logic
6. **Validate path names** - No `../`, no null bytes, no unicode issues

