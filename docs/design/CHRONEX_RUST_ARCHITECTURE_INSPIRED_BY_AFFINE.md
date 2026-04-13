# Chronex: Rust Architecture Inspired by AFFiNE

**Design Document Version**: 1.0  
**Date**: 2026-04-13  
**Approach**: AFFiNE's modular patterns + Rust's performance + Tauri for desktop  
**Philosophy**: "AFFiNE's elegance, Rust's efficiency, Chronex's simplicity"

---

## 1. EXECUTIVE SUMMARY

### The Vision

```
Chronex Architecture = AFFiNE's Modularity
                    + Rust's Performance
                    + Tauri's Desktop Excellence
                    + SQLite's Simplicity (v1.0)
                    + PostgreSQL's Scale (v1.5+)
```

### Why AFFiNE-Inspired Rust Architecture?

```
AFFiNE's Architecture Strengths:
├─ ✅ Modular (69 frontend modules)
├─ ✅ Clear separation of concerns
├─ ✅ Service-oriented (entities/services/views pattern)
├─ ✅ Type-safe (TypeScript everywhere)
├─ ✅ Testable (each module independently)
└─ ✅ Scalable (easy to add new features)

Chronex Implementation:
├─ Use same modular philosophy in Rust
├─ Organize crates like AFFiNE modules
├─ Services for business logic
├─ Entities for data models
├─ Clear API contracts
├─ But keep it LEAN: 8-12 crates (not 100+)
└─ And FAST: Rust instead of TypeScript
```

---

## 2. CHRONEX RUST ARCHITECTURE OVERVIEW

### 2.1 Directory Structure (AFFiNE-Inspired)

```
chronex/
├─ Cargo.toml (workspace root)
├─ Cargo.lock
│
├─ crates/
│  ├─ chronex-core/          (MAIN APPLICATION, like AFFiNE "affine")
│  │  ├─ Cargo.toml
│  │  └─ src/
│  │     ├─ main.rs          (Entry point)
│  │     ├─ lib.rs           (Library exports)
│  │     ├─ modules/         (MODULAR ARCHITECTURE, like AFFiNE)
│  │     │  ├─ mod.rs
│  │     │  ├─ blocks/       (Block CRUD, like "doc" module)
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs    (Block, BlockMetadata)
│  │     │  │  ├─ service.rs     (BusinessLogic)
│  │     │  │  └─ repository.rs  (DB access)
│  │     │  │
│  │     │  ├─ notebooks/    (Notebook management)
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs
│  │     │  │  ├─ service.rs
│  │     │  │  └─ repository.rs
│  │     │  │
│  │     │  ├─ search/       (FTS5 search, like AFFiNE "search-menu")
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs
│  │     │  │  ├─ service.rs
│  │     │  │  └─ indexer.rs
│  │     │  │
│  │     │  ├─ sync/         (Multi-device sync, like AFFiNE "sync-protocol")
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs    (SyncMessage, VectorClock)
│  │     │  │  ├─ service.rs     (SyncService)
│  │     │  │  ├─ merger.rs      (3-way merge)
│  │     │  │  └─ protocol.rs    (Protocol handlers)
│  │     │  │
│  │     │  ├─ encryption/   (E2EE, like AFFiNE "security")
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs    (Keys, encrypted data)
│  │     │  │  ├─ service.rs     (Encryption ops)
│  │     │  │  └─ crypto.rs      (Ring/Sodiumoxide wrappers)
│  │     │  │
│  │     │  ├─ auth/         (Authentication)
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ entities.rs    (User, Session)
│  │     │  │  ├─ service.rs     (AuthService)
│  │     │  │  └─ password.rs    (Argon2id)
│  │     │  │
│  │     │  ├─ storage/      (SQLite/PostgreSQL abstraction)
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ sqlite.rs      (SQLite driver)
│  │     │  │  ├─ postgresql.rs  (PostgreSQL driver, optional)
│  │     │  │  ├─ migrations.rs  (Schema management)
│  │     │  │  └─ queries.rs     (SQL builders)
│  │     │  │
│  │     │  ├─ cache/        (3-tier caching, like AFFiNE "cache")
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ lru.rs         (In-memory LRU)
│  │     │  │  ├─ sqlite_buffer.rs (SQLite warm cache)
│  │     │  │  └─ service.rs     (Cache orchestration)
│  │     │  │
│  │     │  ├─ api/          (REST endpoints)
│  │     │  │  ├─ mod.rs
│  │     │  │  ├─ handlers.rs    (HTTP handlers)
│  │     │  │  └─ models.rs      (Request/response types)
│  │     │  │
│  │     │  └─ error.rs      (Error types, like AFFiNE's error handling)
│  │     │
│  │     └─ config.rs        (Configuration)
│  │
│  ├─ chronex-tauri/         (TAURI RUNTIME)
│  │  ├─ Cargo.toml
│  │  └─ src/
│  │     ├─ main.rs          (Tauri window/app setup)
│  │     ├─ commands.rs      (Tauri RPC commands)
│  │     └─ state.rs         (Shared state across windows)
│  │
│  ├─ chronex-crypto/        (ENCRYPTION, optional separate crate)
│  │  ├─ Cargo.toml
│  │  └─ src/
│  │     ├─ lib.rs
│  │     ├─ aes_gcm.rs
│  │     ├─ argon2.rs
│  │     └─ key_derivation.rs
│  │
│  ├─ chronex-sync/          (SYNC PROTOCOL, optional separate crate)
│  │  ├─ Cargo.toml
│  │  └─ src/
│  │     ├─ lib.rs
│  │     ├─ vector_clock.rs
│  │     ├─ merge.rs
│  │     └─ protocol.rs
│  │
│  └─ chronex-storage/       (DATABASE ABSTRACTION)
│     ├─ Cargo.toml
│     └─ src/
│        ├─ lib.rs
│        ├─ sqlite.rs
│        ├─ postgresql.rs
│        └─ migrations.rs
│
├─ frontend/                  (REACT FRONTEND, like AFFiNE)
│  ├─ package.json
│  ├─ src/
│  │  ├─ modules/            (69 modules, like AFFiNE)
│  │  │  ├─ blocks/
│  │  │  ├─ notebooks/
│  │  │  ├─ search/
│  │  │  ├─ sync/
│  │  │  ├─ auth/
│  │  │  └─ [more features]
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ types/
│  │  ├─ api/                (TypeScript bindings to Rust API)
│  │  └─ App.tsx
│  │
│  └─ vite.config.ts
│
└─ tests/                     (INTEGRATION TESTS)
   ├─ e2e/
   ├─ unit/
   └─ fixtures/
```

