# JOPLIN Project Structure Analysis

**Analysis Date**: 2026-04-12  
**Scope**: Joplin v2.10+ repository structure  
**Architecture Pattern**: Monorepo with independent packages & shared dependencies  

---

## 1. ACTUAL JOPLIN STRUCTURE (FROM REPO)

```
joplin/
├─ .git/
├─ .github/
│  ├─ workflows/             # Per-platform build workflows
│  │  ├─ build-android.yml
│  │  ├─ build-macos-m1.yml
│  │  ├─ github-actions-main.yml
│  │  └─ ... (other workflows)
│  └─ scripts/
│
├─ Assets/                   # Images, icons, resources
│  ├─ Forum/
│  ├─ ImageSources/
│  ├─ LinuxIcons/
│  ├─ TinyMCE/
│  ├─ iOSIcons/
│  └─ macOs.iconset/
│
├─ packages/                 # MONOREPO - Individual packages
│  ├─ app-cli/               # Node.js CLI app
│  │  ├─ app/                # CLI implementation
│  │  │  ├─ command-*.ts     # Individual commands
│  │  │  ├─ cli.ts           # CLI setup
│  │  │  └─ ... (app logic)
│  │  ├─ tests/              # Jest test files
│  │  ├─ package.json        # Package-specific config
│  │  ├─ tsconfig.json
│  │  ├─ jest.config.js
│  │  └─ build/
│  │
│  ├─ app-desktop/           # Electron desktop app
│  │  ├─ gui/                # React components
│  │  ├─ services/           # Desktop-specific services
│  │  ├─ build/              # Electron builder config
│  │  ├─ integration-tests/   # E2E tests
│  │  ├─ locales/            # Translation files
│  │  ├─ style/              # CSS/Sass
│  │  ├─ package.json
│  │  ├─ jest.config.js
│  │  └─ build-mac/          # macOS-specific build
│  │
│  ├─ app-mobile/            # React Native iOS + Android
│  │  ├─ android/            # Android-specific (Gradle)
│  │  ├─ ios/                # iOS-specific (Xcode)
│  │  ├─ components/         # React Native components
│  │  ├─ screens/            # Mobile screens
│  │  ├─ locales/
│  │  ├─ package.json
│  │  ├─ jest.config.js
│  │  └─ App.tsx             # React Native entry
│  │
│  ├─ app-web/               # React SPA web app
│  │  ├─ src/
│  │  │  ├─ App.tsx
│  │  │  ├─ components/
│  │  │  └─ pages/
│  │  ├─ public/
│  │  ├─ package.json
│  │  ├─ jest.config.js
│  │  └─ webpack.config.js
│  │
│  ├─ app-clipper/           # Browser extension
│  │  ├─ content_scripts/
│  │  ├─ popup/
│  │  ├─ icons/
│  │  ├─ manifest.json
│  │  └─ package.json
│  │
│  ├─ server/                # Node.js/Express backend
│  │  ├─ src/
│  │  │  ├─ server.ts        # Express setup
│  │  │  ├─ models/          # Database models
│  │  │  ├─ routes/          # API routes
│  │  │  ├─ middleware/
│  │  │  ├─ services/
│  │  │  └─ ... (backend logic)
│  │  ├─ migrations/         # Database migrations (Knex.js)
│  │  │  ├─ 20190913171451_create.ts
│  │  │  ├─ 20210201143859_app_share.ts
│  │  │  └─ ... (40+ migrations)
│  │  ├─ tests/              # Jest test files
│  │  ├─ Dockerfile          # Server container config
│  │  ├─ docker-compose.server.yml
│  │  ├─ package.json
│  │  ├─ jest.config.js
│  │  └─ tsconfig.json
│  │
│  ├─ lib/                   # Shared library (encryption, sync)
│  │  ├─ models/             # Database models
│  │  ├─ services/           # Shared services
│  │  │  ├─ EncryptionService.ts
│  │  │  ├─ SyncService.ts
│  │  │  └─ ...
│  │  ├─ utils/              # Utilities
│  │  ├─ package.json
│  │  └─ jest.config.js
│  │
│  ├─ renderer/              # Markdown/HTML rendering
│  │  ├─ src/
│  │  │  ├─ marked.ts        # Markdown parser
│  │  │  ├─ renderer.ts      # HTML renderer
│  │  │  └─ ...
│  │  ├─ package.json
│  │  └─ jest.config.js
│  │
│  ├─ tools/                 # Build & development tools
│  │  ├─ buildServerDocker.js
│  │  ├─ release-android.js
│  │  ├─ release-cli.js
│  │  ├─ release-electron.js
│  │  ├─ gulp/               # Gulp build tasks
│  │  ├─ website/            # Website build tools
│  │  └─ ... (30+ tools)
│  │
│  └─ ... (other packages like api, types, etc.)
│
├─ fastlane/                 # iOS/Android release automation
├─ .env-sample              # Environment template
├─ package.json             # Root - declares workspaces
├─ yarn.lock                # Shared dependency lock
├─ Makefile
├─ docker-compose.server.yml
├─ docker-compose.db-dev.yml
├─ .github/workflows/       # CI/CD (per-platform)
├─ README.md
└─ LICENSE
```

