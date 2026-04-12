# Análisis Profundo: WebDAV en SiYuan Note

## 📋 Resumen Ejecutivo

SiYuan implementa **WebDAV como un proveedor de sincronización intercambiable** junto a S3 y su propio servidor. No crea un plugin para WebDAV, sino que integra un cliente WebDAV estándar en el kernel Go que maneja:

- **Configuración**: Endpoint, usuario, contraseña, SSL/TLS
- **Autenticación**: Basic Auth encriptada
- **Sincronización**: A través de la librería `dejavu` (sistema de versioning)
- **Exportación/Importación**: Configuración encriptada en ZIP

---

## 🏗️ Arquitectura: Cómo se Integra WebDAV

### 1. Capa de Configuración (conf/sync.go)

```go
type WebDAV struct {
    Endpoint       string  // URL del servidor WebDAV (ej: https://nextcloud.com/dav)
    Username       string  // Usuario para autenticación
    Password       string  // Contraseña (se encripta en export)
    SkipTlsVerify  bool    // Para certificados auto-firmados
    Timeout        int     // Segundos, para operaciones lenta
    ConcurrentReqs int     // Paralelismo (upload/download simultáneos)
}

type Sync struct {
    Provider   int     // 0=SiYuan, 2=S3, 3=WebDAV, 4=Local
    WebDAV     *WebDAV // Configuración específica
    CloudName  string  // Nombre del directorio en la nube
    Mode       int     // 1=Auto, 2=Manual, 3=Completamente manual
    Interval   int     // Segundos entre syncs automáticos
    Synced     int64   // Timestamp último sync
    Enabled    bool    // ¿Está activo?
}
```

**Validación de Endpoint**:
```go
webdav.Endpoint = util.NormalizeEndpoint(webdav.Endpoint)
// Rechaza Jianguoyun (坚果云) por incompatibilidad
if strings.Contains(strings.ToLower(webdav.Endpoint), "dav.jianguoyun.com") {
    err = errors.New("WebDAV provider not supported")
}
```

---

## 🔐 Seguridad: Almacenamiento de Credenciales

### Export/Import de Configuración

Cuando el usuario exporta su configuración de WebDAV para compartirla o respaldarla:

**1. Exportación (exportSyncProviderWebDAV)**:
```
1. Serializar config WebDAV a JSON
2. Encriptar con AES (util.AESEncrypt)
3. Codificar a hex
4. Guardar en archivo temporal
5. Crear ZIP con el archivo
6. Servir descarga al usuario
```

**Código Go**:
```go
data, _ := gulu.JSON.MarshalJSON(model.Conf.Sync.WebDAV)
dataStr := util.AESEncrypt(string(data))  // Encriptado
tmp := filepath.Join(tmpDir, name)
os.WriteFile(tmp, []byte(dataStr), 0644)
zipFile.AddEntry(name, tmp)  // Empaquetar en ZIP
```

**Seguridad**:
- ✅ Credenciales nunca se almacenan en texto plano
- ✅ AES encriptación antes de exportar
- ✅ Archivo ZIP contiene solo datos encriptados

**2. Importación (importSyncProviderWebDAV)**:
```
1. Usuario sube archivo .zip con configuración
2. Descomprimir ZIP
3. Leer archivo de configuración encriptado
4. Desencriptar con AES
5. Decodificar desde hex
6. Deserializar JSON
7. Guardar en Conf.Sync.WebDAV
```

**Código Go**:
```go
data := util.AESDecrypt(string(data))  // Desencriptar
data, _ := hex.DecodeString(string(data))  // Decodificar
webdav := &conf.WebDAV{}
gulu.JSON.UnmarshalJSON(data, webdav)  // Parsear
model.SetSyncProviderWebDAV(webdav)    // Guardar
```

---

## 🔄 Flujo de Sincronización