### 2.2 Comparison: Chronex vs AFFiNE Monorepo Structure

```
ASPECT                 | AFFiNE         | Chronex (Rust)
──────────────────────────────────────────────────────────
Total Workspaces       | 101+           | 8-12 crates
Frontend Modules       | 69             | 15-20 modules
Backend Modules        | 13+            | 6-8 modules
Rust Crates            | ~9 (minimal)   | 8-12 (PRIMARY)
TypeScript Files       | 6,763          | ~1,000 (frontend only)
Backend Language       | Node.js        | Rust
Frontend Language      | React/TS       | React/TS
Total Lines of Code    | 1.5M+          | ~200k (target)
Build Time             | 60-90 min      | 5-15 min
Deployment             | Cloud hosted   | Desktop binary
Team Size              | 50+ engineers  | 1-2 developers

Pattern Alignment:
├─ Modular philosophy: ✅ YES (both use modules)
├─ Service pattern: ✅ YES (both have services)
├─ Type safety: ✅ YES (Rust > TypeScript)
├─ Entity/Service sep: ✅ YES (both have entities & services)
├─ Error handling: ✅ YES (both centralized)
├─ DI/Injection: ✅ YES (Rust trait-based)
├─ Multi-window UI: ✅ YES (Tauri supports)
└─ Plugin system: ✅ YES (Tauri plugins)
```

---

## 3. MODULE ARCHITECTURE (AFFiNE-INSPIRED)

### 3.1 Module Pattern: blocks Module Example

```rust
// crates/chronex-core/src/modules/blocks/mod.rs

pub mod entities;
pub mod service;
pub mod repository;

pub use entities::Block;
pub use service::BlockService;

// ┌─────────────────────────────────────────────────┐
// │  blocks/ (One Feature = One Module)             │
// ├─────────────────────────────────────────────────┤
// │                                                 │
// │  entities.rs  → Data models                     │
// │  ├─ Block                                       │
// │  ├─ BlockMetadata                               │
// │  ├─ BlockChange                                 │
// │  └─ SearchIndex                                 │
// │                                                 │
// │  service.rs   → Business logic                  │
// │  ├─ impl BlockService {                         │
// │  │   fn create_block() → Result<Block>          │
// │  │   fn update_block() → Result<Block>          │
// │  │   fn delete_block() → Result<()>             │
// │  │   fn get_block() → Result<Block>             │
// │  │   fn list_blocks() → Result<Vec<Block>>      │
// │  │ }                                            │
// │                                                 │
// │  repository.rs → DB access                      │
// │  ├─ impl BlockRepository {                      │
// │  │   fn insert() → Result<()>                   │
// │  │   fn update() → Result<()>                   │
// │  │   fn delete() → Result<()>                   │
// │  │   fn get() → Result<Row>                     │
// │  │   fn list() → Result<Vec<Row>>               │
// │  │ }                                            │
// │                                                 │
// └─────────────────────────────────────────────────┘
```

