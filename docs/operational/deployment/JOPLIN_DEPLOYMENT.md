# JOPLIN Deployment Strategy Analysis

**Analysis Date**: 2026-04-12  
**Scope**: Joplin v2.10+ (Cross-platform note-taking system)  
**Distribution Model**: Desktop (Windows/macOS/Linux), Mobile (iOS/Android), Server (Docker), Web  
**Release Cycle**: 6-week cycles with alpha/beta testing

---

## 1. OVERVIEW: JOPLIN'S POLYGLOT DEPLOYMENT

### The Multi-Platform Challenge
Unlike rclone (pure binary), Joplin must deploy to:

```
Platform          Runtime              Distribution Method
─────────────────────────────────────────────────────────
Windows Desktop   Electron + Node      .exe installer (NSIS)
macOS Desktop     Electron + Node      .dmg + Code Signing (notarization)
Linux Desktop     Electron + Node      .AppImage + Snap + Flatpak
iOS              React Native         App Store (TestFlight → Release)
Android          React Native         Google Play Store (Beta → Release)
Server           Node.js              Docker image → Container registry
Web              React PWA            Static S3 bucket → CloudFront
```

### Shared Infrastructure Problem
All platforms share:
- Core sync engine (TypeScript)
- Database schema (multiple migrations)
- API contracts (breaking changes affect all)
- Dependency updates (security patches everywhere)

**Solution**: Monorepo with workspace-aware CI/CD

---

## 2. MONOREPO STRUCTURE & BUILD STRATEGY

### 2.1 Workspace Organization
```
joplin/
├─ packages/
│  ├─ app-cli/              # Node.js CLI
│  │  └─ package.json
│  ├─ app-desktop/          # Electron app
│  │  ├─ package.json
│  │  └─ build/             # Electron builder config
│  ├─ app-mobile/           # React Native (iOS+Android)
│  │  ├─ package.json
│  │  ├─ android/
│  │  └─ ios/
│  ├─ app-web/              # React web app
│  │  └─ package.json
│  ├─ server/               # Node.js backend
│  │  ├─ package.json
│  │  └─ src/
│  ├─ lib/                  # Shared library (encryption, sync)
│  │  └─ package.json
│  └─ renderer/             # Markdown/HTML rendering
│      └─ package.json
└─ package.json (root - declares workspaces)
```

### 2.2 Workspace-Aware Build System
```json
// joplin/package.json
{
  "workspaces": [
    "packages/app-cli",
    "packages/app-desktop",
    "packages/app-mobile",
    "packages/server",
    "packages/lib",
    "packages/renderer"
  ],
  
  "scripts": {
    "build": "yarn workspaces foreach run build",
    "build:desktop": "yarn workspace @joplin/app-desktop run build",
    "build:mobile": "yarn workspace @joplin/app-mobile run build",
    "build:server": "yarn workspace @joplin/server run build",
    "publish:all": "yarn workspaces foreach run publish"
  }
}
```

**Benefit**: Shared yarn.lock file prevents version conflicts across packages.

---

## 3. DESKTOP DEPLOYMENT: MULTI-OS DESKTOP APPS

### 3.1 Electron Builder Configuration
```javascript
// packages/app-desktop/build/builder.yml
appId: 'net.cozic.joplin'
productName: 'Joplin'
files:
  - '!**/*.test.ts'
  - '!**/*.map'

directories:
  buildResources: '../assets'

win:  # Windows
  certificateFile: ./signing/cert.pfx
  certificatePassword: ${WINDOWS_SIGN_CERT_PASSWORD}
  target:
    - nsis
    - portable  # Also build standalone .exe
  signingHashAlgorithms: [sha256]

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createStartMenuShortcuts: true
  createDesktopShortcut: true

mac:  # macOS
  certificateFile: ./signing/macos.p12
  certificatePassword: ${MACOS_SIGN_CERT_PASSWORD}
  hardenedRuntime: true
  gatekeeperAssess: false
  target:
    - dmg
    - zip
  identity: 'Joplin <identity>'
  notarize:
    teamId: ${APPLE_TEAM_ID}
    appleId: ${APPLE_ID}
    appleIdPassword: ${APPLE_ID_PASSWORD}

linux:
  target:
    - AppImage
    - snap
    - deb

afterSign: './build/notarize.js'  # Post-build notarization
```

