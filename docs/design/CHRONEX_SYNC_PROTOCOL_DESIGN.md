# CHRONEX Sync Protocol Design

**Design Document Version**: 1.0  
**Date**: 2026-04-13  
**Status**: Approved for v1.5 (multi-device)  
**References**: RCLONE_PERFORMANCE_ANALYSIS.md, JOPLIN_PERFORMANCE_ANALYSIS.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## 1. SYNC ARCHITECTURE OVERVIEW

### 1.1 Design Goals

```
From Reference Analysis:
├─ Rclone: Efficient batch operations (2-6 seconds for 1000 blocks)
├─ Joplin: Real-time responsiveness (<500ms for 10 items)
├─ SiYuan: Optional sync (doesn't block local operations)

CHRONEX Sync Requirements:
├─ Latency: <2 seconds for 100 changes (P99)
├─ Batching: Collect changes over 5 minutes
├─ Non-blocking: Never block UI
├─ Conflict resolution: 3-way merge with vector clocks
├─ Offline: Queue changes, sync when online
└─ E2EE: All data encrypted before leaving device
```

### 1.2 Sync Flow Overview

```
User edits block locally
     ↓
Write to local SQLite (immediate, <100ms)
     ↓
Add to sync_queue (immediate)
     ↓
Background sync trigger (every 5 min or manual)
     ↓
Encrypt pending changes (100-500ms, async)
     ↓
POST to server (network dependent)
     ↓
Server stores + detects conflicts (100-300ms)
     ↓
Send delta back to client (200-500ms)
     ↓
Download + decrypt + merge (100-300ms)
     ↓
Update local database
     ↓
Sync complete (<2 seconds total, async)
```

---

## 2. SYNC PROTOCOL SPECIFICATION

### 2.1 Sync Request (Client → Server)

```
POST /api/v1/sync
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request Body:

{
  "device_id": "uuid-device-123",
  
  "last_sync": 1712956800000,           // Unix ms (for delta)
  
  "changes": [
    {
      "id": "uuid-block-001",
      "operation": "create|update|delete",
      
      // For create/update:
      "content_encrypted": "base64(iv || ciphertext || auth_tag)",
      "content_iv": "base64(96-bit nonce)",
      "content_tag": "base64(128-bit auth tag)",
      
      "type": "heading",
      "title": "Learn Rust",                // Plaintext (for search)
      "parent_id": "uuid-block-parent",
      "root_id": "uuid-notebook",
      
      "created_at": 1712956800000,
      "updated_at": 1712956810000,
      "created_by": "uuid-device-123",
      "updated_by": "uuid-device-123",
      
      "version_vector": {                  // Vector clock
        "device-123": 1001,
        "device-456": 998
      }
    },
    ...                                    // More changes (batched)
  ],
  
  "pull_changes_since": 1712956700000     // Ask for server changes since this time
}

Payload Size:
├─ Typical: 100 changes × 500 bytes = 50 KB
├─ With encryption overhead: 50 KB → 55-60 KB
├─ Compressed (gzip): 55 KB → 15-20 KB
└─ TLS wrapped: 15 KB → 16-17 KB (1 TLS record)
```

### 2.2 Sync Response (Server → Client)

```
HTTP/1.1 200 OK
Content-Type: application/json

Response Body:

{
  "status": "success|conflict",
  
  "server_version": 1712956820000,       // New last_sync value
  
  "pushed_changes": [
    {
      "id": "uuid-block-001",
      "server_id": "uuid-server-version", // Unique version ID
      
      "status": "accepted|conflict",
      
      // If conflict:
      "server_version": {                 // What's on server
        "content_encrypted": "...",
        "version_vector": {...},
        "updated_at": 1712956815000,
        "updated_by": "device-456"
      },
      
      "local_version": {...}              // What client sent (for 3-way merge)
    },
    ...
  ],
  
  "pulled_changes": [
    {
      "id": "uuid-block-002",
      "operation": "update",
      
      "content_encrypted": "...",
      "version_vector": {...},
      "updated_at": 1712956818000,
      "updated_by": "device-456",
      
      "conflict": false                   // true if conflicted
    },
    ...
  ],
  
  "meta": {
    "total_changed_blocks": 243,
    "server_sync_version": 1712956820000,
    "next_sync_recommended": "2026-04-13T10:30:00Z"
  }
}

Response Size:
├─ Typical: 100 changes × 500 bytes = 50 KB
├─ Compressed: ~15-20 KB
└─ Network time: 100-300ms (depends on bandwidth)
```

### 2.3 Conflict Detection

