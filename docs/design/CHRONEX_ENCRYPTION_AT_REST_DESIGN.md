# CHRONEX Encryption at Rest Design

**Design Document Version**: 1.1 (Updated for WebDAV)  
**Date**: 2026-04-13  
**Status**: Approved for v1.0 (mandatory E2EE)  
**References**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md, CHRONEX_API_DESIGN.md, CHRONEX_PERFORMANCE_TARGETS.md

---

## ⚠️ DOCUMENT UPDATE NOTICE

This document has been **UPDATED** with WebDAV context:

**Added Context**:
- ✅ How encryption integrates with WebDAV VFS
- ✅ Client-side encryption before WebDAV PUT
- ✅ Decryption after WebDAV GET
- ✅ ETag calculation on encrypted content

**Unchanged**:
- ✅ AES-256-GCM cipher (still correct)
- ✅ Argon2id key derivation (still correct)
- ✅ Per-block encryption (still correct)
- ✅ Master key management (still correct)
- ✅ Multi-device key exchange (still correct)

---

## 1. ENCRYPTION ARCHITECTURE OVERVIEW

### 1.1 Design Philosophy

```
CHRONEX Security Model = Joplin's Mandatory E2EE
                       + Rclone's Per-Block Encryption  
                       + Improved Key Derivation (Argon2id)

Key Principle: "Strong security with minimal performance impact"

Security guarantees:
├─ Server never has plaintext (E2EE)
├─ Master key never leaves client
├─ Per-block encryption (fine-grained)
├─ No backdoors for government access
└─ User has complete data control
```

### 1.2 Encryption Layers

```
Layer 1: Master Password
├─ User enters: "MySecretPassword123!"
├─ Derivation: Argon2id (not PBKDF2, stronger)
├─ Time cost: 100-200ms on modern CPU
├─ Memory cost: 65MB
└─ Result: Master key (256-bit)

Layer 2: Master Key
├─ Generated: Cryptographically random (32 bytes)
├─ Storage: Encrypted with password-derived key
├─ Device backup: Can export for multi-device setup
└─ Rotation: Optional (manual only)

Layer 3: Block Encryption
├─ Cipher: AES-256-GCM (authenticated encryption)
├─ IV: 96-bit random per block
├─ AAD: block_id || updated_at (detect tampering)
├─ Per-block: Each block has unique IV
└─ Time: 2-5ms per block (background)

Layer 4: Transport (TLS)
├─ All communication: HTTPS only
├─ Certificate pinning: Optional (for paranoid users)
├─ Perfect forward secrecy: Via ephemeral ECDHE
└─ No plaintext ever sent (even in flight)
```

---

## 2. KEY MANAGEMENT

### 2.1 Master Password

```
User creates account: Sets master password

Requirements:
├─ Minimum length: 8 characters
├─ Recommendation: 12+ characters, mix of types
├─ Not stored: Never transmitted to server
├─ Hashed locally: bcryptjs for login validation
└─ Immutable: Cannot change without re-encrypting all blocks

Password validation (client-side):
├─ Entropy check: At least 50 bits of entropy
├─ Common password check: Against common password list
├─ Show strength meter: Weak → Strong
└─ Recommendation: Suggest passphrase (easier to remember)

Example:
├─ ❌ Weak: "password123"
├─ ✅ Good: "coffee-morning-2026"
├─ ✅ Better: "MySecretPassword123!@#"
```

### 2.2 Master Key Generation & Storage

```
On first login:

1. User enters password: "MySecretPassword123!"
2. Derive key from password: Argon2id(password, salt, time=2, mem=65536)
   └─ Result: master_key_derived (256-bit)
   └─ Time: ~150ms (user waits briefly)
3. Generate random master key: crypto.randomBytes(32)
   └─ Result: master_key_random (256-bit)
4. Encrypt master key: AES-256-GCM(master_key_derived, master_key_random)
   └─ Result: encrypted_master_key (sent to server)
5. Keep in memory: master_key_random (in process RAM)

Storage:

Local Device (SQLite):
├─ Table: metadata
├─ Key: "encrypted_master_key"
├─ Value: base64(encrypted_master_key)
└─ Never plaintext (prevents theft if device compromised)

Server:
├─ User table: encrypted_master_key column
├─ Server stores: Encrypted blob
├─ Server cannot decrypt: No password on server
└─ Multi-device: All devices use same master_key_random
```

### 2.3 Password Hashing (Login)

