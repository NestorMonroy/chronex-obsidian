# Joplin: Flujo de Ejecución Completo de WebDAV Sync

## 📋 Resumen: Cómo se Ejecuta el Sync

Joplin sincroniza notas con WebDAV a través de 4 fases principales:

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 0: SETUP                                              │
│  - Validar conexión al servidor                             │
│  - Crear estructura de directorios                          │
│  - Verificar/crear .sync/ para metadata                     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  FASE 1: DELETE_REMOTE                                      │
│  - Eliminar notas del remoto que fueron borradas localmente  │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  FASE 2: UPDATE_REMOTE (UPLOAD)                             │
│  - Subir notas nuevas y modificadas al servidor             │
│  - Detectar y manejar conflictos                            │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  FASE 3: DELTA (DOWNLOAD)                                   │
│  - Descargar notas nuevas y modificadas del servidor        │
│  - Reconciliar cambios en base de datos local               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 FASE 0: SETUP - Inicialización

### Detectar Primer Sync

```typescript
// Synchronizer.ts::sync()

const syncLock = await this.lockHandler().acquireLock(LockType.Sync, ...);

try {
    // Leer sync info remoto
    const remoteInfo = await fetchSyncInfo(this.api());
    
    const syncTargetIsNew = !remoteInfo.version;  // Primera vez
    
    if (syncTargetIsNew) {
        logger.info('Sync target is new - setting it up...');
        
        // Crear estructura de directorios
        await this.api().mkdir('.sync');
        await this.api().mkdir('.resource');
        
        // Crear archivo info.json con metadata del sync
        const newInfo = new SyncInfo();
        newInfo.version = CURRENT_VERSION;
        newInfo.e2ee = false;
        
        await uploadSyncInfo(this.api(), newInfo);
        await saveLocalSyncInfo(newInfo);
    } else {
        logger.info('Sync target is already setup - checking it...');
        
        // Validar que sync target sigue siendo válido
        await this.migrationHandler().checkCanSync(remoteInfo);
    }
} finally {
    await this.lockHandler().releaseLock(LockType.Sync, ...);
}
```

### Estructura de Directorio en el Servidor

```
WebDAV Root
├── .sync/
│   ├── version.txt          ← Versión del formato de sync
│   └── info.json            ← Metadata de sincronización
├── .resource/
│   ├── abcd1234...          ← Archivos adjuntos
│   └── efgh5678...
├── f3a8c4d7.md              ← Notas (con ID como nombre)
├── 2b1e9f3d.md
└── carpeta/
    ├── f1a2b3c4.md
    └── subcarpeta/
        └── x9y8z7w6.md
```

### Validación del Servidor

```typescript
// SyncTargetWebDAV.js
static async checkConfig(options) {
    const fileApi = await SyncTargetWebDAV.newFileApi_(SyncTargetWebDAV.id(), options);
    
    const output = {
        ok: false,
        errorMessage: '',
    };
    
    try {
        // Verificar que el servidor soporta WebDAV
        checkProviderIsSupported(options.path());
        
        // Intentar stat en la raíz
        const result = await fileApi.stat('');
        
        if (!result) {
            throw new Error(`WebDAV directory not found: ${options.path()}`);
        }
        
        output.ok = true;
    } catch (error) {
        output.errorMessage = error.message;
        if (error.code) output.errorMessage += ` (Code ${error.code})`;
    }
    
    return output;
}
```

---

## 🗑️ FASE 1: DELETE_REMOTE - Eliminar del Remoto

### Lógica de Eliminación