```
When both client and server have changes to same block:

Client sends:
├─ Block ID: uuid-block-001
├─ Updated_at: 10:00:01.500
├─ Version vector: {device-A: 1001, device-B: 998}
└─ Content: "Learn Rust"

Server has:
├─ Block ID: uuid-block-001
├─ Updated_at: 10:00:01.000
├─ Version vector: {device-A: 1001, device-B: 999}
└─ Content: "Learn Rust & Go"

Conflict Detection Logic:
├─ Compare version vectors
├─ If device-A's clock advanced: No conflict (A made change)
├─ If device-B's clock advanced: No conflict (B made change)
├─ If both advanced on different devices: CONFLICT
└─ Check content: Are changes in different parts of block?
   ├─ Yes → Auto-merge (3-way merge)
   └─ No → Manual merge (conflict flag)

Resolution:
├─ Auto-merge: Merge changes, save as resolved
├─ Manual merge: Notify user, provide conflict UI
└─ User chooses: Keep local, keep remote, or manual edit
```

### 2.4 Batch Size Recommendations

```
Based on performance analysis:

Small devices (mobile):
├─ Batch size: 10-50 changes
├─ Timeout: 5 minutes
├─ Payload: 5-25 KB
├─ Network time: 100-300ms
└─ Total time: 200-500ms

Normal devices (laptop):
├─ Batch size: 50-200 changes
├─ Timeout: 5 minutes
├─ Payload: 25-100 KB
├─ Network time: 100-500ms
└─ Total time: 300-800ms

Large batch (import):
├─ Batch size: 1000+ changes
├─ Timeout: 10 minutes (or on-demand)
├─ Payload: 500+ KB → Gzip compression
├─ Network time: 500-3000ms
└─ Total time: 1-5 seconds
```

---

## 3. SYNC STATE MACHINE

### 3.1 Client-Side State Machine

```
States:

OFFLINE
├─ Device has no network connection
├─ All writes go to sync_queue
└─ Transition: Network available → SYNCING

SYNCING
├─ Currently uploading changes
├─ Writes still go to queue (don't block UI)
├─ Transition: Upload complete → MERGING

MERGING
├─ Processing server response
├─ Detecting conflicts
├─ 3-way merge algorithm
├─ Transition: Merge complete → IDLE

IDLE
├─ Synced with server
├─ Ready for next sync
├─ Transition: Timer (5 min) or User manual → SYNCING

CONFLICT
├─ User action required
├─ Present conflict UI
├─ Transition: User resolves → SYNCING

ERROR
├─ Network error, server error, etc.
├─ Show error UI
├─ Transition: Retry (exponential backoff) → SYNCING
```

### 3.2 Transition Diagram

```
OFFLINE
   ↑↓ (Network available/lost)
   ↓
SYNCING → MERGING → IDLE
   ↓        ↓
 ERROR    CONFLICT
   ↓        ↓
(retry) (resolve)
   ↓        ↓
SYNCING SYNCING
```

### 3.3 Exponential Backoff

```
When network error occurs during sync:

Attempt 1: Immediate
Attempt 2: After 2 seconds
Attempt 3: After 4 seconds
Attempt 4: After 8 seconds
Attempt 5: After 16 seconds
Attempt 6+: After 32 seconds (capped)

Max retries: 10 (gives up after ~65 seconds)

User notification:
├─ Silent for first 5 seconds
├─ Show spinner after 5 seconds
├─ Show "Sync failed" after 10 seconds
├─ Offer "Retry now" button
└─ Never force retry (user controls)
```

---

## 4. VECTOR CLOCK IMPLEMENTATION

### 4.1 Vector Clock Basics

```
Purpose: Track causality across devices (who changed what, when)

Each device has a logical clock: {device_id: counter}

Example with 2 devices:

Device A starts:
├─ VC: {A: 1}

Device A creates block:
├─ VC: {A: 2}

Device B syncs:
├─ Receives VC: {A: 2}
├─ Updates: {A: 2, B: 1}

Device A edits (locally):
├─ VC: {A: 3, B: 1}

Device B edits different block:
├─ VC: {A: 2, B: 2}

Sync happens:
├─ Merge VCs: {A: 3, B: 2}
├─ No conflict (different blocks)

Same block edited by both:
├─ Device A: {A: 4, B: 2}
├─ Device B: {A: 2, B: 3}
├─ CONFLICT: Both incremented clocks independently
```

### 4.2 Concurrent Edit Detection

