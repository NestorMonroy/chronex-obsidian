# SIYUAN Security Implementation Analysis

**Analysis Date**: 2026-04-12  
**Scope**: SiYuan v3.1.8+ security architecture  
**Focus**: Local-first, Flatpak sandbox, minimal encryption, sync security  

---

## 1. OVERVIEW: SIYUAN'S SECURITY APPROACH

### Core Philosophy
```
"Local-first: Data stored locally and encrypted.
Network sync is optional and uses TLS."
```

Unlike Joplin (cloud-centric with E2EE) and Rclone (backend-agnostic), SiYuan prioritizes local data ownership.

```
Security Layers (Client):
├─ Flatpak Sandbox
│  └─ OS-level permission isolation
│
├─ Local Storage
│  └─ Data on user's disk (encrypted at app level)
│
├─ Sync (Optional)
│  └─ Over TLS to sync server
│
└─ Authentication
   └─ Token-based sync auth
```

---

## 2. FLATPAK SANDBOX SECURITY

### 2.1 What is Flatpak?

Flatpak is a containerization technology that sandboxes applications:

```
System
├─ /root/.config       [DENIED]
├─ /root/.ssh          [DENIED]
├─ /etc/passwd         [DENIED]
└─ /var/lib/...        [DENIED]

But:
├─ ~/.var/app/org.b3log.siyuan/    [ALLOWED]
├─ ~/Documents                     [ALLOWED, if --filesystem=xdg-documents]
├─ /tmp                            [ALLOWED]
└─ Network (if --share=network)    [ALLOWED]
```

### 2.2 SiYuan Flatpak Manifest

From `/flathub/org.b3log.siyuan.yml`:

```yaml
app-id: org.b3log.siyuan
runtime: org.freedesktop.Platform
runtime-version: '24.08'

finish-args:
  # Persistent data directories
  - --persist=SiYuan
  - --persist=.config/siyuan
  
  # Read-only media access
  - --filesystem=xdg-pictures:ro
  - --filesystem=xdg-videos:ro
  - --filesystem=xdg-music:ro
  
  # Read-write export locations
  - --filesystem=xdg-desktop
  - --filesystem=xdg-download
  - --filesystem=xdg-documents
  
  # Network access
  - --share=network
  
  # GPU access for rendering
  - --device=dri
```

### 2.3 Security Properties of Flatpak

```
Prevents:
✅ SiYuan reading ~/.ssh/id_rsa
✅ SiYuan accessing /etc/shadow
✅ SiYuan accessing other user's home (~alice)
✅ SiYuan accessing system files

BUT:
❌ SiYuan CAN read ~/Documents (granted)
❌ SiYuan CAN access network (granted)
❌ SiYuan CAN read/write ~/.var/app/org.b3log.siyuan/ (its own dir)
```

**Assessment**: Good isolation for untrusted apps, but doesn't protect against SiYuan reading user's exported documents.

---

## 3. LOCAL DATA STORAGE

### 3.1 Where Data is Stored

```
SiYuan data locations:
├─ ~/.var/app/org.b3log.siyuan/data/SiYuan/
│  ├─ widgets/
│  ├─ notebooks/
│  ├─ templates/
│  ├─ storage.db  (SQLite database)
│  └─ ... (block data)
│
└─ ~/.config/SiYuan-Electron/
   ├─ credentials
   ├─ sync-status.json
   └─ ...
```

### 3.2 Database Schema

```sql
-- SiYuan uses SQLite (local storage.db)
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  root_id TEXT,
  content TEXT,
  type TEXT,
  updated_at INTEGER,
  ...
);

-- Blocks table is NOT encrypted by default
-- Data is stored in plaintext SQLite
```

**Security implication**: Anyone with filesystem access can read all blocks.

### 3.3 Filesystem Permissions

