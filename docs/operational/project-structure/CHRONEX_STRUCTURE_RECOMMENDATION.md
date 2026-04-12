# CHRONEX Project Structure Recommendation

**Analysis Date**: 2026-04-12  
**Decision**: Hybrid approach combining Rclone simplicity with Joplin flexibility  
**Status**: Critical Architecture Decision (addresses user feedback)

---

## 1. THE PROBLEM I INITIALLY CREATED

In the JOPLIN_DEPLOYMENT.md document, I recommended a Joplin-style monorepo WITHOUT analyzing:

1. **Rclone's actual structure** (NOT a monorepo - single Go module)
2. **Why each chose their structure** (different constraints)
3. **Chronex's specific needs** (Go backend + multi-platform frontends)

This was premature and incorrect.

---

## 2. CHRONEX'S ACTUAL REQUIREMENTS (REVISITED)

### Deployments Needed:
```
✓ Backend server      (Go, WebDAV, REST API, gRPC)
✓ Desktop app        (Electron + React, could be separate)
✓ Web app           (React PWA)
✓ Mobile           (React Native, future)
✓ CLI               (Optional, less critical)
✓ Obsidian plugin   (TypeScript, separate)
```

### Languages:
```
Backend:    Go (primary, sync-critical)
Frontend:   TypeScript/React (desktop, web, mobile)
Plugin:     TypeScript (Obsidian API)
```

### Versioning:
```
Backend:    Semantic versioning (v1.0.0)
Frontends:  Could track backend version or independent
```

---

## 3. RECLONE'S APPROACH: WHEN IT WORKS

### Rclone Pattern Fits When:
✓ Single deployment artifact (binary)  
✓ Single language (Go)  
✓ Atomic versioning (everything ships together)  
✓ Shared abstractions (fs.Fs interface)  
✓ NO multiple UI platforms  

### Rclone Pattern FAILS When:
✗ Multiple deployment targets (server + desktop + web)  
✗ Multiple languages (Go + TypeScript)  
✗ Independent versioning needed  
✗ Different build processes per platform  

**Chronex has ALL the "fails" → Rclone pattern won't work**

---

## 4. JOPLIN'S APPROACH: WHEN IT WORKS

### Joplin Pattern Fits When:
✓ Multiple deployment targets (✓ Chronex has this)  
✓ Multiple languages/runtimes (✓ Chronex has this)  
✓ Shared code to reuse (@joplin/lib) (✓ Chronex needs this)  
✓ Independent version management possible (✓ Chronex might need)  
✓ Coordinated releases (✓ Chronex needs)  

### Joplin Pattern STRUGGLES With:
✗ CI/CD complexity (75+ min vs 15 min for Rclone)  
✗ Dependency coordination  
✗ Multiple build tools (Electron builder, Gradle, webpack, etc.)  
✗ Large monorepo (100+ packages possible)  

**Chronex has many "fits" but can avoid some "struggles" through careful design**

---

## 5. RECOMMENDED STRUCTURE FOR CHRONEX

### HYBRID APPROACH:
```
chronex/
├─ backend/              ← Go module (Rclone-style)
│  ├─ sync/              # Core sync engine
│  ├─ backends/          # WebDAV, S3, local, etc.
│  ├─ server/            # WebDAV server, REST API, gRPC
│  ├─ cache/             # Caching layer
│  ├─ encryption/        # E2EE
│  ├─ cmd/               # CLI
│  ├─ config/            # Configuration
│  ├─ go.mod             # Single Go module
│  ├─ Dockerfile         # Backend container
│  ├─ Makefile           # Go build automation
│  └─ main.go
│
├─ frontend/             ← TypeScript monorepo (Joplin-style)
│  ├─ packages/
│  │  ├─ desktop/        # Electron + React
│  │  │  ├─ src/
│  │  │  ├─ build/
│  │  │  ├─ package.json
│  │  │  ├─ tsconfig.json
│  │  │  └─ jest.config.js
│  │  │
│  │  ├─ web/            # React PWA
│  │  │  ├─ src/
│  │  │  ├─ public/
│  │  │  ├─ package.json
│  │  │  └─ webpack.config.js
│  │  │
│  │  ├─ mobile/         # React Native (future)
│  │  │  ├─ android/
│  │  │  ├─ ios/
│  │  │  ├─ src/
│  │  │  ├─ package.json
│  │  │  └─ index.tsx
│  │  │
│  │  └─ types/          # Shared TypeScript types
│  │     ├─ sync.ts
│  │     ├─ api.ts
│  │     └─ package.json
│  │
│  ├─ package.json       # Monorepo root
│  ├─ yarn.lock
│  ├─ tsconfig.json
│  └─ jest.config.js
│
├─ obsidian-plugin/      # Separate repo (or submodule)
│  ├─ src/
│  ├─ manifest.json
│  ├─ package.json
│  └─ README.md
│
├─ docker-compose.yml    # Local development (NOT production)
├─ Makefile              # Top-level build orchestration
├─ docs/                 # Documentation
└─ README.md
```