```
Algorithm: Check if vectors are concurrent

Vector A: {device-1: 2, device-2: 1}
Vector B: {device-1: 1, device-2: 3}

Compare:
├─ A[device-1]=2 > B[device-1]=1 ✓ (A newer on device-1)
├─ A[device-2]=1 < B[device-2]=3 ✓ (B newer on device-2)
├─ Result: CONCURRENT (both devices advanced independently)
└─ Action: Conflict detected, need 3-way merge

Vector A: {device-1: 3, device-2: 1}
Vector B: {device-1: 2, device-2: 1}

Compare:
├─ A[device-1]=3 > B[device-1]=2 ✓
├─ A[device-2]=1 = B[device-2]=1 ✓
├─ Result: A happened after B
└─ Action: No conflict, accept A's version (simpler)
```

### 4.3 Implementation

```python
# Pseudocode

class VectorClock:
    def __init__(self):
        self.clock = {}  # {device_id: counter}
    
    def increment(self, device_id):
        """Increment clock for this device"""
        if device_id not in self.clock:
            self.clock[device_id] = 0
        self.clock[device_id] += 1
    
    def merge(self, other_vc):
        """Merge with another vector clock (take max per device)"""
        for device_id, counter in other_vc.clock.items():
            if device_id not in self.clock:
                self.clock[device_id] = counter
            else:
                self.clock[device_id] = max(self.clock[device_id], counter)
    
    def is_concurrent(self, other_vc):
        """Check if both vectors advanced independently"""
        newer_count = 0
        older_count = 0
        
        all_devices = set(self.clock.keys()) | set(other_vc.clock.keys())
        
        for device_id in all_devices:
            self_val = self.clock.get(device_id, 0)
            other_val = other_vc.clock.get(device_id, 0)
            
            if self_val > other_val:
                newer_count += 1
            elif self_val < other_val:
                older_count += 1
        
        # Concurrent if both have newer entries
        return newer_count > 0 and older_count > 0
```

---

## 5. THREE-WAY MERGE ALGORITHM

### 5.1 Merge Algorithm

```
When conflict detected, perform 3-way merge:

Three versions of block:

ANCESTOR: Last version both devices had
├─ Content: "# Learning"
├─ Device-A clock: 5
├─ Device-B clock: 5

OURS (Client): Current change
├─ Content: "# Learning Rust"
├─ Device-A clock: 6
├─ Device-B clock: 5

THEIRS (Server): Other device's change
├─ Content: "# Learning & Programming"
├─ Device-A clock: 5
├─ Device-B clock: 6

Merge algorithm:
├─ If OURS == THEIRS: Use either (no conflict)
├─ If OURS == ANCESTOR: Use THEIRS (other device made change)
├─ If THEIRS == ANCESTOR: Use OURS (we made change)
├─ If all different: CONFLICT (both made different changes)
│  └─ Merge at text level: Find common ancestor paragraph
│  └─ If same paragraph changed: Require manual merge
│  └─ If different paragraphs: Auto-merge
└─ Result: Merged content or conflict marker
```

### 5.2 Text-Level Merge

```
Example: Editing same note

ANCESTOR:
"# Learning
This is a note about learning.
Resources: TBD"

OURS (Device A):
"# Learning Rust      ← Changed title
This is a note about learning.
Resources: Rust Book, Exercism"  ← Changed resources

THEIRS (Device B):
"# Learning
This is a note about programming.  ← Changed description
Resources: TBD"

3-way merge:
├─ Title: OURS="Learning Rust" vs THEIRS="Learning"
│  └─ CONFLICT (both changed)
├─ Description: OURS vs THEIRS different
│  └─ CONFLICT (both changed)
├─ Resources: OURS="Rust Book..." vs THEIRS="TBD"
│  └─ CONFLICT (both changed)

Auto-merge possible: NO (same paragraphs edited)

Result: Show conflict to user
├─ Option 1: Keep local version
├─ Option 2: Keep remote version
├─ Option 3: Manual edit (merge both in UI)

After user chooses: Mark conflict resolved, sync again
```

### 5.3 Algorithm Implementation

```python
def three_way_merge(ancestor, ours, theirs):
    """
    Perform 3-way merge on text content
    Returns: (merged_content, has_conflict)
    """
    
    # Simple case: identical
    if ours == theirs:
        return ours, False
    
    # One side didn't change
    if ours == ancestor:
        return theirs, False
    
    if theirs == ancestor:
        return ours, False
    
    # Both sides changed - need diff-based merge
    ours_diff = diff(ancestor, ours)      # What changed on our side
    theirs_diff = diff(ancestor, theirs)  # What changed on their side
    
    # If changes are to different locations: auto-merge
    if not overlapping_ranges(ours_diff, theirs_diff):
        merged = apply_both_diffs(ancestor, ours_diff, theirs_diff)
        return merged, False
    
    # Changes overlap: conflict
    return ours, True  # Default to ours, user can override
```

