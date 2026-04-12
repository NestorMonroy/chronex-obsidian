# Uploads Chunked: Estrategias Diferentes por Proveedor

## 📋 Resumen

Cada proveedor tiene su **propio protocolo de chunking** para uploads grandes. No existe un estándar único. Chronex necesita soportar múltiples estrategias.

```
┌──────────────────────────────────────────────────────────────────┐
│                  UPLOAD CHUNKED EN DIFERENTES PROVEEDORES       │
├──────────────┬─────────────────────┬─────────────────────────────┤
│ Proveedor    │ Protocolo           │ Chunks Paralelos             │
├──────────────┼─────────────────────┼─────────────────────────────┤
│ Nextcloud    │ WebDAV MOVE         │ Sí (TUS protocol)           │
│ Google Drive │ Resumable Upload    │ Sí (Content-Range header)   │
│ Dropbox      │ Upload Session      │ Sí (UploadSessionAppendV2)  │
│ S3           │ Multipart Upload    │ Sí (AWS S3 API)             │
│ Local        │ Filesystem directo  │ N/A (local, no chunking)    │
└──────────────┴─────────────────────┴─────────────────────────────┘
```

---

## 1. Nextcloud (WebDAV)

### Protocolo: TUS (Tusd Upload Server)

```
Paso 1: Crear sesión de upload
POST /remote.php/dav/uploads/{userId}/
Response: 201 Created
Location: /remote.php/dav/uploads/{userId}/abc123def/

Paso 2: Subir chunks en PARALELO
PUT /remote.php/dav/uploads/{userId}/abc123def/{chunkIndex}
    Content: 10 MB de datos
    Response: 204 No Content

Paso 3: Finalizar upload
MOVE /remote.php/dav/uploads/{userId}/abc123def
    Destination: /remote.php/dav/files/{userId}/documento.pdf
    Response: 201 Created o 204 No Content
```

### Ventajas
- ✅ Chunks en paralelo
- ✅ Permite resume si conexión se cae
- ✅ Bajo overhead (simple HTTP)

### Tamaño de chunks en rclone
- **Default**: 10 MB
- **Configurable**: parámetro `nextcloud_chunk_size`
- **Razón**: balance entre overhead y timeouts HTTP

### Implementación en rclone
```go
// En backend/webdav/tus-upload.go

type Upload struct {
    uploadID string
    parts    map[int]bool
    completed int
}

func (u *Upload) UploadPart(index int, data []byte) error {
    path := fmt.Sprintf("/uploads/%s/%d", u.uploadID, index)
    return client.Put(path, data)
}

func (u *Upload) Finish() error {
    // MOVE operation
    return client.Move(uploadPath, finalPath)
}
```

---

## 2. Google Drive

### Protocolo: Resumable Upload (RFC 7233)

```
Paso 1: Iniciar upload resumable
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable
    Header: X-Upload-Content-Length: 1073741824
    Header: X-Upload-Content-Type: application/octet-stream
    Body: {"name": "documento.pdf"}
Response: 200 OK
    Header: Location: https://www.googleapis.com/upload/drive/v3/files?upload_id=xyz

Paso 2: Subir chunks con Content-Range
PUT https://www.googleapis.com/upload/drive/v3/files?upload_id=xyz
    Header: Content-Range: bytes 0-10485759/1073741824
    Body: 10 MB de datos
Response: 308 Resume Incomplete
    Header: Range: bytes=0-10485759

Paso 3: Continuar con próximo chunk
PUT https://www.googleapis.com/upload/drive/v3/files?upload_id=xyz
    Header: Content-Range: bytes 10485760-20971519/1073741824
    Body: próximo 10 MB
Response: 308 Resume Incomplete

Paso N: Último chunk
PUT https://www.googleapis.com/upload/drive/v3/files?upload_id=xyz
    Header: Content-Range: bytes 1062930432-1073741824/1073741824
    Body: últimos MB
Response: 200 OK
    Body: {"id": "...", "name": "documento.pdf", ...}
```

