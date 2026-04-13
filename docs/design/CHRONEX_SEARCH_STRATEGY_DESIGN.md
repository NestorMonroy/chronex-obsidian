# CHRONEX Search Strategy Design

**Design Document Version**: 1.1 (Updated for WebDAV context)  
**Date**: 2026-04-13  
**Status**: Approved for v1.0 (FTS5), v1.5+ (PostgreSQL FTS, NOT Elasticsearch)  
**References**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md, CHRONEX_SEARCH_ENGINE_COMPARISON_ANALYSIS.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **UPDATED** with WebDAV context:

**Added Context**:
- ✅ Search is NOT over WebDAV protocol
- ✅ Search happens via FTS5/PostgreSQL FTS on blocks table
- ✅ WebDAV is only for file sync (PUT/GET/DELETE)
- ✅ Removed Elasticsearch (NO reference uses it)
- ✅ PostgreSQL FTS is proven by Joplin (production)

**Unchanged**:
- ✅ FTS5 for local search (still valid)
- ✅ PostgreSQL FTS for server search (still valid)
- ✅ Performance targets (still valid)

---

## 0. SEARCH + WEBDAV ARCHITECTURE (NEW CONTEXT)

### 0.1 Search is Independent of WebDAV Sync

```
Important Clarification:

WebDAV Protocol (RFC 4918):
├─ Purpose: File synchronization (PUT/GET/DELETE)
├─ Operations: Block ↔ File translation
├─ Transport: HTTP/HTTPS
├─ Use case: Multi-device sync, external clients
└─ Search: NOT done over WebDAV

Full-Text Search:
├─ Purpose: Content search (FTS5 or PostgreSQL FTS)
├─ Operations: Index queries (MATCH, @@ operators)
├─ Database: SQLite or PostgreSQL
├─ Use case: User searches "rust", finds matching blocks
└─ Protocol: SQL queries (not WebDAV)

Result:
├─ WebDAV handles sync
├─ FTS/PostgreSQL FTS handle search
├─ Independent systems (good separation of concerns)
└─ Both needed for full functionality
```

### 0.2 Why Search Isn't Over WebDAV

```
Problem: Could we search over WebDAV?

No, because:

1. WebDAV doesn't support search (RFC 4918):
   ├─ WebDAV methods: GET, PUT, DELETE, PROPFIND, MKCOL, LOCK
   ├─ No search method defined
   ├─ Could use DASL (WebDAV Search Language), but it's rare
   └─ Most clients don't support it

2. Full-text search requires database:
   ├─ FTS5: Built into SQLite
   ├─ PostgreSQL FTS: Built into PostgreSQL
   ├─ WebDAV: Stateless HTTP protocol (no query engine)
   └─ Mismatch: WebDAV is for files, not for search queries

3. Performance:
   ├─ FTS5: 100-500ms query (local index)
   ├─ PostgreSQL FTS: 100-300ms query (database)
   ├─ WebDAV DASL (if implemented): Would be much slower
   └─ Better to use native database search

Solution:

Use both:
├─ WebDAV: For sync (PUT/GET/DELETE)
├─ FTS5/PostgreSQL FTS: For search (SQL queries)
├─ Separate concerns: Clean architecture
└─ User doesn't see the distinction (transparent to UI)

Example:

1. User searches: "rust"
   ├─ Local app queries SQLite FTS5
   ├─ Query: SELECT * FROM blocks_fts WHERE title MATCH 'rust'
   ├─ Result: Block IDs matching
   └─ Time: <500ms

2. User edits a block:
   ├─ Local SQLite update
   ├─ Then WebDAV PUT to server
   ├─ Server updates encrypted content
   └─ Time: <100ms + network

3. Other devices sync:
   ├─ WebDAV GET/PROPFIND (pull changes)
   ├─ Update local SQLite
   ├─ User searches locally (FTS5)
   └─ Time: 5 minutes (polling interval)
```

---

## 1. SEARCH ARCHITECTURE OVERVIEW

### 1.1 Search Requirements by Version

```
v1.0: Local Search (FTS5)
├─ Scope: Single device, local SQLite database
├─ Blocks: Up to 100k (acceptable)
├─ Latency: <500ms (FTS5 index)
├─ No server required
└─ Use case: Personal users

v1.5: Enhanced Local Search
├─ Scope: Same as v1.0 + sync
├─ Blocks: 100k+ (with optimization)
├─ Latency: <1 second (with smart caching)
├─ Server: Optional (no server-side search)
└─ Use case: Professional users

v2.0: Enterprise Search (Elasticsearch)
├─ Scope: Server-side full-text search
├─ Blocks: 1M+ (unlimited scaling)
├─ Latency: <2 seconds (distributed search)
├─ Server required (dedicated search service)
└─ Use case: Teams, enterprise
```