---

## 6. CONFLICT RESOLUTION UI

### 6.1 Conflict Notification

```
User sees notification:

┌─────────────────────────────────────────┐
│ ⚠️ Sync Conflict                        │
│                                          │
│ Block "Learn Rust" was edited on        │
│ another device. What would you like?    │
│                                          │
│ [Keep Local] [Keep Remote] [Review]    │
└─────────────────────────────────────────┘

User chooses:
├─ Keep Local: Use device's version, sync
├─ Keep Remote: Download remote version, discard local
└─ Review: Open merge UI (side-by-side comparison)

After resolution:
├─ Mark conflict as resolved
├─ Sync changes back
└─ Show success notification
```

### 6.2 Merge UI (Advanced)

```
Side-by-side comparison:

LOCAL (Device A)         │ REMOTE (Device B)
─────────────────────────┼──────────────────
# Learning Rust          │ # Learning
This is a note...        │ This is about programming
Resources:               │ Resources:
- Rust Book             │ - (TBD)
- Exercism              │

Diff highlighted:
- Lines in local only: GREEN
- Lines in remote only: RED
- Same lines: GRAY

User actions:
├─ Select lines from local
├─ Select lines from remote
└─ Custom edit of merged version

Result: Final merged version
```

---

## 7. SYNC PERFORMANCE OPTIMIZATION

### 7.1 Compression Strategy

```
Without compression:
├─ 100 changes × 500 bytes = 50 KB
├─ Network (1 Mbps): 400ms
├─ Total: 400ms + processing

With gzip compression:
├─ 50 KB → 15-20 KB (60-70% reduction)
├─ Network (1 Mbps): 120ms
├─ Compression time: 10-20ms
├─ Total: 130-140ms (3x faster)

With Brotli:
├─ 50 KB → 12-15 KB (70-80% reduction)
├─ Network (1 Mbps): 96ms
├─ Compression time: 50-100ms
├─ Total: 146-196ms (still benefits from network gain)

Recommendation:
├─ Always compress (enable in HTTP headers)
├─ Use gzip (balance between speed and compression)
├─ Server decompresses automatically
└─ Transparent to application
```

### 7.2 Incremental Sync

```
Problem: Resync everything every time is inefficient

Solution: Sync only changes since last_sync

Request:
├─ send: All changes since last_sync
├─ pull: All changes on server since last_sync
└─ Result: Only deltas, not full database

Benefit:
├─ First sync (1000 blocks): 1-5 seconds
├─ Subsequent syncs (10 changes): 200-500ms
├─ Network bandwidth: 1 KB → 5-10 KB

Implementation:
├─ Track last_sync timestamp locally
├─ Query sync_queue WHERE created_at > last_sync
├─ Server returns changes.WHERE updated_at > last_sync
└─ Efficient for active users
```

### 7.3 Parallel Uploads

```
Current: Upload changes sequentially

Optimization: Upload multiple blocks in parallel

Sequential (100 changes):
├─ Change 1: 100ms
├─ Change 2: 100ms
├─ ...
├─ Change 100: 100ms
└─ Total: 10 seconds

Parallel (10 concurrent):
├─ Batch 1 (changes 1-10): 100ms
├─ Batch 2 (changes 11-20): 100ms
├─ ...
├─ Batch 10 (changes 91-100): 100ms
└─ Total: 1 second (10x faster!)

Implementation:
├─ POST /api/blocks/sync accepts array
├─ Batch size: 50-100 per request
├─ Concurrent requests: 3-5
├─ Server processes in order (maintains causality)
└─ Result: 5-10x performance improvement
```

---

## 8. OFFLINE MODE HANDLING

### 8.1 Offline Detection

```
Mechanism: Attempt sync request, handle network errors

if (network_available) {
    initiate_sync()
} else {
    queue_locally()
    show_offline_indicator()
}

Check network:
├─ Try HTTP GET to server (fast healthcheck)
├─ If timeout (>2 seconds): Assume offline
├─ If DNS failure: Assume offline
├─ If connection refused: Server down

Offline indicator:
├─ Show in UI: "Offline - Changes queued"
├─ Don't show error (expected state)
├─ Continue allowing edits
└─ Sync when online (automatic)
```

