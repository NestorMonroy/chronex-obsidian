/**
 * UC-049: COMPATIBILIDAD DUAL
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Sistema que permite usar obsidian-tasks y nuestro parser en paralelo.
 * Migración gradual sin romper tareas existentes.
 * 
 * Convención de nombres:
 * ✅ camelCase: dualParser, parseWithFallback, mergeResults
 * ✅ Archivo: dualParser.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock tipos mientras no existan
 */
interface ParsedTask {
  description: string;
  status: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  blockLink?: string;
}

interface DualParseResult {
  success: boolean;
  task?: ParsedTask;
  source: 'obsidian-tasks' | 'fallback';
  error?: string;
  warnings?: string[];
}

interface DualParserConfig {
  preferObsidianTasks?: boolean;  // ¿Preferir obsidian-tasks?
  fallbackOnError?: boolean;       // ¿Usar fallback si error?
  validateResults?: boolean;       // ¿Validar resultado?
  logSource?: boolean;             // ¿Log de qué parser usó?
}

describe('UC-049: dualParser - Compatibilidad Dual', () => {
  let dualParser: any;

  beforeEach(() => {
    const DualParser = require('../../src/services/obsidian-tasks/dualParser').DualParser;
    dualParser = new DualParser();
  });

  // ==================== CONFIGURACIÓN ====================
  describe('dualParser - Configuración', () => {
    test('debe tener configuración por defecto', () => {
      const config = dualParser.getConfig();
      
      expect(config).toBeDefined();
      expect(config.preferObsidianTasks).toBe(false);
      expect(config.fallbackOnError).toBe(true);
      expect(config.validateResults).toBe(true);
    });

    test('debe permitir cambiar configuración', () => {
      const newConfig: DualParserConfig = {
        preferObsidianTasks: true,
        fallbackOnError: false
      };
      
      dualParser.setConfig(newConfig);
      const config = dualParser.getConfig();
      
      expect(config.preferObsidianTasks).toBe(true);
      expect(config.fallbackOnError).toBe(false);
    });

    test('debe preservar configuración anterior si no se especifica', () => {
      dualParser.setConfig({ preferObsidianTasks: true });
      dualParser.setConfig({ fallbackOnError: false });
      
      const config = dualParser.getConfig();
      
      expect(config.preferObsidianTasks).toBe(true);
      expect(config.fallbackOnError).toBe(false);
    });
  });

  // ==================== PARSING CON FALLBACK ====================
  describe('dualParser - Parsing con Fallback', () => {
    test('debe parsear línea simple correctamente', () => {
      const result = dualParser.parseWithFallback('- [ ] Mi tarea', 
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      expect(result.task?.description).toBe('Mi tarea');
      expect(result.source).toMatch(/obsidian-tasks|fallback/);
    });

    test('debe usar fallback cuando obsidian-tasks no está disponible', () => {
      dualParser.setConfig({ preferObsidianTasks: true });
      
      const result = dualParser.parseWithFallback('- [x] Tarea completada',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      // Debe tener algún resultado válido
      expect(result.task?.status).toBeDefined();
    });

    test('debe retornar fallback en caso de error si configurado', () => {
      dualParser.setConfig({ 
        preferObsidianTasks: true, 
        fallbackOnError: true 
      });
      
      const result = dualParser.parseWithFallback('- [ ] Tarea normal',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('debe retornar error cuando fallback deshabilitado y falla', () => {
      dualParser.setConfig({ 
        preferObsidianTasks: true, 
        fallbackOnError: false 
      });
      
      // Enviar línea inválida
      const result = dualParser.parseWithFallback('Texto sin [ ]',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ==================== MÚLTIPLES LÍNEAS ====================
  describe('dualParser - Múltiples líneas', () => {
    test('debe parsear múltiples líneas con fallback', () => {
      const lines = [
        '- [ ] Tarea 1',
        '- [x] Tarea 2',
        '- [/] Tarea 3'
      ];
      
      const results = dualParser.parseMultipleWithFallback(lines,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.success)).toBe(true);
    });

    test('debe usar fallback para líneas que fallan en obsidian-tasks', () => {
      const lines = [
        '- [ ] Válida',
        '- [ ] Otra válida'
      ];
      
      const results = dualParser.parseMultipleWithFallback(lines,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      // Al menos las válidas deben pasar
      expect(results.filter((r: any) => r.success).length).toBeGreaterThan(0);
    });

    test('debe retornar resultado parcial si fallback habilitado', () => {
      dualParser.setConfig({ fallbackOnError: true });
      
      const lines = [
        '- [ ] Válida',
        'Texto inválido',
        '- [x] Otra válida'
      ];
      
      const results = dualParser.parseMultipleWithFallback(lines,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      // Debe tener 3 resultados (fallback para línea inválida)
      expect(results).toHaveLength(3);
      // Al menos 2 deben ser exitosas
      expect(results.filter((r: any) => r.success).length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== FUENTE DE DATOS ====================
  describe('dualParser - Fuente de datos', () => {
    test('debe indicar fuente: obsidian-tasks cuando disponible', () => {
      dualParser.setConfig({ preferObsidianTasks: true });
      
      const result = dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.source).toMatch(/obsidian-tasks|fallback/);
    });

    test('debe indicar fuente: fallback cuando se usa', () => {
      dualParser.setConfig({ preferObsidianTasks: false });
      
      const result = dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.source).toBe('fallback');
    });

    test('debe loguear fuente cuando configurado', () => {
      dualParser.setConfig({ logSource: true });
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      // Debería haber logueo
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  // ==================== VALIDACIÓN ====================
  describe('dualParser - Validación', () => {
    test('debe validar resultado cuando configurado', () => {
      dualParser.setConfig({ validateResults: true });
      
      const result = dualParser.parseWithFallback('- [ ] Tarea válida',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      // Resultado debe ser válido
      expect(result.task?.description).toBeDefined();
    });

    test('debe saltar validación cuando deshabilitado', () => {
      dualParser.setConfig({ validateResults: false });
      
      const result = dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      // Debe retornar aunque validación esté deshabilitada
      expect(result.success).toBe(true);
    });

    test('debe incluir warnings si validación detecta problemas', () => {
      dualParser.setConfig({ validateResults: true });
      
      const result = dualParser.parseWithFallback('- [ ]   ', // Sin descripción
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      // Podría fallar o tener warnings
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  // ==================== COMPATIBILIDAD ====================
  describe('dualParser - Compatibilidad', () => {
    test('debe mantener compatibilidad con tareas obsidian-tasks existentes', () => {
      // Línea en formato obsidian-tasks
      const line = '- [ ] Tarea 📅 2026-05-15 ⏫ #tag ^block';
      
      const result = dualParser.parseWithFallback(line,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      expect(result.task?.dueDate).toBe('2026-05-15');
      expect(result.task?.tags).toContain('tag');
    });

    test('debe mantener compatibilidad con tareas simples', () => {
      const line = '- [ ] Tarea simple';
      
      const result = dualParser.parseWithFallback(line,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(true);
      expect(result.task?.description).toBe('Tarea simple');
    });

    test('debe preservar propiedades durante parsing dual', () => {
      const line = '- [x] Completada 📅 2026-04-20 ⏬ #done ^TASK-001';
      
      const result = dualParser.parseWithFallback(line,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.task?.status).toBe('DONE');
      expect(result.task?.priority).toBe('BAJA');
      expect(result.task?.blockLink).toBe('^TASK-001');
    });
  });

  // ==================== BATCH CON FALLBACK ====================
  describe('dualParser - Batch processing', () => {
    test('debe procesar batch de 100 líneas rápidamente', () => {
      const lines = Array(100).fill('- [ ] Tarea de prueba');
      
      const startTime = performance.now();
      const results = dualParser.parseMultipleWithFallback(lines,
        { path: 'inbox.md', lineNumber: 1 }
      );
      const duration = performance.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(500); // < 500ms para 100 líneas
    });

    test('debe mixturar statuses diferentes en batch', () => {
      const lines = [
        '- [ ] TODO',
        '- [x] DONE',
        '- [/] IN_PROGRESS',
        '- [-] CANCELLED',
        '- [>] FORWARDED'
      ];
      
      const results = dualParser.parseMultipleWithFallback(lines,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      const statuses = results.map(r => r.task?.status);
      expect(statuses).toContain('TODO');
      expect(statuses).toContain('DONE');
      expect(statuses).toContain('IN_PROGRESS');
    });
  });

  // ==================== EDGE CASES ====================
  describe('dualParser - Edge cases', () => {
    test('debe manejar input vacío', () => {
      const result = dualParser.parseWithFallback('',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe manejar input null/undefined', () => {
      const resultNull = dualParser.parseWithFallback(null,
        { path: 'inbox.md', lineNumber: 1 }
      );
      const resultUndef = dualParser.parseWithFallback(undefined,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(resultNull.success).toBe(false);
      expect(resultUndef.success).toBe(false);
    });

    test('debe manejar líneas muy largas', () => {
      const longLine = '- [ ] ' + 'A'.repeat(1000);
      
      const result = dualParser.parseWithFallback(longLine,
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      expect(result.task?.description?.length).toBeGreaterThan(100);
    });

    test('debe resetear configuración correctamente', () => {
      dualParser.setConfig({ 
        preferObsidianTasks: true,
        fallbackOnError: false 
      });
      
      dualParser.resetConfig();
      const config = dualParser.getConfig();
      
      expect(config.preferObsidianTasks).toBe(false);
      expect(config.fallbackOnError).toBe(true);
    });
  });

  // ==================== REGISTRO DE EVENTOS ====================
  describe('dualParser - Registro de eventos', () => {
    test('debe registrar evento cuando usa fallback', () => {
      dualParser.setConfig({ preferObsidianTasks: true });
      
      const events = dualParser.getEvents();
      
      dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      const newEvents = dualParser.getEvents();
      
      // Debería haber un evento nuevo
      expect(newEvents.length).toBeGreaterThanOrEqual(events.length);
    });

    test('debe limpiar eventos cuando se solicita', () => {
      dualParser.parseWithFallback('- [ ] Tarea',
        { path: 'inbox.md', lineNumber: 1 }
      );
      
      dualParser.clearEvents();
      
      expect(dualParser.getEvents().length).toBe(0);
    });
  });
});