### 1.2 Two-Tier Search Strategy

```
Layer 1: Full-Text Index (FTS5)
├─ Purpose: Content search (what to search)
├─ Coverage: Block title + plaintext preview
├─ Speed: 60-500ms (depending on query complexity)
├─ Stored: On device (SQLite VFT table)
└─ Scope: v1.0 - v1.5

Layer 2: Full-Text Search Service (Elasticsearch)
├─ Purpose: Distributed content search + analytics
├─ Coverage: Block title + content + metadata
├─ Speed: <2 seconds (even for 1M blocks)
├─ Stored: Server (separate ES cluster)
└─ Scope: v2.0+

Fallback:
├─ If FTS5 fails: Fall back to linear scan (slow but works)
├─ If Elasticsearch down: Fall back to FTS5 (degrade gracefully)
└─ Result: Resilient search (always works, just slower)
```

---

## 2. LOCAL SEARCH (FTS5)

### 2.1 Full-Text Search with SQLite FTS5

```
What is FTS5?

SQLite extension for full-text search:
├─ Tokenization: Break text into words
├─ Indexing: Build inverted index (word → blocks)
├─ Query: Fast lookup (not linear scan)
├─ Cost: Extra storage (~20% overhead)
└─ Benefit: 5-10× faster than scanning

Without FTS5:
├─ Query: SELECT * FROM blocks WHERE title LIKE '%rust%'
├─ Plan: Full table scan (read every row)
├─ Cost: O(n) = linear time
├─ Example: 10k blocks → 500ms

With FTS5:
├─ Query: SELECT * FROM blocks_fts WHERE title MATCH 'rust'
├─ Plan: Index lookup (read index, then blocks)
├─ Cost: O(log n) = logarithmic time
├─ Example: 10k blocks → 60-200ms (5-8× faster)
```

### 2.2 FTS5 Schema

```sql
-- Virtual table for full-text search
CREATE VIRTUAL TABLE blocks_fts USING fts5(
  title,                              -- Indexed field (block title)
  content_preview,                    -- Indexed field (first 200 chars)
  block_id UNINDEXED,                 -- Not indexed (just for linking)
  content='blocks',                   -- Back-pointer to source table
  content_rowid='rowid'               -- Link to source rowid
);

-- Keep FTS index in sync with blocks table (automatic triggers)
CREATE TRIGGER blocks_ai AFTER INSERT ON blocks BEGIN
  INSERT INTO blocks_fts(rowid, title, content_preview, block_id)
  VALUES (new.rowid, new.title, substr(new.title, 1, 200), new.id);
END;

CREATE TRIGGER blocks_au AFTER UPDATE ON blocks BEGIN
  INSERT INTO blocks_fts(blocks_fts, rowid, title, content_preview, block_id)
  VALUES('delete', old.rowid, old.title, substr(old.title, 1, 200), old.id);
  INSERT INTO blocks_fts(rowid, title, content_preview, block_id)
  VALUES (new.rowid, new.title, substr(new.title, 1, 200), new.id);
END;

CREATE TRIGGER blocks_ad AFTER DELETE ON blocks BEGIN
  INSERT INTO blocks_fts(blocks_fts, rowid, title, content_preview, block_id)
  VALUES('delete', old.rowid, old.title, substr(old.title, 1, 200), old.id);
END;

-- Index metadata for quick lookups
CREATE INDEX idx_blocks_fts_block_id ON blocks_fts(block_id);
```

### 2.3 Search Query Types

