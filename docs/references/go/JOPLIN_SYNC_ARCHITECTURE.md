# Joplin: Análisis Completo de Arquitectura de Sincronización

## 📋 Resumen Ejecutivo

Joplin es una aplicación de notas open-source que soporta **múltiples backends de sincronización**:

- ✅ **Joplin Cloud** (servicio propio)
- ✅ **Joplin Server** (self-hosted)
- ✅ **Nextcloud WebDAV**
- ✅ **OneDrive**
- ✅ **Dropbox**
- ✅ **Amazon S3**
- ✅ **Filesystem** (local)
- ✅ **Memory** (testing)

**Diferencia clave vs rclone**: 
- rclone = **herramienta de sincronización genérica** (70+ backends)
- Joplin = **aplicación de notas con sincronización integrada** (8 backends específicos)

**Arquitectura**:
- TypeScript/Node.js (core)
- Electron (desktop)
- React Native (mobile)
- SQLite (almacenamiento local)

---

## 🏗️ Arquitectura de Alto Nivel

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    Joplin App                           │
│  (Desktop, Mobile, CLI, Server)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Synchronizer                           │   │
│  │  (Sync engine central)                          │   │
│  │  - Algoritmo de reconciliación                  │   │
│  │  - Conflicto resolución                         │   │
│  │  - Encryption/Decryption                        │   │
│  │  - Progress tracking                            │   │
│  └──────────────────────────────────────────────────┘   │
│           ▲                                              │
│           │ (abstraction)                               │
│  ┌────────┴───────────────────────────────────────┐   │
│  │              FileApi (abstracción)             │   │
│  │  - stat(path)                                  │   │
│  │  - get(path)                                   │   │
│  │  - put(path, data)                             │   │
│  │  - delete(path)                                │   │
│  │  - list(path)                                  │   │
│  │  - move(oldPath, newPath)                      │   │
│  │  - mkdir(path)                                 │   │
│  └────────┬────────────────────────────────────────┘   │
│           │                                              │
│  ┌────────┴──────────────────────────────────────┐    │
│  │      FileApiDriver (específico por backend)   │    │
│  │                                                │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │ FileApiDriverWebDav (PROPFIND, PUT,  │    │    │
│  │  │ GET, DELETE, MOVE)                   │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │ FileApiDriverAmazonS3 (S3 API)        │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │ FileApiDriverDropbox (Dropbox API)    │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │ FileApiDriverOneDrive (Graph API)     │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  └────────┬────────────────────────────────────┘    │
│           │                                          │
├───────────┴──────────────────────────────────────┤    │
│          Local Database (SQLite)                 │    │
│  - Notes, Folders, Resources                    │    │
│  - Metadata & sync state                        │    │
│  - Encryption keys                              │    │
└──────────────────────────────────────────────────┴────┘
```

### Patrón de Arquitectura: **Adapter Pattern**

```
BaseSyncTarget (interfaz)
    │
    ├─ SyncTargetWebDAV (implementación)
    ├─ SyncTargetAmazonS3 (implementación)
    ├─ SyncTargetDropbox (implementación)
    ├─ SyncTargetOneDrive (implementación)
    └─ ... (más backends)
    
Cada SyncTarget:
    1. Define initFileApi() → FileApi
    2. Define initSynchronizer() → Synchronizer
    3. Synchronizer usa FileApi con abstracción genérica
