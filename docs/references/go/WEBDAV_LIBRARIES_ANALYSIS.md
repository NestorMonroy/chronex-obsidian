# WebDAV Libraries Analysis: gowebdav vs emersion/go-webdav

## 📋 Resumen Ejecutivo

SiYuan utiliza **DOS librerías WebDAV diferentes** para propósitos distintos:

1. **studio-b12/gowebdav** (v0.12.0)
   - ✅ Cliente WebDAV (file transfer)
   - ✅ Usado para sincronización de datos
   - ✅ Operaciones CRUD en servidor remoto
   - ✅ Autenticación básica y digest

2. **emersion/go-webdav** (v0.7.0)
   - ✅ Servidor WebDAV
   - ✅ Protocolo CalDAV (calendarios)
   - ✅ Protocolo CardDAV (contactos)
   - ✅ HTTP handler pattern

**Decisión arquitectónica**: Cada librería es especializada para su caso de uso.

---

## 🔍 Análisis Detallado

### 1. studio-b12/gowebdav - Cliente WebDAV

#### Propósito
```
SiYuan necesita SUBIR y DESCARGAR archivos desde:
- Nextcloud
- OwnCloud
- Servidores WebDAV genéricos
- MinIO vía WebDAV proxy

Solución: gowebdav (cliente puro)
```

#### Arquitectura

```go
// Repository (SiYuan kernel)
// archivo: /kernel/model/repository.go

webdavClient := gowebdav.NewClient(
    cloudConf.WebDAV.Endpoint,    // URL: https://nextcloud.com/dav
    cloudConf.WebDAV.Username,    // usuario
    cloudConf.WebDAV.Password,    // contraseña
)

// Configuración adicional
webdavClient.SetHeader("Authorization", basicAuth)
webdavClient.SetHeader("User-Agent", util.UserAgent)
webdavClient.SetTimeout(time.Duration(timeout) * time.Second)
webdavClient.SetTransport(httpclient.NewTransport(skipTLS))

// Envolver en abstracción DejaVu
cloudRepo = cloud.NewWebDAV(&cloud.BaseCloud{Conf: cloudConf}, webdavClient)
```

#### API Disponible en gowebdav

```go
// Funciones principales:

// Read operations
client.Read(path string) ([]byte, error)
client.ReadStream(path string) (io.ReadCloser, error)
client.ReadStreamRange(path, start, end string) (io.ReadCloser, error)
client.ReadDir(path string) ([]os.FileInfo, error)

// Write operations
client.WriteStream(path string, content io.Reader, overwrite bool) error
client.WriteStreamWithLength(path string, content io.Reader, length int64) error
client.Write(path string, data []byte, overwrite bool) error

// File operations
client.Mkdir(path string, _ os.FileMode) error
client.Remove(path string) error
client.Rename(oldPath, newPath string, overwrite bool) error
client.Copy(oldPath, newPath string, overwrite bool) error
client.Move(oldPath, newPath string, overwrite bool) error

// Metadata
client.Stat(path string) (os.FileInfo, error)

// Utils
client.Connect() error
client.SetTransport(transport http.RoundTripper)
client.SetTimeout(timeout time.Duration)
client.SetHeader(key, value string)
```

#### Flujo de Sincronización (SiYuan)

```
┌─────────────────────────────────────────┐
│ Usuario: "Sync to WebDAV"               │
└──────────────────────┬──────────────────┘
                       ▼
┌─────────────────────────────────────────┐
│ SyncUpload() {                          │
│   1. Escanear archivos locales          │
│   2. repo.Index() crea snapshot         │
│   3. Detectar chunks nuevos             │
│   4. Para cada chunk:                   │
│      client.ReadDir(remote_path)        │
│      if exists: compare hash            │
│      if !exists: client.Write(chunk)    │
│   5. Upload metadata snapshot           │
│      client.Write(index.json)           │
│ }                                       │
└──────────────────────┬──────────────────┘
                       ▼
┌─────────────────────────────────────────┐
│ WebDAV Server (Nextcloud/OwnCloud)      │
│ └─ chunks/ almacenados                  │
│ └─ indexes/ metadatos                   │
│ └─ refs/latest actualizado              │
└─────────────────────────────────────────┘
```

#### Seguridad de Credenciales

