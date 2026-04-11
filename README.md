# obsidian-repo

## Proyecto de Automatización QuickAdd para Obsidian Vault

**Versión**: 1.0.0  
**Estado**: En desarrollo - PASO 3 completado, IMPLEMENTACIÓN en curso  
**Fecha Inicio**: 2026-04-11  
**Lenguaje**: JavaScript + Markdown  
**Framework**: Obsidian + QuickAdd Plugin

---

## Descripción

Sistema modular de automatización QuickAdd para Obsidian vault que permite crear dinámicamente:
- Repositorios (estructuras contenedoras)
- Tareas (items de trabajo con prioridad)
- Proyectos (iniciativas con ciclo de vida)
- Pilares (áreas temáticas de conocimiento)
- Notas en Repositorios (documentación vinculada)

---

## Estructura del Proyecto

```
obsidian-repo/
├── README.md                     (Este archivo)
├── package.json                  (Configuración npm)
├── .gitignore                    (Exclusiones git)
│
├── src/                          (Código fuente)
│   ├── scripts/                  (Scripts orquestadores - 5 arquivos)
│   │   ├── createRepository.js
│   │   ├── createTask.js
│   │   ├── createProject.js
│   │   ├── createPillar.js
│   │   └── createRepositoryNote.js
│   │
│   └── utils/                    (Módulos reutilizables - 8+ módulos)
│       ├── validateCommonInput.js
│       ├── generateUniqueId.js
│       ├── getCurrentDateTime.js
│       ├── getFileName.js
│       ├── getAuthorName.js
│       ├── getGrandParentFolder.js
│       ├── getMetadataByFrontmatter.js
│       └── showNotification.js
│
├── templates/                    (Templates QuickAdd - 5 archivos)
│   ├── repository.md
│   ├── task.md
│   ├── project.md
│   ├── pillar.md
│   └── repositoryNote.md
│
├── tests/                        (Tests - 60+ casos)
│   ├── unit/
│   │   ├── utils.test.js
│   │   └── validation.test.js
│   ├── integration/
│   │   ├── createRepository.test.js
│   │   ├── createTask.test.js
│   │   ├── createProject.test.js
│   │   ├── createPillar.test.js
│   │   └── createRepositoryNote.test.js
│   └── fixtures/
│       └── sample-data.json
│
├── docs/                         (Documentación)
│   ├── SPECIFICATION.md          (PASO 2: 5 UCs completos)
│   ├── ORGANIZATION.md           (PASO 3: Organización y validación)
│   ├── IMPLEMENTATION.md         (Guía de implementación)
│   ├── ARCHITECTURE.md           (Diagrama de arquitectura)
│   └── ROADMAP.md               (PASO 1 V4: Fases y timeline)
│
├── config/                       (Configuración)
│   ├── obsidian-manifest.json   (Manifest de plugin)
│   ├── quickadd-macro-config.json (Configuración de macros)
│   └── eslint.config.js         (Linter configuration)
│
└── scripts/                      (Scripts de desarrollo)
    ├── setup.sh                 (Setup inicial)
    ├── build.sh                 (Build del proyecto)
    ├── test.sh                  (Ejecutar tests)
    └── deploy.sh               (Deployment a vault)
```

---

## Especificación (PASO 2)

**5 Casos de Uso Completos:**

| UC | Nombre | Operaciones | Complejidad |
|----|--------|-------------|---|
| UC-001 | Crear Repositorio | 12 (OP-001 a OP-015) | MEDIA |
| UC-002 | Crear Tarea | 11 (OP-001-007, 011-015) | MEDIA |
| UC-003 | Crear Proyecto | 13 (OP-001 a OP-015) | MEDIA |
| UC-004 | Crear Pilar | 10 (OP-001-006, 008, 010-015) | MEDIA |
| UC-005 | Crear Nota en Repositorio | 11 + precondición | ALTA |

**Documentación completa:**
- `/docs/SPECIFICATION.md` - Especificación IEEE 830
- 70+ secciones de especificación
- 51 excepciones mapeadas
- 15 diagramas Mermaid

---

## Organización y Validación (PASO 3)

**5 Artefactos de Validación:**
1. Índice maestro (PASO3-INDEX)
2. Matriz de actores (PASO3-ACTORES-MATRIZ)
3. 7 diagramas visuales (PASO3-DIAGRAMA-ACTORES)
4. 227 checkboxes de completitud (PASO3-COMPLETITUD-CHECKLIST)
5. 5 flujos de secuencia (PASO3-FLUJOS-SECUENCIA)

**Documentación:**
- `/docs/ORGANIZATION.md` - Validación completa
- Actores documentados: 5 (Usuario, QuickAdd, Obsidian, Utils, Template)
- Dependencias: UC-005 requiere UC-001