```
Purpose: Authenticate user without knowing password

On account creation:
├─ User password: "MySecretPassword123!"
├─ Hash: bcryptjs.hash(password, salt=10)
├─ Result: $2a$10$... (60 characters)
├─ Storage: users table, password_hash column
└─ Verification time: 100-200ms (intentional slowness)

On login:
├─ User enters: "MySecretPassword123!"
├─ Verify: bcryptjs.compare(entered, stored_hash)
├─ Result: true/false
├─ Brute force protection: 100-200ms per attempt
│  └─ 10,000 attempts/second → 100 seconds minimum
└─ Session token: Issue JWT on successful login

Security properties:
├─ Salt: Unique per user (prevents rainbow tables)
├─ Time cost: 2^10 iterations (2^14 would be slower but acceptable)
├─ Memory: Not memory-hard (only time-hard)
└─ Suitable for: Login authentication (not encryption key derivation)
```

---

## 3. ENCRYPTION WITH WEBDAV (NEW)

### 3.0 WebDAV + Encryption Flow

```
Local Client (Edit Block):

1. User edits block content: "Learn Rust"
2. Local SQLite storage:
   ├─ Generate IV: 12-byte random
   ├─ Encrypt: AES-256-GCM(master_key, content, aad=block_id||updated_at)
   ├─ Auth tag: 16-byte authentication
   ├─ Store encrypted: INSERT into blocks(content_encrypted)
   └─ Time: <5ms

3. WebDAV Sync (to server):
   ├─ Serialize block: JSON with encrypted_content
   ├─ PUT /My%20Notebook/First%20Note.md
   ├─ HTTP Body: Encrypted content (plaintext never sent)
   ├─ Headers: If-Match (for conflict detection)
   └─ Time: Network dependent

Server (WebDAV storage):

1. Receive PUT request
   ├─ Content: Encrypted bytes (server can't read)
   ├─ Check If-Match: Compare ETag
   └─ Update: Store encrypted blob

2. Store in database:
   ├─ content_encrypted: BLOB (server can't decrypt)
   ├─ updated_at: TIMESTAMP (plaintext, for sync)
   ├─ version_vector: JSON (plaintext, for conflict detection)
   └─ Note: Server never sees plaintext

3. Return 204 No Content
   ├─ ETag: FastCDC hash of encrypted content
   └─ Next sync: Check this ETag for conflicts

Other Devices (Multi-device sync):

1. Polling: Detect server change (every 5 minutes)
   ├─ GET /My%20Notebook/First%20Note.md
   ├─ Receive: Encrypted content + ETag
   └─ Time: <100ms

2. Decrypt locally:
   ├─ Decrypt: AES-256-GCM.decrypt(master_key, encrypted_content)
   ├─ Verify: Auth tag (detect tampering)
   ├─ Result: Plaintext "Learn Rust"
   └─ Time: <5ms

3. Update local SQLite:
   ├─ Update blocks table
   ├─ Verify: 3-way merge (if conflict)
   └─ Show: Updated content to user

Privacy Guarantee:
├─ Server never has plaintext (E2EE)
├─ Network: Only encrypted bytes (HTTPS + encryption)
├─ Client: Only client has master key
└─ Result: Server compromise doesn't leak data
```

### 3.0.1 ETag Calculation with Encryption

```
Standard WebDAV uses MD5(content) for ETag.
Chronex uses FastCDC on encrypted content:

Why FastCDC?

1. Content-defined chunking:
   ├─ Similar edits → Similar chunks
   ├─ Encrypted: Very different (due to IV)
   ├─ FastCDC detects similarity despite IV
   └─ Better conflict detection than MD5

2. More stable:
   ├─ Plaintext: Small change = large hash change
   ├─ FastCDC: Small change = similar chunks
   └─ Better for incremental sync

3. Performance:
   ├─ FastCDC: 1-3ms per block
   ├─ MD5: 1-2ms per block (simpler)
   ├─ Trade-off: Slightly slower but better conflict detection
   └─ Acceptable: Still <5ms total for encryption + ETag

Implementation:
├─ encrypted_content = AES-256-GCM(master_key, plaintext)
├─ etag = FastCDC(encrypted_content)
├─ Return: ETag header with etag
└─ Next sync: PUT with If-Match: etag (detect if server version changed)

Example:

Device A:
├─ Encrypts block → ETag: "abc123"
├─ PUTs to server with If-Match: "abc123"
├─ Server accepts (match) → 204 No Content

Device B (mean while):
├─ Already fetched same block → Has ETag: "abc123"
├─ Edits locally
├─ Encrypts different plaintext → ETag: "xyz789"
├─ PUTs to server with If-Match: "abc123"
├─ Server rejects (no match, now "abc123") → 412 Precondition Failed
├─ Client detects conflict
├─ Decrypts both versions (server's + local)
├─ Performs 3-way merge
└─ Re-encrypts merged result → New ETag
```