```typescript
// Synchronizer.ts

// Encontrar todas las notas que FUERON sincronizadas antes
// pero ahora no existen localmente
const syncItems = await BaseItem.syncedItemIds(syncTargetId);
// Devuelve: ['path/nota1.md', 'path/nota2.md', ...]

// Encontrar items que ya no existen localmente
const localIds = new Set(await BaseItem.allItemIds());

for (const path of syncItems) {
    const itemId = BaseItem.pathToId(path);
    
    if (!localIds.has(itemId)) {
        // Nota fue eliminada localmente
        // Eliminarla también del remoto
        try {
            await this.apiCall('delete', path);
            logger.info(`Deleted from remote: ${path}`);
        } catch (error) {
            if (error.code === 404) {
                // Ya no existe en remoto, ok
            } else {
                throw error;
            }
        }
        
        // Marcar como ya no sincronizada
        await BaseItem.removeSyncItem(syncTargetId, itemId);
    }
}
```

### HTTP Calls Específicas

```
DELETE /remote.php/webdav/f3a8c4d7.md HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...

HTTP/1.1 204 No Content

---

DELETE /remote.php/webdav/carpeta/f1a2b3c4.md HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...

HTTP/1.1 204 No Content
```

---

## 📤 FASE 2: UPDATE_REMOTE (UPLOAD) - Subir Cambios Locales

### Detectar Items a Sincronizar

```typescript
// Synchronizer.ts

// Obtener todas las notas que necesitan sincronización
const result = await BaseItem.itemsThatNeedSync(syncTargetId);
// Devuelve: {
//   items: [local_note_1, local_note_2, ...],
//   neverSyncedItemIds: ['id1', 'id2', ...],  // Nunca fueron sincronizados
//   hasMore: false
// }

for (let i = 0; i < locals.length; i++) {
    let local = locals[i];
    const path = BaseItem.systemPath(local);
    
    // Checklist de procesamiento (evitar loops infinitos)
    if (donePaths.indexOf(path) >= 0) {
        throw new Error(`Processing a path that has already been done: ${path}`);
    }
    
    donePaths.push(path);
}
```

### Determinar Acción

```typescript
// Para cada nota local

const remote = await this.apiCall('stat', path);
// Internamente: FileApiDriver.stat() -> WebDavApi.execPropFind(path, 0)

let action = null;

if (!remote) {
    // No existe en remoto
    
    if (!local.sync_time) {
        // Nunca fue sincronizada
        action = SyncAction.CreateRemote;
        logger.info(`Will create in remote: ${path}`);
    } else {
        // Fue sincronizada pero después fue eliminada del remoto
        action = SyncAction.ItemConflict;
        logger.info(`Conflict (remote deleted, local exists): ${path}`);
    }
    
} else {
    // Ya existe en remoto
    
    // Obtener contenido remoto para comparar timestamps
    const remoteContent = await this.apiCall('get', path);
    // Internamente: FileApiDriver.get() -> WebDavApi.exec('GET', path)
    
    const remoteItem = await BaseItem.unserialize(remoteContent);
    
    if (remoteItem.updated_time > local.sync_time) {
        // Remote fue modificado DESPUÉS del último sync
        action = SyncAction.ItemConflict;
        logger.info(`Conflict (both changed): ${path}`);
    } else {
        // Solo local fue modificado
        action = SyncAction.UpdateRemote;
        logger.info(`Will update in remote: ${path}`);
    }
}
```

### Subir a Remoto

```typescript
// Si es CreateRemote o UpdateRemote
if (action === SyncAction.CreateRemote || action === SyncAction.UpdateRemote) {
    try {
        // Serializar (convertir objeto JS a JSON/Markdown)
        const itemClass = BaseItem.itemClass(local);
        const serialized = await itemClass.serializeForSync(local);
        
        // Subir al remoto
        await this.apiCall('put', path, serialized);
        // Internamente: 
        // FileApi.put(path, content)
        //   -> FileApiDriver.put(path, content)
        //   -> WebDavApi.exec('PUT', path, content)
        
        // Marcar como sincronizado
        await ItemClass.saveSyncTime(syncTargetId, local, local.updated_time);
        
        logger.info(`Uploaded successfully: ${path}`);
        
    } catch (error) {
        if (error.code === 'rejectedByTarget') {
            // El servidor rechazó la subida (por ejemplo, almacenamiento lleno)
            await handleCannotSyncItem(ItemClass, syncTargetId, local, error.message);
        } else {
            throw error;
        }
    }
}
```