### 3.2 Each Module Has This Structure

```rust
// Pattern: Every module follows this pattern (like AFFiNE)

// entities.rs: Data models with serde for serialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,              // uuid
    pub notebook_id: String,     // parent notebook
    pub content: String,         // encrypted text
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub vector_clock: VectorClock,  // for sync
    pub is_deleted: bool,        // soft delete
}

// service.rs: Business logic (no DB dependency)
pub struct BlockService {
    repo: Arc<BlockRepository>,
    sync_service: Arc<SyncService>,
    search_service: Arc<SearchService>,
}

impl BlockService {
    pub async fn create_block(
        &self,
        notebook_id: &str,
        content: &str,
    ) -> Result<Block> {
        // Validate
        // Create entity
        // Save via repo
        // Emit sync event
        // Index for search
        // Return block
    }
}

// repository.rs: Database access (abstracted)
pub struct BlockRepository {
    db: Arc<Database>,
}

impl BlockRepository {
    pub async fn insert(&self, block: &Block) -> Result<()> {
        // Direct SQLite/PostgreSQL queries
        // Type-safe with sqlx
    }
}

// Error handling (module-specific)
#[derive(Debug)]
pub enum BlockError {
    NotFound(String),
    InvalidContent(String),
    SyncConflict(String),
}
```

### 3.3 Module Diagram: How Modules Interact

```
┌─────────────────────────────────────────────────┐
│              Frontend (React/TypeScript)         │
│  ┌─────────────────────────────────────────┐    │
│  │  UI Components                          │    │
│  │  - BlockEditor                          │    │
│  │  - NotebookView                         │    │
│  │  - SearchPanel                          │    │
│  └────────┬────────────────────────────────┘    │
│           │ Tauri invoke()                      │
│           ↓                                      │
└──────────────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   Tauri Runtime      │
         │  (chronex-tauri)     │
         └──────────┬───────────┘
                    ↓
    ┌───────────────────────────────────┐
    │    chronex-core (Rust Backend)    │
    ├───────────────────────────────────┤
    │                                   │
    │  API Routes                       │
    │  ├─ /blocks                       │
    │  ├─ /notebooks                    │
    │  ├─ /search                       │
    │  ├─ /sync                         │
    │  └─ /auth                         │
    │           ↓                       │
    │  ┌─────────────────────────────┐  │
    │  │  blocks module              │  │
    │  ├─────────────────────────────┤  │
    │  │ - BlockService              │  │
    │  │   - Uses: SearchService     │  │
    │  │   - Uses: SyncService       │  │
    │  │   - Uses: EncryptionService │  │
    │  │ - BlockRepository (DB)      │  │
    │  └─────────────────────────────┘  │
    │           ↑       ↓                │
    │  ┌────────────────────────────┐   │
    │  │  search module             │   │
    │  │ - SearchService            │   │
    │  │ - Indexer (FTS5)           │   │
    │  └────────────────────────────┘   │
    │           ↑       ↓                │
    │  ┌────────────────────────────┐   │
    │  │  sync module               │   │
    │  │ - SyncService              │   │
    │  │ - Merger (3-way)           │   │
    │  │ - VectorClock tracking     │   │
    │  └────────────────────────────┘   │
    │           ↑       ↓                │
    │  ┌────────────────────────────┐   │
    │  │  encryption module         │   │
    │  │ - EncryptionService        │   │
    │  │ - AES-256-GCM              │   │
    │  │ - Argon2id KDF             │   │
    │  └────────────────────────────┘   │
    │           ↑       ↓                │
    │  ┌────────────────────────────┐   │
    │  │  storage module            │   │
    │  │ - Database abstraction     │   │
    │  │ - SQLite (v1.0)            │   │
    │  │ - PostgreSQL (v1.5)        │   │
    │  └────────────────────────────┘   │
    │           ↑       ↓                │
    │  ┌────────────────────────────┐   │
    │  │  cache module              │   │
    │  │ - LRU (TIER 1)             │   │
    │  │ - SQLite buffer (TIER 2)   │   │
    │  │ - Disk (TIER 3)            │   │
    │  └────────────────────────────┘   │
    │                                   │
    └───────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   Database           │
         │ - SQLite (local)     │
         │ - PostgreSQL (cloud) │
         └──────────────────────┘
```