---

## 6. WHY THIS HYBRID APPROACH

### Backend (Single Go Module - Rclone Style):
```
Advantages:
  ✓ Atomic versioning (v1.0.0 is one release)
  ✓ Single binary deployable anywhere
  ✓ Fast builds (Go compiles everything)
  ✓ Clear sync-critical code path
  ✓ Simple dependency management
  ✓ Easy to containerize (single Dockerfile)
```

### Frontend (TypeScript Monorepo - Joplin Style):
```
Advantages:
  ✓ Shared types (@chronex/types)
  ✓ Independent UI platforms (desktop ≠ web ≠ mobile)
  ✓ Parallel testing & building
  ✓ Code sharing where needed
  ✓ Clear UI package boundaries
  ✓ Future-proof for mobile
```

### Obsidian Plugin (Separate):
```
Advantages:
  ✓ Independent versioning (plugin v1.2.3 ≠ backend v1.0.0)
  ✓ Separate release cycle
  ✓ Obsidian plugin standards compliance
  ✓ Could be published to plugin registry independently
```

---

## 7. BUILD & DEPLOYMENT IMPLICATIONS

### Backend Deployment:
```bash
# Build backend
cd backend
make build          # Produces: chronex-linux-amd64, etc.
make docker         # Produces: chronex:v1.0.0 Docker image

# Deploy
docker push chronex:v1.0.0
# Or use single binary: scp chronex-linux-amd64 server:/app/
```

### Frontend Deployment:
```bash
# Build all UIs
cd frontend
yarn build          # Builds desktop, web, mobile

# Deploy independently
yarn workspace @chronex/desktop run dist    # → chronex-desktop-1.0.0.exe
yarn workspace @chronex/web run build       # → dist/ for S3
yarn workspace @chronex/mobile run build    # → .apk, .ipa
```

### Docker Compose (Development Only):
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
  chronex-server:
    build: ./backend
    depends_on: [postgres]
    ports: ["6789:6789"]
```

Used ONLY for local development, NOT production.

---

## 8. VERSIONING STRATEGY

### Option A: Unified Versioning (Recommended for Chronex)
```
chronex v1.0.0 release includes:
  ├─ backend v1.0.0
  ├─ frontend-desktop v1.0.0
  ├─ frontend-web v1.0.0
  ├─ frontend-mobile v1.0.0 (or skipped if not ready)
  └─ obsidian-plugin v1.0.0

All released together, all compatible.
```

### Option B: Independent Versioning (Joplin-style)
```
backend v2.1.0 might ship with:
  ├─ frontend-desktop v1.5.3
  ├─ frontend-web v1.5.3
  └─ obsidian-plugin v1.2.0

(Not recommended initially - adds complexity)
```

**Recommendation**: Start with Unified (Option A), evolve to Independent only if needed.

---

## 9. CI/CD STRUCTURE

### Local Development:
```bash
# Install all
make install         # Installs Go + Node/Yarn

# Run all tests
make test           # backend tests + frontend tests
make test-backend   # Go tests only
make test-frontend  # Jest tests only

# Build all
make build          # backend + frontend builds

# Local run
docker-compose up   # PostgreSQL + server locally
```

### GitHub Actions:
```yaml
# .github/workflows/

test.yml:
  - Run backend tests (Go)
  - Run frontend tests (Jest, parallel)
  
build.yml:
  - Build backend for Linux/macOS/Windows (parallel)
  - Build Electron app (Windows, macOS)
  - Build Android APK
  - Build iOS (if notarization set up)
  - Build web PWA
  
release.yml:
  - Tag and release (when tag pushed)
  - Upload binaries to GitHub Releases
  - Push Docker image
  - Update checksums
```

---

## 10. CRITICAL DECISIONS FOR CHRONEX

### Decision 1: Backend Versioning
```
✓ Recommended: Single Go module (Rclone style)
✗ Not Recommended: Go monorepo (overly complex)