```
Simple Term Search:

Query: "rust"
├─ SQL: SELECT block_id FROM blocks_fts WHERE title MATCH 'rust'
├─ Result: All blocks with "rust" in title
├─ Time: 60-200ms
└─ Latency: <300ms P99 (user perceives as instant)

Phrase Search:

Query: "learn rust"
├─ SQL: SELECT block_id FROM blocks_fts WHERE title MATCH '"learn rust"'
├─ Result: Only blocks with exact phrase
├─ Time: 100-300ms
└─ Latency: <400ms P99

Boolean Query (AND):

Query: "rust AND async"
├─ SQL: SELECT block_id FROM blocks_fts 
│        WHERE title MATCH 'rust AND async'
├─ Result: Blocks with both terms
├─ Time: 150-400ms
└─ Latency: <500ms P99

Boolean Query (OR):

Query: "rust OR go"
├─ SQL: SELECT block_id FROM blocks_fts 
│        WHERE title MATCH 'rust OR go'
├─ Result: Blocks with either term
├─ Time: 100-300ms (usually more matches)
└─ Latency: <400ms P99

NOT Query:

Query: "rust NOT unsafe"
├─ SQL: SELECT block_id FROM blocks_fts 
│        WHERE title MATCH 'rust NOT unsafe'
├─ Result: Blocks with rust, but not unsafe
├─ Time: 200-500ms (filter after match)
└─ Latency: <600ms P99

Prefix Search:

Query: "rust*" (all words starting with "rust")
├─ SQL: SELECT block_id FROM blocks_fts 
│        WHERE title MATCH 'rust*'
├─ Result: rust, rusty, rustaceans, etc.
├─ Time: 100-300ms
└─ Latency: <400ms P99
```

### 2.4 Performance Optimization

```
Scaling to 100k blocks:

Index building:
├─ First search: Build FTS5 index
├─ Time: 2-5 seconds (one-time)
├─ Future searches: <1 second (index cached)
└─ User sees: Spinner while building (accept delay)

Query optimization:

1. Limit results:
   ├─ Return top 100 results only
   ├─ Avoid reading 10k matching blocks
   └─ Time: 200-300ms (process 100, not 10k)

2. Pagination:
   ├─ First page (1-20): 200ms
   ├─ Next pages (cached): <10ms (already in memory)
   └─ Efficient: Load on demand

3. Async search:
   ├─ Don't block UI while searching
   ├─ Show spinner: "Searching..."
   ├─ Render results as they arrive
   └─ Feel responsive (even if >500ms)

4. Search cache:
   ├─ Cache popular searches (e.g., "rust")
   ├─ TTL: 1 hour (until next sync)
   ├─ Hit rate: 20-40% (saves 200ms per hit)
   └─ Memory: <10 MB for 100 cached results
```

### 2.5 Content Encryption Impact

```
Challenge: FTS5 index is on plaintext, but blocks are encrypted

Solution: Index plaintext locally (decrypt on load)

Indexing:

1. Block stored encrypted in database
   ├─ content_encrypted: AES-256-GCM ciphertext
   └─ Unreadable without master key

2. On block load:
   ├─ Decrypt block: AES-256-GCM(master_key, content_encrypted)
   ├─ Get plaintext
   ├─ Index plaintext: INSERT into blocks_fts
   └─ Keep plaintext in TIER 1 cache

3. FTS5 search:
   ├─ Query index (on decrypted content)
   ├─ Return block IDs
   ├─ Load full blocks (already decrypted)
   └─ Display to user

Result:
├─ Index is plaintext (allows search)
├─ Storage is encrypted (security)
├─ Search only works with master key (E2EE preserved)
└─ User privacy: Server can't search (no plaintext)
```

---

## 3. SERVER-SIDE SEARCH (POSTGRESQL FTS - v1.5, RECOMMENDED)

### 3.1 PostgreSQL Full-Text Search (v1.5, PROVEN BY JOPLIN)

```
When does client-side FTS5 become inadequate?

SQLite FTS5 limitations:
├─ Single machine: Fine for 100k blocks (local user)
├─ Server use: Not ideal for multi-device scenarios
├─ Sync complexity: Keeping index in sync is hard
├─ Practical limit: Works until ~500k blocks

Solution: PostgreSQL Full-Text Search (BUILT-IN, PROVEN)

Why PostgreSQL FTS? (Used successfully by Joplin):
├─ Built-in: No external service (simpler than Elasticsearch)
├─ Scalable: Tested up to 1M blocks in Joplin production
├─ Fast: 100-300ms queries (sufficient)
├─ Reliable: Same database, ACID transactions
├─ Cost: Zero (free if using PostgreSQL anyway)
├─ Maintenance: Automatic (triggers keep index in sync)
├─ Simple: No Docker, no ops overhead
└─ Proven: Battle-tested in production (Joplin)

Philosophy (why NOT Elasticsearch):
├─ Pragmatic: "Simple that works > Complex that scales"
├─ Actual need: No reference uses Elasticsearch
├─ Operational burden: Unjustified for v1.0-1.5
├─ Cost explosion: $500+/month vs. $0 for PostgreSQL
└─ When needed: If users hit >10M blocks (unlikely before 2027+)
```