### Arquitectura de Flujo

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Electron) - Usuario hace click "Sync"        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ HTTP POST /api/sync             │
        │ Llamada desde TypeScript       │
        └────────────────────┬───────────┘
                             │
                             ▼
        ┌────────────────────────────────┐
        │ Kernel (Go) - model/sync.go    │
        │ 1. SyncData() - Punto entrada  │
        │ 2. checkSync() - Validaciones  │
        │ 3. lockSync() - Mutex         │
        └────────────────────┬───────────┘
                             │
                             ▼
        ┌────────────────────────────────┐
        │ newRepository()                 │
        │ Crear cliente con proveedor    │
        │ buildCloudConf()               │
        └────────────────────┬───────────┘
                             │
                             ▼
        ┌────────────────────────────────┐
        │ cloud.NewWebDAV()              │
        │ (librería dejavu)              │
        │ - Inicializar cliente HTTP     │
        │ - Basic Auth                   │
        │ - Headers personalizados       │
        └────────────────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            SyncDownload()      SyncUpload()
            (descarga cambios)   (sube cambios)
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────────────────┐
        │ processSyncMergeResult()       │
        │ - Resolver conflictos          │
        │ - Actualizar índices           │
        │ - Reindexar documentos         │
        │ - Broadcast eventos            │
        └────────────────────┬───────────┘
                             │
                             ▼
        ┌────────────────────────────────┐
        │ Frontend recibe evento         │
        │ "syncing" con estado final     │
        └────────────────────────────────┘
```

---

## 🌐 Inicialización del Cliente WebDAV

### `newRepository()` - Línea 2014

Este es el **punto crítico** donde se configura el cliente WebDAV:

```go
func newRepository() (ret *dejavu.Repo, err error) {
    cloudConf, err := buildCloudConf()  // Obtener config
    if err != nil {
        return
    }

    var cloudRepo cloud.Cloud
    
    switch Conf.Sync.Provider {
    case conf.ProviderWebDAV:
        // Crear cliente WebDAV nativo
        webdavClient := gowebdav.NewClient(
            cloudConf.WebDAV.Endpoint,
            cloudConf.WebDAV.Username,
            cloudConf.WebDAV.Password,
        )
        
        // Preparar autenticación Basic Auth
        a := cloudConf.WebDAV.Username + ":" + cloudConf.WebDAV.Password
        auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(a))
        webdavClient.SetHeader("Authorization", auth)
        webdavClient.SetHeader("User-Agent", util.UserAgent)
        
        // Configurar timeout y SSL
        webdavClient.SetTimeout(
            time.Duration(cloudConf.WebDAV.Timeout) * time.Second,
        )
        webdavClient.SetTransport(
            httpclient.NewTransport(cloudConf.WebDAV.SkipTlsVerify),
        )
        
        // Envolver en clase dejavu para sync
        cloudRepo = cloud.NewWebDAV(
            &cloud.BaseCloud{Conf: cloudConf},
            webdavClient,
        )
    }

    // Crear repositorio de sincronización
    ret, err = dejavu.NewRepo(
        util.DataDir,
        util.RepoDir,
        util.HistoryDir,
        util.TempDir,
        Conf.System.ID,
        Conf.System.Name,
        Conf.System.OS,
        Conf.Repo.Key,
        ignoreLines,  // Archivos a no sincronizar
        cloudRepo,     // Cliente WebDAV envuelto
    )
    
    return
}
```

**Librería usada**: `gowebdav` - Cliente WebDAV estándar para Go

---

## 📤 Operaciones de Sincronización

### 1. Download (descarga desde WebDAV)

**Función**: `syncRepoDownload()` (línea 1230)

```go
func syncRepoDownload() (err error) {
    repo, err := newRepository()  // Inicializar cliente
    if err != nil {
        return
    }

    // Indexar datos locales ANTES del sync
    beforeSyncPetals := getPetals()
    _, _, err = indexRepoBeforeCloudSync(repo)

    // OPERACIÓN PRINCIPAL: Descargar desde WebDAV
    syncContext := map[string]interface{}{
        eventbus.CtxPushMsg: eventbus.CtxPushMsgToStatusBar,
    }
    mergeResult, trafficStat, err := repo.SyncDownload(syncContext)
    
    if err != nil {
        // Manejo de errores específicos
        if errors.Is(err, dejavu.ErrCloudStorageSizeExceeded) {
            // Almacenamiento lleno en WebDAV
        }
        return
    }

    // Procesar cambios descargados
    processSyncMergeResult(false, true, mergeResult, 
                          trafficStat, "d", elapsed)
    
    // Actualizar timestamp de último sync
    Conf.Sync.Synced = util.CurrentTimeMillis()
    Conf.Save()
    
    return
}
```

**Estadísticas devueltas** (trafficStat):
- `UploadFileCount` / `DownloadFileCount` - Cantidad de archivos
- `UploadChunkCount` / `DownloadChunkCount` - Fragmentos (para archivos grandes)
- `UploadBytes` / `DownloadBytes` - Datos transferidos

### 2. Upload (sube hacia WebDAV)

**Función**: `syncRepoUpload()` (línea 1304)

Similar a download pero en sentido contrario:
```go
_, _, err = repo.SyncUpload(syncContext)
```

---

## 🔍 Detección de Disponibilidad del Servidor

**Función**: `isProviderOnline()` (línea 724)

Para WebDAV:
```go
case conf.ProviderWebDAV:
    checkURL = Conf.Sync.WebDAV.Endpoint
    skipTlsVerify = Conf.Sync.WebDAV.SkipTlsVerify

