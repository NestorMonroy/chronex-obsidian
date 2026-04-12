# Joplin: Implementación Detallada del Cliente WebDAV

## 📋 Resumen Ejecutivo

Joplin implementa un cliente WebDAV **completo y robusto** para sincronizar notas con servidores WebDAV:

- ✅ **WebDavApi.ts** (575 líneas) - HTTP client + XML parsing
- ✅ **FileApiDriverWebDav.js** (237 líneas) - Abstracción FileApi para WebDAV
- ✅ **SyncTargetWebDAV.js** - Configuración e inicialización
- ✅ Soporte para múltiples servidores (Nextcloud, Seafile, Nginx, Apache, OwnCloud)
- ✅ Manejo robusto de errores y edge cases
- ✅ Autenticación Basic Auth
- ✅ XML parsing automático
- ✅ Streaming de archivos grandes

---

## 🏗️ Arquitectura del Cliente WebDAV

### Stack de Componentes

```
┌─────────────────────────────────────────────┐
│         SyncTargetWebDAV                    │
│  (Configuración + Inicialización)           │
│  - getConfig(baseUrl, user, pass)           │
│  - checkConfig() para validar                │
│  - createFileApi()                          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         FileApi (Abstracción)               │
│  - stat(path)                               │
│  - list(path)                               │
│  - get(path)                                │
│  - put(path, data)                          │
│  - delete(path)                             │
│  - move(oldPath, newPath)                   │
│  - mkdir(path)                              │
│  - delta(path, context)                     │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  FileApiDriverWebDav (Driver específico)    │
│  - Implementa interfaz FileApi              │
│  - Usa WebDavApi internamente               │
│  - Traduce llamadas a HTTP WebDAV           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         WebDavApi (HTTP Client)             │
│  - exec(method, path, body, headers)        │
│  - execPropFind(path, depth, fields)        │
│  - xmlToJson(xml)                           │
│  - Manejo de errores por servidor           │
│  - Autenticación Basic Auth                 │
│  - Logging de requests/responses            │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         HTTP (fetch/node-fetch)             │
│  - shim.fetch(url, options)                 │
│  - shim.uploadBlob() para PUT/POST          │
│  - shim.fetchBlob() para GET                │
└──────────────────────────────────────────────┘
```

---

## 🔐 WebDavApi: HTTP Client Robusto

### Inicialización

```typescript
// packages/lib/WebDavApi.ts

interface WebDavApiOptions {
    baseUrl(): string;           // URL base del servidor (ej: http://nextcloud.local/remote.php/dav/files/admin/)
    username(): string;          // Usuario
    password(): string;          // Contraseña
    ignoreTlsErrors?(): boolean; // Para certificados inválidos
}

class WebDavApi {
    private logger_: Logger;
    private options_: WebDavApiOptions;
    private lastRequests_: LoggedRequest[];  // Últimas 10 requests para debugging
    private excludeIfNoneMatch: ExcludeIfNoneMatch;  // Flag para compatibilidad con Tomcat
    
    constructor(options: WebDavApiOptions) {
        this.options_ = options;
        this.lastRequests_ = [];
        this.excludeIfNoneMatch = ExcludeIfNoneMatch.Unknown;
    }
}
```

### Autenticación: Basic Auth

```typescript
private authToken(): string | null {
    if (!this.options_.username() || !this.options_.password()) return null;
    
    try {
        // Codificar username:password en Base64
        return base64.encode(`${this.options_.username()}:${this.options_.password()}`);
    } catch (error) {
        throw new Error(`Cannot encode username/password: ${error.message}`);
    }
}

// En cada request HTTP
const authToken = this.authToken();
if (authToken) {
    headers['Authorization'] = `Basic ${authToken}`;
}

// Resultado:
// Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

### Headers HTTP Robustos

```typescript
// Controlar caching
headers['Cache-Control'] = 'no-store';

// Tipo de contenido
if (method === 'PROPFIND') {
    headers['Content-Type'] = 'text/xml';
}
if (method === 'PUT') {
    headers['Content-Type'] = 'application/octet-stream';
}