```go
// Basic Auth (Base64)
a := username + ":" + password
auth := "Basic " + base64.StdEncoding.EncodeToString([]byte(a))
webdavClient.SetHeader("Authorization", auth)

// Seguridad:
✅ HTTPS obligatorio para producción
✅ Header Authorization vs URL
✅ Timeout configurable
✅ TLS customizable (skip para self-signed)
```

#### Implementación Interna (gowebdav)

```
gowebdav/
├── client.go           ← Estructura Client
├── requests.go         ← Métodos HTTP (PROPFIND, PUT, GET, DELETE, MOVE, COPY)
├── auth.go            ← Autenticación (Basic, Digest)
├── utils.go           ← Utilidades
└── netrc.go           ← Soporte .netrc
```

**Métodos HTTP utilizados**:
```
GET:      client.Read()
HEAD:     client.Stat()
MKCOL:    client.Mkdir()
PUT:      client.Write()
DELETE:   client.Remove()
MOVE:     client.Move()
COPY:     client.Copy()
PROPFIND: client.Stat()
```

---

### 2. emersion/go-webdav - Servidor WebDAV

#### Propósito
```
SiYuan también EXPONE un servidor WebDAV
para que usuarios accedan a:
- Calendarios (CalDAV)
- Contactos (CardDAV)
- Archivos generales (WebDAV)

Solución: emersion/go-webdav (servidor)
```

#### Arquitectura

```
emersion/go-webdav/
├── webdav/     ← Protocolo WebDAV genérico
│   ├── server.go      ← HTTP handler
│   ├── fs.go          ← FileSystem interface
│   └── ...
├── caldav/     ← Protocolo CalDAV (RFC 4791)
│   ├── server.go      ← CalDAV server handler
│   ├── backend.go     ← Backend interface
│   └── client.go      ← CalDAV client
└── carddav/    ← Protocolo CardDAV (RFC 6352)
    ├── server.go      ← CardDAV server handler
    ├── backend.go     ← Backend interface
    └── client.go      ← CardDAV client
```

#### Uso en SiYuan

**Archivos relevantes**:
```
/kernel/model/
├── dav.go     (77 líneas)   ← Funciones comunes
├── caldav.go  (720 líneas)  ← Implementación CalDAV
└── carddav.go (823 líneas)  ← Implementación CardDAV
```

**Ejemplo de uso (caldav.go)**:
```go
import (
    "github.com/emersion/go-webdav/caldav"
)

// Servidor CalDAV
// Expone calendarios a clientes como Apple Calendar, Evolution, etc.

// Backend implementation
type CalendarBackend struct {
    // Implementa caldav.Backend interface
}

func (b *CalendarBackend) Calendar(ctx context.Context, path string) (*caldav.Calendar, error) {
    // Retorna calendario desde storage local
}

// Registrar en HTTP server
handler := caldav.NewHandler(backend)
http.Handle("/calendars/", handler)
```

#### Diferencia: Cliente vs Servidor

```
gowebdav (CLIENT):
┌────────────────────────────────┐
│ SiYuan (cliente)               │
│ ├─ Lee/escribe archivos        │
│ └─ En servidor remoto          │
└──────────────┬─────────────────┘
               │ HTTP PROPFIND, PUT, GET
               ▼
        Nextcloud WebDAV

emersion/go-webdav (SERVER):
┌────────────────────────────────┐
│ SiYuan (servidor)              │
│ ├─ Expone calendarios          │
│ ├─ Expone contactos            │
│ └─ A clientes remotos          │
└──────────────▲─────────────────┘
               │ HTTP PROPFIND, REPORT
               │
        Apple Calendar
        Evolution
        Thunderbird
```

---

## 🔄 Flujo Completo en SiYuan

### Scenario: Sincronización Multi-Dispositivo