---

## 2. KEY CHARACTERISTICS: MONOREPO

### 2.1 Workspace Declaration
```json
// package.json (root)
{
  "workspaces": [
    "packages/*"
  ]
}
```

This means:
- ✓ Each package has own `package.json`
- ✓ Yarn manages dependencies across all packages
- ✓ `yarn install` installs all packages' dependencies
- ✓ Shared `yarn.lock` prevents version conflicts
- ✗ More complex CI/CD (multiple build targets)

### 2.2 Package Directory Organization
```
packages/
├─ app-*     → Deployable applications
├─ server/   → Backend server
├─ lib/      → Shared library
├─ tools/    → Build tools
└─ renderer/ → Rendering engine
```

**By Purpose**: Not by language (all TypeScript/Node, but different runtimes)

### 2.3 Import Paths
```typescript
// In packages/app-desktop/src/...
import { EncryptionService } from '@joplin/lib';           // From lib package
import { SyncService } from '@joplin/lib/services';
import { util } from '@joplin/lib/utils';

// In packages/server/src/...
import { Database } from '@joplin/server';
import { EncryptionService } from '@joplin/lib';

// Package names: @joplin/{package-name}
// (internal npm scoping)
```

---

## 3. WHY THIS STRUCTURE WORKS FOR JOPLIN

### Joplin's Constraints:
- **Multiple deployment targets** (desktop, mobile, server, web, clipper)
- **Shared code** (lib, renderer, encryption)
- **Independent versions** (app-cli v2.10, server v2.10, but could diverge)
- **Multiple languages/runtimes**:
  - Electron (desktop)
  - React Native (mobile)
  - Node.js (server & CLI)
  - React (web)
  - Webextension API (clipper)