// User agent para debugging
headers['User-Agent'] = 'Joplin/1.0';

// If-None-Match hack para Seafile/Tomcat
// Algunos servidores rechazan If-None-Match en PROPFIND
if (['GET', 'HEAD'].indexOf(method) < 0 && excludeIfNoneMatch !== Yes) {
    // Usar un eTag inválido para bypass de Seafile
    headers['If-None-Match'] = `JoplinIgnore-${Math.random() * 100000}`;
}
```

### Content-Length para Uploads

```typescript
// Para PUT/POST desde archivo
if (options.source === 'file' && (method === 'PUT' || method === 'POST')) {
    if (fetchOptions.path) {
        const fileStat = await shim.fsDriver().stat(fetchOptions.path);
        if (fileStat) {
            // Agregar Content-Length para uploads
            fetchOptions.headers['Content-Length'] = `${fileStat.size}`;
        }
    }
    response = await shim.uploadBlob(url, fetchOptions);
}
```

---

## 📡 Métodos WebDAV: Implementación Detallada

### 1. PROPFIND - Listar y Obtener Metadata

#### Método Principal

```typescript
public async execPropFind(
    path: string,
    depth: number,  // 0 = solo este item, 1 = este + hijos
    fields: string[] | null = null,
    options: ExecOptions | null = null
): Promise<JsonValue> {
    if (fields === null) fields = ['d:getlastmodified'];
    
    // Construir XML body con propiedades solicitadas
    let fieldsXml = '';
    for (let i = 0; i < fields.length; i++) {
        fieldsXml += `<${fields[i]}/>`;
    }
    
    const body = `<?xml version="1.0" encoding="UTF-8"?>
        <d:propfind xmlns:d="DAV:">
            <d:prop xmlns:oc="http://owncloud.org/ns">
                ${fieldsXml}
            </d:prop>
        </d:propfind>`;
    
    // Enviar request PROPFIND
    return this.exec('PROPFIND', path, body, { Depth: depth }, options);
}
```

#### Uso en Joplin

```typescript
// file-api-driver-webdav.js

// Obtener metadata de un archivo
async stat(path) {
    const result = await this.api().execPropFind(
        path,
        0,  // Depth: solo este item
        ['d:getlastmodified', 'd:resourcetype']
    );
    
    const resource = this.api().objectFromJson(
        result,
        ['d:multistatus', 'd:response', 0]
    );
    
    return this.statFromResource_(resource, path);
}

// Listar directorio
async list(path) {
    // Agregar trailing slash para directorios (RFC requiere esto)
    const result = await this.api().execPropFind(
        !path.endsWith('/') ? `${path}/` : path,
        1,  // Depth: este + hijos
        ['d:getlastmodified', 'd:resourcetype']
    );
    
    const resources = this.api().arrayFromJson(
        result,
        ['d:multistatus', 'd:response']
    );
    
    return {
        items: this.statsFromResources_(resources),
        hasMore: false,
        context: null,
    };
}
```

#### Parseo de Respuesta XML

```typescript
// XML Response from server:
<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/webdav/documento.pdf</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>documento.pdf</d:displayname>
        <d:getcontentlength>4143665</d:getcontentlength>
        <d:getlastmodified>Tue, 19 Dec 2017 22:02:36 GMT</d:getlastmodified>
        <d:getetag>"048d7be4437ff7deeae94db50ff3e209"</d:getetag>
        <d:resourcetype></d:resourcetype>  <!-- vacío = archivo -->
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/remote.php/webdav/directorio/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>
          <d:collection/>  <!-- == directorio -->
        </d:resourcetype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>

