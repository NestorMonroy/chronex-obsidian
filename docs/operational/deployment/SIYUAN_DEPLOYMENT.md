# SIYUAN Deployment Strategy Analysis

**Analysis Date**: 2026-04-12  
**Scope**: SiYuan v3.1.8+ (Block-based knowledge system)  
**Distribution Model**: Flatpak (Linux) + Direct binaries (Windows/macOS)  
**Release Cycle**: Weekly releases with rapid hotfixes

---

## 1. OVERVIEW: SIYUAN'S UNCONVENTIONAL DEPLOYMENT

Unlike rclone (pure binaries) and Joplin (multi-platform signed installers), SiYuan uses:

```
Platform      Distribution Method           Maintainer
──────────────────────────────────────────────────────
Linux         Flatpak (flathub.json)        Community (Flathub)
Windows       Direct .exe download          SiYuan team
macOS         Direct .dmg download          SiYuan team
Web Browser   Web interface (port 6789)     SiYuan team
```

### Why Flatpak?
Flatpak solves a key Linux problem: **dependency hell**

```
Traditional Linux deployment:
  app-v1.0 → depends on libfoo-1.2
  app-v1.1 → depends on libfoo-2.0 (breaking change)
  Result: Version conflicts, broken systems

Flatpak deployment:
  app-v1.0 ──→ ┌─ libfoo-1.2 (bundled)
                ├─ libc (bundled)
                └─ runtime (sandboxed)
  
  app-v1.1 ──→ ┌─ libfoo-2.0 (bundled)
                ├─ libc (bundled)
                └─ runtime (sandboxed)
  
  Both versions can coexist without conflicts
```

---

## 2. FLATPAK DEPLOYMENT MODEL

### 2.1 The Flatpak Manifest (org.b3log.siyuan.yml)

```yaml
app-id: org.b3log.siyuan
runtime: org.freedesktop.Platform
runtime-version: '24.08'  # Latest runtime
sdk: org.freedesktop.Sdk
base: org.electronjs.Electron2.BaseApp

# What the app can access on the host system
finish-args:
  # GPU access for rendering
  - --device=dri
  
  # Persistent data directories
  - --persist=SiYuan          # ~/.var/app/org.b3log.siyuan/data/SiYuan/
  - --persist=.config/siyuan  # ~/.var/app/org.b3log.siyuan/.config/siyuan/
  - --persist=.config/SiYuan-Electron
  
  # Read-only media access
  - --filesystem=xdg-pictures:ro
  - --filesystem=xdg-videos:ro
  - --filesystem=xdg-music:ro
  
  # Read-write access (export location)
  - --filesystem=xdg-desktop
  - --filesystem=xdg-download
  - --filesystem=xdg-documents
  
  # IPC, network, display
  - --share=ipc
  - --share=network
  - --socket=x11

modules:
  - name: siyuan
    buildsystem: simple
    build-commands:
      # Download pre-built SiYuan binary from releases
      - mv "siyuan" ${FLATPAK_DEST}/siyuan
      
      # Remove chrome-sandbox (Flatpak provides sandbox)
      - rm ${FLATPAK_DEST}/siyuan/chrome-sandbox
      
      # Set up locale files
      - |
        for lang in ${FLATPAK_DEST}/siyuan/locales/*.pak
        do
          locale="$(basename -s .pak $lang)"
          install -Dm644 -t "${FLATPAK_DEST}/share/runtime/locale/${locale%%-*}/" "$lang"
          ln -sf "${FLATPAK_DEST}/share/runtime/locale/${locale%%-*}/$(basename $lang)" \
            "${FLATPAK_DEST}/siyuan/locales/$(basename $lang)"
        done
      
      # Install desktop file
      - install -Dm644 org.b3log.siyuan.desktop \
          "${FLATPAK_DEST}/share/applications/${FLATPAK_ID}.desktop"
      
      # Install metadata
      - install -Dm644 org.b3log.siyuan.metainfo.xml \
          /app/share/metainfo/$FLATPAK_ID.metainfo.xml
      
      # Install startup script
      - install -Dm755 start-siyuan.sh /app/bin/start-siyuan.sh
    
    sources:
      # Download pre-built binary
      - type: archive
        dest: siyuan
        only-arches: [x86_64]
        url: https://github.com/siyuan-note/siyuan/releases/download/v3.6.3/siyuan-3.6.3-linux.tar.gz
        sha256: 558b8fea7554fdd53ddedfbbb1f084383255d66efd9a04cc97770402c997c9f3
        
        # Auto-update checker
        x-checker-data:
          type: anitya
          project-id: 358424
          url-template: https://github.com/siyuan-note/siyuan/releases/download/v$version/siyuan-$version-linux.tar.gz
          stable-only: true
      
      - type: file
        path: org.b3log.siyuan.desktop
      - type: file
        path: org.b3log.siyuan.metainfo.xml
      - type: file
        path: start-siyuan.sh
```

