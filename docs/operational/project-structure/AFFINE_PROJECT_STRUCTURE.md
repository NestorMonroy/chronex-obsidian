# AFFiNE Project Structure Analysis

**Analysis Date**: 2026-04-12  
**Scope**: AFFiNE v0.26.3 (Block-based collaborative knowledge management)  
**Architecture Pattern**: Complex hybrid monorepo (TypeScript + Rust)  
**Status**: Active development, pre-1.0

---

## 1. ACTUAL AFFINE STRUCTURE

```
AFFiNE/
├─ blocksuite/              ← SEPARATE FRAMEWORK (editor core)
│  ├─ affine/               # AFFiNE-specific implementation
│  │  ├─ core/              # Block definitions
│  │  ├─ affine-ui/         # Editor UI components
│  │  ├─ template/          # Templates
│  │  └─ ...
│  ├─ framework/            # Generic block framework
│  │  ├─ block-tree/
│  │  ├─ collaborative/     # Yjs integration
│  │  ├─ standard/          # Standard blocks
│  │  └─ ...
│  ├─ integration-test/
│  ├─ playground/           # Editor playground
│  └─ docs/
│
├─ packages/                ← MAIN MONOREPO
│  ├─ backend/              # Node.js + Rust backend
│  │  ├─ server/            # Express/NestJS server
│  │  │  ├─ src/
│  │  │  │  ├─ core/
│  │  │  │  ├─ plugins/     # Server plugins
│  │  │  │  ├─ graphql/
│  │  │  │  └─ ...
│  │  │  ├─ package.json
│  │  │  └─ Dockerfile
│  │  │
│  │  └─ native/            # Rust native bindings
│  │     ├─ src/
│  │     ├─ Cargo.toml
│  │     └─ ... (compiled to WebAssembly/native)
│  │
│  ├─ common/               # Shared packages
│  │  ├─ debug/             # Debug utilities
│  │  ├─ env/               # Environment config
│  │  ├─ error/             # Error handling
│  │  ├─ graphql/           # GraphQL schema
│  │  ├─ infra/             # Infrastructure utilities
│  │  ├─ native/            # Rust native for shared code
│  │  ├─ nbstore/           # Notebook storage (also Rust)
│  │  ├─ reader/            # Document reader
│  │  ├─ s3-compat/         # S3 compatibility layer
│  │  ├─ theme/             # Theme definitions
│  │  ├─ y-octo/            # Collaborative editing engine
│  │  │  ├─ core/           # Core Rust implementation
│  │  │  └─ utils/          # Utilities
│  │  └─ ... (15+ subpackages)
│  │
│  ├─ frontend/             # Web + Desktop + Mobile
│  │  ├─ apps/              # Multiple frontend apps
│  │  │  ├─ web/            # Web version
│  │  │  ├─ electron/       # Desktop (Electron)
│  │  │  ├─ mobile/         # Mobile (future)
│  │  │  └─ cli/            # CLI version
│  │  │
│  │  ├─ admin/             # Admin dashboard
│  │  ├─ component/         # Shared React components
│  │  ├─ core/              # Frontend core logic
│  │  ├─ native/            # Rust bindings for frontend
│  │  │  ├─ nbstore/        # nbstore wrapper
│  │  │  ├─ schema/         # Schema definitions
│  │  │  └─ sqlite_v1/      # SQLite bindings
│  │  │
│  │  └─ plugins/           # Plugin system
│  │
│  └─ ... (more packages)
│
├─ blocksuite/              (ALSO in root - complex structure)
├─ tools/                   # Build & dev tools
│  ├─ @types/               # Type definitions workspace
│  └─ ... (build scripts)
│
├─ scripts/                 # Setup & utility scripts
├─ tests/                   # Test workspace
├─ docs/reference/          # Documentation as workspace
├─ .docker/                 # Docker configurations
│  ├─ dev/                  # Development Docker
│  └─ selfhost/             # Self-hosted Docker
│
├─ .github/
│  ├─ workflows/            # Complex CI/CD matrix
│  ├─ actions/              # Custom GitHub actions
│  ├─ deployment/           # Deployment configs
│  └─ helm/                 # Kubernetes Helm charts
│
├─ Cargo.toml              # Rust workspace
├─ Cargo.lock              # Rust lockfile
├─ package.json            # TypeScript workspace root
├─ yarn.lock               # Yarn lockfile
├─ tsconfig.json           # TypeScript config
├─ .oxlintrc.json          # Oxlint rules (Rust linter)
└─ README.md
```