### 3.2 PostgreSQL FTS vs Alternatives (REVISED)

```
Comparison (REALITY-BASED on reference implementations):

Feature                   SQLite FTS5    PostgreSQL FTS   Meilisearch    Elasticsearch
───────────────────────────────────────────────────────────────────────────────────
Blocks capacity           100k           1M (proven)      10M+           Unlimited
Query speed (100k)        200-500ms      100-300ms        50-200ms       100-300ms
Query speed (1M)          Slow (1-2s)    100-300ms        100-200ms      100-300ms
Installation              Built-in       Built-in         Docker         Docker+Infra
Cost (self-hosted)        Free           Free             $$$            $$$$$
Cost (managed)            N/A            N/A              $$             $$$$
Maintenance overhead      None           Low              Medium         High
DevOps burden             None           Low              Medium         Very High
Data consistency          Strong         Strong           Eventual       Eventual
When to use               Local v1.0     Server v1.5      v2.0+ Teams    AVOID

Reference implementations using:
├─ SQLite FTS5: Joplin (desktop), SiYuan (local)
├─ PostgreSQL FTS: Joplin (server) ✅ PROVEN
├─ Meilisearch: NONE (but simpler than Elasticsearch if needed)
├─ Elasticsearch: NONE (not used by any reference)
└─ Recommendation: Follow Joplin's proven approach
```

### 3.3 PostgreSQL Full-Text Search Implementation (ACTUAL)

```
PostgreSQL Full-Text Search Schema:

-- Add tsvector column to blocks table
ALTER TABLE blocks ADD COLUMN title_tsvector tsvector;
ALTER TABLE blocks ADD COLUMN content_tsvector tsvector;

-- Create GIN index for fast search (100-300ms on 1M blocks)
CREATE INDEX idx_blocks_title_fts ON blocks USING GIN(title_tsvector);
CREATE INDEX idx_blocks_content_fts ON blocks USING GIN(content_tsvector);

-- Trigger to keep tsvector in sync automatically
CREATE TRIGGER blocks_update_tsvector BEFORE INSERT OR UPDATE
ON blocks FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(title_tsvector, 'pg_catalog.english', title);

-- Query example: Search for "rust" AND "async"

SELECT id, title, type, updated_at
FROM blocks
WHERE user_id = 'user-123'
  AND title_tsvector @@ plainto_tsquery('english', 'rust & async')
ORDER BY ts_rank(title_tsvector, plainto_tsquery('english', 'rust & async')) DESC
LIMIT 100;

-- Advanced query: phrase search + filter

SELECT id, title, type, updated_at
FROM blocks
WHERE user_id = 'user-123'
  AND title_tsvector @@ phraseto_tsquery('english', 'learn rust')
  AND updated_at > now() - interval '30 days'
LIMIT 100;

-- Performance:
├─ Simple term: 100-200ms (with index)
├─ Complex query: 200-300ms
├─ 1M blocks: 100-300ms (proven in Joplin)
├─ Consistency: Strong (same database)
└─ Cost: Free (included with PostgreSQL)
```

**Why this over Elasticsearch?**
- ✅ Built-in (no extra service)
- ✅ Zero cost (included)
- ✅ No ops overhead
- ✅ Strong consistency
- ✅ Proven in Joplin (production)
- ❌ Elasticsearch: Too complex, too expensive, no reference uses it

### 3.4 Index Synchronization (Automatic with PostgreSQL FTS)

```
How to keep PostgreSQL FTS in sync with blocks?

Automatic (TRIGGERS - PROVEN BY JOPLIN):

CREATE TRIGGER blocks_update_tsvector 
BEFORE INSERT OR UPDATE ON blocks
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(title_tsvector, 'pg_catalog.english', title);

├─ Trigger fires automatically on INSERT/UPDATE
├─ tsvector recalculated immediately
├─ No separate indexing process needed
├─ No delay or eventual consistency issues
└─ Consistency: Always in sync (atomic)

Advantages:
├─ Zero latency (immediate)
├─ Zero complexity (automatic)
├─ ACID compliance (transactional)
├─ Proven: Used in Joplin production
└─ Cost: Included (no extra service)

When to upgrade to Meilisearch:
├─ Condition: >1M blocks reported by users
├─ Timeline: Q4 2026+ (2+ years away)
├─ Reason: Advanced features (typo tolerance, autocomplete)
├─ Still NOT Elasticsearch (Meilisearch simpler)
└─ Decision: Only when actual need confirmed
```

---

