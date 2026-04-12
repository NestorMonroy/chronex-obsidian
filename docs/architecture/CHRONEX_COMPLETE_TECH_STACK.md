# Chronex: Complete Technology Stack Architecture

## 🎯 Overview: Full Product Stack

Chronex no es solo un servidor WebDAV. Es una **plataforma completa de sincronización** que necesita:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CHRONEX ECOSYSTEM                                │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  DESKTOP CLIENT     │  │   MOBILE CLIENT     │  │   WEB CLIENT        │
│  (Electron + React) │  │  (iOS + Android)    │  │  (Web App)          │
│                     │  │                     │  │                     │
│ • Offline-first     │  │ • Native feel       │  │ • Browser-based     │
│ • Local encryption  │  │ • Sync in background│ │ • Cloud access      │
│ • File system access│  │ • Push notifications│ │ • Collaborative     │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────┬───────────┴────────────┬───────────┘
                        │                        │
                   ┌────▼────────────────────────▼────┐
                   │   OBSIDIAN PLUGIN               │
                   │   (Synchronization bridge)       │
                   │                                  │
                   │ • Vault sync to Chronex         │
                   │ • Real-time collaboration       │
                   └────┬─────────────────────────────┘
                        │
        ┌───────────────┴──────────────────┐
        │                                  │
   ┌────▼─────────────┐          ┌─────────▼────────┐
   │ CHRONEX SERVER   │          │ EXTERNAL SERVICES│
   │                  │          │                  │
   │ • WebDAV API     │          │ • S3/Cloud       │
   │ • REST API       │          │ • Email          │
   │ • gRPC API       │          │ • OAuth          │
   │ • Sync engine    │          │ • Notifications  │
   └────┬─────────────┘          └──────────────────┘
        │
   ┌────▼───────────────┐
   │  STORAGE BACKEND   │
   │                    │
   │ • SQLite (local)   │
   │ • PostgreSQL (srv) │
   │ • S3 (files)       │
   └────────────────────┘
```

---

## 📱 1. CLIENT LAYERS

### 1.1 Desktop Client (Electron + React)

```
┌─────────────────────────────────────────┐
│        Chronex Desktop App              │
│        (Electron + React/TypeScript)    │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (React)                       │
│  ├─ Editor (Monaco/CodeMirror)         │
│  ├─ File explorer                      │
│  ├─ Search (full-text)                 │
│  ├─ Sync status indicator              │
│  └─ Settings/Preferences                │
│                                         │
├─────────────────────────────────────────┤
│  State Management (Redux/Zustand)       │
│  ├─ Blocks state                       │
│  ├─ Sync state                         │
│  ├─ UI state                           │
│  └─ Cache                              │
│                                         │
├─────────────────────────────────────────┤
│  Services Layer (TypeScript)            │
│  ├─ SyncManager                        │
│  │  ├─ WebDAV client                   │
│  │  ├─ Conflict resolution             │
│  │  └─ Lock management                 │
│  │                                     │
│  ├─ StorageManager                     │
│  │  ├─ SQLite (IndexedDB on web)       │
│  │  ├─ File system (Electron)          │
│  │  └─ Cache layer                     │
│  │                                     │
│  ├─ EncryptionManager                  │
│  │  ├─ TweetNaCl.js (encryption)       │
│  │  ├─ Key derivation                  │
│  │  └─ Secure storage                  │
│  │                                     │
│  └─ NotificationManager                │
│     ├─ Desktop notifications           │
│     ├─ Tray status                     │
│     └─ Activity log                    │
│                                         │
├─────────────────────────────────────────┤
│  IPC (Main ↔ Renderer Process)          │
│  ├─ File operations                    │
│  ├─ Native dialogs                     │
│  ├─ System integration                 │
│  └─ Update checking                    │
│                                         │
├─────────────────────────────────────────┤
│  Electron Main Process                  │
│  ├─ App lifecycle                      │
│  ├─ Window management                  │
│  ├─ Menu/context menus                 │
│  ├─ Auto-update (electron-updater)     │
│  └─ System tray                        │
│                                         │
└─────────────────────────────────────────┘
         │
         ├─→ Node.js Backend (local)
         │   ├─ SQLite database
         │   ├─ File system access
         │   └─ Encryption
         │
         └─→ Chronex Server (remote)
             └─ WebDAV sync
