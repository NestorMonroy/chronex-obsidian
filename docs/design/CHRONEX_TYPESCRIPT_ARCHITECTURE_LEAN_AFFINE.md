# Chronex: TypeScript-First Architecture (AFFiNE-Inspired, Lean)

**Design Document Version**: 2.0  
**Date**: 2026-04-13  
**Approach**: AFFiNE's modular patterns + NestJS + Tauri + TypeScript full-stack  
**Philosophy**: "AFFiNE's elegance, but lean for bootstrap"

---

## 1. EXECUTIVE SUMMARY

### The Decision: TypeScript-First (Like AFFiNE)

```
Chronex = AFFiNE's Architecture Patterns
        + TypeScript Everywhere (full-stack)
        + NestJS + Tauri Integration
        + Lean Modules (15-20 vs AFFiNE's 69+)
        + SQLite v1.0, PostgreSQL v1.5+
```

### Why TypeScript Like AFFiNE?

```
✅ ADVANTAGES:
├─ Team velocity: Faster development (JavaScript expertise everywhere)
├─ Time to market: Same language frontend + backend
├─ Ecosystem: Excellent npm packages (NestJS proven at scale)
├─ Hiring: 100x easier to find TS developers than Rust
├─ Developer Experience: Excellent IDE support, debugging
├─ Type safety: TypeScript strict mode (90% of Rust safety)
├─ Real-time: Node.js ecosystem has best CRDT libraries (Yjs, etc.)
└─ Modularity: AFFiNE's pattern is proven, reuse patterns

❌ TRADE-OFFS (but acceptable):
├─ Performance: Node.js slower (~50-100ms vs Rust 5ms)
│  └─ But acceptable for personal note app (network is bottleneck)
├─ Memory: ~150 MB (vs Rust 50 MB)
│  └─ Acceptable on modern laptops
├─ Binary: ~100 MB with Electron
│  └─ But we use Tauri for frontend, optional Node.js backend v1.5+
└─ Security: JavaScript runtime larger surface
   └─ Mitigated by: input validation, dependency scanning, npm audit

VERDICT: TypeScript is RIGHT for Chronex (like AFFiNE)
```

---

## 2. MONOREPO STRUCTURE (AFFiNE-INSPIRED, LEAN)

### 2.1 Directory Layout

