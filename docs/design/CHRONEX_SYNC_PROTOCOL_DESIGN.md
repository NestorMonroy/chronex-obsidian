# CHRONEX Sync Protocol Design (UPDATED)

**Design Document Version**: 2.0 (UPDATED to WebDAV)  
**Date**: 2026-04-13  
**Status**: ACTIVE - WebDAV + Vector Clocks  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **COMPLETELY REVISED** to reflect correct architecture:

**OLD (Obsolete)**:
- ❌ REST API endpoints (`POST /api/v1/sync`)
- ❌ Custom JSON protocol
- ❌ Bearer token authentication
- ❌ Custom conflict resolution

**NEW (Official)**:
- ✅ WebDAV Protocol (RFC 4918)
- ✅ Standard HTTP methods (GET, PUT, DELETE, PROPFIND)
- ✅ Basic/Digest authentication
- ✅ Vector clocks + 3-way merge (still valid)

---

## 1. SYNC ARCHITECTURE OVERVIEW

### 1.1 Design Goals

```
From Reference Analysis:
├─ Rclone: Efficient batch operations (proven reliable)
├─ Joplin: Real-time responsiveness (<500ms)
├─ SiYuan: Optional sync (local-first)

CHRONEX Sync via WebDAV:
├─ Latency: <2 seconds for 100 changes (P99)
├─ Protocol: WebDAV (RFC 4918, standard)
├─ Authentication: Basic/Digest (standard)
├─ Conflict resolution: Vector clocks + 3-way merge
├─ Offline: Queue changes, sync when online
├─ E2EE: Optional block-level encryption
└─ Batching: Every 5 minutes or on-demand
```

### 1.2 Sync Flow Overview (WebDAV)

```
User edits block locally
     ↓
Write to local SQLite (immediate, <100ms)
     ↓
Add to sync_queue (immediate)
     ↓
Background sync trigger (every 5 min or manual)
     ↓
Encrypt block (optional, <5ms)
     ↓
PUT to WebDAV server (network dependent)
     ↓
Server receives If-Match header (ETag)
     ├─ If match: Accept changes
     ├─ If no match: Conflict detected!
     │  ├─ Return 412 Precondition Failed
     │  ├─ Client re-fetches latest version
     │  └─ Consult vector clocks
     └─ On success: Update ETag, return 204
     ↓
Server generates sync_operation
     ├─ Increment device's vector clock
     ├─ Record operation type (create|update|delete)
     └─ Broadcast to connected clients
     ↓
Other devices PROPFIND / GET updated block
     ├─ Fetch latest version
     ├─ Update local SQLite
     └─ Notify user of changes
     ↓
Sync complete (<2 seconds, async)
```

---

## 2. WEBDAV SYNC SPECIFICATION

### 2.1 Client → Server: PUT (Create/Update Block)

```
PUT /My%20Notebook/Block%20Title.md HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWxpY2U6c2VjcmV0
Content-Type: text/markdown
Content-Length: 1234
If-Match: "abc123def456"

[encrypted block content or plaintext markdown]

Server Response (success):
HTTP/1.1 204 No Content
ETag: "new_hash_789xyz"

Server Response (conflict):
HTTP/1.1 412 Precondition Failed

Client Logic:
├─ If 204: Sync successful, update local state
├─ If 412: Conflict!
│  ├─ Fetch latest version with GET
│  ├─ Check vector clocks
│  ├─ Attempt 3-way merge
│  ├─ Retry PUT with new If-Match
│  └─ Or notify user of conflict
└─ Increment device's vector clock after success
```

### 2.2 Server: Vector Clock Management

```
Each block stores vector_clock: {device_id: logical_clock}

Example:
Desktop edits block:
├─ Current vector_clock: {desktop: 5, tablet: 3}
├─ Desktop increments: {desktop: 6, tablet: 3}
├─ Server receives PUT
├─ ETag matches (device in sync with previous version)
├─ Server accepts changes
├─ Server updates: {desktop: 6, tablet: 3}
└─ Server broadcasts new ETag to other devices

Tablet reads block:
├─ Tablet has: {desktop: 5, tablet: 2}
├─ Server has: {desktop: 6, tablet: 3}
├─ Tablet is behind
├─ PROPFIND / GET fetches new version
├─ Tablet updates local: {desktop: 6, tablet: 3}
├─ Tablet edits block
├─ Tablet increments: {desktop: 6, tablet: 4}
└─ Tablet syncs back to server
```

### 2.3 Conflict Detection & Resolution

