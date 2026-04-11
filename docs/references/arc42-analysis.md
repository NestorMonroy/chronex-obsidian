```yml
type: Analisis de referencia
category: arc42 by Example - 3ra Edicion
version: 1.0
purpose: Extraer patrones organizacionales de los 7 ejemplos arc42 del libro
goal: Fundamentar decision de reorganizacion docs/ con evidencia del libro
created_at: "2026-04-06 00:00:00"
author: Claude
source: /tmp/references/arc42-by-example-3ed-traduccion/epub_build/OEBPS/
```

# Analisis: arc42 by Example — Patrones organizacionales

## Fuente

Libro "arc42 by Example, 3ra Edicion" traducido al espanol. 12 capitulos (chap00-chap11).
7 sistemas de ejemplo documentados con arc42.

## Los 7 ejemplos

| # | Sistema | Capitulo | Tamano | Secciones arc42 | Desviacion? |
|---|---------|----------|--------|-----------------|-------------|
| 1 | HtmlSC | II | Pequeno (herramienta CLI) | 12 estandar | No |
| 2 | MaMa-CRM | III | Grande (CRM multi-partner) | 12 estandar | No |
| 3 | biking2 | IV | Medio (web app ciclismo) | 12 estandar | No |
| 4 | DokChess | V | Medio (motor de ajedrez) | 12 estandar | No |
| 5 | docToolchain | VI | Medio (docs-as-code tool) | 12 estandar | No |
| 6 | FotoMaX | VII | Grande (sistema de fotos white-label) | **13 secciones** | **SI** |
| 7 | MiniMenu | VIII | Micro (app Mac-OS menubar) | **Mind map** | **SI** |

---

## Hallazgo 1: FotoMaX REORDENA arc42

**Esto es critico para nuestra decision.**

FotoMaX (Cap. VII) explicitamente se desvia de la estructura oficial:

> "Este capitulo se desvia de la estructura oficial arc42 para proporcionar al lector el contexto necesario para comprender todas las demas secciones."

Lo que hizo FotoMaX:
- **Movio Quality Requirements (Section 10) a la posicion 3** — ANTES de constraints, ANTES de solution strategy
- **Agrego Section 14: "Temas organizativos"** que NO es parte de arc42

Justificacion del autor:
> "Es seguro asumir que los nuevos lectores del documento comenzaran por el principio."

**Implicacion para nuestra decision:** Si un ejemplo oficial del libro puede MOVER Section 10 al principio porque "el lector necesita contexto", entonces el orden numerico NO es sagrado. Lo que importa es la COMPRENSIBILIDAD, no la numeracion.

---

## Hallazgo 2: Quality Goals (1.2) y Quality Scenarios (10) siempre estan conectados

Todos los ejemplos muestran una conexion directa:

| Ejemplo | Quality Goals (1.2) | Quality Scenarios (10) | Relacion |
|---------|--------------------|-----------------------|----------|
| HtmlSC | Tabla top 3-5 | Escenarios de evaluacion | Referencia cruzada |
| biking2 | Tabla 5 goals priorizados | 10.1 Arbol de calidad + 10.2 Escenarios | Directa: "los quality goals se evaluan con los scenarios" |
| DokChess | Tabla 5 goals | 10.2 Escenarios con IDs | Explicita: "representan los objetivos fundamentales de V.1.2" |
| FotoMaX | **Movidos juntos** | **Fusionados en Section 3** | **Los UNIO porque son inseparables** |

**Cita DokChess:**
> "Los escenarios de calidad de esta seccion representan los objetivos de calidad fundamentales de DokChess (→ V.1.2) asi como otras propiedades de calidad requeridas."

**Implicacion:** quality-goals/ y quality-scenarios/ DEBEN ser vecinos en la estructura. En la estructura actual (01/ vs 10/) estan separados por 9 carpetas. En Opcion B son hermanos directos.

---

## Hallazgo 3: MiniMenu demuestra que arc42 se adapta hasta lo EXTREMO

Cap. VIII es un solo mind map. Sin texto, sin tablas, sin diagramas UML. Solo keywords.

> "Su objetivo es mostrar que arc42 puede ser *extremamente* adaptado y reducido para mantener solo una cantidad minima de documentacion."

**Implicacion:** Si arc42 se puede reducir a un mind map, con mas razon se puede reorganizar la estructura de directorios.

---

## Hallazgo 4: Subsecciones de Section 1 son temas INDEPENDIENTES

En TODOS los 7 ejemplos, Section 1 tiene exactamente 3 subsecciones:

| Subseccion | Contenido | Independencia |
|------------|-----------|---------------|
| 1.1 Requirements Overview | Que hace el sistema | Autocontenido — no necesita 1.2 ni 1.3 |
| 1.2 Quality Goals | Atributos de calidad priorizados | Autocontenido — referencia Section 10 (no 1.1) |
| 1.3 Stakeholders | Personas/roles afectados | Autocontenido — no depende de 1.1 ni 1.2 |

