# Document Update Checklist

**Status**: Documents being aligned with correct architecture (WebDAV dual-mode)  
**Last Updated**: 2026-04-13  
**Authority**: CHRONEX_ARCHITECTURE_MASTER.md

---

## ✅ COMPLETED UPDATES

- [x] CHRONEX_ARCHITECTURE_MASTER.md - Created (declares official architecture)
- [x] CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md - Created (primary spec)
- [x] CHRONEX_API_DESIGN.md - Updated to WebDAV protocol

---

## ⚠️ PENDING UPDATES

### HIGH PRIORITY (Architecture-critical)

#### 1. CHRONEX_SYNC_PROTOCOL_DESIGN.md
**Current**: REST API + custom sync protocol  
**Needs**: Update to WebDAV + Vector clocks  
**Changes**:
- [ ] Replace REST endpoints with WebDAV methods
- [ ] Replace JSON payloads with WebDAV XML
- [ ] Update If-Match/ETag section
- [ ] Keep vector clock logic (still valid)
- [ ] Update conflict resolution (now via WebDAV)
- [ ] Add PROPFIND examples

**Status**: ⚠️ NEEDS UPDATE

---

#### 2. CHRONEX_HYBRID_STORAGE_DESIGN.md
**Current**: NestJS backend + SQLite/PostgreSQL  
**Needs**: Go + WebDAV + SQLite/PostgreSQL  
**Changes**:
- [ ] Change backend language from Node.js to Go
- [ ] Change protocol from REST to WebDAV
- [ ] Change database layer (still SQLite/PostgreSQL, no change needed)
- [ ] Update architecture diagram
- [ ] Keep encryption design (still applies)
- [ ] Update schema for WebDAV properties

**Status**: ⚠️ NEEDS UPDATE

---

### MEDIUM PRIORITY (Integration updates)

#### 3. CHRONEX_CACHE_ARCHITECTURE_DESIGN.md
**Current**: 3-tier cache for Tauri desktop app  
**Needs**: Integrate with VFS cache + Rclone modes  
**Changes**:
- [ ] Keep TIER 1 (in-memory LRU) - still valid
- [ ] Keep TIER 2 (SQLite buffer) - still valid
- [ ] Keep TIER 3 (disk) - still valid
- [ ] ADD: VFS cache integration
- [ ] ADD: Rclone cache modes (full, writes, minimal, off)
- [ ] ADD: Cache poll interval (5m default)
- [ ] ADD: Cache max size configuration

**Status**: ⚠️ MINOR UPDATE NEEDED

---

#### 4. CHRONEX_ENCRYPTION_AT_REST_DESIGN.md
**Current**: E2EE design (still valid)  
**Needs**: Minor updates for WebDAV integration  
**Changes**:
- [ ] Keep AES-256-GCM (still valid)
- [ ] Keep Argon2id KDF (still valid)
- [ ] Add: How encryption works with WebDAV
- [ ] Add: Block encryption before WebDAV serve
- [ ] Add: Optional flag to enable/disable
- [ ] Keep soft delete recovery (still applies)

**Status**: ⚠️ MINOR UPDATE NEEDED

---

#### 5. CHRONEX_SEARCH_STRATEGY_DESIGN.md
**Current**: FTS5 + PostgreSQL design (still valid)  
**Needs**: How search works over WebDAV  
**Changes**:
- [ ] Keep FTS5 for local search (still valid)
- [ ] Keep PostgreSQL FTS for v1.5 (still valid)
- [ ] Add: Search doesn't change with WebDAV
- [ ] Add: Indexing still happens server-side
- [ ] Note: Clients don't search over WebDAV (too slow)
- [ ] Note: Search happens via separate index

**Status**: ✅ MOSTLY VALID (just needs context note)

---

### LOW PRIORITY (Reference documents)

#### 6. CHRONEX_PERFORMANCE_TARGETS.md
**Status**: ✅ VALID AS-IS
- Targets still apply to Go + WebDAV
- No changes needed, just reference

#### 7. CHRONEX_HYBRID_STORAGE_DESIGN.md (storage layer)
**Status**: ✅ VALID AS-IS  
- SQLite schema still applies
- PostgreSQL optional backend still applies
- Just update backend language context

---

## ❌ OBSOLETE DOCUMENTS (Archive)

These represent wrong architecture. Mark as superseded:

1. **CHRONEX_RUST_ARCHITECTURE_INSPIRED_BY_AFFINE.md**
   - Status: SUPERSEDED
   - Redirect: See CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md

2. **CHRONEX_TYPESCRIPT_ARCHITECTURE_LEAN_AFFINE.md**
   - Status: SUPERSEDED
   - Redirect: See CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md

3. **CHRONEX_TYPESCRIPT_ARCHITECTURE_FULL_SCALE.md**
   - Status: SUPERSEDED
   - Redirect: See CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md

---

## 📋 UPDATE PRIORITIES

### Week 1 (Critical Path)
1. [ ] CHRONEX_SYNC_PROTOCOL_DESIGN.md (update to WebDAV)
2. [ ] CHRONEX_HYBRID_STORAGE_DESIGN.md (change to Go)
3. [ ] CHRONEX_API_DESIGN.md ✅ DONE

### Week 2 (Integration)
4. [ ] CHRONEX_CACHE_ARCHITECTURE_DESIGN.md (VFS cache)
5. [ ] CHRONEX_ENCRYPTION_AT_REST_DESIGN.md (WebDAV integration)
6. [ ] CHRONEX_SEARCH_STRATEGY_DESIGN.md (context note)

### Week 3 (Cleanup)
7. [ ] Mark obsolete docs
8. [ ] Create redirect notices
9. [ ] Final review all docs

---

## 📊 SUMMARY

| Document | Status | Priority | Changes |
|----------|--------|----------|---------|
| ARCHITECTURE_MASTER | ✅ | OFFICIAL | N/A |
| WEBDAV_DUAL_MODE | ✅ | PRIMARY | N/A |
| API_DESIGN | ✅ | HIGH | Complete rewrite |
| SYNC_PROTOCOL | ⚠️ | HIGH | WebDAV protocol |
| HYBRID_STORAGE | ⚠️ | HIGH | Language change |
| CACHE_ARCHITECTURE | ⚠️ | MEDIUM | VFS integration |
| ENCRYPTION_AT_REST | ⚠️ | MEDIUM | Minor updates |
| SEARCH_STRATEGY | ✅ | LOW | Context note |
| PERFORMANCE_TARGETS | ✅ | REFERENCE | Valid as-is |
| RUST_ARCHITECTURE | ❌ | ARCHIVE | Superseded |
| TYPESCRIPT_LEAN | ❌ | ARCHIVE | Superseded |
| TYPESCRIPT_FULL | ❌ | ARCHIVE | Superseded |

---

**Next Step**: Begin with high-priority updates (SYNC_PROTOCOL, HYBRID_STORAGE)
