# Chronex Obsidian - Modelo de Negocio & Arquitectura

## 🎯 Visión

Una aplicación **desktop-first, open source, con transparencia total** donde:
- ✅ Los usuarios controlan 100% de sus datos
- ✅ Guardan donde quieran (local, S3, WebDAV, Google Drive, Dropbox, etc.)
- ✅ No dependen de servidores nuestros
- ✅ Monetización: Servicios de personalización, no features básicas
- ✅ Código completamente visible y auditables

**Competidor**: Siyuan Note (pero 100% open source + transparente)

---

## 💰 Modelo de Ingresos

### GRATIS (Open Source)
- ✅ Crear/editar proyectos, objetivos, tareas
- ✅ Vistas: Gantt, Kanban, Calendar
- ✅ Sync local (SQLite)
- ✅ Exportar a Markdown, PDF, JSON
- ✅ Integración con WebDAV (auto-hosted)
- ✅ Integración con S3 compatible (MinIO, DigitalOcean Spaces, etc.)
- ✅ Todos los temas y lenguajes
- ✅ Atajos personalizables
- ✅ Plugins open source

### PAGOS (Servicios Profesionales)
1. **Soporte Prioritario**: $10/mes
   - Chat directo con desarrolladores
   - Respuesta en <24h
   - Help con setup e instalación

2. **Customización Específica**: $50-500/hora
   - Crear plugins personalizados
   - Integración con sistemas legacy
   - Features específicas del negocio

3. **Hosting & Backup Administrado**: $20-100/mes
   - Instancia de Chronex alojada en tu servidor
   - Backups automáticos
   - SSL/TLS
   - Monitoreo
   - *Pero totalmente opcional y con alternativas gratis*

4. **Enterprise License**: Custom pricing
   - Auditoría de seguridad
   - SLA garantizado
   - Training de equipos
   - Soporte en sitio

---

## 🏗️ Arquitectura Técnica

### Estructura de Carpetas

```
chronex/
├── app/                        ← FRONTEND (Electron + TypeScript)
│   ├── src/
│   │   ├── main/              ← Electron main process
│   │   ├── renderer/          ← UI TypeScript
│   │   ├── components/        ← Componentes React/Vue
│   │   ├── services/          ← Lógica de negocio
│   │   ├── stores/            ← State management
│   │   └── styles/            ← CSS/SCSS
│   │
│   ├── electron/
│   │   ├── main.js            ← Punto entrada Electron
│   │   ├── preload.js         ← Puente seguro
│   │   └── splash.html        ← Pantalla inicial
│   │
│   ├── webpack.config.js
│   ├── electron-builder.yml   ← Configuración .exe
│   └── package.json
│
├── kernel/                     ← BACKEND (Go o Node.js)
│   ├── main.go                ← Punto entrada
│   ├── api/                   ← REST API endpoints
│   │   ├── projects.go
│   │   ├── tasks.go
│   │   ├── sync.go            ← Sincronización
│   │   └── export.go
│   │
│   ├── db/                    ← Base de datos
│   │   ├── models.go          ← Estructura datos
│   │   ├── migrations.go      ← Versioning DB
│   │   └── sqlite.go          ← Driver SQLite
│   │
│   ├── sync/                  ← Sincronización
│   │   ├── webdav.go
│   │   ├── s3.go
│   │   ├── dropbox.go
│   │   ├── gdrive.go          ← Futuros
│   │   └── local.go
│   │
│   ├── export/                ← Exportación
│   │   ├── markdown.go
│   │   ├── pdf.go
│   │   └── json.go
│   │
│   └── go.mod
│
├── docs/                      ← Documentación
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SETUP.md
│   └── CONTRIBUTING.md
│
└── .github/
    ├── workflows/             ← CI/CD (GitHub Actions)
    │   ├── build.yml
    │   ├── test.yml
    │   └── release.yml
    └── ISSUE_TEMPLATE/
```

---

## 📱 Roadmap: Windows → Mobile

### FASE 1: MVP Windows (3-4 meses)
**Objetivo**: Aplicación desktop funcional

```
Week 1-2:   Arquitectura base (Electron + Go)
Week 3-4:   UI componentes básicos
Week 5-6:   CRUD de entidades (proyectos, tareas)
Week 7-8:   Vistas (Gantt, Kanban, Calendar)
Week 9-10:  Sync local (SQLite)
Week 11-12: Exportar (Markdown, PDF)
Week 13-14: Testing, documentación, release v1.0.0
Week 15-16: Correcciones, feedback
```

**Release**: `Chronex-1.0.0-Windows-x64.exe` (~150MB)

### FASE 2: Sincronización (Meses 5-6)
**Objetivo**: Control total de datos