---

## 4. CORE MODULES (8-12 Crates)

### 4.1 Module List & Responsibilities

```
chronex-core/src/modules/:

1. blocks/ (Document content)
   ├─ entities: Block, BlockMetadata, BlockChange
   ├─ service: CRUD, encryption, change tracking
   ├─ repository: SQLite/PostgreSQL access
   └─ Like AFFiNE's "doc" module but Rust

2. notebooks/ (Container for blocks)
   ├─ entities: Notebook, NotebookMetadata
   ├─ service: Namespace, hierarchy management
   ├─ repository: DB operations
   └─ Like AFFiNE's "workspace" module

3. search/ (Full-text search)
   ├─ entities: SearchResult, SearchIndex
   ├─ service: Query, indexing logic
   ├─ indexer: FTS5 integration
   └─ Like AFFiNE's "docs-search" module

4. sync/ (Multi-device synchronization)
   ├─ entities: SyncMessage, VectorClock, Conflict
   ├─ service: Sync orchestration
   ├─ merger: 3-way merge logic
   ├─ protocol: Wire format handlers
   └─ Like AFFiNE's "sync-protocol" module

5. encryption/ (End-to-end encryption)
   ├─ entities: MasterKey, EncryptedData
   ├─ service: Encryption/decryption ops
   ├─ crypto: Ring/Sodiumoxide wrappers
   └─ Like AFFiNE's "security" concepts

6. auth/ (User authentication)
   ├─ entities: User, Session, Credentials
   ├─ service: Login, logout, session validation
   ├─ password: Argon2id KDF
   └─ Like AFFiNE's "auth" module

7. storage/ (Database abstraction)
   ├─ sqlite: SQLite driver + queries
   ├─ postgresql: PostgreSQL driver + queries
   ├─ migrations: Schema management
   ├─ queries: SQL builders
   └─ Like AFFiNE's data layer

8. cache/ (3-tier caching)
   ├─ lru: In-memory LRU cache
   ├─ sqlite_buffer: SQLite warm cache
   ├─ service: Cache orchestration
   └─ Like AFFiNE's "cache" module

9. api/ (REST endpoints)
   ├─ handlers: HTTP route handlers
   ├─ models: Request/response types
   └─ Like AFFiNE's GraphQL resolvers

10. error/ (Error handling)
    ├─ types: Unified error types
    ├─ conversion: From/Into conversions
    └─ Like AFFiNE's error centralization

Optional for v1.5+:

11. notifications/ (Real-time notifications)
    └─ Like AFFiNE's "notification" module

12. collaboration/ (Real-time collaboration, v2.0)
    └─ Like AFFiNE's "comment" module
```

### 4.2 Module Dependencies (DAG)

```
                    ┌─────────────┐
                    │   errors    │
                    └──────┬──────┘
                           ↑
                    ┌──────────────┐
                    │   storage    │ (lowest level)
                    ├──────────────┤
                    │  - sqlite    │
                    │  - postgres  │
                    │  - migrate   │
                    └──────┬───────┘
                           ↑
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────────┐      ┌───────────┐      ┌──────────┐
   │  auth  │      │   cache   │      │encryption│
   └────────┘      └───────────┘      └──────────┘
        ↑                  ↑                  ↑
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────────────┐
                    │   blocks     │ (uses all above)
                    └──────┬───────┘
                           ↑
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────────┐      ┌───────────┐      ┌─────────┐
   │notebooks│     │   search  │      │  sync   │
   └────────┘      └───────────┘      └─────────┘
        ↑                  ↑                  ↑
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────────────┐
                    │     api      │ (facade)
                    └──────────────┘
```

---

## 5. IMPLEMENTATION EXAMPLE: blocks Module

### 5.1 Complete Module Skeleton

