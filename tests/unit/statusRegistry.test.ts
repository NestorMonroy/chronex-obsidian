/**
 * UC-043: STATUS REGISTRY - REGISTRO DINÁMICO DE STATUSES
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema para registrar, validar y mapear statuses de tareas.
 * Permite customización dinámica de statuses sin hardcodear.
 * 
 * Convención de nombres:
 * ✅ camelCase: statusRegistry, registerStatus, validateStatus
 * ✅ Archivo: statusRegistry.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock Status mientras no exista
 */
interface Status {
  symbol: string;      // [ ], [x], [/], [-], [>]
  name: string;        // TODO, DONE, IN_PROGRESS
  aliases?: string[];  // [o], [ ] (alternativas)
  emoji?: string;      // 📋, ✅, 🔄, ❌, ⏭️
  description?: string;
  color?: string;      // Para UI
  isFinal?: boolean;   // ¿Tarea terminada?
}

/**
 * Mock StatusRegistry mientras no exista
 */
interface IStatusRegistry {
  getAllStatuses(): Status[];
  getStatus(nameOrSymbol: string): Status | undefined;
  registerStatus(status: Status): boolean;
  unregisterStatus(name: string): boolean;
  validateStatus(name: string): boolean;
  mapSymbolToName(symbol: string): string | undefined;
  mapNameToSymbol(name: string): string | undefined;
  isStatusComplete(name: string): boolean;
}

