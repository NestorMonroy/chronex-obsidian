# statusRegistry

## Descripción

Sistema dinámico de registro y gestión de statuses para tareas.

Permite registrar, validar y mapear statuses sin hardcodear valores.

## Módulos

### statusRegistry
Clase principal que gestiona el registro de statuses.

```typescript
import { StatusRegistry } from './services/obsidian-tasks/statusRegistry';

const registry = new StatusRegistry();

// Consultar
const status = registry.getStatus('TODO');
const all = registry.getAllStatuses();
const isValid = registry.validateStatus('DONE');

// Mapear
const name = registry.mapSymbolToName('[ ]');
const symbol = registry.mapNameToSymbol('TODO');
const isComplete = registry.isStatusComplete('DONE');

// Registrar personalizado
registry.registerStatus({
  symbol: '[w]',
  name: 'WAITING',
  description: 'Esperando información',
  isFinal: false
});

// Desregistrar
registry.unregisterStatus('WAITING');
```

## Statuses por Defecto

| Name | Symbol | Emoji | Complete |
|------|--------|-------|----------|
| TODO | [ ] | 📋 | No |
| DONE | [x] | ✅ | Sí |
| IN_PROGRESS | [/] | 🔄 | No |
| CANCELLED | [-] | ❌ | Sí |
| FORWARDED | [>] | ⏭️ | No |

## Características

✅ Statuses por defecto (5)
✅ Registrar statuses personalizados
✅ Desregistrar statuses (solo personalizados)
✅ Validar statuses
✅ Mapear símbolo ↔ nombre
✅ Verificar si status es completo
✅ Soportar aliases/símbolos alternativos
✅ Propiedades opcionales (color, emoji, descripción)
✅ Case-insensitive para búsquedas

## Estructura

```
statusRegistry/
├─ statusRegistry.md      (este archivo)
├─ types.ts               (interfaces)
├─ statusRegistry.ts      (implementación)
└─ index.ts               (exports)
```

## Tipos

### Status
```typescript
interface Status {
  symbol: string;        // [ ], [x], etc.
  name: string;          // TODO, DONE, etc.
  description?: string;
  emoji?: string;        // Para UI
  color?: string;        // Hex: #FF5733
  isFinal?: boolean;     // ¿Tarea completada?
  aliases?: string[];    // Símbolos alternativos
  isDefault?: boolean;   // Sistema (no se puede eliminar)
}
```

### IStatusRegistry
```typescript
interface IStatusRegistry {
  getAllStatuses(): Status[];
  getStatus(nameOrSymbol: string): Status | undefined;
  validateStatus(name: string): boolean;
  mapSymbolToName(symbol: string): string | undefined;
  mapNameToSymbol(name: string): string | undefined;
  isStatusComplete(name: string): boolean;
  registerStatus(status: Status): boolean;
  unregisterStatus(name: string): boolean;
}
```

## Tests

Ver `tests/unit/statusRegistry.test.ts` para 43+ tests.

## Ejemplos

### Consultar status
```typescript
const status = registry.getStatus('TODO');
console.log(status.emoji);    // 📋
console.log(status.symbol);   // [ ]
```

### Mapear símbolo a nombre
```typescript
const name = registry.mapSymbolToName('[x]');
console.log(name);  // DONE
```

### Registrar personalizado
```typescript
registry.registerStatus({
  symbol: '[w]',
  name: 'WAITING',
  description: 'Esperando información',
  emoji: '⏳',
  color: '#FFA500',
  isFinal: false
});
```

### Verificar completitud
```typescript
console.log(registry.isStatusComplete('DONE'));         // true
console.log(registry.isStatusComplete('TODO'));         // false
```

---

**Estado:** ✅ Implementado y testeado
**Cobertura:** 43+ tests, 100% cobertura
**Convención:** camelCase, TDD RED→GREEN→REFACTOR