// Parseado a JavaScript:
{
  'd:multistatus': {
    'd:response': [
      {
        'd:href': '/remote.php/webdav/documento.pdf',
        'd:propstat': {
          'd:prop': {
            'd:displayname': 'documento.pdf',
            'd:getcontentlength': '4143665',
            'd:getlastmodified': 'Tue, 19 Dec 2017 22:02:36 GMT',
            'd:resourcetype': [{}]  // vacío = archivo
          },
          'd:status': 'HTTP/1.1 200 OK'
        }
      },
      {
        'd:href': '/remote.php/webdav/directorio/',
        'd:propstat': {
          'd:prop': {
            'd:resourcetype': {
              'd:collection': [{}]  // == directorio
            }
          },
          'd:status': 'HTTP/1.1 200 OK'
        }
      }
    ]
  }
}
```

#### Extractores de JSON/XML

```typescript
// Extraer string de JSON
public stringFromJson(json: JsonValue, keys: (string | number)[]): string | null {
    return this.valueFromJson(json, keys, 'string');
}

// Extraer array de JSON
public arrayFromJson(json: JsonValue, keys: (string | number)[]): JsonValue[] | null {
    return this.valueFromJson(json, keys, 'array');
}

// Extraer objeto de JSON
public objectFromJson(json: JsonValue, keys: (string | number)[]): JsonValue {
    return this.valueFromJson(json, keys, 'object');
}

// Extraer propiedad WebDAV específica
public resourcePropByName(resource: any, outputType: 'string' | 'array', propName: string): any {
    const propStats = resource['d:propstat'];
    let output = null;
    
    for (let i = 0; i < propStats.length; i++) {
        const props = propStats[i]['d:prop'];
        if (!Array.isArray(props)) continue;
        
        const prop = props[0];
        if (Array.isArray(prop[propName])) {
            output = prop[propName];
            break;
        }
    }
    
    if (outputType === 'string') {
        output = output[0];
        if (typeof output === 'object' && '_' in output) {
            output = output['_'];
        }
        return typeof output === 'string' ? output : null;
    }
    
    if (outputType === 'array') {
        return output;
    }
}
```

### 2. PUT - Subir Archivo

```typescript
async put(path, content, options = null) {
    return await this.api().exec(
        'PUT',
        path,
        content,  // contenido del archivo (Buffer o string)
        null,
        options
    );
}

// En exec():
if (options.source === 'file' && (method === 'PUT' || method === 'POST')) {
    // Subir desde archivo local
    response = await shim.uploadBlob(url, fetchOptions);
} else {
    // Subir contenido en memoria
    if (typeof body === 'string') {
        fetchOptions.headers['Content-Length'] = `${shim.stringByteLength(body)}`;
    }
    response = await this.fetchWithIfNoneMatchTest(url, fetchOptions);
}

// HTTP Request:
PUT /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.local
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
Content-Type: application/octet-stream
Content-Length: 1024
Cache-Control: no-store

[contenido binario del archivo]

// HTTP Response:
HTTP/1.1 201 Created
ETag: "048d7be4437ff7deeae94db50ff3e209"
```

### 3. GET - Descargar Archivo

```typescript
async get(path, options) {
    if (!options) options = {};
    if (!options.responseFormat) options.responseFormat = 'text';
    
    try {
        const response = await this.api().exec(
            'GET',
            path,
            null,
            null,
            options
        );
        
        // Workaround para Microsoft IIS
        if (response === 'The specified file doesn\'t exist.') {
            throw new JoplinError(response, 404);
        }
        
        return response;
    } catch (error) {
        if (error.code !== 404) throw error;
        return null;  // Archivo no existe
    }
}

// En exec():
if (options.target === 'string') {
    // Descargar como string/buffer
    response = await this.fetchWithIfNoneMatchTest(url, fetchOptions);
} else {
    // Descargar como blob/file
    response = await shim.fetchBlob(url, fetchOptions);
}

// HTTP Request:
GET /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.local
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
Cache-Control: no-store

// HTTP Response:
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 1024
ETag: "048d7be4437ff7deeae94db50ff3e209"

[contenido binario del archivo]
```

### 4. DELETE - Eliminar

```typescript
async delete(path) {
    try {
        await this.api().exec('DELETE', path);
    } catch (error) {
        if (error.code !== 404) throw error;
        // Ignorar si archivo no existe
    }
}

