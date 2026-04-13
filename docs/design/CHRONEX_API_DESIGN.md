# CHRONEX API Design

**Design Document Version**: 1.0  
**Date**: 2026-04-13  
**Status**: Approved for v1.5 (multi-device sync)  
**References**: CHRONEX_SYNC_PROTOCOL_DESIGN.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## 1. API ARCHITECTURE OVERVIEW

### 1.1 Design Philosophy

```
CHRONEX API = REST (simplicity) + gRPC (performance, future)

v1.0: REST only (MVP)
├─ HTTP/1.1 with Keep-Alive
├─ JSON payloads
├─ OAuth2 for authentication
└─ Simple, widely supported

v1.5: REST + gRPC (optional)
├─ REST for mobile (ubiquitous)
├─ gRPC for desktop (high-performance, low-latency)
├─ Both behind same server
└─ User chooses automatically

v2.0: GraphQL + gRPC
├─ GraphQL for flexible queries
├─ gRPC for real-time sync
└─ Future enhancement (skip for v1.0)

Focus: v1.5 REST API specification
```

### 1.2 API Base URL

```
Development:
├─ http://localhost:3000/api/v1
└─ Unencrypted (ok for dev)

Production:
├─ https://api.chronex.example.com/api/v1
└─ TLS 1.2+ enforced

API versioning:
├─ URL versioning: /api/v1, /api/v2 (future)
├─ Stability: Each version guaranteed stable for 2+ years
├─ Deprecation: 6-month notice before removal
└─ Current: v1 (launched 2026)
```

---

## 2. AUTHENTICATION

### 2.1 OAuth2 / JWT Token Flow

```
Step 1: User Login

POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "MySecretPassword123!"
}

Response:

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid-user-123",
    "email": "alice@example.com",
    "created_at": 1712956800000
  }
}

Security:
├─ Password transmitted over TLS only
├─ Server hashes: bcryptjs (not plaintext)
├─ Token issued: JWT (HS256)
├─ Expiration: 1 hour (short-lived)
├─ Refresh: Use refresh_token to get new token
└─ Storage: Client keeps token in secure storage
```

### 2.2 JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "uuid-user-123",           // Subject (user ID)
  "iss": "chronex.example.com",     // Issuer
  "aud": "chronex-client",          // Audience
  "iat": 1712956800,                // Issued at (Unix timestamp)
  "exp": 1712960400,                // Expiration (1 hour later)
  "user_id": "uuid-user-123",
  "email": "alice@example.com"
}

Signature:
├─ HMAC-SHA256(header + payload, server_secret)
├─ Ensures integrity (token not tampered with)
└─ Server verifies on each request
```

### 2.3 Authorization Header

```
All API requests (except login):

GET /api/v1/blocks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

Server validates:
├─ Extract token from Authorization header
├─ Verify JWT signature
├─ Check expiration
├─ Allow request if valid
└─ Return 401 Unauthorized if invalid
```

---

## 3. CORE API ENDPOINTS

### 3.1 Blocks API

```
CREATE Block:

POST /api/v1/blocks
Content-Type: application/json
Authorization: Bearer {token}

{
  "parent_id": "uuid-parent",
  "root_id": "uuid-notebook",
  "type": "paragraph",
  "title": "Learn Rust",
  "content_encrypted": "base64(iv || ciphertext || auth_tag)",
  "content_iv": "base64(nonce)",
  "content_tag": "base64(auth_tag)"
}

Response (201 Created):

{
  "id": "uuid-block-001",
  "parent_id": "uuid-parent",
  "root_id": "uuid-notebook",
  "type": "paragraph",
  "title": "Learn Rust",
  "created_at": 1712956800000,
  "updated_at": 1712956800000,
  "created_by": "uuid-device-A",
  "updated_by": "uuid-device-A",
  "version_vector": {"device-A": 1001},
  "server_id": "server-version-123"
}

GET Block:

GET /api/v1/blocks/{block_id}
Authorization: Bearer {token}

Response (200 OK):

{
  "id": "uuid-block-001",
  "content_encrypted": "...",
  ... (same as above)
}

UPDATE Block:

PATCH /api/v1/blocks/{block_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Learn Rust & Go",
  "content_encrypted": "base64(...)",
  "version_vector": {"device-A": 1002, "device-B": 1000}
}

Response (200 OK):

{
  "id": "uuid-block-001",
  "title": "Learn Rust & Go",
  ... (updated fields)
}

DELETE Block:

DELETE /api/v1/blocks/{block_id}
Authorization: Bearer {token}

Response (204 No Content):

(empty body, successful deletion)

Note: Soft delete (marked as deleted, not removed)
```

### 3.2 Sync API (Critical)

```
Sync Request (Largest endpoint):