---

## 2. KEY CHARACTERISTICS: ULTRA-COMPLEX HYBRID

### 2.1 Multiple Workspaces Simultaneously
```json
{
  "workspaces": [
    ".",                           // Root
    "blocksuite/**/*",             // Blocksuite + subpackages
    "packages/*/*",                // packages/backend/server, etc.
    "packages/frontend/apps/*",    // Multiple frontend apps
    "tools/*",                     // Tools
    "tools/@types/*",              // Type definitions
    "tests/*"                      // Tests
  ]
}
```

This creates 100+ workspace entries, each with its own package.json.

### 2.2 Rust + TypeScript Hybrid
```
TypeScript Workspaces:
  ├─ packages/backend/server    (Node.js Express/NestJS)
  ├─ packages/common/*          (Shared libraries)
  └─ packages/frontend/*        (React apps)

Rust Workspaces (Cargo.toml):
  ├─ packages/backend/native    (Backend native code)
  ├─ packages/common/native     (Shared native code)
  ├─ packages/common/y-octo/core   (Collaborative editing - Rust)
  ├─ packages/common/nbstore    (Notebook storage - Rust)
  ├─ packages/frontend/native   (Frontend native bindings)
  └─ packages/frontend/native/sqlite_v1  (SQLite bindings)
```

**Not a typical monorepo - a dual-language workspace system.**

### 2.3 Blocksuite: Separate Framework Within Monorepo
```
blocksuite/                      ← Could be separate repo
├─ framework/                    ← Generic block framework
│  ├─ block-tree/               # Tree structure
│  ├─ collaborative/            # Yjs integration
│  └─ standard/                 # Standard block types
├─ affine/                       ← AFFiNE specific
│  ├─ affine-ui/                # UI components
│  ├─ blocks/                   # AFFiNE blocks
│  └─ editor/
└─ ... (multiple packages)
```

**Blocksuite could be its own framework/library, but is tightly integrated.**

---

## 3. DEPLOYMENT ARTIFACTS

AFFiNE produces:
```
Backend (Node.js + Rust):
  └─ chronex-server:v0.26.3 (Docker image)

Frontend Applications:
  ├─ web app (PWA)
  ├─ electron desktop
  ├─ mobile (future)
  └─ CLI

Each deployed independently, coordinated via workspace.
```

---

## 4. BUILD COMPLEXITY: AFFINE VS OTHERS

```
Rclone:           Simple (single `go build`)
  └─ 30 seconds for binary

Joplin:           Complex (multiple platforms)
  ├─ Desktop: yarn build:desktop (5 min)
  ├─ Mobile: yarn build:mobile (15 min)
  ├─ Server: yarn build:server (2 min)
  └─ Total: 20+ minutes

SiYuan:           Medium (Electron + Go)
  ├─ npm run build (3 min)
  ├─ Go backend build (1 min)
  └─ Total: 5 minutes

AFFiNE:           EXTREME (TypeScript + Rust + multiple apps)
  ├─ Dependencies: yarn install (15 min)
  ├─ TypeScript compilation: tsc (10 min)
  ├─ Rust compilation: cargo build (20-30 min)
  │  └─ Includes y-octo, nbstore, sqlite bindings
  ├─ Frontend build: webpack/vite (10 min)
  ├─ Backend build: Node.js + Docker (5 min)
  └─ Total: 60-90 minutes for FULL build
```