### HTTP Calls Específicas

```
PUT /remote.php/webdav/f3a8c4d7.md HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...
Content-Type: application/octet-stream
Content-Length: 512
Cache-Control: no-store

{
  "id": "f3a8c4d7",
  "parent_id": "abc123",
  "title": "Mi nota",
  "body": "Contenido de la nota...",
  "created_time": 1234567890,
  "updated_time": 1234567900,
  "type_": 1
}

HTTP/1.1 201 Created
ETag: "abcd1234"

---

PUT /remote.php/webdav/.resource/img_12345 HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...
Content-Type: application/octet-stream
Content-Length: 1024000

[contenido binario de imagen]

HTTP/1.1 201 Created
```

### Manejo de Conflictos

```typescript
// handleConflictAction()

if (action === SyncAction.ItemConflict) {
    const conflictedItem = local;
    conflictedItem.is_conflict = 1;  // Marcar como conflictivo
    
    // Guuardar versión local con nombre modificado
    await ItemClass.save(conflictedItem);
    
    logger.warn(`Item marked as conflict: ${path}`);
    
    // Enviar notificación al usuario
    this.dispatch({
        type: 'CONFLICT_DETECTED',
        value: {
            itemId: conflictedItem.id,
            path: path,
            remoteContent: remoteContent,
            localContent: local,
        }
    });
}
```

---

## 📥 FASE 3: DELTA (DOWNLOAD) - Descargar Cambios Remotos

### Obtener Lista de Items Remotos

```typescript
// Synchronizer.ts

// Obtener todos los items del remoto con delta (solo cambios)
let context = null;  // Contexto del último delta

while (true) {
    const listResult = await this.apiCall('delta', '', {
        context: context,
        wipeOutFailSafe: true,
        logger: logger,
    });
    
    // Internamente:
    // FileApi.delta(path, options)
    //   -> FileApiDriver.delta(path, options)
    //   -> basicDelta(path, getDirStats, options)
    //   -> loop de list() para obtener cambios
    
    // Resultado:
    // {
    //   items: [
    //     { path: 'f3a8c4d7.md', updated_time: 1234567900, jop_updated_time: 1234567900, isDir: false },
    //     { path: 'carpeta/f1a2b3c4.md', updated_time: 1234567910, jop_updated_time: 1234567910, isDir: false },
    //   ],
    //   hasMore: false,
    //   context: 'next-context-token'
    // }
    
    const remoteItems = listResult.items;
    context = listResult.context;  // Para siguiente iteración
    
    logger.info(`Delta returned ${remoteItems.length} items`);
}
```

### Descargar Cambios