```rust
// crates/chronex-core/src/modules/blocks/mod.rs

pub mod entities;
pub mod repository;
pub mod service;

pub use entities::{Block, BlockChange, BlockMetadata};
pub use service::BlockService;

// ─────────────────────────────────────────────────

// crates/chronex-core/src/modules/blocks/entities.rs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,              // UUID
    pub notebook_id: String,     // Parent notebook
    pub title: String,           // Block title (encrypted)
    pub content: String,         // Block content (encrypted)
    pub metadata: BlockMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,  // Soft delete
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockMetadata {
    pub tags: Vec<String>,
    pub color: Option<String>,
    pub pinned: bool,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockChange {
    pub block_id: String,
    pub change_type: ChangeType,
    pub timestamp: DateTime<Utc>,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Created,
    Updated,
    Deleted,
    Moved,
}

// ─────────────────────────────────────────────────

// crates/chronex-core/src/modules/blocks/service.rs

use super::entities::{Block, BlockChange};
use super::repository::BlockRepository;
use crate::modules::encryption::EncryptionService;
use crate::modules::search::SearchService;
use crate::modules::sync::SyncService;
use anyhow::Result;
use std::sync::Arc;

pub struct BlockService {
    repo: Arc<BlockRepository>,
    encryption: Arc<EncryptionService>,
    search: Arc<SearchService>,
    sync: Arc<SyncService>,
}

impl BlockService {
    pub fn new(
        repo: Arc<BlockRepository>,
        encryption: Arc<EncryptionService>,
        search: Arc<SearchService>,
        sync: Arc<SyncService>,
    ) -> Self {
        Self {
            repo,
            encryption,
            search,
            sync,
        }
    }

    // Core CRUD operations
    pub async fn create_block(
        &self,
        notebook_id: &str,
        title: &str,
        content: &str,
    ) -> Result<Block> {
        // 1. Validate inputs
        if title.is_empty() {
            anyhow::bail!("Title cannot be empty");
        }

        // 2. Encrypt content (AES-256-GCM)
        let encrypted_content = self.encryption.encrypt(content).await?;

        // 3. Create entity
        let block = Block {
            id: Uuid::new_v4().to_string(),
            notebook_id: notebook_id.to_string(),
            title: title.to_string(),
            content: encrypted_content,
            metadata: Default::default(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
        };

        // 4. Save to database
        self.repo.insert(&block).await?;

        // 5. Index for search
        self.search.index_block(&block).await?;

        // 6. Emit sync event
        let change = BlockChange {
            block_id: block.id.clone(),
            change_type: ChangeType::Created,
            timestamp: Utc::now(),
            device_id: "local".to_string(),
        };
        self.sync.emit_change(change).await?;

        Ok(block)
    }

    pub async fn update_block(
        &self,
        block_id: &str,
        title: &str,
        content: &str,
    ) -> Result<Block> {
        // Similar pattern: validate → encrypt → save → index → sync
        todo!()
    }

    pub async fn delete_block(&self, block_id: &str) -> Result<()> {
        // Soft delete: set deleted_at timestamp
        self.repo.soft_delete(block_id).await?;
        
        // Sync the deletion
        let change = BlockChange {
            block_id: block_id.to_string(),
            change_type: ChangeType::Deleted,
            timestamp: Utc::now(),
            device_id: "local".to_string(),
        };
        self.sync.emit_change(change).await?;

        Ok(())
    }

    pub async fn get_block(&self, block_id: &str) -> Result<Block> {
        self.repo.get(block_id).await
    }

    pub async fn list_blocks(&self, notebook_id: &str) -> Result<Vec<Block>> {
        self.repo.list_by_notebook(notebook_id).await
    }
}

// ─────────────────────────────────────────────────

// crates/chronex-core/src/modules/blocks/repository.rs

use super::entities::Block;
use crate::storage::Database;
use anyhow::Result;
use sqlx::FromRow;
use std::sync::Arc;

#[derive(FromRow)]
struct BlockRow {
    id: String,
    notebook_id: String,
    title: String,
    content: String,  // encrypted
    created_at: i64,
    updated_at: i64,
    deleted_at: Option<i64>,
}

pub struct BlockRepository {
    db: Arc<Database>,
}

impl BlockRepository {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn insert(&self, block: &Block) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO blocks (id, notebook_id, title, content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&block.id)
        .bind(&block.notebook_id)
        .bind(&block.title)
        .bind(&block.content)
        .bind(block.created_at.timestamp())
        .bind(block.updated_at.timestamp())
        .execute(&*self.db.pool)
        .await?;

        Ok(())
    }

    pub async fn get(&self, block_id: &str) -> Result<Block> {
        let row: BlockRow = sqlx::query_as(
            r#"
            SELECT id, notebook_id, title, content, created_at, updated_at, deleted_at
            FROM blocks
            WHERE id = ? AND deleted_at IS NULL
            "#,
        )
        .bind(block_id)
        .fetch_one(&*self.db.pool)
        .await?;

        Ok(Block {
            id: row.id,
            notebook_id: row.notebook_id,
            title: row.title,
            content: row.content,
            metadata: Default::default(),
            created_at: DateTime::from_timestamp(row.created_at, 0)?,
            updated_at: DateTime::from_timestamp(row.updated_at, 0)?,
            deleted_at: row.deleted_at.map(|ts| DateTime::from_timestamp(ts, 0)).transpose()?,
        })
    }

    pub async fn list_by_notebook(&self, notebook_id: &str) -> Result<Vec<Block>> {
        let rows: Vec<BlockRow> = sqlx::query_as(
            r#"
            SELECT id, notebook_id, title, content, created_at, updated_at, deleted_at
            FROM blocks
            WHERE notebook_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
            "#,
        )
        .bind(notebook_id)
        .fetch_all(&*self.db.pool)
        .await?;

        rows.into_iter().map(|row| {
            Ok(Block {
                id: row.id,
                notebook_id: row.notebook_id,
                title: row.title,
                content: row.content,
                metadata: Default::default(),
                created_at: DateTime::from_timestamp(row.created_at, 0)?,
                updated_at: DateTime::from_timestamp(row.updated_at, 0)?,
                deleted_at: row.deleted_at
                    .map(|ts| DateTime::from_timestamp(ts, 0))
                    .transpose()?,
            })
        }).collect()
    }

    pub async fn soft_delete(&self, block_id: &str) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE blocks
            SET deleted_at = ?
            WHERE id = ?
            "#,
        )
        .bind(Utc::now().timestamp())
        .bind(block_id)
        .execute(&*self.db.pool)
        .await?;

        Ok(())
    }
}
```

