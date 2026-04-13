# CHRONEX WebDAV Protocol Specification

**Design Document Version**: 2.0 (UPDATED)  
**Date**: 2026-04-13  
**Status**: OFFICIAL - WebDAV Dual-Mode Architecture  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **COMPLETELY REVISED** to reflect the correct architecture:

**OLD (Obsolete)**:
- ❌ REST API + JWT
- ❌ Custom endpoints
- ❌ gRPC protocol
- ❌ GraphQL queries

**NEW (Official)**:
- ✅ WebDAV Protocol (RFC 4918)
- ✅ Standard methods (GET, PUT, DELETE, PROPFIND)
- ✅ Basic/Digest Authentication
- ✅ ETag-based conflict detection

---

## 1. PROTOCOL OVERVIEW

### 1.1 WebDAV (Web Distributed Authoring and Versioning)

```
Why WebDAV?
├─ Standard protocol (RFC 4918)
├─ Universal client support (Obsidian, WinSCP, Finder, Nautilus)
├─ Proven in production (Nextcloud, ownCloud, etc.)
├─ Built on HTTP (works everywhere)
├─ No proprietary protocol needed
├─ Compatible with 20+ year old systems
└─ Obsidian native support (WebDAV plugin)
```

### 1.2 Server Endpoints

```
Development:
├─ http://localhost:8080/
├─ Basic auth: alice/secret
└─ WebDAV root points to SQLite blocks

Production:
├─ https://chronex.example.com:443/
├─ HTTPS/TLS 1.2+ required
├─ Htpasswd or JWT authentication
└─ WebDAV root points to SQLite blocks

WebDAV Paths:
├─ /                           (root, lists notebooks)
├─ /My%20Notebook/             (notebook folder)
├─ /My%20Notebook/First%20Note.md (block file)
└─ /My%20Notebook/Subfolder/   (nested notebooks)
```

---

## 2. AUTHENTICATION

### 2.1 Basic Authentication

```
Simplest method. Client sends credentials in every request:

GET / HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWxpY2U6c2VjcmV0

Where: Base64("alice:secret") = "YWxpY2U6c2VjcmV0"

Server validates against /etc/chronex/users.htpasswd
├─ If valid: 200 OK
├─ If invalid: 401 Unauthorized
└─ Session maintained via HTTP Keep-Alive
```

### 2.2 Digest Authentication

```
More secure. Server challenges, client responds with digest:

1. Client requests: GET /
2. Server responds: 401 + WWW-Authenticate header
3. Client sends digest of password (not plaintext)
4. Server validates digest
5. If valid: 200 OK

More secure than Basic, still standard WebDAV
```

### 2.3 Configuration

```bash
# Create users file
$ htpasswd -c /etc/chronex/users.htpasswd alice
$ htpasswd /etc/chronex/users.htpasswd bob

# Start Chronex server
$ chronex serve webdav \
    --addr 0.0.0.0:443 \
    --cert /certs/fullchain.pem \
    --key /certs/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd
```

---

## 3. WEBDAV OPERATIONS

### 3.1 GET (Read Block)

```
Request:
GET /My%20Notebook/First%20Note.md HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWxpY2U6c2VjcmV0

Response:
HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Content-Length: 1234
ETag: "abc123def456"
Last-Modified: Mon, 13 Apr 2026 10:00:00 GMT

# First Note

This is the block content...

Server side:
├─ VFS translates path → block_id
├─ Loads block from SQLite
├─ Decrypts content (if E2EE enabled)
├─ Calculates ETag (FastCDC hash)
└─ Returns file content
```

### 3.2 PUT (Write/Create Block)

```
Request:
PUT /My%20Notebook/First%20Note.md HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWlsY2U6c2VjcmV0
Content-Type: text/markdown
Content-Length: 1500
If-Match: "abc123def456"

# First Note (Updated)

This is the updated content...

Response:
HTTP/1.1 204 No Content

Server side:
├─ VFS translates path → block_id
├─ Checks If-Match header (ETag)
├─ If ETag matches:
│  ├─ Decrypt old content
│  ├─ Compute diff
│  ├─ Create sync_operation (increment vector clock)
│  ├─ Encrypt new content
│  ├─ Save to SQLite
│  ├─ Update ETag
│  └─ Return 204 No Content
├─ If ETag doesn't match (conflict!):
│  ├─ Check vector clocks
│  ├─ Attempt 3-way merge if possible
│  ├─ Return 412 Precondition Failed
│  └─ Client re-fetches latest version
```

### 3.3 DELETE (Soft Delete Block)

```
Request:
DELETE /My%20Notebook/First%20Note.md HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWlsY2U6c2VjcmV0

Response:
HTTP/1.1 204 No Content

Server side:
├─ VFS translates path → block_id
├─ Soft delete: Set deleted_at = NOW()
├─ Create sync_operation (for multi-device sync)
├─ Block still in SQLite (recoverable)
└─ Return 204 No Content

Note: File appears deleted to client, but recoverable from server
```

