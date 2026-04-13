# CHRONEX ARCHITECTURE MASTER

**Status**: ✅ OFFICIAL ARCHITECTURE (2026-04-13)  
**Version**: 1.0  
**Authority**: Final, approved architecture for all future development

---

## 🎯 THE CORRECT ARCHITECTURE

```
Chronex = Rclone for Blocks
        + WebDAV Protocol  
        + Go Language (not TypeScript)
        + Dual-Mode: Client + Server
        + Vector Clocks for Conflict Resolution
        + SQLite Local + PostgreSQL Optional
        + Universal Interoperability
```

---

## ✅ OFFICIAL DOCUMENTS

### Primary Architecture Document
- **CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md** (1,153 LOC)
  - ✅ **THIS IS THE CORRECT AND ONLY ARCHITECTURE**
  - Defines: Go + WebDAV + Dual-mode (client + server)
  - Based on: Rclone serve webdav pattern
  - Protocol: WebDAV (universal, proven)
  - Use this for all implementation decisions

### Reference/Analysis Documents (Valid but NOT the primary architecture)
- **TAURI_DEEP_ANALYSIS.md** (842 LOC)
  - ✅ Valid: Tauri can be used for DESKTOP CLIENT (v1.5+)
  - Context: Desktop app wrapper around core Chronex
  - Not primary architecture, but compatible

- **AFFINE_TYPESCRIPT_ARCHITECTURE.md** (928 LOC)
  - ✅ Valid: Reference for what NOT to do
  - Context: Shows why TypeScript full-stack is wrong for Chronex
  - Educational: Understanding trade-offs
  - Not the model to follow

---

## ❌ OBSOLETE DOCUMENTS (DO NOT USE)

These documents represent INCORRECT architecture decisions:

1. **CHRONEX_RUST_ARCHITECTURE_INSPIRED_BY_AFFINE.md**
   - ❌ OBSOLETE: Was Rust crates but not WebDAV pattern
   - ❌ Superseded by: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md
   - Status: Archive (historical only)

2. **CHRONEX_TYPESCRIPT_ARCHITECTURE_LEAN_AFFINE.md**
   - ❌ OBSOLETE: TypeScript backend (wrong)
   - ❌ Superseded by: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md
   - Status: Archive (historical only)

3. **CHRONEX_TYPESCRIPT_ARCHITECTURE_FULL_SCALE.md**
   - ❌ OBSOLETE: Full TypeScript stack (wrong direction)
   - ❌ Superseded by: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md
   - Status: Archive (historical only)

---

## 📋 EXISTING DOCUMENTS TO UPDATE

These documents were created before architecture finalization. They need updates:

### Design Documents (Need Review & Update)

1. **CHRONEX_HYBRID_STORAGE_DESIGN.md**
   - Current: References NestJS backend + SQLite
   - Update needed: Reflect Go + WebDAV architecture
   - Status: ⚠️ NEEDS UPDATE

2. **CHRONEX_SYNC_PROTOCOL_DESIGN.md**
   - Current: References REST API + GraphQL
   - Update needed: WebDAV protocol + VFS operations
   - Status: ⚠️ NEEDS UPDATE

3. **CHRONEX_ENCRYPTION_AT_REST_DESIGN.md**
   - Current: Encryption design (still valid)
   - Update needed: Minor - how it integrates with WebDAV VFS
   - Status: ⚠️ MINOR UPDATES

4. **CHRONEX_CACHE_ARCHITECTURE_DESIGN.md**
   - Current: 3-tier cache for desktop app
   - Update needed: How VFS cache integrates with WebDAV options
   - Status: ⚠️ NEEDS UPDATE

5. **CHRONEX_SEARCH_STRATEGY_DESIGN.md**
   - Current: FTS5 + PostgreSQL design (still valid)
   - Update needed: Minimal - how search works over WebDAV
   - Status: ⚠️ MINOR UPDATES