```
Scenario: Two devices edit same block concurrently

Timeline:
1. Both read same version, get ETag: "v1"
2. Desktop edits, PUT with If-Match: "v1"
   ├─ Server accepts (match)
   ├─ Updates ETag to "v2"
   ├─ Vector clock: {desktop: 6, tablet: 3}
3. Tablet edits, PUT with If-Match: "v1"
   ├─ Server rejects (no match, now "v2")
   ├─ Returns 412 Precondition Failed

Tablet Resolution:
├─ Gets 412, fetches latest (ETag: "v2")
├─ Sees vector clocks: {desktop: 6, tablet: 3}
├─ Desktop is ahead in logical time
├─ Attempts 3-way merge:
│  ├─ Base version (from history)
│  ├─ Desktop version (v2)
│  ├─ Tablet version (local edits)
│  └─ Merge algorithms tries to combine
├─ If merge successful:
│  ├─ Create merged version
│  ├─ PUT merged content with If-Match: "v2"
│  ├─ Server accepts (new sync_operation)
│  └─ Tablet increments: {desktop: 6, tablet: 4}
├─ If merge fails (real conflict):
│  ├─ Create conflict marker: "[CONFLICT] Block Title"
│  ├─ Keep both versions
│  ├─ Notify user
│  └─ Wait for manual resolution
```

### 2.4 3-Way Merge Algorithm

```
merge(base, ours, theirs) {
  if (ours == theirs) return ours;              // No conflict
  if (ours == base) return theirs;              // They changed, we didn't
  if (theirs == base) return ours;              // We changed, they didn't
  
  // Both changed (conflict)
  // Try content-based merge
  merged = contentMerge(base, ours, theirs);
  if (merged && !hasConflictMarkers(merged)) {
    return merged;                              // Auto-merge succeeded
  }
  
  // Auto-merge failed
  return CONFLICT {
    base: base,
    ours: ours,
    theirs: theirs,
    status: "needs_manual_resolution"
  };
}

Example:
Base:    "This is a note"
Ours:    "This is my note"        (we added "my")
Theirs:  "This is a great note"   (they added "great")

Result:  "This is my great note"  (auto-merged!)


Another example:
Base:    "The feature is important"
Ours:    "The feature is amazing"  (changed "important" → "amazing")
Theirs:  "The feature is critical"  (changed "important" → "critical")

Result:  CONFLICT (both edited same word)
         <<<<<<< OURS
         The feature is amazing
         =======
         The feature is critical
         >>>>>>> THEIRS
```

---

## 3. MULTI-DEVICE SYNC FLOW

### 3.1 Desktop as Server + Tablet as Client

```
Desktop (Chronex Server):
├─ chronex serve webdav \
│    --addr 192.168.1.100:8080 \
│    --vfs-cache-mode full \
│    --vfs-cache-poll-interval 5m
│
└─ Serves blocks via WebDAV

Tablet (Obsidian via WebDAV):
├─ Connects to: http://192.168.1.100:8080/
├─ Authenticates with alice:secret
├─ Lists notebooks: PROPFIND /
├─ Opens note: GET /My%20Notebook/Note.md
├─ Edits note: PUT /My%20Notebook/Note.md
├─ If-Match header prevents conflicts
└─ Changes sync immediately or on next interval

Both devices:
├─ Share SQLite database (via WebDAV)
├─ Use vector clocks for ordering
├─ Resolve conflicts via 3-way merge
└─ Eventually consistent
```

### 3.2 Desktop ↔ Cloud (Optional v1.5)

```
Desktop (Chronex Server):
├─ Serves local blocks via WebDAV
├─ ALSO acts as client to cloud
├─ chronex sync daemon \
│    --remote nextcloud \
│    --interval 5m \
│    --conflict-strategy vector_clock

Nextcloud Cloud:
├─ Contains master copy of blocks
├─ Desktop syncs to/from Nextcloud
├─ Tablet can sync via Nextcloud WebDAV

Sync Chain:
Desktop ↔ Nextcloud ↔ Tablet
  (v1.0)    (v1.5)    (v1.0)

Result:
├─ All devices eventually consistent
├─ Nextcloud is backup/master
├─ Desktop acts as local cache/relay
└─ Private (no data in device clouds)
```

---

## 4. PROTOCOL OPERATIONS (WebDAV Standard)

### 4.1 List Notebooks (PROPFIND)

```
PROPFIND / HTTP/1.1
Authorization: Basic YWlpY2U6c2VjcmV0
Depth: 1

Server Response:
┌─────────────────┐
│ My Notebook 1   │ folder
├─────────────────┤
│ My Notebook 2   │ folder
├─────────────────┤
│ Archived        │ folder
└─────────────────┘

Implementation:
├─ Query SQLite: SELECT * FROM notebooks
├─ Return as WebDAV collection
└─ Client sees folders
```

### 4.2 List Blocks in Notebook (PROPFIND)

```
PROPFIND /My%20Notebook/ HTTP/1.1
Authorization: Basic YWlpY2U6c2VjcmV0
Depth: 1

Server Response:
┌──────────────────┐
│ Block 1.md       │ 1.5KB, modified 10:00
├──────────────────┤
│ Block 2.md       │ 2.3KB, modified 10:05
├──────────────────┤
│ Subfolder        │ folder
└──────────────────┘

Implementation:
├─ Query SQLite: SELECT * FROM blocks WHERE notebook_id = X
├─ Return as WebDAV files
├─ Include ETag (FastCDC hash)
└─ Include Last-Modified (updated_at)
```