```
┌─────────────────────────────────────────────────────────┐
│ DISPOSITIVO A (Laptop)                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. Usuario edita documentos                             │
│    └─ Cambios en SQLite local                           │
│                                                          │
│ 2. SyncUpload() {                                       │
│      a) repo.Index() → crea snapshot                    │
│      b) Detecta chunks nuevos                           │
│      c) Para cada chunk:                                │
│         gowebdav.client.Write(                          │
│            "/chunks/ab/cd123...",                       │
│            encryptedData,                               │
│            overwrite=false                              │
│         )                                               │
│      d) gowebdav.client.Write(                          │
│            "/indexes/snapshot.json",                    │
│            metadata                                     │
│         )                                               │
│    }                                                     │
│                                                          │
│ 3. gowebdav client realiza:                             │
│    └─ HTTP PUT /dav/Chronex/chunks/...                 │
│    └─ Header: Authorization: Basic base64(user:pass)   │
│                                                          │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ HTTPS + WebDAV
                      ▼
┌─────────────────────────────────────────────────────────┐
│ NEXTCLOUD SERVER                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ /dav/files/user/Chronex/                                │
│ ├── chunks/                                             │
│ │   ├── ab/cd123...  (nuevo chunk)                      │
│ │   └── ef/gh456...  (existing)                         │
│ ├── indexes/                                            │
│ │   ├── a1b2c3.json  (snapshot nuevo)                   │
│ │   └── z9y8x7.json  (snapshot anterior)                │
│ └── refs/                                               │
│     └── latest → a1b2c3.json                            │
│                                                          │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ HTTPS + WebDAV
                      ▼
┌─────────────────────────────────────────────────────────┐
│ DISPOSITIVO B (Tablet)                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. SyncDownload() {                                     │
│      a) gowebdav.client.Read("/refs/latest")           │
│         → obtiene: "a1b2c3.json"                        │
│                                                          │
│      b) gowebdav.client.Read("/indexes/a1b2c3.json")   │
│         → obtiene metadatos del snapshot                │
│                                                          │
│      c) Para cada chunk en metadatos:                   │
│         - ¿Ya lo tengo localmente?                      │
│         - Si no: gowebdav.client.Read(                  │
│              "/chunks/ab/cd123..."                      │
│           )                                              │
│                                                          │
│      d) repo.Checkout() → reconstruye archivos          │
│    }                                                     │
│                                                          │
│ 2. Archivos actualizados en SQLite local               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación: Dos Librerías WebDAV

```
┌─────────────────────┬──────────────────┬──────────────────┐
│ Aspecto             │ gowebdav         │ emersion/go-webdav
├─────────────────────┼──────────────────┼──────────────────┤
│ Tipo                │ Cliente          │ Servidor         │
│ Propósito           │ Sync datos       │ Calendario/Chat  │
│ RFC Soportados      │ WebDAV (4918)    │ WebDAV + CalDAV  │
│ Operaciones         │ PUT, GET, DELETE │ PROPFIND, REPORT │
│ Autenticación       │ Basic, Digest    │ Via HTTP         │
│ Overhead            │ Bajo (~1.5MB)    │ Alto (~8MB)      │
│ Complejidad         │ Baja             │ Alta             │
│ Casos de uso        │ File sync        │ Calendar sync    │
│ Usado en SiYuan     │ Sí (data sync)   │ Sí (CalDAV srv)  │
└─────────────────────┴──────────────────┴──────────────────┘
```

---

## 🔐 Seguridad: Implementación WebDAV en SiYuan

### Flujo de Encriptación

```
┌─────────────────────────────────────┐
│ Usuario edita: "Documento secreto"  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ AES-256-CTR Encrypt                 │
│ masterKey = Scrypt(password, salt)  │
│ ciphertext = AES(plaintext, key)    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ gowebdav.client.Write(              │
│   "/chunks/encrypted.bin",          │
│   ciphertext,                       │
│   overwrite                         │
│ )                                   │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ HTTP PUT + HTTPS                    │
│ Authorization: Basic base64(...)    │
│ Content-Type: application/octet     │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ Nextcloud almacena en disco         │
│ /data/user/Chronex/chunks/...       │
│                                     │
│ Propiedades:                        │
│ ✅ Nextcloud NO ve plaintext        │
│ ✅ Usuario controla password        │
│ ✅ Transporte seguro (HTTPS)        │
│ ✅ Hash verificable en integridad   │
└─────────────────────────────────────┘
```

### Configuración de Conexión WebDAV

```go
// Archivo: kernel/model/repository.go

webdavClient := gowebdav.NewClient(
    "https://nextcloud.example.com/dav",  // URL HTTPS obligatorio
    "usuario",
    "password"
)

// 1. Autenticación
auth := "Basic " + base64.StdEncoding.EncodeToString(
    []byte("usuario:password"),
)
webdavClient.SetHeader("Authorization", auth)

// 2. User Agent (identificación)
webdavClient.SetHeader("User-Agent", "SiYuan/3.6.3")

// 3. Timeout (evitar cuelgues)
webdavClient.SetTimeout(30 * time.Second)

// 4. TLS personalizado (soportar self-signed)
transport := httpclient.NewTransport(skipTLS)
webdavClient.SetTransport(transport)