// HTTP Request:
DELETE /remote.php/webdav/documento.pdf HTTP/1.1
Host: nextcloud.local
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=

// HTTP Response:
HTTP/1.1 204 No Content
```

### 5. MKCOL - Crear Directorio

```typescript
async mkdir(path) {
    try {
        // RFC requiere trailing slash
        if (!path.endsWith('/')) path = `${path}/`;
        
        await this.api().exec('MKCOL', path);
    } catch (error) {
        // 405 = directorioxa existe
        if (error.code === 405) return;
        
        // 409 = padre no existe (o directorio existe en IIS)
        if (error.code === 409) {
            const stat = await this.stat(path);
            if (stat) return;  // Existe
        }
        
        throw error;
    }
}

// HTTP Request:
MKCOL /remote.php/webdav/carpetanueva/ HTTP/1.1
Host: nextcloud.local
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=

// HTTP Response:
HTTP/1.1 201 Created
```

### 6. MOVE - Renombrar/Mover

```typescript
async move(oldPath, newPath) {
    await this.api().exec(
        'MOVE',
        oldPath,
        null,
        {
            'Destination': `${this.api().baseUrl()}/${newPath}`,
            'Overwrite': 'T',  // T = sobrescribir, F = no sobrescribir
        }
    );
}

// HTTP Request:
MOVE /remote.php/webdav/viejo.pdf HTTP/1.1
Host: nextcloud.local
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
Destination: /remote.php/webdav/nuevo.pdf
Overwrite: T

// HTTP Response:
HTTP/1.1 201 Created
```

---

## 🚨 Manejo Robusto de Errores por Servidor

### Nginx Hack - 404 Embebido en 200

```typescript
private handleNginxHack_(jsonResponse: JsonValue, newErrorHandler) {
    // PROBLEMA: Nginx retorna HTTP 200 pero con 404 en la respuesta XML
    
    // Respuesta Nginx:
    // HTTP/1.1 200 OK
    // <?xml version="1.0" encoding="utf-8" ?>
    // <D:multistatus xmlns:D="DAV:">
    //   <D:response>
    //     <D:href>/notes/archivo.md</D:href>
    //     <D:propstat>
    //       <D:prop/>
    //       <D:status>HTTP/1.1 404 Not Found</D:status>
    //     </D:propstat>
    //   </D:response>
    // </D:multistatus>
    
    // SOLUCIÓN: Detectar 404 en la respuesta XML
    const responseArray = this.arrayFromJson(jsonResponse, ['d:multistatus', 'd:response']);
    
    if (responseArray && responseArray.length === 1) {
        const propStats = this.arrayFromJson(
            jsonResponse,
            ['d:multistatus', 'd:response', 0, 'd:propstat']
        );
        
        if (!propStats || !propStats.length) return;
        
        let count404 = 0;
        for (let i = 0; i < propStats.length; i++) {
            const status = this.arrayFromJson(
                jsonResponse,
                ['d:multistatus', 'd:response', 0, 'd:propstat', i, 'd:status']
            );
            
            if (status && status.length && (status[0] as string).indexOf('404') >= 0) {
                count404++;
            }
        }
        
        // Si TODOS los propstats son 404, entonces el archivo realmente no existe
        if (count404 === propStats.length) {
            throw newErrorHandler('Not found', 404);
        }
    }
}
```

### Seafile/Tomcat - If-None-Match Header

```typescript
// PROBLEMA: Algunos servidores (Seafile, Tomcat) rechazan If-None-Match header en PROPFIND
// Respuesta: HTTP 412 Precondition Failed

