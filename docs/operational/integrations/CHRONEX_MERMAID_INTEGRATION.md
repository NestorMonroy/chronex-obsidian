# CHRONEX + Mermaid-RS-Renderer Integration Strategy

**Document Date**: 2026-04-12  
**Status**: Implementation Plan  
**Priority**: Medium (nice-to-have for v1.5+)

---

## 1. VISION: DIAGRAMS IN BLOCKS

### Current State
```
Chronex Block Types:
├─ Text
├─ Code
├─ Markdown
└─ ??? (no diagrams)
```

### Future State (with Mermaid Integration)
```
Chronex Block Types:
├─ Text
├─ Code
├─ Markdown
├─ Mermaid Diagram ← NEW
│  ├─ Flowchart
│  ├─ Sequence
│  ├─ Gantt
│  ├─ Class
│  └─ State
└─ ... (other types)
```

### User Experience
```
Desktop/Web UI:
  1. Create new "Mermaid" block
  2. Enter diagram syntax (plain text editor)
  3. Live preview (rendered SVG)
  4. Export as PNG/SVG

API Response (Block):
  {
    "id": "block-123",
    "type": "mermaid",
    "content": "flowchart LR; A-->B-->C",
    "format": "svg",
    "cached_svg": "<svg>...</svg>",
    "last_rendered": "2026-04-12T10:00:00Z"
  }
```

---

## 2. ARCHITECTURE: WHERE TO INTEGRATE

### Option A: CLI Integration (Simplest)

```
Architecture:
  
  Desktop App         Web App
      ↓                 ↓
   Electron          React
      ↓                 ↓
  Chronex API ← Go Backend
      ↓
  [Request to render diagram]
      ↓
  Go (fork process)
      ↓
  mmdr (Rust CLI)
      ↓
  SVG Output
      ↓
  Go (return to caller)
      ↓
  Store in cache
      ↓
  Return to client
```

**Implementation**:
```go
// backend/render/mermaid.go

package render

import (
    "bytes"
    "fmt"
    "os/exec"
    "strings"
)

type MermaidRenderer struct {
    binaryPath string
    cacheDir   string
}

func (mr *MermaidRenderer) RenderSVG(
    ctx context.Context, 
    diagram string,
) (string, error) {
    cmd := exec.CommandContext(ctx, mr.binaryPath, "-e", "svg")
    cmd.Stdin = strings.NewReader(diagram)
    
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    if err := cmd.Run(); err != nil {
        return "", fmt.Errorf("mmdr error: %v\nstderr: %s", 
            err, stderr.String())
    }
    
    return stdout.String(), nil
}

func (mr *MermaidRenderer) RenderPNG(
    ctx context.Context,
    diagram string,
) ([]byte, error) {
    cmd := exec.CommandContext(ctx, mr.binaryPath, "-e", "png")
    cmd.Stdin = strings.NewReader(diagram)
    
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    if err := cmd.Run(); err != nil {
        return nil, fmt.Errorf("mmdr error: %v", err)
    }
    
    return stdout.Bytes(), nil
}
```

**Pros**:
- ✅ Simple to implement (100 LOC)
- ✅ No coupling with Go code
- ✅ mmdr binary can be updated independently
- ✅ Works as security boundary

**Cons**:
- ❌ Process spawn overhead (~10-20ms per call)
- ❌ IPC overhead
- ❌ Can't cache within process

**When to use**: MVP, prototyping, <100 diagrams/day

---

### Option B: Rust Library via FFI (Better Performance)

```
Architecture:

  Desktop/Web
      ↓
  Go Backend
      ↓
  C Bindings (Go cgo)
      ↓
  Rust Library (mermaid-rs-renderer)
      ↓
  SVG Output
```

**Implementation**:

1. Create Rust wrapper crate:
```rust
// packages/backend/native/mermaid-wrapper/lib.rs

use mermaid_rs_renderer::render;

#[no_mangle]
pub extern "C" fn chronex_render_mermaid(
    diagram: *const u8,
    diagram_len: usize,
    out_buf: *mut u8,
    out_capacity: usize,
) -> i32 {
    let diagram_str = unsafe {
        std::str::from_utf8(std::slice::from_raw_parts(
            diagram,
            diagram_len,
        ))
    }.unwrap_or_default();
    
    match render(diagram_str) {
        Ok(svg) => {
            let svg_bytes = svg.as_bytes();
            if svg_bytes.len() > out_capacity {
                return -1; // Buffer too small
            }
            unsafe {
                std::ptr::copy_nonoverlapping(
                    svg_bytes.as_ptr(),
                    out_buf,
                    svg_bytes.len(),
                );
            }
            svg_bytes.len() as i32
        }
        Err(_) => -2, // Render error
    }
}
```

2. Go FFI binding:
```go
// backend/render/mermaid_ffi.go

package render

import (
    "unsafe"
    "github.com/chronex/chronex/packages/backend/native/mermaid-wrapper"
)

func (mr *MermaidRenderer) RenderSVGFast(
    diagram string,
) (string, error) {
    diagBytes := []byte(diagram)
    
    // Allocate output buffer (SVG can be 10-50KB)
    outBuf := make([]byte, 1024*1024)
    
    len := mermaid_wrapper.ChronexRenderMermaid(
        unsafe.Pointer(&diagBytes[0]),
        len(diagBytes),
        unsafe.Pointer(&outBuf[0]),
        len(outBuf),
    )
    
    if len < 0 {
        return "", fmt.Errorf("mermaid error code: %d", len)
    }
    
    return string(outBuf[:len]), nil
}
```

**Pros**:
- ✅ 2-4ms per diagram (vs 20-50ms for CLI)
- ✅ No process spawn overhead
- ✅ Shared memory efficiency
- ✅ Can cache in Go memory

**Cons**:
- ❌ More complex (FFI/cgo setup)
- ❌ Needs Rust toolchain for building
- ❌ Rust library updates require rebuild

**When to use**: Production, 1000+ diagrams/day, performance critical

---

### Option C: Microservice (Most Scalable)

```
Architecture:

  Go Backend                  Renderer Service
      ↓                              ↓
  [Diagram request]  ------HTTP--→  mmdr HTTP Server
       ↓                              ↓
  [Cache check]             [Render + Cache]
       ↓                              ↓
  [Return SVG] ← ←--------HTTP------ [SVG Response]
```

**Implementation**:

1. Create HTTP wrapper for mmdr:
```rust
// separate Rust crate as HTTP server
use actix_web::{web, App, HttpServer, HttpResponse};
use mermaid_rs_renderer::render;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Clone)]
struct State {
    cache: std::sync::Arc<Mutex<HashMap<String, String>>>,
}

async fn render_handler(
    body: web::Bytes,
    state: web::Data<State>,
) -> HttpResponse {
    let diagram = String::from_utf8_lossy(&body).to_string();
    
    let mut cache = state.cache.lock().unwrap();
    
    if let Some(cached) = cache.get(&diagram) {
        return HttpResponse::Ok()
            .content_type("image/svg+xml")
            .body(cached.clone());
    }
    
    match render(&diagram) {
        Ok(svg) => {
            cache.insert(diagram, svg.clone());
            HttpResponse::Ok()
                .content_type("image/svg+xml")
                .body(svg)
        }
        Err(e) => {
            HttpResponse::BadRequest()
                .json(serde_json::json!({ "error": e.to_string() }))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(State {
        cache: std::sync::Arc::new(Mutex::new(HashMap::new())),
    });
    
    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .route("/render", web::post().to(render_handler))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
```

2. Go client:
```go
// backend/render/mermaid_service.go

package render

import (
    "bytes"
    "io"
    "net/http"
)

type MermaidService struct {
    endpoint string  // "http://renderer:8080"
    client   *http.Client
}

func (ms *MermaidService) Render(
    ctx context.Context,
    diagram string,
) (string, error) {
    req, _ := http.NewRequestWithContext(
        ctx,
        "POST",
        ms.endpoint+"/render",
        bytes.NewReader([]byte(diagram)),
    )
    
    resp, err := ms.client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    return string(body), nil
}
```

**Pros**:
- ✅ Independent scaling
- ✅ Separate service can be updated/restarted independently
- ✅ Can distribute load
- ✅ Easy to add caching layer (Redis, etc.)