### Puntos clave
- **Content-Range header**: formato `bytes start-end/total`
- **HTTP 308**: significa "continúa subiendo"
- **HTTP 200**: upload completado
- **No necesita MOVE**: server finaliza automáticamente

### Ventajas
- ✅ Estándar HTTP (RFC 7233)
- ✅ Chunks en paralelo (con upload_id)
- ✅ Muy robusto para resume

### Implementación en rclone
```go
// En backend/drive/upload.go

type resumableUpload struct {
    URI           string  // endpoint de upload
    ContentLength int64   // tamaño total
    Media         io.Reader
}

func (rx *resumableUpload) transferChunk(ctx context.Context, start, chunkSize int64, data io.ReadSeeker) (int, error) {
    req := http.NewRequest("PUT", rx.URI, data)
    totalSize := strconv.FormatInt(rx.ContentLength, 10)
    req.Header.Set("Content-Range", 
        fmt.Sprintf("bytes %d-%d/%s", start, start+chunkSize-1, totalSize))
    
    res, err := http.DefaultClient.Do(req)
    if res.StatusCode == 308 {
        // Resume incomplete, continúa
        return 308, nil
    } else if res.StatusCode == 200 {
        // Completado
        return 200, nil
    }
    return res.StatusCode, err
}
```

---

## 3. Dropbox

### Protocolo: Upload Session API

```
Paso 1: Iniciar sesión de upload
RPC /2/files/upload_session/start
    Body: {} (vacío, solo inicializar)
Response: 
    {
        "session_id": "abc123def456..."
    }

Paso 2: Subir chunks (SECUENCIAL o PARALELO)
RPC /2/files/upload_session/append_v2
    Body: {
        "cursor": {
            "session_id": "abc123def456...",
            "offset": 0
        }
    }
    Data: 8 MB de archivos (multipart/form-data)
Response: {} (success)

Paso 3: Continuar con siguiente chunk
RPC /2/files/upload_session/append_v2
    Body: {
        "cursor": {
            "session_id": "abc123def456...",
            "offset": 8388608  // offset del chunk anterior
        }
    }
    Data: siguiente 8 MB
Response: {} (success)

Paso N: Finalizar upload
RPC /2/files/upload_session/finish
    Body: {
        "cursor": {
            "session_id": "abc123def456...",
            "offset": 8388608 * N
        },
        "commit": {
            "path": "/documento.pdf",
            "mode": "add",
            "autorename": false,
            "mute": false
        }
    }
Response:
    {
        "id": "id:abc123def456",
        "path_display": "/documento.pdf",
        "size": 67108864
    }
```

### Puntos clave
- **Offset tracking**: cliente mantiene track de qué se subió
- **Session ID**: identificador único de upload
- **Verificación de offset**: servidor responde con offset correcto si error
- **Chunks paralelos**: Dropbox soporta UploadSessionAppendV2 paralelo

### Ventajas
- ✅ Chunks paralelos (bien soportados)
- ✅ API RPC, no HTTP (más confiable)
- ✅ Detección automática de offset incorrecto

### Implementación en rclone
```go
// En backend/dropbox/dropbox.go

func (o *Object) uploadChunked(ctx context.Context, in io.Reader, commitInfo *files.CommitInfo, size int64) error {
    // Start session
    res, err := o.fs.srv.UploadSessionStart(&files.UploadSessionStartArg{}, nil)
    sessionId := res.SessionId
    
    chunkSize := int64(8388608) // 8 MB
    cursor := files.UploadSessionCursor{
        SessionId: sessionId,
        Offset:    0,
    }
    
    // Subir chunks
    for {
        chunk := readChunk(in, chunkSize)
        if len(chunk) == 0 {
            break
        }
        
        err := o.fs.srv.UploadSessionAppendV2(
            &files.UploadSessionAppendArg{Cursor: &cursor},
            bytes.NewReader(chunk),
        )
        cursor.Offset += int64(len(chunk))
    }
    
    // Finish
    return o.fs.srv.UploadSessionFinish(
        &files.UploadSessionFinishArg{
            Cursor: &cursor,
            Commit: commitInfo,
        },
        nil,
    )
}
```