---

## 4. BLOCK ENCRYPTION DETAILS

### 3.1 Encryption Algorithm: AES-256-GCM

```
Why AES-256-GCM?

From reference analysis:
├─ Joplin: Uses AES-256-GCM ✅
├─ Rclone: Uses XSalsa20-Poly1305 (also strong)
└─ CHRONEX: AES-256-GCM (more common, wider support)

AES-256-GCM Properties:
├─ Algorithm: Advanced Encryption Standard
├─ Key size: 256 bits (very strong)
├─ Mode: Galois/Counter Mode (authenticated)
├─ IV: 96 bits (128 bits also ok, 96 is standard)
├─ Auth tag: 128 bits (detects tampering)
├─ Speed: 3-5 GB/s (on modern CPUs with AES-NI)
└─ Hardware: AES-NI acceleration on all modern CPUs

Security level:
├─ Theoretical: 2^256 brute force (impossible)
├─ Practical: No known attacks
├─ NIST approved: Yes (SP 800-38D)
└─ Recommendation: Safe to use until 2050+ (post-quantum: use PQC when available)
```

### 3.2 Per-Block Encryption

```
Each block is encrypted independently:

Block Data:
{
  "id": "uuid-block-001",
  "parent_id": "uuid-parent",
  "type": "paragraph",
  "content": "Learn Rust programming language",
  "created_at": 1712956800000,
  "updated_at": 1712956810000,
  "version_vector": {"device-A": 100}
}

Encryption process:

1. Serialize to JSON: plaintext = JSON.stringify(block_data)
   └─ Size: ~200 bytes (typical)

2. Generate IV: iv = crypto.randomBytes(12)
   └─ 96 bits, unique per encryption
   └─ Stored in database (ok to be public)

3. Encrypt: 
   ├─ ciphertext = AES256GCM.encrypt(
   │    key=master_key,
   │    plaintext=plaintext,
   │    iv=iv,
   │    aad=block_id || updated_at
   │  )
   └─ Additional Authenticated Data: Prevents tampering with metadata

4. Auth tag:
   ├─ Generated during encryption
   ├─ Detects if ciphertext was modified
   └─ 128 bits (16 bytes)

5. Store: database INSERT
   {
     "content_encrypted": base64(iv || ciphertext || auth_tag),
     "content_iv": base64(iv),
     "content_tag": base64(auth_tag)
   }

Decryption process (reverse):

1. Fetch: SELECT content_encrypted FROM blocks WHERE id = ?
2. Parse: plaintext = AES256GCM.decrypt(master_key, ciphertext, aad)
3. Verify auth tag: (automatic in GCM)
   └─ If verification fails: Abort, data corrupted
4. Deserialize: block_data = JSON.parse(plaintext)
5. Use: Display to user
```

### 3.3 Encryption Performance

```
Performance impact (from Phase A4 analysis):

Per-block encryption:
├─ 5 KB plaintext block
├─ Encryption time: 2-5ms
├─ Decryption time: 2-5ms
├─ Overhead: 28 bytes (IV + auth tag)
└─ CPU: <1% on typical CPU during sync

Scaling:

Encrypt 100 blocks:
├─ Sequential: 100 × 3ms = 300ms (still fast)
├─ Parallel (4 threads): 300ms / 4 = 75ms
└─ CPU: 4 cores × 25% = 100% (max usage)

Encrypt 1000 blocks (bulk import):
├─ Sequential: 1000 × 3ms = 3 seconds
├─ Parallel (8 threads): 3s / 8 = 375ms
└─ CPU: 8 cores × 50% = 400% (all cores busy)

Optimization:
├─ Use parallel encryption for large batches
├─ Keep single-threaded for local edits (<50ms debounce)
├─ Trade-off: Performance vs responsiveness
```

---

## 5. KEY DERIVATION: ARGON2ID

### 4.1 Why Argon2id (Not PBKDF2)?