**Cons**:
- ❌ Network latency (~10-50ms)
- ❌ More complex deployment
- ❌ Requires Docker/Kubernetes

**When to use**: Enterprise, distributed system, 10000+ diagrams/day

---

## 3. DATA MODEL: MERMAID BLOCKS

### Block Schema
```sql
-- blocks table (existing)
CREATE TABLE blocks (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    parent_id UUID,
    type VARCHAR(50) NOT NULL,  -- 'mermaid'
    content TEXT NOT NULL,       -- Mermaid syntax
    metadata JSONB,              -- version, theme, etc.
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- New: mermaid_cache table (optional)
CREATE TABLE mermaid_cache (
    block_id UUID PRIMARY KEY,
    diagram_hash VARCHAR(64) NOT NULL,  -- SHA256(content)
    rendered_svg TEXT NOT NULL,
    rendered_png BYTEA,                 -- optional
    render_time_ms INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    INDEX (diagram_hash)
);
```

### Block Entity (Go)
```go
type MermaidBlock struct {
    ID             uuid.UUID              `json:"id"`
    WorkspaceID    uuid.UUID              `json:"workspace_id"`
    Type           string                 `json:"type"` // "mermaid"
    Content        string                 `json:"content"`
    DiagramType    string                 `json:"diagram_type"` // "flowchart", "gantt", etc.
    RenderedSVG    string                 `json:"rendered_svg,omitempty"`
    RenderedPNG    []byte                 `json:"rendered_png,omitempty"`
    Theme          string                 `json:"theme"` // "light", "dark"
    CreatedAt      time.Time              `json:"created_at"`
    UpdatedAt      time.Time              `json:"updated_at"`
}
```

### API Endpoints
```
POST /api/blocks
  {
    "workspace_id": "uuid",
    "type": "mermaid",
    "content": "flowchart LR; A-->B-->C",
    "format": "svg"  // or "png"
  }
  
  Response:
  {
    "id": "block-id",
    "rendered_svg": "<svg>...</svg>",
    "render_time_ms": 3
  }

GET /api/blocks/:id
  Response:
  {
    "id": "block-id",
    "type": "mermaid",
    "content": "flowchart LR; A-->B-->C",
    "rendered_svg": "<svg>...</svg>"
  }

PUT /api/blocks/:id
  {
    "content": "flowchart TD; A-->B"
  }
  
  (Triggers re-render automatically)

DELETE /api/blocks/:id
  (Clears cache)
```

---

## 4. IMPLEMENTATION PHASES

### Phase 1: CLI Integration (2-3 weeks)

**Goal**: Basic diagram rendering via mmdr CLI

**Tasks**:
- [ ] Week 1: CLI integration
  - [ ] Install mmdr binary (or build from source)
  - [ ] Create Go wrapper (render.go)
  - [ ] Test rendering single diagram types
  - [ ] Add error handling

- [ ] Week 2: API endpoints
  - [ ] `POST /api/blocks` for diagram creation
  - [ ] `GET /api/blocks/:id` for retrieval
  - [ ] `PUT /api/blocks/:id` for updates
  - [ ] Web/Desktop UI for editing (simple textarea + preview)

- [ ] Week 3: Caching & optimization
  - [ ] Basic file cache (rendered SVGs)
  - [ ] Cache invalidation on content change
  - [ ] Performance monitoring

**Deliverables**:
- ✅ Users can create/edit Mermaid diagrams in blocks
- ✅ Auto-render on save
- ✅ Export diagrams as SVG/PNG
- ✅ Performance: ~20-50ms per diagram

---

### Phase 2: FFI Integration (2-3 weeks, optional)

**Goal**: Faster rendering via Rust library

**Tasks**:
- [ ] Week 1: Rust FFI wrapper
  - [ ] Create mermaid-wrapper crate
  - [ ] Implement C bindings
  - [ ] Test FFI from Go

- [ ] Week 2: Go integration
  - [ ] Create cgo bindings
  - [ ] Replace CLI calls with FFI
  - [ ] Memory management (ensure proper cleanup)
  - [ ] Error handling

- [ ] Week 3: Benchmarking & optimization
  - [ ] Compare CLI vs FFI performance
  - [ ] Profile memory usage
  - [ ] Optimize buffer sizes