```
chronex/
├─ package.json (root workspace)
├─ tsconfig.json (root TypeScript config)
├─ turbo.json (build orchestration)
│
├─ packages/
│  ├─ frontend/                    (React + Tauri)
│  │  ├─ apps/
│  │  │  ├─ desktop/              (Tauri desktop app)
│  │  │  │  ├─ src-tauri/         (Rust Tauri scaffolding)
│  │  │  │  └─ src/               (React app)
│  │  │  ├─ web/                  (Optional: web version)
│  │  │  └─ mobile/               (Optional: iOS/Android)
│  │  │
│  │  └─ modules/                 (15-20 feature modules, like AFFiNE)
│  │     ├─ blocks/
│  │     │  ├─ src/
│  │     │  │  ├─ components/     (React components)
│  │     │  │  ├─ hooks/          (React hooks)
│  │     │  │  ├─ types/          (TypeScript types)
│  │     │  │  ├─ services/       (API calls)
│  │     │  │  ├─ stores/         (State management)
│  │     │  │  └─ __tests__/      (Tests)
│  │     │  └─ package.json
│  │     │
│  │     ├─ notebooks/
│  │     ├─ search/
│  │     ├─ sync/
│  │     ├─ auth/
│  │     ├─ editor/
│  │     ├─ collaboration/
│  │     ├─ cloud/
│  │     ├─ theme/
│  │     ├─ notifications/
│  │     ├─ settings/
│  │     ├─ share/
│  │     ├─ export/
│  │     ├─ import/
│  │     ├─ templates/
│  │     ├─ collections/
│  │     ├─ tags/
│  │     └─ common/               (Shared utilities, types, components)
│  │        ├─ src/
│  │        │  ├─ types/          (Shared TypeScript types)
│  │        │  ├─ utils/          (Utilities)
│  │        │  ├─ hooks/          (Custom hooks)
│  │        │  ├─ components/     (Reusable components)
│  │        │  └─ constants/
│  │        └─ package.json
│  │
│  ├─ server/                     (NestJS backend - OPTIONAL, v1.5+)
│  │  ├─ src/
│  │  │  ├─ main.ts              (Entry point)
│  │  │  ├─ modules/             (NestJS modules, like AFFiNE)
│  │  │  │  ├─ blocks/
│  │  │  │  │  ├─ blocks.controller.ts
│  │  │  │  │  ├─ blocks.service.ts
│  │  │  │  │  ├─ blocks.repository.ts
│  │  │  │  │  ├─ blocks.entity.ts
│  │  │  │  │  ├─ dto/
│  │  │  │  │  │  ├─ create-block.dto.ts
│  │  │  │  │  │  └─ update-block.dto.ts
│  │  │  │  │  └─ blocks.module.ts
│  │  │  │  │
│  │  │  │  ├─ notebooks/
│  │  │  │  ├─ sync/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ cloud/
│  │  │  │  ├─ database/         (TypeORM/Prisma)
│  │  │  │  ├─ cache/            (Redis)
│  │  │  │  └─ common/           (Shared services)
│  │  │  │
│  │  │  ├─ config/
│  │  │  ├─ database/            (Migrations, schemas)
│  │  │  │  └─ migrations/
│  │  │  └─ main.ts
│  │  │
│  │  ├─ Dockerfile
│  │  ├─ docker-compose.yml
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  └─ common/                     (Shared code between frontend & backend)
│     ├─ src/
│     │  ├─ types/               (Shared TypeScript types)
│     │  │  ├─ block.ts
│     │  │  ├─ notebook.ts
│     │  │  ├─ sync.ts
│     │  │  └─ api.ts
│     │  ├─ constants/
│     │  ├─ utils/
│     │  └─ index.ts
│     └─ package.json
│
├─ tools/                         (Build tools, scripts)
│  ├─ cli/
│  ├─ scripts/
│  └─ package.json
│
├─ docs/
│  ├─ API.md                      (API documentation)
│  ├─ ARCHITECTURE.md
│  └─ CONTRIBUTING.md
│
└─ tests/                         (E2E, integration tests)
   ├─ e2e/
   ├─ fixtures/
   └─ package.json
```

### 2.2 Comparison: Chronex vs AFFiNE Structure

```
ASPECT                    | AFFiNE              | Chronex (Lean TS)
──────────────────────────────────────────────────────────────
Total Workspaces          | 101+ packages       | 20-25 packages
Frontend Modules          | 69                  | 15-20
Backend Services          | 13+ NestJS modules  | 8-10 modules
Monorepo Tool             | Yarn workspaces     | Yarn/Turbo
Frontend Framework        | React               | React
Backend Framework         | NestJS              | NestJS
Database (v1.0)           | PostgreSQL          | SQLite
Database (v1.5+)          | PostgreSQL          | PostgreSQL
Cache                     | Redis               | Redis (optional)
Real-Time                 | Socket.io + Redis   | Socket.io + Redis (v1.5+)
CRDT Framework            | BlockSuite (73 pkg) | Yjs (simpler)
Build Tool                | Turbo               | Turbo
Testing Framework         | Vitest              | Jest/Vitest
E2E Testing               | Playwright          | Playwright
Code Quality              | ESLint + Prettier   | ESLint + Prettier
Total Developers          | 50+                 | 1-2
Total LOC                 | 1.5M+               | ~100k
Complexity                | Enterprise          | Lean Bootstrap
```

---

## 3. ARCHITECTURE LAYERS (AFFiNE PATTERN)

### 3.1 Frontend Module Structure (Blocks Example)