```
PBKDF2 (Joplin uses):
├─ Time cost: 1000 iterations
├─ Memory: Minimal (~1 KB)
├─ Speed: ~50ms per derivation
└─ Weakness: GPU/ASIC parallelizable (easier to crack)

Argon2id (CHRONEX uses):
├─ Time cost: 2 iterations
├─ Memory: 65 MB
├─ Speed: ~150ms per derivation
├─ Strength: Memory-hard (impossible to GPU crack)
└─ Recommendation: Modern standard (RFC 9106)

Comparison:

PBKDF2 vs GPU:
├─ GPU speed: 10,000× faster than CPU
├─ Password space: 10^50
├─ Time to crack: 10^50 / (10,000 × 50ms) = 2 × 10^42 seconds (impossible)

Argon2id vs GPU:
├─ GPU speed: 100× faster than CPU (due to memory wall)
├─ Time to crack: 10^50 / (100 × 150ms) = 6 × 10^45 seconds (impossible)
└─ 1000× stronger than PBKDF2!
```

### 4.2 Argon2id Parameters

```
CHRONEX settings:

argon2id(
  password: user_password,
  salt: random_16_bytes,
  time_cost: 2,         // Number of passes (iterations)
  memory_cost: 65536,   // 65 MB RAM
  parallelism: 1,       // Single threaded (for deterministic behavior)
  hash_length: 32       // 256 bits output
)

Parameter justification:

time_cost = 2:
├─ Higher values → more secure but slower
├─ On modern CPU (2-3 GHz): 100-150ms
├─ User tolerance: 100-200ms is acceptable (on login only)
├─ If slower desired: Increase to 3-4 (300-400ms, still acceptable)

memory_cost = 65536:
├─ Higher values → more memory, harder to GPU attack
├─ 65 MB is:
│  ├─ Small enough for mobile (<500 MB available)
│  ├─ Large enough for GPU attack prevention
│  └─ Industry standard (same as Ruby on Rails bcrypt)

parallelism = 1:
├─ Multi-threaded: Could speed up derivation
├─ Single threaded: Deterministic (same password = same key)
├─ Needed for: Multi-device key sharing
└─ Trade-off: Slower but consistent across devices
```

### 4.3 Implementation

```python
import argon2

# On password creation/reset
password = input("Enter master password: ")
salt = os.urandom(16)  # Random 16-byte salt

# Derive key
ph = argon2.PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 65 MB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

master_key_derived = ph.hash(password)
# Result: $argon2id$v=19$m=65536,t=2,p=1$salt$hash

# On login (later)
verify_result = ph.verify(master_key_derived, entered_password)
# Result: True/False

# Multi-device setup
# Device A: Derives master_key_derived from password
# Device B: Derives same master_key_derived (same password, same salt)
# Both devices can decrypt master_key_random (sent by server)
# Result: Seamless multi-device support
```

---

## 6. MULTI-DEVICE MASTER KEY EXCHANGE

### 5.1 How Joplin Does It

```
Device 1 (established):
├─ Has password: "MySecretPassword123!"
├─ Has master_key_random: 32-byte key
├─ Encrypted storage: encrypted_master_key on server

Device 2 (new):
├─ No key yet
├─ User enters password (same): "MySecretPassword123!"

Process:

1. Device 1 encrypts master_key_random:
   └─ encrypted = AES256GCM(derived_key, master_key_random)
   └─ Sends to server (stored in users.encrypted_master_key)

2. Device 2 requests master_key:
   ├─ POST /api/master-key-exchange
   ├─ Password: "MySecretPassword123!"
   ├─ Server responds: encrypted_master_key blob

3. Device 2 decrypts:
   ├─ master_key_derived = Argon2id(password, salt)
   ├─ master_key_random = AES256GCM.decrypt(master_key_derived, encrypted_master_key)
   ├─ Now has same master_key_random as Device 1!
   └─ Can decrypt all blocks

Result:
├─ Same password → Same master_key_random → Same encryption key
├─ No key transmission (only encrypted blob)
└─ Seamless multi-device experience
```

### 5.2 Security Properties

```
Why this is secure:

1. Password never transmitted:
   ├─ Only used locally for key derivation
   ├─ Server never sees password
   └─ No plaintext transmission

2. Master key never transmitted:
   ├─ Only encrypted_master_key sent
   ├─ Server stores encrypted blob
   ├─ Even if server compromised: Blob is useless without password
   └─ No plaintext transmission

3. Each device can independently:
   ├─ Derive same master_key_derived from password
   ├─ Decrypt the encrypted_master_key blob
   ├─ Get master_key_random
   └─ Decrypt all blocks

4. Security against server compromise:
   ├─ Attacker gets encrypted_master_key
   ├─ Attacker tries to crack password (from encrypted blob)
   ├─ Time cost: Argon2id at 150ms per attempt
   ├─ 10 billion attempts: 1.5 × 10^9 seconds = 47 years!
   └─ Practically impossible (password entropy assumed >50 bits)
```