### 8.2 Offline-First Queue

```
When offline:

User edits block:
├─ Write to local SQLite (immediate)
├─ Add to sync_queue with status='pending'
├─ Show badge: "3 changes queued"
└─ User can continue editing

Queue status:
├─ Persisted to disk (SQLite)
├─ No data loss if app crashes
├─ Can have 1000+ items (no limit)
└─ Total size: Usually <1 MB

When online:
├─ Detect network available
├─ Automatic sync starts (no user action)
├─ Process sync_queue (batched)
├─ Update sync_queue status='synced'
└─ Show success message

User can force sync:
├─ Button: "Sync Now" (always available)
├─ Never wait for timer
├─ Manual > automatic
```

### 8.3 Conflict Resolution Offline

```
Scenario: Both devices edited same block while offline

Timeline:
├─ Device A offline: Edits block → queue
├─ Device B offline: Edits same block → queue
├─ Both come online: Both try to sync

Device A syncs first:
├─ POST changes → Server accepts
├─ Merge complete: No conflict

Device B syncs:
├─ POST changes → Server returns conflict
├─ Server has different version
├─ Client performs 3-way merge

Result:
├─ Device B detects conflict
├─ Show UI: "This block was edited elsewhere"
├─ User resolves: Keep A, Keep B, or Merge
└─ Final state: Both devices eventually consistent
```

---

## 9. SYNC ERROR HANDLING

### 9.1 Error Types and Recovery

```
HTTP 400 Bad Request:
├─ Cause: Invalid request format
├─ Recovery: Log error, show "Sync failed"
├─ Retry: Exponential backoff

HTTP 401 Unauthorized:
├─ Cause: JWT token expired or invalid
├─ Recovery: Request new token (refresh token)
├─ Retry: After token refresh

HTTP 409 Conflict:
├─ Cause: Concurrent changes detected
├─ Recovery: 3-way merge
├─ Retry: After user resolves

HTTP 500 Server Error:
├─ Cause: Server-side issue
├─ Recovery: Exponential backoff
├─ Retry: After 32 seconds

Network Timeout:
├─ Cause: Network unreachable or slow
├─ Recovery: Assume offline, queue changes
├─ Retry: When network available

Decrypt Failed:
├─ Cause: Corrupted encryption or wrong key
├─ Recovery: Show error "Data corrupted"
├─ Retry: Manual recovery from backup
```

---

## 10. IMPLEMENTATION ROADMAP

### v1.5: Basic Sync

```
Features:
├─ Manual sync button: "Sync Now"
├─ Sync queue: Persist pending changes
├─ Encryption: Per-block E2EE
├─ Batching: Collect 1-5 minutes
└─ Error handling: Exponential backoff

Performance:
├─ Sync 100 changes: <2 seconds
├─ Memory overhead: <50 MB
├─ Network: ~50 KB per sync (compressed)

Scope: Personal users, multi-device
```

### v1.6: Advanced Sync

```
Features:
├─ Automatic sync: Every 5 minutes
├─ Vector clocks: Track causality
├─ Conflict detection: Automated 3-way merge
├─ Offline mode: Queue changes locally
└─ Compression: gzip by default

Performance: Same as v1.5

Scope: Professional users, reliable sync
```

### v2.0: Real-Time Sync

```
Features (Future):
├─ WebSocket: Real-time updates
├─ OT/CRDT: Operational transformation
├─ Block-level locks: Prevent conflicts
├─ Presence: See who's editing
└─ Live collaboration: See other's edits in real-time

Scope: Enterprise, teams
```

---

## Summary

**CHRONEX Sync Protocol**: Batched, asynchronous, conflict-aware

**Key Principles**:
- ✅ Batching: 1-5 minute batches (efficient)
- ✅ Async: Never block UI
- ✅ E2EE: Encrypted before sending
- ✅ Conflict detection: Vector clocks + 3-way merge
- ✅ Offline-ready: Queue changes locally
- ✅ Compression: 60-70% bandwidth savings

**Performance SLOs**:
- Sync 100 changes: <2 seconds (async)
- Incremental sync: <500ms (subsequent syncs)
- Conflict detection: <100ms
- 3-way merge: <1 second
- Offline queue: Unlimited size, <1 MB typical

**Error Handling**:
- Network errors: Exponential backoff
- Conflicts: 3-way merge or manual resolution
- Encryption errors: Abort gracefully, show error
- Server errors: Retry with backoff

---

**Document Status**: Design Complete  
**Next**: CHRONEX_ENCRYPTION_AT_REST_DESIGN.md