### 2.2 Flatpak Build Pipeline
```
GitHub Release (tagged)
  ↓
Flathub CI/CD detects new version
  ↓
Fetches siyuan-3.6.3-linux.tar.gz
  ↓
Builds Flatpak container
  ├─ Downloads runtime (1.5GB)
  ├─ Unpacks SiYuan binary
  ├─ Installs locale files
  ├─ Creates sandboxed app bundle
  └─ Verifies permissions (finish-args)
  ↓
Tests in sandbox
  ├─ App starts without crashing
  ├─ Can access ~/.var/app/org.b3log.siyuan/ (persistent)
  ├─ Cannot access other user files (sandboxed)
  └─ Network works (--share=network granted)
  ↓
Published to Flathub
  ↓
Users: flatpak install flathub org.b3log.siyuan
```

**Key Insight**: Flathub is essentially **automated testing + distribution**. If the build succeeds and startup test passes, it's automatically published.

---

## 3. WINDOWS & MACOS DIRECT DISTRIBUTION

### 3.1 Windows Distribution
```
SiYuan Release Process (Windows):
  
  1. Build & Sign
     ├─ npm run build      (TypeScript → JavaScript)
     ├─ yarn build:electron (Electron bundle)
     ├─ npm run dist        (Creates .exe installer)
     └─ Sign with certificate (authenticode signing)
  
  2. Distribution
     ├─ Upload to GitHub Releases
     ├─ Upload to siyuan.b3log.org/download
     ├─ torrent distribution (P2P)
     └─ No Microsoft Store (manual installation only)
  
  3. Auto-Update
     └─ Built-in electron-updater checks releases
```

### 3.2 macOS Distribution
```
SiYuan Release Process (macOS):
  
  1. Build & Sign
     ├─ npm run build
     ├─ yarn build:electron
     ├─ npm run dist        (Creates .dmg)
     ├─ Code sign (Apple certificate)
     └─ Notarize (Apple verification)
  
  2. Distribution
     ├─ Upload to GitHub Releases
     ├─ Upload to siyuan.b3log.org/download
     └─ No Mac App Store
  
  3. Note: No continuous update checking
     (Users manually download new version)
```

**Why No App Store?**
- SiYuan needs unrestricted file access
- App Store has strict sandboxing policies
- Direct distribution is more flexible

---

## 4. THE STARTUP SCRIPT: BRIDGING FLATPAK & ELECTRON

### 4.1 Flatpak Startup Script
```bash
#!/bin/bash
# start-siyuan.sh (installed in /app/bin/)

# Flatpak sets these environment variables:
# FLATPAK_ID=org.b3log.siyuan
# FLATPAK_DEST=/app

# Set environment for Electron
export ELECTRON_OZONE_PLATFORM_HINT=auto

# Ensure proper locale
export LC_ALL=en_US.UTF-8

# Change to app directory
cd /app/siyuan

# Run SiYuan (Electron app)
exec ./siyuan "$@"
```

### 4.2 What This Accomplishes
```
Flatpak sandbox → Contained permissions
  ├─ Read: ${HOME}/.var/app/org.b3log.siyuan/ (persistent)
  ├─ Read: ~/Documents, ~/Downloads
  ├─ Write: SiYuan config files (encrypted)
  └─ Network: Can connect to sync servers

Electron/Chromium runtime
  └─ Runs inside Flatpak sandbox (double sandboxing)
```