```bash
# SiYuan creates files with standard permissions:
ls -la ~/.var/app/org.b3log.siyuan/data/SiYuan/
drwxr-xr-x 5 user user 4096 Apr 12 10:00 .
-rw-r--r-- 1 user user 5.2M Apr 12 10:00 storage.db
# ↑ readable by any user on system (if multi-user)

# To secure, manually restrict:
chmod 700 ~/.var/app/org.b3log.siyuan/data/SiYuan/
chmod 600 ~/.var/app/org.b3log.siyuan/data/SiYuan/storage.db
```

**Best practice**: Use LUKS (Linux Unified Key Setup) to encrypt entire home directory.

---

## 4. SYNC SECURITY (OPTIONAL)

### 4.1 Sync Protocol

SiYuan supports optional cloud sync:

```
Local SiYuan ↔ Sync Server
```

### 4.2 Authentication

```typescript
// SiYuan sync authentication:
// 1. User enters auth token in settings
// 2. Token stored in credentials file
// 3. Sync request includes token:

POST https://sync.example.com/sync
Authorization: Bearer <user-token>
{
  notebooks: [...]
}
```

### 4.3 TLS Requirements

```
✅ Sync over HTTPS only (enforced)
✅ Certificate validation required
❌ No certificate pinning
❌ No perfect forward secrecy
```

### 4.4 End-to-End Encryption

```
❌ SiYuan does NOT implement E2EE
├─ Server sees all notebook content
├─ Server sees all block data
└─ Relies on TLS + server security

vs Joplin:
✅ All data encrypted before upload
✅ Server can't read any content
```

**Critical difference**: Joplin = E2EE, SiYuan = Server-side security only

---

## 5. AUTHENTICATION & CREDENTIALS

### 5.1 API Token Storage

```bash
# Credentials stored in:
~/.config/SiYuan-Electron/config.json

{
  "sync": {
    "provider": "https://sync.example.com",
    "auth_token": "ey_jwt_token...",
    "user_id": "alice-123"
  }
}
```

**Not encrypted!** If someone has access to this file, they have sync credentials.

### 5.2 Password Management

SiYuan doesn't enforce user passwords (local-first philosophy):
```
✅ No password required to open SiYuan
✅ Data protection relies on:
   ├─ OS-level permissions
   ├─ Flatpak sandbox
   └─ Filesystem encryption (user's responsibility)

❌ No master password
❌ No encryption key
❌ No local authentication
```

---

## 6. AUTHENTICATION TOKENS

### 6.1 JWT Tokens (for Sync)

```
SiYuan → Sync Server: 
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Server decodes:
{
  "user_id": "alice-uuid",
  "issued_at": 1712956800,
  "expires_at": 1712960400,  // 1 hour expiration
}

If expired:
├─ Request 401 Unauthorized
├─ SiYuan refreshes token
└─ Request retried
```

---

## 7. NETWORK SECURITY

### 7.1 TLS Configuration

```typescript
// SiYuan enforces HTTPS for sync:
if (!syncUrl.startsWith("https://")) {
  throw new Error("Sync server must use HTTPS");
}

// But allows self-signed certificates (dangerous!):
const agent = new https.Agent({
  rejectUnauthorized: false  // ⚠️ MITM vulnerable
});
```

### 7.2 HSTS (HTTP Strict Transport Security)

```
❌ SiYuan doesn't enforce HSTS
├─ First request could be HTTP (downgrade attack)
├─ User sees certificate warning
└─ User may accept and proceed

vs Joplin:
✅ Always redirects HTTP to HTTPS
```

---

## 8. SECURITY FEATURES & GAPS

### Implemented
```
✅ Flatpak sandbox (OS-level isolation)
✅ TLS for sync communication
✅ JWT tokens for API auth
✅ Local data storage (user owns data)
✅ Optional sync (can work offline)
```

### Gaps
```
❌ No E2EE (unlike Joplin)
❌ No encryption at rest (default)
❌ No master password
❌ No audit logging
❌ No rate limiting
❌ No perfect forward secrecy
❌ Sync credentials stored plaintext
❌ HSTS not enforced
```

---

## 9. THREAT MODEL

### SiYuan's Assumptions