---

## 6. WORKSPACE CONFIGURATION

### 6.1 Root Cargo.toml

```toml
[workspace]
members = [
    "crates/chronex-core",
    "crates/chronex-tauri",
    "crates/chronex-crypto",
    "crates/chronex-sync",
    "crates/chronex-storage",
]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
rust-version = "1.77"
authors = ["Chronex Team"]
license = "MIT"

[workspace.dependencies]
# Common dependencies
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.7", features = ["sqlite", "postgres", "runtime-tokio"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
anyhow = "1.0"
thiserror = "1.0"

# Crypto
ring = "0.17"
argon2 = "0.5"
zeroize = "1.6"

# Async/concurrency
tokio = { version = "1", features = ["rt", "sync", "macros"] }
rayon = "1.7"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# Testing
mockito = "1.2"
tokio-test = "0.4"
```

### 6.2 Main Crate Cargo.toml

```toml
[package]
name = "chronex-core"
version.workspace = true
edition.workspace = true
authors.workspace = true

[dependencies]
serde = { workspace = true }
serde_json = { workspace = true }
tokio = { workspace = true }
sqlx = { workspace = true }
chrono = { workspace = true }
uuid = { workspace = true }
anyhow = { workspace = true }
thiserror = { workspace = true }

# For HTTP API
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["trace", "cors"] }

# For tauri integration
tauri = { version = "2", features = ["shell-open", "self-signed-cert"] }

# Cryptography
ring = { workspace = true }
argon2 = { workspace = true }
zeroize = { workspace = true }

# FTS5 search
sqlx-sqlite = { version = "0.7" }

# Caching
lru = "0.12"

# Logging
tracing = { workspace = true }
tracing-subscriber = { workspace = true }

[dev-dependencies]
tokio = { version = "1", features = ["full"] }
```

---

## 7. API DESIGN (REST Facade)

### 7.1 REST Endpoints (Tauri-Based)

```rust
// crates/chronex-tauri/src/commands.rs

use chronex_core::modules::blocks::BlockService;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CreateBlockRequest {
    pub notebook_id: String,
    pub title: String,
    pub content: String,
}

#[derive(Serialize, Deserialize)]
pub struct BlockResponse {
    pub id: String,
    pub notebook_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn create_block(
    req: CreateBlockRequest,
    state: tauri::State<'_, AppState>,
) -> Result<BlockResponse, String> {
    let block = state
        .block_service
        .create_block(&req.notebook_id, &req.title, &req.content)
        .await
        .map_err(|e| e.to_string())?;

    Ok(BlockResponse {
        id: block.id,
        notebook_id: block.notebook_id,
        title: block.title,
        created_at: block.created_at.to_rfc3339(),
        updated_at: block.updated_at.to_rfc3339(),
    })
}

#[tauri::command]
pub async fn get_block(
    block_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<BlockResponse, String> {
    let block = state
        .block_service
        .get_block(&block_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(BlockResponse {
        id: block.id,
        notebook_id: block.notebook_id,
        title: block.title,
        created_at: block.created_at.to_rfc3339(),
        updated_at: block.updated_at.to_rfc3339(),
    })
}

#[tauri::command]
pub async fn list_blocks(
    notebook_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<BlockResponse>, String> {
    let blocks = state
        .block_service
        .list_blocks(&notebook_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(blocks
        .into_iter()
        .map(|block| BlockResponse {
            id: block.id,
            notebook_id: block.notebook_id,
            title: block.title,
            created_at: block.created_at.to_rfc3339(),
            updated_at: block.updated_at.to_rfc3339(),
        })
        .collect())
}

#[tauri::command]
pub async fn delete_block(
    block_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state
        .block_service
        .delete_block(&block_id)
        .await
        .map_err(|e| e.to_string())
}
```