### 3.4 PROPFIND (List Contents)

```
Request:
PROPFIND /My%20Notebook/ HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWlsY2U6c2VjcmV0
Depth: 1
Content-Type: application/xml

<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <D:getcontentlength/>
    <D:getlastmodified/>
  </D:prop>
</D:propfind>

Response:
HTTP/1.1 207 Multi-Status

<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/My%20Notebook/</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>My Notebook</D:displayname>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/My%20Notebook/First%20Note.md</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>First Note.md</D:displayname>
        <D:resourcetype/>
        <D:getcontentlength>1234</D:getcontentlength>
        <D:getlastmodified>Mon, 13 Apr 2026 10:00:00 GMT</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>

Server side:
├─ VFS queries: SELECT * FROM blocks WHERE notebook_id = 'abc123'
├─ Returns as XML (WebDAV standard)
├─ Includes: size, modtime, ETag
└─ Depth=1: Lists direct children only
```

### 3.5 MKCOL (Create Collection/Notebook)

```
Request:
MKCOL /New%20Notebook/ HTTP/1.1
Host: chronex.example.com
Authorization: Basic YWlsY2U6c2VjcmV0

Response:
HTTP/1.1 201 Created

Server side:
├─ VFS creates new notebook in SQLite
├─ Creates new directory entry
├─ Creates sync_operation for multi-device
└─ Return 201 Created
```

---

## 4. ETAG & CONFLICT DETECTION

### 4.1 ETag Hash (FastCDC)

```
Chronex uses FastCDC for ETag calculation instead of MD5:

Why FastCDC?
├─ Content-defined chunking (stable across edits)
├─ Similar edits produce similar chunks
├─ Better conflict detection than MD5
├─ More efficient for block content
└─ Faster than SHA-1

Example:
GET /My%20Notebook/First%20Note.md
→ ETag: "abc123def456789"

If-Match header (optimistic locking):
PUT /My%20Notebook/First%20Note.md
If-Match: "abc123def456789"
→ Only succeeds if ETag still matches
```

### 4.2 Conflict Resolution

```
Scenario: Two devices edit same block concurrently

Device A:
├─ Reads block, gets ETag: "version1"
├─ Edits content
└─ PUTs with If-Match: "version1"

Device B (meanwhile):
├─ Reads block, gets ETag: "version1"
├─ Edits content
└─ PUTs with If-Match: "version1"

Server receives:
├─ Device A PUT succeeds (If-Match matches)
├─ Server calculates new ETag: "version2"
├─ Device B PUT fails (If-Match doesn't match anymore)
│  └─ Server returns 412 Precondition Failed
├─ Device B re-fetches block with new ETag
├─ Server consultsVector clocks to detect conflict
├─ Attempts 3-way merge if possible
└─ Client user sees conflict marker if auto-merge fails
```

---

## 5. VECTOR CLOCKS & SYNC

### 5.1 Multi-Device Sync Over WebDAV

```
Each block has vector_clock: {device_id: logical_clock}

Example:
Desktop: {desktop: 5, tablet: 3, cloud: 2}
Tablet:  {desktop: 4, tablet: 2, cloud: 2}
Server:  {desktop: 5, tablet: 3, cloud: 3}

When device edits:
├─ Increments its own counter
├─ Desktop edits: {desktop: 6, tablet: 3, cloud: 2}
├─ Server receives PUT
├─ Server updates to: {desktop: 6, tablet: 3, cloud: 3}
└─ Broadcasts to other devices

Other devices pull:
├─ Tablet: I have {device: 4, tablet: 2, cloud: 2}
├─ Server has {device: 6, tablet: 3, cloud: 3}
├─ Tablet is behind, fetches new version
├─ Tablet updates local block
└─ Tablet increments its counter: {device: 6, tablet: 4, cloud: 3}
```

---

## 6. SERVER CONFIGURATION

### 6.1 Command-Line Options

```bash
# Basic server
$ chronex serve webdav \
    --addr 127.0.0.1:8080 \
    --db ~/.chronex/chronex.db \
    --user alice --pass secret

# Production server
$ chronex serve webdav \
    --addr 0.0.0.0:443 \
    --cert /certs/fullchain.pem \
    --key /certs/privkey.pem \
    --htpasswd /etc/chronex/users.htpasswd \
    --vfs-cache-mode full \
    --vfs-cache-max-size 50G \
    --vfs-cache-poll-interval 5m \
    --etag-hash fastcdc \
    --disable-dir-list \
    --disable-zip \
    --db ~/.chronex/chronex.db \
    --max-header-bytes 16384
```

### 6.2 Configuration File