```

---

## 📁 Estructura de Directorios

```
packages/lib/
├── BaseSyncTarget.ts          (clase base para todos los sync targets)
├── Synchronizer.ts            (motor de sincronización principal)
├── SyncTargetWebDAV.js        (WebDAV implementation)
├── SyncTargetAmazonS3.js      (S3 implementation)
├── SyncTargetDropbox.js       (Dropbox implementation)
├── SyncTargetOneDrive.ts      (OneDrive implementation)
├── SyncTargetJoplinServer.ts  (Joplin Cloud)
├── SyncTargetNextcloud.js     (Nextcloud WebDAV)
├── SyncTargetFilesystem.ts    (Local filesystem)
├── SyncTargetMemory.js        (Testing)
├── WebDavApi.ts               (WebDAV HTTP client)
├── DropboxApi.js              (Dropbox HTTP client)
├── file-api.js                (FileApi abstraction)
├── file-api-driver-webdav.js  (WebDAV driver)
├── file-api-driver-amazon-s3.js (S3 driver)
├── file-api-driver-dropbox.js (Dropbox driver)
├── services/synchronizer/
│   ├── Synchronizer.ts        (sync algorithm)
│   ├── LockHandler.ts         (distributed locks)
│   ├── ItemUploader.ts        (upload logic)
│   ├── MigrationHandler.ts    (schema migrations)
│   ├── syncInfoUtils.ts       (sync metadata)
│   └── ... (más utilidades de sync)
├── models/
│   ├── BaseItem.ts            (clase base para items)
│   ├── Note.ts                (notas)
│   ├── Folder.ts              (carpetas)
│   ├── Resource.ts            (recursos/archivos)
│   └── ItemChange.ts          (registro de cambios)
└── ...
```

---

## 🔐 SyncTarget: Clase Base y Patrón

### BaseSyncTarget.ts

```typescript
export default class BaseSyncTarget {
    // Métodos estáticos (configuración)
    public static id(): number
    public static targetName(): string  // 'webdav', 'amazon_s3', etc.
    public static label(): string       // 'WebDAV', 'S3', etc.
    public static description(): string
    public static supportsConfigCheck(): boolean
    public static requiresPassword(): boolean
    public static supportsSelfHosted(): boolean
    public static supportsShare(): boolean

    // Métodos instancia (operación)
    protected async initFileApi(): Promise<FileApi>
    protected async initSynchronizer(): Promise<Synchronizer>
    public async synchronizer(): Promise<Synchronizer>
    public async fileApi(): Promise<FileApi>
    public async isAuthenticated(): boolean
    public async syncStarted(): boolean
}
```

### Implementación: WebDAV

```typescript
class SyncTargetWebDAV extends BaseSyncTarget {
    static id() { return 6; }
    static targetName() { return 'webdav'; }
    static label() { return _('WebDAV'); }
    static requiresPassword() { return true; }
    
    async initFileApi() {
        // Crear instancia de WebDavApi
        const api = new WebDavApi({
            baseUrl: () => Setting.value('sync.6.path'),
            username: () => Setting.value('sync.6.username'),
            password: () => Setting.value('sync.6.password'),
        });
        
        // Wrappear en FileApiDriverWebDav
        const driver = new FileApiDriverWebDav(api);
        
        // Wrappear en FileApi
        const fileApi = new FileApi('', driver);
        return fileApi;
    }
    
    async initSynchronizer() {
        return new Synchronizer(this.db(), await this.fileApi(), appType);
    }
}
```

---

## 📡 WebDAV Implementation en Joplin

### WebDavApi.ts - HTTP Client

**Librerías usadas**:
- `xml2js` - Parsear respuestas XML
- `base-64` - Encoding para Basic Auth
- `url-parse` - Parseo de URLs
- `shim` - Abstracción de fetch (fetch/node-fetch/react-native)

### Métodos WebDAV Soportados

```typescript
async exec(
    method: string,        // 'PROPFIND', 'PUT', 'GET', 'DELETE', 'MOVE', 'MKCOL'
    path: string,
    body: string | null,
    headers: Record<string, string | number>,
    options: ExecOptions
): Promise<JsonValue>
```

### Flujo de Autenticación

```typescript
// Basic Auth
private authToken(): string | null {
    return base64.encode(`${username}:${password}`);
}

// Aplicar a cada request
headers['Authorization'] = `Basic ${authToken}`;
```

### Manejo de Excepciones por Servidor

```typescript
// Nginx hack: Nginx retorna 200 OK pero con 404 en la respuesta XML
private handleNginxHack_(jsonResponse, newErrorHandler) {
    // Detectar 404 embebido en respuesta XML
    // Ejemplo: servidor retorna HTTP 200 pero <d:status>HTTP/1.1 404 Not Found</d:status>
}

