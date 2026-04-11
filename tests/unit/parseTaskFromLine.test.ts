/**
 * UC-040: PARSEAR TASK CON OBSIDIAN-TASKS
 * 
 * TESTS FIRST (TDD RED)
 * 
 * Estos tests especifican QUÉ queremos que haga el parser.
 * Los tests DEFINEN la interfaz y el comportamiento esperado.
 * 
 * Convención de nombres:
 * ✅ camelCase con verb+Noun: parseTaskFromLine, validateParsedTask, parseMultipleLines
 * ✅ Archivos: parseTaskFromLine.test.ts
 * ✅ Describe bloques: describe('parseTaskFromLine', ...)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Mock/Stub para TaskLocation mientras no exista
 */
interface TaskLocation {
  path: string;
  lineNumber: number;
  precedingContent?: string;
}

/**
 * Mock/Stub para ParsedTaskResult mientras no exista
 */
interface ParsedTaskResult {
  success: boolean;
  task?: any;
  error?: string;
  warnings?: string[];
  metadata: {
    filePath?: string;
    lineNumber?: number;
    parsedAt: string;
    source: 'obsidian-tasks' | 'fallback';
  };
}

describe('UC-040: parseTaskFromLine - Parsing Basic', () => {
  let baseLocation: TaskLocation;

  beforeEach(() => {
    baseLocation = {
      path: 'inbox.md',
      lineNumber: 1,
      precedingContent: ''
    };
  });

  // ==================== PARSING SIMPLE ====================
  describe('parseTaskFromLine - Casos básicos', () => {
    test('debe parsear tarea simple sin propiedades extra', () => {
      // ARRANGE
      const line = '- [ ] Mi tarea simple';
      
      // ACT
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(
        line,
        baseLocation
      );

      // ASSERT
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task.description).toBe('Mi tarea simple');
      expect(result.task.status).toBe('TODO');
      expect(result.task.priority).toBe('MEDIA');
    });

    test('debe parsear tarea completada [x]', () => {
      const line = '- [x] Tarea completada';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe('DONE');
      expect(result.task.description).toBe('Tarea completada');
    });

    test('debe parsear tarea en progreso [/]', () => {
      const line = '- [/] Tarea en progreso';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe('IN_PROGRESS');
    });

    test('debe parsear tarea cancelada [-]', () => {
      const line = '- [-] Tarea cancelada';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.status).toBe('CANCELLED');
    });

    test('debe soportar asterisco (*) como marcador de lista', () => {
      const line = '* [x] Tarea con asterisco';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toBe('Tarea con asterisco');
    });

    test('debe soportar indentación', () => {
      const line = '  - [ ] Tarea indentada';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toBe('Tarea indentada');
    });
  });

  // ==================== EXTRACCIÓN DE PROPIEDADES ====================
  describe('parseTaskFromLine - Extracción de propiedades', () => {
    test('debe extraer fecha due (📅 YYYY-MM-DD)', () => {
      const line = '- [ ] Tarea 📅 2026-05-15';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.dueDate).toBe('2026-05-15');
    });

    test('debe extraer fecha scheduled (🗓️ YYYY-MM-DD)', () => {
      const line = '- [ ] Tarea 🗓️ 2026-04-20';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.scheduledDate).toBe('2026-04-20');
    });

    test('debe extraer prioridad alta (⏫)', () => {
      const line = '- [ ] Tarea urgente ⏫';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.priority).toBe('ALTA');
    });

    test('debe extraer prioridad baja (⏬)', () => {
      const line = '- [ ] Tarea sin urgencia ⏬';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.priority).toBe('BAJA');
    });

    test('debe extraer tags (#tag1 #tag2)', () => {
      const line = '- [ ] Tarea #work #importante #urgente';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.tags).toContain('work');
      expect(result.task.tags).toContain('importante');
      expect(result.task.tags).toContain('urgente');
      expect(result.task.tags).toHaveLength(3);
    });

    test('debe extraer block link (^block-id)', () => {
      const line = '- [ ] Tarea importante ^block-123';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.blockLink).toBe('^block-123');
    });

    test('debe parsear tarea COMPLEJA con múltiples propiedades', () => {
      const line = '- [x] Implementar API 📅 2026-05-15 🗓️ 2026-04-20 ⏫ #dev #api ^PROJ-001';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toBe('Implementar API');
      expect(result.task.status).toBe('DONE');
      expect(result.task.dueDate).toBe('2026-05-15');
      expect(result.task.scheduledDate).toBe('2026-04-20');
      expect(result.task.priority).toBe('ALTA');
      expect(result.task.tags).toContain('dev');
      expect(result.task.tags).toContain('api');
      expect(result.task.blockLink).toBe('^PROJ-001');
    });
  });

  // ==================== VALIDACIÓN ====================
  describe('parseTaskFromLine - Validación de input', () => {
    test('debe rechazar input vacío (empty string)', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine('', baseLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
    });

    test('debe rechazar null como input', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(null, baseLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe rechazar undefined como input', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(undefined, baseLocation);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('debe rechazar línea que NO es tarea (sin [ ])', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine('Texto normal sin tarea', baseLocation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('task');
    });

    test('debe rechazar línea que no comienza con - o *', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine('+ [ ] Tarea con +', baseLocation);

      expect(result.success).toBe(false);
    });

    test('debe trimear whitespace antes de procesar', () => {
      const line = '  \n  - [ ] Tarea con espacios  \n  ';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toBe('Tarea con espacios');
    });
  });

  // ==================== VALIDACIÓN DE TAREA PARSEADA ====================
  describe('validateParsedTask - Validación completa de tarea', () => {
    test('debe validar tarea correcta', () => {
      const task = {
        description: 'Test task',
        status: 'TODO',
        priority: 'MEDIA',
        tags: [],
        dueDate: null
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('debe detectar descripción vacía', () => {
      const task = {
        description: '',
        status: 'TODO',
        priority: 'MEDIA',
        tags: []
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('debe validar status válidos: TODO, IN_PROGRESS, DONE, CANCELLED', () => {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;

      validStatuses.forEach(status => {
        const task = {
          description: 'Test',
          status,
          priority: 'MEDIA',
          tags: []
        };

        const validation = validator(task);
        expect(validation.valid).toBe(true);
      });
    });

    test('debe rechazar status inválido', () => {
      const task = {
        description: 'Test',
        status: 'INVALID_STATUS',
        priority: 'MEDIA',
        tags: []
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('status');
    });

    test('debe validar formato de fecha YYYY-MM-DD', () => {
      const task = {
        description: 'Test',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '15/05/2026',
        tags: []
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('dueDate');
    });

    test('debe validar que tags es array', () => {
      const task = {
        description: 'Test',
        status: 'TODO',
        priority: 'MEDIA',
        tags: 'not-an-array'
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('array');
    });
  });

  // ==================== BATCH PARSING ====================
  describe('parseMultipleLines - Batch parsing', () => {
    test('debe parsear múltiples líneas correctamente', () => {
      const lines = [
        '- [ ] Tarea 1',
        '- [x] Tarea 2',
        '- [/] Tarea 3'
      ];

      const parser = require('../../src/services/task-parser/parseMultipleLines').parseMultipleLines;
      const results = parser(lines, baseLocation);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
    });

    test('debe actualizar lineNumber para cada línea', () => {
      const lines = [
        '- [ ] Tarea 1',
        '- [ ] Tarea 2',
        '- [ ] Tarea 3'
      ];

      const parser = require('../../src/services/task-parser/parseMultipleLines').parseMultipleLines;
      const results = parser(lines, baseLocation);

      expect(results[0].metadata.lineNumber).toBe(1);
      expect(results[1].metadata.lineNumber).toBe(2);
      expect(results[2].metadata.lineNumber).toBe(3);
    });

    test('debe manejar mezcla de líneas válidas e inválidas', () => {
      const lines = [
        '- [ ] Válida',
        'No es tarea',
        '- [x] Válida también'
      ];

      const parser = require('../../src/services/task-parser/parseMultipleLines').parseMultipleLines;
      const results = parser(lines, baseLocation);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  // ==================== METADATA ====================
  describe('ParsedTaskResult - Metadata correcta', () => {
    test('debe incluir metadata en resultado exitoso', () => {
      const line = '- [ ] Test';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.filePath).toBe('inbox.md');
      expect(result.metadata.lineNumber).toBe(1);
      expect(result.metadata.parsedAt).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
    });

    test('debe incluir metadata en resultado con error', () => {
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine('', baseLocation);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.filePath).toBe('inbox.md');
      expect(result.metadata.parsedAt).toBeDefined();
    });

    test('debe retornar timestamp válido (ISO 8601)', () => {
      const line = '- [ ] Test';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      const date = new Date(result.metadata.parsedAt);
      expect(date.getTime()).toBeTruthy();
      expect(date.toISOString()).toBeDefined();
    });
  });

  // ==================== EDGE CASES ====================
  describe('parseTaskFromLine - Edge cases', () => {
    test('debe manejar descripción muy larga (500+ caracteres)', () => {
      const longDescription = 'A'.repeat(500);
      const line = `- [ ] ${longDescription}`;
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toBe(longDescription);
    });

    test('debe manejar múltiples espacios entre propiedades', () => {
      const line = '- [ ]   Tarea   📅   2026-05-15   ⏫';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.dueDate).toBe('2026-05-15');
      expect(result.task.priority).toBe('ALTA');
    });

    test('debe manejar caracteres especiales en descripción', () => {
      const line = '- [ ] Tarea con "comillas" y \'apóstrofos\' & símbolos % $ @';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toContain('comillas');
    });

    test('debe manejar emojis en descripción (no como propiedades)', () => {
      const line = '- [ ] Tarea 🎉 con emoji 😀';
      const result = require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      expect(result.success).toBe(true);
      expect(result.task.description).toContain('emoji');
    });

    test('debe rechazar fechas inválidas en validación', () => {
      const task = {
        description: 'Test',
        status: 'TODO',
        priority: 'MEDIA',
        dueDate: '2026-13-45',
        tags: []
      };

      const validator = require('../../src/services/task-parser/validateParsedTask').validateParsedTask;
      const validation = validator(task);

      expect(validation.valid).toBe(false);
    });
  });

  // ==================== PERFORMANCE ====================
  describe('parseTaskFromLine - Performance', () => {
    test('debe parsear línea en menos de 5ms', () => {
      const line = '- [x] Tarea 📅 2026-05-15 ⏫ #tag1 #tag2 ^block-id';
      const startTime = performance.now();

      require('../../src/services/task-parser/parseTaskFromLine').parseTaskFromLine(line, baseLocation);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(5);
    });

    test('debe parsear 100 líneas en menos de 200ms', () => {
      const lines = Array(100).fill('- [ ] Tarea de prueba 📅 2026-05-15 ⏫ #test');
      const startTime = performance.now();

      require('../../src/services/task-parser/parseMultipleLines').parseMultipleLines(lines, baseLocation);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
  });
});