**Deliverables**:
- ✅ 2-4ms per diagram (5-10x faster)
- ✅ Reduced process overhead
- ✅ In-memory caching

---

### Phase 3: Microservice (Optional, Enterprise)

**Goal**: Standalone renderer service with caching

**Tasks**:
- [ ] Week 1: HTTP server
  - [ ] Actix-web HTTP wrapper for mmdr
  - [ ] Request/response handling
  - [ ] Error responses

- [ ] Week 2: Caching layer
  - [ ] In-memory cache (HashMap)
  - [ ] Optional Redis integration
  - [ ] Cache invalidation logic

- [ ] Week 3: Deployment
  - [ ] Docker image
  - [ ] Kubernetes manifest
  - [ ] Load balancer setup

**Deliverables**:
- ✅ Independent renderer service
- ✅ Distributed caching
- ✅ Horizontal scaling

---

## 5. DEPLOYMENT CONFIGURATION

### Phase 1 Deployment (CLI)
```dockerfile
# Dockerfile
FROM rust:latest as builder
RUN cargo install mermaid-rs-renderer

FROM chronex:latest
COPY --from=builder /usr/local/cargo/bin/mmdr /app/bin/mmdr

ENV CHRONEX_RENDERER_BINARY=/app/bin/mmdr
```

### Phase 2 Deployment (FFI)
```dockerfile
# Dockerfile (single binary)
FROM rust:latest as mmdr-builder
WORKDIR /build
RUN git clone https://github.com/1jehuang/mermaid-rs-renderer.git
RUN cd mermaid-rs-renderer && cargo build --release

FROM golang:1.21 as go-builder
WORKDIR /build
COPY . .
RUN CGO_ENABLED=1 go build -o chronex .

FROM ubuntu:22.04
COPY --from=mmdr-builder /build/target/release/mmdr /usr/bin/
COPY --from=go-builder /build/chronex /app/chronex

ENTRYPOINT ["/app/chronex"]
```

### Phase 3 Deployment (Microservice)
```yaml
# docker-compose.yml
version: '3.8'
services:
  chronex-server:
    image: chronex:latest
    environment:
      - RENDERER_SERVICE_URL=http://renderer:8080
    depends_on:
      - renderer

  renderer:
    image: chronex-renderer:latest
    ports:
      - "8080:8080"
    environment:
      - CACHE_SIZE=1000
      - PORT=8080
```

---

## 6. FEATURE PARITY WITH MERMAID.JS

### Fully Supported (mmdr)
```
✅ Flowchart (all directions: LR, RL, TD, BT, TB)
✅ Sequence Diagram
✅ Class Diagram
✅ State Diagram v2
✅ ER Diagram
✅ Gantt Chart
✅ Pie Chart
✅ XY Chart (with some limitations)
✅ Quadrant Chart
✅ Mindmap
✅ Git Graph
✅ Sankey Diagram
```

### Partially Supported (mmdr)
```
⚠️ Timeline (basic support)
⚠️ Journey (basic support)
⚠️ C4 Diagram (basic support)
⚠️ Block Diagram (basic support)
```

### Not Supported (fallback to mermaid-cli)
```
❌ Packet Diagram
❌ ZenUML
❌ Some advanced animations
```

### Fallback Strategy
```go
func RenderWithFallback(
    ctx context.Context,
    diagram string,
) (string, error) {
    // Try mmdr first (fast)
    svg, err := mmdrRenderer.Render(ctx, diagram)
    if err == nil {
        return svg, nil
    }
    
    // Fallback to mermaid-cli if mmdr fails
    if os.Getenv("CHRONEX_MERMAID_FALLBACK") == "true" {
        return mermaidCliRenderer.Render(ctx, diagram)
    }
    
    return "", err
}
```

---

## 7. TESTING STRATEGY