```typescript
// packages/frontend/modules/blocks/
//
// Pattern: Each feature is a module with:
// ├─ components/ (React UI)
// ├─ hooks/ (Custom React hooks)
// ├─ services/ (API calls, business logic)
// ├─ stores/ (State management - Jotai/Zustand)
// ├─ types/ (TypeScript types)
// └─ __tests__/ (Unit tests)

// ─── COMPONENTS LAYER ───

// components/BlockEditor.tsx
import { useBlockService } from '../services/useBlockService';
import { useBlockStore } from '../stores/blockStore';

export function BlockEditor({ blockId }: Props) {
  const { block, updateBlock } = useBlockService(blockId);
  const { selectedBlocks, setSelectedBlocks } = useBlockStore();

  return (
    <div className="block-editor">
      <textarea
        value={block?.content}
        onChange={(e) => updateBlock(e.target.value)}
      />
    </div>
  );
}

// ─── HOOKS LAYER ───

// hooks/useBlocksQuery.ts
import { useQuery } from '@tanstack/react-query';
import { blocksAPI } from '../services/blocksAPI';

export function useBlocksQuery(notebookId: string) {
  return useQuery({
    queryKey: ['blocks', notebookId],
    queryFn: () => blocksAPI.list(notebookId),
  });
}

// ─── SERVICES LAYER ───

// services/blocksAPI.ts
import { invoke } from '@tauri-apps/api/core'; // v1.0 Desktop
// OR
// import { fetchAPI } from '@chronex/common'; // v1.5+ with server

interface Block {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const blocksAPI = {
  async create(req: CreateBlockRequest): Promise<Block> {
    // v1.0: Tauri RPC
    return invoke('create_block', { req });
    
    // v1.5: REST API
    // return fetchAPI('/api/blocks', { method: 'POST', body: req });
  },

  async get(blockId: string): Promise<Block> {
    return invoke('get_block', { blockId });
  },

  async list(notebookId: string): Promise<Block[]> {
    return invoke('list_blocks', { notebookId });
  },

  async update(blockId: string, updates: Partial<Block>): Promise<Block> {
    return invoke('update_block', { blockId, updates });
  },

  async delete(blockId: string): Promise<void> {
    return invoke('delete_block', { blockId });
  },
};

// ─── STORE LAYER (State Management) ───

// stores/blockStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface BlockStore {
  blocks: Map<string, Block>;
  selectedBlocks: Set<string>;
  selectedNotebookId: string | null;
  setBlocks: (blocks: Block[]) => void;
  selectBlock: (blockId: string) => void;
  deselectBlock: (blockId: string) => void;
  setSelectedNotebook: (notebookId: string) => void;
}

export const useBlockStore = create<BlockStore>()(
  subscribeWithSelector((set) => ({
    blocks: new Map(),
    selectedBlocks: new Set(),
    selectedNotebookId: null,
    setBlocks: (blocks) => set({ blocks: new Map(blocks.map(b => [b.id, b])) }),
    selectBlock: (id) => set((state) => ({
      selectedBlocks: new Set([...state.selectedBlocks, id]),
    })),
    deselectBlock: (id) => set((state) => ({
      selectedBlocks: new Set([...state.selectedBlocks].filter(b => b !== id)),
    })),
    setSelectedNotebook: (id) => set({ selectedNotebookId: id }),
  }))
);

// ─── TYPES LAYER ───

// types/block.ts
export interface Block {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  metadata: BlockMetadata;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BlockMetadata {
  tags: string[];
  color?: string;
  pinned: boolean;
  order: number;
}

export type CreateBlockRequest = Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateBlockRequest = Partial<Omit<Block, 'id' | 'createdAt' | 'updatedAt'>>;
```

### 3.2 Backend Module Structure (NestJS, Optional v1.5+)