```

**Technology Stack**:
```
Frontend:
├─ React 18+ (UI framework)
├─ TypeScript (type safety)
├─ Tailwind CSS (styling)
├─ Redux/Zustand (state)
├─ React Query (data fetching)
└─ Vite (bundler)

Backend (Electron Main):
├─ Node.js 18+
├─ SQLite (better-sqlite3)
├─ node-fetch (HTTP client)
├─ got (WebDAV client)
├─ crypto (native)
└─ fs-extra (file ops)

Packaging:
├─ electron 28+
├─ electron-builder (distribution)
├─ electron-updater (auto-update)
└─ electron-log (logging)

Desktop Features:
├─ Windows: .exe installer
├─ macOS: .dmg installer
├─ Linux: .AppImage + .deb
└─ Auto-update mechanism
```

---

### 1.2 Mobile Client (iOS + Android)

```
┌──────────────────────────────────────────┐
│      Chronex Mobile App                  │
│   (React Native / Flutter / Kotlin+Swift)│
├──────────────────────────────────────────┤
│                                          │
│  UI Layer (Native Components)            │
│  ├─ Note editor (syntax highlighting)   │
│  ├─ Folder/tag navigation               │
│  ├─ Full-text search                    │
│  ├─ Offline mode indicator              │
│  └─ Sync progress indicator             │
│                                          │
├──────────────────────────────────────────┤
│  State Management                        │
│  ├─ Redux (React Native)                │
│  ├─ Provider (Flutter)                  │
│  └─ ViewModel (Kotlin/Swift)            │
│                                          │
├──────────────────────────────────────────┤
│  Sync Engine                             │
│  ├─ WebDAV client (mobile-optimized)    │
│  ├─ Background sync (backgroundFetch)   │
│  ├─ Offline queue                       │
│  └─ Bandwidth throttling                │
│                                          │
├──────────────────────────────────────────┤
│  Storage                                 │
│  ├─ SQLite (realm-db for Flutter)       │
│  ├─ Document directory                  │
│  ├─ Secure enclave (keys)               │
│  └─ Local file system                   │
│                                          │
├──────────────────────────────────────────┤
│  Encryption                              │
│  ├─ TweetNaCl.js (React Native)         │
│  ├─ Tink (Android native)               │
│  ├─ CryptoKit (iOS native)              │
│  └─ Biometric unlock                    │
│                                          │
├──────────────────────────────────────────┤
│  System Integration                      │
│  ├─ Push notifications                  │
│  ├─ Share extension                     │
│  ├─ URL scheme handling                 │
│  ├─ Widget (iOS 14+, Android 12+)       │
│  └─ iCloud sync option (iOS)            │
│                                          │
└──────────────────────────────────────────┘
```

**Technology Options**:

Option A: React Native (JavaScript)
```
├─ React Native 0.72+
├─ Expo (managed solution)
├─ React Navigation
├─ Redux
├─ react-native-sqlite-storage
├─ react-native-keychain (secure storage)
├─ @react-native-firebase/messaging
└─ react-native-webdav (custom)
```

Option B: Flutter (Dart)
```
├─ Flutter 3.10+
├─ Provider (state management)
├─ GetX (routing)
├─ sqflite (local storage)
├─ flutter_secure_storage
├─ firebase_messaging
└─ http/dio (WebDAV client)
```

Option C: Native (Best Performance)
```
iOS:
├─ SwiftUI
├─ Combine (reactive)
├─ Core Data (local storage)
├─ CryptoKit (encryption)
├─ UserNotifications
└─ Custom WebDAV client (URLSession)

Android:
├─ Jetpack Compose
├─ Kotlin Flow
├─ Room (database)
├─ Tink (encryption)
├─ Firebase Cloud Messaging
└─ OkHttp (WebDAV client)
```

---

### 1.3 Web Client (Browser)

```
┌──────────────────────────────────────────┐
│      Chronex Web App                     │
│   (React + TypeScript + Vite)            │
├──────────────────────────────────────────┤
│                                          │
│  SPA (Single Page App)                   │
│  ├─ React Router (navigation)            │
│  ├─ Editor component                    │
│  ├─ Real-time collaboration (WebSocket) │
│  └─ Responsive design                   │
│                                          │
├──────────────────────────────────────────┤
│  Storage (Browser)                       │
│  ├─ IndexedDB (local cache)             │
│  ├─ Service Worker (offline)            │
│  ├─ Cache API (assets)                  │
│  └─ SessionStorage (session state)      │
│                                          │
├──────────────────────────────────────────┤
│  Synchronization                         │
│  ├─ WebDAV over HTTPS                   │
│  ├─ WebSocket (real-time)               │
│  ├─ Polling fallback                    │
│  └─ Conflict resolution                 │
│                                          │
├──────────────────────────────────────────┤
│  Encryption (Client-side)                │
│  ├─ TweetNaCl.js                        │
│  ├─ No keys sent to server              │
│  └─ Zero-knowledge proof                │
│                                          │
└──────────────────────────────────────────┘
        │
        └─→ REST/gRPC API (same server)