---

## 4. S3 (AWS / MinIO)

### Protocolo: Multipart Upload API

```
Paso 1: Iniciar multipart upload
POST /documento.pdf?uploads
Response: 200 OK
    <InitiateMultipartUploadResult>
        <Bucket>my-bucket</Bucket>
        <Key>documento.pdf</Key>
        <UploadId>KR1NHD.AIurvzn12345</UploadId>
    </InitiateMultipartUploadResult>

Paso 2: Subir parts (PARALELO recomendado)
PUT /documento.pdf?partNumber=1&uploadId=KR1NHD.AIurvzn12345
    Body: 5 MB - 5 TB (typical: 5-100 MB)
Response: 200 OK
    <ETag>"c9eba02a50e2e91534e36322490f4bed"</ETag>

Paso 3: Subir más parts
PUT /documento.pdf?partNumber=2&uploadId=KR1NHD.AIurvzn12345
    Body: siguiente 5 MB
Response: 200 OK
    <ETag>"50d67012a9c8a93c89b479452a9ef9ca"</ETag>

Paso N: Completar upload
POST /documento.pdf?uploadId=KR1NHD.AIurvzn12345
    Body: <CompleteMultipartUpload>
        <Part>
            <PartNumber>1</PartNumber>
            <ETag>"c9eba02a50e2e91534e36322490f4bed"</ETag>
        </Part>
        <Part>
            <PartNumber>2</PartNumber>
            <ETag>"50d67012a9c8a93c89b479452a9ef9ca"</ETag>
        </Part>
        ...
    </CompleteMultipartUpload>
Response: 200 OK
    <CompleteMultipartUploadResult>
        <Location>https://my-bucket.s3.amazonaws.com/documento.pdf</Location>
        <Bucket>my-bucket</Bucket>
        <Key>documento.pdf</Key>
        <ETag>"---"</ETag>
    </CompleteMultipartUploadResult>
```

### Puntos clave
- **Parts deben ser 5MB-5TB** (excepto último que puede ser más pequeño)
- **Min 5MB por part**: S3 no acepta parts < 5MB (excepto última)
- **ETag tracking**: necesito guardar ETag de cada part
- **Part numbers**: 1-10000
- **Paralelo**: S3 soporta uploads paralelos muy bien

### Ventajas
- ✅ Excelente performance paralelo (optimizado en AWS)
- ✅ Compatible con cualquier storage S3 (AWS, MinIO, DigitalOcean, etc.)
- ✅ Tamaños de parts flexibles (5MB-5TB)

### Desventajas
- ❌ Mínimo 5MB por part (no sirve para chunks pequeños)
- ❌ Más complejidad en implementación

### Implementación en rclone
```go
// En backend/s3/s3.go + lib/multipart

type Upload struct {
    uploadID string
    parts    map[int]string // partNumber → ETag
}

func (u *Upload) UploadPart(partNumber int, data []byte) error {
    res, err := s3Client.PutObject(ctx, bucket, key, 
        &s3.PutObjectInput{
            Bucket:          aws.String(bucket),
            Key:             aws.String(key),
            Body:            bytes.NewReader(data),
            ContentLength:   aws.Int64(int64(len(data))),
            UploadId:        aws.String(u.uploadID),
            PartNumber:      aws.Int32(int32(partNumber)),
        },
    )
    u.parts[partNumber] = *res.ETag
    return err
}

func (u *Upload) Complete() error {
    parts := make([]*types.CompletedPart, len(u.parts))
    for num, etag := range u.parts {
        parts = append(parts, &types.CompletedPart{
            ETag:       aws.String(etag),
            PartNumber: aws.Int32(int32(num)),
        })
    }
    
    _, err := s3Client.CompleteMultipartUpload(ctx, &s3.CompleteMultipartUploadInput{
        Bucket:       aws.String(bucket),
        Key:          aws.String(key),
        UploadId:     aws.String(u.uploadID),
        MultipartUpload: &types.CompletedMultipartUpload{
            Parts: parts,
        },
    })
    return err
}
```

---