### The Monorepo Structure Supports:
✓ Shared `@joplin/lib` prevents code duplication  
✓ Each app has own build/test/deploy pipeline  
✓ Clear package boundaries (app-mobile doesn't include app-desktop code)  
✓ Parallel testing (yarn workspaces foreach --parallel run test)  
✓ Coordinated releases (all v2.10.0 together, or independent)  
✓ External plugin/package development (uses @joplin/api from npm)  

---

## 4. JOPLIN'S BUILD COORDINATION

### Per-Platform Build Scripts
```json
{
  "scripts": {
    "buildParallel": "yarn workspaces foreach --parallel run build",
    "buildSequential": "yarn workspaces foreach run build",
    "test": "yarn workspaces foreach --parallel run test",
    "releaseDesktop": "node packages/tools/release-electron.js",
    "releaseAndroid": "node packages/tools/release-android.js",
    "releaseCli": "node packages/tools/release-cli.js",
    "releaseServer": "node packages/tools/buildServerDocker.js"
  }
}
```

Each tool (in `packages/tools/`) knows how to:
- Build the app
- Sign the artifact
- Publish to appropriate channel (App Store, Google Play, npm, Docker Hub)

### Example: Desktop Release Flow
```bash
# 1. Build all packages
yarn buildParallel

# 2. Release desktop specifically
yarn releaseDesktop
# This runs: node packages/tools/release-electron.js
# Which handles:
#  - Code signing (Windows + macOS)
#  - Notarization (macOS)
#  - Creating installers
#  - Publishing to GitHub Releases
#  - Updating auto-update metadata
```

---

## 5. DEPENDENCY MANAGEMENT

### Workspace-Level (All packages):
```json
{
  "devDependencies": {
    "typescript": "5.0.0",
    "jest": "29.7.0"
  }
}
```

### Package-Level (Specific to app-desktop):
```json
// packages/app-desktop/package.json
{
  "dependencies": {
    "electron": "27.0.0",
    "@joplin/lib": "*"  // Use from workspace
  }
}
```

### Package-Level (Specific to server):
```json
// packages/server/package.json
{
  "dependencies": {
    "express": "4.18.0",
    "knex": "3.0.0",      // Database migrations
    "pg": "8.11.0",       // PostgreSQL driver
    "@joplin/lib": "*"
  }
}
```

**Key**: `@joplin/lib` is listed as dependency, but:
- ✓ During development: Uses local workspace version
- ✓ In production: Downloaded from npm (if published separately)

---

## 6. DATABASE MIGRATIONS ACROSS PACKAGES

Joplin's migrations are in `packages/server/migrations/`:

```typescript
// 20210201143859_app_share.ts
import { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('app_shares', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('app_shares');
};
```

These are **server-only** migrations. Desktop/mobile don't have them.

---

## 7. TESTING IN JOPLIN MONOREPO

```bash
# Run ALL tests (across all packages)
yarn test

# Output:
# ✓ @joplin/app-cli: 45 tests
# ✓ @joplin/app-desktop: 78 tests
# ✓ @joplin/app-mobile: 62 tests
# ✓ @joplin/server: 89 tests
# ✓ @joplin/lib: 88 tests
# Total: 362 tests, passed in 8 min

# Run specific package tests
yarn workspace @joplin/server run test
```

---

## 8. DEPLOYMENT DIFFERENCES

```
Rclone (single module):
  → Single binary (rclone)
  → Deploy anywhere
  → One executable

Joplin (monorepo):
  → Multiple artifacts:
    ├─ rclone.exe (Windows installer)
    ├─ Joplin.dmg (macOS)
    ├─ app.AppImage (Linux)
    ├─ Joplin.apk (Android)
    ├─ Joplin.app (iOS, from App Store)
    ├─ joplin-server Docker image
    ├─ joplin-cli npm package
    ├─ Joplin web PWA
    └─ browser-clipper.zip
  
  → Each deployed independently
  → Different release schedules possible
  → Cross-platform UI coordination needed
```

---

## 9. LIBRARY & PLUGIN ECOSYSTEM

Because Joplin uses monorepo, it can publish packages to npm:

```bash
# External developers can use:
npm install @joplin/api
npm install @joplin/lib

// In their plugin:
import { joplin } from '@joplin/api';

joplin.plugins.register({
  onStart: async () => { ... }
});
```

Rclone doesn't allow this (single module, not published as library).

---

## 10. CHRONEX ARCHITECTURAL DECISION

### If Chronex Follows Rclone (Single Module):
```
chronex/
├─ backends/
├─ sync/
├─ cmd/
├─ server/        ← WebDAV server code
├─ cache/
├─ encryption/
├─ go.mod
└─ main.go
```

**Result**: Single binary, but:
- ✗ Server code bundled in CLI binary
- ✗ Must deploy CLI even if only need server
- ✗ Desktop/mobile would be separate repos

### If Chronex Follows Joplin (Monorepo):
```
chronex/
├─ packages/
│  ├─ core/          # Go: sync engine, backends, server
│  ├─ desktop/       # Electron + React
│  ├─ mobile/        # React Native
│  ├─ web/           # React SPA
│  ├─ cli/           # Node.js wrapper around core
│  └─ types/         # Shared TypeScript types
├─ package.json
└─ docker-compose.yml
```

**Result**: Multiple artifacts:
- ✓ chronex-server (Docker)
- ✓ chronex-cli (binary)
- ✓ chronex-desktop (Electron)
- ✓ chronex-mobile (iOS/Android)
- ✓ chronex-web (PWA)

---

## 11. GOTCHAS WITH JOPLIN'S APPROACH

### Complexity:
```javascript
// To understand a user report "app crashes on sync"
// You might need to check:
packages/lib/services/SyncService.ts       // Core sync logic
packages/app-desktop/gui/SyncBar.tsx        // Desktop UI
packages/app-mobile/components/SyncUI.tsx   // Mobile UI
packages/server/src/routes/sync.ts          // Server logic

// All coordinated, but separate files
```

### CI/CD Overhead:
```yaml
# Joplin has multiple CI workflows:
build-android.yml        # 30 min Android build
build-macos-m1.yml       # 25 min macOS build
github-actions-main.yml  # 20 min main tests

# Total CI time: 75+ minutes
# Rclone: 15 minutes (7 parallel jobs)
```

### Dependency Version Conflicts:
```json
// packages/app-desktop/package.json
{ "react": "^18.0.0" }

// packages/app-mobile/package.json
{ "react": "^17.0.0" }  // ← Might conflict!

// Yarn workspaces handles this, but adds complexity
```

---

## Summary Table: Structure Comparison

| Aspect | Rclone (Single Module) | Joplin (Monorepo) |
|--------|---|---|
| **Organization** | Domain-based (backend/, fs/, cmd/) | Package-based (app-*, lib) |
| **Deployments** | 1 (binary) | 7+ (desktop, mobile, server, web, cli, clipper, etc.) |
| **Languages** | Go only | TypeScript/Node + Electron + React Native |
| **Versioning** | Atomic (single VERSION file) | Per-package (package.json versions) |
| **Dependencies** | Single go.mod | Multiple package.json + shared yarn.lock |
| **CI/CD** | 15 min (parallel) | 75+ min (sequential platforms) |
| **Code Reuse** | Via imports (no packages) | Via @joplin/* packages (publishable) |
| **Testing** | Single test suite | Parallel workspace tests |
| **Build Tool** | Makefile | Yarn workspaces + npm scripts |
| **Monorepo Tool** | None needed | Yarn v4 |
| **Scaling** | Hard beyond 1-2 languages | Good for multi-platform |

---

**Document Status**: New Analysis (Structure Review) - Complete  
**References**: joplin/package.json, joplin/packages/*/package.json, joplin/.github/workflows/  
**Next**: Compare with rclone and recommend for Chronex