---

## 7. KEY ROTATION (FUTURE)

### 6.1 Key Rotation Strategy

```
Current (v1.0): No key rotation
├─ Master key: Tied to password
├─ Password change: Not supported
└─ Risk: If password compromised, data compromised forever

Future (v2.0): Optional key rotation
├─ User changes password
├─ Derive new master_key_derived
├─ Re-encrypt all blocks with new key
├─ Time: ~10 seconds for 10k blocks
└─ Frequency: Every 1-2 years (recommendation)

Implementation:

1. User requests password change
2. Verify old password
3. Generate new Argon2id-derived key
4. Re-encrypt all blocks:
   ├─ Fetch each block
   ├─ Decrypt with old key
   ├─ Re-encrypt with new key
   ├─ Update database
   └─ Total: 1000 blocks × 5ms = 5 seconds
5. Update server: encrypted_master_key (new)
6. Send to all other devices (they re-download)

User experience:
├─ "Change password" button in settings
├─ Shows progress: "3000 / 10000 blocks encrypted"
├─ Estimated time: 50 seconds
└─ No data loss (background encryption)
```

### 6.2 Forward Secrecy (Session Keys)

```
Not implemented in v1.0, but possible future improvement:

Current (Master key same for all blocks, all time):
├─ One key compromise → All blocks compromised
└─ Risk: If master key stolen, all data lost

Session keys (future):
├─ Derive session_key from master_key + timestamp + block_id
├─ Each block has unique derived key
├─ block_key = HKDF(master_key, block_id || timestamp)
├─ Compromise one session key → Only affects that block
└─ Much stronger security (but slower)

Trade-off:
├─ Security: 100x stronger
├─ Performance: ~10x slower
└─ Decision: Defer to v2.0 (only if needed by enterprise)
```

---

## 8. ENCRYPTION ERROR HANDLING

### 7.1 Decryption Failures

```
Scenarios:

1. Wrong Master Key:
   ├─ User logged in with wrong password (unlikely)
   ├─ Block decrypt fails: Auth tag doesn't match
   ├─ Error message: "Decryption failed - check password"
   ├─ Recovery: Log out, log in with correct password
   └─ Action: Don't modify data (data is safe)

2. Corrupted Ciphertext:
   ├─ Block data corrupted (database bug, disk error)
   ├─ Auth tag verification fails
   ├─ Error message: "Data corrupted - please restore from backup"
   ├─ Recovery: Restore from backup (server has copy)
   └─ Action: Mark block as corrupted, skip

3. Metadata Tampering:
   ├─ Attacker modifies block_id or updated_at
   ├─ AAD verification fails
   ├─ Error message: "Data integrity check failed"
   ├─ Recovery: Restore from backup
   └─ Action: Mark block as tampered, skip

Handling:
├─ Silent failure: Don't crash app
├─ Log error: For debugging
├─ Show UI: "Block data unavailable - restore from backup"
├─ Recovery: User can restore from server backup
└─ Data safety: Nothing is lost (backup exists)
```

### 7.2 Master Key Loss

```
Scenario: User forgets password

Chronex policy: "No recovery without password"
├─ Reason: E2EE means no backdoor access
├─ Unlike cloud services: Chronex can't recover your password
├─ User data: Stays encrypted forever (secure by design)

User options:

1. Try password recovery:
   ├─ If email account compromised: Can reset via email
   ├─ If email account safe: Cannot recover (by design)
   └─ Suitable for: Most users

2. Restore from backup:
   ├─ If user made encrypted backup: Not possible (same password)
   ├─ If user saved .db file: Not accessible without password
   └─ Suitable for: None (no recovery from encrypted backup)

3. Start fresh:
   ├─ Create new account with new password
   ├─ Re-import from Markdown export (if available)
   ├─ Lose encrypted data (but gain new password)
   └─ Suitable for: Users who accept data loss risk

Recommendation:
├─ "Don't forget your password"
├─ Use password manager (Bitwarden, 1Password)
├─ Test password recovery regularly
└─ This is the trade-off for E2EE security
```

---