```typescript
// Para cada item remoto nuevo/modificado

for (const remote of remoteItems) {
    const remoteId = BaseItem.pathToId(remote.path);
    const local = locals.find(l => l.id === remoteId);
    
    // ¿Necesita descargar contenido?
    let needsToDownload = true;
    if (this.api().supportsAccurateTimestamp) {
        if (local && local.updated_time === remote.jop_updated_time) {
            needsToDownload = false;  // Ya está actualizado
        }
    }
    
    if (needsToDownload) {
        // Agregar a cola de descargas (para paralelizar)
        this.downloadQueue_.push(remote.path, async () => {
            return this.apiCall('get', remote.path);
            // Internamente: FileApiDriver.get() -> WebDavApi.exec('GET', remote.path)
        });
    }
}

// Luego, procesar cada descarga

for (const remote of remoteItems) {
    let action = null;
    let local = locals.find(l => l.id === BaseItem.pathToId(remote.path));
    
    if (!local) {
        // Item no existe localmente
        
        if (remote.isDeleted !== true) {
            action = SyncAction.CreateLocal;
            
            // Esperar a que se complete la descarga
            const task = await this.downloadQueue_.waitForResult(remote.path);
            if (task.error) throw task.error;
            
            const content = task.result;  // Contenido descargado
            const item = await BaseItem.unserialize(content);
            
            // Guardar en base de datos local
            const ItemClass = BaseItem.itemClass(item);
            const savedItem = await ItemClass.save(item);
            
            // Marcar como sincronizado
            await ItemClass.saveSyncTime(syncTargetId, savedItem, remote.jop_updated_time);
            
            logger.info(`Created locally: ${remote.path}`);
        } else {
            // Item fue eliminado remotamente, ignorar
        }
        
    } else {
        // Item ya existe localmente
        
        if (remote.isDeleted) {
            action = SyncAction.DeleteLocal;
            
            // Eliminar del servidor
            await BaseItem.delete(local.id);
            
            logger.info(`Deleted locally: ${remote.path}`);
            
        } else if (this.api().supportsAccurateTimestamp && 
                   remote.jop_updated_time === local.updated_time) {
            // Misma versión, nada que hacer
            action = null;
            
        } else {
            // Item fue modificado remotamente
            action = SyncAction.UpdateLocal;
            
            // Descargar contenido
            const task = await this.downloadQueue_.waitForResult(remote.path);
            if (task.error) throw task.error;
            
            const content = task.result;
            const remoteItem = await BaseItem.unserialize(content);
            
            // Actualizar en base de datos local
            const ItemClass = BaseItem.itemClass(local);
            const updated = Object.assign(local, remoteItem);
            const savedItem = await ItemClass.save(updated);
            
            // Marcar como sincronizado
            await ItemClass.saveSyncTime(syncTargetId, savedItem, remote.jop_updated_time);
            
            logger.info(`Updated locally: ${remote.path}`);
        }
    }
}
```

### HTTP Calls Específicas

```
PROPFIND /remote.php/webdav/ HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...
Depth: 1
Content-Type: text/xml

<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:getlastmodified/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>

HTTP/1.1 207 Multi-Status
Content-Type: application/xml

<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/webdav/f3a8c4d7.md</d:href>
    <d:propstat>
      <d:prop>
        <d:getlastmodified>Tue, 19 Dec 2024 12:34:56 GMT</d:getlastmodified>
        <d:resourcetype></d:resourcetype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  ...
</d:multistatus>

---

GET /remote.php/webdav/f3a8c4d7.md HTTP/1.1
Host: nextcloud.local
Authorization: Basic ...
Cache-Control: no-store

HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Length: 512

{
  "id": "f3a8c4d7",
  "parent_id": "abc123",
  "title": "Mi nota",
  "body": "Contenido de la nota...",
  "created_time": 1234567890,
  "updated_time": 1234567900,
  "type_": 1
}
```

---

## 🔄 Algoritmo Delta en Detalle

### BasicDelta - Comparación Local vs Remoto

```typescript
// file-api.js

async function basicDelta(path, getDirStats, options) {
    const context = options.context || {};
    
    // Obtener lista actual de archivos
    const currentStats = await getDirStats(path);
    // Internamente: FileApiDriver.list(path) -> WebDavApi.execPropFind(path, 1)
    
    // Leer contexto anterior (última lista)
    const previousStats = context.items || [];
    
    const delta = [];
    const newContext = {
        items: currentStats,
    };
    
    // Detectar cambios: nuevos, modificados, eliminados
    
    // 1. Items nuevos y modificados (en remoto ahora)
    for (const currentStat of currentStats) {
        const previousStat = previousStats.find(p => p.path === currentStat.path);
        
        if (!previousStat) {
            // Item nuevo
            delta.push({
                path: currentStat.path,
                updated_time: currentStat.updated_time,
                isDir: currentStat.isDir,
            });
        } else if (previousStat.updated_time !== currentStat.updated_time) {
            // Item modificado
            delta.push({
                path: currentStat.path,
                updated_time: currentStat.updated_time,
                isDir: currentStat.isDir,
            });
        }
    }
    
    // 2. Items eliminados (estaban antes, ahora no)
    for (const previousStat of previousStats) {
        const currentStat = currentStats.find(c => c.path === previousStat.path);
        
        if (!currentStat) {
            // Item fue eliminado
            delta.push({
                path: previousStat.path,
                isDeleted: true,
            });
        }
    }
    
    return {
        items: delta,
        hasMore: false,
        context: newContext,
    };
}
```