## 📊 Tabla Comparativa

| Aspecto | Nextcloud | Google Drive | Dropbox | S3 |
|---------|-----------|--------------|---------|-----|
| **Protocolo** | WebDAV TUS | Resumable Upload | RPC Session | REST Multipart |
| **Chunk Size** | 10 MB (configurable) | Flexible | 8 MB (típico) | 5 MB - 5 TB |
| **Paralelo** | Sí (chunks numéricos) | Sí (múltiples Content-Range) | Sí (append paralelo) | Sí (parts paralelos) |
| **Overhead** | Bajo (simple HTTP) | Bajo (headers) | Bajo (RPC) | Bajo (XML) |
| **Resume** | Sí (TUS spec) | Sí (Content-Range) | Sí (offset tracking) | Sí (abort y reintentar) |
| **ETag** | Generado por servidor | Generado por servidor | Generado por servidor | REQUIRED (calcular) |
| **Mtime** | PROPFIND | Metadata | Metadata | Metadata |
| **Complejidad** | Baja | Media (RFC 7233) | Media (offset tracking) | Media (ETag tracking) |
| **Idiómatico para** | OwnCloud, Nextcloud | Google Workspace | Dropbox | AWS, MinIO, etc. |

---

## 🎯 Estrategia para Chronex

### Opción 1: Abstracción Única (Recomendado)

```go
type ChunkUploader interface {
    Start(ctx context.Context) (string, error)           // uploadID
    UploadChunk(ctx context.Context, index int, data []byte) error
    Finish(ctx context.Context, uploadID string) error
}

// WebDAVUploader (para Nextcloud, OwnCloud)
type WebDAVUploader struct {
    client  *gowebdav.Client
    baseURL string
}

// S3Uploader (para MinIO, AWS, DigitalOcean)
type S3Uploader struct {
    client     *s3.Client
    bucket     string
    key        string
}

// LocalUploader (para filesystem local)
type LocalUploader struct {
    basePath string
}

// Cada uno implementa ChunkUploader
```

### Opción 2: Provider Específico

```go
// Cada provider decide su estrategia interna
type Provider interface {
    UploadChunk(ctx context.Context, hash string, data []byte) error
    // Provider maneja chunking internamente si es necesario
}

// WebDAV: chunks pequeños (16KB), múltiples PUT
// S3: chunks grandes (10MB), multipart
// Local: sin chunking, directo a filesystem
```

### Recomendación: **Opción 1 + Opción 2 combinadas**

```go
// En Chronex:

// Nivel alto: agnóstico
type Provider interface {
    UploadChunk(hash string, data []byte) error    // chunk ya encriptado
    DownloadChunk(hash string) ([]byte, error)
}

// Implementación: cada uno maneja chunking según servidor
// WebDAVProvider: 
//   - Chunks 10MB vía TUS
//   - Transparente al usuario de Provider interface
// 
// S3Provider:
//   - Chunks 10MB vía Multipart
//   - Transparente al usuario
//
// LocalProvider:
//   - Sin chunking, escribir directo
//   - Transparente al usuario
```

---

## ✅ Conclusión

**La respuesta corta**: SÍ, Nextcloud, S3, Google Drive y Dropbox soportan uploads chunked, **pero cada uno tiene su propio protocolo**.

**Para Chronex**:
1. Crear interfaz `ChunkUploader` agnóstica
2. Cada provider implementa su estrategia
3. Usuario de API ve una interfaz simple: `UploadChunk(hash, data)`
4. Detalles de chunking (TUS, multipart, etc.) quedan encapsulados

**Tamaño de chunks recomendado para Chronex**:
- **Local**: sin límite, no chunking
- **WebDAV (Nextcloud)**: 10 MB (ya lo hace Nextcloud)
- **S3**: 10 MB (minSplit en rclone)
- **Google Drive**: 10 MB (estándar)

Todos usan **~10MB por default** en rclone, balance perfecto entre:
- ✅ No sobrecargar network
- ✅ Evitar timeouts HTTP
- ✅ Permitir paralelización
- ✅ Resiliencia en conexiones malas