```go
// backend/render/mermaid_test.go

func TestRenderFlowchart(t *testing.T) {
    diagram := "flowchart LR; A-->B-->C"
    svg, err := renderer.Render(diagram)
    
    assert.NoError(t, err)
    assert.True(t, strings.Contains(svg, "<svg"))
    assert.True(t, strings.Contains(svg, "A"))
    assert.True(t, strings.Contains(svg, "B"))
    assert.True(t, strings.Contains(svg, "C"))
}

func TestRenderPerformance(t *testing.T) {
    diagram := "flowchart LR; A-->B-->C"
    
    start := time.Now()
    _, err := renderer.Render(diagram)
    elapsed := time.Since(start)
    
    assert.NoError(t, err)
    assert.Less(t, elapsed, 100*time.Millisecond)  // CLI: OK
    // After FFI: assert.Less(t, elapsed, 10*time.Millisecond)
}

func TestInvalidDiagram(t *testing.T) {
    diagram := "invalid mermaid syntax ~~~"
    _, err := renderer.Render(diagram)
    
    assert.Error(t, err)
}

func TestCaching(t *testing.T) {
    diagram := "flowchart LR; A-->B-->C"
    
    start1 := time.Now()
    svg1, _ := renderer.Render(diagram)
    time1 := time.Since(start1)
    
    start2 := time.Now()
    svg2, _ := renderer.Render(diagram)  // Should be cached
    time2 := time.Since(start2)
    
    assert.Equal(t, svg1, svg2)
    assert.Less(t, time2, time1/2)  // Cached should be faster
}
```

---

## 8. MONITORING & OBSERVABILITY

```go
// Metrics to track
type MermaidMetrics struct {
    RenderedCount      int64
    FailedCount        int64
    AvgRenderTimeMs    float64
    CacheHitRate       float64
    TotalCachedSize    int64
}

// Prometheus metrics
vec := prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name: "chronex_mermaid_render_duration_ms",
        Help: "Time to render Mermaid diagram",
    },
    []string{"diagram_type", "cache_hit"},
)

// Log rendering events
log.WithFields(logrus.Fields{
    "diagram_type": "flowchart",
    "render_time": 3.5,
    "cache_hit": true,
    "block_id": "block-123",
}).Info("Rendered diagram")
```

---

## 9. SECURITY CONSIDERATIONS

### Input Validation
```go
// Prevent DoS via large diagrams
const maxDiagramSize = 10 * 1024  // 10 KB max

func ValidateDiagram(diagram string) error {
    if len(diagram) > maxDiagramSize {
        return errors.New("diagram too large")
    }
    
    // Check for injection attempts
    if strings.Contains(diagram, "script") {
        return errors.New("invalid content")
    }
    
    return nil
}
```

### Resource Limits
```go
// Timeout rendering to prevent hangs
ctx, cancel := context.WithTimeout(
    context.Background(),
    5*time.Second,
)
defer cancel()

svg, err := renderer.RenderWithContext(ctx, diagram)
```

### Output Sanitization
```go
// Ensure SVG is safe
func SanitizeSVG(svg string) string {
    // Remove any event handlers
    svg = strings.ReplaceAll(svg, "onclick=", "")
    svg = strings.ReplaceAll(svg, "onload=", "")
    // ... other script tag removal
    return svg
}
```

---

## 10. RECOMMENDATION

### For Chronex v1.0 (MVP)
```
❌ Skip Mermaid integration
  Reason: Not critical for MVP
  Focus on core block sync instead
```

### For Chronex v1.5 (Feature Release)
```
✅ Implement Phase 1 (CLI integration)
  Effort: 2-3 weeks
  Impact: Users can embed diagrams in blocks
  Performance: Acceptable (~20-50ms)
  Complexity: Low
```

### For Chronex v2.0+ (Optimization)
```
✅ Consider Phase 2 (FFI) if diagram rendering becomes bottleneck
  Effort: 2-3 weeks
  Impact: 5-10x performance improvement
  Performance: <10ms per diagram
```

---

## Summary

| Phase | Approach | Effort | Performance | Complexity |
|-------|----------|--------|-------------|-----------|
| 1 | CLI (mmdr binary) | 2-3w | ~20-50ms | Low |
| 2 | FFI (Rust library) | 2-3w | ~2-4ms | Medium |
| 3 | Microservice | 3-4w | ~10-20ms | High |

**Recommended starting point**: Phase 1 for v1.5, upgrade to Phase 2 if needed for v2.0.

---

**Document Status**: Integration Strategy - Complete  
**Next**: Implement Phase 1 when feature roadmap aligns with MVP completion
