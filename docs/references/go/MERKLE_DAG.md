# Merkle DAG - Data Structure Fundamentals

## 📋 Resumen Ejecutivo

**Merkle DAG** (Merkle Directed Acyclic Graph) es una estructura de datos criptográfica que combina:
- ✅ **Merkle Trees** - Verificación criptográfica de integridad
- ✅ **DAG** - Grafo acíclico dirigido (múltiples padres permitidos)
- ✅ **Content Addressing** - Identificación por contenido, no por ubicación

Usado por: Git, IPFS, Bitcoin, Ethereum, y sistemas de backup modernos.

---

## 🏗️ Componentes Fundamentales

### 1. Merkle Tree (Árbol de Hash)

#### Concepto Básico

```
                    Root Hash: ABC123...
                         |
              ┌──────────┴──────────┐
              |                     |
         Hash(H1+H2)           Hash(H3+H4)
          /        \            /        \
      Hash1    Hash2        Hash3     Hash4
        |        |            |        |
      Data1    Data2        Data3    Data4
```

#### Construcción Paso a Paso

```
1. Cada archivo se divide en bloques
2. Hash de cada bloque: SHA-256(bloque)
3. Emparejar hashes: Hash(hash1 + hash2)
4. Repetir hasta alcanzar un único Root Hash

Ejemplo:
┌─────────────────────────────────────┐
│ Archivo: documento.pdf (8MB)        │
├─────────────────────────────────────┤
│ Dividido en 2048 bloques de 4KB     │
│                                     │
│ Hashes:                             │
│ block1 → SHA256 → a1b2c3...        │
│ block2 → SHA256 → d4e5f6...        │
│ ...                                 │
│ block2048 → SHA256 → z9y8x7...     │
│                                     │
│ Pairwise hashing:                   │
│ SHA256(a1b2c3 + d4e5f6) → h1       │
│ SHA256(... + ...) → h2              │
│ ...                                 │
│ SHA256(h1024 + h1025) → Root       │
└─────────────────────────────────────┘
```

#### Propiedades Clave

```
✅ Determinístico
   Same content → Same root hash (siempre)

✅ Verificable
   Puedo probar que block1000 está en el árbol
   Sin descargar los otros 2047 bloques
   Solo 11 hashes (log₂(2048))

✅ Inmutable
   Cambiar 1 bit en cualquier bloque
   → Cambia ese hash
   → Cambia hash padre
   → Cambia root hash
   → Todo el árbol se invalida

✅ Eficiente
   Almacenamiento: O(n) - un hash por bloque
   Verificación: O(log n) - logaritmo de bloques
```

---

### 2. Directed Acyclic Graph (DAG)

#### Merkle Tree vs Merkle DAG

**Merkle Tree** (estructura rígida):
```
    Root
    / \
   N1 N2
  / \  / \
L1 L2 L3 L4
```
- Cada nodo tiene exactamente 1 padre
- Estructura jerárquica y balanceada

**Merkle DAG** (estructura flexible):
```
       Root
      / | \
    N1  N2  N3
    |\  |\ /|
    L1 L2 L3 L4

    Propiedad: Un nodo puede tener múltiples padres
```

#### Ventajas del DAG

```go
// Múltiples padres = Deduplicación automática

// Escenario: Documentos compartidos
Document1 = [Intro, Chapter1, Chapter2, Conclusion]
Document2 = [Intro, Chapter3, Chapter2, References]

// Chapter2 aparece en ambos
// En Merkle Tree: Chapter2 está duplicado en memoria
// En Merkle DAG: Chapter2 se almacena UNA VEZ
//              Ambos documentos apuntan al mismo hash

Documento1 → Intro → Chapter1 → Chapter2 ← Chapter3 ← Document2
                               ↑
                        Shared node
```

---

## 🔐 Content Addressing

### ¿Qué es Content Addressing?