```

**Technology Stack**:
```
Frontend:
├─ React 18+
├─ TypeScript
├─ TanStack Router (advanced routing)
├─ SWR (data fetching)
├─ IndexedDB-ORM (local storage)
├─ Signal/Preact Signals (reactive)
├─ Monaco Editor (code editing)
└─ Vite (bundler)

PWA Features:
├─ Service Worker
├─ Manifest.json
├─ Offline-first (with sync queue)
├─ App Shell architecture
└─ install prompt

Deployment:
├─ Vercel / Netlify (frontend)
├─ Docker container (optional)
└─ CDN (static assets)
```

---

## 🖥️ 2. SERVER COMPONENTS

### 2.1 Chronex Server (Go)

```
┌──────────────────────────────────────────────────────────────┐
│                  Chronex Server (Go)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  HTTP Server Layer                                           │
│  ├─ Standard lib http or chi router                         │
│  ├─ TLS/HTTPS                                               │
│  ├─ CORS handling                                           │
│  ├─ Rate limiting (middleware)                              │
│  └─ Request logging                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  API Layers                                                  │
│  │                                                           │
│  ├─ WebDAV Server (golang.org/x/net/webdav)               │
│  │  ├─ PROPFIND, PROPPATCH, MKCOL                          │
│  │  ├─ GET, HEAD, PUT, DELETE                              │
│  │  ├─ MOVE, COPY                                          │
│  │  ├─ LOCK, UNLOCK                                        │
│  │  ├─ File system abstraction (VFS)                       │
│  │  └─ Lock system                                         │
│  │                                                           │
│  ├─ REST API (JSON over HTTP)                              │
│  │  ├─ GET /api/blocks                                     │
│  │  ├─ POST /api/blocks                                    │
│  │  ├─ PUT /api/blocks/{id}                                │
│  │  ├─ DELETE /api/blocks/{id}                             │
│  │  ├─ PATCH /api/blocks/{id}/sync                         │
│  │  ├─ GET /api/auth/login                                 │
│  │  ├─ POST /api/auth/register                             │
│  │  ├─ GET /api/sync/status                                │
│  │  └─ WebSocket /api/sync/realtime                        │
│  │                                                           │
│  └─ gRPC API (Protocol Buffers)                            │
│     ├─ BlockService.CreateBlock()                          │
│     ├─ BlockService.UpdateBlock()                          │
│     ├─ SyncService.StreamSync()                            │
│     └─ AuthService.Authenticate()                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Business Logic                                              │
│  │                                                           │
│  ├─ SyncManager                                             │
│  │  ├─ 4-phase sync algorithm (DELETE/UPDATE/DELTA/MERGE)  │
│  │  ├─ Conflict detection & resolution                     │
│  │  ├─ Chunk deduplication (FastCDC)                       │
│  │  └─ Compression (gzip)                                  │
│  │                                                           │
│  ├─ BlockManager                                            │
│  │  ├─ CRUD operations                                     │
│  │  ├─ Full-text indexing                                  │
│  │  ├─ Tag management                                      │
│  │  ├─ Trash/restore                                       │
│  │  └─ History tracking                                    │
│  │                                                           │
│  ├─ AuthManager                                             │
│  │  ├─ User registration/login                             │
│  │  ├─ JWT token generation                                │
│  │  ├─ OAuth2 (Google, GitHub)                             │
│  │  ├─ TOTP 2FA                                            │
│  │  └─ Session management                                  │
│  │                                                           │
│  ├─ EncryptionManager                                       │
│  │  ├─ NaCl/libsodium                                      │
│  │  ├─ Key derivation (PBKDF2)                             │
│  │  ├─ Block-level encryption                              │
│  │  └─ End-to-end encryption                               │
│  │                                                           │
│  └─ NotificationManager                                    │
│     ├─ WebSocket push                                      │
│     ├─ Email notifications                                 │
│     ├─ Webhook integration                                 │
│     └─ Activity feed                                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Data Access Layer                                           │
│  │                                                           │
│  ├─ Repository Pattern                                      │
│  │  ├─ BlockRepository                                     │
│  │  ├─ UserRepository                                      │
│  │  ├─ SyncLogRepository                                   │
│  │  └─ ChunkRepository (dedup)                             │
│  │                                                           │
│  ├─ Query Builders                                          │
│  │  ├─ sqlc (type-safe SQL)                                │
│  │  ├─ GORM (ORM optional)                                 │
│  │  └─ Raw SQL (performance-critical)                      │
│  │                                                           │
│  └─ Migration System                                        │
│     ├─ Flyway/migrate                                      │
│     └─ Version control for schema                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure                                              │
│  │                                                           │
│  ├─ Database (SQLite/PostgreSQL/MySQL)                     │
│  │  ├─ blocks table                                        │
│  │  ├─ users table                                         │
│  │  ├─ block_chunks (FastCDC)                              │
│  │  ├─ block_locks                                         │
│  │  ├─ sync_log                                            │
│  │  ├─ chunk_dedup                                         │
│  │  └─ Indexes & full-text search                          │
│  │                                                           │
│  ├─ Cache Layer                                             │
│  │  ├─ Redis (distributed cache)                           │
│  │  ├─ In-memory (block cache)                             │
│  │  └─ SQLite warm cache                                   │
│  │                                                           │
│  ├─ Message Queue                                           │
│  │  ├─ RabbitMQ / Redis Streams                            │
│  │  ├─ Async notifications                                 │
│  │  └─ Background jobs                                     │
│  │                                                           │
│  ├─ Search Engine                                           │
│  │  ├─ Meilisearch / Elasticsearch (optional)              │
│  │  ├─ Full-text search                                    │
│  │  └─ Advanced filtering                                  │
│  │                                                           │
│  ├─ Storage Backend                                         │
│  │  ├─ Filesystem (local)                                  │
│  │  ├─ S3 / MinIO (cloud)                                  │
│  │  └─ Azure Blob / Google Cloud Storage                   │
│  │                                                           │
│  └─ Monitoring & Logging                                   │
│     ├─ Prometheus (metrics)                                │
│     ├─ Grafana (dashboards)                                │
│     ├─ ELK / Loki (logs)                                   │
│     ├─ Jaeger (tracing)                                    │
│     └─ Sentry (error tracking)                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Technology Stack**:
```
Core:
├─ Go 1.21+
├─ Standard library (net/http, encoding/json, crypto)
├─ chi / gin / echo (HTTP router, optional)
└─ dependency injection framework (wire/dig)

Database:
├─ SQLite (single-server / dev)
├─ PostgreSQL (multi-server / production)
├─ sqlc (type-safe SQL generation)
├─ golang-migrate (migrations)
└─ pgx (PostgreSQL driver)

WebDAV:
├─ golang.org/x/net/webdav (standard lib)
├─ Custom VFS implementation
└─ golang.org/x/sync (concurrency primitives)

Serialization:
├─ google/flatbuffers (binary)
├─ Protocol Buffers (gRPC)
└─ encoding/json (REST)

Encryption:
├─ NaCl / libsodium (golang.org/x/crypto)
├─ PBKDF2 (key derivation)
└─ AES-256-GCM (authenticated encryption)

Utilities:
├─ google/uuid (block IDs)
├─ fastcdc (chunking)
├─ prometheus/client_golang (metrics)
├─ zap (logging)
└─ testify (testing)

Deployment:
├─ Docker / Docker Compose
├─ Kubernetes (optional)
├─ systemd (Linux service)
└─ systemd-timer (scheduled jobs)
```