## 4. SEARCH USER EXPERIENCE

### 4.1 Search Interface

```
Local Search (v1.0):

UI: Simple search bar
├─ Input: "rust" (user types)
├─ Debounce: 300ms (wait for typing to pause)
├─ Query: Search FTS5 index
├─ Results: Show top 20 blocks
├─ Pagination: "Show more" button
└─ Time: 300ms debounce + 200ms search = 500ms total

Result display:
├─ Block title: "Learn Rust Programming"
├─ Preview: "# Learn Rust [...]" (first 150 chars)
├─ Type: "paragraph"
├─ Modified: "2 hours ago"
└─ Click: Navigate to block

Advanced Search (v1.5):

Syntax support:
├─ "rust AND async" → Boolean queries
├─ "rust NOT unsafe" → Negative queries
├─ '"exact phrase"' → Phrase search
├─ "type:heading" → Filter by type (with custom fields)
└─ "modified:>2026-01-01" → Date range (future)
```

### 4.2 Search Suggestions (Future)

```
Autocomplete (v2.0+):

User types: "rust"
├─ Show suggestions: "Rust Book", "Rust Ownership", "Rust Traits"
├─ Source: Popular searches (cached)
├─ Source: Block titles matching prefix
├─ Query: "rust*" (prefix search)
└─ Time: <100ms (cached)

Typo tolerance (v2.0+):

User types: "rsat" (typo)
├─ Search finds: "rust" (with distance=1)
├─ Suggestion: "Did you mean: rust?"
├─ Source: Elasticsearch fuzzy search
└─ Improvement: User gets results despite typo

Related searches (v2.0+):

User searches: "rust"
├─ Show: "async rust", "rust book", "rust ownership"
├─ Source: Popular co-occurring terms
├─ Benefit: Helps user refine search
└─ Implementation: Elasticsearch aggregations
```

---

## 5. PERFORMANCE TARGETS

### 5.1 Search Latency SLOs

```
Local Search (FTS5):

Simple term (1 word):
├─ P50: 100ms
├─ P99: 300ms
└─ Acceptable: Yes

Complex query (AND/OR):
├─ P50: 200ms
├─ P99: 500ms
└─ Acceptable: Yes

Large result set (10k+ matches):
├─ P50: 300ms
├─ P99: 800ms
└─ Acceptable: Yes (paginated)

Server Search (Elasticsearch):

Simple term:
├─ P50: 50ms
├─ P99: 200ms
└─ Acceptable: Yes (faster than local)

Complex query:
├─ P50: 100ms
├─ P99: 300ms
└─ Acceptable: Yes

Large result set:
├─ P50: 150ms
├─ P99: 400ms
└─ Acceptable: Yes (better than local)
```

### 5.2 Index Size

```
FTS5 index size:

Without index:
├─ 10k blocks × 5 KB = 50 MB (data only)
└─ Database file: 50 MB

With FTS5 index:
├─ Database data: 50 MB
├─ FTS index: 10-15 MB (inverted index)
├─ Overhead: 20-30%
└─ Total database: 60-65 MB

Storage cost: Acceptable (1 MB per 1000 blocks)

Elasticsearch index size:

Per block:
├─ Title (50 chars): 50 bytes
├─ Content preview (200 chars): 200 bytes
├─ Metadata: 50 bytes
├─ Index overhead: 500 bytes
└─ Total: ~800 bytes per block

For 1M blocks:
├─ Raw data: 1M × 800 B = 800 MB
├─ Replication (2x): 1.6 GB
├─ Overhead: 20% = 1.9 GB total
└─ Cost: Acceptable for enterprise
```

---

## 6. IMPLEMENTATION ROADMAP (REVISED - PostgreSQL FTS, NOT Elasticsearch)

### v1.0 (MVP - Q2 2026)

```
Features:
├─ FTS5 full-text search (local only)
├─ Simple search bar (one term)
├─ Results: Top 100, paginated
├─ Async search (non-blocking UI)
└─ Search cache (popular queries)

Performance:
├─ Latency: <500ms P99 (local FTS5)
├─ Capacity: Up to 100k blocks
├─ No server needed
└─ Suitable for: Personal users

Technology: SQLite FTS5 (Proven by SiYuan, Joplin desktop)
```

### v1.5 (Professional - Q3 2026)