POST /api/v1/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "device_id": "uuid-device-A",
  "last_sync": 1712956700000,
  
  "changes": [
    {
      "id": "uuid-block-001",
      "operation": "create|update|delete",
      "content_encrypted": "base64(...)",
      "type": "paragraph",
      "title": "Learn Rust",
      "parent_id": "uuid-parent",
      "root_id": "uuid-notebook",
      "created_at": 1712956800000,
      "updated_at": 1712956810000,
      "created_by": "uuid-device-A",
      "updated_by": "uuid-device-A",
      "version_vector": {"device-A": 1001}
    },
    ... (more changes, batched)
  ],
  
  "pull_changes_since": 1712956700000
}

Response (200 OK):

{
  "status": "success|conflict",
  "server_version": 1712956820000,
  
  "pushed_changes": [
    {
      "id": "uuid-block-001",
      "status": "accepted|conflict",
      "server_id": "server-version-123",
      "server_version": {...}  // If conflict
    }
  ],
  
  "pulled_changes": [
    {
      "id": "uuid-block-002",
      "operation": "update",
      "content_encrypted": "...",
      "version_vector": {...},
      "conflict": false
    }
  ],
  
  "meta": {
    "total_changed_blocks": 243,
    "server_sync_version": 1712956820000,
    "next_sync_recommended": "2026-04-13T10:30:00Z"
  }
}

Latency SLO:
├─ Request: 100 changes × 500 B = 50 KB
├─ Compression: 50 KB → 15 KB (gzip)
├─ Network: 15 KB @ 10 Mbps = 12 ms
├─ Server processing: 100-300 ms
├─ Response: 15 KB = 12 ms
└─ Total: 100-300 ms (P99 <500ms with network)

Compression:
├─ Request: Accept-Encoding: gzip, deflate
├─ Response: Content-Encoding: gzip
└─ Transparent: Client/server handle automatically
```

### 3.3 Notebooks API

```
LIST Notebooks:

GET /api/v1/notebooks
Authorization: Bearer {token}

Response (200 OK):

{
  "notebooks": [
    {
      "id": "uuid-notebook-001",
      "name": "Learning",
      "description": "Notes on learning",
      "created_at": 1712956800000,
      "updated_at": 1712956810000,
      "is_deleted": false,
      "sort_order": 1.0
    },
    ...
  ],
  "total": 5
}

CREATE Notebook:

POST /api/v1/notebooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Learning",
  "description": "Notes on learning"
}

Response (201 Created):

{
  "id": "uuid-notebook-001",
  "name": "Learning",
  ... (same as above)
}

UPDATE Notebook:

PATCH /api/v1/notebooks/{notebook_id}
Authorization: Bearer {token}

{
  "name": "Learning & Development"
}

Response (200 OK):

{
  "id": "uuid-notebook-001",
  "name": "Learning & Development",
  ...
}

DELETE Notebook:

DELETE /api/v1/notebooks/{notebook_id}
Authorization: Bearer {token}

Response (204 No Content):

(empty, soft delete)
```

### 3.4 Search API

```
Search Blocks:

GET /api/v1/search?q=rust&limit=20&offset=0
Authorization: Bearer {token}

Response (200 OK):

{
  "query": "rust",
  "results": [
    {
      "block_id": "uuid-block-001",
      "title": "Learn Rust Programming",
      "preview": "# Learn Rust [...]",
      "type": "heading",
      "notebook_id": "uuid-notebook-001",
      "updated_at": 1712956800000,
      "relevance_score": 0.95  // Elasticsearch relevance
    },
    ...
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}

Advanced Search:

GET /api/v1/search?q=rust%20AND%20async&type=paragraph
Authorization: Bearer {token}

Query parameters:
├─ q: Search query (URL-encoded)
├─ limit: Results per page (default 20, max 100)
├─ offset: Pagination offset
├─ type: Filter by block type (optional)
├─ sort: Sort order (relevance, date, etc.)
└─ filter: Advanced filters (future)

Response time: <500ms P99 (local FTS5)
```

### 3.5 Attachments API

```
Upload Attachment:

POST /api/v1/blocks/{block_id}/attachments
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "file": <binary file data>,
  "filename": "image.png",
  "content_type": "image/png"
}

Response (201 Created):

{
  "id": "uuid-attachment-001",
  "block_id": "uuid-block-001",
  "filename": "image.png",
  "size": 102400,
  "content_type": "image/png",
  "url": "https://api.chronex.example.com/api/v1/attachments/uuid-attachment-001",
  "created_at": 1712956800000
}

Download Attachment:

GET /api/v1/attachments/{attachment_id}
Authorization: Bearer {token}

Response (200 OK):

<binary file data>

Headers:
├─ Content-Type: image/png
├─ Content-Disposition: attachment; filename="image.png"
├─ Content-Length: 102400
└─ Cache-Control: public, max-age=31536000 (1 year)