---

## 🔌 3. OBSIDIAN PLUGIN

```
┌──────────────────────────────────────────┐
│    Chronex Obsidian Plugin               │
│   (TypeScript + Obsidian API)            │
├──────────────────────────────────────────┤
│                                          │
│  Plugin Class (extends Plugin)           │
│  ├─ onload() / onunload()               │
│  ├─ Settings panel                      │
│  └─ Command registration                │
│                                          │
├──────────────────────────────────────────┤
│  Sync Engine                             │
│  ├─ Monitor vault changes (FileSystemAPI)│
│  ├─ Detect creates/updates/deletes      │
│  ├─ WebDAV client (got/node-fetch)      │
│  ├─ Conflict resolution                 │
│  └─ Background sync (10s interval)      │
│                                          │
├──────────────────────────────────────────┤
│  UI Components                           │
│  ├─ Settings tab                        │
│  ├─ Status bar indicator                │
│  ├─ Ribbon button                       │
│  └─ Modal dialogs                       │
│                                          │
├──────────────────────────────────────────┤
│  Features                                │
│  ├─ Vault ↔ Chronex Server sync         │
│  ├─ Multi-device sync                   │
│  ├─ Offline support                     │
│  ├─ Smart sync (only changed files)     │
│  └─ Conflict detection                  │
│                                          │
└──────────────────────────────────────────┘
```