### 7.2 Frontend Bindings (TypeScript)

```typescript
// frontend/src/api/blocks.ts

import { invoke } from '@tauri-apps/api/core';

export interface CreateBlockRequest {
  notebook_id: string;
  title: string;
  content: string;
}

export interface BlockResponse {
  id: string;
  notebook_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const blocksAPI = {
  create: async (req: CreateBlockRequest): Promise<BlockResponse> => {
    return await invoke('create_block', { req });
  },

  get: async (blockId: string): Promise<BlockResponse> => {
    return await invoke('get_block', { blockId });
  },

  list: async (notebookId: string): Promise<BlockResponse[]> => {
    return await invoke('list_blocks', { notebookId });
  },

  delete: async (blockId: string): Promise<void> => {
    return await invoke('delete_block', { blockId });
  },
};

// Usage in React
export function useBlocks(notebookId: string) {
  const [blocks, setBlocks] = useState<BlockResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blocksAPI.list(notebookId).then(setBlocks).finally(() => setLoading(false));
  }, [notebookId]);

  return { blocks, loading };
}
```

---

## 8. DEVELOPMENT WORKFLOW

### 8.1 Build & Run

```bash
# Clone and setup
git clone https://github.com/nestormonroy/chronex.git
cd chronex

# Install dependencies
cargo build --release

# Development (with hot reload for frontend)
npm run dev

# Run tests
cargo test
cargo test --doc

# Build desktop app
npm run tauri build
```

### 8.2 Development Cycle

```
┌─────────────────────────────────────────┐
│ 1. Modify Frontend (React/TypeScript)    │
│    ├─ Hot reload in browser              │
│    └─ Test locally                       │
│                                         │
│ 2. Modify Backend (Rust)                │
│    ├─ Recompile (cargo rebuild)          │
│    ├─ Update module/service              │
│    └─ Update Tauri commands              │
│                                         │
│ 3. Update Types (if needed)             │
│    ├─ Modify entities.rs                 │
│    └─ Regenerate TypeScript (manual)    │
│                                         │
│ 4. Test Integration                     │
│    ├─ Run Tauri app                      │
│    ├─ Test RPC commands                  │
│    └─ Manual QA                          │
│                                         │
│ 5. Commit & Push                        │
│    ├─ Code review                        │
│    └─ Merge to main                      │
│                                         │
│ 6. Release                              │
│    ├─ Tag version                        │
│    ├─ Build for all platforms            │
│    └─ Publish to GitHub Releases         │
└─────────────────────────────────────────┘
```

---

## 9. COMPARISON TABLE: AFFiNE Patterns → Chronex Implementation

```
PATTERN                | AFFiNE (TypeScript)     | Chronex (Rust)
──────────────────────────────────────────────────────────────
Module Organization    | packages/frontend/*     | crates/chronex-core/src/modules/
Frontend Modules       | 69 packages             | 15-20 modules
Backend Modules        | NestJS services         | Service structs
Entity Definition      | Class + interfaces      | Struct + serde
Service Pattern        | Class methods           | Impl blocks
Dependency Injection   | Module imports          | Trait-based DI
Error Handling         | throw/catch             | Result<T, E>
Async Operations       | async/await (TS)        | async/await (Rust)
Database Access        | Prisma ORM              | sqlx + repositories
Type Safety            | TypeScript strict       | Rust compiler
Testing                | Vitest + Playwright     | cargo test + integration
Build Time             | 60-90 min               | 5-15 min
Binary Size            | N/A (SaaS)              | 10 MB (Tauri desktop)
Deployment             | Cloud (Node.js)         | Desktop (Binary)
Developer Experience   | Excellent (TS)          | Excellent (Rust types)
Performance            | 50-100ms                | 1-5ms
Memory Usage           | ~150 MB (Node.js)       | ~50 MB (Rust)

Verdict:
├─ Modularity: ✅ SAME (both pattern-driven)
├─ Type Safety: ✅ Rust > TypeScript
├─ Performance: ✅ Rust >> TypeScript
├─ Developer Experience: ≈ SIMILAR (both excellent)
└─ Simplicity: ✅ Chronex simpler (12 vs 101 modules)
```