// Seafile/Tomcat: Algunos servidores rechazan If-None-Match header
private async fetchWithIfNoneMatchTest(url, fetchOptions) {
    // Intentar con If-None-Match
    // Si falla con 400, reintentar sin el header
}
```

### Métodos HTTP Específicos

#### PROPFIND - Listar y obtener metadata

```typescript
async execPropFind(path: string, depth: number, props: string[]) {
    // Depth: 0 = solo este item, 1 = este + hijos
    
    const body = `<?xml version="1.0" encoding="UTF-8"?>
        <d:propfind xmlns:d="DAV:">
            <d:prop>
                <d:getlastmodified/>
                <d:resourcetype/>
                ${props.map(p => `<${p}/>`).join('')}
            </d:prop>
        </d:propfind>`;
    
    return this.exec('PROPFIND', path, body, {
        'Content-Type': 'text/xml',
        'Depth': depth.toString(),
    });
}
```

**Respuesta parseada**:
```typescript
{
    'd:multistatus': {
        'd:response': [
            {
                'd:href': '/remote.php/webdav/archivo.pdf',
                'd:propstat': {
                    'd:prop': {
                        'd:displayname': 'archivo.pdf',
                        'd:getlastmodified': 'Tue, 19 Dec 2017 22:02:36 GMT',
                        'd:getcontentlength': 1024,
                        'd:resourcetype': {}  // vacío = archivo, {collection} = directorio
                    },
                    'd:status': 'HTTP/1.1 200 OK'
                }
            }
        ]
    }
}
```

#### PUT - Subir archivo

```typescript
async put(path: string, content: string, options?: ExecOptions) {
    return this.exec('PUT', path, content, {
        'Content-Type': 'application/octet-stream',
    }, options);
}
```

#### GET - Descargar archivo

```typescript
async get(path: string, options?: ExecOptions) {
    return this.exec('GET', path, null, {}, {
        ...options,
        responseFormat: 'text',  // Retornar contenido binario
    });
}
```

#### DELETE - Eliminar

```typescript
async delete(path: string) {
    return this.exec('DELETE', path);
}
```

#### MOVE - Renombrar/mover

```typescript
async move(oldPath: string, newPath: string) {
    return this.exec('MOVE', oldPath, null, {
        'Destination': `${this.baseUrl()}/${newPath}`,
        'Overwrite': 'T',  // T = sobrescribir, F = no sobrescribir
    });
}
```

#### MKCOL - Crear directorio

```typescript
async mkdir(path: string) {
    // RFC requiere trailing slash
    if (!path.endsWith('/')) path += '/';
    return this.exec('MKCOL', path);
}
```

---

## 📦 FileApi: Abstracción Genérica

### Interface FileApiDriver (implementada por cada backend)

```typescript
interface FileApiDriver {
    // Metadata
    stat(path): Promise<{ path, updated_time, isDir }>
    list(path): Promise<{ items, hasMore, context }>
    
    // Operaciones
    get(path, options): Promise<string>
    put(path, content, options): Promise<void>
    delete(path): Promise<void>
    mkdir(path): Promise<void>
    move(oldPath, newPath): Promise<void>
    
    // Delta (cambios incremental)
    delta(path, options): Promise<{ items, hasMore, context }>
}
```

### FileApi Wrapper

```typescript
export class FileApi {
    constructor(appDir: string, driver: FileApiDriver) {
        this.appDir_ = appDir;
        this.driver_ = driver;
    }
    
    async stat(path): Promise<ItemStat> {
        return this.driver_.stat(this.remotePath_(path));
    }
    
    async list(path): Promise<PaginatedList> {
        return this.driver_.list(this.remotePath_(path));
    }
    
    async delta(path, options): Promise<RemoteItem[]> {
        return this.driver_.delta(this.remotePath_(path), options);
    }
    
    // ... resto de métodos
}
```

### FileApiDriverWebDav: Implementación WebDAV

```typescript
class FileApiDriverWebDav {
    constructor(api: WebDavApi) {
        this.api_ = api;
    }
    
    async stat(path): Promise<{ path, updated_time, isDir }> {
        const result = await this.api_.execPropFind(path, 0, [
            'd:getlastmodified',
            'd:resourcetype'
        ]);
        return this.statFromResource_(result, path);
    }
    