**Technology Stack**:
```
├─ obsidian (plugin API)
├─ TypeScript
├─ got (HTTP client for WebDAV)
├─ isomorphic-git (optional, for history)
├─ moment (date/time)
└─ esbuild (bundler)
```

---

## 📦 4. EXTERNAL INTEGRATIONS

### 4.1 Cloud Storage Backends

```
S3 / S3-Compatible:
├─ AWS S3
├─ DigitalOcean Spaces
├─ MinIO (self-hosted)
└─ Wasabi

Usage:
├─ Store large files
├─ Backup
└─ Cross-region replication

Google Cloud:
├─ Cloud Storage
├─ Firestore (optional, for metadata)
└─ Pub/Sub (notifications)

Azure:
├─ Blob Storage
├─ Cosmos DB (optional)
└─ Service Bus (notifications)
```

### 4.2 Authentication

```
OAuth2 / OpenID Connect:
├─ Google Sign-In
├─ GitHub Login
├─ Microsoft (Office 365)
└─ Custom OIDC server

SAML 2.0 (Enterprise):
├─ Active Directory
├─ Okta
└─ OneLogin

2FA:
├─ TOTP (Google Authenticator)
├─ WebAuthn / FIDO2
└─ SMS (optional)
```

### 4.3 Notifications & Communication

```
Email:
├─ SendGrid / Mailgun
├─ AWS SES
└─ SMTP server

Push Notifications:
├─ Firebase Cloud Messaging (Android)
├─ APNs (Apple Push Notification)
└─ OneSignal (unified)

Chat Integration:
├─ Slack
├─ Discord
└─ Telegram Bot
```

### 4.4 Analytics & Monitoring

```
Product Analytics:
├─ Mixpanel
├─ Amplitude
└─ Plausible (privacy-first)

Error Tracking:
├─ Sentry
├─ Rollbar
└─ Honeybadger

Performance:
├─ New Relic
├─ DataDog
└─ Cloudflare Analytics
```

---

## 🏗️ 5. DEPLOYMENT ARCHITECTURE

### 5.1 Development Environment

```
Developer Machine:
├─ Git (version control)
├─ Docker Compose (local stack)
│  ├─ Chronex Server (Go)
│  ├─ PostgreSQL
│  ├─ Redis
│  └─ Meilisearch
├─ Node.js (plugins, web)
├─ IDE (VS Code, GoLand)
└─ Local testing

Tech:
├─ Make (task automation)
├─ Docker / Docker Compose
├─ Air (Go hot reload)
├─ nodemon (JavaScript hot reload)
└─ SQLite for local testing
```

### 5.2 Staging Environment

```
Docker Compose or K8s:
├─ Chronex Server (replicated)
├─ PostgreSQL (single + backups)
├─ Redis (cache)
├─ Meilisearch (search)
├─ HTTPS (Let's Encrypt)
└─ Monitoring stack

Deployment:
├─ GitHub Actions (CI/CD)
├─ Docker Hub (registry)
└─ Automatic on merge to main
```

### 5.3 Production Environment

Option A: Traditional VPS
```
Server VM (Digital Ocean / Linode / AWS EC2):
├─ Chronex Server (compiled binary)
├─ PostgreSQL (managed service or self-hosted)
├─ Redis (if needed)
├─ Nginx (reverse proxy + TLS)
├─ Prometheus + Grafana
├─ Docker (containerized)
└─ systemd (process management)
```

Option B: Kubernetes
```
GKE / EKS / DigitalOcean K8s:
├─ Chronex Server pods (auto-scaling)
├─ PostgreSQL (managed CloudSQL / RDS)
├─ Redis (ElastiCache / DigitalOcean)
├─ Nginx Ingress (TLS, load balancing)
├─ Prometheus (monitoring)
├─ ArgoCD (GitOps deployment)
└─ Sealed Secrets (secret management)
```

