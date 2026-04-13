# CHRONEX Search Strategy Design

**Design Document Version**: 1.0  
**Date**: 2026-04-13  
**Status**: Approved for v1.0 (FTS5), v2.0+ (Elasticsearch)  
**References**: SIYUAN_PERFORMANCE_ANALYSIS.md, JOPLIN_PERFORMANCE_ANALYSIS.md, CHRONEX_PERFORMANCE_TARGETS.md

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

## 3. SERVER-SIDE SEARCH (ELASTICSEARCH)

### 3.1 Elasticsearch Architecture (v2.0+)

```
When does client-side FTS5 become inadequate?

SQLite FTS5 limits:
├─ Single machine: Can't scale >100k blocks
├─ Single index: Can't handle 1M+ blocks
├─ Time: >2 seconds for complex queries
├─ Memory: Index grows with blocks (10+ MB per 100k blocks)

Solution: Elasticsearch (distributed search engine)

Elasticsearch benefits:
├─ Distributed: Span multiple machines
├─ Scalable: 1B+ documents
├─ Fast: Sub-second search (even for 1M blocks)
├─ Flexible: Complex queries (filters, aggregations)
├─ Analytics: Search statistics, suggestions
└─ Enterprise-grade: Fault tolerance, replication
```

### 3.2 Elasticsearch vs Local FTS5

```
Comparison:

Feature              SQLite FTS5      Elasticsearch
────────────────────────────────────────────
Blocks capacity      100k (limit)     1M+ (scalable)
Query speed (10k)    60-200ms         <100ms
Query speed (100k)   200-500ms        100-200ms
Query speed (1M)     >1s (slow)       200-500ms
Multi-field search   Basic            Advanced
Faceted search       No               Yes
Autocomplete         No               Yes
Synonyms             No               Yes
Typo tolerance       No               Yes
Installation         Built-in         External service
Cost                 Free             Paid (self-hosted)
Maintenance          Automatic        Manual
```

### 3.3 Elasticsearch Index Design

```
Mapping for Chronex blocks:

{
  "mappings": {
    "properties": {
      "block_id": {
        "type": "keyword"                    // Exact match (UUID)
      },
      "user_id": {
        "type": "keyword"                    // Filter by user
      },
      "title": {
        "type": "text",
        "analyzer": "standard",              // Full-text analysis
        "fields": {
          "keyword": {                       // Also store as keyword
            "type": "keyword"
          }
        }
      },
      "content": {
        "type": "text",
        "analyzer": "english"                // English stemming
      },
      "type": {
        "type": "keyword"                    // Filter by block type
      },
      "updated_at": {
        "type": "date"                       // Range queries
      },
      "tags": {
        "type": "keyword"                    // Exact match
      }
    }
  }
}

Query example:

{
  "query": {
    "bool": {
      "must": [
        {"match": {"title": "rust"}},        // Must have "rust"
        {"term": {"user_id": "user-123"}}    // Filter by user
      ],
      "should": [
        {"match": {"content": "async"}}      // Bonus if has "async"
      ],
      "filter": [
        {"range": {"updated_at": {          // Filter: last 30 days
          "gte": "now-30d"
        }}}
      ]
    }
  },
  "size": 100                                // Return top 100
}
```

### 3.4 Indexing Strategy

```
How to keep Elasticsearch in sync with SQLite?

Option 1: Bulk indexing (Batch-based)
├─ Every hour: Export all blocks to Elasticsearch
├─ Advantage: Simple, reliable
├─ Disadvantage: 1-hour delay (acceptable for v2.0)
└─ Use case: Team collaboration

Option 2: Real-time indexing (Stream-based)
├─ On block change: POST to Elasticsearch immediately
├─ Advantage: Instant (sub-second)
├─ Disadvantage: Complex, more network requests
└─ Use case: Enterprise (future)

Option 3: Log-based (Change log)
├─ Maintain sync_changelog table
├─ Periodically replay changelog to Elasticsearch
├─ Advantage: Fault-tolerant
├─ Disadvantage: Complex replay logic
└─ Use case: High-reliability enterprise

Recommendation for v2.0:
├─ Use Option 1 (bulk indexing)
├─ Simple to implement
├─ Acceptable latency (1 hour)
├─ Scale to millions of documents
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

## 6. IMPLEMENTATION ROADMAP

### v1.0 (MVP)

```
Features:
├─ FTS5 full-text search
├─ Simple search bar (one term)
├─ Results: Top 100, paginated
├─ Async search (non-blocking UI)
└─ Search cache (popular queries)

Performance:
├─ Latency: <500ms P99 (local FTS5)
├─ Capacity: Up to 100k blocks
└─ Suitable for: Personal users
```

### v1.5 (Enhanced)

```
Features (new):
├─ Advanced query syntax (AND/OR/NOT)
├─ Phrase search ("exact phrase")
├─ Prefix search (rust*)
├─ Filter by block type
├─ Recent searches (user history)
└─ Search statistics (results count)

Performance:
├─ Latency: <500ms P99 (still FTS5)
├─ Capacity: 100k-500k blocks (with optimization)
└─ Suitable for: Professional users
```

### v2.0 (Enterprise)

```
Features (new):
├─ Elasticsearch backend (distributed)
├─ Autocomplete suggestions
├─ Typo tolerance (fuzzy search)
├─ Related searches
├─ Search analytics
├─ Team search (multi-user)
└─ Advanced filters (date range, tags)

Performance:
├─ Latency: <300ms P99 (Elasticsearch)
├─ Capacity: Unlimited (1M+ blocks)
└─ Suitable for: Teams, enterprise
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

## Summary

**CHRONEX Search Strategy**: Local FTS5 (v1.0-1.5) + Elasticsearch (v2.0+)

**Key Principles**:
- ✅ Local-first: FTS5 on device (works offline)
- ✅ Fast: <500ms P99 for typical searches
- ✅ Scalable: FTS5 up to 100k, Elasticsearch unlimited
- ✅ Resilient: Graceful fallback if index fails
- ✅ Private: Server can't search (E2EE, no plaintext)

**Performance SLOs**:
- Simple term: <300ms P99
- Complex query: <500ms P99
- Paginated results: <10ms per page (cached)
- Index building: One-time 2-5 seconds (acceptable)

**Architecture**:
- v1.0: SQLite FTS5 local index
- v1.5: Same + query optimization + caching
- v2.0: Elasticsearch distributed search

---

**Document Status**: Design Complete  
**Next**: CHRONEX_API_DESIGN.md