---

## Roadmap (PASO 1 V4)

**5 Fases de Implementación - 60 horas, 10 semanas:**

| Fase | Descripción | Duración | Status |
|------|---|---|---|
| FASE 1 | Convenciones y base | 7 horas | ⏳ Pendiente |
| FASE 2 | Módulos reutilizables | 12 horas | ⏳ Pendiente |
| FASE 3 | Refactor por SRP/DRY | 18 horas | ⏳ Pendiente |
| FASE 4 | Escalabilidad | 15 horas | ⏳ Pendiente |
| FASE 5 | Testing | 8 horas | ⏳ Pendiente |

**Documentación:**
- `/docs/ROADMAP.md` - Detalle de fases

---

## Operaciones Atómicas

**15 Operaciones Reutilizables (PASO 1 V4):**

Core (reutilizadas en 5/5 UCs):
- OP-001: Obtener entrada usuario
- OP-002: Validar entrada
- OP-003: Generar ID único
- OP-005: Obtener fecha actual
- OP-006: Nombre de archivo
- OP-011: Procesar específico
- OP-012: Asignar variables
- OP-013: Ejecutar template
- OP-014: Crear archivo
- OP-015: Mostrar notificación

Selectivas (3-4 UCs):
- OP-007: Obtener metadata
- OP-008: Carpeta padre
- OP-010: Estructura carpetas

---

## Instalación

### Prerrequisitos
- Obsidian 1.1+
- QuickAdd Plugin 1.0+
- Node.js 16+ (para development)

### Setup

```bash
# Clonar repositorio
git clone https://github.com/nestor/obsidian-repo.git
cd obsidian-repo

# Instalar dependencias
npm install

# Setup inicial
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Integración con Obsidian

```bash
# Build del proyecto
./scripts/build.sh

# Copiar templates a vault
cp templates/*.md /ruta/a/vault/.templates/

# Copiar scripts a vault
cp src/scripts/*.js /ruta/a/vault/990-UTILIDADES/992-script/
```

---

## Uso

### Crear Repositorio
```
Command Palette → Crear Repositorio
→ Ingresa nombre y tipo (Personal, Work, Research)
→ Estructura: repositories/{type}/{id}/repository.md
```

### Crear Tarea
```
Command Palette → Crear Tarea
→ Ingresa título, prioridad, descripción, fecha
→ Estructura: tasks/{priority}/{id}/task.md
```

### Crear Proyecto
```
Command Palette → Crear Proyecto
→ Ingresa nombre, estado, descripción
→ Estructura: projects/{status}/{id}/project.md
```

### Crear Pilar
```
Command Palette → Crear Pilar
→ Ingresa nombre, estado
→ Estructura: pillars/{status}/{id}/pillar.md
```

### Crear Nota en Repositorio
```
Command Palette → Crear Nota en Repositorio
→ Selecciona repositorio existente
→ Ingresa título y descripción
→ Estructura: repositories/{type}/{repo-id}/notes/{note-id}/repositoryNote.md
```

---

## Testing

```bash
# Ejecutar todos los tests
./scripts/test.sh

# Tests específicos
npm test -- src/utils/validateCommonInput.test.js

# Coverage
npm run coverage
```

**Cobertura Esperada:**
- Unit tests: 90%+
- Integration tests: 80%+
- E2E: 100% de flujos

---

## Contribuir

1. Crear rama: `git checkout -b feature/nombre`
2. Implementar cambios
3. Pasar tests: `npm test`
4. Commit: `git commit -am "Descripción"`
5. Push: `git push origin feature/nombre`
6. PR a `main`

---

## Documentación Completa

Ver `/docs/` para:
- `SPECIFICATION.md` - Especificación completa (PASO 2)
- `ORGANIZATION.md` - Validación (PASO 3)
- `ROADMAP.md` - Implementación (PASO 1 V4)
- `ARCHITECTURE.md` - Diseño técnico
- `IMPLEMENTATION.md` - Guía paso a paso

---

## Estado del Proyecto

```
PASO 1 V4: ANÁLISIS        ✅ Completado
PASO 2:    ESPECIFICACIÓN  ✅ Completado (5 UCs, 5 templates)
PASO 3:    VALIDACIÓN      ✅ Completado (227 checkboxes)
─────────────────────────────────────────
IMPLEMENTACIÓN             ⏳ En curso (FASE 1)
```

---

## Licencia

MIT License - Ver LICENSE.md

---

## Autor

Nestor - Creador del vault Obsidian y sistema QuickAdd

**Contacto**: [información de contacto]

---

**Última actualización**: 2026-04-11  
**Versión**: 1.0.0-alpha  
**Estado**: En desarrollo