### Ejemplo de Delta

```
Primera sincronización (context vacío):
- Archivos remotos: f1.md, f2.md, carpeta/f3.md
- Delta retorna: [f1.md, f2.md, carpeta/f3.md] (todos nuevos)
- Context guarda: { items: [f1.md, f2.md, carpeta/f3.md] }

Segunda sincronización (context anterior):
- Archivos remotos (actuales): f1.md (sin cambios), f2.md (modificado), f4.md (nuevo)
- Delta retorna: [
    { path: 'f2.md', updated_time: NEW_TIME },  // Modificado
    { path: 'f4.md', updated_time: NEW_TIME },  // Nuevo
    { path: 'carpeta/f3.md', isDeleted: true }, // Eliminado
  ]
- Context guarda: { items: [f1.md, f2.md, f4.md] }
```

---

## 📊 Tabla: Métodos FileApiDriver en Sync

| Método | Cuándo se Usa | HTTP Method |
|--------|---------------|-------------|
| **stat(path)** | Verificar si existe item | PROPFIND depth=0 |
| **list(path)** | Listar directorio | PROPFIND depth=1 |
| **get(path)** | Descargar contenido | GET |
| **put(path, content)** | Subir contenido | PUT |
| **delete(path)** | Eliminar | DELETE |
| **mkdir(path)** | Crear directorio | MKCOL |
| **move(old, new)** | Renombrar/mover | MOVE |
| **delta(path, context)** | Obtener cambios | PROPFIND (multiple) |

---

## 🚀 Flujo Completo de Ejemplo: Agregar Nueva Nota

```
PASO 1: Usuario crea nota localmente
  ├─ Nota: { id: 'abc123', title: 'New Note', body: '...', sync_time: 0 }
  └─ Guardada en SQLite local

PASO 2: Sincronización FASE 2 (UPLOAD)
  ├─ Detectar: itemsThatNeedSync() retorna la nota
  ├─ stat('abc123.md') → No existe en remoto
  ├─ action = CreateRemote
  ├─ Serializar nota a JSON
  ├─ PUT /remote.php/webdav/abc123.md → 201 Created
  ├─ saveSyncTime(abc123, now)  ← Marcar como sincronizado
  └─ logger.info('Uploaded successfully: abc123.md')

PASO 3: Sincronización FASE 3 (DELTA)
  ├─ delta('') → lista todos los archivos del remoto
  ├─ PROPFIND /remote.php/webdav/ (Depth: 1) → 207 Multi-Status (XML)
  ├─ Parsear XML → [f1.md, f2.md, abc123.md, ...]
  ├─ Comparar con contexto anterior
  ├─ Delta retorna: [] (sin cambios, ya subió en FASE 2)
  └─ Sync completado
```

---

## ✅ Conclusión

**El flujo de WebDAV Sync en Joplin**:

1. **SETUP**: Validar servidor, crear estructura
2. **DELETE_REMOTE**: Eliminar notas borradas
3. **UPDATE_REMOTE**: Subir notas nuevas/modificadas
4. **DELTA**: Descargar cambios remotos

Cada fase usa:
- WebDavApi para HTTP
- FileApiDriver para abstracción
- Sync timestamps para detección de cambios
- Lock distribuido para evitar conflictos

Este patrón es **robusto, escalable y fácil de extender a otros backends** (S3, Dropbox, etc.)