Option C: Serverless
```
AWS Lambda / Google Cloud Run / Azure Functions:
├─ Chronex API (stateless functions)
├─ API Gateway (REST endpoint)
├─ RDS (PostgreSQL managed)
├─ S3 (file storage)
├─ CloudFront (CDN)
└─ CloudWatch (logging)

Limitation: WebDAV is stateful, harder to scale serverless
```

---

## 🔄 6. DATA FLOW ARCHITECTURE

### Complete Sync Flow

```
User A (Desktop)           Chronex Server            User B (Mobile)
      │                          │                         │
      ├─ Edit note ─────────────→│                         │
      │  (local SQLite updated)   │                         │
      │                           │                         │
      ├─ LOCK /notes/work ───────→│                         │
      │  (exclusive lock)         │                         │
      │                           │                         │
      ├─ PUT (FlatBuffers) ──────→│                         │
      │  • Content                │                         │
      │  • Chunks (FastCDC)       │                         │
      │  • ETag                   │                         │
      │                           ├─ Check dedup ──────────│
      │                           │  (reuse chunks)        │
      │                           │                        │
      │                           ├─ Store in DB ────────→│
      │                           │                        │
      │                           ├─ Invalidate cache     │
      │                           │                        │
      ├─ UNLOCK ─────────────────→│                        │
      │                           │                        │
      │                           ├─ Push notification ───→│
      │                           │  (Sync available)      │
      │                           │                        │
      │                           ├─ WebSocket update ───→│ Notify UI
      │                           │                        │
      │                           │←─ PROPFIND (delta) ───│
      │                           │  "What changed?"       │
      │                           │                        │
      │                           ├─ Send metadata ──────→│
      │                           │  • Timestamps          │
      │                           │  • ETags               │
      │                           │  • Hashes              │
      │                           │                        │
      │                           │←─ Request chunks ─────│
      │                           │  (only new ones)       │
      │                           │                        │
      │                           ├─ Send FlatBuffers ───→│
      │                           │  • Serialized blocks   │
      │                           │  • Compressed          │
      │                           │                        │
      │                           │←─ Background sync ────│
      │                           │  (SQLite updated)      │
      │                           │                        │
      │                           │ UI shows latest content
```

---

## 📊 COMPLETE STACK SUMMARY

### Frontend Clients
```
┌─ Desktop (Electron + React + TypeScript)
├─ Mobile (React Native / Flutter / Native)
├─ Web (React SPA + PWA)
└─ Plugin (Obsidian TypeScript)
```

### Network Layer
```
┌─ HTTP/HTTPS (TLS 1.3+)
├─ WebDAV (RFC 4918)
├─ WebSocket (real-time)
└─ gRPC (optional, for performance)
```

### Backend Services
```
┌─ Chronex Server (Go)
│  ├─ HTTP/WebDAV API
│  ├─ REST API
│  └─ gRPC API
└─ Supporting Services
   ├─ PostgreSQL / SQLite
   ├─ Redis (cache)
   ├─ Meilisearch (search)
   └─ S3 (storage)
```

### Data Processing
```
┌─ Serialization: FlatBuffers
├─ Chunking: FastCDC
├─ Compression: gzip
├─ Encryption: NaCl/libsodium
└─ Hashing: SHA-256
```

### Infrastructure
```
┌─ Docker / Compose
├─ Kubernetes (optional)
├─ CI/CD (GitHub Actions)
├─ Monitoring (Prometheus + Grafana)
└─ Logging (ELK / Loki)
```

---

## 📈 Estimated Technology Budget

| Component | Technology | Dependencies |
|-----------|-----------|--------------|
| Desktop | Electron + React | ~150 npm packages |
| Mobile | React Native / Flutter | ~100 packages |
| Web | React + TypeScript | ~80 npm packages |
| Plugin | Obsidian API | ~20 npm packages |
| Server | Go + stdlib | ~30 Go modules |
| Database | PostgreSQL | 1 (managed service) |
| Cache | Redis | 1 (managed service) |
| Search | Meilisearch | 1 (optional) |
| Auth | OAuth2 / Custom | 2-3 integrations |
| **TOTAL** | | **~400+ dependencies** |

**Complexity**: Medium-High (distributed system)
**Team Size**: 8-12 engineers
**Timeline**: 12-18 months (MVP)