```
Dirección Tradicional (Location-based):
    Ubicación: https://ejemplo.com/file.pdf
    Problema: Si servidor se mueve → Link roto

Content Addressing (Hash-based):
    Dirección: QmABC123DEF456GHI789... (SHA-256)
    Ventaja: Mismo contenido → Mismo hash (siempre)
             Importa QUÉ es el archivo, no DÓNDE está
```

### Content Identifier (CID)

```
CID = [Encoding] + [Hash Algorithm] + [Hash Digest]

Ejemplo:
QmABCDEF...
│││││││││
│││││││││
││││││└─ Hash Digest (el SHA-256)
│││││└── Hash Algorithm (sha2-256)
││└───── IPFS multicodec
└─────── Encoding (base32)

Implicaciones:
✅ Mismo archivo siempre tiene mismo CID
✅ Imposible falsificar (hash criptográfico)
✅ No requiere servidor centralizado
✅ Ubicación del archivo es irrelevante
```

---

## 🔗 Estructura de Merkle DAG en IPFS

### Ejemplo Real: Almacenar un Archivo

```
Archivo: documento.txt (1MB)
    ↓
Dividir en bloques de 256KB (4 bloques)
    ↓
┌─────────────────────────────────────┐
│ Block1 (256KB)                      │
│ SHA-256: hash_b1                    │
├─────────────────────────────────────┤
│ Block2 (256KB)                      │
│ SHA-256: hash_b2                    │
├─────────────────────────────────────┤
│ Block3 (256KB)                      │
│ SHA-256: hash_b3                    │
├─────────────────────────────────────┤
│ Block4 (256KB)                      │
│ SHA-256: hash_b4                    │
└─────────────────────────────────────┘
    ↓
Crear Index Node (metadatos)
    {
        "name": "documento.txt",
        "size": 1048576,
        "links": [
            {"hash": hash_b1, "size": 262144},
            {"hash": hash_b2, "size": 262144},
            {"hash": hash_b3, "size": 262144},
            {"hash": hash_b4, "size": 262144}
        ]
    }
    ↓
SHA-256(Index) = hash_root
    ↓
Publicar: "Documento disponible en QmHash_root"
    ↓
Cualquiera puede:
1. Descargar desde cualquier peer con hash_root
2. Verificar integridad de cada bloque
3. Detectar tampering automáticamente
```

---

## 🔍 Verificación Criptográfica

### Cómo Verificar Integridad

```
Scenario: Descargar bloque de un peer aleatorio

┌────────────────────────────────────────────┐
│ Peer A quiere block2 de documento.txt      │
└────────────────────────────────────────────┘
    ↓
Pregunta: "¿Tienes bloque con hash XYZ?"
    ↓
Peer B responde: "Sí, aquí está"
    ↓
Peer A recibe datos
    ↓
SHA-256(datos recibidos) = ?
    ↓
¿Resultado == hash_b2?
    ├─ SÍ  → Bloque verificado ✅
    └─ NO  → Tampering detectado ❌ Rechazar

Ventaja: NO necesito confiar en Peer B
         Matemáticas certifican integridad
```

### Merkle Proof (Prueba Mínima)

```
Tengo Root: ABC123... de 2048 bloques

¿Prueba mínima de que bloque 1000 existe?
Respuesta: 11 hashes (log₂(2048) = 11)

┌─────────────────────────────────────┐
│ Root: ABC123                        │
├─────────────────────────────────────┤
│ Path necesario:                     │
│ - Hash(sibling de 1000)             │
│ - Hash(sibling del padre)           │
│ - Hash(sibling del abuelo)          │
│ ... (11 total)                      │
└─────────────────────────────────────┘

Verificación:
SHA256(bloque_1000 + sibling) = parent_hash
SHA256(parent_hash + sibling) = grandparent
...
SHA256(...) = ABC123 ✅

Beneficio: Prueba con 11 hashes vs 2048 bloques
          0.5% del tamaño original
```