## 9. IMPLEMENTATION ROADMAP

### v1.0 (MVP)

```
Features:
├─ Argon2id for password derivation
├─ AES-256-GCM for block encryption
├─ Per-block encryption (fine-grained)
├─ bcryptjs for password hashing (login)
├─ No key rotation (password change = account reset)
└─ No multi-device yet (local encryption only)

Scope: Personal users, single device
Performance: 2-5ms per block encryption (acceptable)
```

### v1.5 (Multi-Device)

```
Features (new):
├─ Multi-device master key exchange
├─ Same password → Same encryption key
├─ All devices can decrypt same blocks
└─ Server stores encrypted_master_key (per user)

Performance: Same as v1.0 (no change)
Scope: Professional users, multiple devices
```

### v2.0 (Advanced)

```
Features (future):
├─ Password change = Key rotation
├─ Session keys (derived per block)
├─ Perfect forward secrecy (experimental)
├─ Post-quantum cryptography (when standardized)
└─ Key backup/escrow (optional, for recovery)

Scope: Enterprise, highest security
```

---

## 10. COMPLIANCE & STANDARDS

### 9.1 Cryptographic Standards

```
CHRONEX follows:
├─ NIST SP 800-38D (AES-GCM specification)
├─ RFC 9106 (Argon2 specification)
├─ OWASP Guidelines (password storage)
├─ FIPS 140-2 (when using approved libraries)
└─ No government backdoors (E2EE design)

Approved algorithms:
├─ AES-256: ✅ NIST approved, no known attacks
├─ Argon2id: ✅ Modern standard, memory-hard
├─ bcryptjs: ✅ Industry standard, slow (intentionally)
└─ HMAC-SHA256: ✅ NIST approved

NOT used:
├─ DES: ❌ Too weak (56-bit)
├─ MD5: ❌ Broken (collision attacks)
├─ SHA1: ❌ Deprecated (collision found)
├─ RC4: ❌ Broken (keystream bias)
└─ Plaintext passwords: ❌ Never (always hashed)
```

### 9.2 GDPR Compliance

```
Chronex position on data privacy:

Data location:
├─ Client: User controls (stored locally)
├─ Server: User data (encrypted, user owns decryption key)
└─ Right to delete: User can delete locally or via server

GDPR articles:

Art. 32 (Security):
├─ Encryption at rest: ✅ AES-256-GCM
├─ Encryption in transit: ✅ HTTPS with TLS 1.2+
├─ Access control: ✅ Password + JWT tokens
└─ Audit logging: ✅ Server logs (server-side only)

Art. 34 (Data breach notification):
├─ Breached data: Cannot be decrypted (E2EE)
├─ Notification: Only if server infrastructure compromised
└─ User risk: Minimal (data is encrypted)

Right to Data Portability (Art. 20):
├─ Export data: User can export encrypted blocks
├─ Format: JSON with encrypted content
├─ Decryption: Only user has master key
└─ Portability: User can import to another Chronex instance
```

---

## Summary

**CHRONEX Encryption**: Mandatory E2EE with Argon2id-derived keys + WebDAV integration

**Key Principles**:
- ✅ AES-256-GCM (NIST approved, no known attacks)
- ✅ Argon2id key derivation (memory-hard, GPU-resistant)
- ✅ Per-block encryption (fine-grained, 2-5ms overhead)
- ✅ Master key never leaves client (E2EE guarantee)
- ✅ Multi-device: Same password → Same key
- ✅ WebDAV transport: Client encrypts before PUT, decrypts after GET
- ✅ Server-side: Only sees ciphertext (never plaintext)

**Security SLOs**:
- Master key derivation: 100-200ms (acceptable on login)
- Block encryption: <5ms per block (background)
- WebDAV encryption overhead: <10ms (encryption + HTTP)
- Password strength: >50 bits entropy (recommended)
- Brute force time: >47 years (2^50 attempts at 150ms each)

**Compliance**:
- NIST SP 800-38D ✅
- RFC 9106 (Argon2) ✅
- RFC 4918 (WebDAV) ✅
- OWASP password storage ✅
- GDPR Article 32 ✅

---

**Document Status**: Updated with WebDAV Encryption Integration  
**Primary Reference**: CHRONEX_WEBDAV_DUAL_MODE_ARCHITECTURE.md  
**Protocol**: WebDAV (RFC 4918) + E2EE  
**Next**: CHRONEX_SEARCH_STRATEGY_DESIGN.md (low priority, mostly valid)