```toml
# ~/.chronex/server.toml

[server]
addr = "0.0.0.0:443"
db = "~/.chronex/chronex.db"
cert = "/etc/letsencrypt/live/chronex.io/fullchain.pem"
key = "/etc/letsencrypt/live/chronex.io/privkey.pem"
htpasswd = "/etc/chronex/users.htpasswd"

[vfs]
cache_mode = "full"
cache_max_size = "50G"
cache_poll_interval = "5m"
etag_hash = "fastcdc"
disable_dir_list = true
disable_zip = true

[limits]
max_header_bytes = 16384
rate_limit = "100 req/s"
```

---

## 7. CLIENT EXAMPLES

### 7.1 Obsidian WebDAV Plugin

```
1. Install: Obsidian Vault Sync or WebDAV plugin
2. Configure:
   - Server: https://chronex.example.com:443/
   - Username: alice
   - Password: secret
3. Connect: Click "Connect"
4. Result: Obsidian now syncs with Chronex via WebDAV
```

### 7.2 Command-Line Client (curl)

```bash
# List notebooks
$ curl -u alice:secret https://chronex.example.com/

# Get block
$ curl -u alice:secret https://chronex.example.com/My%20Notebook/Note.md

# Create block
$ curl -u alice:secret \
    -X PUT \
    --data-binary @note.md \
    https://chronex.example.com/My%20Notebook/Note.md

# Delete block
$ curl -u alice:secret \
    -X DELETE \
    https://chronex.example.com/My%20Notebook/Note.md
```

### 7.3 Mount as Filesystem (macOS/Linux)

```bash
# macOS Finder
$ open "webdav://alice:secret@chronex.example.com/"

# Linux (with davfs2)
$ sudo mount -t davfs https://chronex.example.com/ /mnt/chronex

# Now browse blocks like regular files
$ ls /mnt/chronex/
$ cat /mnt/chronex/My\ Notebook/First\ Note.md
```

---

## 8. SECURITY CONSIDERATIONS

### 8.1 HTTPS/TLS Required

```
Production MUST use HTTPS:
├─ Protects authentication credentials
├─ Prevents man-in-the-middle attacks
├─ Encrypts content in transit
└─ TLS 1.2+ required (no SSL 3.0/TLS 1.0)
```

### 8.2 Authentication Best Practices

```
✅ DO:
├─ Use HTTPS + TLS 1.2+
├─ Store passwords hashed (htpasswd with bcrypt)
├─ Use strong passwords (16+ characters)
├─ Rotate credentials regularly
└─ Monitor access logs

❌ DON'T:
├─ Use HTTP (unencrypted)
├─ Store plaintext passwords
├─ Reuse passwords across services
├─ Share credentials
└─ Expose htpasswd file publicly
```

### 8.3 End-to-End Encryption (Optional)

```
Blocks can be encrypted before WebDAV:
├─ Master key stored locally (v1.0)
├─ All blocks encrypted with AES-256-GCM
├─ Server never sees plaintext
├─ Works with any WebDAV client (client decrypts)
└─ Optional: enabled by default v1.5+
```

---

## 9. PERFORMANCE

### 9.1 Latency

```
Operation                   P99 Latency
─────────────────────────────────────────
GET (read block)            <100ms
PUT (write block)           <200ms  
PROPFIND (list)             <300ms
DELETE (soft delete)        <150ms
MKCOL (create notebook)     <100ms

Network bandwidth:
├─ With gzip compression: 60-70% reduction
├─ Typical block: 5-10 KB
├─ VFS cache: 5m poll interval
└─ Sync operations: batched every 5m
```

### 9.2 Caching

```
VFS Cache Modes:

full:      Cache all blocks (best performance)
writes:    Cache write operations only
minimal:   Cache open files only
off:       No caching (always fetch from storage)

Recommended: full
└─ Blocks are small, cache all for optimal speed
```

---

## 10. SUMMARY

**Chronex Protocol**: WebDAV (RFC 4918)
- ✅ Universal client support
- ✅ Obsidian compatible
- ✅ Standard methods (GET, PUT, DELETE, PROPFIND)
- ✅ ETag-based conflict detection
- ✅ Proven, battle-tested protocol
- ✅ No proprietary protocol needed

**Authentication**: Basic/Digest (htpasswd)
- ✅ Simple to configure
- ✅ Standard WebDAV
- ✅ Works with all clients

**Conflict Resolution**: Vector clocks + 3-way merge
- ✅ Multi-device safe
- ✅ Automatic when possible
- ✅ Manual when necessary

**Security**: HTTPS/TLS + optional E2EE
- ✅ Credentials protected
- ✅ Content encrypted in transit
- ✅ Optional block-level encryption

---

**Document Status**: Updated to WebDAV Protocol Specification  
**Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md (primary)  
**Protocol**: RFC 4918 (WebDAV standard)  
**Implementation**: Go + golang.org/x/net/webdav