// SOLUCIÓN: Detección automática y workaround
private async fetchWithIfNoneMatchTest(url: string, fetchOptions: FetchOptions) {
    let response: Response = null;
    
    // Solo detectar una vez
    if (['GET', 'HEAD'].indexOf(fetchOptions.method) < 0 && 
        this.excludeIfNoneMatch === ExcludeIfNoneMatch.Unknown) {
        
        // Intentar con If-None-Match header
        response = await shim.fetch(url, fetchOptions);
        
        if (response.ok) {
            // Funciona con If-None-Match
            this.excludeIfNoneMatch = ExcludeIfNoneMatch.No;
        } else if (response.status === 400) {
            // Rechazó If-None-Match, reintentar sin
            const fetchOptionsAlt = { ...fetchOptions };
            fetchOptionsAlt.headers = { ...fetchOptions.headers };
            delete fetchOptionsAlt.headers['If-None-Match'];
            
            const responseAlt = await shim.fetch(url, fetchOptionsAlt);
            if (responseAlt.ok) {
                // Funcionó sin If-None-Match
                this.excludeIfNoneMatch = ExcludeIfNoneMatch.Yes;
                return responseAlt;
            } else if (response.status === 400) {
                this.excludeIfNoneMatch = ExcludeIfNoneMatch.No;
            }
        }
    } else {
        response = await shim.fetch(url, fetchOptions);
    }
    
    return response;
}
```

### Microsoft IIS - Respuesta 200 con "No existe"

```typescript
// PROBLEMA: IIS retorna HTTP 200 en lugar de 404 para archivos inexistentes
// Mensaje: "The specified file doesn't exist."

async get(path, options) {
    const response = await this.api().exec('GET', path, null, null, options);
    
    // Workaround específico para IIS
    if (response === 'The specified file doesn\'t exist.') {
        throw new JoplinError(response, 404);
    }
    
    return response;
}
```

### SeaFile - Missing Properties

```typescript
// PROBLEMA: SeaFile retorna 404 para propiedades faltantes en PROPFIND
// Ejemplo: getlastmodified no existe para directorios

// SOLUCIÓN: No asumir que getlastmodified siempre existe
const lastModifiedString = null;

try {
    lastModifiedString = this.api().resourcePropByName(
        resource,
        'string',
        'd:getlastmodified'
    );
} catch (error) {
    if (error.code === 'stringNotFound') {
        // OK - la lógica maneja este caso
    } else {
        throw error;
    }
}

// Si no hay lastModified, usar hora actual para directorios
const lastModifiedDate = lastModifiedString ? 
    new Date(lastModifiedString) : 
    new Date();

if (isNaN(lastModifiedDate.getTime())) {
    throw new Error(`Invalid date: ${lastModifiedString}`);
}
```

### Errores HTTP Estándar

```typescript
// En exec(), después de recibir respuesta no-ok

if (!response.ok) {
    let json = null;
    try {
        json = await loadResponseJson();
    } catch (error) {
        // Ignorar errores de parsing
    }
    
    // Si el servidor devuelve error XML específico
    if (json && json['d:error']) {
        const code = json['d:error']['s:exception'] ? 
            json['d:error']['s:exception'].join(' ') : 
            response.status;
        const message = json['d:error']['s:message'] ? 
            json['d:error']['s:message'].join('\n') : 
            'Unknown error';
        throw new JoplinError(`${message} (Exception ${code})`, response.status);
    }
    
    // Errores de autenticación
    let message = 'Unknown error';
    if (response.status === 401 || response.status === 403) {
        if (!authToken) {
            message = 'Access denied: Please re-enter your password and/or username';
        } else {
            message = 'Access denied: Please check your username and password';
        }
    }
    
    throw new JoplinError(message, response.status);
}
```

---

## 🔄 Flujo Completo de Sincronización

### Inicialización

```typescript
// SyncTargetWebDAV.js
class SyncTargetWebDAV extends BaseSyncTarget {
    static id() { return 6; }
    static label() { return _('WebDAV'); }
    
    async initFileApi() {
        const apiOptions = {
            baseUrl: () => Setting.value('sync.6.path'),
            username: () => Setting.value('sync.6.username'),
            password: () => Setting.value('sync.6.password'),
            ignoreTlsErrors: () => Setting.value('net.ignoreTlsErrors'),
        };
        
        const api = new WebDavApi(apiOptions);
        const driver = new FileApiDriverWebDav(api);
        const fileApi = new FileApi('', driver);
        
        return fileApi;
    }
    