```
- Integración WebDAV
- Integración S3 (AWS, MinIO, DigitalOcean Spaces)
- Conflicto resolution
- Encriptación (opcional)
- Versionado
```

### FASE 3: Mobile - Android (Meses 7-9)
**Objetivo**: App nativa Android (React Native o Flutter)

```
- Compilar desde mismo código base
- UI responsive para móvil
- Sync automático
- Offline-first
- Release en Google Play + F-Droid
```

### FASE 4: Mobile - iOS (Meses 10-12)
**Objetivo**: App nativa iOS

```
- Compilar desde mismo código base
- UI compatible con iOS
- App Store submission
- TestFlight beta
```

### FASE 5+: Expansión
```
- Linux desktop app
- Web version (servidor)
- Plugins ecosystem
- Integraciones third-party
```

---

## 🔐 Seguridad & Privacidad

### Datos del Usuario

```
LOCAL MACHINE
└── ~/.chronex/workspace/
    ├── database.db          ← SQLite local
    ├── cache/
    ├── config.json
    └── logs/
    
REMOTE (Opcional - usuario elige)
├── WebDAV Server (tu servidor)
├── S3 Compatible (MinIO, AWS, etc.)
├── Google Drive API
├── Dropbox API
└─ [Usuario es propietario de la API key]
```

### Sin Spyware
- ❌ No enviamos datos a nuestros servidores
- ❌ No rastreamos uso
- ❌ No vendemos datos
- ❌ Todo es auditable (código abierto)

### Encriptación (Opcional)
```
Usuario decide si encriptar antes de subir:
1. Descarga datos a local
2. Aplica encriptación
3. Sube a su servicio
4. Nosotros nunca vemos datos sin encriptar
```

---

## 💻 Stack Técnico

### Frontend (Windows)
```
Electron        → App desktop
TypeScript      → Lenguaje tipado
React/Vue       → UI components
Webpack         → Bundler
SCSS            → Estilos
SQLite3 JS      → DB desde UI (caché)
```

### Backend (Windows)
```
Go              → Alto rendimiento
Fiber/Echo      → HTTP framework
SQLite          → Base de datos
GORM            → ORM
```

### Sincronización
```
WebDAV Client   → Sincronizar carpetas
AWS SDK/S3      → Soporte S3
Crypto          → Encriptación
diff/merge      → Resolver conflictos
```

### Build & Distribution
```
electron-builder → Generar .exe
GitHub Actions   → CI/CD automatizado
Semantic Release → Versionado automático
NSIS            → Instalador customizado
```

---

## 🗄️ Base de Datos: SQLite

### ¿Por qué SQLite?

✅ **Ventajas**
- No requiere servidor
- Archivo único (fácil de respaldar)
- ACID completo
- Excelente documentación
- Usado por Obsidian, Joplin, etc.
- Perfectamente confiable

❌ **Limitaciones**
- Máximo ~1MB por transacción (fine para nuestro caso)
- No ideal para >100k registros muy frecuentes
- Sin native replicación (pero hacemos sync manual)
- *Para 99% de usuarios, perfecta*

### Esquema de Base de Datos

```sql
-- Proyectos
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    folder_path TEXT
);

-- Objetivos
CREATE TABLE objectives (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Tareas
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    objective_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    priority TEXT,
    due_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (objective_id) REFERENCES objectives(id)
);

-- Sincronización (estado local vs remoto)
CREATE TABLE sync_state (
    id TEXT PRIMARY KEY,
    entity_type TEXT,
    entity_id TEXT,
    local_hash TEXT,
    remote_hash TEXT,
    last_synced TIMESTAMP,
    status TEXT  -- 'synced', 'pending', 'conflict'
);

-- Índice para búsqueda rápida
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_objective ON tasks(objective_id);
```

---

## 🔄 Flujo de Sincronización

### Scenario 1: Sync Local
```
Usuario edita tarea
    ↓
Frontend actualiza SQLite local
    ↓
Cambio registrado en sync_state
    ↓
Backend corre merge automático
    ↓
UI actualiza en tiempo real
```

### Scenario 2: Sync a WebDAV
```
Usuario hace click "Sync to WebDAV"
    ↓
Backend lee SQLite local
    ↓
Genera JSON de cambios desde último sync
    ↓
Compara con remote (GET remote)
    ↓
Si no hay conflictos: sube cambios (PUT)
    ↓
Si hay conflictos: pide al usuario (UI merge dialog)
    ↓
Actualiza sync_state
    ↓
Notifica usuario "✅ Synced"
```

### Scenario 3: Sync a S3
```
Usuario configura S3 (entra con API Key)
    ↓
Backend crea cliente S3 (credenciales en memoria, no guardadas)
    ↓
Lee SQLite
    ↓
Crea snapshot JSON
    ↓
Sube a bucket: /chronex/backup-2024-04-12.json.gz
    ↓
Guarda timestamp del sync
    ↓
Usuario puede descargar/restaurar cuando quiera
```