    async list(path) {
        const result = await this.api_.execPropFind(path, 1, [
            'd:getlastmodified',
            'd:resourcetype'
        ]);
        // Parsear respuesta XML a array de items
        return {
            items: this.statsFromResources_(resources),
            hasMore: false,
            context: null,
        };
    }
    
    async get(path, options) {
        return this.api_.exec('GET', path, null, null, options);
    }
    
    async put(path, content, options) {
        return this.api_.exec('PUT', path, content, null, options);
    }
    
    async delete(path) {
        return this.api_.exec('DELETE', path);
    }
    
    async mkdir(path) {
        if (!path.endsWith('/')) path += '/';
        return this.api_.exec('MKCOL', path);
    }
    
    async move(oldPath, newPath) {
        return this.api_.exec('MOVE', oldPath, null, {
            'Destination': `${this.api_.baseUrl()}/${newPath}`,
            'Overwrite': 'T',
        });
    }
    
    async delta(path, options) {
        // Usar basicDelta para computar cambios
        const getDirStats = async path => {
            const result = await this.list(path);
            return result.items;
        };
        return basicDelta(path, getDirStats, options);
    }
}
```

---

## 🔄 Synchronizer: Motor de Sincronización

### Estructura Básica

```typescript
export default class Synchronizer {
    private db_: JoplinDatabase;
    private api_: FileApi;
    private appType_: AppType;
    private state_ = 'idle';
    private lockHandler_: LockHandler;
    private migrationHandler_: MigrationHandler;
    private encryptionService_: EncryptionService;
    
    async sync(): Promise<void> {
        // 1. Adquirir lock distribuido
        // 2. Verificar y migrar schema si es necesario
        // 3. Calcular cambios locales vs remotos
        // 4. Reconciliar conflictos
        // 5. Descargar items remotos
        // 6. Subir items locales
        // 7. Liberar lock
        // 8. Reportar progreso
    }
}
```

### Estados de Sincronización

```
idle → syncing → cancelling → idle
  ▲                    ▓
  └────────────────────┘
```

### Key Features

1. **Lock Handler**: Evitar sincronización simultánea desde múltiples clientes
2. **Migration Handler**: Upgrade automático del schema
3. **Encryption Service**: E2EE transparente
4. **Resource Service**: Manejo de archivos (fotos, PDFs)
5. **Item Uploader**: Carga por chunks
6. **Conflict Resolution**: Merge automático o pedir usuario

---

## 💾 Almacenamiento Local (SQLite)

### Schema Principal

```sql
-- Notas
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    parent_id TEXT,
    created_time INTEGER,
    updated_time INTEGER,
    is_conflict BOOLEAN,
    sync_time INTEGER,
    ...
);

-- Carpetas
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    title TEXT,
    parent_id TEXT,
    ...
);

-- Recursos (archivos, imágenes)
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    file_extension TEXT,
    mime_type TEXT,
    title TEXT,
    size INTEGER,
    ...
);

-- Cambios locales (para sincronizar)
CREATE TABLE item_changes (
    id INTEGER PRIMARY KEY,
    item_id TEXT,
    item_type INTEGER,
    type INTEGER,  -- 'create', 'update', 'delete'
    created_time INTEGER
);

-- Sync info (metadata de sincronización)
CREATE TABLE sync_items (
    id TEXT PRIMARY KEY,
    sync_target_id INTEGER,
    path TEXT,
    is_dir BOOLEAN,
    updated_time INTEGER,
    content_size INTEGER,
    ...
);

-- Master keys (para E2EE)
CREATE TABLE master_keys (
    id TEXT PRIMARY KEY,
    encryption_method INTEGER,
    key_provider TEXT,
    ...
);
```

---

## 🔐 Encriptación End-to-End (E2EE)

### Componentes

```
┌────────────────────────────────────────┐
│    EncryptionService                   │
│  - Manage master keys                  │
│  - Encrypt/decrypt items               │
│  - Handle key rotation                 │
└────────────────────────────────────────┘
         ▲
         │