```typescript
// packages/server/src/modules/blocks/

// ─── MODULE DEFINITION ───

// blocks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { BlockRepository } from './blocks.repository';
import { Block } from './block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block])],
  controllers: [BlocksController],
  providers: [BlocksService, BlockRepository],
  exports: [BlocksService],
})
export class BlocksModule {}

// ─── ENTITY ───

// block.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blocks')
export class Block {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  notebookId: string;

  @Column('text')
  title: string;

  @Column('text')
  content: string; // encrypted

  @Column('json', { default: {} })
  metadata: BlockMetadata;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt?: Date;
}

// ─── SERVICE (Business Logic) ───

// blocks.service.ts
import { Injectable } from '@nestjs/common';
import { BlockRepository } from './blocks.repository';
import { EncryptionService } from '../encryption/encryption.service';
import { SearchService } from '../search/search.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';

@Injectable()
export class BlocksService {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly encryptionService: EncryptionService,
    private readonly searchService: SearchService,
  ) {}

  async create(createBlockDto: CreateBlockDto): Promise<Block> {
    // 1. Validate
    if (!createBlockDto.title) {
      throw new BadRequestException('Title is required');
    }

    // 2. Encrypt content
    const encryptedContent = await this.encryptionService.encrypt(
      createBlockDto.content,
    );

    // 3. Create entity
    const block = new Block();
    block.id = generateUUID();
    block.notebookId = createBlockDto.notebookId;
    block.title = createBlockDto.title;
    block.content = encryptedContent;
    block.metadata = createBlockDto.metadata || {};

    // 4. Save
    await this.blockRepository.save(block);

    // 5. Index for search
    await this.searchService.indexBlock(block);

    return block;
  }

  async list(notebookId: string): Promise<Block[]> {
    return this.blockRepository.find({
      where: { notebookId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async update(blockId: string, updateBlockDto: UpdateBlockDto): Promise<Block> {
    const block = await this.blockRepository.findOne(blockId);
    if (!block) throw new NotFoundException('Block not found');

    Object.assign(block, updateBlockDto);
    if (updateBlockDto.content) {
      block.content = await this.encryptionService.encrypt(updateBlockDto.content);
    }

    return this.blockRepository.save(block);
  }

  async delete(blockId: string): Promise<void> {
    await this.blockRepository.softDelete(blockId);
  }
}

// ─── REPOSITORY (DB Access) ───

// blocks.repository.ts
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Block } from './block.entity';

@Injectable()
export class BlockRepository extends Repository<Block> {
  constructor(private dataSource: DataSource) {
    super(Block, dataSource.createEntityManager());
  }

  async softDelete(blockId: string): Promise<void> {
    await this.update(blockId, { deletedAt: new Date() });
  }
}

// ─── CONTROLLER (HTTP Endpoint) ───

// blocks.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';

@Controller('api/blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(@Body() createBlockDto: CreateBlockDto) {
    return this.blocksService.create(createBlockDto);
  }

  @Get(':id')
  get(@Param('id') blockId: string) {
    return this.blocksService.get(blockId);
  }

  @Get('notebook/:notebookId')
  list(@Param('notebookId') notebookId: string) {
    return this.blocksService.list(notebookId);
  }

  @Put(':id')
  update(@Param('id') blockId: string, @Body() updateBlockDto: UpdateBlockDto) {
    return this.blocksService.update(blockId, updateBlockDto);
  }

  @Delete(':id')
  delete(@Param('id') blockId: string) {
    return this.blocksService.delete(blockId);
  }
}
```

---

## 4. SHARED TYPES (Common Package)

### 4.1 Shared TypeScript Types

```typescript
// packages/common/src/types/block.ts
// Used by BOTH frontend and backend

export interface Block {
  id: string;
  notebookId: string;
  title: string;
  content: string; // encrypted
  metadata: BlockMetadata;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  deletedAt?: string; // soft delete
}

export interface BlockMetadata {
  tags: string[];
  color?: string;
  pinned: boolean;
  order: number;
  vectorClock?: Record<string, number>; // for sync
}

export interface CreateBlockRequest {
  notebookId: string;
  title: string;
  content: string;
  metadata?: Partial<BlockMetadata>;
}

export interface UpdateBlockRequest {
  title?: string;
  content?: string;
  metadata?: Partial<BlockMetadata>;
}

// packages/common/src/types/api.ts
// API response types

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// packages/common/src/types/index.ts
export * from './block';
export * from './notebook';
export * from './sync';
export * from './api';
```