---

## 📊 Merkle DAG en Git

Git usa Merkle DAG para versionado:

```
Git Repository Structure:

┌─ Commit A (hash: abc123)
│  ├─ Tree (hash: tree1)
│  │  ├─ file1.txt (blob: blob1)
│  │  └─ file2.txt (blob: blob2)
│  └─ Parent: None (first commit)
│
├─ Commit B (hash: def456)
│  ├─ Tree (hash: tree2)
│  │  ├─ file1.txt (blob: blob1) ← Mismo que Commit A
│  │  └─ file2.txt (blob: blob3) ← Modificado
│  └─ Parent: abc123
│
└─ Commit C (hash: ghi789)
   ├─ Tree (hash: tree2) ← Mismo que Commit B
   └─ Parent: def456

Propiedades:
✅ blob1 aparece en A y B, pero se almacena UNA VEZ (deduplicación)
✅ tree2 aparece en B y C, referenciado por ambos
✅ Cada commit incluye hash de padre → historial inmutable
✅ Si cambio un blob, todos los commits posteriores se invalidan
```

---

## 💾 Casos de Uso de Merkle DAG

### 1. **IPFS (InterPlanetary File System)**
```
- Almacenamiento distribuido
- Content addressing
- Deduplicación global
- P2P file sharing
```

### 2. **Git (Version Control)**
```
- Historial de cambios
- Ramas y merges
- Detección de corrupción
- Colaboración distribuida
```

### 3. **Bitcoin (Blockchain)**
```
- Transacciones organizadas en árbol
- Merkle Root en block header
- Verificación rápida de transacciones
- Prueba de work
```

### 4. **Sistemas de Backup**
```
- Deduplicación automática
- Verificación de integridad
- Recuperación selectiva
- Compresión eficiente
```

---

## 🎯 Ventajas y Limitaciones

### ✅ Ventajas

```
1. Eficiencia
   - Verificación logarítmica O(log n)
   - Almacenamiento óptimo con deduplicación

2. Seguridad
   - Verificación criptográfica
   - Detección de tampering inmediata

3. Paralelismo
   - Calcular hashes de múltiples bloques en paralelo
   - No necesita procesamiento secuencial

4. Escalabilidad
   - Funciona con petabytes de datos
   - Mismo costo logarítmico

5. Integridad
   - Garantía matemática de correctness
   - No requiere trusted third party
```

### ❌ Limitaciones

```
1. Almacenamiento de Hashes
   - Cada bloque necesita su hash
   - Overhead: ~3-5% del tamaño original

2. Recalcular Hashes
   - Si cambio 1 byte: recalcular todo el árbol
   - O(n) operación en peor caso

3. Complejidad
   - Implementación correcta es no-trivial
   - Necesita cuidado con endianness, encoding, etc.

4. No es Compresión
   - Merkle Tree NO comprime datos
   - Solo verifica, no reduce tamaño

5. Exposición de Estructura
   - Merkle root revela estructura del árbol
   - En algunos casos, privacidad limitada
```

---

## 🔗 Comparación: Merkle Tree vs Alternativas

| Aspecto | Merkle Tree | Hash Chain | Blockchain |
|---------|------------|-----------|-----------|
| **Verificación** | O(log n) | O(n) | O(1) |
| **Escalabilidad** | Excelente | Pobre | Buena |
| **Complejidad** | Media | Baja | Alta |
| **Uso** | Integridad | Secuencia | Consenso |
| **Deduplicación** | Sí | No | No |

---

## 💡 Implementación Conceptual en Go

### Struktur Básica