// Luego hace un HTTP GET simple
ret = util.IsOnline(checkURL, skipTlsVerify, 7000)  // Timeout 7s
```

---

## 🔄 Sincronización Automática

**Función**: `SyncDataJob()` - Ejecutada periódicamente por el kernel

```go
func SyncDataJob() {
    syncPlanTimeLock.Lock()
    if time.Now().Before(syncPlanTime) {
        syncPlanTimeLock.Unlock()
        return  // Aún no es tiempo
    }
    syncPlanTimeLock.Unlock()

    SyncData(false)  // Sincronizar en background
}
```

**Modos de Sincronización** (Conf.Sync.Mode):
- `1` = Automático cada Conf.Sync.Interval segundos
- `2` = Manual + arranque/salida
- `3` = Completamente manual

---

## 📊 Comparación: SiYuan vs Nuestro Diseño

| Aspecto | SiYuan | Chronex (Propuesto) |
|---------|--------|-------------------|
| **Librería WebDAV** | `gowebdav` | ¿gowebdav o `webdav.js` para Node? |
| **Almacenamiento Configuración** | AES encriptado en JSON | Mismo enfoque |
| **Sync Lib** | `dejavu` (librería propia) | SQLite + triggers + workers |
| **Detección Cambios** | Hashes de archivos | CDC con triggers SQL |
| **Conflictos** | Manual o merge automático | Configurable |
| **Modo Manual** | Sí (2 y 3) | Recomendable incluir |
| **Reintento Automático** | Sí, planifica delay | Implementar |
| **WebSocket** | Sí, para percepción remota | Opcional fase 2 |

---

## 💡 Insights Clave para Chronex

### 1. **WebDAV es un Proveedor Intercambiable**
SiYuan NO trata WebDAV diferente a S3 o su servidor. Es uno de varios backends:
```
ISyncProvider interface:
  ├── SiYuan (servidor oficial)
  ├── S3 (AWS, MinIO, etc)
  ├── WebDAV (Nextcloud, OwnCloud, etc)
  └── Local (filesystem)