### 4.3 Read Block (GET)

```
GET /My%20Notebook/Block%201.md HTTP/1.1
Authorization: Basic YWlpY2U6c2VjcmV0

Server Response:
HTTP/1.1 200 OK
Content-Type: text/markdown
ETag: "hash123"
Last-Modified: Mon, 13 Apr 2026 10:00:00 GMT
Content-Length: 1234

# Block Title

Block content here...

Implementation:
├─ Load block from SQLite
├─ Decrypt if E2EE enabled
├─ Return as file
├─ Set ETag = FastCDC(content)
└─ Set Last-Modified = updated_at
```

### 4.4 Write Block (PUT)

```
PUT /My%20Notebook/Block%201.md HTTP/1.1
Authorization: Basic YWlpY2U6c2VjcmV0
If-Match: "hash123"
Content-Type: text/markdown
Content-Length: 1500

# Block Title (Updated)

Updated content...

Server Logic:
├─ Check If-Match against current ETag
├─ If match:
│  ├─ Accept write
│  ├─ Create sync_operation
│  ├─ Update vector clock
│  ├─ Calculate new ETag
│  ├─ Return 204 No Content
│  └─ Broadcast to other clients
├─ If no match (conflict):
│  ├─ Fetch both versions (ours, theirs)
│  ├─ Attempt 3-way merge
│  ├─ Return 412 Precondition Failed
│  └─ Let client handle resolution
```

### 4.5 Delete Block (DELETE)

```
DELETE /My%20Notebook/Block%201.md HTTP/1.1
Authorization: Basic YWlpY2U6c2VjcmV0

Server Response:
HTTP/1.1 204 No Content

Implementation:
├─ Soft delete: Set deleted_at = NOW()
├─ Create sync_operation
├─ Block still in SQLite (recoverable)
├─ PROPFIND no longer lists it
└─ Return 204
```

---

## 5. SYNC CONFIGURATION

### 5.1 Server Configuration

```toml
# ~/.chronex/server.toml

[sync]
# Poll remote for changes
poll_interval = "5m"        # Check remote every 5 minutes
poll_timeout = "30s"        # Timeout for poll request

# Conflict strategy
conflict_strategy = "vector_clock"  # or "last_write_wins"

# Batching
batch_size = 100            # Max operations per sync
batch_timeout = "5m"        # Wait up to 5 min before syncing

# Vector clock
vector_clock_increment = 1  # Logical clock increment per operation

# Cache
vfs_cache_mode = "full"
vfs_cache_poll_interval = "5m"
```

### 5.2 Client Configuration

```toml
# ~/.chronex/client.toml

[sync]
# Remote server
remote_type = "webdav"
remote_url = "https://nextcloud.example.com/remote.php/webdav"
remote_user = "alice"
remote_pass = "secret"

# Sync behavior
sync_interval = "5m"
conflict_strategy = "vector_clock"  # or "manual"
auto_merge = true
conflict_marker_style = "unified"   # or "hunk"

# Retry logic
max_retries = 3
retry_delay_ms = 1000
```

---

## 6. PERFORMANCE TARGETS (Still Valid)

```
Operation                   P99 Latency
───────────────────────────────────────
PUT (write block)          <200ms
GET (read block)           <100ms
PROPFIND (list blocks)     <300ms
DELETE (soft delete)       <150ms
Merge (3-way)              <100ms
Conflict detection         <50ms

Sync batching:
├─ 100 changes: <2 seconds
├─ 1000 changes: <5 seconds
└─ Network = bottleneck (not CPU)
```

---

## 7. SUMMARY

**Protocol**: WebDAV (RFC 4918) + Vector Clocks
- ✅ Standard HTTP methods (GET, PUT, DELETE, PROPFIND)
- ✅ ETag-based conflict detection
- ✅ If-Match for optimistic locking
- ✅ Vector clocks for causality tracking
- ✅ 3-way merge for auto-resolution
- ✅ Soft deletes for recovery

**Sync Characteristics**:
- ✅ <2 seconds for 100 changes (P99)
- ✅ Offline-capable (queue + retry)
- ✅ Multi-device safe (via vector clocks)
- ✅ Conflict resolution (auto + manual)
- ✅ E2EE optional (block-level encryption)

**Advantages**:
- ✅ Standard WebDAV protocol (proven, universal)
- ✅ Any WebDAV client works (Obsidian, WinSCP, etc.)
- ✅ Vector clocks ensure causal ordering
- ✅ 3-way merge handles most conflicts automatically
- ✅ No custom protocol needed

---

**Document Status**: Updated to WebDAV + Vector Clocks  
**Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md (primary)  
**Protocol**: RFC 4918 (WebDAV) + Vector Clocks