---

## 5. MODULE LIST (15-20 modules, like AFFiNE)

### 5.1 Frontend Modules

```
packages/frontend/modules/

CORE FEATURES:
├─ blocks/              (Block CRUD, editor)
├─ notebooks/           (Notebook management, hierarchy)
├─ search/              (Full-text search, FTS5)
├─ auth/                (Login, logout, sessions)
├─ settings/            (User preferences, app settings)
├─ workspace/           (Workspace switching, multi-user v2.0)
│
EDITING & CONTENT:
├─ editor/              (Rich text editor, formatting)
├─ templates/           (Document templates)
├─ export/              (PDF, Markdown, HTML export)
├─ import/              (Import from other apps)
│
ORGANIZATION:
├─ collections/         (Smart collections, views)
├─ tags/                (Tagging system)
├─ favorite/            (Favorites/bookmarks)
│
SHARING & COLLAB:
├─ share/               (Share documents, permissions)
├─ collaboration/       (Real-time collab v2.0)
├─ notifications/       (Notifications, mentions)
├─ comments/            (Comments, discussions v2.0)
│
INTEGRATION:
├─ sync/                (Multi-device sync)
├─ cloud/               (Cloud backup, Dropbox, etc.)
├─ import-clipper/      (Web clipper)
├─ theme/               (Dark mode, theming)
│
SHARED:
└─ common/              (Shared types, utils, components)
```

### 5.2 Backend Modules (NestJS, Optional v1.5+)

```
packages/server/src/modules/

CORE:
├─ blocks/              (Block service, repository)
├─ notebooks/           (Notebook management)
├─ auth/                (JWT, passport strategies)
├─ users/               (User management)
│
DATA:
├─ database/            (TypeORM entities, migrations)
├─ search/              (ElasticSearch or PostgreSQL FTS)
├─ cache/               (Redis cache layer)
├─ encryption/          (AES-256-GCM, Argon2id)
│
FEATURES:
├─ sync/                (Multi-device sync, vector clocks)
├─ share/               (Sharing, permissions)
├─ collaboration/       (Real-time collab v2.0)
│
INFRASTRUCTURE:
├─ config/              (Configuration management)
├─ logger/              (Logging)
├─ middleware/          (Auth, CORS, rate limiting)
└─ common/              (Shared services)
```

---

## 6. DEVELOPMENT & DEPLOYMENT

### 6.1 v1.0 (Local-First, Tauri Desktop)

```
Architecture:
├─ Frontend: React + Tauri (desktop)
├─ Backend: Tauri-invoked commands (in Rust runtime, not Node.js)
├─ Database: SQLite (local, encrypted)
└─ Deployment: Single desktop binary (~100 MB)

Package.json Structure:
├─ packages/frontend/apps/desktop/ (Tauri + React)
├─ packages/frontend/modules/ (15-20 React modules)
└─ packages/common/ (Shared types)

No Node.js server needed in v1.0!
Only frontend + local SQLite
```

### 6.2 v1.5 (Optional Cloud Sync)

```
Architecture (now with optional Node.js backend):
├─ Frontend: SAME React + Tauri
├─ Backend: NestJS + Node.js (optional)
├─ Database: SQLite (local) + PostgreSQL (cloud)
├─ Deployment: Tauri binary + optional Node.js server

New Packages:
├─ packages/server/ (NestJS backend, Docker)
└─ packages/common/ (Shared types, expanded)

Users can:
✅ Use Chronex offline (no server needed)
✅ Opt-in to cloud sync (connect to their server)
✅ Self-host or use official server
```