```

### 2. **Sincronización Basada en Hashes**
SiYuan usa el patrón **dejavu** que mantiene:
- Hash local del archivo
- Hash remoto del archivo
- Si hashes coinciden = no sincronizar (ahorrar ancho de banda)
- Si difieren = resinc

### 3. **Manejo de Conflictos**
```go
if mergeResult.HasConflicts {
    // Pregunta al usuario o aplica estrategia configurada
    // Siyuan crea documento de conflicto en el workspace
}
```

### 4. **Índices y Reindexación**
Después de cada sync:
1. Recorre archivos sincronizados
2. Reindexiza en SQLite (importante para búsqueda)
3. Actualiza caché de documentos
4. Notifica UI

### 5. **Encriptación de Credenciales**
Las credenciales WebDAV:
- NUNCA se guardan en texto plano
- Se encriptan con AES antes de exportar
- Se exportan como ZIP para seguridad en tránsito
- Se pueden importar en otra máquina

---

## 🚀 Implementación Recomendada para Chronex

### Fase 1: Sincronización Básica WebDAV

```typescript
// chronex/kernel/sync/webdav.go
type WebDAVProvider struct {
    Config *conf.WebDAV
    Client *gowebdav.Client
}

func (w *WebDAVProvider) Sync(ctx context.Context) error {
    // 1. Detectar cambios locales via SQL triggers
    changes := getLocalChanges()
    
    // 2. Descargar cambios remotos
    remoteChanges := w.downloadChanges()
    
    // 3. Resolver conflictos
    resolved := resolveConflicts(changes, remoteChanges)
    
    // 4. Aplicar cambios locales al servidor
    w.uploadChanges(resolved)
    
    // 5. Actualizar sync_state
    updateSyncState(resolved)
    
    return nil
}
```

### Fase 2: Sincronización Automatizada

```typescript
// chronex/kernel/sync/worker.go
type SyncWorker struct {
    Interval time.Duration
    Provider WebDAVProvider
}

func (w *SyncWorker) Start() {
    ticker := time.NewTicker(w.Interval)
    for range ticker.C {
        w.Provider.Sync(context.Background())
    }
}
```

### Fase 3: UI de Configuración (Electron)

```typescript
// chronex/app/src/components/SyncSettings.tsx
export const WebDAVSettings = () => {
    const [config, setConfig] = useState<WebDAVConfig>({
        endpoint: "",
        username: "",
        password: "",
        timeout: 30,
        concurrentReqs: 4,
    });

    const handleTest = async () => {
        // POST /api/sync/webdav/test
        const result = await fetch("/api/sync/webdav/test", {
            method: "POST",
            body: JSON.stringify(config),
        });
    };

    return (
        <div>
            <input placeholder="https://nextcloud.example.com/dav" />
            <input placeholder="usuario" />
            <input type="password" placeholder="contraseña" />
            <button onClick={handleTest}>Probar Conexión</button>
        </div>
    );
};
```

---

## 🔗 Referencias en Código SiYuan

- **Config**: `/kernel/conf/sync.go` (líneas 58-65)
- **Export/Import**: `/kernel/api/sync.go` (líneas 37-228)
- **Sincronización**: `/kernel/model/sync.go` (TODO functions)
- **Repository**: `/kernel/model/repository.go` (línea 2000 `newRepository`)
- **Client WebDAV**: Importa `gowebdav`

---

## ⚠️ Consideraciones de Seguridad

1. ✅ **Credenciales Encriptadas**: Usar AES para export/import
2. ✅ **HTTPS/TLS**: Soportar certificados auto-firmados con flag
3. ✅ **Basic Auth**: Usar encabezado Authorization (mejor que en URL)
4. ✅ **Timeout**: Configurable para servidores lentos
5. ⚠️ **Validación de Endpoint**: Rechazar algunos proveedores problemáticos
6. ⚠️ **Rate Limiting**: Considerar implementar para no sobrecargar servidor

---

## 📝 Conclusión

SiYuan implementa WebDAV **como un proveedor intercambiable** en su sistema de sincronización. La clave está en:

1. **Abstracción**: Una interfaz común para múltiples backends
2. **Seguridad**: Credenciales encriptadas, Basic Auth en headers
3. **Robustez**: Detección de cambios por hash, reintento automático
4. **Flexibilidad**: Modos manual y automático, timeouts configurables

Para Chronex, recomendamos seguir un patrón similar usando SQLite + CDC triggers para detectar cambios, en lugar de mantener hashes separados.