describe('UC-043: statusRegistry - Status Registry', () => {
  let registry: IStatusRegistry;

  beforeEach(() => {
    // Importar registry limpio para cada test
    // En implementación, será una clase que se instancia
    const StatusRegistry = require('../../src/services/obsidian-tasks/statusRegistry').StatusRegistry;
    registry = new StatusRegistry();
  });

  // ==================== STATUSES POR DEFECTO ====================
  describe('statusRegistry - Statuses por defecto', () => {
    test('debe incluir status TODO por defecto', () => {
      const status = registry.getStatus('TODO');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[ ]');
      expect(status?.name).toBe('TODO');
      expect(status?.isFinal).toBe(false);
    });

    test('debe incluir status DONE por defecto', () => {
      const status = registry.getStatus('DONE');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[x]');
      expect(status?.name).toBe('DONE');
      expect(status?.isFinal).toBe(true);
    });

    test('debe incluir status IN_PROGRESS por defecto', () => {
      const status = registry.getStatus('IN_PROGRESS');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[/]');
      expect(status?.name).toBe('IN_PROGRESS');
      expect(status?.isFinal).toBe(false);
    });

    test('debe incluir status CANCELLED por defecto', () => {
      const status = registry.getStatus('CANCELLED');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[-]');
      expect(status?.name).toBe('CANCELLED');
      expect(status?.isFinal).toBe(true);
    });

    test('debe incluir status FORWARDED por defecto', () => {
      const status = registry.getStatus('FORWARDED');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[>]');
      expect(status?.name).toBe('FORWARDED');
      expect(status?.isFinal).toBe(false);
    });

    test('debe tener al menos 5 statuses por defecto', () => {
      const all = registry.getAllStatuses();
      
      expect(all.length).toBeGreaterThanOrEqual(5);
      expect(all.map(s => s.name)).toContain('TODO');
      expect(all.map(s => s.name)).toContain('DONE');
      expect(all.map(s => s.name)).toContain('IN_PROGRESS');
      expect(all.map(s => s.name)).toContain('CANCELLED');
      expect(all.map(s => s.name)).toContain('FORWARDED');
    });
  });

  // ==================== MAPEO SYMBOL ↔ NAME ====================
  describe('statusRegistry - Mapeo Symbol ↔ Name', () => {
    test('debe mapear symbol [ ] → TODO', () => {
      const name = registry.mapSymbolToName('[ ]');
      
      expect(name).toBe('TODO');
    });

    test('debe mapear symbol [x] → DONE', () => {
      const name = registry.mapSymbolToName('[x]');
      
      expect(name).toBe('DONE');
    });

    test('debe mapear symbol [/] → IN_PROGRESS', () => {
      const name = registry.mapSymbolToName('[/]');
      
      expect(name).toBe('IN_PROGRESS');
    });

    test('debe mapear symbol [-] → CANCELLED', () => {
      const name = registry.mapSymbolToName('[-]');
      
      expect(name).toBe('CANCELLED');
    });

    test('debe mapear symbol [>] → FORWARDED', () => {
      const name = registry.mapSymbolToName('[>]');
      
      expect(name).toBe('FORWARDED');
    });

    test('debe mapear name TODO → [ ]', () => {
      const symbol = registry.mapNameToSymbol('TODO');
      
      expect(symbol).toBe('[ ]');
    });

    test('debe mapear name DONE → [x]', () => {
      const symbol = registry.mapNameToSymbol('DONE');
      
      expect(symbol).toBe('[x]');
    });

    test('debe retornar undefined para symbol inválido', () => {
      const name = registry.mapSymbolToName('[invalid]');
      
      expect(name).toBeUndefined();
    });

    test('debe retornar undefined para name inválido', () => {
      const symbol = registry.mapNameToSymbol('INVALID_STATUS');
      
      expect(symbol).toBeUndefined();
    });
  });

  // ==================== VALIDACIÓN ====================
  describe('statusRegistry - Validación', () => {
    test('debe validar status TODO', () => {
      const valid = registry.validateStatus('TODO');
      
      expect(valid).toBe(true);
    });

    test('debe validar status DONE', () => {
      const valid = registry.validateStatus('DONE');
      
      expect(valid).toBe(true);
    });

    test('debe validar status IN_PROGRESS', () => {
      const valid = registry.validateStatus('IN_PROGRESS');
      
      expect(valid).toBe(true);
    });

    test('debe rechazar status inválido', () => {
      const valid = registry.validateStatus('INVALID_STATUS');
      
      expect(valid).toBe(false);
    });

    test('debe rechazar status vacío', () => {
      const valid = registry.validateStatus('');
      
      expect(valid).toBe(false);
    });

    test('debe rechazar status null/undefined', () => {
      expect(registry.validateStatus(null as any)).toBe(false);
      expect(registry.validateStatus(undefined as any)).toBe(false);
    });
  });

  // ==================== COMPLETITUD ====================
  describe('statusRegistry - Completitud de tareas', () => {
    test('debe indicar que DONE es status completo', () => {
      const isComplete = registry.isStatusComplete('DONE');
      
      expect(isComplete).toBe(true);
    });

    test('debe indicar que CANCELLED es status completo', () => {
      const isComplete = registry.isStatusComplete('CANCELLED');
      
      expect(isComplete).toBe(true);
    });

    test('debe indicar que TODO NO es status completo', () => {
      const isComplete = registry.isStatusComplete('TODO');
      
      expect(isComplete).toBe(false);
    });

    test('debe indicar que IN_PROGRESS NO es status completo', () => {
      const isComplete = registry.isStatusComplete('IN_PROGRESS');
      
      expect(isComplete).toBe(false);
    });

    test('debe indicar que FORWARDED NO es status completo', () => {
      const isComplete = registry.isStatusComplete('FORWARDED');
      
      expect(isComplete).toBe(false);
    });
  });

  // ==================== REGISTRO PERSONALIZADO ====================
  describe('statusRegistry - Registro personalizado', () => {
    test('debe registrar status personalizado', () => {
      const customStatus: Status = {
        symbol: '[w]',
        name: 'WAITING',
        description: 'Esperando información',
        isFinal: false
      };
      
      const registered = registry.registerStatus(customStatus);
      
      expect(registered).toBe(true);
      expect(registry.validateStatus('WAITING')).toBe(true);
      
      // Verificar propiedades clave (isDefault se agrega automáticamente)
      const retrieved = registry.getStatus('WAITING');
      expect(retrieved?.symbol).toBe('[w]');
      expect(retrieved?.name).toBe('WAITING');
      expect(retrieved?.description).toBe('Esperando información');
      expect(retrieved?.isFinal).toBe(false);
    });

    test('debe rechazar registrar status duplicado', () => {
      const status1: Status = {
        symbol: '[w]',
        name: 'WAITING',
        isFinal: false
      };
      
      registry.registerStatus(status1);
      const result = registry.registerStatus(status1);
      
      expect(result).toBe(false);
    });

    test('debe mapear symbol personalizado', () => {
      const customStatus: Status = {
        symbol: '[?]',
        name: 'UNCERTAIN',
        isFinal: false
      };
      
      registry.registerStatus(customStatus);
      
      expect(registry.mapSymbolToName('[?]')).toBe('UNCERTAIN');
      expect(registry.mapNameToSymbol('UNCERTAIN')).toBe('[?]');
    });

    test('debe permitir registrar status con aliases', () => {
      const status: Status = {
        symbol: '[p]',
        name: 'PENDING',
        aliases: ['WAITING', 'PAUSED'],
        isFinal: false
      };
      
      const registered = registry.registerStatus(status);
      
      expect(registered).toBe(true);
      expect(registry.getStatus('PENDING')).toBeDefined();
    });

    test('debe permitir múltiples símbolos para mismo status (aliases)', () => {
      const status: Status = {
        symbol: '[o]',
        name: 'OPEN',
        aliases: ['[ ]', 'ACTIVE'],
        isFinal: false
      };
      
      registry.registerStatus(status);
      
      // Ambos símbolos deberían mapear al mismo status
      expect(registry.mapSymbolToName('[o]')).toBe('OPEN');
    });
  });

  // ==================== DESREGISTRO ====================
  describe('statusRegistry - Desregistro', () => {
    test('debe desregistrar status personalizado', () => {
      const status: Status = {
        symbol: '[x2]',
        name: 'DUPLICATED',
        isFinal: true
      };
      
      registry.registerStatus(status);
      expect(registry.validateStatus('DUPLICATED')).toBe(true);
      
      const unregistered = registry.unregisterStatus('DUPLICATED');
      
      expect(unregistered).toBe(true);
      expect(registry.validateStatus('DUPLICATED')).toBe(false);
    });

    test('debe rechazar desregistrar status que no existe', () => {
      const unregistered = registry.unregisterStatus('NONEXISTENT');
      
      expect(unregistered).toBe(false);
    });

    test('no debe permitir desregistrar statuses por defecto', () => {
      const unregistered = registry.unregisterStatus('TODO');
      
      expect(unregistered).toBe(false);
      expect(registry.validateStatus('TODO')).toBe(true);
    });
  });

  // ==================== OBTENER INFORMACIÓN ====================
  describe('statusRegistry - Obtener información', () => {
    test('debe obtener status por nombre', () => {
      const status = registry.getStatus('TODO');
      
      expect(status).toBeDefined();
      expect(status?.name).toBe('TODO');
    });

    test('debe obtener status por símbolo', () => {
      const status = registry.getStatus('[ ]');
      
      expect(status).toBeDefined();
      expect(status?.symbol).toBe('[ ]');
    });

    test('debe retornar undefined para status inexistente', () => {
      const status = registry.getStatus('NONEXISTENT');
      
      expect(status).toBeUndefined();
    });

    test('debe retornar todos los statuses', () => {
      const all = registry.getAllStatuses();
      
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
      expect(all.every(s => s.symbol && s.name)).toBe(true);
    });

    test('debe tener emoji para statuses por defecto', () => {
      const all = registry.getAllStatuses();
      
      // Al menos los statuses por defecto deberían tener emoji
      const defaultStatuses = all.filter(s => 
        ['TODO', 'DONE', 'IN_PROGRESS', 'CANCELLED', 'FORWARDED'].includes(s.name)
      );
      
      defaultStatuses.forEach(s => {
        expect(s.emoji).toBeDefined();
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe('statusRegistry - Edge cases', () => {
    test('debe ser case-insensitive para búsqueda de status', () => {
      const lower = registry.getStatus('todo');
      const upper = registry.getStatus('TODO');
      
      // Ambas deberían encontrar el mismo status
      expect(lower?.name).toBe(upper?.name);
    });

    test('debe manejar búsqueda con whitespace', () => {
      const status = registry.getStatus('  TODO  ');
      
      expect(status?.name).toBe('TODO');
    });

    test('debe permitir descripción larga', () => {
      const longDescription = 'A'.repeat(500);
      const status: Status = {
        symbol: '[l]',
        name: 'LONG_DESC',
        description: longDescription,
        isFinal: false
      };
      
      registry.registerStatus(status);
      
      expect(registry.getStatus('LONG_DESC')?.description).toBe(longDescription);
    });

    test('debe preservar propiedades opcionales', () => {
      const status: Status = {
        symbol: '[c]',
        name: 'CUSTOM',
        color: '#FF5733',
        emoji: '🎯',
        description: 'Custom status',
        isFinal: false
      };
      
      registry.registerStatus(status);
      const retrieved = registry.getStatus('CUSTOM');
      
      expect(retrieved?.color).toBe('#FF5733');
      expect(retrieved?.emoji).toBe('🎯');
      expect(retrieved?.description).toBe('Custom status');
    });
  });
});