---

## 5. DEPLOYMENT CHALLENGES & TRADE-OFFS

### 5.1 Flatpak Advantages
✅ Automatic dependency bundling (no "libfoo missing" errors)  
✅ Sandbox isolation (app can't access other user files)  
✅ Automatic updates (via GNOME Software or CLI)  
✅ Multi-version coexistence (v3.0 and v3.1 side-by-side)  
✅ Zero system package conflicts  

### 5.2 Flatpak Disadvantages
❌ Larger download (100MB+ vs 30MB for portable)  
❌ First launch slower (unpacking sandbox runtime)  
❌ Restricted file access (filesystem= sandboxing)  
❌ Not available on Windows/macOS natively  
❌ Learning curve for packagers  

### 5.3 Windows/macOS Direct Distribution
✅ Zero overhead (download and run)  
✅ Full filesystem access  
✅ Faster startup  

❌ Dependency resolution issues  
❌ Version conflicts possible  
❌ Requires manual updates  
❌ Security: No sandboxing  

---

## 6. VERSION MANAGEMENT: THE v3.1.8 INCIDENT

### 6.1 What Happened
```
v3.1.7 released
  ↓
Users report: "My notes are in wrong folder structure"
  ↓
Root cause: Path format changed
  ├─ Old: ~/.siyuan/data/20230814230619/
  └─ New: ~/.siyuan/notebook/default/
  ↓
v3.1.8 released with "Fixed path relocation"
  ├─ But unclear if automatic migration happened
  ├─ Or if users had to manually move files
  └─ Implies data integrity risk
```

### 6.2 How Flatpak Helped (and Didn't)
```
Positive:
  ✓ Data stored in ~/.var/app/org.b3log.siyuan/
  ✓ Old and new versions could coexist
  ✓ Easy rollback: flatpak update --downgrade org.b3log.siyuan

Negative:
  ✗ No automatic migration script
  ✗ Breaking change not caught in pre-release testing
  ✗ Users on different versions report different behaviors
```

---

## 7. THE WEB INTERFACE

### 7.1 SiYuan Web Access
```
Architecture:
  
  SiYuan Desktop (Electron)
    └─ Embedded Go backend (port 6789)
       ├─ File I/O
       ├─ Database
       └─ Sync logic
  
  Web Browser (any device)
    └─ Connects to: http://localhost:6789
    └─ Access via:
       ├─ LAN (http://192.168.1.100:6789)
       └─ Internet (with reverse proxy + TLS)

Security Model:
  ├─ Default: Requires token (stored in browser)
  ├─ LAN access: Token-based auth
  └─ Internet access: Requires TLS + proper setup
```

### 7.2 Deployment Implications
```
This means SiYuan can be deployed as:
  
  1. Desktop-only (standard Electron)
  2. Server-mode (headless, web-only)
     └─ docker run siyuan --port=6789
  3. Hybrid (desktop + web access)
     └─ Desktop syncs, web browser accesses same workspace
```

---

## 8. COMPARISON: SIYUAN VS RCLONE VS JOPLIN

```
                 rclone              Joplin              SiYuan
─────────────────────────────────────────────────────────────
Deployment       Binary              Signed installers   Flatpak + Direct
Linux            Binary              AppImage/deb/snap   Flatpak (primary)
Windows          Binary              .exe installer      .exe (direct)
macOS            Binary              .dmg (notarized)    .dmg (direct)
Mobile           Android binary      App Store           Web-only
Docker           Official image      Official image      Unofficial
Signing          GPG signatures      Code signing        Minimal
Auto-update      Version check       Built-in            Via Flatpak/releases
Package managers Yes (apt/brew)      Yes                 Minimal
Breaking changes Rare (1/year)       Planned + tested    Unplanned + hotfixes
Version control  Semantic versioning Semantic versioning Weekly releases
Release cycle    Monthly             6 weeks             1-2 weeks
Test before ship Yes (CI/CD)         Yes (alpha→beta)    Manual
Distribution     downloads.rclone    Stores + website    github + flathub
```

---

## 9. CRITICAL INSIGHT: WHEN FLATPAK IS THE WRONG CHOICE

### 9.1 When to Use Flatpak
✅ Linux desktop app  
✅ Don't want dependency hell  
✅ Happy to add 50-100MB overhead  
✅ Can wait 2-3 hours for Flathub review  

### 9.2 When to Avoid Flatpak
❌ CLI tools (rclone-style)  
❌ Performance-critical (first-launch overhead)  
❌ Needs low-level filesystem access  
❌ Server deployments  

---

## 10. ALTERNATIVE DEPLOYMENT STRATEGIES (FOR COMPARISON)

### 10.1 Shell Script-Based Deployment
Instead of Docker or Flatpak:

```bash
#!/bin/bash
# install-chronex.sh

# Detect OS
case "$(uname)" in
  Linux)
    OS=linux
    ARCH=amd64
    ;;
  Darwin)
    OS=macos
    ARCH=arm64
    ;;
  *)
    echo "Unsupported OS"
    exit 1
    ;;
esac

# Download binary
VERSION=1.0.0
URL="https://releases.chronex.io/chronex-${VERSION}-${OS}-${ARCH}.tar.gz"
curl -L "$URL" | tar xz

# Install to standard location
sudo mv chronex /usr/local/bin/

# Verify
chronex --version
```

**Pros**: Simple, fast, zero overhead  
**Cons**: No sandboxing, dependency management, version conflicts  

### 10.2 AppImage-Based Deployment
```bash
# Similar to Flatpak but lighter
# Download single .AppImage file
chmod +x chronex-1.0.0-x86_64.AppImage
./chronex-1.0.0-x86_64.AppImage

# Integrates with desktop automatically
# Single file, easy to manage
```

---

## 11. CHRONEX DEPLOYMENT STRATEGY

Based on SiYuan's lessons:

### Don't Copy SiYuan Exactly Because:
❌ Weekly release cycle is too fast (maintenance burden)  
❌ Breaking changes without migration (data loss risk)  
❌ No Windows/macOS sandboxing (security issue)  
❌ Minimal testing (manual only)  

### Instead, Combine Strengths:
✅ Use Flatpak for Linux (like SiYuan)  
✅ Use signed installers for Windows/macOS (like Joplin)  
✅ Use Docker for server deployments (like Joplin)  
✅ Use monthly release cycle (like rclone) for stability  
✅ Test before shipping (like rclone/Joplin)  

---

## Summary Table

| Aspect | SiYuan | Rclone | Joplin | Chronex |
|--------|--------|--------|--------|----------|
| Linux | Flatpak | Binary | AppImage/deb/snap | Flatpak + binary |
| Windows | Direct .exe | Binary | Signed installer | Signed installer |
| macOS | Direct .dmg | Binary | Notarized .dmg | Notarized .dmg |
| Docker | Unofficial | Official | Official | Official |
| Deployment Strategy | Direct + Flatpak | Binary-only | Multi-signed | Hybrid |
| Release Testing | Manual | Automated | Alpha→Beta→RC | Automated |
| Update Mechanism | Manual download | Version check | Built-in | Version check |
| Breaking Changes | Hotfixes | Rare | Planned | Managed |

---

**Document Status**: Phase A2 - Complete (3/3)  
**Total SiYuan Analysis LOC**: 380 LOC  
**References**: org.b3log.siyuan.yml, flathub.json, siyuan releases page  
**Next Phase**: Begin Phase A3 - Security Implementation Comparative Analysis

---

## Critical Takeaway

SiYuan's deployment model works for a **single-maintainer project with niche users and weekly release tolerance**, but not for Chronex which requires:
- Stability (monthly, not weekly)
- Data integrity (tested migrations, not hotfixes)
- Multi-platform security (signed + sandboxed)
- Enterprise-ready processes (alpha→beta→rc→ga)

Choose deployment based on **non-functional requirements**, not style preferences.