Delete Attachment:

DELETE /api/v1/blocks/{block_id}/attachments/{attachment_id}
Authorization: Bearer {token}

Response (204 No Content):

(empty)
```

---

## 4. ERROR HANDLING

### 4.1 HTTP Status Codes

```
2xx Success:
├─ 200 OK: Request successful, response body included
├─ 201 Created: Resource created, response body included
├─ 204 No Content: Request successful, no response body
└─ 206 Partial Content: Range request (future)

4xx Client Error:
├─ 400 Bad Request: Invalid request format
├─ 401 Unauthorized: Missing or invalid token
├─ 403 Forbidden: Authenticated but not authorized
├─ 404 Not Found: Resource doesn't exist
├─ 409 Conflict: Concurrent changes detected
└─ 429 Too Many Requests: Rate limited

5xx Server Error:
├─ 500 Internal Server Error: Unexpected error
├─ 503 Service Unavailable: Server overloaded or down
└─ 504 Gateway Timeout: Server taking too long
```

### 4.2 Error Response Format

```
All errors return structured JSON:

{
  "error": {
    "code": "CONFLICT",
    "message": "Block was modified elsewhere",
    "details": {
      "block_id": "uuid-block-001",
      "server_version": {...},
      "local_version": {...}
    },
    "request_id": "req-12345"  // For debugging
  }
}

Common error codes:
├─ VALIDATION_ERROR: Invalid input
├─ AUTHENTICATION_FAILED: Wrong credentials
├─ AUTHORIZATION_FAILED: Not allowed
├─ NOT_FOUND: Resource missing
├─ CONFLICT: Concurrent modification
├─ RATE_LIMITED: Too many requests
├─ SERVER_ERROR: Internal error
└─ MAINTENANCE: Server maintenance
```

---

## 5. RATE LIMITING

### 5.1 Rate Limit Strategy

```
Purpose: Prevent abuse, protect server from DoS

Limits (per user):

Login endpoint:
├─ 5 attempts per 15 minutes
├─ After limit: 429 Too Many Requests
└─ Reset: After 15 minutes

Sync endpoint:
├─ 100 requests per minute
├─ Normal: 1 per 5 minutes (typical)
├─ Acceptable: Multiple devices syncing
└─ Limit prevents: Crazy automated tools

Search endpoint:
├─ 60 requests per minute
├─ Normal: 1-2 per minute (typical)
├─ Acceptable: User typing search queries
└─ Limit prevents: Scrapers

Block operations:
├─ 1000 requests per minute
├─ Normal: 10-20 per minute (editing)
└─ Acceptable: Bulk import
```

### 5.2 Rate Limit Response Headers

```
All responses include:

X-RateLimit-Limit: 100              // Total limit
X-RateLimit-Remaining: 87            // Remaining requests
X-RateLimit-Reset: 1712956860        // Unix timestamp

Example (after 13 requests out of 100):

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1712956860

If limit exceeded:

HTTP/1.1 429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "100 requests per minute limit exceeded",
    "retry_after": 45
  }
}

Headers:
├─ Retry-After: 45 (seconds until can retry)
└─ X-RateLimit-Reset: 1712956860
```

---

## 6. PAGINATION

### 6.1 Cursor-Based Pagination

```
Problem with offset:
├─ Data changes between requests
├─ If item inserted before offset: Duplicates or skips
└─ Solution: Cursor-based pagination (more reliable)

Cursor pagination implementation:

GET /api/v1/notebooks?limit=20&cursor=abc123

Response:

{
  "notebooks": [
    {...},
    {...}
  ],
  "pagination": {
    "limit": 20,
    "cursor": "abc123",
    "next_cursor": "def456",
    "has_more": true
  }
}

Next page:

GET /api/v1/notebooks?limit=20&cursor=def456

Benefits:
├─ Reliable: No duplicates/skips
├─ Efficient: Can page backwards
├─ Stable: Works even if data changes
└─ Concurrent: Multiple clients can page independently
```

---

## 7. VERSIONING & DEPRECATION

### 7.1 API Versioning Strategy

```
URL-based versioning:

/api/v1  → Current version
/api/v2  → Next version (future)

Stability guarantee:

v1 will be supported until: 2028-01-01
├─ 12 months: v1 + v2 both available
├─ 6 months notice: Before shutdown
└─ Clients have 12+ months to migrate

Deprecation notice:

In response headers:
├─ Deprecation: true
├─ Sunset: Sun, 01 Jan 2028 00:00:00 GMT
└─ Link: </api/v2/...>; rel="successor-version"

Migration path:

v1 endpoint: GET /api/v1/blocks/{id}
v2 endpoint: GET /api/v2/blocks/{id}