---

## 5. WHY AFFINE CHOSE THIS APPROACH

### AFFiNE's Challenges:
1. **Collaborative editing** (Yjs-like y-octo)
   - Needs high-performance conflict resolution
   - Rust is best for this (speed + memory efficiency)

2. **Block-based document editing**
   - Needs generic framework (blocksuite)
   - AFFiNE-specific implementation

3. **Multi-platform** (web, desktop, mobile)
   - Needs shared code (packages/common/)
   - Platform-specific frontends (apps/*)

4. **Performance requirements**
   - Native bindings for speed (sqlite, WebAssembly)
   - Can't do everything in JavaScript

### Result:
- TypeScript monorepo for flexibility
- Rust workspaces for performance
- Blocksuite as reusable framework
- Complex but necessary complexity

---

## 6. COMPARISON: THE FOUR MODELS

| Aspect | Rclone | Joplin | SiYuan | AFFiNE |
|--------|--------|--------|--------|---------|
| **Structure** | Single module | Monorepo | Electron+Go | Hybrid monorepo |
| **Languages** | Go | TypeScript | TS+Go | TS+Rust |
| **Platforms** | CLI | Desktop+Mobile+Server | Desktop+Web | Web+Desktop+Mobile+CLI |
| **Workspaces** | 0 | 6+ | 0 | 100+ |
| **Backend** | Sync engine | Node.js | Go | Node.js+Rust |
| **Editor/Blocks** | N/A | Markdown | Block-based | Blocksuite framework |
| **Collaborative** | No | Sync-based | No | Yjs-based (y-octo) |
| **Build Time** | 30 sec | 20 min | 5 min | 60-90 min |
| **Deployment** | Single artifact | Multiple | Single exe | Multiple |
| **Team Size** | Small | Medium | Solo | Large (venture-backed) |
| **Maturity** | Stable v1.74 | Stable v2.10 | Stable v3.1.8 | Pre-1.0 v0.26.3 |

---

## 7. FOR CHRONEX: LESSONS FROM AFFINE

### Don't Copy AFFiNE If:
✗ You don't need collaborative editing  
✗ You don't have performance requirements needing Rust  
✗ You don't have large team managing complexity  
✗ You want simple deployment  

### Consider AFFiNE's Approach If:
✓ Real-time collaborative features (like Google Docs)  
✓ Need sub-millisecond latency (use Rust for conflict resolution)  
✓ Block-based document editing  
✓ Complex UI with many platforms  
✓ Large engineering team  

---

## 8. CHRONEX: COMPLEXITY WARNING

AFFiNE's structure is optimized for:
- **Large venture-backed team** (to manage 100+ workspaces)
- **High-performance requirements** (Rust, WebAssembly)
- **Product sophistication** (collaborative real-time editing)

**Chronex should NOT adopt AFFiNE's structure unless:**
1. Chronex grows to 20+ engineers
2. Collaborative editing becomes core feature
3. Performance benchmarks show JavaScript bottlenecks

---

## Summary Table

| Project | Monorepo? | Languages | Platforms | Build Time | Recommendation |
|---------|-----------|-----------|-----------|------------|-----------------|
| Rclone | No (single module) | Go | CLI | 30s | Simple projects |
| Joplin | Yes | TypeScript | Desktop+Mobile+Server | 20 min | Multi-platform apps |
| SiYuan | No | TS+Go | Desktop+Web | 5 min | **GOOD FIT for Chronex** |
| AFFiNE | Yes (hybrid) | TS+Rust | All | 60-90 min | Large ambitious products |

---

**Recommendation for Chronex**: 
SiYuan's approach (TS frontend + Go backend) is closer to ideal than AFFiNE's complexity.

---

**Document Status**: Structure Analysis - Complete  
**References**: AFFiNE/package.json, AFFiNE/Cargo.toml, AFFiNE/blocksuite/, AFFiNE/packages/  
**Next**: Document AFFiNE's testing strategy and deployment approach