```go
package merkle

import (
    "crypto/sha256"
    "encoding/hex"
)

type MerkleNode struct {
    Hash   string       // SHA-256 del contenido
    Data   []byte       // Datos (en hoja) o nil (en nodo interno)
    Left   *MerkleNode
    Right  *MerkleNode
    Parent *MerkleNode
}

type MerkleDAG struct {
    Root  *MerkleNode
    Nodes map[string]*MerkleNode // CID -> Node
}

// Crear hoja (bloque de datos)
func NewLeaf(data []byte) *MerkleNode {
    hash := sha256.Sum256(data)
    return &MerkleNode{
        Hash: hex.EncodeToString(hash[:]),
        Data: data,
    }
}

// Crear nodo interno (combinar dos hashes)
func CombineNodes(left, right *MerkleNode) *MerkleNode {
    combined := append(
        []byte(left.Hash),
        []byte(right.Hash)...,
    )
    hash := sha256.Sum256(combined)
    
    return &MerkleNode{
        Hash:  hex.EncodeToString(hash[:]),
        Left:  left,
        Right: right,
    }
}

// Construir árbol desde bloques
func (dag *MerkleDAG) BuildTree(blocks [][]byte) *MerkleNode {
    if len(blocks) == 0 {
        return nil
    }
    
    // Crear hojas
    nodes := make([]*MerkleNode, len(blocks))
    for i, block := range blocks {
        nodes[i] = NewLeaf(block)
        dag.Nodes[nodes[i].Hash] = nodes[i]
    }
    
    // Construir árbol bottom-up
    for len(nodes) > 1 {
        var parents []*MerkleNode
        
        for i := 0; i < len(nodes); i += 2 {
            var parent *MerkleNode
            if i+1 < len(nodes) {
                parent = CombineNodes(nodes[i], nodes[i+1])
            } else {
                // Nodo impar, promover
                parent = nodes[i]
            }
            parents = append(parents, parent)
            dag.Nodes[parent.Hash] = parent
        }
        
        nodes = parents
    }
    
    dag.Root = nodes[0]
    return nodes[0]
}

// Verificar integridad de bloque
func (dag *MerkleDAG) VerifyBlock(blockHash string) bool {
    node, exists := dag.Nodes[blockHash]
    if !exists {
        return false
    }
    
    // Recalcular hash desde datos
    if node.Data != nil {
        hash := sha256.Sum256(node.Data)
        return hex.EncodeToString(hash[:]) == blockHash
    }
    
    return true
}

// Merkle proof: probar que bloque está en árbol
func (dag *MerkleDAG) GetMerkleProof(blockHash string) []string {
    var proof []string
    
    node, exists := dag.Nodes[blockHash]
    if !exists {
        return proof
    }
    
    // Subir hasta root, guardando hashes hermanos
    for node.Parent != nil {
        parent := node.Parent
        
        if parent.Left == node {
            // Hermano está a derecha
            if parent.Right != nil {
                proof = append(proof, parent.Right.Hash)
            }
        } else {
            // Hermano está a izquierda
            if parent.Left != nil {
                proof = append(proof, parent.Left.Hash)
            }
        }
        
        node = parent
    }
    
    return proof
}
```

---

## 📚 Referencias

- [IPFS Merkle DAG](https://docs.ipfs.tech/concepts/merkle-dag/)
- [Merkle Tree Wikipedia](https://en.wikipedia.org/wiki/Merkle_tree)
- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals)
- [Bitcoin Merkle Root](https://en.wikipedia.org/wiki/Bitcoin#Blockchain)
- [Cryptographic Hash Functions](https://www.helius.dev/blog/cryptographic-tools-101-hash-functions-and-merkle-trees-explained)

---

## ✅ Conclusión

**Merkle DAG es el patrón fundamental** para:
- ✅ Verificación criptográfica eficiente
- ✅ Deduplicación automática
- ✅ Sistemas distribuidos sin punto de falla central
- ✅ Control de versiones distribuido
- ✅ Blockchains y criptomonedas

**Para Chronex**: Podríamos usar Merkle Tree para verificar integridad de snapshots, pero NO necesitamos la complejidad de un DAG completo.