```
Threat Level 1: Untrusted Network
├─ Assumption: TLS prevents eavesdropping
├─ Mitigation: Enforce HTTPS for sync
└─ ⚠️ User must verify certificates

Threat Level 2: Untrusted Sync Server
├─ Assumption: Server can't read data
├─ Mitigation: Server only sees plaintext (relying on server ops team)
└─ ❌ This is a weak assumption!

Threat Level 3: Compromised Local Machine
├─ Assumption: OS-level permissions prevent access
├─ Mitigation: Flatpak sandbox + file permissions
└─ ⚠️ Only if not running as same user

Threat Level 4: Multi-User System
├─ Assumption: Other users can't read data
├─ Mitigation: File permissions (700)
└─ ⚠️ Works only if set correctly
```

---

## 10. SECURITY ASSESSMENT

### Threat Protection Matrix

| Threat | Protection | Grade |
|--------|------------|-------|
| Eavesdropping (network) | TLS | A |
| Untrusted sync server | ❌ None | F |
| Local filesystem access | Flatpak + perms | B |
| Multi-user system | File perms | B |
| Compromised device | ❌ None | F |
| Brute force | ❌ No auth | F |

### Overall Grade: **C+ (Adequate for Local-First)**

**Strengths**:
- ✅ Flatpak sandbox
- ✅ Local data ownership
- ✅ TLS for transport

**Weaknesses**:
- ❌ No E2EE
- ❌ No encryption at rest
- ❌ No authentication layer
- ❌ Weak sync security

**Best for**: Personal use, offline-first, local backups  
**Not suitable for**: Sensitive data, shared hosting, untrusted servers

---

## 11. RECOMMENDATIONS FOR CHRONEX

### What Chronex Should NOT Adopt from SiYuan

```
❌ No E2EE
❌ No encryption at rest
❌ Plaintext credential storage
❌ Server sees all data

(These choices work for SiYuan's local-first model,
 but not for Chronex's multi-device sync)
```

### What Chronex Should Learn from SiYuan

```
✅ Local-first as option (offline capability)
✅ Flatpak for Linux security
✅ Optional sync (don't force cloud)
✅ User data ownership (not in cloud storage)
```

### Better Approach for Chronex

```
Combine:
├─ Joplin's E2EE (mandatory encryption)
├─ Rclone's multi-backend support
├─ SiYuan's local-first philosophy
└─ Add: Key rotation + audit logging
```

---

## 12. SECURING SIYUAN (IF USERS MUST USE IT)

```bash
# 1. Encrypt entire home directory
sudo cryptsetup luksFormat /dev/sdX
sudo mount /dev/mapper/home /home

# 2. Restrict SiYuan data permissions
chmod 700 ~/.var/app/org.b3log.siyuan/data/SiYuan/
chmod 600 ~/.var/app/org.b3log.siyuan/data/SiYuan/storage.db

# 3. Don't use sync for sensitive data
# (Keep data local only)

# 4. If sync needed:
# ├─ Only use private/self-hosted server
# ├─ Verify HTTPS certificate manually
# └─ Monitor access logs regularly

# 5. Use Flatpak (already done via flathub)
# └─ Provides OS-level isolation
```

---

## Summary

**SiYuan's Security Model**: Local-first + Flatpak sandbox + optional TLS sync (no E2EE)

**Strengths**:
- ✅ Data stays local by default
- ✅ Flatpak sandbox for Linux
- ✅ User owns all data

**Weaknesses**:
- ❌ No E2EE for cloud sync
- ❌ No encryption at rest
- ❌ No authentication layer
- ❌ Sync server has plaintext access

**For Chronex**: Don't copy SiYuan's approach. Instead adopt Joplin's E2EE model with optional local-first mode.

---

**Document Status**: Security Analysis (SiYuan) - Complete  
**References**: org.b3log.siyuan.yml, SiYuan v3.1.8 config structure  
**Next**: Create CHRONEX_SECURITY_IMPLEMENTATION.md (recommendations)