### 6.3 v2.0 (Real-Time Collaboration)

```
Architecture (full-stack):
├─ Frontend: React + WebSocket + Yjs CRDT
├─ Backend: NestJS + PostgreSQL + Redis
├─ Database: PostgreSQL (primary)
├─ Deployment: Tauri + Node.js server + PostgreSQL

Full AFFiNE-like architecture but leaner
```

---

## 7. TECHNOLOGY STACK

### 7.1 Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3",
    "turbo": "^1.10",
    "eslint": "^8.50",
    "prettier": "^3.0",
    "vitest": "^0.34",
    "jest": "^29.7"
  },
  "frontend": {
    "react": "^18.2",
    "react-query": "^3.39",  // fetching
    "zustand": "^4.4",       // state management
    "jotai": "^2.6",         // atomic state
    "@tauri-apps/api": "^2.0",
    "@tauri-apps/cli": "^2.0",
    "vite": "^5.0",
    "tailwindcss": "^3.3",
    "lucide-react": "^0.263"
  },
  "common": {
    "zod": "^3.22",          // runtime validation
    "date-fns": "^2.30",
    "uuid": "^9.0"
  },
  "server": {
    "@nestjs/core": "^10.2",
    "@nestjs/common": "^10.2",
    "@nestjs/typeorm": "^10.0",
    "@nestjs/jwt": "^11.0",
    "@nestjs/passport": "^10.0",
    "typeorm": "^0.3.16",
    "@prisma/client": "^5.4",
    "prisma": "^5.4",
    "passport": "^0.6",
    "passport-jwt": "^4.0",
    "socket.io": "^4.7",
    "redis": "^4.6",
    "bcrypt": "^5.1",
    "argon2": "^0.31",
    "pg": "^8.11"
  }
}
```

### 7.2 Database Schemas

```sql
-- SQLite (v1.0, local)
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- encrypted
  metadata JSON,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
);

CREATE TABLE notebooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE VIRTUAL TABLE blocks_fts USING fts5(
  title, content, block_id
);

-- PostgreSQL (v1.5+, cloud optional)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  notebook_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- encrypted
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
);

CREATE INDEX idx_blocks_notebook_id ON blocks(notebook_id);
CREATE INDEX idx_blocks_user_id ON blocks(user_id);
```

---

## 8. BUILD & DEVELOPMENT

### 8.1 Build Commands

```bash
# Install dependencies
yarn install

# Development mode (both frontend and backend hot reload)
yarn dev                  # Runs Tauri + dev server

# Build for production
yarn build               # Builds all packages
yarn tauri build         # Builds Tauri desktop app for current platform

# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Testing
yarn test               # All tests
yarn test:watch         # Watch mode

# Backend only (if running separate server v1.5+)
cd packages/server
yarn dev                # NestJS dev server
yarn build
yarn start
```

### 8.2 Development Workflow

```
┌──────────────────────────────────────┐
│ 1. Modify Frontend (React/TypeScript) │
│    ├─ Hot reload in Tauri            │
│    └─ Instant feedback                │
│                                      │
│ 2. Call Tauri Commands               │
│    ├─ invoke('command_name')         │
│    └─ Uses Rust runtime (v1.0)       │
│       OR HTTP to Node.js (v1.5+)     │
│                                      │
│ 3. TypeScript Type Safety            │
│    ├─ Frontend types in modules/     │
│    ├─ Backend types in server/       │
│    └─ Shared types in common/        │
│                                      │
│ 4. Run Tests                         │
│    ├─ yarn test                      │
│    └─ Tests in __tests__/ folders    │
│                                      │
│ 5. Commit & Push                     │
│    └─ CI/CD runs full test suite     │
└──────────────────────────────────────┘
```

---

## 9. COMPARISON: CHRONEX vs AFFiNE

```
ASPECT                     | AFFiNE              | Chronex (Lean)
──────────────────────────────────────────────────────────────
Total Packages             | 101+                | 20-25
Frontend Modules           | 69                  | 15-20
Backend Modules (NestJS)   | 13+                 | 8-10
TypeScript Percentage      | 89.7%               | 95% (mostly TS)
Rust Percentage            | 3.9%                | 0% (minimal)
Build Time                 | 60-90 min           | 10-20 min
Code LOC (target)          | 1.5M+               | ~100k
Deployment Target          | Cloud SaaS          | Desktop (v1.0)
Database (v1)              | PostgreSQL          | SQLite
Real-Time Collaboration    | YES (v1.0)          | Optional (v2.0)
CRDT Framework             | BlockSuite (custom) | Yjs (open-source)
Team Size                  | 50+ engineers       | 1-2 developers
Funding                    | Series B/C          | Bootstrap
Complexity Level           | Enterprise          | Lean Bootstrap