// 5. Conectar y probar
err := webdavClient.Connect()
```

---

## 💡 Decisiones de Diseño

### ¿Por qué DOS librerías?

```
SiYuan tiene DOS requisitos diferentes:

1. SINCRONIZACIÓN DE DATOS (Data Sync)
   Necesita: Cliente WebDAV
   Usa: gowebdav (studio-b12)
   Razón: Ligero, eficiente, solo file operations
   
2. CALENDARIO Y CONTACTOS (CalDAV/CardDAV)
   Necesita: Servidor WebDAV especializado
   Usa: emersion/go-webdav
   Razón: Implementa RFC 4791 (CalDAV) y RFC 6352 (CardDAV)

Separación de responsabilidades:
├─ Sync layer: gowebdav (cliente ligero)
└─ Services layer: emersion/go-webdav (servidor completo)
```

### Comparación: gowebdav vs emersion

**gowebdav (Client)**:
```
Ventajas:
✅ Ligero y eficiente
✅ Bajo overhead de memoria
✅ API simple (Read, Write, Delete)
✅ Perfecto para sincronización

Desventajas:
❌ Solo cliente
❌ No es servidor
❌ CalDAV/CardDAV limitados
```

**emersion/go-webdav (Server)**:
```
Ventajas:
✅ RFC completo (CalDAV, CardDAV)
✅ Servidor HTTP integrado
✅ Backend customizable
✅ Soporte estándares

Desventajas:
❌ Mayor overhead
❌ Más complejo
❌ No es cliente puro
```

---

## 🚀 Implementación para Chronex

### Recomendación: Usar gowebdav

```go
// Para sincronización simple, usar gowebdav:

import "github.com/studio-b12/gowebdav"

type WebDAVProvider struct {
    client *gowebdav.Client
}

func (w *WebDAVProvider) UploadChunk(
    chunkID string,
    data []byte,
) error {
    path := "/Chronex/chunks/" + chunkID[:2] + "/" + chunkID
    return w.client.Write(path, data, false)
}

func (w *WebDAVProvider) DownloadChunk(
    chunkID string,
) ([]byte, error) {
    path := "/Chronex/chunks/" + chunkID[:2] + "/" + chunkID
    return w.client.Read(path)
}

func (w *WebDAVProvider) UploadSnapshot(
    snapshot *Snapshot,
) error {
    data, _ := json.Marshal(snapshot)
    path := "/Chronex/indexes/" + snapshot.ID + ".json"
    return w.client.Write(path, data, true)
}

func (w *WebDAVProvider) DownloadSnapshot(
    snapshotID string,
) (*Snapshot, error) {
    path := "/Chronex/indexes/" + snapshotID + ".json"
    data, err := w.client.Read(path)
    if err != nil {
        return nil, err
    }
    
    var snapshot Snapshot
    json.Unmarshal(data, &snapshot)
    return &snapshot, nil
}
```

### NO necesitamos emersion/go-webdav para Chronex

```
❌ No exponemos servidor CalDAV
❌ No sincronizamos calendarios
❌ No sincronizamos contactos
❌ Solo sincronizamos archivos (CRUD)

Por lo tanto: gowebdav es suficiente
```

---

## 📚 Referencias

- [studio-b12/gowebdav - Client Library](https://github.com/studio-b12/gowebdav)
- [emersion/go-webdav - Server & CalDAV/CardDAV](https://github.com/emersion/go-webdav)
- [WebDAV RFC 4918](https://tools.ietf.org/html/rfc4918)
- [CalDAV RFC 4791](https://tools.ietf.org/html/rfc4791)
- [CardDAV RFC 6352](https://tools.ietf.org/html/rfc6352)

---

## ✅ Conclusión

**SiYuan utiliza dos librerías WebDAV de manera inteligente**:

1. **gowebdav** para sincronización (cliente puro)
   - Eficiente, ligero
   - Propósito: Transferir archivos
   - Integración con DejaVu

2. **emersion/go-webdav** para servicios (servidor)
   - Completo, RFC compliant
   - Propósito: CalDAV y CardDAV
   - Acceso a calendarios y contactos

**Para Chronex**:
- ✅ Usar solo **gowebdav** para sincronización
- ❌ No necesitamos emersion (sin CalDAV/CardDAV)
- ✅ Encriptación AES-256 transparente
- ✅ Multi-dispositivo automático
- ✅ Compatible con Nextcloud, OwnCloud, etc.