Reason: Backend is sync-critical, must be atomic
```

### Decision 2: Frontend Packaging
```
✓ Recommended: TypeScript monorepo (Joplin style)
✗ Not Recommended: Single JavaScript module

Reason: Multiple platforms (desktop, web, mobile),
need independent builds and testing
```

### Decision 3: Docker Composition
```
✓ For development: docker-compose.yml OK
✗ For production: Should use:
  ├─ Docker images directly (docker run, docker swarm)
  ├─ Kubernetes manifests (.yaml)
  ├─ Or shell scripts (see next document)

Reason: docker-compose is development tool, not production-ready
```

### Decision 4: Build Orchestration
```
✓ Top-level Makefile for convenience
✓ Per-component scripts (make, yarn, gradle)
✗ Single build tool for everything (too much abstraction)

Reason: Each component has different build requirements,
single tool would be incomprehensible
```

---

## 11. FILE STRUCTURE IN DETAIL

### Backend (Go Module):
```
backend/
├─ go.mod
├─ go.sum
├─ main.go               # CLI entry
├─ server/               # WebDAV server
│  ├─ handler.go
│  ├─ handler_test.go
│  └─ ...
├─ sync/                 # Sync engine (core)
│  ├─ engine.go
│  ├─ engine_test.go
│  └─ ...
├─ backends/             # Storage backends
│  ├─ webdav/
│  ├─ s3/
│  ├─ local/
│  └─ ...
├─ cache/
├─ encryption/
├─ cmd/                  # CLI commands
├─ Makefile
├─ Dockerfile
└─ tests/
```

### Frontend (TypeScript Monorepo):
```
frontend/
├─ packages/
│  ├─ desktop/package.json       (@chronex/desktop)
│  ├─ web/package.json           (@chronex/web)
│  ├─ mobile/package.json        (@chronex/mobile)
│  ├─ types/package.json         (@chronex/types)
│  │  ├─ sync.ts                 # Shared types
│  │  ├─ api.ts
│  │  └─ package.json
│  └─ shared/package.json        (@chronex/shared)
│     ├─ hooks/
│     ├─ utils/
│     └─ package.json
├─ package.json          # Root: declares workspaces
├─ yarn.lock
└─ tsconfig.json
```

---

## 12. COMPARISON TABLE

| Aspect | Rclone | Joplin | Chronex Hybrid |
|--------|--------|--------|-----------------|
| Backend | Single module | Monorepo | ✓ Single module |
| Frontend | N/A | Monorepo | ✓ Monorepo |
| Versioning | Atomic | Per-package | ✓ Atomic (initially) |
| CI/CD Time | 15 min | 75+ min | ~20-30 min |
| Build Tools | Make | Yarn + npm + gradle | ✓ Make + Yarn |
| Docker | Single image | Multiple images | ✓ Single image (backend) + static (frontend) |
| Deployment | Binary | Multi-artifact | ✓ Both (backend binary + frontend static) |
| Code Sharing | Via imports | Via @joplin/* | ✓ Via @chronex/types + @chronex/shared |
| Testing | All together | Parallel | ✓ Parallel (backend + frontend) |

---

## 13. MIGRATION STRATEGY

### Phase 1 (MVP):
```
backend/         (single Go module)
frontend/
  └─ packages/
     ├─ web/     (React SPA only)
     └─ types/
docker-compose.yml
Makefile
```

### Phase 2 (Desktop):
```
backend/         (unchanged)
frontend/
  └─ packages/
     ├─ desktop/ (Electron + React)
     ├─ web/
     └─ types/
```

### Phase 3 (Mobile):
```
backend/         (unchanged)
frontend/
  └─ packages/
     ├─ desktop/
     ├─ mobile/  (React Native)
     ├─ web/
     └─ types/
```

### Phase 4 (Obsidian):
```
backend/         (unchanged)
frontend/        (unchanged)
obsidian-plugin/ (separate package)
```

---

## Summary

### Do NOT copy Rclone exactly:
Because Chronex needs multiple UI platforms.

### Do NOT copy Joplin exactly:
Because backend (Go) is different from frontend (TypeScript).

### DO use hybrid approach:
- **Backend**: Rclone's single-module simplicity
- **Frontend**: Joplin's monorepo flexibility
- **Deployment**: Both as needed

This leverages each reference's strengths while avoiding their weaknesses for Chronex's specific needs.

---

**Document Status**: Architecture Decision - Final  
**Addresses**: Critical user feedback on structure mismatch  
**Next**: Analyze docker-compose alternatives and provide production deployment guidance