KEY DIFFERENCES:
├─ Simpler module count (20 vs 100)
├─ Fewer dependencies (less maintenance)
├─ Faster development cycle
├─ Optional server (works offline)
├─ Less operational complexity
└─ Same excellent patterns as AFFiNE
```

---

## 10. ROADMAP

```
v1.0 (Q2-Q3 2024) - Local-First, Desktop
├─ Tauri desktop app
├─ SQLite (local, encrypted)
├─ 15 frontend modules (blocks, notebooks, search, etc.)
├─ NO server backend
├─ Single binary distribution
└─ ~100k LOC

v1.5 (Q4 2024) - Optional Cloud Sync
├─ NestJS backend (optional)
├─ PostgreSQL (optional)
├─ Multi-device sync
├─ Same frontend (mostly unchanged)
├─ Users can opt-in to cloud
└─ ~150k LOC

v2.0 (2025) - Real-Time Collaboration
├─ Full WebSocket support
├─ Yjs CRDT for conflict-free edits
├─ Team collaboration features
├─ Expanded NestJS backend
├─ Optional hosted service
└─ ~200k LOC

Philosophy:
└─ Start lean (v1.0)
   Expand only if users demand (v1.5, v2.0)
   Use AFFiNE patterns but stay focused
```

---

## 11. SUMMARY: Why This Architecture Works

```
✅ CHRONEX = AFFiNE'S PATTERNS + TYPESCRIPT EVERYWHERE

1. MODULARITY (from AFFiNE)
   ├─ 15-20 focused modules
   ├─ Each module: components/ hooks/ services/ stores/
   ├─ Clear separation of concerns
   └─ Easy to understand and extend

2. TYPE SAFETY (TypeScript everywhere)
   ├─ Frontend + Backend + Common same language
   ├─ IDE support excellent
   ├─ Compile-time error catching
   └─ Great developer experience

3. FULL-STACK TYPESCRIPT
   ├─ Faster development (same language)
   ├─ Easier hiring (more TS devs available)
   ├─ Better code reuse (shared types)
   └─ Excellent ecosystem (npm packages)

4. OPTIONAL SERVER (v1.5+)
   ├─ Works offline (v1.0)
   ├─ Optional sync (v1.5)
   ├─ Optional collaboration (v2.0)
   └─ Users choose their path

5. LEAN DEVELOPMENT
   ├─ 20-25 packages (not 101)
   ├─ ~100k LOC target (not 1.5M)
   ├─ Fast build times (10-20 min)
   └─ 1-2 person team can ship

6. PROVEN PATTERNS
   ├─ Copied from AFFiNE (production-tested)
   ├─ NestJS for backend (enterprise-proven)
   ├─ React for frontend (industry standard)
   ├─ Tauri for desktop (modern, lightweight)
   └─ Zustand/Jotai for state (excellent DX)
```

---

**Document Status**: Architecture Complete  
**Next Step**: Initialize monorepo structure and begin v1.0 development  
**Language**: TypeScript 95%+ (frontend + optional backend)  
**Deployment**: Tauri desktop (v1.0), optional NestJS server (v1.5+)