Backward compatibility:
├─ v1 endpoints: Always work (never removed)
├─ v2: Same functionality, improved
└─ Clients choose: Can use either version
```

---

## 8. MONITORING & OBSERVABILITY

### 8.1 Request Logging

```
All API requests logged:

{
  "timestamp": "2026-04-13T10:30:00Z",
  "request_id": "req-12345",
  "method": "POST",
  "path": "/api/v1/sync",
  "status": 200,
  "latency_ms": 234,
  "user_id": "uuid-user-123",
  "device_id": "uuid-device-A",
  "request_size_bytes": 52400,
  "response_size_bytes": 12300,
  "error": null
}

Metrics:
├─ Request count (per endpoint)
├─ Latency (P50, P95, P99)
├─ Error rate (4xx, 5xx)
├─ Payload sizes (request/response)
└─ Rate limit violations
```

### 8.2 Health Checks

```
Health check endpoint:

GET /api/v1/health

Response (200 OK):

{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-04-13T10:30:00Z",
  "services": {
    "database": "ok",
    "cache": "ok",
    "search": "ok"
  }
}

Used by:
├─ Load balancer: Health checks every 30 seconds
├─ Monitoring: Alerting on unhealthy status
└─ Client: Can check before making requests
```

---

## 9. IMPLEMENTATION ROADMAP

### v1.0 (MVP)

```
Endpoints:
├─ POST /auth/login
├─ POST /auth/logout
├─ POST /auth/refresh
├─ POST /blocks (create)
├─ GET /blocks/{id}
├─ PATCH /blocks/{id}
├─ DELETE /blocks/{id}
├─ POST /notebooks
├─ GET /notebooks
├─ POST /sync
└─ GET /search

Features:
├─ REST API only
├─ JWT authentication
├─ Basic error handling
└─ Rate limiting

Scope: Personal users, manual sync
```

### v1.5 (Multi-Device)

```
Endpoints (same as v1.0):
├─ All v1.0 endpoints
├─ POST /devices (register new device)
├─ GET /devices (list devices)
├─ DELETE /devices/{id}
└─ POST /attachments (upload files)

Features:
├─ Device management
├─ Attachment uploads
├─ Improved error handling
├─ API documentation (OpenAPI/Swagger)
└─ Rate limiting tuning

Scope: Professional users, automatic sync
```

### v2.0 (Enterprise)

```
Endpoints (new):
├─ GraphQL endpoint: POST /graphql
├─ WebSocket: /ws/sync (real-time)
├─ Team API: /teams, /permissions
├─ Audit log: /audit
└─ Analytics: /analytics

Features:
├─ GraphQL API
├─ WebSocket real-time sync
├─ Team collaboration
├─ Audit logging
└─ gRPC alternative (high-performance)

Scope: Teams, enterprise
```

---

## 10. SECURITY CONSIDERATIONS

### 10.1 TLS/HTTPS

```
All endpoints:
├─ HTTPS only (TLS 1.2+)
├─ HTTP requests: Redirected to HTTPS
└─ Strict-Transport-Security header: Enforced

Certificate:
├─ Valid domain: api.chronex.example.com
├─ Certificate pinning: Optional (mobile only)
└─ Renewal: Automated (Let's Encrypt)
```

### 10.2 CORS (Cross-Origin)

```
Web client (if hosted separately):

Allowed origins:
├─ https://chronex.example.com
└─ https://www.chronex.example.com

Allowed headers:
├─ Authorization
├─ Content-Type
└─ Accept

Allowed methods:
├─ GET, POST, PATCH, DELETE
├─ OPTIONS (preflight)
└─ No credentials in CORS requests
```

### 10.3 Payload Validation

```
All inputs validated:

Block title:
├─ Max length: 1000 characters
├─ No null bytes
└─ UTF-8 encoding required

Block content:
├─ Max size: 10 MB (after encryption)
├─ Must be valid base64
└─ Must have valid IV and auth tag

Search query:
├─ Max length: 500 characters
├─ No SQL injection (parameterized)
└─ No script injection (escaped)
```

---

## Summary

**CHRONEX API**: RESTful with JWT authentication, batched sync, end-to-end encrypted

**Key Endpoints**:
- ✅ Authentication: Login, refresh token, logout
- ✅ Blocks: Create, read, update, delete, search
- ✅ Sync: Batched changes + delta download
- ✅ Notebooks: Organize blocks
- ✅ Attachments: Upload/download files

**Performance**:
- Sync: <500ms P99 (100 changes)
- Search: <500ms P99 (FTS5 local)
- Compression: 60-70% bandwidth savings
- Rate limiting: 100 sync/min per user

**Security**:
- HTTPS TLS 1.2+
- JWT token (1 hour expiration)
- Payload validation
- Rate limiting (anti-DoS)
- E2EE (encrypted payloads)

---

**Document Status**: Design Complete  
**Reference**: OpenAPI/Swagger spec (to be generated from this document)