6. **CHRONEX_API_DESIGN.md**
   - Current: REST API + Tauri RPC
   - Update needed: REPLACE with WebDAV protocol spec
   - Status: ⚠️ MAJOR UPDATE

---

## 🔄 UPDATE STRATEGY

### Phase 1: Mark Obsolete Documents
- Add "OBSOLETE" header to wrong architecture docs
- Add redirect to CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md
- Keep for historical reference

### Phase 2: Update Existing Design Documents
- Update to align with Go + WebDAV
- Keep valid components (encryption, search, etc.)
- Rewrite architecture-specific sections

### Phase 3: Create New Implementation Documents
- WebDAV protocol specification
- Go project structure
- SQLite schema
- VFS implementation guide

---

## 📐 CORE ARCHITECTURE SUMMARY

### Language & Framework
- **Language**: Go (like Rclone)
- **Protocol**: WebDAV (proven, standard)
- **Database**: SQLite (local) + PostgreSQL (optional v1.5)
- **Sync**: Vector clocks + 3-way merge

### Dual-Mode Operations
- **Server Mode**: `chronex serve webdav`
  - Exposes blocks via WebDAV
  - Obsidian/WinSCP/Finder can access
  - HTTP/HTTPS with TLS
  
- **Client Mode**: `chronex sync pull`
  - Pulls from remote servers (Nextcloud, S3, etc.)
  - Syncs to local SQLite
  - Can push changes back

### VFS (Virtual File System)
```
Blocks in Database ←→ Files in WebDAV
Notebooks ←→ Folders
Blocks ←→ .md files
Metadata ←→ WebDAV properties
```

### Rclone-Style Options
```bash
chronex serve webdav \
    --addr 0.0.0.0:443 \
    --cert /certs/fullchain.pem \
    --key /certs/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 50G \
    --vfs-cache-poll-interval 5m \
    --etag-hash fastcdc \
    --disable-dir-list \
    --disable-zip \
    --db ~/.chronex/chronex.db
```

---

## 📊 COMPARISON: What Changed

```
OLD (Wrong)                          NEW (Correct)
──────────────────────────────────────────────────
TypeScript/NestJS backend       →    Go + WebDAV
40-60 frontend modules          →    No frontend (WebDAV clients)
GraphQL API                     →    WebDAV protocol
Complex monorepo                →    Single Go binary
Rest/REST endpoints             →    WebDAV standard
Custom protocol                 →    Universal WebDAV
Lean bootstrap                  →    Full Rclone pattern
Internal sync logic             →    Proven Rclone sync
```

---

## 🚀 NEXT STEPS

### Immediate
1. Mark obsolete documents
2. Update existing design docs
3. Create WebDAV spec document
4. Create Go project structure guide

### Implementation
1. Go project initialization
2. WebDAV server skeleton (golang.org/x/net/webdav)
3. SQLite schema (blocks, notebooks, sync_operations)
4. VFS implementation (blocks ↔ filesystem)
5. Vector clock sync logic
6. Client sync daemon

### Testing & Refinement
1. Obsidian WebDAV plugin integration
2. Multi-device sync testing
3. Conflict resolution testing
4. Performance benchmarking (vs Rclone)

---

## ✅ DECISION RECORD

| Decision | Value |
|----------|-------|
| Core Language | Go ✅ |
| Protocol | WebDAV ✅ |
| Architecture | Rclone Pattern ✅ |
| Dual-Mode | Client + Server ✅ |
| Database | SQLite + PostgreSQL ✅ |
| Sync | Vector Clocks ✅ |
| Frontend | None (WebDAV clients) ✅ |
| TypeScript | NOT USED ✅ |
| NestJS | NOT USED ✅ |
| AFFiNE Pattern | NOT FOLLOWED ✅ |

---

**This is the OFFICIAL and FINAL architecture for Chronex.**

All development must follow **CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md**

All other architectural documents are either:
- ✅ Reference/analysis (Tauri, AFFiNE)
- ❌ Obsolete (old incorrect approaches)
- ⚠️ Needing updates (to align with correct architecture)