---

## 🎨 UI Architecture

### Vistas Implementadas (Fase 1)
```
Dashboard
├── Proyectos (Tabla)
├── Objetivos activos
├── Próximas tareas

Proyectos
├── Detalles del proyecto
└── Objetivos (Lista)

Objetivos
├── Detalles del objetivo
└── Tareas (Gantt, Kanban, Calendar)

Tareas
├── Gantt View    ← Timeline
├── Kanban View   ← Columnas por status
├── Calendar View ← Calendario
└── List View     ← Tabla simple

Settings
├── Workspace
├── Sync (WebDAV, S3)
├── Temas
└── Atajos
```

### Componentes Reutilizables
```
src/components/
├── Button
├── Modal
├── Input
├── Table
├── GanttChart
├── KanbanBoard
├── Calendar
├── Sidebar
└── Topbar
```

---

## 📡 API REST (Backend Go)

### Proyectos
```
POST   /api/projects              ← Crear
GET    /api/projects              ← Listar
GET    /api/projects/:id          ← Obtener
PUT    /api/projects/:id          ← Actualizar
DELETE /api/projects/:id          ← Eliminar
```

### Objetivos
```
POST   /api/objectives
GET    /api/projects/:id/objectives
PUT    /api/objectives/:id
DELETE /api/objectives/:id
```

### Tareas
```
POST   /api/tasks
GET    /api/objectives/:id/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Sincronización
```
POST   /api/sync/webdav          ← Iniciar sync WebDAV
POST   /api/sync/s3              ← Iniciar sync S3
GET    /api/sync/status          ← Estado actual
POST   /api/sync/resolve-conflict ← Resolver conflicto
```

### Exportación
```
GET    /api/export/markdown/:project_id
GET    /api/export/pdf/:project_id
GET    /api/export/json/:project_id
```

---

## 🚀 Build & Release

### GitHub Actions Workflow

```yaml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - run: npm install
      - run: npm run build:app
      - run: cd kernel && go build -o ../app/kernel/kernel.exe
      - run: npm run dist
      
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            app/dist/Chronex-*.exe
            app/dist/Chronex-*.exe.blockmap
```

### Release Artifacts
```
Cada release incluye:
- Chronex-1.0.0-windows-x64.exe (150-200MB)
- Chromex-1.0.0-windows-x64-portable.exe (sin instalación)
- Checksums (SHA256)
- Release notes
- CHANGELOG
- Link a documentación
```

---

## 💾 Carpeta del Usuario

### Windows
```
C:\Users\Usuario\AppData\Local\Chronex\
├── data.db              ← SQLite principal
├── config.json          ← Configuración
├── sync_state.json      ← Estado de sincronización
└── logs/

C:\Users\Usuario\Chronex\
└── workspace/           ← Donde el usuario puede guardar archivos manualmente
```

### Primer Arranque
```
1. Usuario ejecuta Chronex-1.0.0.exe
   ↓
2. NSIS instalador pregunta: "¿Dónde instalar?"
   ↓
3. Crea C:\Program Files\Chronex\
   ├── Chromex.exe
   ├── kernel.exe
   └── resources/
   ↓
4. Agrega acceso directo en escritorio
   ↓
5. Primer arranque
   ├─ Crea AppData\Local\Chronex\
   ├─ Inicializa SQLite
   └─ Muestra onboarding
```

---

## 📊 Comparación vs. Siyuan

| Aspecto | Siyuan | Chronex |
|---------|--------|---------|
| **Modelo** | Freemium | 100% Open Source |
| **Cloud oficial** | Sí (pago) | No, usuario elige |
| **Datos en S3/WebDAV** | Requiere config | Integrado, fácil |
| **Código abierto** | Sí | Sí |
| **Monetización** | Cloud oficial | Servicios profesionales |
| **Privacy** | Buena | Excelente (sin servers nuestros) |
| **DB** | SQLite | SQLite |
| **Languages** | Go + TypeScript | Go + TypeScript |

---

## ✅ Próximos Pasos

1. **Definir scope exacto** (¿qué incluir en v1.0?)
2. **Crear spec detallada** de base de datos
3. **Diseñar API REST** completa
4. **Hacer mockups UI** (Figma)
5. **Setup repo** con estructura base
6. **Iniciar desarrollo** frontend + backend en paralelo

---

## 🎯 Filosofía

> "Los datos son del usuario. Nosotros solo proporcionamos las herramientas."

- **Transparencia**: Código abierto, auditable
- **Libertad**: Guarda donde quieras
- **Simplicidad**: Sin dependencias externas
- **Honestidad**: Dinero por servicios, no por funciones

