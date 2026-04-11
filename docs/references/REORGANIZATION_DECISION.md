# Documentation Reorganization Decision

**Date**: 2026-04-11  
**Basis**: arc42 by Example, 3rd Edition - "Thematic Drawers" Pattern  
**Decision**: Reorganize `docs/` from numeric sections (01-, 02-) to thematic independent "drawers"

---

## Problem Statement

Original structure:
```
docs/
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] CONVENTIONS.md
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] [no sub-organization]
```

Issues:
- No clear separation of concerns
- No thematic grouping
- No relationship between quality-goals and quality-scenarios
- Difficult to navigate for specific topics

---

## arc42 Insight: "Thematic Drawers"

From "arc42 by Example" (Chapter 1):

> "Compare arc42 with a filing cabinet with drawers: the drawers are clearly labeled with topics or aspects of the architecture."

Two key properties of a drawer:
1. **Clearly labeled** - the name says what's inside
2. **Independent** - you can open ONE drawer without opening another

---

## Evidence from the Book

### Finding 1: FotoMaX Reorders Sections

FotoMaX (Chapter VII) explicitly deviates from standard arc42 structure:

> "This chapter deviates from the official structure to provide readers with the necessary context to understand all other sections."

**FotoMaX moved Section 10 (Quality Scenarios) to position 3** because readers need that context early.

**Implication**: The numeric order is NOT sacred. What matters is COMPREHENSIBILITY.

### Finding 2: Quality Goals and Quality Scenarios Are Always Together

All 7 examples show a direct connection between quality goals (1.2) and quality scenarios (10):

| Example | Connection |
|---------|-----------|
| biking2 | "Evaluation happens with scenarios" |
| DokChess | "Scenarios represent fundamental goals" |
| FotoMaX | **Unified in a single section** |

**Implication**: These topics MUST be neighbors in the structure.

### Finding 3: Subsections 1.1/1.2/1.3 Are Independent

In all examples, Section 1 has:
- 1.1: Requirements Overview (autocontained)
- 1.2: Quality Goals (autocontained, references Section 10)
- 1.3: Stakeholders (autocontained)

These are INDEPENDENT topics, not hierarchical subdivisions.

**Implication**: If they're independent in documentation, they're independent folders in filesystem.

### Finding 4: MiniMenu Demonstrates Extreme Adaptability

Chapter VIII shows arc42 reduced to a mind map, no text or tables.

> "Show that arc42 can be EXTREMELY adapted... to keep only a minimum amount of documentation."

**Implication**: If arc42 can be reduced to a mind map, it can certainly be reorganized.

---

## Solution: Thematic "Drawers"

New structure groups content by THEME, not by arc42 section number:

```
docs/
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] specification/          (drawer: "What the system does")
[DONE]”‚   [DONE]”[DONE][DONE]”[READY][DONE]”[READY] use-cases/
[DONE]”‚   [DONE]””[DONE]”[READY][DONE]”[READY] templates/
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] analysis/               (drawer: "Problems and improvements")
[DONE]”‚   [DONE]”[DONE][DONE]”[READY][DONE]”[READY] operations/
[DONE]”‚   [DONE]”[DONE][DONE]”[READY][DONE]”[READY] current-system/
[DONE]”‚   [DONE]””[DONE]”[READY][DONE]”[READY] refactoring/
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] architecture/           (drawer: "How it's organized and validated")
[DONE]”‚   [DONE]”[DONE][DONE]”[READY][DONE]”[READY] actors/
[DONE]”‚   [DONE]”[DONE][DONE]”[READY][DONE]”[READY] flows/
[DONE]”‚   [DONE]””[DONE]”[READY][DONE]”[READY] validation/
[DONE]”[DONE][DONE]”[READY][DONE]”[READY] conventions/            (drawer: "How to write code")
[DONE]””[DONE]”[READY][DONE]”[READY] references/             (drawer: "External and reference material")
```

Each drawer:
- [DONE] Clearly labeled
- [DONE] Independent
- [DONE] Self-contained
- [DONE] Can be read in any order
- [DONE] Has internal index for navigation

---

## Mapping to PASO 1, 2, 3

| New Structure | PASO | Content |
|---------------|------|---------|
| `specification/` | PASO 2 | 5 UCs, templates, IEEE 830 |
| `analysis/` | PASO 1 V4 | Atomic ops, violations, roadmap |
| `architecture/` | PASO 3 | Actors, flows, validation |
| `conventions/` | FASE 1 | Code standards |
| `references/` | External | arc42 analysis, stakeholders |

---

## Benefits

1. **Clarity**: Each drawer has a clear, single purpose
2. **Independence**: No need to open one drawer to understand another
3. **Searchability**: Topic-based names are easier to find than numbers
4. **Scalability**: Easy to add new drawers (e.g., `deployment/`, `testing/`)
5. **arc42 Alignment**: Follows official book's philosophy of adaptability
6. **Non-prescriptive**: Numbers weren't necessary anyway

---

## Precedent

arc42 itself says (Chapter 0):

> "Compare arc42 with a filing cabinet with drawers: the drawers are clearly labeled with topics or aspects of the architecture."

This reorganization follows that metaphor exactly: each drawer is labeled with its TOPIC, not a SEQUENCE NUMBER.

---

## Conclusion

The reorganization:
- [DONE] Follows arc42's philosophical guidance
- [DONE] Uses evidence from 7 examples in the book
- [DONE] Maintains all content integrity
- [DONE] Improves navigability
- [DONE] Enables future growth
- [DONE] Aligns with "thematic drawers" principle

**Status**: DECISION IMPLEMENTED