┌────────┴──────────────────────────┐
│  Synchronizer (transparente)      │
│  - Encriptar antes de subir       │
│  - Desencriptar después de bajar  │
└───────────────────────────────────┘
```

### Algoritmo

```
1. Generar Master Key (AES-256)
2. Derivar key para cada item
3. Encriptar contenido con AES-256-GCM
4. Almacenar en remoto
5. Descargar y desencriptar local

Soporte:
- PKCS#2 (Password-based key derivation)
- PBKDF2
- Propiedades públicas (metadata visible)
- Propiedades privadas (encriptadas)
```

---

## 📊 Algoritmo de Sincronización

### Fases Principales

```
┌─────────────────────────────────────────────────┐
│ FASE 1: Check & Lock                            │
│ - Validar sync target                           │
│ - Adquirir distributed lock                     │
│ - Verificar permissions                         │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 2: Fetch Remote State                      │
│ - Obtener delta desde remoto                    │
│ - Comparar con sync_items local                 │
│ - Detectar cambios remotos                      │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 3: Fetch Local Changes                     │
│ - Leer item_changes table                       │
│ - Detectar notas/archivos nuevos                │
│ - Detectar notas/archivos modificados           │
│ - Detectar notas/archivos eliminados            │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 4: Reconcile Conflicts                     │
│ - Item modificado localmente + remotamente      │
│ - Estrategias:                                  │
│   - Last-write-wins (por defecto)               │
│   - Keep both (crear duplicate)                 │
│   - Keep local                                  │
│   - Keep remote                                 │
│   - Manual resolution (user choice)             │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 5: Download Remote Items                   │
│ - Iterar items remotos nuevos                   │
│ - Desencriptar si es E2EE                       │
│ - Guardar en base de datos local                │
│ - Actualizar sync_items                         │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 6: Upload Local Items                      │
│ - ItemUploader para items nuevos/modificados    │
│ - Encriptar si es E2EE                          │
│ - PUT a remoto                                  │
│ - Marcar como sync_time = now                   │
│ - Limpiar item_changes                          │
└─────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│ FASE 7: Cleanup & Release Lock                  │
│ - Eliminar items borrados de remoto             │
│ - Liberar distributed lock                      │
│ - Report final status                           │
└─────────────────────────────────────────────────┘
```

### Pseudocódigo del Sync Loop

```typescript
async sync() {
    try {
        // 1. Lock
        await this.lockHandler_.acquireLock();
        
        // 2. Get remote changes
        const remoteItems = await this.api_.delta('', {});
        const remoteItemsMap = new Map(
            remoteItems.map(item => [item.path, item])
        );
        
        // 3. Get local changes
        const localChanges = await ItemChange.allByType();
        
        // 4. Compare & reconcile
        for (const change of localChanges) {
            const remoteItem = remoteItemsMap.get(change.path);
            
            if (!remoteItem) {
                // Nuevo localmente
                await this.uploadItem(change);
            } else if (change.updated_time > remoteItem.updated_time) {
                // Modificado localmente más recientemente
                await this.uploadItem(change);
            } else if (change.updated_time < remoteItem.updated_time) {
                // Modificado remotamente más recientemente
                await this.downloadItem(remoteItem);
            }
            // else: mismo timestamp = sin cambios
        }
        
        // 5. Download new remote items
        for (const remoteItem of remoteItems) {
            if (!localChanges.find(c => c.path === remoteItem.path)) {
                await this.downloadItem(remoteItem);
            }
        }
        
        // 6. Mark sync complete
        this.state_ = 'idle';
        
    } finally {
        await this.lockHandler_.releaseLock();
    }
}
```

---

## 📊 Comparación: Joplin vs rclone vs SiYuan

| Aspecto | Joplin | rclone | SiYuan |
|---------|--------|--------|--------|
| **Propósito** | App de notas | Herramienta sync | App de notas |
| **Backends** | 8 específicos | 70+ genéricos | WebDAV + S3 |
| **Lenguaje** | TypeScript/Node.js | Go | TypeScript |
| **Arquitectura** | Adapter + Plugin | Genérica + backends | Adapter + Plugin |
| **E2EE** | Sí | No | Sí |
| **Sincronización** | Delta + reconciliation | Delta | Fast CDC + Bloom |
| **Base de datos** | SQLite | Filesystem | SQLite |
| **Celdas públicas** | N/A | N/A | Metadata indexación |
| **Compartir notas** | Sí (Joplin Cloud) | No | Sí |
| **Bloqueos distribuidos** | Sí | No | No |
| **Migraciones automáticas** | Sí | No | No |
| **Líneas de código** | ~100,000 (todo) | ~250,000 | ~50,000 |

---

## 🎯 Lecciones para Chronex

### Patrón de Adapter

```typescript
// Chronex debería usar similar:

interface SyncProvider {
    stat(path): Promise<Stats>
    list(path): Promise<Items[]>
    get(path): Promise<Buffer>
    put(path, data): Promise<void>
    delete(path): Promise<void>
    move(old, new): Promise<void>
    mkdir(path): Promise<void>
    delta(path): Promise<Changes[]>
}

class WebDAVProvider implements SyncProvider { ... }
class S3Provider implements SyncProvider { ... }
class LocalProvider implements SyncProvider { ... }

class Synchronizer {
    constructor(private provider: SyncProvider) {}
    
    async sync() {
        const remoteItems = await this.provider.delta('/');
        // ... resto del algoritmo
    }
}
```

### Ventajas de la Arquitectura Joplin

✅ **Separa concerns**:
- SyncTarget = UI + configuración
- FileApi = Abstracción
- FileApiDriver = Implementación específica
- Synchronizer = Algoritmo genérico

✅ **Fácil de agregar backends**: Solo implementar FileApiDriver

✅ **Testing fácil**: Mock FileApi en tests

✅ **Encriptación transparente**: Synchronizer no conoce detalles

### Diferencias con rclone

| rclone | Joplin |
|--------|--------|
| Sincrona one-way o two-way | Always two-way con reconciliation |
| No maneja conflictos | Conflict resolution automática |
| No E2EE | E2EE full |
| Filesystem + remote | Remote + local database |
| Sin locks distribuidos | Distributed locks |
| Sin soporte para sharing | Sharing + permisos |

---

## 📦 Dependencias de Joplin

### @joplin/lib (Core)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "3.296.0",        // S3
    "@aws-sdk/s3-request-presigner": "3.296.0",
    "base-64": "1.0.0",                     // Base64 encoding
    "xml2js": "0.4.23",                     // XML parsing
    "sqlite3": "5.1.6",                     // SQLite
    "node-rsa": "1.1.1",                    // RSA encryption
    "async-mutex": "0.5.0",                 // Mutex for locking
    "fast-deep-equal": "3.1.3",             // Deep equality
    "moment": "2.30.1",                     // Datetime
    "redux": "4.2.1",                       // State management
    "nanoid": "3.3.11",                     // UUID generation
    ...
  }
}
```

### Observación

Joplin tiene **MENOS dependencias que rclone**:
- rclone: 254 librerías externas
- Joplin: ~50 librerías externas (solo lib)
- Razón: Joplin es específica (solo WebDAV, S3, Dropbox), no genérica (70+ backends)

---

## ✅ Conclusión

**Joplin es un buen modelo para Chronex** porque:

1. ✅ **Separación clara de concerns**:
   - SyncTarget = Configuración UI
   - FileApi = Abstracción genérica
   - FileApiDriver = Implementación específica

2. ✅ **Fácil agregar backends**: Solo implementar FileApiDriver

3. ✅ **Algoritmo de sync robusto**:
   - Detección de conflictos
   - Reconciliación automática
   - Bloqueos distribuidos
   - E2EE transparente

4. ✅ **Testeable**: Mock FileApi para testing

5. ✅ **Menos dependencias que rclone**

**Para Chronex, recomendación**:
- Adoptar patrón Adapter (como Joplin)
- SyncProvider en lugar de FileApiDriver
- Empezar con WebDAV + S3
- Agregar Local y otros después
- Usar SQLite local (como Joplin)
- Considerar E2EE más adelante