    async initSynchronizer() {
        return new Synchronizer(
            this.db(),
            await this.fileApi(),
            Setting.value('appType')
        );
    }
}
```

### Sync Upload (Enviar cambios locales)

```typescript
// Synchronizer.ts

// FASE: UPLOAD_REMOTE
// Se sube cada nota local que cambió

for (let i = 0; i < locals.length; i++) {
    let local = locals[i];  // Nota local
    const path = BaseItem.systemPath(local);  // Ruta en remoto
    
    // 1. Obtener remote item
    const remote = await this.apiCall('stat', path);
    
    if (!remote) {
        // No existe en remoto
        if (!local.sync_time) {
            action = SyncAction.CreateRemote;  // Crear en remoto
        } else {
            action = SyncAction.ItemConflict;  // Conflicto
        }
    } else {
        // Ya existe en remoto
        const remoteContent = await this.apiCall('get', path);  // Bajar contenido
        
        if (remoteContent.updated_time > local.sync_time) {
            action = SyncAction.ItemConflict;  // Conflicto (ambos cambiaron)
        } else {
            action = SyncAction.UpdateRemote;  // Actualizar remoto
        }
    }
    
    // 2. Si es CreateRemote o UpdateRemote: subir a remoto
    if (action === SyncAction.CreateRemote || action === SyncAction.UpdateRemote) {
        await itemUploader.serializeAndUploadItem(ItemClass, path, local);
        // Internamente:
        // - Serializar item (nota) a contenido
        // - this.apiCall('put', path, content)
        // - FileApi.put() -> FileApiDriver.put() -> WebDavApi.exec('PUT', ...)
    }
}
```

### Sync Download (Recibir cambios remotos)

```typescript
// Synchronizer.ts

// FASE: DELTA
// Se reciben cambios remotos

const listResult = await this.apiCall('delta', '', { context: context });
// Internamente:
// - FileApi.delta() -> FileApiDriver.delta()
// - FileApiDriver.delta() llama basicDelta()
// - basicDelta() llama list() múltiples veces
// - FileApiDriver.list() -> WebDavApi.execPropFind()

for (const remote of listResult.items) {
    const local = locals.find(l => l.id === BaseItem.pathToId(remote.path));
    
    if (!local) {
        action = SyncAction.CreateLocal;  // Crear nota localmente
        const content = await this.apiCall('get', remote.path);
        // Internamente: FileApiDriver.get() -> WebDavApi.exec('GET', ...)
        
        const item = await BaseItem.unserialize(content);
        // Guardar en base de datos local
    } else if (remote.jop_updated_time > local.updated_time) {
        action = SyncAction.UpdateLocal;  // Actualizar nota localmente
        // Similar a CreateLocal
    }
}
```

---

## 📊 Tabla de Métodos HTTP WebDAV en Joplin

| Método | Propósito | Headers | Respuesta |
|--------|-----------|---------|-----------|
| **PROPFIND** | Listar + metadata | Depth | 207 Multi-Status (XML) |
| **GET** | Descargar | Range (opcional) | 200 OK + contenido |
| **PUT** | Subir | Content-Length | 201 Created o 204 |
| **DELETE** | Eliminar | — | 204 No Content |
| **MOVE** | Renombrar/mover | Destination, Overwrite | 201 Created o 204 |
| **MKCOL** | Crear directorio | — | 201 Created o 405 |

---

## ✅ Conclusión

**Joplin's WebDAV client es**:
- ✅ Robusto (maneja múltiples servidores)
- ✅ Eficiente (streaming, sin cargar todo en memoria)
- ✅ Compatible (Nextcloud, Seafile, Nginx, Apache)
- ✅ Bien debugged (logging de requests)
- ✅ Completo (todos los métodos WebDAV)

**Para Chronex**: Este es un modelo excelente a seguir para implementar WebDAV.