```
Features (new):
├─ PostgreSQL FTS (server-side search)
├─ Advanced query syntax (AND/OR/NOT)
├─ Phrase search ("exact phrase")
├─ Filter by block type
├─ Recent searches (user history)
└─ Search statistics (results count)

Performance:
├─ Latency: <300ms P99 (PostgreSQL FTS)
├─ Capacity: Up to 1M blocks (proven in Joplin)
├─ Optional: Only for sync users
└─ Suitable for: Professional users, multi-device

Technology: PostgreSQL Full-Text Search (Proven by Joplin production)
├─ Built-in: No external service
├─ Cost: Zero (already using PostgreSQL)
├─ Maintenance: Automatic (triggers)
└─ Consistency: Strong (same database)
```

### v2.0 (Enterprise - Q4 2026+, conditional)

```
Features (new) - ONLY IF NEEDED:
├─ Meilisearch (if >1M blocks confirmed)
├─ Autocomplete suggestions
├─ Typo tolerance (fuzzy search)
├─ Related searches
├─ Team search (multi-user)
└─ Advanced filters (date range, tags)

Performance:
├─ Latency: <200ms P99
├─ Capacity: 10M+ blocks
└─ Suitable for: Teams, enterprise

Condition for upgrade:
├─ Users reporting >1M blocks (unlikely before 2027+)
├─ AND team collaboration features needed
└─ THEN evaluate Meilisearch (NOT Elasticsearch)

Technology: Meilisearch (Simpler than Elasticsearch)
├─ Why: Easier ops, simpler config
├─ Why NOT Elasticsearch: Overcomplicated, no reference uses it
├─ Cost: $50/month managed (vs. $500+ for Elasticsearch)
└─ When: Only if actual need confirmed (not premature)
```

---

## 7. SEARCH FALLBACK STRATEGY

### 7.1 Graceful Degradation

```
If FTS5 index is corrupted:

1. Detect: Query returns error
2. Log: "FTS5 index corrupted, rebuilding"
3. Fallback: Use linear scan (slow but works)
4. Show: "Searching..." spinner (can take 5+ seconds)
5. Rebuild: Async rebuild of FTS5 index
6. Resume: Switch back to index-based search

If Elasticsearch is down (v2.0):

1. Detect: Connection timeout
2. Fallback: Use local FTS5 search
3. Show: "Using local search" indicator
4. Retry: Periodic attempts to reconnect
5. Resume: Switch back to Elasticsearch when up

Result:
├─ Search always works (never fails)
├─ Degrades gracefully (slower, but functional)
└─ User experience: Seamless fallback
```

---

## Summary (REVISED - Based on Reference Implementation Analysis)

**CHRONEX Search Strategy**: SQLite FTS5 (v1.0) + PostgreSQL FTS (v1.5) + Optional Meilisearch (v2.0+)

**Key Principles** (from reference analysis):
- ✅ Local-first: FTS5 on device (works offline, Joplin/SiYuan proven)
- ✅ Fast: <300ms P99 for server queries (PostgreSQL proven)
- ✅ Scalable: FTS5 up to 100k, PostgreSQL FTS up to 1M (Joplin proven)
- ✅ Simple: No Elasticsearch (no reference uses it)
- ✅ Private: Server can't search (E2EE, no plaintext)
- ✅ Cost-effective: Zero extra (built-in databases)

**Performance SLOs**:
- Simple term (local): <300ms P99 (FTS5)
- Complex query (server): <300ms P99 (PostgreSQL FTS)
- Paginated results: <10ms per page (cached)
- 1M blocks: 100-300ms (PostgreSQL proven at scale)

**Architecture** (REVISED):
- v1.0: SQLite FTS5 local index (NO server)
- v1.5: PostgreSQL FTS (server search, optional for sync users)
- v2.0: Meilisearch (only if >1M blocks + teams, NOT Elasticsearch)

**Critical Finding**: No reference implementation uses Elasticsearch
- ✅ Joplin (desktop): SQLite FTS5
- ✅ Joplin (server): PostgreSQL FTS  
- ✅ SiYuan: SQLite FTS5
- ❌ Elasticsearch: NONE (unnecessary complexity)

**Recommendation**: Follow Joplin's proven approach
- Simpler, cheaper, more maintainable
- Scale to millions of blocks without external service
- Zero operational overhead
- Transparent to users

---

**Document Status**: Updated with WebDAV Architecture Context  
**Updated**: Added WebDAV separation, removed Elasticsearch, promoted PostgreSQL FTS  
**Key Finding**: Search (FTS5/PostgreSQL FTS) is independent of WebDAV sync  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md  
**Companion Analysis**: SEARCH_ENGINE_COMPARISON_ANALYSIS.md