---

## 10. ROADMAP: How AFFiNE Patterns Scale in Chronex

```
v1.0 (Q2 2024) - Local-First, AFFiNE-Inspired Structure
├─ Frontend: React + 15 modules (blocks, notebooks, search, etc.)
├─ Backend: Rust + 8 services (all modules in chronex-core)
├─ Database: SQLite (local, encrypted)
├─ Deployment: Tauri desktop app (10 MB)
└─ Pattern: Modular, service-oriented, type-safe

v1.5 (Q4 2024) - Optional Cloud Sync
├─ Frontend: SAME (React, unchanged)
├─ Backend: Rust (add PostgreSQL driver)
├─ Database: SQLite (primary) + PostgreSQL (optional cloud)
├─ API: Tauri + optional HTTP REST
└─ Pattern: EXTEND modules, same architecture

v2.0 (2025) - Real-Time Collaboration (If Demanded)
├─ Frontend: Add BlockSuite-style CRDT
├─ Backend: Split into microservices? (or keep Rust monolith)
├─ Database: PostgreSQL (primary) + Redis (cache)
├─ API: REST + WebSocket + GraphQL
└─ Pattern: Add more modules (collaboration, comments, etc.)

Key Principle:
└─ Same AFFiNE-inspired modular pattern scales from v1.0 → v2.0
   Just ADD modules as features grow, don't reorganize
```

---

## 11. SUMMARY: Why This Architecture Works

### Philosophy

```
Chronex = AFFiNE's Elegance (Modularity)
        + Rust's Efficiency (Performance)
        + Tauri's Simplicity (Desktop)
        + Chronex's Focus (Personal First)

Benefits:

1. MODULARITY (from AFFiNE)
   ├─ Clear separation of concerns
   ├─ Easy to understand (one module = one feature)
   ├─ Easy to test (service → repository pattern)
   ├─ Easy to extend (add new modules)
   └─ Easy to parallelize (teams work independently)

2. PERFORMANCE (from Rust)
   ├─ <5ms operations (vs AFFiNE 50-100ms)
   ├─ <50 MB memory (vs Node.js 150 MB)
   ├─ 10 MB binary (vs Electron 150 MB)
   ├─ Native compilation (no runtime)
   └─ Crypto-efficient (AES-GCM native)

3. TYPE SAFETY (Rust best-in-class)
   ├─ Compile-time error catching
   ├─ No null pointer exceptions
   ├─ Lifetime guarantees
   ├─ No runtime type errors
   └─ Excellent IDE support

4. DEVELOPER EXPERIENCE
   ├─ Clear module structure (learn one → learn all)
   ├─ Strong types guide implementation
   ├─ Fast compile-run cycle (cargo watch)
   ├─ Excellent error messages
   └─ Rich ecosystem (tokio, sqlx, serde, etc.)

5. SCALABILITY PATH
   ├─ v1.0: Rust backend (optimal for local-first)
   ├─ v1.5: Add PostgreSQL (scale to multi-device)
   ├─ v2.0: Add collaboration (if users want it)
   └─ Same architecture supports all phases
```

### Key Differences from AFFiNE (Good!)

```
✅ Chronex vs ❌ AFFiNE Complexity:

1. Modules: 8-12 focused ✅ vs 101+ sprawling ❌
2. Languages: Mostly Rust ✅ vs 89.7% TS ❌
3. Build time: 5-15 min ✅ vs 60-90 min ❌
4. Binary size: 10 MB ✅ vs 150 MB Electron ❌
5. Deployment: Single binary ✅ vs cloud infra ❌
6. Team size: 1-2 people ✅ vs 50+ engineers ❌
7. Funding: Bootstrap ✅ vs Series B ❌
8. Complexity: Intentional simplicity ✅ vs feature bloat ❌

Result:
└─ Same patterns, but lean, fast, and focused
   AFFiNE's architecture wisdom without AFFiNE's complexity
```

---

**Document Status**: Architecture Complete  
**Next Step**: Begin implementation of crate structure and module skeleton  
**Reference**: See TAURI_DEEP_ANALYSIS.md + AFFINE_TYPESCRIPT_ARCHITECTURE.md for context