### 3.2 Code Signing Pipeline
```javascript
// packages/app-desktop/build/notarize.js

const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }
  
  const appName = context.packager.appInfo.productName;
  const appPath = `${appOutDir}/${appName}.app`;
  
  // Notarize with Apple (required for Gatekeeper)
  console.log('Notarizing app...');
  return await notarize({
    appBundleId: 'net.cozic.joplin',
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### 3.3 Multi-Platform Desktop CI
```yaml
# .github/workflows/build-desktop.yml

name: build-desktop

on:
  push:
    tags: [ 'v*' ]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build app
        run: yarn workspace @joplin/app-desktop run build
      
      - name: Build installer
        env:
          CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_SIGN_CERT_PASSWORD }}
          WIN_CSC_LINK: ${{ secrets.WINDOWS_SIGN_CERT_BASE64 }}
        run: yarn workspace @joplin/app-desktop run dist
      
      - name: Upload installer
        uses: actions/upload-artifact@v4
        with:
          name: joplin-windows
          path: |
            packages/app-desktop/dist/*.exe
            packages/app-desktop/dist/*.msi

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Setup certificates
        run: |
          echo "${{ secrets.MACOS_SIGN_CERT_BASE64 }}" | base64 -d > /tmp/cert.p12
          security import /tmp/cert.p12 -k ~/Library/Keychains/login.keychain
      
      - name: Build app
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: yarn workspace @joplin/app-desktop run dist
      
      - name: Notarize
        run: |
          xcrun stapler staple packages/app-desktop/dist/Joplin-*.dmg

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y snapcraft
      
      - name: Build Linux packages
        run: yarn workspace @joplin/app-desktop run dist
```

**Key Difference from Rclone**: 
- Rclone: Single binary per platform (easy)
- Joplin: Signed installer + notarization + snap/flatpak (complex)

---

## 4. MOBILE DEPLOYMENT: iOS & ANDROID

### 4.1 iOS/TestFlight Release Process
```yaml
# .github/workflows/build-ios.yml

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install Ruby dependencies
        run: |
          cd packages/app-mobile/ios
          pod install  # Install CocoaPods
      
      - name: Build app
        run: yarn workspace @joplin/app-mobile run build:ios
      
      - name: Sign with provisioning profile
        env:
          IOS_SIGNING_CERT: ${{ secrets.IOS_SIGNING_CERT }}
          IOS_PROVISIONING_PROFILE: ${{ secrets.IOS_PROVISIONING_PROFILE }}
        run: |
          # Import certificate
          echo "$IOS_SIGNING_CERT" | base64 -d > /tmp/cert.p8
          
          # Import provisioning profile
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "$IOS_PROVISIONING_PROFILE" | base64 -d > \
            ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
      
      - name: Build .ipa
        run: |
          cd packages/app-mobile/ios
          xcodebuild -workspace Joplin.xcworkspace \
            -scheme Joplin \
            -configuration Release \
            -derivedDataPath build \
            archive
          
          xcodebuild -exportArchive \
            -archivePath build/Joplin.xcarchive \
            -exportPath build/ipa \
            -exportOptionsPlist ExportOptions.plist
      
      - name: Upload to TestFlight
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
        run: |
          xcrun altool --upload-app \
            --file build/ipa/Joplin.ipa \
            --type ios \
            --apple-id "$APPLE_ID" \
            --password "$APPLE_PASSWORD"
```

### 4.2 Android Google Play Release
```yaml
# .github/workflows/build-android.yml

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build APK
        env:
          GRADLE_USER_HOME: ${{ runner.temp }}/.gradle
        run: |
          cd packages/app-mobile/android
          ./gradlew bundleRelease
          # Produces: app/build/outputs/bundle/release/app-release.aab
      
      - name: Sign bundle
        env:
          KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE }}
          KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          # Create keystore from secret
          echo "$KEYSTORE_BASE64" | base64 -d > my.keystore
          
          # Sign with jarsigner
          jarsigner -verbose -sigalg SHA256withRSA \
            -digestalg SHA-256 \
            -keystore my.keystore \
            -storepass "$KEYSTORE_PASSWORD" \
            -keypass "$KEY_PASSWORD" \
            app/build/outputs/bundle/release/app-release.aab \
            "$KEY_ALIAS"
      
      - name: Upload to Google Play Console
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: 'net.cozic.joplin'
          releaseFiles: packages/app-mobile/android/app/build/outputs/bundle/release/app-release.aab
          track: 'beta'  # Beta channel first
          status: 'draft'  # Manual review before release
```

**Release Process**:
```
1. Build beta APK
2. Upload to Google Play Console (beta track)
3. Internal testing (QA team)
4. Staged rollout: 5% → 25% → 50% → 100%
5. Monitor crash rates and ANRs
6. If safe, promote to production
```

---

## 5. SERVER DEPLOYMENT: DOCKER & KUBERNETES

### 5.1 Server Docker Compose
```yaml
# docker-compose.server.yml

version: '3.8'

networks:
  app-network:
  transcribe-network:
  shared-network:

services:
  # PostgreSQL database
  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', '${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  # Joplin Server
  app:
    image: joplin/server:latest
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DB_CLIENT=pg
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - APP_BASE_URL=https://joplin.example.com
      - APP_PORT=22300
    volumes:
      - joplin_data:/data
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:22300/api/ping']
      interval: 30s
      timeout: 10s
      retries: 3

  # Reverse proxy (nginx)
  reverse-proxy:
    image: nginx:latest
    depends_on:
      - app
    ports:
      - '443:443'
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  joplin_data:
```

### 5.2 Kubernetes Deployment
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: joplin-config
data:
  DB_CLIENT: pg
  POSTGRES_HOST: postgres-service
  POSTGRES_PORT: '5432'
  APP_BASE_URL: https://joplin.example.com

---
apiVersion: v1
kind: Secret
metadata:
  name: joplin-secrets
type: Opaque
stringData:
  POSTGRES_USER: joplin
  POSTGRES_PASSWORD: secure-password-here
  POSTGRES_DATABASE: joplin_prod

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: joplin-server
spec:
  replicas: 2  # High availability
  selector:
    matchLabels:
      app: joplin-server
  template:
    metadata:
      labels:
        app: joplin-server
    spec:
      containers:
      - name: joplin
        image: joplin/server:2.10.0
        ports:
        - containerPort: 22300
        
        envFrom:
        - configMapRef:
            name: joplin-config
        - secretRef:
            name: joplin-secrets
        
        livenessProbe:
          httpGet:
            path: /api/ping
            port: 22300
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /api/ping
            port: 22300
          initialDelaySeconds: 5
          periodSeconds: 5
        
        resources:
          requests:
            memory: '256Mi'
            cpu: '250m'
          limits:
            memory: '512Mi'
            cpu: '500m'
        
        volumeMounts:
        - name: data
          mountPath: /data
      
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: joplin-data-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: joplin-service
spec:
  type: LoadBalancer
  selector:
    app: joplin-server
  ports:
  - protocol: TCP
    port: 443
    targetPort: 22300
```

---

## 6. WEB & PWA DEPLOYMENT

### 6.1 Web App Build & Deployment
```javascript
// packages/app-web/webpack.config.js

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  optimization: {
    minimize: true,
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
};
```

### 6.2 S3 + CloudFront Deployment
```bash
#!/bin/bash
# scripts/deploy-web.sh

VERSION=$(cat VERSION)

# Build
yarn workspace @joplin/app-web run build

# Upload to S3
aws s3 sync packages/app-web/dist/ s3://joplin-web-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp packages/app-web/dist/index.html \
  s3://joplin-web-prod/index.html \
  --cache-control "no-cache"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC \
  --paths "/*"
```

---

## 7. DATABASE MIGRATIONS IN PRODUCTION

### 7.1 Migration Strategy
```typescript
// packages/server/src/migrations/index.ts

export interface Migration {
  id: string;
  name: string;
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

// Run migrations before app starts
async function runMigrations(db: Knex) {
  const executed = await db('knex_migrations')
    .select('name');
  
  const pending = allMigrations.filter(
    m => !executed.find(e => e.name === m.id)
  );
  
  for (const migration of pending) {
    console.log(`Running migration: ${migration.name}`);
    await migration.up(db);
    await db('knex_migrations').insert({
      name: migration.id,
      batch: currentBatch,
    });
  }
}
```

### 7.2 Deployment Process
```yaml
# .github/workflows/deploy-server.yml

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build \
            -t joplin-server:${{ github.sha }} \
            -t joplin-server:latest \
            .
      
      # Test migrations in staging
      - name: Test migrations
        run: |
          docker run \
            -e DB_CLIENT=pg \
            -e POSTGRES_HOST=staging-db \
            joplin-server:${{ github.sha }} \
            node scripts/migrate.js --dry-run
      
      # Only if migrations pass
      - name: Push to Docker registry
        run: |
          docker push joplin-server:${{ github.sha }}
          docker push joplin-server:latest
      
      # Deploy to Kubernetes
      - name: Deploy
        run: |
          kubectl set image deployment/joplin-server \
            joplin=joplin-server:${{ github.sha }} \
            --record
          
          # Wait for rollout
          kubectl rollout status deployment/joplin-server
```

---

## 8. RELEASE WORKFLOW: 6-WEEK CYCLE

```
Week 1-2:   Development (features, bugfixes)
            └─ Commit to develop branch
            └─ CI runs tests on every commit

Week 2-3:   Alpha Release
            ├─ Tag: v2.11-alpha.1
            ├─ Build all platforms
            ├─ Publish to alpha channels:
            │  ├─ Joplin Nightly PPA (Linux)
            │  ├─ TestFlight beta (iOS)
            │  └─ Google Play Internal Testing (Android)
            └─ Invite early adopters for testing

Week 3-4:   Beta Testing
            ├─ Tag: v2.11-beta.1
            ├─ Report bugs via GitHub Issues
            ├─ Fix critical issues
            └─ Build v2.11-beta.2, beta.3, etc.

Week 4-5:   Release Candidate
            ├─ Tag: v2.11-rc.1
            ├─ Final testing
            ├─ Translation updates (if needed)
            └─ All critical bugs must be fixed

Week 5-6:   General Availability
            ├─ Tag: v2.11.0 (final release)
            ├─ Build all platforms
            ├─ Publish to all channels:
            │  ├─ GitHub Releases
            │  ├─ Linux package repos
            │  ├─ Mac App Store
            │  ├─ Windows Store
            │  ├─ TestFlight → App Store (staged rollout)
            │  ├─ Google Play (staged rollout)
            │  └─ Docker Hub
            └─ Announce via blog/forum/social
```

---

## 9. MONITORING & ROLLBACK

### 9.1 Crash Monitoring
```javascript
// App initialization
import * as Sentry from "@sentry/electron";

Sentry.init({
  dsn: "https://key@sentry.io/project",
  environment: process.env.NODE_ENV,
});

// Automatic crash reporting
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});
```

### 9.2 Canary Deployment
```yaml
# Only rollout to 5% of users first
iOS:     TestFlight 5% phased release
Android: Google Play 5% staged rollout
Server:  Blue-green deployment (keep old version running)
```

### 9.3 Rollback Procedure
```bash
# If critical bug found:
kubectl rollout undo deployment/joplin-server

# App Store rollback (manual)
iOS:     Remove from sale, wait 24h for cache expiration
Android: Unpublish current version, push hotfix
```

---

## 10. CHRONEX DEPLOYMENT ROADMAP

### Phase 1: Desktop Deployment (Week 1-2)
```yaml
# electron-builder.config.yml
win:
  certificateFile: ./certs/cert.pfx
  target: [nsis, portable]
mac:
  certificateFile: ./certs/mac.p12
  notarize:
    teamId: ${APPLE_TEAM_ID}
linux:
  target: [AppImage, deb]
```

### Phase 2: Docker Server (Week 3-4)
```yaml
# docker-compose.yml
services:
  chronex-server:
    image: chronex:latest
    environment:
      - DATABASE_URL=postgresql://...
      - SYNC_PORT=6789
    depends_on:
      - postgres
```

### Phase 3: Kubernetes HA (Week 5-6)
```yaml
# deployment.yaml
replicas: 2
resources:
  requests:
    cpu: 500m
    memory: 512Mi
readinessProbe:
  httpGet:
    path: /health
    port: 6789
```

---

## Summary Table

| Aspect | Joplin Approach | Chronex Recommendation |
|--------|---|---|
| Platforms | Desktop + Mobile + Server + Web | Desktop + Server (mobile later) |
| Desktop Builds | Signed installers + notarization | Same pattern |
| Code Signing | Platform-specific certs | Required for trust |
| Database | PostgreSQL + migrations | PostgreSQL + migrations |
| Container | Docker Compose + K8s | Docker + optional K8s |
| CI/CD | GitHub Actions matrix | GitHub Actions matrix |
| Release Cycle | 6 weeks (alpha → beta → rc → GA) | Similar (4-8 weeks) |
| Mobile | TestFlight + Google Play | Later phase |
| Rollback | Blue-green (server), manual (stores) | Automatic (k8s) |

---

**Document Status**: Phase A2 - In Progress (2/3)  
**Total Joplin Analysis LOC**: 520 LOC  
**References**: joplin/packages/app-desktop/build/builder.yml, joplin/docker-compose.server.yml, joplin/.github/workflows/build-*.yml  
**Next**: Create SIYUAN_DEPLOYMENT.md