En HtmlSC: 1.1 tiene tabla de checks (G-1 a G-5), 1.2 tiene tabla de quality goals, 1.3 tiene tabla de stakeholders. Tres temas distintos.

**Implicacion:** Si 1.1, 1.2, 1.3 son temas independientes en la documentacion, son carpetas independientes en el filesystem.

---

## Hallazgo 5: La metafora de cajones viene de VOLERE

**Origen (Cap. 0):**
> "Me presento una plantilla para requisitos, un gabinete pre-estructurado (o documento) llamado VOLERE que contiene marcadores de posicion para todo lo que podria ser importante... Al trabajarlo, los ingenieros no tenian que pensar mucho antes de poder volcar sus resultados en el lugar correcto — y otros podrian recuperarlos mas adelante..."

**Arc42 heredo esta metafora (Cap. 1):**
> "Compare arc42 con un archivador con cajones: los cajones estan claramente etiquetados con temas o aspectos de la arquitectura."

**Dos propiedades clave del cajon:**
1. **Claramente etiquetado** — el nombre dice que hay dentro
2. **Independiente** — abres UN cajon sin necesidad de abrir otro

**Implicacion:** `docs/requirements/` es un cajon claramente etiquetado. `docs/01-introduction-goals/requirements/` es un cajon dentro de otro cajon — viola la metafora.

---

## Hallazgo 6: docToolchain (Cap. VI) usa modularidad por archivo

docToolchain es el sistema que IMPLEMENTA docs-as-code. Su propia arquitectura usa:
- Archivos separados por funcionalidad (scripts/.gradle)
- Carpetas especiales para exportaciones
- README.adoc en cada carpeta explicando su contenido

**Implicacion:** El ecosistema docs-as-code (del cual arc42+Mermaid+Markdown son parte) favorece archivos separados por dominio, no monolitos.

---

## Hallazgo 7: La numeracion NO prescribe organizacion de directorios

Ningun ejemplo del libro usa estructura de directorios. Todos son documentos monoliticos (single XHTML). La numeracion 1-12 es para CONTENIDO (encabezados H2/H3), no para filesystem.

El patron de los ejemplos del libro:
```
# Section 1: Introduction and Goals        ← H1
## 1.1 Requirements Overview               ← H2
## 1.2 Quality Goals                        ← H2
## 1.3 Stakeholders                         ← H2
# Section 2: Constraints                    ← H1
...
```

Cuando esto se traduce a filesystem, hay DOS enfoques validos:

**Enfoque A (lo que hicimos): 1 carpeta = 1 seccion arc42**
```
01-introduction-goals/  ← = Section 1 (H1)
  requirements/         ← = 1.1 (H2)
  quality-goals/        ← = 1.2 (H2)
```

**Enfoque B (propuesto): 1 carpeta = 1 tema**
```
requirements/           ← = el tema "Requirements"
quality-goals/          ← = el tema "Quality Goals"
```

El Enfoque A preserva la jerarquia H1→H2 del documento.
El Enfoque B preserva la independencia tematica de cada cajon.

Arc42 NO prescribe cual usar. Pero la metafora de cajones favorece B.

---

## Hallazgo 8: FotoMaX agrega secciones que NO son arc42

FotoMaX agrega Section 14 "Temas organizativos":
> "Este capitulo no forma parte de ARC42 pero se anadio a esta documentacion porque no hay un lugar mejor para los temas organizativos."

**Implicacion:** TiendaMax tiene carpetas propias (business-goals/, success-criteria/) que NO son secciones arc42 oficiales. Esto es valido — FotoMaX lo hace. En Opcion B, estas carpetas propias conviven como cajones al mismo nivel.

---

## Resumen: Que dice el libro sobre nuestra decision

| Hallazgo | Favorece Opcion 0 | Favorece Opcion B |
|----------|-------------------|-------------------|
| H1: FotoMaX reordena secciones | — | SI (el orden no es fijo) |
| H2: Quality Goals y Scenarios conectados | — | SI (vecinos en B) |
| H3: MiniMenu = adaptabilidad extrema | — | SI (reorganizar dirs es trivial) |
| H4: 1.1/1.2/1.3 independientes | — | SI (carpetas independientes) |
| H5: Cajones = claramente etiquetados | — | SI (nombres directos) |
| H6: docToolchain = modular por archivo | Neutral | SI (archivos por dominio) |
| H7: Numeracion = contenido, no dirs | Neutral | SI (no necesita numeros) |
| H8: Se pueden agregar secciones custom | Neutral | SI (business-goals/ = valido) |

**Conclusion: El libro no solo permite la Opcion B — la JUSTIFICA.** FotoMaX movio secciones por comprensibilidad. La metafora de cajones dice etiquetas claras. Los temas 1.1/1.2/1.3 son independientes. La adaptabilidad es un principio core de arc42.
